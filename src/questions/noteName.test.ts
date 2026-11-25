import { describe, expect, it } from 'vitest'
import { CLEF_NAMES, type ClefName, formatPitch, staffPlacement, staffPosition } from '../theory'
import { explainNoteName, generateNoteNameQuestion, noteNameItemId } from './noteName'
import { createRng } from './rng'

/**
 * An independent way to name a note on the staff: start from the line every clef is built
 * around and count letters. Facts: treble G = 2nd line; bass F = 4th line; alto C = middle line;
 * tenor C = 4th line. (Written without using the theory engine's octave arithmetic.)
 */
const ANCHOR: Record<ClefName, [letter: string, position: number]> = {
  treble: ['G', 2],
  bass: ['F', 6],
  alto: ['C', 4],
  tenor: ['C', 6],
}
const LETTER_ORDER = 'CDEFGAB'
function answerByCounting(clef: ClefName, position: number): string {
  const [letter, anchorPosition] = ANCHOR[clef]
  const index = (((LETTER_ORDER.indexOf(letter) + position - anchorPosition) % 7) + 7) % 7
  return LETTER_ORDER.charAt(index)
}

function many(count: number, seed: number, options: Parameters<typeof generateNoteNameQuestion>[1]) {
  const rng = createRng(seed)
  return Array.from({ length: count }, () => generateNoteNameQuestion(rng, options))
}

describe('generateNoteNameQuestion', () => {
  it('is repeatable for a given seed', () => {
    const options = { clefs: CLEF_NAMES, maxLedgerLines: 2 }
    expect(many(30, 123, options)).toEqual(many(30, 123, options))
    expect(many(30, 123, options)).not.toEqual(many(30, 124, options))
  })

  it('the correct answer always matches an independent count from the clef anchor', () => {
    for (const q of many(3000, 1, { clefs: CLEF_NAMES, maxLedgerLines: 3 })) {
      const notation = q.notation
      expect(notation).not.toBeNull()
      const pitch = notation!.notes[0]!
      const position = staffPosition(pitch, notation!.clef)
      expect(q.correct, q.id).toBe(answerByCounting(notation!.clef, position))
      expect(q.correct).toBe(pitch.letter)
    }
  })

  it('the correct answer is always one of the choices, with seven distinct choices A to G', () => {
    for (const q of many(500, 2, { clefs: CLEF_NAMES, maxLedgerLines: 3 })) {
      const ids = q.input.choices.map((c) => c.id)
      expect(ids).toEqual(['A', 'B', 'C', 'D', 'E', 'F', 'G'])
      expect(ids).toContain(q.correct)
      expect(q.input.kind).toBe('multiple-choice')
    }
  })

  it('every question shows one natural note in a single clef', () => {
    for (const q of many(500, 3, { clefs: ['alto'], maxLedgerLines: 2 })) {
      expect(q.notation?.clef).toBe('alto')
      expect(q.notation?.notes).toHaveLength(1)
      expect(q.notation?.notes[0]?.accidental).toBe(0)
    }
  })

  it('only uses the chosen clefs, and uses all of them', () => {
    const questions = many(600, 4, { clefs: ['bass', 'tenor'], maxLedgerLines: 1 })
    const used = new Set(questions.map((q) => q.notation?.clef))
    expect(used).toEqual(new Set(['bass', 'tenor']))
  })

  it('respects the ledger line limit', () => {
    for (const limit of [0, 1, 2, 3]) {
      const seen = new Set<number>()
      for (const q of many(2000, 5 + limit, { clefs: CLEF_NAMES, maxLedgerLines: limit })) {
        const pitch = q.notation!.notes[0]!
        const placement = staffPlacement(pitch, q.notation!.clef)
        expect(placement.ledgerLines).toBeLessThanOrEqual(limit)
        seen.add(placement.ledgerLines)
      }
      // and the limit is actually reached
      expect(Math.max(...seen)).toBe(limit)
    }
  })

  it('with no ledger lines, only staff lines/spaces and the spaces just outside are used', () => {
    for (const q of many(1000, 9, { clefs: CLEF_NAMES, maxLedgerLines: 0 })) {
      const position = staffPosition(q.notation!.notes[0]!, q.notation!.clef)
      expect(position).toBeGreaterThanOrEqual(-1)
      expect(position).toBeLessThanOrEqual(9)
    }
  })

  it('covers every pitch available in a clef', () => {
    const seen = new Set(many(5000, 11, { clefs: ['treble'], maxLedgerLines: 2 }).map((q) => q.id))
    // positions -5 .. 13 = 19 notes
    expect(seen.size).toBe(19)
  })

  it('item ids are stable and name the clef and pitch', () => {
    const q = many(1, 12, { clefs: ['alto'], maxLedgerLines: 0 })[0]!
    const pitch = q.notation!.notes[0]!
    expect(q.id).toBe(`note-name:alto:${formatPitch(pitch)}`)
    expect(q.id).toBe(noteNameItemId('alto', pitch))
    expect(q.type).toBe('note-name')
    expect(q.itemLabel).toBe(`${formatPitch(pitch)} in alto clef`)
    expect(q.category).toBe('Alto clef')
  })

  it('avoids repeating the previous item when it can', () => {
    const rng = createRng(13)
    let previous: string | undefined
    for (let i = 0; i < 500; i++) {
      const q = generateNoteNameQuestion(rng, { clefs: CLEF_NAMES, maxLedgerLines: 1, avoidItemId: previous })
      expect(q.id).not.toBe(previous)
      previous = q.id
    }
  })

  it('tags treble and bass as candidates for AQA coverage and alto and tenor as extras', () => {
    const questions = many(800, 14, { clefs: CLEF_NAMES, maxLedgerLines: 1 })
    for (const q of questions) {
      const clef = q.notation!.clef
      expect(q.tags).toEqual(clef === 'treble' || clef === 'bass' ? ['aqa-candidate'] : ['extra'])
    }
  })

  it('rejects bad options', () => {
    const rng = createRng(1)
    expect(() => generateNoteNameQuestion(rng, { clefs: [], maxLedgerLines: 1 })).toThrow(RangeError)
    expect(() => generateNoteNameQuestion(rng, { clefs: ['treble'], maxLedgerLines: 4 })).toThrow(RangeError)
    expect(() => generateNoteNameQuestion(rng, { clefs: ['treble'], maxLedgerLines: -1 })).toThrow(RangeError)
    expect(() => generateNoteNameQuestion(rng, { clefs: ['flute' as ClefName], maxLedgerLines: 1 })).toThrow(RangeError)
  })
})

