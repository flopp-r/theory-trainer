import { describe, expect, it } from 'vitest'
import {
  type Interval,
  type IntervalQuality,
  intervalBetween,
  intervalName,
  intervalSemitones,
  intervalShortName,
  interval,
  invertInterval,
  parseInterval,
  transpose,
  transposeNote,
} from './interval'
import { LETTERS, formatNote, formatPitch, midiNumber, parseNote, parsePitch } from './pitch'

const P = parsePitch
const between = (a: string, b: string) => {
  const r = intervalBetween(P(a), P(b))
  return `${intervalShortName(r.interval)} ${r.direction}`
}

describe('intervalBetween: known answers from C4', () => {
  it.each([
    ['C4', 'P1 up'],
    ['C#4', 'A1 up'],
    ['Db4', 'm2 up'],
    ['D4', 'M2 up'],
    ['D#4', 'A2 up'],
    ['Ebb4', 'd3 up'],
    ['Eb4', 'm3 up'],
    ['E4', 'M3 up'],
    ['E#4', 'A3 up'],
    ['Fb4', 'd4 up'],
    ['F4', 'P4 up'],
    ['F#4', 'A4 up'],
    ['Gb4', 'd5 up'],
    ['G4', 'P5 up'],
    ['G#4', 'A5 up'],
    ['Ab4', 'm6 up'],
    ['A4', 'M6 up'],
    ['A#4', 'A6 up'],
    ['Bbb4', 'd7 up'],
    ['Bb4', 'm7 up'],
    ['B4', 'M7 up'],
    ['B#4', 'A7 up'],
    ['Cb5', 'd8 up'],
    ['C5', 'P8 up'],
    ['C#5', 'A8 up'],
    ['D5', 'M9 up'],
    ['Eb5', 'm10 up'],
    ['G5', 'P12 up'],
    ['C6', 'P15 up'],
  ])('C4 to %s is %s', (to, expected) => {
    expect(between('C4', to)).toBe(expected)
  })

  it('spelling decides the answer, not just the sound', () => {
    // F#4 and Gb4 sound the same above C4 but are different intervals.
    expect(between('C4', 'F#4')).toBe('A4 up')
    expect(between('C4', 'Gb4')).toBe('d5 up')
    expect(between('B3', 'F4')).toBe('d5 up')
    expect(between('F3', 'B3')).toBe('A4 up')
  })

  it('finds descending intervals', () => {
    expect(between('E4', 'C4')).toBe('M3 down')
    expect(between('C5', 'C4')).toBe('P8 down')
    expect(between('G4', 'C4')).toBe('P5 down')
    expect(between('Eb4', 'Eb3')).toBe('P8 down')
    expect(between('C4', 'C4')).toBe('P1 up')
  })

  it('works across the B/C boundary and with accidentals on both notes', () => {
    expect(between('B3', 'C4')).toBe('m2 up')
    expect(between('B#3', 'C4')).toBe('d2 up')
    expect(between('A#3', 'C#4')).toBe('m3 up')
    expect(between('Bb3', 'D4')).toBe('M3 up')
    expect(between('F#4', 'D#5')).toBe('M6 up')
    expect(between('Ab3', 'F#4')).toBe('A6 up')
  })

  it('names doubly diminished and doubly augmented intervals', () => {
    // B#3 to Cb4 is a letter-name 2nd that is one semitone *lower* in sound.
    expect(between('B#3', 'Cb4')).toBe('dd2 up')
    expect(between('Cb4', 'B#4')).toBe('AA7 up')
  })

  it('rejects intervals beyond doubly augmented/diminished', () => {
    // B##3 to Cb4: a letter-name 2nd, two semitones lower in sound (triply diminished).
    expect(() => intervalBetween(P('B##3'), P('Cb4'))).toThrow(RangeError)
    expect(() => intervalBetween(P('Cb4'), P('B###4'))).toThrow(RangeError)
  })
})

