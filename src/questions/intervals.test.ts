import { describe, expect, it } from 'vitest'
import { CLEF_NAMES, type ClefName, type Pitch } from '../theory'
import { LETTER_PC } from './handTables'
import { intervalAboveGenerator, intervalOnStaffGenerator } from './intervals'
import { createRng } from './rng'
import { choicesOf } from './testing'
import type { Difficulty, Question } from './types'

const ctx = (seed: number, difficulty: Difficulty, clefs: readonly ClefName[] = CLEF_NAMES) => ({ rng: createRng(seed), clefs, difficulty, maxLedgerLines: 1 })
const many = (g: { generate: (c: ReturnType<typeof ctx>) => Question }, count: number, difficulty: Difficulty) =>
  Array.from({ length: count }, (_, i) => g.generate(ctx(i + 29 * difficulty, difficulty)))

// Hand-written: what each (letter count, semitones) pair is called.
const NAME: Record<string, string> = {
  '2-1': 'minor 2nd', '2-2': 'major 2nd', '3-3': 'minor 3rd', '3-4': 'major 3rd', '4-5': 'perfect 4th', '4-6': 'augmented 4th',
  '5-6': 'diminished 5th', '5-7': 'perfect 5th', '6-8': 'minor 6th', '6-9': 'major 6th', '7-10': 'minor 7th', '7-11': 'major 7th', '8-12': 'perfect octave',
}
const ORDINAL: Record<number, string> = { 2: '2nd', 3: '3rd', 4: '4th', 5: '5th', 6: '6th', 7: '7th', 8: 'octave' }
const SEMIS: Record<string, number> = { m2: 1, M2: 2, m3: 3, M3: 4, P4: 5, A4: 6, d5: 6, P5: 7, m6: 8, M6: 9, m7: 10, M7: 11, P8: 12, A5: 8 }
const ORDER = 'CDEFGAB'
const step = (p: Pitch) => p.octave * 7 + ORDER.indexOf(p.letter)
const midi = (p: Pitch) => 12 * (p.octave + 1) + LETTER_PC[p.letter]! + p.accidental

function pitchesOf(q: Question): [Pitch, Pitch, 'harmonic' | 'melodic'] {
  const items = q.notation!.staves[0]!.items
  if (items.length === 1) {
    const item = items[0]!
    if (item.kind !== 'notes' || item.pitches.length !== 2) throw new Error('bad harmonic interval')
    return [item.pitches[0]!, item.pitches[1]!, 'harmonic']
  }
  const [a, b] = items
  if (a?.kind !== 'notes' || b?.kind !== 'notes' || items.length !== 2) throw new Error('bad melodic interval')
  return [a.pitches[0]!, b.pitches[0]!, 'melodic']
}

describe('interval-on-staff', () => {
  it('the answer is the right name for the two drawn notes, checked with hand-written tables', () => {
    for (const level of [1, 2, 3] as const) {
      for (const q of many(intervalOnStaffGenerator, 400, level)) {
        const [lower, upper] = pitchesOf(q)
        const count = step(upper) - step(lower) + 1
        const semis = midi(upper) - midi(lower)
        if (level === 1) {
          expect(q.correct, q.id).toBe(ORDINAL[count])
        } else {
          expect(q.correct, q.id).toBe(NAME[`${count}-${semis}`])
        }
      }
    }
  })

  it('level 1 uses natural notes only; level 2 as well, without the tritone; level 3 may use sharps and flats', () => {
    for (const q of many(intervalOnStaffGenerator, 300, 1)) {
      const [a, b] = pitchesOf(q)
      expect(a.accidental).toBe(0)
      expect(b.accidental).toBe(0)
    }
    for (const q of many(intervalOnStaffGenerator, 400, 2)) {
      const [a, b] = pitchesOf(q)
      expect(a.accidental).toBe(0)
      expect(b.accidental).toBe(0)
      expect(['augmented 4th', 'diminished 5th']).not.toContain(q.correct)
    }
    const l3 = many(intervalOnStaffGenerator, 600, 3)
    expect(l3.some((q) => pitchesOf(q)[0].accidental !== 0)).toBe(true)
    expect(l3.some((q) => q.correct === 'augmented 4th' || q.correct === 'diminished 5th')).toBe(true)
  })

  it('shows both melodic (one after the other) and harmonic (together) intervals, and the prompt says which', () => {
    const questions = many(intervalOnStaffGenerator, 300, 2)
    for (const q of questions) {
      const kind = pitchesOf(q)[2]
      expect(q.prompt).toContain(kind === 'harmonic' ? 'sound together' : 'One after the other')
      expect(q.id).toContain(`:${kind}:`)
    }
    expect(new Set(questions.map((q) => pitchesOf(q)[2])).size).toBe(2)
  })

  it('the lower note is always first and the notes always go upward', () => {
    for (const level of [1, 2, 3] as const) {
      for (const q of many(intervalOnStaffGenerator, 200, level)) {
        const [lower, upper] = pitchesOf(q)
        expect(step(upper)).toBeGreaterThan(step(lower) - 1)
        expect(midi(upper)).toBeGreaterThanOrEqual(midi(lower))
      }
    }
  })

  it('for major and minor intervals, the other one of the pair is always a wrong answer (so quality must be judged)', () => {
    let checked = 0
    for (const q of many(intervalOnStaffGenerator, 400, 2)) {
      const [quality, number] = q.correct.split(' ')
      if (quality !== 'major' && quality !== 'minor') continue
      const twin = `${quality === 'major' ? 'minor' : 'major'} ${number}`
      expect(choicesOf(q).map((c) => c.label), q.id).toContain(twin)
      checked++
    }
    expect(checked).toBeGreaterThan(100)
  })

  it('ids differ for the number-only and quality versions of the same notes', () => {
    const ids1 = new Set(many(intervalOnStaffGenerator, 100, 1).map((q) => q.id))
    const ids2 = new Set(many(intervalOnStaffGenerator, 100, 2).map((q) => q.id))
    for (const id of ids1) expect(ids2.has(id)).toBe(false)
  })
})

