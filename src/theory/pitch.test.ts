import { describe, expect, it } from 'vitest'
import {
  LETTERS,
  comparePitches,
  diatonicStep,
  enharmonicSpellings,
  formatNote,
  formatPitch,
  midiNumber,
  note,
  parseNote,
  parsePitch,
  pitchClass,
  pitchFromStep,
  sameNote,
  samePitch,
  sameSound,
  shiftOctaves,
} from './pitch'

const f = (text: string) => formatPitch(parsePitch(text))

describe('midiNumber', () => {
  it.each([
    ['C4', 60],
    ['A4', 69],
    ['C-1', 0],
    ['G9', 127],
    ['C3', 48],
    ['B#3', 60], // enharmonic of C4, but a different octave number
    ['Cb4', 59],
    ['F#4', 66],
    ['Gb4', 66],
    ['E#4', 65],
    ['Fb4', 64],
    ['Bbb3', 57],
    ['C##4', 62],
  ])('%s is %i', (text, expected) => {
    expect(midiNumber(parsePitch(text))).toBe(expected)
  })
})

describe('diatonicStep', () => {
  it('counts letters only', () => {
    expect(diatonicStep(parsePitch('C4'))).toBe(28)
    expect(diatonicStep(parsePitch('C#4'))).toBe(28)
    expect(diatonicStep(parsePitch('B4'))).toBe(34)
    expect(diatonicStep(parsePitch('C5'))).toBe(35)
    expect(diatonicStep(parsePitch('B3'))).toBe(27)
  })
})

describe('pitchClass', () => {
  it('wraps around the octave', () => {
    expect(pitchClass(parseNote('C'))).toBe(0)
    expect(pitchClass(parseNote('Cb'))).toBe(11)
    expect(pitchClass(parseNote('B#'))).toBe(0)
    expect(pitchClass(parseNote('Dbb'))).toBe(0)
    expect(pitchClass(parseNote('F##'))).toBe(7)
  })
})

describe('parse and format', () => {
  it('round-trips every letter, accidental -2..2 and octave 0..8', () => {
    for (const letter of LETTERS) {
      for (let accidental = -2; accidental <= 2; accidental++) {
        for (let octave = 0; octave <= 8; octave++) {
          const p = { letter, accidental, octave }
          expect(parsePitch(formatPitch(p))).toEqual(p)
          expect(parsePitch(formatPitch(p, 'symbol'))).toEqual(p)
        }
        expect(parseNote(formatNote(note(letter, accidental)))).toEqual(note(letter, accidental))
      }
    }
  })

  it('formats the way a musician writes it', () => {
    expect(f('F#4')).toBe('F#4')
    expect(f('Bb3')).toBe('Bb3')
    expect(formatPitch(parsePitch('Ebb5'))).toBe('Ebb5')
    expect(formatPitch(parsePitch('G##2'))).toBe('G##2')
    expect(formatPitch(parsePitch('Bb3'), 'symbol')).toBe('B♭3')
    expect(formatNote(parseNote('C#'), 'symbol')).toBe('C♯')
  })

  it('accepts x for double sharp and keeps flat vs sharp apart', () => {
    expect(parseNote('Fx')).toEqual(note('F', 2))
    expect(parseNote('F#')).not.toEqual(parseNote('Gb'))
  })

  it.each(['', 'c4', 'H4', 'C', 'C#', 'C#x4', '4C', 'Cb#4', 'C 4', 'B-'])('rejects pitch "%s"', (text) => {
    expect(() => parsePitch(text)).toThrow(SyntaxError)
  })

  it.each(['', 'c', 'H', 'C4', 'Cb#', 'bb'])('rejects note "%s"', (text) => {
    expect(() => parseNote(text)).toThrow(SyntaxError)
  })

  it('rejects non-integer accidentals', () => {
    expect(() => note('C', 0.5)).toThrow(RangeError)
  })
})

describe('pitchFromStep', () => {
  it('finds the accidental that matches the MIDI number', () => {
    expect(pitchFromStep(30, 63)).toEqual(parsePitch('Eb4'))
    expect(pitchFromStep(28, 61)).toEqual(parsePitch('C#4'))
    expect(pitchFromStep(27, 60)).toEqual(parsePitch('B#3'))
    expect(pitchFromStep(28, 59)).toEqual(parsePitch('Cb4'))
  })

  it('is the inverse of diatonicStep and midiNumber for any pitch', () => {
    for (const letter of LETTERS) {
      for (let accidental = -2; accidental <= 2; accidental++) {
        const p = { letter, accidental, octave: 3 }
        expect(pitchFromStep(diatonicStep(p), midiNumber(p))).toEqual(p)
      }
    }
  })
})

describe('comparisons', () => {
  it('distinguishes spelling from sound', () => {
    const cs = parsePitch('C#4')
    const db = parsePitch('Db4')
    expect(sameSound(cs, db)).toBe(true)
    expect(samePitch(cs, db)).toBe(false)
    expect(sameNote(parseNote('C#'), parseNote('Db'))).toBe(false)
    expect(samePitch(cs, parsePitch('C#4'))).toBe(true)
  })

  it('sorts by sound, then letter step', () => {
    const sorted = ['D4', 'C#4', 'Db4', 'B#3', 'C4', 'A3'].map(parsePitch).sort(comparePitches).map((p) => formatPitch(p))
    expect(sorted).toEqual(['A3', 'B#3', 'C4', 'C#4', 'Db4', 'D4'])
  })

  it('shifts octaves without changing the spelling', () => {
    expect(formatPitch(shiftOctaves(parsePitch('F#4'), -2))).toBe('F#2')
  })
})

describe('enharmonicSpellings', () => {
  it('lists the other spellings, lowest letter first', () => {
    expect(enharmonicSpellings(parsePitch('C#4'), 1).map((p) => formatPitch(p))).toEqual(['Db4'])
    expect(enharmonicSpellings(parsePitch('C#4')).map((p) => formatPitch(p))).toEqual(['B##3', 'Db4'])
    expect(enharmonicSpellings(parsePitch('F#4'), 1).map((p) => formatPitch(p))).toEqual(['Gb4'])
    expect(enharmonicSpellings(parsePitch('C4'), 1).map((p) => formatPitch(p))).toEqual(['B#3'])
    expect(enharmonicSpellings(parsePitch('B3'), 1).map((p) => formatPitch(p))).toEqual(['Cb4'])
    expect(enharmonicSpellings(parsePitch('E4'), 1).map((p) => formatPitch(p))).toEqual(['Fb4'])
  })

  it('every spelling sounds the same and differs in spelling', () => {
    for (const letter of LETTERS) {
      for (let accidental = -1; accidental <= 1; accidental++) {
        const p = { letter, accidental, octave: 4 }
        for (const other of enharmonicSpellings(p)) {
          expect(sameSound(p, other)).toBe(true)
          expect(samePitch(p, other)).toBe(false)
          expect(Math.abs(other.accidental)).toBeLessThanOrEqual(2)
        }
      }
    }
  })
})
