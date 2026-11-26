import { describe, expect, it } from 'vitest'
import { CLEF_NAMES, type ClefName, type Pitch } from '../theory'
import {
  chordNotesGenerator,
  chordSymbolGenerator,
  inversionGenerator,
  romanNumeralGenerator,
  seventhOnStaffGenerator,
  triadOnStaffGenerator,
} from './chords'
import { LETTER_PC, MAJOR_SCALES, NATURAL_MINOR_SCALES, ascii } from './handTables'
import { createRng } from './rng'
import { choicesOf } from './testing'
import type { Difficulty, Question } from './types'

const ctx = (seed: number, difficulty: Difficulty, clefs: readonly ClefName[] = CLEF_NAMES) => ({ rng: createRng(seed), clefs, difficulty, maxLedgerLines: 1 })
const many = (g: { generate: (c: ReturnType<typeof ctx>) => Question }, count: number, difficulty: Difficulty) =>
  Array.from({ length: count }, (_, i) => g.generate(ctx(i + 23 * difficulty, difficulty)))

const ORDER = 'CDEFGAB'
const midi = (p: Pitch) => 12 * (p.octave + 1) + LETTER_PC[p.letter]! + p.accidental
const step = (p: Pitch) => p.octave * 7 + ORDER.indexOf(p.letter)
const noteText = (p: { letter: string; accidental: number }) => `${p.letter}${p.accidental > 0 ? '#'.repeat(p.accidental) : 'b'.repeat(-p.accidental)}`

function chordPitches(q: Question): Pitch[] {
  const item = q.notation!.staves[0]!.items[0]!
  if (item.kind !== 'notes') throw new Error('expected a chord')
  return [...item.pitches]
}

/** Semitones above the lowest note, e.g. "4-7" for a root-position major triad. */
const stackPattern = (pitches: Pitch[]) => pitches.slice(1).map((p) => midi(p) - midi(pitches[0]!)).join('-')

// Hand-written chord shapes (semitones from the root).
const TRIAD_BY_PATTERN: Record<string, string> = { '4-7': 'major', '3-7': 'minor', '3-6': 'diminished', '4-8': 'augmented' }
const SEVENTH_BY_PATTERN: Record<string, string> = {
  '4-7-10': 'dominant 7th',
  '4-7-11': 'major 7th',
  '3-7-10': 'minor 7th',
  '3-6-10': 'half-diminished 7th',
  '3-6-9': 'diminished 7th',
}

/** Chord shapes by quality symbol suffix, for working out what a symbol means. */
const SUFFIX_PATTERN: Record<string, number[]> = {
  '': [0, 4, 7], m: [0, 3, 7], dim: [0, 3, 6], aug: [0, 4, 8], '7': [0, 4, 7, 10], maj7: [0, 4, 7, 11], m7: [0, 3, 7, 10], m7b5: [0, 3, 6, 10], dim7: [0, 3, 6, 9],
}

