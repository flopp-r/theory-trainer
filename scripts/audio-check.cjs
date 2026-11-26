// Measures the sound the synth makes, by rendering it to numbers in a real browser and analysing them.
// Needs Playwright (npm i -D playwright) and a running dev server: `npm run dev -- --port 5199`.
// Run: node scripts/audio-check.cjs
const { chromium } = require('playwright')

const PORT = process.env.PORT || 5199

async function main() {
  const browser = await chromium.launch()
  const page = await browser.newPage()
  await page.goto(`http://localhost:${PORT}/`)
  const results = await page.evaluate(async () => {
    const { scheduleSpec, RELEASE } = await import('/src/audio/synth.ts')
    const { midiToFrequency } = await import('/src/audio/frequency.ts')
    const { specDuration } = await import('/src/audio/types.ts')
    const SR = 22050

    async function render(spec) {
      const length = Math.ceil((specDuration(spec) + 1.5) * SR)
      const ctx = new OfflineAudioContext(1, length, SR)
      scheduleSpec(ctx, ctx.destination, spec, 0)
      return (await ctx.startRendering()).getChannelData(0)
    }

    /** Signal strength at one frequency over a time window (Goertzel). */
    function power(data, freq, from, to) {
      const a = Math.floor(from * SR), b = Math.min(data.length, Math.floor(to * SR))
      const w = (2 * Math.PI * freq) / SR, c = 2 * Math.cos(w)
      let s1 = 0, s2 = 0
      for (let i = a; i < b; i++) { const s = data[i] + c * s1 - s2; s2 = s1; s1 = s }
      return (s1 * s1 + s2 * s2 - c * s1 * s2) / ((b - a) * (b - a))
    }

    /** The frequency near `target` (within 4%) with the most energy. */
    function peakNear(data, target, from, to) {
      let best = target, bestPower = -1
      for (let f = target * 0.96; f <= target * 1.04; f += target * 0.0005) {
        const p = power(data, f, from, to)
        if (p > bestPower) { bestPower = p; best = f }
      }
      return best
    }

    const out = []
    const check = (name, ok, detail) => out.push({ name, ok, detail })

    // 1. Every note from C2 to C7 comes out at the right frequency (within 0.3%).
    {
      let worst = 0
      for (let midi = 36; midi <= 96; midi += 1) {
        const data = await render({ events: [{ midi: [midi], start: 0, duration: 1 }] })
        const expected = midiToFrequency(midi)
        const found = peakNear(data, expected, 0.1, 0.9)
        worst = Math.max(worst, Math.abs(found / expected - 1))
      }
      check('single notes C2-C7 are at the right pitch', worst < 0.003, `worst error ${(worst * 100).toFixed(3)}%`)
    }

    // 2. Chords: each note is present, and nothing clips.
    const chords = {
      'C major': [60, 64, 67], 'C minor 7': [48, 63, 67, 70], 'B dim7': [47, 50, 53, 56], 'wide 6 notes': [36, 48, 55, 64, 72, 79],
    }
    for (const [name, notes] of Object.entries(chords)) {
      const data = await render({ events: [{ midi: notes, start: 0, duration: 1.5 }] })
      let peak = 0
      for (const x of data) peak = Math.max(peak, Math.abs(x))
      check(`${name}: not clipping and audible`, peak < 0.95 && peak > 0.05, `peak ${peak.toFixed(3)}`)
      let worst = 0
      for (const m of notes) {
        const f = midiToFrequency(m)
        worst = Math.max(worst, Math.abs(peakNear(data, f, 0.2, 1.2) / f - 1))
      }
      check(`${name}: every note is at its pitch`, worst < 0.004, `worst error ${(worst * 100).toFixed(3)}%`)
    }

    // 3. Timing: a second note is silent before it starts and loud after.
    {
      const spec = { events: [{ midi: [60], start: 0, duration: 0.5 }, { midi: [67], start: 1, duration: 0.5 }] }
      const data = await render(spec)
      const f = midiToFrequency(67)
      const before = power(data, f, 0.3, 0.9), after = power(data, f, 1.1, 1.4)
      check('a later note does not sound before its start time', after > before * 1000, `after/before = ${(after / (before + 1e-30)).toExponential(2)}`)
    }

    // 4. No click at the start, and silence after the end.
    {
      const spec = { events: [{ midi: [60, 64, 67], start: 0, duration: 0.8 }] }
      const data = await render(spec)
      check('starts from silence (no click)', Math.abs(data[0]) < 1e-4 && Math.abs(data[3]) < 0.01, `first samples ${data[0].toFixed(5)}, ${data[3].toFixed(5)}`)
      const tailFrom = Math.floor((0.8 + RELEASE * 12) * SR)
      let rms = 0
      for (let i = tailFrom; i < data.length; i++) rms += data[i] * data[i]
      rms = Math.sqrt(rms / (data.length - tailFrom))
      check('silent after the notes end', rms < 1e-4, `rms after end ${rms.toExponential(2)}`)
      // A click is a jump much bigger than the signal's normal slope: compare the release with the sound just before it.
      const step = (from, to) => {
        let m = 0
        for (let i = Math.floor(from * SR) + 1; i < Math.floor(to * SR); i++) m = Math.max(m, Math.abs(data[i] - data[i - 1]))
        return m
      }
      const before = step(0.5, 0.78), during = step(0.8, 0.95)
      check('no click when a note ends', during <= before * 1.1, `largest step before the end ${before.toFixed(4)}, during the fade ${during.toFixed(4)}`)
    }

    // 5. A held note fades but stays audible (so a 2-second chord is not dead by the end).
    {
      const data = await render({ events: [{ midi: [60], start: 0, duration: 2 }] })
      const early = power(data, midiToFrequency(60), 0.1, 0.3), late = power(data, midiToFrequency(60), 1.6, 1.9)
      check('held note fades but is still there', late > early * 0.05 && late < early, `late/early power ${(late / early).toFixed(3)}`)
    }
    return out
  })
  let failed = 0
  for (const r of results) {
    console.log(`${r.ok ? 'PASS' : 'FAIL'}  ${r.name}  (${r.detail})`)
    if (!r.ok) failed++
  }
  await browser.close()
  if (failed) process.exit(1)
}
main()
