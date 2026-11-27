import { describe, expect, it } from 'vitest'
import { parseNote } from '../../../theory'
import { keyNames, semitoneCountExample, semitoneTableRows, toneOrSemitoneExample, toneWords } from './semitones'

const text = (steps: readonly { title?: string; text: string; result?: string }[]) => steps.map((s) => [s.title, s.text, s.result].join(' ')).join(' ')

// Hand-written: the twelve keys of an octave, numbered from C.
const KEYS = ['C', 'C♯/D♭', 'D', 'D♯/E♭', 'E', 'F', 'F♯/G♭', 'G', 'G♯/A♭', 'A', 'A♯/B♭', 'B']
const WHITE = [0, 2, 4, 5, 7, 9, 11]

describe('keyNames and semitoneTableRows', () => {
  it('match the hand-written table', () => {
    expect(Array.from({ length: 12 }, (_, n) => keyNames(n))).toEqual(KEYS)
    expect(semitoneTableRows()).toEqual(KEYS.map((names, n) => [String(n), names, WHITE.includes(n) ? 'white' : 'black']))
    expect(() => keyNames(12)).toThrow()
  })
})

describe('toneWords', () => {
  it('says semitones as tones', () => {
    expect([1, 2, 3, 4, 7].map(toneWords)).toEqual(['a semitone', 'a tone', 'a tone and a semitone', '2 tones', '3 tones and a semitone'])
  })
})

// Hand-counted going up, key by key on a piano.
const COUNTS: [from: string, to: string, semitones: number][] = [
  ['C', 'G', 7],
  ['E', 'G', 3],
  ['B', 'Db', 2],
  ['E', 'F', 1],
  ['B', 'C', 1],
  ['F', 'G', 2],
  ['C', 'C#', 1],
  ['A', 'C', 3],
  ['D', 'C', 10],
  ['G', 'F', 10],
  ['Bb', 'D', 4],
  ['F#', 'A', 3],
]

describe('semitoneCountExample', () => {
  it('counts the hand-written number of semitones', () => {
    for (const [from, to, n] of COUNTS) {
      const e = semitoneCountExample(parseNote(from), parseNote(to))
      expect(e.answer, `${from} to ${to}`).toMatch(new RegExp(`^There ${n === 1 ? 'is' : 'are'} ${n} semitones? from `))
      expect(e.steps.map((s) => s.result), `${from} to ${to}`).toContain(`${n} semitone${n === 1 ? '' : 's'}`)
      expect(e.steps.at(-1)!.result, `${from} to ${to}`).toBe(`${n} key${n === 1 ? '' : 's'}, so ${n} semitone${n === 1 ? '' : 's'}`)
      expect(e.steps.find((s) => s.staff)!.staff!.items).toHaveLength(2)
      expect(e.steps.at(-1)!.title!.startsWith('Check')).toBe(true)
    }
  })

  it('crosses the B to C gap by adding 12 (B to D♭: 1 + 12 = 13, 13 − 11 = 2)', () => {
    const all = text(semitoneCountExample(parseNote('B'), parseNote('Db')).steps)
    expect(all).toContain('2 − 1 = 1')
    expect(all).toContain('Count D♭ as 1 + 12 = 13')
    expect(all).toContain('13 − 11 = 2')
    expect(all).toContain('1 C, 2 D♭')
  })

  it('counts key by key without the starting key (E to G: F, F♯, G)', () => {
    expect(text(semitoneCountExample(parseNote('E'), parseNote('G')).steps)).toContain('1 F, 2 F♯, 3 G')
    expect(text(semitoneCountExample(parseNote('C'), parseNote('G')).steps)).toContain('7 ÷ 2 = 3, with 1 left over')
  })

  it('refuses two names for the same key', () => {
    expect(() => semitoneCountExample(parseNote('F#'), parseNote('Gb'))).toThrow()
    expect(() => semitoneCountExample(parseNote('C'), parseNote('C'))).toThrow()
  })
})

describe('toneOrSemitoneExample', () => {
  const TONE_OR_SEMITONE: [string, string, string][] = [
    ['E', 'F', 'semitone'],
    ['B', 'C', 'semitone'],
    ['C', 'D', 'tone'],
    ['F', 'G', 'tone'],
    ['G', 'A', 'tone'],
    ['A', 'B', 'tone'],
    ['F', 'F#', 'semitone'],
    ['Bb', 'C', 'tone'],
  ]
  it('matches the hand-written tones and semitones', () => {
    for (const [a, b, kind] of TONE_OR_SEMITONE) {
      const e = toneOrSemitoneExample(parseNote(a), parseNote(b))
      expect(e.answer, `${a} to ${b}`).toBe(`It is a ${kind}.`)
      expect(e.steps.at(-1)!.title!.startsWith('Check')).toBe(true)
      expect(e.steps.at(-1)!.result, `${a} to ${b}`).toBe(kind === 'semitone' ? 'No key between: a semitone' : 'One key between: a tone')
    }
  })
  it('refuses steps bigger than a tone', () => {
    expect(() => toneOrSemitoneExample(parseNote('C'), parseNote('E'))).toThrow()
  })
})