describe('intervalSemitones', () => {
  it.each([
    ['P1', 0],
    ['m2', 1],
    ['M2', 2],
    ['m3', 3],
    ['M3', 4],
    ['P4', 5],
    ['A4', 6],
    ['d5', 6],
    ['P5', 7],
    ['m6', 8],
    ['M6', 9],
    ['m7', 10],
    ['M7', 11],
    ['P8', 12],
    ['d8', 11],
    ['A1', 1],
    ['d7', 9],
    ['M9', 14],
    ['P15', 24],
    ['dd7', 8],
    ['AA4', 7],
  ])('%s is %i semitones', (name, semitones) => {
    expect(intervalSemitones(parseInterval(name))).toBe(semitones)
  })
})

describe('invalid intervals', () => {
  it.each([
    [3, 'perfect'],
    [5, 'major'],
    [4, 'minor'],
    [1, 'major'],
    [8, 'major'],
    [1, 'diminished'],
    [1, 'doubly-diminished'],
    [6, 'perfect'],
    [12, 'minor'],
  ] as [number, IntervalQuality][])('%i %s does not exist', (number, quality) => {
    expect(() => interval(number, quality)).toThrow(RangeError)
  })

  it('rejects zero, negative and fractional numbers', () => {
    expect(() => interval(0, 'perfect')).toThrow(RangeError)
    expect(() => interval(-3, 'major')).toThrow(RangeError)
    expect(() => interval(2.5, 'major')).toThrow(RangeError)
  })
})

describe('transpose', () => {
  const t = (start: string, name: string, dir: 'up' | 'down' = 'up') =>
    formatPitch(transpose(P(start), parseInterval(name), dir))

  it.each([
    ['C4', 'm3', 'Eb4'],
    ['C4', 'M3', 'E4'],
    ['C4', 'A4', 'F#4'],
    ['C4', 'd5', 'Gb4'],
    ['F#4', 'M3', 'A#4'],
    ['F#4', 'm3', 'A4'],
    ['B3', 'm2', 'C4'],
    ['B#3', 'M2', 'C##4'],
    ['E4', 'P5', 'B4'],
    ['F4', 'P5', 'C5'],
    ['B4', 'P5', 'F#5'],
    ['Bb3', 'P5', 'F4'],
    ['Bb3', 'M7', 'A4'],
    ['Eb4', 'A4', 'A4'],
    ['G#4', 'A5', 'D##5'],
    ['C4', 'M9', 'D5'],
    ['C4', 'P8', 'C5'],
    ['Ab3', 'd7', 'Gbb4'],
  ])('%s up a %s is %s', (start, name, expected) => {
    expect(t(start, name)).toBe(expected)
  })

  it.each([
    ['C4', 'm3', 'A3'],
    ['C4', 'M3', 'Ab3'],
    ['C4', 'P5', 'F3'],
    ['E4', 'M3', 'C4'],
    ['C4', 'm2', 'B3'],
    ['F4', 'A4', 'Cb4'],
    ['C4', 'P8', 'C3'],
  ])('%s down a %s is %s', (start, name, expected) => {
    expect(t(start, name, 'down')).toBe(expected)
  })

  it('transposes note names without an octave', () => {
    expect(formatNote(transposeNote(parseNote('F#'), parseInterval('M3')))).toBe('A#')
    expect(formatNote(transposeNote(parseNote('Bb'), parseInterval('P5')))).toBe('F')
    expect(formatNote(transposeNote(parseNote('C'), parseInterval('m3'), 'down'))).toBe('A')
  })
})

/** Every interval that exists, up to two octaves. */
function allIntervals(): Interval[] {
  const all: Interval[] = []
  const qualities: IntervalQuality[] = [
    'doubly-diminished',
    'diminished',
    'minor',
    'perfect',
    'major',
    'augmented',
    'doubly-augmented',
  ]
  for (let number = 1; number <= 15; number++) {
    for (const quality of qualities) {
      try {
        all.push(interval(number, quality))
      } catch {
        // combination does not exist
      }
    }
  }
  return all
}

