import { describe, expect, it } from 'vitest'
import { chord, parseKey } from '../../../theory'
import { MAJOR_FIFTHS, MAJOR_SCALES, NATURAL_MINOR_SCALES, ascii } from '../../../questions/handTables'
import { chordFromNumeralExample, primaryChordsExample, romanNumeralExample, scaleByCounting } from './romanNumerals'
import { parseNote } from '../../../theory'

// Hand-written: the chords of each key, as numeral, symbol and notes (ASCII).
interface Row {
  numeral: string
  root: string
  quality: 'major' | 'minor' | 'diminished' | 'dominant7'
  symbol: string
  notes: string
}
const KEYS: Record<string, Row[]> = {
  'C major': [
    { numeral: 'I', root: 'C', quality: 'major', symbol: 'C', notes: 'C E G' },
    { numeral: 'ii', root: 'D', quality: 'minor', symbol: 'Dm', notes: 'D F A' },
    { numeral: 'iii', root: 'E', quality: 'minor', symbol: 'Em', notes: 'E G B' },
    { numeral: 'IV', root: 'F', quality: 'major', symbol: 'F', notes: 'F A C' },
    { numeral: 'V', root: 'G', quality: 'major', symbol: 'G', notes: 'G B D' },
    { numeral: 'vi', root: 'A', quality: 'minor', symbol: 'Am', notes: 'A C E' },
    { numeral: 'vii°', root: 'B', quality: 'diminished', symbol: 'Bdim', notes: 'B D F' },
    { numeral: 'V7', root: 'G', quality: 'dominant7', symbol: 'G7', notes: 'G B D F' },
  ],
  'G major': [
    { numeral: 'I', root: 'G', quality: 'major', symbol: 'G', notes: 'G B D' },
    { numeral: 'ii', root: 'A', quality: 'minor', symbol: 'Am', notes: 'A C E' },
    { numeral: 'iii', root: 'B', quality: 'minor', symbol: 'Bm', notes: 'B D F#' },
    { numeral: 'IV', root: 'C', quality: 'major', symbol: 'C', notes: 'C E G' },
    { numeral: 'V', root: 'D', quality: 'major', symbol: 'D', notes: 'D F# A' },
    { numeral: 'vi', root: 'E', quality: 'minor', symbol: 'Em', notes: 'E G B' },
    { numeral: 'vii°', root: 'F#', quality: 'diminished', symbol: 'F#dim', notes: 'F# A C' },
  ],
  'D major': [
    { numeral: 'I', root: 'D', quality: 'major', symbol: 'D', notes: 'D F# A' },
    { numeral: 'ii', root: 'E', quality: 'minor', symbol: 'Em', notes: 'E G B' },
    { numeral: 'iii', root: 'F#', quality: 'minor', symbol: 'F#m', notes: 'F# A C#' },
    { numeral: 'IV', root: 'G', quality: 'major', symbol: 'G', notes: 'G B D' },
    { numeral: 'V', root: 'A', quality: 'major', symbol: 'A', notes: 'A C# E' },
    { numeral: 'vi', root: 'B', quality: 'minor', symbol: 'Bm', notes: 'B D F#' },
    { numeral: 'vii°', root: 'C#', quality: 'diminished', symbol: 'C#dim', notes: 'C# E G' },
    { numeral: 'V7', root: 'A', quality: 'dominant7', symbol: 'A7', notes: 'A C# E G' },
  ],
  'F major': [
    { numeral: 'I', root: 'F', quality: 'major', symbol: 'F', notes: 'F A C' },
    { numeral: 'ii', root: 'G', quality: 'minor', symbol: 'Gm', notes: 'G Bb D' },
    { numeral: 'iii', root: 'A', quality: 'minor', symbol: 'Am', notes: 'A C E' },
    { numeral: 'IV', root: 'Bb', quality: 'major', symbol: 'Bb', notes: 'Bb D F' },
    { numeral: 'V', root: 'C', quality: 'major', symbol: 'C', notes: 'C E G' },
    { numeral: 'vi', root: 'D', quality: 'minor', symbol: 'Dm', notes: 'D F A' },
    { numeral: 'vii°', root: 'E', quality: 'diminished', symbol: 'Edim', notes: 'E G Bb' },
  ],
  'Bb major': [
    { numeral: 'I', root: 'Bb', quality: 'major', symbol: 'Bb', notes: 'Bb D F' },
    { numeral: 'ii', root: 'C', quality: 'minor', symbol: 'Cm', notes: 'C Eb G' },
    { numeral: 'iii', root: 'D', quality: 'minor', symbol: 'Dm', notes: 'D F A' },
    { numeral: 'IV', root: 'Eb', quality: 'major', symbol: 'Eb', notes: 'Eb G Bb' },
    { numeral: 'V', root: 'F', quality: 'major', symbol: 'F', notes: 'F A C' },
    { numeral: 'vi', root: 'G', quality: 'minor', symbol: 'Gm', notes: 'G Bb D' },
    { numeral: 'vii°', root: 'A', quality: 'diminished', symbol: 'Adim', notes: 'A C Eb' },
  ],
  'A minor': [
    { numeral: 'i', root: 'A', quality: 'minor', symbol: 'Am', notes: 'A C E' },
    { numeral: 'ii°', root: 'B', quality: 'diminished', symbol: 'Bdim', notes: 'B D F' },
    { numeral: 'III', root: 'C', quality: 'major', symbol: 'C', notes: 'C E G' },
    { numeral: 'iv', root: 'D', quality: 'minor', symbol: 'Dm', notes: 'D F A' },
    { numeral: 'v', root: 'E', quality: 'minor', symbol: 'Em', notes: 'E G B' },
    { numeral: 'V', root: 'E', quality: 'major', symbol: 'E', notes: 'E G# B' },
    { numeral: 'VI', root: 'F', quality: 'major', symbol: 'F', notes: 'F A C' },
    { numeral: 'VII', root: 'G', quality: 'major', symbol: 'G', notes: 'G B D' },
    { numeral: 'vii°', root: 'G#', quality: 'diminished', symbol: 'G#dim', notes: 'G# B D' },
    { numeral: 'V7', root: 'E', quality: 'dominant7', symbol: 'E7', notes: 'E G# B D' },
  ],
  'C minor': [
    { numeral: 'i', root: 'C', quality: 'minor', symbol: 'Cm', notes: 'C Eb G' },
    { numeral: 'ii°', root: 'D', quality: 'diminished', symbol: 'Ddim', notes: 'D F Ab' },
    { numeral: 'III', root: 'Eb', quality: 'major', symbol: 'Eb', notes: 'Eb G Bb' },
    { numeral: 'iv', root: 'F', quality: 'minor', symbol: 'Fm', notes: 'F Ab C' },
    { numeral: 'V', root: 'G', quality: 'major', symbol: 'G', notes: 'G B D' },
    { numeral: 'VI', root: 'Ab', quality: 'major', symbol: 'Ab', notes: 'Ab C Eb' },
    { numeral: 'VII', root: 'Bb', quality: 'major', symbol: 'Bb', notes: 'Bb D F' },
    { numeral: 'vii°', root: 'B', quality: 'diminished', symbol: 'Bdim', notes: 'B D F' },
    { numeral: 'V7', root: 'G', quality: 'dominant7', symbol: 'G7', notes: 'G B D F' },
  ],
  'E minor': [
    { numeral: 'i', root: 'E', quality: 'minor', symbol: 'Em', notes: 'E G B' },
    { numeral: 'iv', root: 'A', quality: 'minor', symbol: 'Am', notes: 'A C E' },
    { numeral: 'V', root: 'B', quality: 'major', symbol: 'B', notes: 'B D# F#' },
    { numeral: 'vii°', root: 'D#', quality: 'diminished', symbol: 'D#dim', notes: 'D# F# A' },
  ],
}

