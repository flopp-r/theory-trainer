import { describe, expect, it } from 'vitest'
import { CLEF_NAMES, type ClefName, type Pitch, staffPlacement } from '../theory'
import { clefCompareGenerator, noteAccidentalGenerator, placeNoteGenerator } from './notes'
import { createRng } from './rng'
import type { Difficulty, Question } from './types'
import { choicesOf } from './testing'

const ctx = (seed: number, difficulty: Difficulty, clefs: readonly ClefName[] = CLEF_NAMES, maxLedgerLines = 1) => ({
  rng: createRng(seed),
  clefs,
  difficulty,
  maxLedgerLines,
})
const many = (g: { generate: (c: ReturnType<typeof ctx>) => Question }, count: number, difficulty: Difficulty, clefs?: readonly ClefName[], ledger?: number) =>
  Array.from({ length: count }, (_, i) => g.generate(ctx(i + 31 * difficulty, difficulty, clefs, ledger)))

// Hand-written: the note each clef is built around, and the staff position it sits on.
const ANCHOR: Record<ClefName, [letter: string, octave: number, position: number]> = {
  treble: ['G', 4, 2],
  bass: ['F', 3, 6],
  alto: ['C', 4, 4],
  tenor: ['C', 4, 6],
}
const ORDER = 'CDEFGAB'
const step = (letter: string, octave: number) => octave * 7 + ORDER.indexOf(letter)
const positionOf = (clef: ClefName, letter: string, octave: number) => {
  const [al, ao, ap] = ANCHOR[clef]
  return ap + step(letter, octave) - step(al, ao)
}
const MIDI: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 }
const midi = (p: Pitch) => 12 * (p.octave + 1) + MIDI[p.letter]! + p.accidental

function notesOf(q: Question, staff = 0): Pitch[] {
  const item = q.notation!.staves[staff]!.items[0]!
  if (item.kind !== 'notes') throw new Error('expected a note')
  return [...item.pitches]
}

describe('note-accidental', () => {
  it('the answer spells the drawn note, with the right sign, in every clef', () => {
    for (const level of [1, 2, 3] as const) {
      for (const q of many(noteAccidentalGenerator, 200, level)) {
        const [pitch] = notesOf(q)
        const sign = { '1': '♯', '-1': '♭', '2': '♯♯', '-2': '♭♭' }[String(pitch!.accidental)]
        expect(pitch!.accidental).not.toBe(0)
        expect(q.correct).toBe(`${pitch!.letter}${sign}`)
        // the staff position is the natural letter's, found by counting from the clef anchor
        const clef = q.notation!.staves[0]!.clef
        expect(ORDER.charAt((((positionOf(clef, pitch!.letter, pitch!.octave) - ANCHOR[clef][2] + ORDER.indexOf(ANCHOR[clef][0])) % 7) + 7) % 7)).toBe(pitch!.letter)
      }
    }
  })

  it('double accidentals only at the hardest level', () => {
    expect(many(noteAccidentalGenerator, 300, 1).every((q) => Math.abs(notesOf(q)[0]!.accidental) === 1)).toBe(true)
    expect(many(noteAccidentalGenerator, 300, 2).every((q) => Math.abs(notesOf(q)[0]!.accidental) === 1)).toBe(true)
    expect(many(noteAccidentalGenerator, 600, 3).some((q) => Math.abs(notesOf(q)[0]!.accidental) === 2)).toBe(true)
  })

  it('always offers the natural note and the opposite accidental as wrong answers (the classic slips)', () => {
    for (const q of many(noteAccidentalGenerator, 300, 2)) {
      const [pitch] = notesOf(q)
      const labels = choicesOf(q).map((c) => c.label)
      expect(labels).toContain(pitch!.letter) // the natural
      expect(labels).toContain(`${pitch!.letter}${pitch!.accidental > 0 ? '♭' : '♯'}`)
    }
  })

  it('stays within one ledger line', () => {
    for (const q of many(noteAccidentalGenerator, 300, 2, CLEF_NAMES, 3)) {
      const staff = q.notation!.staves[0]!
      expect(staffPlacement(notesOf(q)[0]!, staff.clef).ledgerLines).toBeLessThanOrEqual(1)
    }
  })
})