describe('interval-above', () => {
  /** Works out the answer by hand from the prompt: count letters, then fix the accidental by semitones. */
  function oracle(q: Question): string {
    const m = /^What note is an? (.+?) (above|below) ([A-G][♯♭]?)\?$/.exec(q.prompt)!
    const [, name, dir, start] = m
    const short = Object.entries({ m2: 'minor 2nd', M2: 'major 2nd', m3: 'minor 3rd', M3: 'major 3rd', P4: 'perfect 4th', A4: 'augmented 4th', d5: 'diminished 5th', P5: 'perfect 5th', m6: 'minor 6th', M6: 'major 6th', m7: 'minor 7th', M7: 'major 7th', P8: 'perfect octave' }).find(([, v]) => v === name)![0]
    const number = short === 'P8' ? 8 : Number(short.slice(1))
    const sign = dir === 'above' ? 1 : -1
    const startLetter = start!.charAt(0)
    const startAcc = start!.includes('♯') ? 1 : start!.includes('♭') ? -1 : 0
    const letter = ORDER.charAt((((ORDER.indexOf(startLetter) + sign * (number - 1)) % 7) + 7) % 7)
    const targetPc = (((LETTER_PC[startLetter]! + startAcc + sign * SEMIS[short]!) % 12) + 12) % 12
    let acc = (((targetPc - LETTER_PC[letter]!) % 12) + 12) % 12
    if (acc > 6) acc -= 12
    return `${letter}${acc === 1 ? '♯' : acc === -1 ? '♭' : acc === 0 ? '' : `?${acc}`}`
  }

  it('the answer is worked out the long way and agrees, at every level', () => {
    for (const level of [1, 2, 3] as const) {
      for (const q of many(intervalAboveGenerator, 500, level)) {
        expect(q.correct, q.prompt).toBe(oracle(q))
      }
    }
  })

  it('offers the same sound with the wrong spelling as a wrong answer, most of the time', () => {
    const questions = many(intervalAboveGenerator, 400, 2)
    const pcOf = (label: string) => (((LETTER_PC[label.charAt(0)]! + (label.includes('♯') ? 1 : label.includes('♭') ? -1 : 0)) % 12) + 12) % 12
    const withTwin = questions.filter((q) => choicesOf(q).some((c) => c.id !== q.correct && pcOf(c.label) === pcOf(q.correct)))
    expect(withTwin.length / questions.length).toBeGreaterThan(0.4)
  })

  it('level 1: natural start notes and the four simplest intervals; downward intervals only at level 3', () => {
    for (const q of many(intervalAboveGenerator, 300, 1)) {
      expect(/ (above) [A-G]\?$/.test(q.prompt)).toBe(true)
      expect(q.prompt).toMatch(/major 2nd|major 3rd|perfect 4th|perfect 5th/)
    }
    expect(many(intervalAboveGenerator, 300, 2).every((q) => q.prompt.includes('above'))).toBe(true)
    expect(many(intervalAboveGenerator, 300, 3).some((q) => q.prompt.includes('below'))).toBe(true)
  })

  it('every answer has at most one sharp or flat', () => {
    for (const q of many(intervalAboveGenerator, 500, 3)) {
      expect(q.correct).toMatch(/^[A-G][♯♭]?$/)
      for (const c of choicesOf(q)) expect(c.label).toMatch(/^[A-G][♯♭]?$/)
    }
  })
})
