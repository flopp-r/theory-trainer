import { describe, expect, it } from 'vitest'
import { type Key, parseKey, parseNote } from '../../../theory'
import { DEGREE_NAMES, MAJOR_SCALES, NATURAL_MINOR_SCALES, ascii } from '../../../questions/handTables'
import { DEGREE_TERMS, scaleDegreeExample } from './scaleDegrees'

const major = (t: string): Key => ({ tonic: parseNote(t), mode: 'major' })
const minor = (t: string): Key => ({ tonic: parseNote(t), mode: 'minor' })
const ORD = ['1st', '2nd', '3rd', '4th', '5th', '6th', '7th']

describe('scaleDegreeExample', () => {
  it('finds every degree of every major scale, with the names from the hand-written list', () => {
    for (const [t, scale] of Object.entries(MAJOR_SCALES)) {
      const notes = scale.split(' ')
      for (let d = 1; d <= 7; d++) {
        const e = scaleDegreeExample(major(t), d)
        expect(ascii(e.answer), `${t} ${d}`).toBe(`The ${DEGREE_NAMES[d - 1]} of ${t} major is ${notes[d - 1]}.`)
      }
    }
  })

  it('finds every degree of every natural minor scale; the 7th is the subtonic', () => {
    for (const [t, scale] of Object.entries(NATURAL_MINOR_SCALES)) {
      const notes = scale.split(' ')
      for (let d = 1; d <= 7; d++) {
        const term = d === 7 ? 'subtonic' : DEGREE_NAMES[d - 1]
        const e = scaleDegreeExample(minor(t), d)
        expect(ascii(e.answer), `${t} ${d}`).toBe(`The ${term} of ${t} minor (natural minor) is ${notes[d - 1]}.`)
      }
    }
  })

  it('names the degree for a number, and gives the note too', () => {
    for (let d = 1; d <= 7; d++) {
      const e = scaleDegreeExample(major('G'), d, 'name')
      const notes = MAJOR_SCALES.G!.split(' ')
      expect(ascii(e.answer)).toBe(`The ${ORD[d - 1]} degree of G major is the ${DEGREE_NAMES[d - 1]}, and in this key it is ${notes[d - 1]}.`)
      expect(e.task).toContain(`${ORD[d - 1]} note`)
    }
  })

  it('has the hand-written first six names', () => {
    expect([...DEGREE_TERMS]).toEqual(DEGREE_NAMES.slice(0, 6))
  })

  it('explains the leading note (a semitone below) and the subtonic (a tone below)', () => {
    const leading = scaleDegreeExample(parseKey('Eb major'), 7).steps[0]!.text
    expect(leading).toContain('1 semitone below the key note')
    expect(leading).toContain('leading note')
    const subtonic = scaleDegreeExample(parseKey('A minor'), 7).steps[0]!.text
    expect(subtonic).toContain('2 semitones below the key note')
    expect(subtonic).toContain('subtonic')
  })

  it('shows the scale with exactly the wanted note picked out, and sound', () => {
    for (let d = 1; d <= 7; d++) {
      const e = scaleDegreeExample(major('D'), d)
      const picture = e.steps.find((s) => s.staff)!
      const coloured = picture.staff!.items.map((i) => (i.kind === 'notes' && i.color ? 1 : 0))
      expect(picture.staff!.items).toHaveLength(8)
      expect(coloured.reduce((a: number, b: number) => a + b, 0)).toBe(1)
      expect(coloured[d - 1]).toBe(1)
      expect(picture.listen).toBeDefined()
    }
  })

  it('ends with a check by letters and semitones (the 5th is 5 letter names and 7 semitones up)', () => {
    const e = scaleDegreeExample(major('D'), 5)
    expect(e.steps.at(-1)!.text).toBe('Check. The 5th note is 5 letter names up from D (D, E, F, G, A), and A is 7 semitones above D. ✓')
  })

  it('rejects a degree that does not exist', () => {
    expect(() => scaleDegreeExample(major('C'), 0)).toThrow()
    expect(() => scaleDegreeExample(major('C'), 8)).toThrow()
  })
})
