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

const step = (e: { steps: readonly { title?: string }[] }, title: string) => {
  const found = e.steps.find((x) => x.title === title)
  if (!found) throw new Error(`No step titled "${title}"`)
  return found as { title?: string; text: string; result?: string }
}

describe('inversionExample', () => {
  it('finds every inversion of every chord, with the right written order and figured bass', () => {
    for (const c of CASES) {
      c.positions.forEach((written, inversion) => {
        const e = inversionExample(chord(c.root, c.quality), inversion)
        const label = `${c.root} ${c.quality} inversion ${inversion}`
        expect(ascii(e.steps[0]!.result!), label).toBe(written.split(' ').join(', '))
        expect(e.answer, label).toContain(NAMES[inversion]!)
        const figure = (c.positions.length === 4 ? FIGURES_SEVENTH : FIGURES_TRIAD)[inversion]!
        expect(e.answer, label).toContain(`Figured bass: ${figure}.`)
        expect(step(e, 'Write the figured bass').result, label).toBe(`Figured bass: ${figure}`)
        // The root is always found, and the chord is always named in the working.
        expect(ascii(e.steps.find((x) => x.result?.startsWith('Root: '))!.result!), label).toBe(`Root: ${c.root}`)
        expect(ascii(step(e, 'Match the counts to a chord type').result!), label).toContain(`${c.root} ${c.words}`)
      })
    }
  })

  it('shows the lowest note and its job in the chord, and turns the chord over as a check', () => {
    const e = inversionExample(chord('C', 'major'), 1)
    expect(step(e, 'Find the bass note').text).toContain('E is the 3rd')
    expect(step(e, 'Name the inversion from the bass note').result).toBe('First inversion')
    expect(e.steps.at(-1)!.text).toContain('Move the bottom note up to the top once: E G C')
    const third = inversionExample(chord('G', 'dominant7'), 3)
    expect(step(third, 'Find the bass note').text).toContain('F is the 7th')
    expect(step(third, 'Write the figured bass').text).toContain('6/4/2, which is shortened to 4/2')
    expect(third.steps.at(-1)!.text).toContain('three times')
  })

  it('tests notes as the root one at a time and stops at the one that works', () => {
    const e = inversionExample(chord('C', 'major'), 2)
    expect(step(e, 'Try G as the root').text).toContain('C is a 4th (G, A, B, C); E is a 6th (G, A, B, C, D, E)')
    expect(step(e, 'Try G as the root').result).toBe('G is not the root')
    expect(step(e, 'Try C as the root').result).toBe('Root: C')
    expect(e.steps.some((x) => x.title === 'Try E as the root')).toBe(false)
    const rootPosition = inversionExample(chord('C', 'major'), 0)
    expect(step(rootPosition, 'Try C as the root').result).toBe('Root: C')
    expect(rootPosition.steps.some((x) => x.title === 'Try E as the root')).toBe(false)
  })

  it('has a picture and a sound at the start and ends with a check', () => {
    const e = inversionExample(chord('D', 'minor'), 2)
    expect(e.steps[0]!.staff).toBeDefined()
    expect(e.steps[0]!.listen).toBeDefined()
    expect(e.steps.at(-1)!.title!.startsWith('Check another way')).toBe(true)
  })
})

describe('chordSymbolExample', () => {
  it('writes the symbol (with a slash for inversions) for every chord and inversion', () => {
    for (const c of CASES) {
      c.positions.forEach((written, inversion) => {
        const bass = written.split(' ')[0]!
        const expected = `${c.root}${c.code}${inversion > 0 ? `/${bass}` : ''}`
        const e = chordSymbolExample(chord(c.root, c.quality), inversion)
        expect(ascii(e.answer).replace('The chord symbol is ', '').replace(/\.$/, ''), `${c.root} ${c.quality} ${inversion}`).toBe(expected)
      })
    }
  })

  it('explains the slash only when the chord is inverted', () => {
    expect(step(chordSymbolExample(chord('C', 'major'), 0), 'Look at the bass note').text).toContain('nothing more is added')
    expect(step(chordSymbolExample(chord('C', 'major'), 1), 'Look at the bass note').text).toContain('Add a slash and the bass note')
    expect(chordSymbolExample(chord('C', 'major'), 1).answer).toBe('The chord symbol is C/E.')
  })

  it('writes no ending for major, and explains m7b5', () => {
    const e = chordSymbolExample(chord('F', 'major'), 0)
    expect(step(e, 'Write the root, then the ending').text).toContain('no ending, so the symbol is just the root')
    expect(e.answer).toBe('The chord symbol is F.')
    expect(step(chordSymbolExample(chord('B', 'half-diminished7'), 0), 'Write the root, then the ending').text).toContain('flattened 5th')
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

  it('splits the symbol into root, ending and slash note, then moves notes to the top one at a time', () => {
    const e = readChordSymbolExample(chord('C', 'major'), 1)
    expect(e.steps[0]!.result).toBe('Root C, ending none, bass note E')
    expect(step(e, 'Move C to the top').result).toBe('E G C: E is now the bass note')
    const plain = readChordSymbolExample(chord('B', 'half-diminished7'), 0)
    expect(plain.steps[0]!.result).toBe('Root B, ending m7b5, no slash')
    const g7 = readChordSymbolExample(chord('G', 'dominant7'), 2)
    expect(g7.steps.filter((x) => x.title?.startsWith('Move ')).map((x) => x.result)).toEqual(['B D F G', 'D F G B: D is now the bass note'])
  })
})
