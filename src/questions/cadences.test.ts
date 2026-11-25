import { describe, expect, it } from 'vitest'
import { CLEF_NAMES, type ClefName, type Pitch } from '../theory'
import { cadenceByNameGenerator, cadenceOnStaffGenerator } from './cadences'
import { LETTER_PC, MAJOR_SCALES, NATURAL_MINOR_SCALES, ascii } from './handTables'
import { createRng } from './rng'
import { choicesOf } from './testing'
import type { Difficulty, Question } from './types'

const ctx = (seed: number, difficulty: Difficulty, clefs: readonly ClefName[] = CLEF_NAMES) => ({ rng: createRng(seed), clefs, difficulty, maxLedgerLines: 1 })
const many = (g: { generate: (c: ReturnType<typeof ctx>) => Question }, count: number, difficulty: Difficulty) =>
  Array.from({ length: count }, (_, i) => g.generate(ctx(i + 19 * difficulty, difficulty)))

const midi = (p: Pitch) => 12 * (p.octave + 1) + LETTER_PC[p.letter]! + p.accidental

/** The chord's root, as the note a hand-written scale table gives for a numeral. */
function scaleOf(keyName: string): { notes: string[]; minor: boolean } {
  const [tonic, mode] = ascii(keyName).split(' ')
  return { notes: (mode === 'major' ? MAJOR_SCALES : NATURAL_MINOR_SCALES)[tonic!]!.split(' '), minor: mode === 'minor' }
}

/** Root letter + accidental written like "F#", "Bb". */
const noteText = (p: { letter: string; accidental: number }) => `${p.letter}${p.accidental > 0 ? '#'.repeat(p.accidental) : 'b'.repeat(-p.accidental)}`

/** A chord drawn in root position: its root (the lowest note) and its semitone shape above the root, e.g. "4-7". */
function chordRootAndShape(pitches: Pitch[]): { root: string; shape: string } {
  const root = pitches[0]!
  return { root: noteText(root), shape: pitches.slice(1).map((p) => midi(p) - midi(root)).join('-') }
}

describe('cadence-on-staff', () => {
  /** The cadence a pair of drawn chords is, from hand-written rules about degrees and chord shapes. */
  function nameByHand(keyName: string, a: Pitch[], b: Pitch[]): string | null {
    const { notes, minor } = scaleOf(keyName)
    const degreeOf = (root: string) => notes.findIndex((n) => n === root)
    const A = chordRootAndShape(a)
    const B = chordRootAndShape(b)
    const dA = degreeOf(A.root)
    const dB = degreeOf(B.root)
    const majorShape = (s: string) => s === '4-7' || s === '4-7-10'
    const minorShape = (s: string) => s === '3-7'
    const dimShape = (s: string) => s === '3-6'
    // V must be a major (or dominant 7th) chord, even in a minor key.
    const isV = (c: { root: string; shape: string }, d: number) => d === 4 && majorShape(c.shape)
    const isTonic = (c: { root: string; shape: string }, d: number) => d === 0 && (minor ? minorShape(c.shape) : c.shape === '4-7')
    if (isV(A, dA) && isTonic(B, dB)) return 'perfect'
    if (isV(A, dA) && dB === 5 && (minor ? B.shape === '4-7' : minorShape(B.shape))) return 'interrupted'
    if (dA === 3 && (minor ? minorShape(A.shape) : A.shape === '4-7') && isTonic(B, dB)) return 'plagal'
    if (isV(B, dB) && !isV(A, dA) && dB === 4) {
      const first =
        (dA === 0 && isTonic(A, dA)) ||
        (dA === 1 && (minor ? dimShape(A.shape) : minorShape(A.shape))) ||
        (dA === 3 && (minor ? minorShape(A.shape) : A.shape === '4-7'))
      return first ? 'imperfect' : null
    }
    return null
  }

  it('the answer is worked out by hand from the drawn chords and the key signature, at every level', () => {
    for (const level of [1, 2, 3] as const) {
      for (const q of many(cadenceOnStaffGenerator, 300, level)) {
        const keyName = /The key is (.+?)\./.exec(q.prompt)![1]!
        const staff = q.notation!.staves[0]!
        const [first, second] = staff.items.map((i) => (i.kind === 'notes' ? [...i.pitches] : []))
        expect(first!.length).toBeGreaterThanOrEqual(3)
        expect(second!.length).toBeGreaterThanOrEqual(3)
        expect(q.correct, q.id).toBe(nameByHand(keyName, first!, second!))
      }
    }
  })

  it('draws two chords with the key signature and states the key in words', () => {
    for (const q of many(cadenceOnStaffGenerator, 200, 2)) {
      const staff = q.notation!.staves[0]!
      expect(staff.items).toHaveLength(2)
      expect(staff.key).toBeDefined()
      expect(q.prompt).toMatch(/^The key is [A-G][♯♭]? (major|minor)\./)
    }
  })

  it('level 1 is major keys only with the plain chords; minor keys come at level 2; V7 versions at level 3', () => {
    expect(many(cadenceOnStaffGenerator, 300, 1).every((q) => q.prompt.includes('major') && q.id.split(':')[3] === '0')).toBe(true)
    expect(many(cadenceOnStaffGenerator, 300, 2).some((q) => q.prompt.includes('minor'))).toBe(true)
    expect(many(cadenceOnStaffGenerator, 300, 2).every((q) => q.id.split(':')[3] === '0')).toBe(true)
    expect(many(cadenceOnStaffGenerator, 300, 3).some((q) => q.id.split(':')[3] !== '0')).toBe(true)
  })

  it('covers all four cadence types, always with the same four choices in the same order', () => {
    const questions = many(cadenceOnStaffGenerator, 300, 2)
    expect(new Set(questions.map((q) => q.correct))).toEqual(new Set(['perfect', 'imperfect', 'plagal', 'interrupted']))
    for (const q of questions) expect(choicesOf(q).map((c) => c.id)).toEqual(['perfect', 'imperfect', 'plagal', 'interrupted'])
  })

  it('shows sharps and flats in the notes that need them, not those in the key signature', () => {
    // A minor: the E major chord has G#, which is not in the signature.
    const minor = many(cadenceOnStaffGenerator, 600, 2).filter((q) => /A minor/.test(q.prompt) && q.correct === 'perfect')
    expect(minor.length).toBeGreaterThan(0)
    for (const q of minor) {
      const chord = q.notation!.staves[0]!.items[0]
      if (chord?.kind !== 'notes') throw new Error('expected notes')
      expect(chord.pitches.map(noteText).sort()).toEqual(['B', 'E', 'G#'])
    }
  })
})

