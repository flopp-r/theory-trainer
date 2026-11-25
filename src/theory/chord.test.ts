import { describe, expect, it } from 'vitest'
import {
  CHORD_INTERVALS,
  type ChordQuality,
  SEVENTH_QUALITIES,
  TRIAD_QUALITIES,
  bassNote,
  chord,
  chordNotes,
  chordPitches,
  chordSymbol,
  identifyChord,
  inversionFigure,
  inversionName,
  isSeventh,
  parseChordSymbol,
} from './chord'
import { LETTERS, formatNote, formatPitch, letterIndex, midiNumber, note, parseNote, pitchClass } from './pitch'

const spell = (symbol: string) =>
  chordNotes(parseChordSymbol(symbol).chord)
    .map((n) => formatNote(n))
    .join(' ')
const voice = (symbol: string, options?: Parameters<typeof chordPitches>[1]) => {
  const { chord: c, inversion } = parseChordSymbol(symbol)
  return chordPitches(c, { inversion, ...options })
    .map((p) => formatPitch(p))
    .join(' ')
}

describe('chord spelling: known answers', () => {
  it.each([
    ['C', 'C E G'],
    ['Cm', 'C Eb G'],
    ['Cdim', 'C Eb Gb'],
    ['Caug', 'C E G#'],
    ['C7', 'C E G Bb'],
    ['Cmaj7', 'C E G B'],
    ['Cm7', 'C Eb G Bb'],
    ['Cm7b5', 'C Eb Gb Bb'],
    ['Cdim7', 'C Eb Gb Bbb'],
    ['F#m7b5', 'F# A C E'],
    ['Bb', 'Bb D F'],
    ['Eb7', 'Eb G Bb Db'],
    ['G#dim7', 'G# B D F'],
    ['Ebdim7', 'Eb Gb Bbb Dbb'],
    ['B', 'B D# F#'],
    ['Bdim', 'B D F'],
    ['F#', 'F# A# C#'],
    ['Gb', 'Gb Bb Db'],
    ['Db', 'Db F Ab'],
    ['Abm', 'Ab Cb Eb'],
    ['D#m', 'D# F# A#'],
    ['Faug', 'F A C#'],
    ['Gmaj7', 'G B D F#'],
    ['Dm7', 'D F A C'],
    ['G7', 'G B D F'],
    ['Bm7b5', 'B D F A'],
    ['Cb', 'Cb Eb Gb'],
    ['E#dim', 'E# G# B'],
  ])('%s is spelled %s', (symbol, expected) => {
    expect(spell(symbol)).toBe(expected)
  })
})

/** Semitones above the root, an independent description of each quality. */
const SEMITONES: Record<ChordQuality, number[]> = {
  major: [0, 4, 7],
  minor: [0, 3, 7],
  diminished: [0, 3, 6],
  augmented: [0, 4, 8],
  dominant7: [0, 4, 7, 10],
  major7: [0, 4, 7, 11],
  minor7: [0, 3, 7, 10],
  'half-diminished7': [0, 3, 6, 10],
  diminished7: [0, 3, 6, 9],
}

describe('every root and quality: independent checks', () => {
  const roots = LETTERS.flatMap((letter) => [-1, 0, 1].map((accidental) => note(letter, accidental)))
  const qualities = Object.keys(CHORD_INTERVALS) as ChordQuality[]

  it('has the right sound (pitch classes)', () => {
    for (const root of roots) {
      for (const quality of qualities) {
        const classes = chordNotes({ root, quality }).map(pitchClass)
        const expected = SEMITONES[quality].map((s) => (pitchClass(root) + s) % 12)
        expect(classes, `${formatNote(root)} ${quality}`).toEqual(expected)
      }
    }
  })

  it('is built in thirds: letters skip every other letter name', () => {
    for (const root of roots) {
      for (const quality of qualities) {
        const letters = chordNotes({ root, quality }).map((n) => letterIndex(n.letter))
        const expected = [0, 2, 4, 6].slice(0, SEMITONES[quality].length).map((s) => (letterIndex(root.letter) + s) % 7)
        expect(letters, `${formatNote(root)} ${quality}`).toEqual(expected)
      }
    }
  })

  it('identifyChord recovers the chord from its notes', () => {
    for (const root of roots) {
      for (const quality of qualities) {
        expect(identifyChord(chordNotes({ root, quality }))).toEqual({ root, quality })
      }
    }
    expect(identifyChord([])).toBeNull()
    expect(identifyChord([parseNote('C'), parseNote('E'), parseNote('G#'), parseNote('B')])).toBeNull()
    // Enharmonic respelling is not recognised: Ab C Eb is minor-looking only if spelled Ab Cb Eb.
    expect(identifyChord([parseNote('C'), parseNote('Fb'), parseNote('G')])).toBeNull()
  })

  it('every chord has 3 or 4 notes depending on whether it is a seventh', () => {
    for (const quality of qualities) {
      expect(CHORD_INTERVALS[quality]).toHaveLength(isSeventh(quality) ? 4 : 3)
    }
    expect([...TRIAD_QUALITIES, ...SEVENTH_QUALITIES].sort()).toEqual([...qualities].sort())
  })
})

