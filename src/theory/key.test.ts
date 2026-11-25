import { describe, expect, it } from 'vitest'
import { parseInterval, transposeNote } from './interval'
import {
  circleOfFifths,
  closelyRelatedKeys,
  dominantKey,
  fifthsPosition,
  isStandardKey,
  key,
  keyFifths,
  keyFromFifths,
  keyName,
  keyScaleNotes,
  keySignature,
  noteAtFifthsPosition,
  parallelKey,
  parseKey,
  relativeKey,
  subdominantKey,
} from './key'
import { LETTERS, formatNote, note, parseNote } from './pitch'

const fifths = (text: string) => keyFifths(parseKey(text))
const sig = (text: string) =>
  keySignature(parseKey(text))
    .accidentals.map((n) => formatNote(n))
    .join(' ')

describe('key signatures: all standard keys, from memory of the circle of fifths', () => {
  it.each([
    ['C major', 0],
    ['G major', 1],
    ['D major', 2],
    ['A major', 3],
    ['E major', 4],
    ['B major', 5],
    ['F# major', 6],
    ['C# major', 7],
    ['F major', -1],
    ['Bb major', -2],
    ['Eb major', -3],
    ['Ab major', -4],
    ['Db major', -5],
    ['Gb major', -6],
    ['Cb major', -7],
    ['A minor', 0],
    ['E minor', 1],
    ['B minor', 2],
    ['F# minor', 3],
    ['C# minor', 4],
    ['G# minor', 5],
    ['D# minor', 6],
    ['A# minor', 7],
    ['D minor', -1],
    ['G minor', -2],
    ['C minor', -3],
    ['F minor', -4],
    ['Bb minor', -5],
    ['Eb minor', -6],
    ['Ab minor', -7],
  ])('%s has %i sharps (+) or flats (-)', (name, expected) => {
    expect(fifths(name)).toBe(expected)
  })

  it('lists accidentals in the traditional order', () => {
    expect(sig('C major')).toBe('')
    expect(sig('G major')).toBe('F#')
    expect(sig('D major')).toBe('F# C#')
    expect(sig('A major')).toBe('F# C# G#')
    expect(sig('C# major')).toBe('F# C# G# D# A# E# B#')
    expect(sig('F major')).toBe('Bb')
    expect(sig('Bb major')).toBe('Bb Eb')
    expect(sig('Eb major')).toBe('Bb Eb Ab')
    expect(sig('Cb major')).toBe('Bb Eb Ab Db Gb Cb Fb')
    expect(sig('E minor')).toBe('F#')
    expect(sig('D minor')).toBe('Bb')
    expect(sig('C minor')).toBe('Bb Eb Ab')
    expect(sig('A# minor')).toBe('F# C# G# D# A# E# B#')
  })

  it('reports the kind and count', () => {
    expect(keySignature(parseKey('C major'))).toMatchObject({ kind: 'none', count: 0, fifths: 0 })
    expect(keySignature(parseKey('A major'))).toMatchObject({ kind: 'sharps', count: 3, fifths: 3 })
    expect(keySignature(parseKey('Eb major'))).toMatchObject({ kind: 'flats', count: 3, fifths: -3 })
  })

  it('refuses theoretical keys instead of guessing', () => {
    for (const name of ['G# major', 'D# major', 'Fb major', 'Cb minor', 'E# minor']) {
      const k = parseKey(name)
      expect(isStandardKey(k)).toBe(false)
      expect(() => keySignature(k)).toThrow(RangeError)
    }
    expect(isStandardKey(parseKey('C# major'))).toBe(true)
    expect(isStandardKey(parseKey('Cb major'))).toBe(true)
  })
})

describe('line of fifths', () => {
  it('maps notes to positions and back', () => {
    expect(fifthsPosition(parseNote('C'))).toBe(0)
    expect(fifthsPosition(parseNote('G'))).toBe(1)
    expect(fifthsPosition(parseNote('F'))).toBe(-1)
    expect(fifthsPosition(parseNote('F#'))).toBe(6)
    expect(fifthsPosition(parseNote('Bb'))).toBe(-2)
    expect(fifthsPosition(parseNote('Cb'))).toBe(-7)
    for (let position = -20; position <= 20; position++) {
      expect(fifthsPosition(noteAtFifthsPosition(position))).toBe(position)
    }
  })

  it('moving one step up the line is a perfect 5th (checked by transposing)', () => {
    for (let position = -14; position <= 14; position++) {
      const here = noteAtFifthsPosition(position)
      const up = transposeNote(here, parseInterval('P5'))
      expect(formatNote(up)).toBe(formatNote(noteAtFifthsPosition(position + 1)))
    }
  })
})