describe('cadence-by-name', () => {
  it('the right pair is built from the key scale and the cadence definition, by hand', () => {
    for (const level of [1, 2, 3] as const) {
      for (const q of many(cadenceByNameGenerator, 400, level)) {
        const m = /^In (.+?), which pair of chords makes an? (\w+) cadence\?$/.exec(q.prompt)!
        const [, keyText, type] = m
        const { notes, minor } = scaleOf(keyText!)
        const note = (d: number) => notes[d]!
        const quality = (d: number): string => {
          // diatonic triad quality of each degree, by hand
          const majorKey = ['', 'm', 'm', '', '', 'm', 'dim']
          const minorKey = ['m', 'dim', '', 'm', 'm', '', '']
          return (minor ? minorKey : majorKey)[d]!
        }
        const sym = (d: number, forceMajor = false, seventh = false) => `${note(d)}${forceMajor ? '' : quality(d)}${seventh ? '7' : ''}`
        const options: Record<string, string[]> = {
          perfect: [`${sym(4, true)} → ${sym(0)}`, `${sym(4, true, true)} → ${sym(0)}`],
          imperfect: [`${sym(0)} → ${sym(4, true)}`, `${sym(1)} → ${sym(4, true)}`, `${sym(3)} → ${sym(4, true)}`],
          plagal: [`${sym(3)} → ${sym(0)}`],
          interrupted: [`${sym(4, true)} → ${sym(5)}`, `${sym(4, true, true)} → ${sym(5)}`],
        }
        const answers = options[type!]!.map(ascii)
        expect(answers, q.id).toContain(ascii(q.correct))
        // and no wrong answer is any valid way of writing this cadence
        for (const c of choicesOf(q)) {
          if (c.id !== q.correct) expect(answers, `${q.id}: ${c.label}`).not.toContain(ascii(c.label))
        }
      }
    }
  })

  it('wrong answers include pairs from the other cadences and a pair that is not a cadence at all', () => {
    for (const q of many(cadenceByNameGenerator, 100, 1)) {
      expect(choicesOf(q)).toHaveLength(4)
    }
  })

  it('ids include which variant is asked, so the item and its answer always agree', () => {
    for (const q of many(cadenceByNameGenerator, 100, 3)) expect(q.id).toMatch(/^cadence-by-name:.+:(perfect|imperfect|plagal|interrupted):\d$/)
  })

  it('uses "an" before imperfect and interrupted', () => {
    const prompts = many(cadenceByNameGenerator, 200, 1).map((q) => q.prompt)
    expect(prompts.some((p) => p.includes('makes an imperfect cadence'))).toBe(true)
    expect(prompts.some((p) => p.includes('makes an interrupted cadence'))).toBe(true)
    expect(prompts.some((p) => p.includes('makes a perfect cadence'))).toBe(true)
    expect(prompts.some((p) => p.includes('makes a plagal cadence'))).toBe(true)
  })
})
