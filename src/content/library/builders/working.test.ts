import { describe, expect, it } from 'vitest'
import { type NoteName, note, parseNote } from '../../../theory'
import { ascii, pc } from '../../../questions/handTables'
import { noteLabel } from '../../../questions/pitchTools'
import { MAJOR_PATTERN, NATURAL_MINOR_PATTERN, Words, gapsBetween, keyWalk, lettersDown, lettersUp, noteAt, ordinal, scaleGapSteps, spellByPattern, spellOnLetter } from './working'
import { MAJOR_SCALES, NATURAL_MINOR_SCALES } from '../../../questions/handTables'

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

  it('builds every major and natural minor scale gap by gap, as the hand-written tables say', () => {
    for (const [t, scale] of Object.entries(MAJOR_SCALES)) {
      const g = scaleGapSteps(parseNote(t), 'major', 7, new Words())
      expect(text(g.notes), t).toBe(`${scale} ${t}`)
      expect(g.steps, t).toHaveLength(7)
    }
    for (const [t, scale] of Object.entries(NATURAL_MINOR_SCALES)) {
      const g = scaleGapSteps(parseNote(t), 'natural minor', 7, new Words())
      expect(text(g.notes), t).toBe(`${scale} ${t}`)
    }
    // stopping early gives just the first notes
    expect(text(scaleGapSteps(parseNote('Eb'), 'major', 5, new Words()).notes)).toBe('Eb F G Ab Bb C')
  })

  it('explains each gap: the letter distance, what the pattern asks for and the sign', () => {
    const w = new Words()
    const g = scaleGapSteps(parseNote('D'), 'major', 7, w)
    expect(g.steps[1]!.title).toBe('Gap 2: E up to F')
    expect(g.steps[1]!.text).toBe(
      'From E up to F is 1 semitone (there is no black key between them). The pattern asks for a tone (2 semitones). The gap is 1 semitone too small, so raise F with a sharp (♯ raises a note by 1 semitone): **F♯**.',
    )
    expect(g.steps[1]!.result).toBe('Note 3: F♯')
    expect(g.steps[6]!.result).toBe('Note 8: D, the key note again')
    expect(w.terms().map((t) => t.term)).toEqual(['Natural', 'Sharp (♯)'])
  })

  it('gives a reminder in brackets only the first time a word is used', () => {
    const w = new Words()
    expect(w.say('semitone', 'semitones')).toBe('semitones (the smallest step, from one piano key to the very next)')
    expect(w.say('semitone', 'semitone')).toBe('semitone')
    expect(w.terms()).toHaveLength(1)
  })

  it('counts piano keys one at a time, refusing a wrong count', () => {
    expect(keyWalk(parseNote('D'), parseNote('F#'), 4, 'up', false).join(' ')).toBe('D D♯ E F F♯')
    expect(keyWalk(parseNote('Bb'), parseNote('F'), 7, 'up', true).join(' ')).toBe('B♭ B C D♭ D E♭ E F')
    expect(keyWalk(parseNote('G'), parseNote('E'), 3, 'down', false).join(' ')).toBe('G F♯ F E')
    expect(() => keyWalk(parseNote('C'), parseNote('E'), 3, 'up', false)).toThrow()
  })
})