describe('voicings and inversions', () => {
  it('root position and inversions of C major', () => {
    expect(voice('C')).toBe('C4 E4 G4')
    expect(voice('C/E')).toBe('E4 G4 C5')
    expect(voice('C/G')).toBe('G4 C5 E5')
  })

  it('bassOctave sets the octave of the lowest note', () => {
    expect(voice('C', { bassOctave: 3 })).toBe('C3 E3 G3')
    expect(voice('C/E', { bassOctave: 3 })).toBe('E3 G3 C4')
    expect(voice('B/D#', { bassOctave: 3 })).toBe('D#3 F#3 B3')
  })

  it('inversions of a seventh chord', () => {
    expect(voice('C7')).toBe('C4 E4 G4 Bb4')
    expect(voice('C7/E')).toBe('E4 G4 Bb4 C5')
    expect(voice('C7/G')).toBe('G4 Bb4 C5 E5')
    expect(voice('C7/Bb')).toBe('Bb4 C5 E5 G5')
  })

  it('crosses the B/C octave boundary with the right octave numbers', () => {
    expect(voice('G')).toBe('G4 B4 D5')
    expect(voice('B')).toBe('B4 D#5 F#5')
    expect(voice('A#dim')).toBe('A#4 C#5 E5')
    expect(voice('B#', {})).toBe('B#4 D##5 F##5')
  })

  it('open position raises the second-lowest note', () => {
    expect(voice('C', { open: true })).toBe('C4 G4 E5')
    expect(voice('C7', { open: true })).toBe('C4 G4 Bb4 E5')
    expect(voice('Am', { open: true })).toBe('A4 E5 C6')
  })

  it('all voicings ascend, hold the right notes, and put the right note in the bass', () => {
    for (const letter of LETTERS) {
      for (const accidental of [-1, 0, 1]) {
        const root = note(letter, accidental)
        for (const quality of Object.keys(CHORD_INTERVALS) as ChordQuality[]) {
          const c = { root, quality }
          const names = chordNotes(c).map((n) => formatNote(n))
          for (let inversion = 0; inversion < names.length; inversion++) {
            for (const open of [false, true]) {
              const label = `${chordSymbol(c, { inversion })} ${open ? 'open' : 'close'}`
              const pitches = chordPitches(c, { inversion, bassOctave: 3, open })
              const midis = pitches.map(midiNumber)
              expect([...midis].sort((a, b) => a - b), label).toEqual(midis)
              expect(new Set(midis).size, label).toBe(midis.length)
              expect(pitches.map((p) => formatNote(p)).sort(), label).toEqual([...names].sort())
              expect(formatNote(pitches[0]!), label).toBe(names[inversion])
              expect(pitches[0]!.octave, label).toBe(3)
              expect(formatNote(bassNote(c, inversion))).toBe(names[inversion])
            }
          }
        }
      }
    }
  })

  it('rejects impossible inversions', () => {
    expect(() => chordPitches(chord('C', 'major'), { inversion: 3 })).toThrow(RangeError)
    expect(() => chordPitches(chord('C', 'major'), { inversion: -1 })).toThrow(RangeError)
    expect(() => chordPitches(chord('C', 'dominant7'), { inversion: 4 })).toThrow(RangeError)
    expect(() => chordPitches(chord('C', 'major'), { inversion: 0.5 })).toThrow(RangeError)
  })
})