describe('scaleByCounting', () => {
  it('builds major scales and natural minor scales as the hand-written tables say', () => {
    for (const [tonic, scale] of Object.entries(MAJOR_SCALES)) {
      if (Math.abs(MAJOR_FIFTHS[tonic]!) > 7) continue
      expect(ascii(scaleByCounting({ tonic: parseNote(tonic), mode: 'major' }).map((n) => n.letter + (n.accidental > 0 ? '#'.repeat(n.accidental) : 'b'.repeat(-n.accidental))).join(' ')), tonic).toBe(scale)
    }
    for (const [tonic, scale] of Object.entries(NATURAL_MINOR_SCALES)) {
      expect(scaleByCounting({ tonic: parseNote(tonic), mode: 'minor' }).map((n) => n.letter + (n.accidental > 0 ? '#'.repeat(n.accidental) : 'b'.repeat(-n.accidental))).join(' '), tonic).toBe(scale)
    }
  })
})

describe('romanNumeralExample', () => {
  it('finds the numeral for every chord in the hand-written table', () => {
    for (const [keyName, rows] of Object.entries(KEYS)) {
      const key = parseKey(keyName)
      for (const row of rows) {
        const e = romanNumeralExample(key, chord(row.root, row.quality))
        expect(ascii(e.answer), `${keyName} ${row.numeral}`).toBe(`In ${keyName}, ${row.symbol} is ${row.numeral}.`)
        expect(ascii(e.steps[0]!.text), `${keyName} ${row.numeral}`).toContain(`**${row.notes}**`)
      }
    }
  })

  it('shows the chord, numbers the scale, finds the root, picks the case and checks', () => {
    const e = romanNumeralExample(parseKey('G major'), chord('D', 'major'))
    expect(e.steps).toHaveLength(6)
    expect(e.steps[0]!.staff!.key).toEqual({ tonic: { letter: 'G', accidental: 0 }, mode: 'major' })
    expect(ascii(e.steps[1]!.text)).toContain('1 G, 2 A, 3 B, 4 C, 5 D, 6 E, 7 F#')
    expect(e.steps[2]!.text).toContain('D is note 5')
    expect(e.steps[3]!.text).toContain('capital letters')
    expect(e.steps[4]!.text).toContain('The numeral is **V**')
    expect(e.steps[5]!.text.startsWith('Check')).toBe(true)
  })

  it('explains the raised 7th for the leading-note chord and the major V in a minor key', () => {
    const lead = romanNumeralExample(parseKey('A minor'), chord('G#', 'diminished'))
    expect(lead.steps[2]!.text).toContain('raised 7th')
    expect(lead.steps[4]!.text).toContain('**vii°**')
    const dom = romanNumeralExample(parseKey('A minor'), chord('E', 'major'))
    expect(dom.steps[5]!.text).toContain('G♯')
    expect(dom.steps[5]!.text).toContain('raised 7th')
  })

  it('refuses a chord that is not built on a note of the key', () => {
    expect(() => romanNumeralExample(parseKey('C major'), chord('Bb', 'major'))).toThrow()
  })
})

