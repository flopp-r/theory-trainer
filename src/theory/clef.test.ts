import { describe, expect, it } from 'vitest'
import {
  CLEF_NAMES,
  type ClefName,
  lineNotes,
  naturalPitchesInClef,
  pitchAtPosition,
  spaceNotes,
  staffPlacement,
  staffPosition,
} from './clef'
import { LETTERS, formatPitch, midiNumber, parsePitch } from './pitch'
import { VIOLA_RANGE, guitarSoundingPitch, guitarWrittenPitch, isInRange } from './instruments'

const names = (pitches: ReturnType<typeof lineNotes>) => pitches.map((p) => formatPitch(p)).join(' ')

describe('lines and spaces (standard facts)', () => {
  it('treble clef', () => {
    expect(names(lineNotes('treble'))).toBe('E4 G4 B4 D5 F5')
    expect(names(spaceNotes('treble'))).toBe('F4 A4 C5 E5')
  })
  it('bass clef', () => {
    expect(names(lineNotes('bass'))).toBe('G2 B2 D3 F3 A3')
    expect(names(spaceNotes('bass'))).toBe('A2 C3 E3 G3')
  })
  it('alto clef: middle C on the middle line', () => {
    expect(names(lineNotes('alto'))).toBe('F3 A3 C4 E4 G4')
    expect(names(spaceNotes('alto'))).toBe('G3 B3 D4 F4')
  })
  it('tenor clef: middle C on the fourth line up', () => {
    expect(names(lineNotes('tenor'))).toBe('D3 F3 A3 C4 E4')
    expect(names(spaceNotes('tenor'))).toBe('E3 G3 B3 D4')
  })
})

describe('middle C in every clef', () => {
  it.each([
    ['treble', -2], // first ledger line below
    ['bass', 10], // first ledger line above
    ['alto', 4], // middle line
    ['tenor', 6], // fourth line
  ] as [ClefName, number][])('%s clef: position %i', (clef, position) => {
    expect(staffPosition(parsePitch('C4'), clef)).toBe(position)
  })
})

describe('staffPosition', () => {
  it('treble clef spot checks', () => {
    const pos = (t: string) => staffPosition(parsePitch(t), 'treble')
    expect(pos('E4')).toBe(0)
    expect(pos('G4')).toBe(2)
    expect(pos('F5')).toBe(8)
    expect(pos('G5')).toBe(9)
    expect(pos('A5')).toBe(10)
    expect(pos('D4')).toBe(-1)
    expect(pos('A3')).toBe(-4)
  })

  it('bass clef spot checks', () => {
    const pos = (t: string) => staffPosition(parsePitch(t), 'bass')
    expect(pos('G2')).toBe(0)
    expect(pos('F3')).toBe(6)
    expect(pos('A3')).toBe(8)
    expect(pos('E2')).toBe(-2)
    expect(pos('B3')).toBe(9)
  })

  it('accidentals do not move a note on the staff', () => {
    for (const clef of CLEF_NAMES) {
      for (const letter of LETTERS) {
        const natural = staffPosition({ letter, accidental: 0, octave: 4 }, clef)
        expect(staffPosition({ letter, accidental: 1, octave: 4 }, clef)).toBe(natural)
        expect(staffPosition({ letter, accidental: -2, octave: 4 }, clef)).toBe(natural)
      }
    }
  })

  it('an octave is always 7 positions', () => {
    for (const clef of CLEF_NAMES) {
      for (const letter of LETTERS) {
        const low = staffPosition({ letter, accidental: 0, octave: 3 }, clef)
        const high = staffPosition({ letter, accidental: 0, octave: 4 }, clef)
        expect(high - low).toBe(7)
      }
    }
  })
})

describe('pitchAtPosition', () => {
  it('is the inverse of staffPosition for natural notes', () => {
    for (const clef of CLEF_NAMES) {
      for (let position = -12; position <= 20; position++) {
        const p = pitchAtPosition(position, clef)
        expect(p.accidental).toBe(0)
        expect(staffPosition(p, clef)).toBe(position)
      }
    }
  })

  it('applies a requested accidental', () => {
    expect(formatPitch(pitchAtPosition(1, 'treble', 1))).toBe('F#4')
    expect(formatPitch(pitchAtPosition(4, 'bass', -1))).toBe('Db3')
  })

  it('rejects fractional positions', () => {
    expect(() => pitchAtPosition(1.5, 'treble')).toThrow(RangeError)
  })

  it('the same position in different clefs is a different pitch', () => {
    const top = CLEF_NAMES.map((clef) => formatPitch(pitchAtPosition(8, clef)))
    expect(top).toEqual(['F5', 'A3', 'G4', 'E4'])
  })
})