describe('chord symbols', () => {
  it('writes the standard symbol', () => {
    expect(chordSymbol(chord('C', 'major'))).toBe('C')
    expect(chordSymbol(chord('F#', 'minor'))).toBe('F#m')
    expect(chordSymbol(chord('Bb', 'dominant7'))).toBe('Bb7')
    expect(chordSymbol(chord('E', 'half-diminished7'))).toBe('Em7b5')
    expect(chordSymbol(chord('B', 'diminished'))).toBe('Bdim')
    expect(chordSymbol(chord('C', 'augmented'))).toBe('Caug')
    expect(chordSymbol(chord('Eb', 'major7'))).toBe('Ebmaj7')
    expect(chordSymbol(chord('G', 'diminished7'))).toBe('Gdim7')
  })

  it('adds a slash bass for inversions', () => {
    expect(chordSymbol(chord('C', 'major'), { inversion: 1 })).toBe('C/E')
    expect(chordSymbol(chord('C', 'major'), { inversion: 2 })).toBe('C/G')
    expect(chordSymbol(chord('G', 'dominant7'), { inversion: 3 })).toBe('G7/F')
    expect(chordSymbol(chord('Bb', 'major'), { inversion: 1 })).toBe('Bb/D')
  })

  it('can use proper sharp and flat signs', () => {
    expect(chordSymbol(chord('Bb', 'minor7'), { style: 'symbol' })).toBe('B♭m7')
    expect(chordSymbol(chord('F#', 'major'), { inversion: 1, style: 'symbol' })).toBe('F♯/A♯')
  })

  it('parse reverses chordSymbol for every root, quality and inversion', () => {
    for (const letter of LETTERS) {
      for (const accidental of [-1, 0, 1]) {
        for (const quality of Object.keys(CHORD_INTERVALS) as ChordQuality[]) {
          const c = chord(note(letter, accidental), quality)
          for (let inversion = 0; inversion < CHORD_INTERVALS[quality].length; inversion++) {
            const text = chordSymbol(c, { inversion })
            expect(parseChordSymbol(text)).toEqual({ chord: c, inversion })
            expect(parseChordSymbol(chordSymbol(c, { inversion, style: 'symbol' }))).toEqual({ chord: c, inversion })
          }
        }
      }
    }
  })

  it('accepts common alternative spellings', () => {
    const q = (text: string) => parseChordSymbol(text).chord.quality
    expect(q('Cmaj')).toBe('major')
    expect(q('CM')).toBe('major')
    expect(q('Cmin')).toBe('minor')
    expect(q('C-')).toBe('minor')
    expect(q('C°')).toBe('diminished')
    expect(q('C+')).toBe('augmented')
    expect(q('CM7')).toBe('major7')
    expect(q('CΔ7')).toBe('major7')
    expect(q('Cmin7')).toBe('minor7')
    expect(q('C-7')).toBe('minor7')
    expect(q('Cø')).toBe('half-diminished7')
    expect(q('Cm7♭5')).toBe('half-diminished7')
    expect(q('C°7')).toBe('diminished7')
  })

  it('rejects bad symbols, including slash notes that are not in the chord', () => {
    for (const text of ['', 'H', 'c', 'C13', 'Csus4', 'C/', 'C/D', 'C/E/G', 'Cmaj9', '7']) {
      expect(() => parseChordSymbol(text), text).toThrow(SyntaxError)
    }
  })
})

describe('inversion labels', () => {
  it('uses figured bass', () => {
    expect([0, 1, 2].map((i) => inversionFigure('major', i))).toEqual(['5/3', '6', '6/4'])
    expect([0, 1, 2, 3].map((i) => inversionFigure('dominant7', i))).toEqual(['7', '6/5', '4/3', '4/2'])
    expect(() => inversionFigure('major', 3)).toThrow(RangeError)
  })

  it('names the inversions', () => {
    expect([0, 1, 2, 3].map(inversionName)).toEqual(['root position', 'first inversion', 'second inversion', 'third inversion'])
  })
})
