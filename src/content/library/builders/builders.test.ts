import { describe, expect, it } from 'vitest'
import { CLEF_NAMES, type ClefName, naturalPitchesInClef, note, parseNote } from '../../../theory'
import { MAJOR_SCALES, ascii } from '../../../questions/handTables'
import { majorScaleExample } from './scales'
import { nameNoteExample } from './notes'

// Hand-written: the note each clef is built around and where it sits.
const ANCHOR: Record<ClefName, [letter: string, octave: number, position: number]> = {
  treble: ['G', 4, 2],
  bass: ['F', 3, 6],
  alto: ['C', 4, 4],
  tenor: ['C', 4, 6],
}
const ORDER = 'CDEFGAB'
const step = (letter: string, octave: number) => octave * 7 + ORDER.indexOf(letter)

describe('nameNoteExample', () => {
  it('names every note in every clef correctly, and the counted letters end on the answer', () => {
    for (const clef of CLEF_NAMES) {
      for (const p of naturalPitchesInClef(clef, 3)) {
        const e = nameNoteExample(clef, p)
        const where = `${clef} ${p.letter}${p.octave}`
        expect(e.answer, where).toBe(`The note is ${p.letter}.`)
        // count by hand: steps from the clef's own line
        const [al, ao] = ANCHOR[clef]
        const moved = step(p.letter, p.octave) - step(al, ao)
        const results = e.steps.map((s) => s.result ?? '')
        if (moved === 0) expect(results.join(' '), where).toContain('0 steps')
        else {
          // The counting steps end with "N steps up: G, A, B" and, outside the staff, "M more steps: C, D".
          const counts = results.flatMap((r) => {
            const m = /^(\d+) (?:more steps?|steps? (up|down)): ([A-G](?:, [A-G])*)$/.exec(r)
            return m ? [m] : []
          })
          expect(counts.length, where).toBeGreaterThan(0)
          expect(counts.reduce((sum, m) => sum + Number(m[1]), 0), where).toBe(Math.abs(moved))
          expect(counts[0]![2], where).toBe(moved > 0 ? 'up' : 'down')
          expect(counts.slice(1).every((m) => m[2] === undefined), where).toBe(true)
          const letters = counts.flatMap((m) => m[3]!.split(', '))
          expect(letters, where).toHaveLength(Math.abs(moved) + 1)
          expect(letters[0], where).toBe(al)
          expect(letters.at(-1), where).toBe(p.letter)
        }
        // the check reaches the same letter by another route
        expect(e.steps.at(-1)!.result, where).toMatch(new RegExp(` is ${p.letter}, as counted$`))
      }
    }
  })

  it('has words you need, a picture, a counting step and a check by another route', () => {
    const e = nameNoteExample('alto', { letter: 'E', accidental: 0, octave: 4 })
    expect(e.terms!.map((t) => t.term)).toEqual(['Staff (or stave)', 'Alto clef', 'Middle C', 'Step', 'Musical alphabet'])
    expect(e.steps.length).toBeGreaterThanOrEqual(5)
    expect(e.steps[0]!.staff).toBeDefined()
    expect(e.steps.at(-1)!.title).toBe('Check with the lines of the alto clef')
    expect(e.steps.at(-1)!.text).toContain('F A C E G')
    // a note above the staff is checked by lines only, every other letter (treble A5: lines E G B D F, then A)
    const high = nameNoteExample('treble', { letter: 'A', accidental: 0, octave: 5 })
    expect(high.terms!.map((t) => t.term)).toContain('Ledger line')
    expect(high.steps.at(-1)!.title).toBe('Check using the lines only')
    expect(high.steps.at(-1)!.text).toContain('Carry on above the staff, every other letter: 1st ledger line A')
    expect(high.steps.map((s) => s.title)).toContain('Carry on above the staff')
  })
})

describe('majorScaleExample', () => {
  it('builds all 15 major scales exactly as the hand-written table says', () => {
    for (const [tonic, expected] of Object.entries(MAJOR_SCALES)) {
      const e = majorScaleExample(parseNote(tonic))
      // seven notes and then the key note again, with nothing doubled
      expect(ascii(e.answer), tonic).toBe(`The ${tonic} major scale is ${expected} ${tonic}.`)
    }
  })

  it('has three set-up steps, one step per gap, the written-out scale and a check', () => {
    const e = majorScaleExample(note('D'))
    expect(e.steps).toHaveLength(3 + 7 + 1 + 1)
    expect(e.steps.slice(3, 10).every((s) => s.title?.startsWith('Gap '))).toBe(true)
    expect(e.steps[10]!.staff).toBeDefined()
    expect(e.steps[10]!.listen).toBeDefined()
    expect(e.steps.at(-1)!.title).toMatch(/^Check another way/)
  })

  it('adds a sharp or flat only when the pattern needs one (D major: F♯ and C♯ only)', () => {
    const e = majorScaleExample(note('D'))
    const gapSteps = e.steps.filter((s) => s.title?.startsWith('Gap '))
    const notes = gapSteps.map((s) => /^Note \d: ([A-G]♯?♭?)/.exec(s.result!)![1]!)
    expect(notes).toEqual(['E', 'F♯', 'G', 'A', 'B', 'C♯', 'D'])
    // only the gaps that needed a sign say so
    expect(gapSteps.filter((s) => /raise|lower/.test(s.text)).map((s) => s.result)).toEqual(['Note 3: F♯', 'Note 7: C♯'])
  })

  it('works for every clef without error', () => {
    for (const clef of CLEF_NAMES) expect(() => majorScaleExample(note('E', -1), clef)).not.toThrow()
  })
})