describe('chordFromNumeralExample', () => {
  it('builds the chord for every numeral in the hand-written table', () => {
    for (const [keyName, rows] of Object.entries(KEYS)) {
      const key = parseKey(keyName)
      for (const row of rows) {
        const e = chordFromNumeralExample(key, row.numeral)
        expect(ascii(e.answer), `${keyName} ${row.numeral}`).toBe(`In ${keyName}, ${row.numeral} is ${row.symbol}: ${row.notes}.`)
      }
    }
  })

  it('stacks every other note of the scale (ii in F major uses notes 2, 4, 6)', () => {
    const e = chordFromNumeralExample(parseKey('F major'), 'ii')
    expect(e.steps[3]!.text).toContain('The note numbers are 2, 4, 6')
    expect(ascii(e.steps[3]!.text)).toContain('**G, Bb, D**')
    expect(e.steps[3]!.staff).toBeDefined()
    expect(e.steps[3]!.listen).toBeDefined()
    expect(e.steps[2]!.text).toContain('it is **G**')
  })

  it('raises the 7th for V in a minor key and says so', () => {
    const e = chordFromNumeralExample(parseKey('A minor'), 'V')
    expect(e.steps[3]!.text).toContain('raised to **G♯**')
    const natural = chordFromNumeralExample(parseKey('A minor'), 'v')
    expect(natural.steps[3]!.text).not.toContain('raised')
  })

  it('refuses numerals it does not cover', () => {
    expect(() => chordFromNumeralExample(parseKey('C major'), 'Viiish')).toThrow()
    expect(() => chordFromNumeralExample(parseKey('C major'), 'v°')).toThrow()
  })
})

describe('primaryChordsExample', () => {
  const EXPECTED: Record<string, string> = {
    'C major': 'I = C, IV = F, V = G',
    'G major': 'I = G, IV = C, V = D',
    'F major': 'I = F, IV = Bb, V = C',
    'Bb major': 'I = Bb, IV = Eb, V = F',
    'D major': 'I = D, IV = G, V = A',
    'A minor': 'i = Am, iv = Dm, V = E',
    'D minor': 'i = Dm, iv = Gm, V = A',
    'E minor': 'i = Em, iv = Am, V = B',
  }
  it('finds I, IV and V (i, iv and V in minor) exactly as the table says', () => {
    for (const [keyName, expected] of Object.entries(EXPECTED)) {
      expect(ascii(primaryChordsExample(parseKey(keyName)).answer), keyName).toContain(expected)
    }
  })

  it('draws all three chords with the key signature and plays them in turn', () => {
    const e = primaryChordsExample(parseKey('Bb major'))
    const last = e.steps.at(-1)!
    expect(last.staff!.items).toHaveLength(3)
    expect(last.staff!.key).toBeDefined()
    expect(last.listen!.audio.events).toHaveLength(3)
    expect(last.listen!.audio.events.map((x) => x.start)).toEqual([0, 1.5, 3])
  })
})
