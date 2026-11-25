import { describe, expect, it } from 'vitest'
import { LETTERS, type NoteName, formatNote, formatPitch, letterIndex, midiNumber, note, parseNote, parsePitch, pitchClass } from './pitch'
import { SCALE_INTERVALS, type ScaleType, scaleDegreeName, scaleNotes, scalePitches } from './scale'

const spell = (tonic: string, type: ScaleType) => scaleNotes(parseNote(tonic), type).map((n) => formatNote(n)).join(' ')

describe('major scales: all 15 standard keys, written out by hand', () => {
  it.each([
    ['C', 'C D E F G A B'],
    ['G', 'G A B C D E F#'],
    ['D', 'D E F# G A B C#'],
    ['A', 'A B C# D E F# G#'],
    ['E', 'E F# G# A B C# D#'],
    ['B', 'B C# D# E F# G# A#'],
    ['F#', 'F# G# A# B C# D# E#'],
    ['C#', 'C# D# E# F# G# A# B#'],
    ['F', 'F G A Bb C D E'],
    ['Bb', 'Bb C D Eb F G A'],
    ['Eb', 'Eb F G Ab Bb C D'],
    ['Ab', 'Ab Bb C Db Eb F G'],
    ['Db', 'Db Eb F Gb Ab Bb C'],
    ['Gb', 'Gb Ab Bb Cb Db Eb F'],
    ['Cb', 'Cb Db Eb Fb Gb Ab Bb'],
  ])('%s major', (tonic, expected) => {
    expect(spell(tonic, 'major')).toBe(expected)
  })
})

describe('natural minor scales: all 15 standard keys', () => {
  it.each([
    ['A', 'A B C D E F G'],
    ['E', 'E F# G A B C D'],
    ['B', 'B C# D E F# G A'],
    ['F#', 'F# G# A B C# D E'],
    ['C#', 'C# D# E F# G# A B'],
    ['G#', 'G# A# B C# D# E F#'],
    ['D#', 'D# E# F# G# A# B C#'],
    ['A#', 'A# B# C# D# E# F# G#'],
    ['D', 'D E F G A Bb C'],
    ['G', 'G A Bb C D Eb F'],
    ['C', 'C D Eb F G Ab Bb'],
    ['F', 'F G Ab Bb C Db Eb'],
    ['Bb', 'Bb C Db Eb F Gb Ab'],
    ['Eb', 'Eb F Gb Ab Bb Cb Db'],
    ['Ab', 'Ab Bb Cb Db Eb Fb Gb'],
  ])('%s natural minor', (tonic, expected) => {
    expect(spell(tonic, 'natural-minor')).toBe(expected)
  })
})

describe('harmonic and melodic minor', () => {
  it.each([
    ['A', 'A B C D E F G#'],
    ['C', 'C D Eb F G Ab B'],
    ['E', 'E F# G A B C D#'],
    ['D', 'D E F G A Bb C#'],
    ['G#', 'G# A# B C# D# E F##'],
    ['Eb', 'Eb F Gb Ab Bb Cb D'],
  ])('%s harmonic minor', (tonic, expected) => {
    expect(spell(tonic, 'harmonic-minor')).toBe(expected)
  })

  it.each([
    ['A', 'A B C D E F# G#'],
    ['C', 'C D Eb F G A B'],
    ['D', 'D E F G A B C#'],
    ['G#', 'G# A# B C# D# E# F##'],
  ])('%s melodic minor (ascending)', (tonic, expected) => {
    expect(spell(tonic, 'melodic-minor')).toBe(expected)
  })

  it('melodic minor comes down as natural minor', () => {
    const down = scalePitches(parsePitch('A4'), 'melodic-minor', { descending: true }).map((p) => formatPitch(p))
    expect(down).toEqual(['A5', 'G5', 'F5', 'E5', 'D5', 'C5', 'B4', 'A4'])
    const up = scalePitches(parsePitch('A4'), 'melodic-minor').map((p) => formatPitch(p))
    expect(up).toEqual(['A4', 'B4', 'C5', 'D5', 'E5', 'F#5', 'G#5', 'A5'])
  })
})

describe('pentatonic and blues', () => {
  it.each([
    ['C', 'C D E G A'],
    ['G', 'G A B D E'],
    ['F', 'F G A C D'],
    ['D', 'D E F# A B'],
    ['Bb', 'Bb C D F G'],
  ])('%s major pentatonic', (tonic, expected) => {
    expect(spell(tonic, 'major-pentatonic')).toBe(expected)
  })

  it.each([
    ['A', 'A C D E G'],
    ['E', 'E G A B D'],
    ['D', 'D F G A C'],
    ['F#', 'F# A B C# E'],
  ])('%s minor pentatonic', (tonic, expected) => {
    expect(spell(tonic, 'minor-pentatonic')).toBe(expected)
  })

  it.each([
    ['A', 'A C D Eb E G'],
    ['C', 'C Eb F Gb G Bb'],
    ['E', 'E G A Bb B D'],
    ['G', 'G Bb C Db D F'],
  ])('%s blues', (tonic, expected) => {
    expect(spell(tonic, 'blues')).toBe(expected)
  })
})

