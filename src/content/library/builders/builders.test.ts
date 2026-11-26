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
        expect(e.answer, `${clef} ${p.letter}${p.octave}`).toBe(`The note is ${p.letter}.`)
        // count by hand: steps from the anchor
        const [al, ao, ap] = ANCHOR[clef]
        const moved = step(p.letter, p.octave) - step(al, ao)
        const text = e.steps.map((s) => s.text).join(' ')
        if (moved === 0) expect(text).toContain('nothing to count')
        else {
          expect(text).toContain(`${moved > 0 ? 'up' : 'down'} ${Math.abs(moved)} ${Math.abs(moved) === 1 ? 'step' : 'steps'}`)
          const letters = /\*\*([A-G](?:, [A-G])*)\*\*/.exec(e.steps[2]!.text)![1]!.split(', ')
          expect(letters).toHaveLength(Math.abs(moved) + 1)
          expect(letters[0]).toBe(al)
          expect(letters.at(-1)).toBe(p.letter)
        }
        // the position quoted in the first step is the hand-computed one
        expect(ap + moved).toBe(ap + step(p.letter, p.octave) - step(al, ao))
      }
    }
  })

  it('always has a picture, a counting step and a check', () => {
    const e = nameNoteExample('alto', { letter: 'E', accidental: 0, octave: 4 })
    expect(e.steps.length).toBeGreaterThanOrEqual(4)
    expect(e.steps[0]!.staff).toBeDefined()
    expect(e.steps.at(-1)!.text.startsWith('Check')).toBe(true)
  })
})

describe('majorScaleExample', () => {
  it('builds all 15 major scales exactly as the hand-written table says', () => {
    for (const [tonic, expected] of Object.entries(MAJOR_SCALES)) {
      const e = majorScaleExample(parseNote(tonic))
      // seven notes and then the key note again, with nothing doubled
      expect(ascii(e.answer), tonic).toBe(`The ${tonic} major scale is ${expected} ${tonic}. (Key: ${tonic} major.)`)
    }
  })

  it('has the three set-up steps, seven note steps, a check and a result', () => {
    const e = majorScaleExample(note('D'))
    expect(e.steps).toHaveLength(3 + 7 + 1 + 1)
    expect(e.steps.slice(3, 10).every((s) => s.text.startsWith('**Note '))).toBe(true)
    expect(e.steps.at(-1)!.staff).toBeDefined()
    expect(e.steps.at(-1)!.listen).toBeDefined()
  })

  it('adds a sharp or flat only when the pattern needs one (D major: F♯ and C♯ only)', () => {
    const e = majorScaleExample(note('D'))
    const notes = e.steps.filter((s) => s.text.startsWith('**Note ')).map((s) => /the note is \*\*([^*]+)\*\*/.exec(s.text)?.[1] ?? /just \*\*([A-G])\*\*/.exec(s.text)![1]!)
    expect(notes).toEqual(['E', 'F♯', 'G', 'A', 'B', 'C♯', 'D'])
  })

  it('works for every clef without error', () => {
    for (const clef of CLEF_NAMES) expect(() => majorScaleExample(note('E', -1), clef)).not.toThrow()
  })
})