describe('clef-compare', () => {
  it('the answer matches the sound of the two notes, computed by hand', () => {
    for (const level of [1, 2, 3] as const) {
      for (const q of many(clefCompareGenerator, 300, level)) {
        const top = notesOf(q, 0)[0]!
        const bottom = notesOf(q, 1)[0]!
        const diff = midi(bottom) - midi(top)
        const expected = diff === 0 ? 'Yes, the same pitch' : diff > 0 ? 'No, the lower staff’s note is higher' : 'No, the lower staff’s note is lower'
        expect(q.correct).toBe(expected)
        expect(choicesOf(q)).toHaveLength(3)
      }
    }
  })

  it('uses two different clefs, and about half the questions are the same pitch', () => {
    const questions = many(clefCompareGenerator, 600, 2)
    let same = 0
    for (const q of questions) {
      expect(q.notation!.staves).toHaveLength(2)
      expect(q.notation!.staves[0]!.clef).not.toBe(q.notation!.staves[1]!.clef)
      if (q.correct.startsWith('Yes')) same++
    }
    expect(same).toBeGreaterThan(220)
    expect(same).toBeLessThan(380)
  })

  it('the different-pitch questions are the classic trap: both notes sit in the same place on their staves', () => {
    for (const q of many(clefCompareGenerator, 400, 2)) {
      if (q.correct.startsWith('Yes')) continue
      const [c1, c2] = [q.notation!.staves[0]!.clef, q.notation!.staves[1]!.clef]
      const [t, b] = [notesOf(q, 0)[0]!, notesOf(q, 1)[0]!]
      expect(positionOf(c1, t.letter, t.octave)).toBe(positionOf(c2, b.letter, b.octave))
    }
  })

  it('the same-pitch questions really are the same sound but written in different places', () => {
    for (const q of many(clefCompareGenerator, 400, 2)) {
      if (!q.correct.startsWith('Yes')) continue
      const [c1, c2] = [q.notation!.staves[0]!.clef, q.notation!.staves[1]!.clef]
      const [t, b] = [notesOf(q, 0)[0]!, notesOf(q, 1)[0]!]
      expect(midi(t)).toBe(midi(b))
      expect(positionOf(c1, t.letter, t.octave) - ANCHOR[c1][2]).toBe(step(t.letter, t.octave) - step(ANCHOR[c1][0], ANCHOR[c1][1]))
      expect(positionOf(c2, b.letter, b.octave)).toBeGreaterThanOrEqual(-3)
      expect(positionOf(c2, b.letter, b.octave)).toBeLessThanOrEqual(11)
    }
  })

  it('with a single clef chosen it still brings in a second clef', () => {
    for (const q of many(clefCompareGenerator, 100, 1, ['alto'])) {
      expect(q.notation!.staves[0]!.clef).toBe('alto')
      expect(q.notation!.staves[1]!.clef).not.toBe('alto')
    }
  })
})

describe('place-note', () => {
  it('the answer is the staff position of the named note, counted by hand', () => {
    for (const level of [1, 2, 3] as const) {
      for (const q of many(placeNoteGenerator, 300, level, CLEF_NAMES, 3)) {
        const match = /^Tap where ([A-G])(\d)/.exec(q.prompt)!
        expect(q.input.kind).toBe('tap-staff')
        if (q.input.kind !== 'tap-staff') continue
        expect(q.correct).toBe(String(positionOf(q.input.clef, match[1]!, Number(match[2]))))
      }
    }
  })

  it('shows an empty staff in the right clef and respects the ledger-line setting', () => {
    for (const ledger of [0, 1, 2, 3]) {
      const positions = new Set<number>()
      for (const q of many(placeNoteGenerator, 1500, 2, ['treble'], ledger)) {
        expect(q.notation!.staves[0]!.items).toEqual([])
        expect(q.notation!.staves[0]!.clef).toBe('treble')
        positions.add(Number(q.correct))
      }
      expect(Math.min(...positions)).toBe(-(2 * ledger + 1))
      expect(Math.max(...positions)).toBe(8 + 2 * ledger + 1)
    }
  })

  it('the explanation says where it goes in words', () => {
    const q = placeNoteGenerator.generate(ctx(1, 2, ['treble']))
    expect(q.explanation).toContain(q.answerText.replace(/^.* goes on /, '').replace(/\.$/, ''))
    const e4 = many(placeNoteGenerator, 600, 2, ['treble'], 0).find((x) => x.prompt.startsWith('Tap where E4'))!
    expect(e4.answerText).toBe('E4 goes on the bottom line.')
    const c4 = many(placeNoteGenerator, 600, 2, ['alto'], 0).find((x) => x.prompt.startsWith('Tap where C4'))!
    expect(c4.answerText).toBe('C4 (middle C) goes on the middle line.')
    const g4 = many(placeNoteGenerator, 600, 2, ['treble'], 0).find((x) => x.prompt.startsWith('Tap where G4'))!
    expect(g4.answerText).toBe('G4 goes on the 2nd line.')
  })

  it('tells the learner that middle C is C4, either in the hint or by naming it', () => {
    for (const q of many(placeNoteGenerator, 200, 1)) {
      expect(q.prompt.includes('Middle C is C4') || q.prompt.includes('(middle C)'), q.prompt).toBe(true)
    }
  })
})