describe('explainNoteName', () => {
  const explain = (clef: ClefName, text: string) => {
    const [letter, octave] = [text.charAt(0), Number(text.slice(1))]
    return explainNoteName(clef, { letter: letter as 'C', accidental: 0, octave })
  }

  it('counts from the clef anchor, naming each step', () => {
    expect(explain('alto', 'E4')).toBe(
      'The alto clef points at the middle line, which is middle C. Count 2 steps up (every line and every space is a step): C, D, E. The note is E.',
    )
    expect(explain('treble', 'E4')).toBe(
      'The treble clef curls around the second line up, which is G. Count 2 steps down (every line and every space is a step): G, F, E. The note is E.',
    )
    expect(explain('bass', 'A3')).toBe(
      'The two dots of the bass clef sit either side of the fourth line up, which is F. Count 2 steps up (every line and every space is a step): F, G, A. The note is A.',
    )
    expect(explain('tenor', 'D4')).toBe(
      'The tenor clef points at the fourth line up, which is middle C. Count 1 step up (every line and every space is a step): C, D. The note is D.',
    )
  })

  it('says so when the note is on the anchor line', () => {
    expect(explain('alto', 'C4')).toBe('The alto clef points at the middle line, which is middle C. This note is on that line, so it is C.')
    expect(explain('treble', 'G4')).toContain('so it is G.')
  })

  it('every explanation ends with the correct answer and its counted letters finish on it', () => {
    for (const q of many(1000, 21, { clefs: CLEF_NAMES, maxLedgerLines: 3 })) {
      expect(q.explanation.endsWith(`${q.correct}.`), q.explanation).toBe(true)
      const counted = /: ([A-G](?:, [A-G])*)\./.exec(q.explanation)
      if (counted) {
        const letters = counted[1]!.split(', ')
        expect(letters.at(-1)).toBe(q.correct)
        // each counted letter follows the one before it in the musical alphabet (up or down)
        const order = 'CDEFGAB'
        const goingUp = !q.explanation.includes('steps down') && !q.explanation.includes('step down')
        letters.slice(1).forEach((l, i) => {
          const prev = order.indexOf(letters[i]!)
          expect(order.indexOf(l)).toBe((prev + (goingUp ? 1 : 6)) % 7)
        })
      }
    }
  })
})
