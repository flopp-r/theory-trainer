import { describe, expect, it } from 'vitest'
import { CLEF_NAMES, type ClefName, type Pitch } from '../theory'
import { earCadenceGenerator, earChordQualityGenerator, earIntervalGenerator, earInversionGenerator } from './ear'
import { chordAudio, intervalAudio, cadenceAudio } from './earAudio'
import { LETTER_PC, MAJOR_SCALES, NATURAL_MINOR_SCALES, ascii, pc } from './handTables'
import { createRng } from './rng'
import { choicesOf } from './testing'
import type { Difficulty, Question } from './types'

const ctx = (seed: number, difficulty: Difficulty, clefs: readonly ClefName[] = CLEF_NAMES) => ({ rng: createRng(seed), clefs, difficulty, maxLedgerLines: 1 })
const many = (g: { generate: (c: ReturnType<typeof ctx>) => Question }, count: number, difficulty: Difficulty, clefs?: readonly ClefName[]) =>
  Array.from({ length: count }, (_, i) => g.generate(ctx(i + 37 * difficulty, difficulty, clefs)))

const midi = (p: Pitch) => 12 * (p.octave + 1) + LETTER_PC[p.letter]! + p.accidental
const ORDER = 'CDEFGAB'

/** The notes written on the reveal staff, as MIDI numbers, in the order they are written. */
function writtenMidis(q: Question): number[][] {
  return q.reveal!.staves[0]!.items.map((i) => (i.kind === 'notes' ? i.pitches.map(midi).sort((a, b) => a - b) : []))
}

describe('what you hear is what is written', () => {
  it('for every ear question the notes played are exactly the notes shown afterwards, in every clef', () => {
    for (const g of [earChordQualityGenerator, earIntervalGenerator, earCadenceGenerator, earInversionGenerator]) {
      for (const level of [1, 2, 3] as const) {
        for (const q of many(g, 150, level)) {
          const heard = q.audio!.events.map((e) => [...e.midi].sort((a, b) => a - b))
          const written = writtenMidis(q)
          if (q.type === 'ear-cadence') {
            // the key chord is heard first but not written; then the two cadence chords
            expect(heard.slice(1), q.id).toEqual(written)
            expect(heard).toHaveLength(3)
          } else if (q.type === 'ear-interval') {
            const writtenFlat = written.flat()
            const heardFlat = heard.flat()
            expect(heardFlat, q.id).toEqual(writtenFlat)
          } else {
            // chords: the final (whole) chord is the written chord
            expect(heard.at(-1), q.id).toEqual(written[0])
          }
        }
      }
    }
  })

  it('every note is in a range a phone speaker can play and an ear can hear (E2 to E6)', () => {
    for (const g of [earChordQualityGenerator, earIntervalGenerator, earCadenceGenerator, earInversionGenerator]) {
      for (const level of [1, 2, 3] as const) {
        for (const q of many(g, 300, level)) {
          for (const e of q.audio!.events) for (const m of e.midi) {
            expect(m, q.id).toBeGreaterThanOrEqual(40)
            expect(m, q.id).toBeLessThanOrEqual(88)
          }
        }
      }
    }
  })
})

