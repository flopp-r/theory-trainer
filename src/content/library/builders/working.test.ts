import { describe, expect, it } from 'vitest'
import { type NoteName, note, parseNote } from '../../../theory'
import { ascii, pc } from '../../../questions/handTables'
import { noteLabel } from '../../../questions/pitchTools'
import { MAJOR_PATTERN, NATURAL_MINOR_PATTERN, gapsBetween, lettersDown, lettersUp, noteAt, ordinal, patternInOneLine, spellByPattern, spellOnLetter } from './working'

const text = (notes: readonly NoteName[]) => ascii(notes.map(noteLabel).join(' '))

describe('working helpers', () => {
  it('counts letters up and down, counting the first', () => {
    expect(lettersUp('D', 3)).toEqual(['D', 'E', 'F'])
    expect(lettersUp('F', 5)).toEqual(['F', 'G', 'A', 'B', 'C'])
    expect(lettersDown('F', 3)).toEqual(['F', 'E', 'D'])
    expect(lettersDown('C', 5)).toEqual(['C', 'B', 'A', 'G', 'F'])
  })

  it('writes ordinals', () => {
    expect([1, 2, 3, 4, 7, 8].map(ordinal)).toEqual(['1st', '2nd', '3rd', '4th', '7th', '8th'])
  })

  it('spells a pitch class on a given letter, and refuses more than a double sharp or flat', () => {
    expect(text([spellOnLetter('G', pc('Gb'))])).toBe('Gb')
    expect(text([spellOnLetter('F', pc('F#'))])).toBe('F#')
    expect(text([spellOnLetter('F', pc('G'))])).toBe('F##')
    expect(text([spellOnLetter('B', pc('C'))])).toBe('B#')
    expect(text([spellOnLetter('C', pc('B'))])).toBe('Cb')
    expect(() => spellOnLetter('C', pc('F#'))).toThrow()
  })

  it('finds the note a number of letters and semitones away', () => {
    // Hand-checked: a major 3rd above Bb is D; a perfect 5th above F# is C#; a minor 3rd below F is D; a minor 6th above G is Eb.
    expect(text([noteAt(note('B', -1), 3, 4, 'up')])).toBe('D')
    expect(text([noteAt(note('F', 1), 5, 7, 'up')])).toBe('C#')
    expect(text([noteAt(note('F'), 3, 3, 'down')])).toBe('D')
    expect(text([noteAt(note('G'), 6, 8, 'up')])).toBe('Eb')
  })

  it('spells the major and natural minor patterns like the hand-written tables', () => {
    expect(text(spellByPattern(parseNote('D'), MAJOR_PATTERN).notes)).toBe('D E F# G A B C#')
    expect(text(spellByPattern(parseNote('Ab'), MAJOR_PATTERN).notes)).toBe('Ab Bb C Db Eb F G')
    expect(text(spellByPattern(parseNote('G#'), NATURAL_MINOR_PATTERN).notes)).toBe('G# A# B C# D# E F#')
    expect(text(spellByPattern(parseNote('F'), NATURAL_MINOR_PATTERN).notes)).toBe('F G Ab Bb C Db Eb')
  })

  it('measures the gaps between neighbouring notes', () => {
    expect(gapsBetween([...spellByPattern(parseNote('C'), MAJOR_PATTERN).notes, parseNote('C')])).toEqual([2, 2, 1, 2, 2, 2, 1])
    expect(gapsBetween([...spellByPattern(parseNote('A'), NATURAL_MINOR_PATTERN).notes, parseNote('A')])).toEqual([2, 1, 2, 2, 1, 2, 2])
  })

  it('says each step in one line', () => {
    expect(ascii(patternInOneLine(parseNote('G'), MAJOR_PATTERN).text)).toBe(
      'G, then a tone above G is **A**; then a tone above A is **B**; then a semitone above B is **C**; then a tone above C is **D**; then a tone above D is **E**; then a tone above E is **F#** (the plain F needs a sharp to make a tone)',
    )
  })
})