describe('consistency across every pitch and interval', () => {
  const starts = LETTERS.flatMap((letter) =>
    [-1, 0, 1].flatMap((accidental) => [2, 3, 4, 5].map((octave) => ({ letter, accidental, octave }))),
  )
  const intervals = allIntervals()

  it('covers a sensible number of intervals', () => {
    expect(intervals.length).toBeGreaterThan(70)
  })

  it('transposing up moves by exactly the interval size in semitones', () => {
    for (const start of starts) {
      for (const i of intervals) {
        const end = transpose(start, i, 'up')
        expect(midiNumber(end) - midiNumber(start)).toBe(intervalSemitones(i))
      }
    }
  })

  it('transposing down moves by exactly the interval size in semitones', () => {
    for (const start of starts) {
      for (const i of intervals) {
        const end = transpose(start, i, 'down')
        expect(midiNumber(start) - midiNumber(end)).toBe(intervalSemitones(i))
      }
    }
  })

  it('intervalBetween recovers the interval that transpose used (up and down)', () => {
    for (const start of starts) {
      for (const i of intervals) {
        for (const dir of ['up', 'down'] as const) {
          const end = transpose(start, i, dir)
          const back = intervalBetween(start, end)
          // Intervals of more than two accidentals cannot be named; those are skipped.
          expect(back.interval).toEqual(i)
          expect(back.direction).toBe(i.number === 1 && i.quality === 'perfect' ? 'up' : dir)
        }
      }
    }
  })

  it('letter names move by number - 1 steps', () => {
    for (const start of starts) {
      for (const i of intervals) {
        const end = transpose(start, i, 'up')
        const letterMove = (LETTERS.indexOf(end.letter) - LETTERS.indexOf(start.letter) + 7) % 7
        expect(letterMove).toBe((i.number - 1) % 7)
      }
    }
  })
})

describe('invertInterval', () => {
  it.each([
    ['M3', 'm6'],
    ['m3', 'M6'],
    ['P5', 'P4'],
    ['P4', 'P5'],
    ['A4', 'd5'],
    ['d5', 'A4'],
    ['M2', 'm7'],
    ['m7', 'M2'],
    ['P1', 'P8'],
    ['P8', 'P1'],
    ['A5', 'd4'],
    ['d7', 'A2'],
  ])('%s inverts to %s', (name, expected) => {
    expect(intervalShortName(invertInterval(parseInterval(name)))).toBe(expected)
  })

  it('an interval and its inversion always add up to 12 semitones', () => {
    for (const i of allIntervals().filter((x) => x.number <= 8)) {
      const augmentedOctave = i.number === 8 && (i.quality === 'augmented' || i.quality === 'doubly-augmented')
      if (augmentedOctave) continue // covered by the test below
      expect(intervalSemitones(i) + intervalSemitones(invertInterval(i))).toBe(12)
    }
  })

  it('refuses to invert an augmented octave (it would be a diminished unison)', () => {
    expect(() => invertInterval(parseInterval('A8'))).toThrow(RangeError)
    expect(() => invertInterval(parseInterval('AA8'))).toThrow(RangeError)
  })

  it('refuses compound intervals', () => {
    expect(() => invertInterval(parseInterval('M9'))).toThrow(RangeError)
  })
})

describe('names', () => {
  it('writes full names', () => {
    expect(intervalName(parseInterval('M3'))).toBe('major 3rd')
    expect(intervalName(parseInterval('m2'))).toBe('minor 2nd')
    expect(intervalName(parseInterval('P5'))).toBe('perfect 5th')
    expect(intervalName(parseInterval('A4'))).toBe('augmented 4th')
    expect(intervalName(parseInterval('d5'))).toBe('diminished 5th')
    expect(intervalName(parseInterval('P8'))).toBe('perfect octave')
    expect(intervalName(parseInterval('P1'))).toBe('perfect unison')
    expect(intervalName(parseInterval('dd3'))).toBe('doubly diminished 3rd')
    expect(intervalName(parseInterval('M9'))).toBe('major 9th')
    expect(intervalName(parseInterval('m7'))).toBe('minor 7th')
  })

  it('short names round-trip for every interval', () => {
    for (const i of allIntervals()) {
      expect(parseInterval(intervalShortName(i))).toEqual(i)
    }
  })

  it('rejects bad text', () => {
    for (const text of ['', 'X3', 'M', '3', 'M0', 'P3', 'm5']) {
      expect(() => parseInterval(text)).toThrow()
    }
  })
})
