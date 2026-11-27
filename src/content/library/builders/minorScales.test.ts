import { describe, expect, it } from 'vitest'
import { parseNote } from '../../../theory'
import { NATURAL_MINOR_SCALES, ascii } from '../../../questions/handTables'
import { noteLabel } from '../../../questions/pitchTools'
import { minorScaleExample, relativeMajorTonic } from './minorScales'

// Written out by hand from the natural minor scales: raise the 7th for harmonic; raise the 6th and 7th for melodic (going up).
const HARMONIC: Record<string, string> = {
  A: 'A B C D E F G#', E: 'E F# G A B C D#', B: 'B C# D E F# G A#', 'F#': 'F# G# A B C# D E#',
  'C#': 'C# D# E F# G# A B#', 'G#': 'G# A# B C# D# E F##', 'D#': 'D# E# F# G# A# B C##', 'A#': 'A# B# C# D# E# F# G##',
  D: 'D E F G A Bb C#', G: 'G A Bb C D Eb F#', C: 'C D Eb F G Ab B', F: 'F G Ab Bb C Db E',
  Bb: 'Bb C Db Eb F Gb A', Eb: 'Eb F Gb Ab Bb Cb D', Ab: 'Ab Bb Cb Db Eb Fb G',
}
const MELODIC_UP: Record<string, string> = {
  A: 'A B C D E F# G#', E: 'E F# G A B C# D#', B: 'B C# D E F# G# A#', 'F#': 'F# G# A B C# D# E#',
  'C#': 'C# D# E F# G# A# B#', 'G#': 'G# A# B C# D# E# F##', 'D#': 'D# E# F# G# A# B# C##', 'A#': 'A# B# C# D# E# F## G##',
  D: 'D E F G A B C#', G: 'G A Bb C D E F#', C: 'C D Eb F G A B', F: 'F G Ab Bb C D E',
  Bb: 'Bb C Db Eb F G A', Eb: 'Eb F Gb Ab Bb C D', Ab: 'Ab Bb Cb Db Eb F G',
}
// Hand-written: the relative major of each minor key (3 semitones up, 3 letter names).
const RELATIVE_MAJOR: Record<string, string> = {
  A: 'C', E: 'G', B: 'D', 'F#': 'A', 'C#': 'E', 'G#': 'B', 'D#': 'F#', 'A#': 'C#', D: 'F', G: 'Bb', C: 'Eb', F: 'Ab', Bb: 'Db', Eb: 'Gb', Ab: 'Cb',
}

const tonics = Object.keys(NATURAL_MINOR_SCALES)