describe('ear-chord-quality', () => {
  // Hand-written shapes: semitones above the root.
  const SHAPE: Record<string, number[]> = {
    major: [0, 4, 7], minor: [0, 3, 7], diminished: [0, 3, 6], augmented: [0, 4, 8],
    'dominant 7th': [0, 4, 7, 10], 'major 7th': [0, 4, 7, 11], 'minor 7th': [0, 3, 7, 10],
  }
  /** True if the notes, taken from some root, make the chord shape. */
  const isChordOfShape = (notes: number[], shape: number[]) =>
    notes.some((root) => [...new Set(notes.map((m) => (((m - root) % 12) + 12) % 12))].sort((a, b) => a - b).join() === shape.join())

  it('the sound is a chord of the type given as the answer, checked by hand-written shapes', () => {
    for (const level of [1, 2, 3] as const) {
      for (const q of many(earChordQualityGenerator, 300, level)) {
        const final = q.audio!.events.at(-1)!.midi
        expect(isChordOfShape([...final], SHAPE[q.correct]!), `${q.id} ${final}`).toBe(true)
        // and it is not also the shape of a different chord type (the answer is unambiguous)
        for (const [name, shape] of Object.entries(SHAPE)) {
          if (name !== q.correct && shape.length === SHAPE[q.correct]!.length) expect(isChordOfShape([...final], shape), `${q.id}: also ${name}`).toBe(false)
        }
      }
    }
  })

  it('level 1 major and minor with all notes together; level 2 adds diminished, augmented and broken chords; level 3 sevenths and inversions', () => {
    const answers = (level: Difficulty) => new Set(many(earChordQualityGenerator, 400, level).map((q) => q.correct))
    expect([...answers(1)].sort()).toEqual(['major', 'minor'])
    expect([...answers(2)].sort()).toEqual(['augmented', 'diminished', 'major', 'minor'])
    expect([...answers(3)].sort()).toEqual(['augmented', 'diminished', 'dominant 7th', 'major', 'major 7th', 'minor', 'minor 7th'])
    expect(many(earChordQualityGenerator, 200, 1).every((q) => q.audio!.events.length === 1)).toBe(true)
    expect(many(earChordQualityGenerator, 200, 2).some((q) => q.audio!.events.length > 1)).toBe(true)
    // level 2 chords are in root position: the lowest note is the root, so for major the lowest-note pattern is 0-4-7
    for (const q of many(earChordQualityGenerator, 200, 2)) {
      const notes = [...q.audio!.events.at(-1)!.midi].sort((a, b) => a - b)
      expect(notes[1]! - notes[0]! === 4 || notes[1]! - notes[0]! === 3).toBe(true)
    }
  })

  it('the chord changes register and root from question to question', () => {
    const lowest = new Set(many(earChordQualityGenerator, 200, 2).map((q) => Math.min(...q.audio!.events.at(-1)!.midi)))
    expect(lowest.size).toBeGreaterThan(10)
  })

  it('ids depend only on the chord type, so statistics follow the skill', () => {
    for (const q of many(earChordQualityGenerator, 100, 3)) expect(q.id).toMatch(/^ear-chord-quality:(major|minor|diminished|augmented|dominant7|major7|minor7)$/)
  })
})

describe('ear-interval', () => {
  const SEMIS: Record<string, number> = {
    'minor 2nd': 1, 'major 2nd': 2, 'minor 3rd': 3, 'major 3rd': 4, 'perfect 4th': 5, tritone: 6, 'perfect 5th': 7,
    'minor 6th': 8, 'major 6th': 9, 'minor 7th': 10, 'major 7th': 11, 'perfect octave': 12,
  }

  it('the gap between the two notes played matches the answer, and the direction matches the prompt', () => {
    for (const level of [1, 2, 3] as const) {
      for (const q of many(earIntervalGenerator, 300, level)) {
        const events = q.audio!.events
        const mode = q.id.split(':')[1]
        if (mode === 'together') {
          expect(events).toHaveLength(1)
          const [a, b] = [...events[0]!.midi].sort((x, y) => x - y)
          expect(b! - a!, q.id).toBe(SEMIS[q.correct])
          expect(q.prompt).toContain('together')
        } else {
          expect(events).toHaveLength(2)
          const [first, second] = [events[0]!.midi[0]!, events[1]!.midi[0]!]
          expect(Math.abs(second - first), q.id).toBe(SEMIS[q.correct])
          expect(mode === 'up' ? second > first : second < first, q.id).toBe(true)
          expect(q.prompt).toContain(mode === 'up' ? 'going up' : 'going down')
          expect(events[1]!.start).toBeGreaterThan(events[0]!.start)
        }
      }
    }
  })

  it('level 1: minor 3rd, major 3rd, perfect 4th, perfect 5th, octave; up or together only', () => {
    const qs = many(earIntervalGenerator, 400, 1)
    expect(new Set(qs.map((q) => q.correct))).toEqual(new Set(['minor 3rd', 'major 3rd', 'perfect 4th', 'perfect 5th', 'perfect octave']))
    expect(new Set(qs.map((q) => q.id.split(':')[1]))).toEqual(new Set(['up', 'together']))
  })

  it('level 2 uses all the intervals up to the octave and all three ways of playing them; the tritone comes at level 3', () => {
    const l2 = many(earIntervalGenerator, 600, 2)
    expect(new Set(l2.map((q) => q.correct)).size).toBe(11)
    expect(l2.some((q) => q.correct === 'tritone')).toBe(false)
    expect(new Set(l2.map((q) => q.id.split(':')[1]))).toEqual(new Set(['up', 'down', 'together']))
    expect(many(earIntervalGenerator, 800, 3).some((q) => q.correct === 'tritone')).toBe(true)
  })

  it('wrong answers include intervals a semitone or two away (they sound alike)', () => {
    for (const q of many(earIntervalGenerator, 200, 2)) {
      const answers = choicesOf(q).map((c) => SEMIS[c.label]!)
      const target = SEMIS[q.correct]!
      expect(answers.some((s) => s !== target && Math.abs(s - target) <= 2), q.id).toBe(true)
    }
  })

  it('the explanation names both notes with their octaves', () => {
    for (const q of many(earIntervalGenerator, 100, 2)) expect(q.explanation).toMatch(/^You heard [A-G][♯♭]?\d and [A-G][♯♭]?\d/)
  })

  it('the choices keep the same order every time (smallest to largest) so they can be learned', () => {
    for (const q of many(earIntervalGenerator, 100, 2)) {
      const semis = choicesOf(q).map((c) => SEMIS[c.label]!)
      expect([...semis].sort((a, b) => a - b)).toEqual(semis)
    }
  })
})

