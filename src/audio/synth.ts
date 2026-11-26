import { midiToFrequency } from './frequency'
import type { AudioSpec } from './types'
import { specDuration } from './types'

/**
 * Strength of each harmonic of the tone (1st, 2nd, 3rd ...). A pure sine is dull and a lot of harmonics is harsh;
 * this gives a soft, slightly bell-like tone that is easy to tell chord notes apart in.
 */
export const HARMONICS: readonly number[] = [1, 0.42, 0.22, 0.1, 0.05]

/** Seconds for the sound to rise from silence (avoids a click). */
export const ATTACK = 0.012
/** After the attack the note fades towards this fraction of its peak while held. */
export const SUSTAIN_LEVEL = 0.4
/** Time constant (seconds) of that fade. */
export const DECAY = 0.7
/** Time constant (seconds) of the fade after the note ends. */
export const RELEASE = 0.09

/** How loud one note of a chord of `count` notes is, so that chords never get louder than the loudest allowed. */
export function noteGain(velocity: number, count: number): number {
  return (velocity * 0.7) / Math.max(2, count)
}

/**
 * Schedules every event of `spec` on an audio context, starting at `startAt` (in the context's own seconds).
 * Works on a live context and on an offline one (used to measure the sound in tests).
 * Returns the time at which everything has gone quiet.
 */
export function scheduleSpec(ctx: BaseAudioContext, destination: AudioNode, spec: AudioSpec, startAt: number): number {
  const real = new Float32Array(HARMONICS.length + 1)
  const imag = new Float32Array(HARMONICS.length + 1)
  HARMONICS.forEach((h, i) => {
    imag[i + 1] = h
  })
  const wave = ctx.createPeriodicWave(real, imag)

  for (const event of spec.events) {
    const begin = startAt + event.start
    const end = begin + event.duration
    const peak = noteGain(event.velocity ?? 0.8, event.midi.length)
    for (const midi of event.midi) {
      const osc = ctx.createOscillator()
      osc.setPeriodicWave(wave)
      osc.frequency.value = midiToFrequency(midi)
      const gain = ctx.createGain()
      gain.gain.setValueAtTime(0, begin)
      gain.gain.linearRampToValueAtTime(peak, begin + ATTACK)
      gain.gain.setTargetAtTime(peak * SUSTAIN_LEVEL, begin + ATTACK, DECAY)
      // Fade out from wherever the level is when the note ends (the browser continues from the current curve).
      gain.gain.setTargetAtTime(0, end, RELEASE)
      osc.connect(gain)
      gain.connect(destination)
      osc.start(begin)
      osc.stop(end + RELEASE * 8)
    }
  }
  return startAt + specDuration(spec) + RELEASE * 8
}