/** Semitone steps between neighbouring notes, including the step back up to the tonic. */
const STEP_PATTERNS: Partial<Record<ScaleType, number[]>> = {
  major: [2, 2, 1, 2, 2, 2, 1],
  'natural-minor': [2, 1, 2, 2, 1, 2, 2],
  'harmonic-minor': [2, 1, 2, 2, 1, 3, 1],
  'melodic-minor': [2, 1, 2, 2, 2, 2, 1],
  'major-pentatonic': [2, 2, 3, 2, 3],
  'minor-pentatonic': [3, 2, 2, 3, 2],
  blues: [3, 2, 1, 1, 3, 2],
}

describe('every tonic: independent checks on the sound and the spelling', () => {
  const tonics: NoteName[] = LETTERS.flatMap((letter) => [-1, 0, 1].map((accidental) => note(letter, accidental)))
  const types = Object.keys(SCALE_INTERVALS) as ScaleType[]

  it('has the right semitone steps (checked with MIDI numbers, not intervals)', () => {
    for (const tonic of tonics) {
      for (const type of types) {
        const pitches = scalePitches({ ...tonic, octave: 4 }, type)
        const steps = pitches.slice(1).map((p, i) => midiNumber(p) - midiNumber(pitches[i]!))
        expect(steps, `${formatNote(tonic)} ${type}`).toEqual(STEP_PATTERNS[type])
      }
    }
  })

  it('seven-note scales use each letter name exactly once, in order', () => {
    const sevenNote: ScaleType[] = ['major', 'natural-minor', 'harmonic-minor', 'melodic-minor']
    for (const tonic of tonics) {
      for (const type of sevenNote) {
        const letters = scaleNotes(tonic, type).map((n) => letterIndex(n.letter))
        const expected = [0, 1, 2, 3, 4, 5, 6].map((i) => (letterIndex(tonic.letter) + i) % 7)
        expect(letters, `${formatNote(tonic)} ${type}`).toEqual(expected)
      }
    }
  })

  it('major and natural minor from the same tonic share the expected pitch classes', () => {
    for (const tonic of tonics) {
      const major = scaleNotes(tonic, 'major').map(pitchClass)
      const minor = scaleNotes(tonic, 'natural-minor').map(pitchClass)
      // degrees 1, 2, 4, 5 are the same; 3, 6, 7 are a semitone lower in minor
      for (const degree of [0, 1, 3, 4]) expect(minor[degree]).toBe(major[degree])
      for (const degree of [2, 5, 6]) expect((major[degree]! - minor[degree]! + 12) % 12).toBe(1)
    }
  })
})

describe('scalePitches', () => {
  it('spans octaves with and without the top note', () => {
    const two = scalePitches(parsePitch('G3'), 'major', { octaves: 2 }).map((p) => formatPitch(p))
    expect(two).toEqual(['G3', 'A3', 'B3', 'C4', 'D4', 'E4', 'F#4', 'G4', 'A4', 'B4', 'C5', 'D5', 'E5', 'F#5', 'G5'])
    const open = scalePitches(parsePitch('G3'), 'major', { includeTop: false }).map((p) => formatPitch(p))
    expect(open).toEqual(['G3', 'A3', 'B3', 'C4', 'D4', 'E4', 'F#4'])
  })

  it('crosses the B/C octave boundary correctly', () => {
    const f = scalePitches(parsePitch('A3'), 'major').map((p) => formatPitch(p))
    expect(f).toEqual(['A3', 'B3', 'C#4', 'D4', 'E4', 'F#4', 'G#4', 'A4'])
  })

  it('rejects bad octave counts', () => {
    expect(() => scalePitches(parsePitch('C4'), 'major', { octaves: 0 })).toThrow(RangeError)
  })
})

describe('scaleDegreeName', () => {
  it('names the seven degrees', () => {
    const names = [1, 2, 3, 4, 5, 6, 7].map((d) => scaleDegreeName('major', d))
    expect(names).toEqual(['tonic', 'supertonic', 'mediant', 'subdominant', 'dominant', 'submediant', 'leading note'])
  })

  it('the 7th is the subtonic in natural minor, the leading note otherwise', () => {
    expect(scaleDegreeName('natural-minor', 7)).toBe('subtonic')
    expect(scaleDegreeName('harmonic-minor', 7)).toBe('leading note')
    expect(scaleDegreeName('melodic-minor', 7)).toBe('leading note')
  })

  it('rejects out-of-range degrees and pentatonic scales', () => {
    expect(() => scaleDegreeName('major', 0)).toThrow(RangeError)
    expect(() => scaleDegreeName('major', 8)).toThrow(RangeError)
    expect(() => scaleDegreeName('blues', 3)).toThrow(RangeError)
  })
})