describe('ear-cadence', () => {
  /** Root name and shape of a chord from its lowest note, using the key's hand-written scale. */
  function chordByHand(keyName: string, notes: number[]) {
    const [tonic, mode] = ascii(keyName).split(' ')
    const scale = (mode === 'major' ? MAJOR_SCALES : NATURAL_MINOR_SCALES)[tonic!]!.split(' ')
    const root = [...notes].sort((a, b) => a - b)[0]!
    const degree = scale.findIndex((n) => pc(n) === ((root % 12) + 12) % 12)
    const shape = [...notes].sort((a, b) => a - b).slice(1).map((m) => m - root).join('-')
    return { degree, shape, minor: mode === 'minor' }
  }

  it('the answer is worked out by hand from the chords that were played', () => {
    for (const level of [1, 2, 3] as const) {
      for (const q of many(earCadenceGenerator, 300, level)) {
        const keyName = /In (.+?) you heard/.exec(q.explanation)![1]!
        const events = q.audio!.events
        const key = chordByHand(keyName, [...events[0]!.midi])
        const a = chordByHand(keyName, [...events[1]!.midi])
        const b = chordByHand(keyName, [...events[2]!.midi])
        // the key chord is the tonic: degree 0, major or minor to match the key
        expect(key.degree).toBe(0)
        expect(key.shape).toBe(key.minor ? '3-7' : '4-7')
        const isV = (c: { degree: number; shape: string }) => c.degree === 4 && (c.shape === '4-7' || c.shape === '4-7-10')
        const isTonic = (c: { degree: number; shape: string }) => c.degree === 0 && c.shape === (key.minor ? '3-7' : '4-7')
        let expected: string | null = null
        if (isV(a) && isTonic(b)) expected = 'perfect'
        else if (isV(a) && b.degree === 5) expected = 'interrupted'
        else if (a.degree === 3 && isTonic(b)) expected = 'plagal'
        else if (isV(b)) expected = 'imperfect'
        expect(q.correct, `${q.id} in ${keyName}`).toBe(expected)
      }
    }
  })

  it('plays the key chord first, then a clear pause, then the two chords', () => {
    for (const q of many(earCadenceGenerator, 50, 2)) {
      const [k, a, b] = q.audio!.events
      expect(k!.start).toBe(0)
      expect(a!.start).toBeGreaterThan(k!.start + k!.duration)
      expect(b!.start).toBeGreaterThanOrEqual(a!.start + a!.duration)
    }
  })

  it('level 1 is major keys only; minor keys from level 2', () => {
    expect(many(earCadenceGenerator, 200, 1).every((q) => /In [A-G][♯♭]? major/.test(q.explanation))).toBe(true)
    expect(many(earCadenceGenerator, 300, 2).some((q) => /In [A-G][♯♭]? minor/.test(q.explanation))).toBe(true)
  })
})