describe('key signature agrees with the scale (two independent routes)', () => {
  const standard = circleOfFifths()

  it('every note of the major scale carries exactly the accidental the signature gives its letter', () => {
    for (const { major } of standard) {
      const accidentalFor = new Map(keySignature(major).accidentals.map((n) => [n.letter, n.accidental]))
      for (const n of keyScaleNotes(major)) {
        expect(n.accidental, `${keyName(major)}: ${formatNote(n)}`).toBe(accidentalFor.get(n.letter) ?? 0)
      }
    }
  })

  it('every note of the natural minor scale carries the signature accidental for its letter', () => {
    for (const { minor } of standard) {
      const accidentalFor = new Map(keySignature(minor).accidentals.map((n) => [n.letter, n.accidental]))
      for (const n of keyScaleNotes(minor)) {
        expect(n.accidental, `${keyName(minor)}: ${formatNote(n)}`).toBe(accidentalFor.get(n.letter) ?? 0)
      }
    }
  })

  it('harmonic minor differs from the signature only on the 7th', () => {
    for (const { minor } of standard) {
      const natural = keyScaleNotes(minor, 'natural')
      const harmonic = keyScaleNotes(minor, 'harmonic')
      harmonic.forEach((n, i) => {
        if (i === 6) expect(n.accidental).toBe(natural[6]!.accidental + 1)
        else expect(n).toEqual(natural[i])
      })
    }
  })
})

describe('relative and parallel keys', () => {
  it.each([
    ['C major', 'A minor'],
    ['G major', 'E minor'],
    ['Bb major', 'G minor'],
    ['F# major', 'D# minor'],
    ['Cb major', 'Ab minor'],
    ['A minor', 'C major'],
    ['F# minor', 'A major'],
    ['C minor', 'Eb major'],
    ['D minor', 'F major'],
    ['G# minor', 'B major'],
  ])('relative of %s is %s', (from, to) => {
    expect(keyName(relativeKey(parseKey(from)))).toBe(to)
  })

  it('relative keys share a signature, and relative-of-relative is the original', () => {
    for (const { major, minor } of circleOfFifths()) {
      expect(keyFifths(relativeKey(major))).toBe(keyFifths(major))
      expect(relativeKey(major)).toEqual(minor)
      expect(relativeKey(minor)).toEqual(major)
    }
  })

  it('parallel keys share a tonic', () => {
    expect(keyName(parallelKey(parseKey('C major')))).toBe('C minor')
    expect(keyName(parallelKey(parseKey('F# minor')))).toBe('F# major')
    expect(parallelKey(parallelKey(parseKey('Eb major')))).toEqual(parseKey('Eb major'))
  })
})

describe('circle of fifths', () => {
  it('runs from seven flats to seven sharps', () => {
    const circle = circleOfFifths()
    expect(circle).toHaveLength(15)
    expect(keyName(circle[0]!.major)).toBe('Cb major')
    expect(keyName(circle[0]!.minor)).toBe('Ab minor')
    expect(keyName(circle[7]!.major)).toBe('C major')
    expect(keyName(circle[7]!.minor)).toBe('A minor')
    expect(keyName(circle[14]!.major)).toBe('C# major')
    expect(keyName(circle[14]!.minor)).toBe('A# minor')
  })

  it('has the keys in order of fifths, each entry self-consistent', () => {
    circleOfFifths().forEach(({ fifths: f, major, minor }, i) => {
      expect(f).toBe(i - 7)
      expect(keyFifths(major)).toBe(f)
      expect(keyFifths(minor)).toBe(f)
      expect(isStandardKey(major)).toBe(true)
      expect(isStandardKey(minor)).toBe(true)
    })
  })

  it('keyFromFifths round-trips with keyFifths for every letter and mode', () => {
    for (const letter of LETTERS) {
      for (const accidental of [-1, 0, 1]) {
        for (const mode of ['major', 'minor'] as const) {
          const k = key(note(letter, accidental), mode)
          expect(keyFromFifths(keyFifths(k), mode)).toEqual(k)
        }
      }
    }
  })

  it('dominant and subdominant keys', () => {
    expect(keyName(dominantKey(parseKey('C major')))).toBe('G major')
    expect(keyName(subdominantKey(parseKey('C major')))).toBe('F major')
    expect(keyName(dominantKey(parseKey('A minor')))).toBe('E minor')
    expect(keyName(subdominantKey(parseKey('A minor')))).toBe('D minor')
    expect(keyName(dominantKey(parseKey('B major')))).toBe('F# major')
    expect(keyName(subdominantKey(parseKey('F major')))).toBe('Bb major')
  })

  it('closely related keys differ by at most one accidental', () => {
    const related = closelyRelatedKeys(parseKey('C major')).map(keyName).sort()
    expect(related).toEqual(['A minor', 'D minor', 'E minor', 'F major', 'G major'])
    const minorRelated = closelyRelatedKeys(parseKey('A minor')).map(keyName).sort()
    expect(minorRelated).toEqual(['C major', 'D minor', 'E minor', 'F major', 'G major'])
  })
})

describe('naming keys', () => {
  it('formats and parses', () => {
    expect(keyName(key('F#', 'minor'))).toBe('F# minor')
    expect(keyName(parseKey('Bb major'))).toBe('Bb major')
    expect(() => parseKey('C')).toThrow(SyntaxError)
    expect(() => parseKey('H major')).toThrow(SyntaxError)
    expect(() => parseKey('C dorian')).toThrow(SyntaxError)
  })
})