/** Spells a chord from its symbol by hand: letters a third apart, accidentals to hit the semitones. */
function spellSymbol(symbol: string): { notes: string[]; bass: string } {
  const text = ascii(symbol)
  const [main, slash] = text.split('/')
  const m = /^([A-G])(#|b)?(.*)$/.exec(main!)!
  const rootLetter = m[1]!
  const rootAcc = m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0
  const pattern = SUFFIX_PATTERN[m[3]!]
  if (!pattern) throw new Error(`Unknown chord suffix in ${symbol}`)
  const notes = pattern.map((semis, i) => {
    const letter = ORDER.charAt((ORDER.indexOf(rootLetter) + 2 * i) % 7)
    const targetPc = (((LETTER_PC[rootLetter]! + rootAcc + semis) % 12) + 12) % 12
    let acc = (((targetPc - LETTER_PC[letter]!) % 12) + 12) % 12
    if (acc > 6) acc -= 12
    return `${letter}${acc > 0 ? '#'.repeat(acc) : 'b'.repeat(-acc)}`
  })
  return { notes, bass: slash ?? notes[0]! }
}

describe('triad-on-staff', () => {
  it('the answer matches the semitone shape of the drawn triad, and the triad is stacked in thirds', () => {
    for (const level of [1, 2, 3] as const) {
      for (const q of many(triadOnStaffGenerator, 300, level)) {
        const pitches = chordPitches(q)
        expect(pitches).toHaveLength(3)
        expect(q.correct, q.id).toBe(TRIAD_BY_PATTERN[stackPattern(pitches)])
        expect(step(pitches[1]!) - step(pitches[0]!)).toBe(2)
        expect(step(pitches[2]!) - step(pitches[1]!)).toBe(2)
      }
    }
  })

  it('level 1 has major and minor; level 2 adds diminished; level 3 adds augmented; choices match', () => {
    const set = (level: Difficulty) => new Set(many(triadOnStaffGenerator, 400, level).map((q) => q.correct))
    expect([...set(1)].sort()).toEqual(['major', 'minor'])
    expect([...set(2)].sort()).toEqual(['diminished', 'major', 'minor'])
    expect([...set(3)].sort()).toEqual(['augmented', 'diminished', 'major', 'minor'])
    expect(choicesOf(triadOnStaffGenerator.generate(ctx(1, 1))).map((c) => c.id)).toEqual(['major', 'minor'])
    expect(choicesOf(triadOnStaffGenerator.generate(ctx(1, 3))).map((c) => c.id)).toEqual(['major', 'minor', 'diminished', 'augmented'])
  })

  it('draws the chord in root position', () => {
    for (const q of many(triadOnStaffGenerator, 200, 3)) {
      const pitches = chordPitches(q)
      expect(midi(pitches[0]!)).toBeLessThan(midi(pitches[1]!))
      expect(midi(pitches[1]!)).toBeLessThan(midi(pitches[2]!))
    }
  })
})

describe('seventh-on-staff', () => {
  it('the answer matches the semitone shape of the drawn chord', () => {
    for (const level of [1, 2, 3] as const) {
      for (const q of many(seventhOnStaffGenerator, 300, level)) {
        const pitches = chordPitches(q)
        expect(pitches).toHaveLength(4)
        expect(q.correct, q.id).toBe(SEVENTH_BY_PATTERN[stackPattern(pitches)])
      }
    }
  })

  it('level 1: dominant, major and minor 7th; level 2 adds half-diminished; level 3 adds diminished 7th', () => {
    const set = (level: Difficulty) => new Set(many(seventhOnStaffGenerator, 500, level).map((q) => q.correct))
    expect(set(1).size).toBe(3)
    expect(set(2).size).toBe(4)
    expect(set(3).size).toBe(5)
    expect(set(3).has('diminished 7th')).toBe(true)
    expect(set(2).has('diminished 7th')).toBe(false)
  })
})

describe('chord-notes', () => {
  it('the answer is the chord spelled by hand from its symbol', () => {
    for (const level of [1, 2, 3] as const) {
      for (const q of many(chordNotesGenerator, 300, level)) {
        const symbol = /^Which notes make up (\S+) \(/.exec(q.prompt)![1]!
        expect(ascii(q.correct), q.prompt).toBe(spellSymbol(symbol).notes.join(' '))
      }
    }
  })

  it('wrong answers are never the same spelling, and one is usually a respelling of the right sound', () => {
    const questions = many(chordNotesGenerator, 300, 2)
    let withTwin = 0
    for (const q of questions) {
      const pcs = (label: string) => ascii(label).split(' ').map((n) => (((LETTER_PC[n.charAt(0)]! + (n.match(/#/g) ?? []).length - (n.match(/b/g) ?? []).length) % 12) + 12) % 12).join(',')
      const twins = choicesOf(q).filter((c) => c.id !== q.correct && pcs(c.label) === pcs(q.correct))
      for (const c of twins) expect(c.label).not.toBe(q.correct)
      if (twins.length > 0) withTwin++
    }
    expect(withTwin / questions.length).toBeGreaterThan(0.6)
  })

  it('sevenths and aug/dim chords only appear at the levels that allow them', () => {
    expect(many(chordNotesGenerator, 300, 1).every((q) => /^Which notes make up [A-G]m? \(/.test(q.prompt))).toBe(true)
    expect(many(chordNotesGenerator, 300, 2).every((q) => !/7/.test(q.prompt))).toBe(true)
    expect(many(chordNotesGenerator, 300, 3).some((q) => /7/.test(q.prompt))).toBe(true)
  })
})

describe('chord-symbol', () => {
  it('the drawn notes spell the symbol that is the answer, including the bass note of an inversion', () => {
    for (const level of [1, 2, 3] as const) {
      for (const q of many(chordSymbolGenerator, 400, level)) {
        const pitches = chordPitches(q)
        const spelled = spellSymbol(q.correct)
        // lowest note is the bass; together the notes are the chord
        expect(noteText(pitches[0]!), q.id).toBe(spelled.bass)
        expect(pitches.map(noteText).sort(), q.id).toEqual([...spelled.notes].sort())
        // ascending
        for (let i = 1; i < pitches.length; i++) expect(midi(pitches[i]!)).toBeGreaterThan(midi(pitches[i - 1]!))
      }
    }
  })

  it('inversions (slash chords) and sevenths appear only at the hardest level', () => {
    expect(many(chordSymbolGenerator, 300, 1).every((q) => !q.correct.includes('/') && !q.correct.includes('7'))).toBe(true)
    expect(many(chordSymbolGenerator, 300, 2).every((q) => !q.correct.includes('/') && !q.correct.includes('7'))).toBe(true)
    const l3 = many(chordSymbolGenerator, 400, 3)
    expect(l3.some((q) => q.correct.includes('/'))).toBe(true)
    expect(l3.some((q) => q.correct.includes('7'))).toBe(true)
  })

  it('an inverted chord has its root-position symbol among the wrong answers', () => {
    for (const q of many(chordSymbolGenerator, 300, 3)) {
      if (!q.correct.includes('/')) continue
      expect(choicesOf(q).map((c) => c.label)).toContain(q.correct.split('/')[0])
    }
  })

  it('no wrong answer names the same notes with the same bass note as the drawn chord', () => {
    for (const q of many(chordSymbolGenerator, 300, 3)) {
      const target = spellSymbol(q.correct)
      for (const c of choicesOf(q)) {
        if (c.id === q.correct) continue
        const other = spellSymbol(c.label)
        const sameNotes = [...other.notes].sort().join(',') === [...target.notes].sort().join(',')
        // The root-position symbol of an inverted chord has the same notes but a different bass: that is the point.
        expect(sameNotes && other.bass === target.bass, `${q.id}: ${c.label}`).toBe(false)
      }
    }
  })

  it('at the hardest level the prompt explains how to write an inversion', () => {
    expect(chordSymbolGenerator.generate(ctx(1, 3)).prompt).toContain('slash')
    expect(chordSymbolGenerator.generate(ctx(1, 2)).prompt).not.toContain('slash')
  })
})

describe('inversion', () => {
  it('the answer matches which chord note is lowest, worked out by hand', () => {
    for (const level of [1, 2, 3] as const) {
      for (const q of many(inversionGenerator, 300, level)) {
        const pitches = chordPitches(q)
        const symbol = q.id.split(':').at(-1)!
        const spelled = spellSymbol(symbol)
        const lowest = noteText(pitches[0]!)
        const index = spelled.notes.indexOf(lowest)
        expect(index, q.id).toBeGreaterThanOrEqual(0)
        expect(q.correct).toBe(['root position', 'first inversion', 'second inversion', 'third inversion'][index])
        expect(pitches.map(noteText).sort()).toEqual([...spelled.notes].sort())
      }
    }
  })

  it('triads at levels 1 and 2 (three choices), sevenths at level 3 (four choices including third inversion)', () => {
    expect(choicesOf(inversionGenerator.generate(ctx(1, 1))).map((c) => c.id)).toEqual(['root position', 'first inversion', 'second inversion'])
    expect(choicesOf(inversionGenerator.generate(ctx(1, 3))).map((c) => c.id)).toEqual(['root position', 'first inversion', 'second inversion', 'third inversion'])
    expect(many(inversionGenerator, 400, 3).some((q) => q.correct === 'third inversion')).toBe(true)
    expect(many(inversionGenerator, 400, 2).every((q) => q.correct !== 'third inversion')).toBe(true)
  })

  it('covers all inversions', () => {
    expect(new Set(many(inversionGenerator, 300, 2).map((q) => q.correct)).size).toBe(3)
  })
})

describe('roman-numeral', () => {
  const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII']

  /** The numeral worked out by hand from the drawn chord and the key's scale table. */
  function numeralByHand(keyName: string, pitches: Pitch[]): string {
    const [tonic, mode] = ascii(keyName).split(' ')
    const scale = (mode === 'major' ? MAJOR_SCALES : NATURAL_MINOR_SCALES)[tonic!]!.split(' ')
    const root = pitches[0]!
    const degree = scale.findIndex((n) => n.charAt(0) === root.letter)
    const ref = scale[degree]!
    const refAcc = (ref.match(/#/g) ?? []).length - (ref.match(/b/g) ?? []).length
    const delta = root.accidental - refAcc
    const pattern = pitches.slice(1).map((p) => midi(p) - midi(root)).join('-')
    const kind = ({ '4-7': 'major', '3-7': 'minor', '3-6': 'dim', '4-8': 'aug', '4-7-10': 'dom7', '3-7-10': 'min7', '3-6-10': 'hdim7', '4-7-11': 'maj7', '3-6-9': 'dim7' } as Record<string, string>)[pattern]!
    let prefix = delta === 1 ? '♯' : delta === -1 ? '♭' : ''
    if (mode === 'minor' && degree === 6 && delta === 1 && ['dim', 'hdim7', 'dim7'].includes(kind)) prefix = ''
    const lower = ['minor', 'dim', 'min7', 'hdim7', 'dim7'].includes(kind)
    const letters = lower ? ROMAN[degree]!.toLowerCase() : ROMAN[degree]!
    const suffix = { major: '', minor: '', dim: '°', aug: '+', dom7: '7', min7: '7', hdim7: 'ø7', maj7: 'maj7', dim7: '°7' }[kind]!
    return prefix + letters + suffix
  }

  it('numeral questions: the answer is worked out by hand from the drawn chord and the key', () => {
    let checked = 0
    for (const level of [1, 2, 3] as const) {
      for (const q of many(romanNumeralGenerator, 500, level)) {
        if (!q.id.startsWith('roman-numeral:numeral:')) continue
        const keyName = /The key is (.+?)\./.exec(q.prompt)![1]!
        expect(q.notation!.staves[0]!.key).toBeDefined()
        expect(q.correct, `${q.id}`).toBe(numeralByHand(keyName, chordPitches(q)))
        checked++
      }
    }
    expect(checked).toBeGreaterThan(300)
  })

  it('chord questions: the answer chord is what the numeral means, worked out by hand', () => {
    let checked = 0
    for (const level of [1, 2, 3] as const) {
      for (const q of many(romanNumeralGenerator, 500, level)) {
        if (!q.id.startsWith('roman-numeral:chord:')) continue
        const m = /^In (.+?), which chord is (.+)\?$/.exec(q.prompt)!
        const [, keyName, numeral] = m
        const [tonic, mode] = ascii(keyName!).split(' ')
        const scale = (mode === 'major' ? MAJOR_SCALES : NATURAL_MINOR_SCALES)[tonic!]!.split(' ')
        const degree = ROMAN.indexOf(numeral!.replace(/[^IViv]/g, '').toUpperCase())
        let root = scale[degree]!
        const lowerCase = /[iv]/.test(numeral!.replace(/[^IViv]/g, ''))
        // A plain vii° in a minor key sits on the raised 7th.
        if (mode === 'minor' && degree === 6 && numeral!.startsWith('vii') && (numeral!.includes('°') || numeral!.includes('ø'))) {
          root = root.includes('b') ? root.slice(0, -1) : `${root}#`
        }
        const suffix = numeral!.includes('°7') ? 'dim7' : numeral!.includes('ø') ? 'm7b5' : numeral!.includes('°') ? 'dim' : numeral!.endsWith('7') ? (lowerCase ? 'm7' : '7') : numeral!.includes('maj7') ? 'maj7' : lowerCase ? 'm' : ''
        expect(ascii(q.correct), q.id).toBe(`${root}${suffix}`)
        checked++
      }
    }
    expect(checked).toBeGreaterThan(300)
  })

  it('offers the same numeral with the other case as a wrong answer (ii vs II)', () => {
    for (const q of many(romanNumeralGenerator, 400, 2)) {
      if (!q.id.startsWith('roman-numeral:numeral:')) continue
      const labels = choicesOf(q).map((c) => c.label)
      const letters = q.correct.replace(/[♯♭]/, '').match(/^[IViv]+/)![0]
      const swapped = letters === letters.toUpperCase() ? letters.toLowerCase() : letters.toUpperCase()
      expect(labels.some((l) => l.replace(/[♯♭]/, '').startsWith(swapped) && l.replace(/[^IViv]/g, '') === swapped)).toBe(true)
    }
  })

  it('level 1 uses major keys only, and only the common chords', () => {
    for (const q of many(romanNumeralGenerator, 300, 1)) {
      const key = /(?:key is|In) ([A-G][♯♭]? (?:major|minor))/.exec(q.prompt)![1]!
      expect(key.endsWith('major')).toBe(true)
      expect(['I', 'ii', 'IV', 'V', 'vi']).toContain(q.id.startsWith('roman-numeral:numeral:') ? q.correct : q.id.split(':').at(-1))
    }
  })

  it('minor keys appear from level 2; sevenths only at level 3', () => {
    expect(many(romanNumeralGenerator, 300, 2).some((q) => q.prompt.includes('minor'))).toBe(true)
    expect(many(romanNumeralGenerator, 400, 2).every((q) => !q.id.includes('7'))).toBe(true)
    expect(many(romanNumeralGenerator, 600, 3).some((q) => q.id.endsWith('7'))).toBe(true)
  })
})

describe('chord roots', () => {
  it('never uses roots that nobody writes chords on (B♯, E♯, C♭, F♭)', () => {
    for (const g of [triadOnStaffGenerator, seventhOnStaffGenerator, chordNotesGenerator, chordSymbolGenerator, inversionGenerator]) {
      for (const level of [1, 2, 3] as const) {
        for (const q of many(g, 300, level)) {
          expect(q.itemLabel, q.id).not.toMatch(/^(B♯|E♯|C♭|F♭)/)
          expect(q.correct, q.id).not.toMatch(/^(B♯|E♯|C♭|F♭)/)
        }
      }
    }
  })
})

describe('chord readability', () => {
  it('no chord has more than one sharp or flat on any note, except the diminished 7th (which needs double flats)', () => {
    for (const g of [triadOnStaffGenerator, seventhOnStaffGenerator, chordSymbolGenerator, inversionGenerator]) {
      for (const q of many(g, 400, 3)) {
        const pitches = chordPitches(q)
        const dim7 = q.id.includes('dim7')
        for (const p of pitches) expect(Math.abs(p.accidental), `${q.id}`).toBeLessThanOrEqual(dim7 ? 2 : 1)
      }
    }
  })
})