describe('minorScaleExample', () => {
  it('gives every natural minor scale by the pattern and by lowering the major scale, exactly as the hand-written table says', () => {
    for (const t of tonics) {
      for (const method of ['pattern', 'from-major'] as const) {
        const e = minorScaleExample(parseNote(t), 'natural', { method })
        expect(ascii(e.answer), `${t} ${method}`).toContain(`${NATURAL_MINOR_SCALES[t]} ${t}`)
      }
    }
  })

  it('gives every harmonic minor scale exactly as the hand-written table says', () => {
    for (const t of tonics) expect(ascii(minorScaleExample(parseNote(t), 'harmonic').answer), t).toContain(`${HARMONIC[t]} ${t}`)
  })

  it('gives every melodic minor scale, up and down, as the hand-written tables say', () => {
    for (const t of tonics) {
      const answer = ascii(minorScaleExample(parseNote(t), 'melodic').answer)
      expect(answer, t).toContain(`${MELODIC_UP[t]} ${t}`)
      const natural = NATURAL_MINOR_SCALES[t]!.split(' ')
      const down = [t, ...natural.slice(1).reverse(), t].join(' ')
      expect(answer, t).toContain(down)
    }
  })

  it('finds the relative major by letters and semitones', () => {
    for (const t of tonics) expect(ascii(noteLabel(relativeMajorTonic(parseNote(t)))), t).toBe(RELATIVE_MAJOR[t])
  })

  it('has the steps a reader needs: key note, letters, pattern, one step per gap, write-out with picture and sound, a check by counting keys', () => {
    const e = minorScaleExample(parseNote('A'), 'natural')
    expect(e.steps).toHaveLength(3 + 7 + 1 + 1)
    expect(e.steps.slice(3, 10).map((s) => s.title)).toEqual(['A up to B', 'B up to C', 'C up to D', 'D up to E', 'E up to F', 'F up to G', 'G up to A'].map((t, i) => `Gap ${i + 1}: ${t}`))
    expect(e.steps.slice(3, 10).map((s) => s.result)).toEqual(['Note 2: B', 'Note 3: C', 'Note 4: D', 'Note 5: E', 'Note 6: F', 'Note 7: G', 'Note 8: A, the key note again'])
    expect(e.steps[10]!.staff).toBeDefined()
    expect(e.steps[10]!.listen).toBeDefined()
    expect(e.steps.at(-1)!.title!.startsWith('Check another way')).toBe(true)
    expect(e.steps.at(-1)!.text).toContain('A, A♯, B, C: 3 steps, so 3 semitones')
    expect(e.terms!.map((t) => t.term)).toContain('Natural minor scale')
  })

  it('lowers notes 3, 6 and 7 of the major scale one step at a time, and checks the gaps against the pattern', () => {
    const e = minorScaleExample(parseNote('E'), 'natural', { method: 'from-major' })
    const lowered = e.steps.filter((s) => s.title?.startsWith('Lower note'))
    expect(lowered.map((s) => s.result)).toEqual(['Note 3: G', 'Note 6: C', 'Note 7: D'])
    expect(e.steps.at(-1)!.result).toBe('tone, semitone, tone, tone, semitone, tone, tone: the natural minor pattern')
  })

  it('explains the double sharp in G♯ harmonic minor, and that F♯♯ is not written as G', () => {
    const e = minorScaleExample(parseNote('G#'), 'harmonic')
    const text = e.steps.map((s) => s.text).join(' ')
    expect(text).toContain('F♯♯')
    expect(text).toContain('double sharp')
    expect(text).toContain('note 7 must use the letter F')
    expect(e.steps.map((s) => s.result)).toContain('Note 7: F♯♯, not G')
    expect(e.steps.at(-1)!.text).toContain('E, F, F♯, F♯♯: 3 steps, so 3 semitones')
  })

  it('says the harmonic 6th-to-7th gap is three semitones and the 7th-to-tonic gap is one, in every key', () => {
    for (const t of tonics) {
      const check = minorScaleExample(parseNote(t), 'harmonic').steps.at(-1)!.text
      expect(check, t).toContain('3 semitones')
      expect(check, t).toContain('1 semitone')
    }
  })

  it('draws going up and coming down separately for melodic minor, each with sound', () => {
    const e = minorScaleExample(parseNote('C'), 'melodic')
    const pictured = e.steps.filter((s) => s.staff)
    expect(pictured).toHaveLength(2)
    const names = (i: number) =>
      pictured[i]!.staff!.items.map((x) => (x.kind === 'notes' ? `${x.pitches[0]!.letter}${x.pitches[0]!.accidental}` : ''))
    // up: C D Eb F G A B C; down: C Bb Ab G F Eb D C (accidental written after the letter: -1 is a flat)
    expect(names(0)).toEqual(['C0', 'D0', 'E-1', 'F0', 'G0', 'A0', 'B0', 'C0'])
    expect(names(1)).toEqual(['C0', 'B-1', 'A-1', 'G0', 'F0', 'E-1', 'D0', 'C0'])
    expect(e.steps.filter((s) => s.listen)).toHaveLength(2)
  })

  it('works in every clef and for every key without error', () => {
    for (const clef of ['treble', 'bass', 'alto', 'tenor'] as const) {
      for (const t of tonics) for (const f of ['natural', 'harmonic', 'melodic'] as const) expect(() => minorScaleExample(parseNote(t), f, { clef })).not.toThrow()
    }
  })
})
