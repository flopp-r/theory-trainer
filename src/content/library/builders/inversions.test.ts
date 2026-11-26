import { describe, expect, it } from 'vitest'
import { type ChordQuality, chord } from '../../../theory'
import { ascii } from '../../../questions/handTables'
import { chordSymbolExample, inversionExample, readChordSymbolExample } from './inversions'

// Hand-written: each chord's notes in root position, first, second (and third) inversion, lowest first (ASCII).
interface Case {
  root: string
  quality: ChordQuality
  /** Chord symbol suffix, written by hand. */
  code: string
  words: string
  positions: string[]
}
const CASES: Case[] = [
  { root: 'C', quality: 'major', code: '', words: 'major', positions: ['C E G', 'E G C', 'G C E'] },
  { root: 'D', quality: 'minor', code: 'm', words: 'minor', positions: ['D F A', 'F A D', 'A D F'] },
  { root: 'Bb', quality: 'major', code: '', words: 'major', positions: ['Bb D F', 'D F Bb', 'F Bb D'] },
  { root: 'F#', quality: 'minor', code: 'm', words: 'minor', positions: ['F# A C#', 'A C# F#', 'C# F# A'] },
  { root: 'B', quality: 'diminished', code: 'dim', words: 'diminished', positions: ['B D F', 'D F B', 'F B D'] },
  { root: 'C', quality: 'augmented', code: 'aug', words: 'augmented', positions: ['C E G#', 'E G# C', 'G# C E'] },
  { root: 'G', quality: 'dominant7', code: '7', words: 'dominant 7th', positions: ['G B D F', 'B D F G', 'D F G B', 'F G B D'] },
  { root: 'Eb', quality: 'major7', code: 'maj7', words: 'major 7th', positions: ['Eb G Bb D', 'G Bb D Eb', 'Bb D Eb G', 'D Eb G Bb'] },
  { root: 'A', quality: 'minor7', code: 'm7', words: 'minor 7th', positions: ['A C E G', 'C E G A', 'E G A C', 'G A C E'] },
  { root: 'B', quality: 'half-diminished7', code: 'm7b5', words: 'half-diminished 7th', positions: ['B D F A', 'D F A B', 'F A B D', 'A B D F'] },
  { root: 'C', quality: 'diminished7', code: 'dim7', words: 'diminished 7th', positions: ['C Eb Gb Bbb', 'Eb Gb Bbb C', 'Gb Bbb C Eb', 'Bbb C Eb Gb'] },
  { root: 'Bb', quality: 'dominant7', code: '7', words: 'dominant 7th', positions: ['Bb D F Ab', 'D F Ab Bb', 'F Ab Bb D', 'Ab Bb D F'] },
]
const NAMES = ['root position', 'first inversion', 'second inversion', 'third inversion']
const FIGURES_TRIAD = ['5/3', '6', '6/4']
const FIGURES_SEVENTH = ['7', '6/5', '4/3', '4/2']

describe('inversionExample', () => {
  it('finds every inversion of every chord, with the right written order and figured bass', () => {
    for (const c of CASES) {
      c.positions.forEach((written, inversion) => {
        const e = inversionExample(chord(c.root, c.quality), inversion)
        const label = `${c.root} ${c.quality} inversion ${inversion}`
        expect(ascii(e.steps[0]!.text), label).toContain(`**${written}**`)
        expect(e.answer, label).toContain(NAMES[inversion]!)
        const figure = (c.positions.length === 4 ? FIGURES_SEVENTH : FIGURES_TRIAD)[inversion]!
        expect(e.answer, label).toContain(`Figured bass: ${figure}.`)
        // The root is always found, and always named in the working.
        expect(ascii(e.steps[1]!.text), label).toContain(`**${c.root} is the root**`)
        expect(ascii(e.steps[2]!.text), label).toContain(`**${c.root} ${c.words}**`)
      })
    }
  })

  it('shows the lowest note and its job in the chord', () => {
    const e = inversionExample(chord('C', 'major'), 1)
    expect(e.steps[3]!.text).toContain('the note E is the **3rd**')
    expect(e.steps[5]!.text).toContain('Move the bottom note to the top once: E G C')
    const third = inversionExample(chord('G', 'dominant7'), 3)
    expect(third.steps[3]!.text).toContain('the **7th**')
    expect(third.steps[5]!.text).toContain('three times')
  })

  it('tests notes as the root one at a time and stops at the one that works', () => {
    const e = inversionExample(chord('C', 'major'), 2)
    expect(e.steps[1]!.text).toContain('Try G: the other notes are a 4th and a 6th above it')
    expect(e.steps[1]!.text).toContain('Try C:')
    expect(e.steps[1]!.text).not.toContain('Try E')
    const rootPosition = inversionExample(chord('C', 'major'), 0)
    expect(rootPosition.steps[1]!.text).toContain('so **C is the root**')
    expect(rootPosition.steps[1]!.text).not.toContain('Try E')
  })

  it('has a picture and a sound at the start', () => {
    const e = inversionExample(chord('D', 'minor'), 2)
    expect(e.steps[0]!.staff).toBeDefined()
    expect(e.steps[0]!.listen).toBeDefined()
    expect(e.steps.at(-1)!.text.startsWith('Check')).toBe(true)
  })
})

describe('chordSymbolExample', () => {
  it('writes the symbol (with a slash for inversions) for every chord and inversion', () => {
    for (const c of CASES) {
      c.positions.forEach((written, inversion) => {
        const bass = written.split(' ')[0]!
        const expected = `${c.root}${c.code}${inversion > 0 ? `/${bass}` : ''}`
        const e = chordSymbolExample(chord(c.root, c.quality), inversion)
        expect(ascii(e.answer).replace('The chord symbol is ', '').replace(/\.$/, ''), `${c.root} ${c.quality} ${inversion}`).toBe(expected.replace('m7b5', 'm7b5'))
      })
    }
  })

  it('explains the slash only when the chord is inverted', () => {
    expect(chordSymbolExample(chord('C', 'major'), 0).steps[4]!.text).toContain('nothing more is added')
    expect(chordSymbolExample(chord('C', 'major'), 1).steps[4]!.text).toContain('add a **slash**')
    expect(chordSymbolExample(chord('C', 'major'), 1).answer).toBe('The chord symbol is C/E.')
  })

  it('writes a plain letter for major', () => {
    const e = chordSymbolExample(chord('F', 'major'), 0)
    expect(e.steps[3]!.text).toContain('**nothing**')
    expect(e.answer).toBe('The chord symbol is F.')
  })
})

describe('readChordSymbolExample', () => {
  it('spells the chord and puts the bass note at the bottom, for every case', () => {
    for (const c of CASES) {
      c.positions.forEach((written, inversion) => {
        const e = readChordSymbolExample(chord(c.root, c.quality), inversion)
        expect(ascii(e.answer), `${c.root} ${c.quality} ${inversion}`).toContain(`is ${written},`)
      })
    }
  })

  it('splits the symbol into root, ending and slash note', () => {
    const e = readChordSymbolExample(chord('C', 'major'), 1)
    expect(e.steps[0]!.text).toContain('root** is **C**')
    expect(e.steps[0]!.text).toContain('bass note** is **E**')
    expect(e.steps[5]!.text).toContain('E G C')
    const plain = readChordSymbolExample(chord('B', 'half-diminished7'), 0)
    expect(plain.steps[0]!.text).toContain('ending** is **m7b5**')
    expect(plain.steps[0]!.text).toContain('no slash')
  })
})
