import { describe, expect, it } from 'vitest'
import { parseNote } from '../../../theory'
import { MAJOR_SCALES, NATURAL_MINOR_SCALES, ascii } from '../../../questions/handTables'
import { pentatonicExample } from './pentatonic'

const pick = (scale: string, degrees: number[]) => degrees.map((d) => scale.split(' ')[d - 1]).join(' ')

// Written out by hand: the flattened 5th takes the 5th note's letter (C blues has Gb, not F#).
const BLUES: Record<string, string> = {
  C: 'C Eb F Gb G Bb', A: 'A C D Eb E G', E: 'E G A Bb B D', G: 'G Bb C Db D F', D: 'D F G Ab A C',
  F: 'F Ab Bb Cb C Eb', Bb: 'Bb Db Eb Fb F Ab', 'F#': 'F# A B C C# E',
}

describe('pentatonicExample', () => {
  it('builds every major pentatonic as notes 1 2 3 5 6 of the hand-written major scale', () => {
    for (const [tonic, scale] of Object.entries(MAJOR_SCALES)) {
      const e = pentatonicExample(parseNote(tonic), 'major-pentatonic')
      expect(ascii(e.answer), tonic).toContain(`${pick(scale, [1, 2, 3, 5, 6])} ${tonic}`)
    }
  })

  it('builds every minor pentatonic as notes 1 3 4 5 7 of the hand-written natural minor scale', () => {
    for (const [tonic, scale] of Object.entries(NATURAL_MINOR_SCALES)) {
      const e = pentatonicExample(parseNote(tonic), 'minor-pentatonic')
      expect(ascii(e.answer), tonic).toContain(`${pick(scale, [1, 3, 4, 5, 7])} ${tonic}`)
    }
  })

  it('builds the blues scale with the flattened 5th, spelled on the 5th letter', () => {
    for (const [tonic, scale] of Object.entries(BLUES)) {
      const e = pentatonicExample(parseNote(tonic), 'blues')
      expect(ascii(e.answer), tonic).toContain(`${scale} ${tonic}`)
    }
  })

  it('builds every blues scale (all 15 minor keys): the 5th lowered a semitone, kept on its own letter, between the 4th and 5th', () => {
    const flatten = (n: string) => (n.endsWith('#') ? n.slice(0, -1) : `${n}b`)
    for (const [tonic, scale] of Object.entries(NATURAL_MINOR_SCALES)) {
      const n = scale.split(' ')
      const expected = `${n[0]} ${n[2]} ${n[3]} ${flatten(n[4]!)} ${n[4]} ${n[6]} ${tonic}`
      const e = pentatonicExample(parseNote(tonic), 'blues')
      expect(ascii(e.answer), tonic).toContain(expected)
      // the blue note is a semitone above the 4th and a semitone below the 5th
      expect(e.steps.at(-1)!.text, tonic).toContain('1 semitone above the 4th note')
      expect(e.steps.at(-1)!.text, tonic).toContain('1 semitone below the 5th note')
    }
  })

  it('explains the spelling of the blue note in C blues (Gb, not F#)', () => {
    const text = pentatonicExample(parseNote('C'), 'blues').steps.map((s) => s.text).join(' ')
    expect(text).toContain('G♭')
    expect(text).toContain('F♯')
    expect(text).toContain('keeps the 5th')
  })

  it('has a picture with the scale and the top key note, and sound', () => {
    for (const type of ['major-pentatonic', 'minor-pentatonic', 'blues'] as const) {
      const e = pentatonicExample(parseNote('A'), type)
      const picture = e.steps.find((s) => s.staff)!
      expect(picture.staff!.items).toHaveLength(type === 'blues' ? 7 : 6)
      expect(picture.listen).toBeDefined()
      expect(e.steps.at(-1)!.text.startsWith('Check')).toBe(true)
    }
  })

  it('says the pentatonic scales have no semitone step', () => {
    expect(pentatonicExample(parseNote('C'), 'major-pentatonic').steps.at(-1)!.text).toContain('2, 2, 3, 2, 3')
    expect(pentatonicExample(parseNote('A'), 'minor-pentatonic').steps.at(-1)!.text).toContain('3, 2, 2, 3, 2')
    expect(pentatonicExample(parseNote('C'), 'blues').steps.at(-1)!.text).toContain('3, 2, 1, 1, 3, 2')
  })
})