describe('ledger lines', () => {
  const placement = (t: string, clef: ClefName) => {
    const r = staffPlacement(parsePitch(t), clef)
    return `${r.ledgerLines}${r.ledgerSide ?? ''}`
  }

  it('treble clef', () => {
    expect(placement('E4', 'treble')).toBe('0') // bottom line
    expect(placement('D4', 'treble')).toBe('0') // space below the staff
    expect(placement('C4', 'treble')).toBe('1below') // on first ledger line
    expect(placement('B3', 'treble')).toBe('1below') // space below first ledger line
    expect(placement('A3', 'treble')).toBe('2below')
    expect(placement('F5', 'treble')).toBe('0') // top line
    expect(placement('G5', 'treble')).toBe('0') // space above
    expect(placement('A5', 'treble')).toBe('1above')
    expect(placement('B5', 'treble')).toBe('1above')
    expect(placement('C6', 'treble')).toBe('2above')
  })

  it('bass and alto clef', () => {
    expect(placement('C4', 'bass')).toBe('1above')
    expect(placement('E2', 'bass')).toBe('1below')
    expect(placement('C4', 'alto')).toBe('0')
    expect(placement('C3', 'alto')).toBe('1below')
  })

  it('reports line vs space', () => {
    expect(staffPlacement(parsePitch('G4'), 'treble').onLine).toBe(true)
    expect(staffPlacement(parsePitch('A4'), 'treble').onLine).toBe(false)
    expect(staffPlacement(parsePitch('C4'), 'treble').onLine).toBe(true) // ledger line
    expect(staffPlacement(parsePitch('D4'), 'treble').onLine).toBe(false)
  })

  it('naturalPitchesInClef never needs more ledger lines than allowed, and includes the limits', () => {
    for (const clef of CLEF_NAMES) {
      for (let max = 0; max <= 3; max++) {
        const pitches = naturalPitchesInClef(clef, max)
        expect(pitches).toHaveLength(9 + 2 * (2 * max + 1))
        const needed = pitches.map((p) => staffPlacement(p, clef).ledgerLines)
        expect(Math.max(...needed)).toBe(max)
        const midis = pitches.map(midiNumber)
        expect([...midis].sort((a, b) => a - b)).toEqual(midis) // lowest first
      }
    }
    // With no ledger lines: the nine staff positions plus the space below and the space above.
    expect(names(naturalPitchesInClef('treble', 0))).toBe('D4 E4 F4 G4 A4 B4 C5 D5 E5 F5 G5')
    expect(names(naturalPitchesInClef('treble', 1))).toBe('B3 C4 D4 E4 F4 G4 A4 B4 C5 D5 E5 F5 G5 A5 B5')
  })
})

describe('instruments', () => {
  it('guitar sounds an octave below written pitch', () => {
    expect(formatPitch(guitarSoundingPitch(parsePitch('E4')))).toBe('E3')
    expect(formatPitch(guitarSoundingPitch(parsePitch('C#5')))).toBe('C#4')
    expect(formatPitch(guitarWrittenPitch(parsePitch('E2')))).toBe('E3')
    expect(midiNumber(parsePitch('E4')) - midiNumber(guitarSoundingPitch(parsePitch('E4')))).toBe(12)
  })

  it('viola range starts at the open C string', () => {
    expect(formatPitch(VIOLA_RANGE.low)).toBe('C3')
    expect(isInRange(parsePitch('C3'), VIOLA_RANGE)).toBe(true)
    expect(isInRange(parsePitch('B2'), VIOLA_RANGE)).toBe(false)
    expect(isInRange(parsePitch('A5'), VIOLA_RANGE)).toBe(true)
    expect(isInRange(parsePitch('A#5'), VIOLA_RANGE)).toBe(false)
    expect(isInRange(parsePitch('Cb3'), VIOLA_RANGE)).toBe(false) // sounds as B2
  })
})