describe('ear-inversion', () => {
  /** Works out the inversion from the written notes: the root is the note with the others a third and fifth (and seventh) of letter-names above it. */
  function inversionByHand(q: Question): number {
    const pitches = q.reveal!.staves[0]!.items[0]!
    if (pitches.kind !== 'notes') throw new Error('expected a chord')
    const notes = [...pitches.pitches].sort((a, b) => midi(a) - midi(b))
    const letters = notes.map((p) => ORDER.indexOf(p.letter))
    const rootIndex = notes.findIndex((_, i) => {
      const offsets = letters.map((l) => (l - letters[i]! + 7) % 7).sort((a, b) => a - b)
      return offsets.join() === [0, 2, 4].slice(0, notes.length).join() || offsets.join() === [0, 2, 4, 6].join()
    })
    const root = letters[rootIndex]!
    const lowest = letters[0]!
    return [0, 2, 4, 6].indexOf((lowest - root + 7) % 7)
  }

  it('the answer is the position of the lowest note in the chord, found from the spelling', () => {
    for (const level of [1, 2, 3] as const) {
      for (const q of many(earInversionGenerator, 300, level)) {
        const names = ['root position', 'first inversion', 'second inversion', 'third inversion']
        expect(q.correct, q.id).toBe(names[inversionByHand(q)])
        expect(Number(q.id.split(':').at(-1))).toBe(inversionByHand(q))
      }
    }
  })

  it('triads at levels 1 and 2, seventh chords with third inversion at level 3', () => {
    expect(many(earInversionGenerator, 200, 2).every((q) => q.id.includes(':triad:'))).toBe(true)
    expect(choicesOf(earInversionGenerator.generate(ctx(1, 1))).map((c) => c.id)).toHaveLength(3)
    const l3 = many(earInversionGenerator, 300, 3)
    expect(l3.every((q) => q.id.includes(':seventh:'))).toBe(true)
    expect(l3.some((q) => q.correct === 'third inversion')).toBe(true)
  })

  it('covers every inversion', () => {
    expect(new Set(many(earInversionGenerator, 200, 2).map((q) => q.correct)).size).toBe(3)
  })
})

describe('audio builders', () => {
  const p = (letter: string, octave: number, accidental = 0): Pitch => ({ letter: letter as Pitch['letter'], accidental, octave })
  it('a block chord is one event with the notes lowest first', () => {
    const spec = chordAudio([p('G', 4), p('C', 4), p('E', 4)], 'block')
    expect(spec.events).toEqual([{ midi: [60, 64, 67], start: 0, duration: 2.2 }])
  })

  it('a broken chord plays the notes upwards one by one, then all together', () => {
    const spec = chordAudio([p('C', 4), p('E', 4), p('G', 4)], 'broken')
    expect(spec.events.map((e) => e.midi)).toEqual([[60], [64], [67], [60, 64, 67]])
    const starts = spec.events.map((e) => e.start)
    expect([...starts].sort((a, b) => a - b)).toEqual(starts)
    expect(spec.events[3]!.start).toBeGreaterThan(spec.events[2]!.start + 0.4)
  })

  it('intervals: up, down and together', () => {
    const low = p('C', 4)
    const high = p('G', 4)
    expect(intervalAudio(low, high, 'up').events.map((e) => e.midi)).toEqual([[60], [67]])
    expect(intervalAudio(low, high, 'down').events.map((e) => e.midi)).toEqual([[67], [60]])
    expect(intervalAudio(low, high, 'together').events).toHaveLength(1)
    expect(intervalAudio(low, high, 'together').events[0]!.midi).toEqual([60, 67])
  })

  it('cadences: three events in order with gaps', () => {
    const spec = cadenceAudio([p('C', 3), p('E', 3), p('G', 3)], [p('G', 3), p('B', 3), p('D', 4)], [p('C', 3), p('E', 3), p('G', 3)])
    expect(spec.events).toHaveLength(3)
    expect(spec.events[0]!.midi).toEqual([48, 52, 55])
  })
})
