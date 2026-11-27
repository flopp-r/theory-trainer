import { describe, expect, it } from 'vitest'
import { type Pitch, chord, letterIndex, parseNote, pitch } from '../../../theory'
import { ascii } from '../../../questions/handTables'
import { buildSeventhExample, buildTriadExample, identifySeventhExample, identifyTriadExample, semitoneWorking, type SeventhQuality, type TriadQuality } from './chords'
import { chordPicture } from './chords'

// Hand-written chord spellings (ASCII: # sharp, b flat). They deliberately do not use the theory engine.
const TRIADS: Record<TriadQuality, Record<string, string>> = {
  major: {
    C: 'C E G', D: 'D F# A', E: 'E G# B', F: 'F A C', G: 'G B D', A: 'A C# E', B: 'B D# F#',
    Db: 'Db F Ab', Eb: 'Eb G Bb', Gb: 'Gb Bb Db', Ab: 'Ab C Eb', Bb: 'Bb D F', 'C#': 'C# E# G#', 'F#': 'F# A# C#',
  },
  minor: {
    C: 'C Eb G', D: 'D F A', E: 'E G B', F: 'F Ab C', G: 'G Bb D', A: 'A C E', B: 'B D F#',
    'C#': 'C# E G#', 'D#': 'D# F# A#', 'F#': 'F# A C#', 'G#': 'G# B D#', Bb: 'Bb Db F', Eb: 'Eb Gb Bb', Ab: 'Ab Cb Eb',
  },
  diminished: {
    C: 'C Eb Gb', D: 'D F Ab', E: 'E G Bb', F: 'F Ab Cb', G: 'G Bb Db', A: 'A C Eb', B: 'B D F',
    'C#': 'C# E G', 'D#': 'D# F# A', 'F#': 'F# A C', 'G#': 'G# B D', Bb: 'Bb Db Fb', Eb: 'Eb Gb Bbb',
  },
  augmented: {
    C: 'C E G#', D: 'D F# A#', E: 'E G# B#', F: 'F A C#', G: 'G B D#', A: 'A C# E#', B: 'B D# F##',
    Eb: 'Eb G B', Bb: 'Bb D F#', Ab: 'Ab C E', Db: 'Db F A', 'F#': 'F# A# C##',
  },
}

const SEVENTHS: Record<SeventhQuality, Record<string, string>> = {
  dominant7: {
    C: 'C E G Bb', D: 'D F# A C', E: 'E G# B D', F: 'F A C Eb', G: 'G B D F', A: 'A C# E G', B: 'B D# F# A',
    Bb: 'Bb D F Ab', Eb: 'Eb G Bb Db', Ab: 'Ab C Eb Gb', Db: 'Db F Ab Cb', 'F#': 'F# A# C# E',
  },
  major7: {
    C: 'C E G B', D: 'D F# A C#', E: 'E G# B D#', F: 'F A C E', G: 'G B D F#', A: 'A C# E G#', B: 'B D# F# A#',
    Bb: 'Bb D F A', Eb: 'Eb G Bb D', Ab: 'Ab C Eb G', Db: 'Db F Ab C', 'F#': 'F# A# C# E#',
  },
  minor7: {
    C: 'C Eb G Bb', D: 'D F A C', E: 'E G B D', F: 'F Ab C Eb', G: 'G Bb D F', A: 'A C E G', B: 'B D F# A',
    'C#': 'C# E G# B', 'F#': 'F# A C# E', 'G#': 'G# B D# F#', Bb: 'Bb Db F Ab', Eb: 'Eb Gb Bb Db',
  },
  'half-diminished7': {
    C: 'C Eb Gb Bb', D: 'D F Ab C', E: 'E G Bb D', F: 'F Ab Cb Eb', G: 'G Bb Db F', A: 'A C Eb G', B: 'B D F A',
    'C#': 'C# E G B', 'F#': 'F# A C E', 'G#': 'G# B D F#',
  },
  diminished7: {
    C: 'C Eb Gb Bbb', D: 'D F Ab Cb', E: 'E G Bb Db', F: 'F Ab Cb Ebb', G: 'G Bb Db Fb', A: 'A C Eb Gb', B: 'B D F Ab',
    'C#': 'C# E G Bb', 'F#': 'F# A C Eb', 'G#': 'G# B D F',
  },
}

const TRIAD_WORDS: Record<TriadQuality, string> = { major: 'major', minor: 'minor', diminished: 'diminished', augmented: 'augmented' }
const SEVENTH_WORDS: Record<SeventhQuality, string> = {
  dominant7: 'dominant 7th', major7: 'major 7th', minor7: 'minor 7th', 'half-diminished7': 'half-diminished 7th', diminished7: 'diminished 7th',
}

/** Notes written bottom to top, each above the one before. */
function ascending(names: string, start = 4): Pitch[] {
  const out: Pitch[] = []
  let octave = start
  let previous = -1
  for (const text of names.split(' ')) {
    const n = parseNote(text)
    if (previous >= 0 && letterIndex(n.letter) <= previous) octave++
    previous = letterIndex(n.letter)
    out.push(pitch(n.letter, n.accidental, octave))
  }
  return out
}

describe('semitoneWorking', () => {
  // Hand-counted on a keyboard.
  const cases: [string, string, number][] = [
    ['E', 'G', 3], ['Eb', 'G', 4], ['F#', 'A', 3], ['B', 'D', 3], ['B', 'D#', 4], ['C', 'Bbb', 9], ['C', 'B', 11],
    ['A', 'C', 3], ['Bb', 'F', 7], ['F', 'Cb', 6], ['F#', 'C#', 7], ['G#', 'D', 6], ['E', 'B#', 8], ['C', 'Gb', 6],
  ]
  it.each(cases)('%s up to %s is %i semitones', (from, to, expected) => {
    expect(semitoneWorking(parseNote(from), parseNote(to)).total).toBe(expected)
  })
})

describe('buildTriadExample', () => {
  for (const [quality, table] of Object.entries(TRIADS) as [TriadQuality, Record<string, string>][]) {
    it(`builds every ${quality} triad exactly as the hand-written table says`, () => {
      for (const [root, expected] of Object.entries(table)) {
        const e = buildTriadExample(parseNote(root), quality)
        expect(ascii(e.answer), `${root} ${quality}`).toBe(`The ${root} ${TRIAD_WORDS[quality]} triad is ${expected}.`)
      }
    })
  }

  it('has nine steps: root, letters, recipe, count and sign for the 3rd, count and sign for the 5th, the triad, and a check', () => {
    const e = buildTriadExample(parseNote('Eb'), 'major')
    expect(e.steps).toHaveLength(9)
    expect(e.steps[0]!.result).toBe('Root: E♭')
    expect(e.steps[1]!.result).toBe('Letters: E, G, B')
    expect(e.steps[2]!.result).toBe('3rd: 4 semitones up. 5th: 7 semitones up')
    expect(e.steps[7]!.result).toBe('E♭ G B♭')
    expect(e.steps[7]!.staff).toBeDefined()
    expect(e.steps[7]!.listen).toBeDefined()
    expect(e.steps.at(-1)!.title!.startsWith('Check another way')).toBe(true)
    expect(e.terms!.map((t) => t.term)).toEqual(expect.arrayContaining(['Triad', 'Root', 'Semitone', 'Major 3rd', 'Perfect 5th', 'Flat (♭)']))
  })

  it('fixes the 5th of E-flat major with a flat, and says why', () => {
    const e = buildTriadExample(parseNote('Eb'), 'major')
    expect(e.steps[3]!.text).toContain('E to F is 1 semitone (no black key between them), F to G is 2')
    expect(e.steps[3]!.text).toContain('E♭ is 1 semitone lower than E, so the gap is 1 bigger: 3 + 1 = 4')
    expect(e.steps[3]!.result).toBe('E♭ up to G: 4 semitones')
    expect(e.steps[4]!.text).toContain('They match')
    expect(e.steps[4]!.result).toBe('3rd: G')
    expect(e.steps[5]!.text).toContain('Running total: 1, 3, 5, 7')
    expect(e.steps[5]!.result).toBe('E♭ up to B: 8 semitones')
    expect(e.steps[6]!.text).toContain('1 too many')
    expect(e.steps[6]!.text).toContain('**B♭**')
    expect(e.steps[6]!.result).toBe('5th: B♭')
  })

  it('raises a note with a sharp when the count is too small (B diminished has no sign, C augmented has G sharp)', () => {
    const aug = buildTriadExample(parseNote('C'), 'augmented')
    expect(aug.steps[6]!.text).toContain('You counted 7. That is 1 too few, so raise G with a sharp')
    expect(buildTriadExample(parseNote('B'), 'diminished').answer).toBe('The B diminished triad is B D F.')
  })

  it('checks by counting the two 3rds one piano key at a time', () => {
    const e = buildTriadExample(parseNote('Eb'), 'major')
    expect(e.steps.at(-1)!.text).toContain('E♭ to G: E♭, E, F, G♭, G: 4 steps')
    expect(e.steps.at(-1)!.text).toContain('G to B♭: G, A♭, A, B♭: 3 steps')
    expect(e.steps.at(-1)!.result).toBe('4 then 3: E♭ major, as it should be')
  })

  it('plays exactly the notes it writes', () => {
    const e = buildTriadExample(parseNote('F#'), 'minor')
    const midi = e.steps.find((s) => s.listen)!.listen!.audio.events[0]!.midi
    expect([...midi].map((m) => m % 12)).toEqual([6, 9, 1]) // F# A C#
    expect(midi[1]! - midi[0]!).toBe(3)
    expect(midi[2]! - midi[1]!).toBe(4)
  })
})

describe('identifyTriadExample', () => {
  for (const [quality, table] of Object.entries(TRIADS) as [TriadQuality, Record<string, string>][]) {
    it(`names every ${quality} triad on the staff`, () => {
      for (const [root, spelling] of Object.entries(table)) {
        const e = identifyTriadExample(ascending(spelling))
        const article = quality === 'augmented' ? 'an' : 'a'
        expect(ascii(e.answer), `${spelling}`).toBe(`It is ${article} ${TRIAD_WORDS[quality]} triad: ${root} ${TRIAD_WORDS[quality]} (${spelling}).`)
      }
    })
  }

  it('counts both thirds and matches them to the table', () => {
    const e = identifyTriadExample(ascending('Eb G Bb'))
    expect(e.steps[0]!.staff).toBeDefined()
    expect(e.steps[1]!.result).toBe('Root: E♭')
    expect(e.steps[2]!.result).toBe('E♭ up to G: 4 semitones, a major 3rd')
    expect(e.steps[3]!.result).toBe('G up to B♭: 3 semitones, a minor 3rd')
    expect(e.steps[4]!.text).toContain('Yours is 4 then 3')
    expect(e.steps[4]!.result).toBe('A major triad: E♭ major')
    expect(e.steps.at(-1)!.text).toContain('4 + 3 = 7')
  })

  it('splits a count into letters and then signs when both notes have one (A C♯ E♯)', () => {
    const e = identifyTriadExample(ascending('A C# E#'))
    const titles = e.steps.map((s) => s.title)
    expect(titles).toContain('Allow for the sharps on C♯ and E♯')
    expect(e.steps.find((s) => s.title === 'Allow for the sharps on C♯ and E♯')!.result).toBe('C♯ up to E♯: 4 semitones, a major 3rd')
    expect(e.steps.at(-1)!.text).toContain('E♯ is the same piano key as F')
  })

  it('refuses notes that are not a root-position triad', () => {
    expect(() => identifyTriadExample(ascending('E G C'))).toThrow() // first inversion
    expect(() => identifyTriadExample(ascending('C E A'))).toThrow() // not stacked in thirds
    expect(() => identifyTriadExample(ascending('C E G B'))).toThrow() // four notes
  })
})

describe('buildSeventhExample', () => {
  for (const [quality, table] of Object.entries(SEVENTHS) as [SeventhQuality, Record<string, string>][]) {
    it(`builds every ${quality} chord exactly as the hand-written table says`, () => {
      for (const [root, expected] of Object.entries(table)) {
        const e = buildSeventhExample(parseNote(root), quality)
        expect(ascii(e.answer), `${root} ${quality}`).toBe(`${root} ${SEVENTH_WORDS[quality]} is ${expected}.`)
      }
    })
  }

  it('has twelve steps, a picture and sound, and two checks', () => {
    const e = buildSeventhExample(parseNote('G'), 'dominant7')
    expect(e.steps).toHaveLength(12)
    expect(e.steps[1]!.result).toBe('Letters: G, B, D, F')
    expect(e.steps[2]!.result).toBe('3rd: 4, 5th: 7, 7th: 10 semitones above the root')
    expect(e.steps[9]!.result).toBe('G B D F')
    expect(e.steps[9]!.staff).toBeDefined()
    expect(e.steps[9]!.listen).toBeDefined()
    expect(e.steps[10]!.title).toBe('Check another way: the triad at the bottom')
    expect(e.steps[11]!.text).toContain('G, F♯, F: 2 steps')
    expect(e.steps[11]!.text).toContain('12 − 2 = 10')
  })

  it('explains the double flat in C diminished 7th (the 7th is 9 semitones above the root)', () => {
    const e = buildSeventhExample(parseNote('C'), 'diminished7')
    const fix = e.steps.find((s) => s.title === 'Make the 7th a diminished 7th')!
    expect(fix.text).toContain('You counted 11. That is 2 too many')
    expect(fix.text).toContain('double flat')
    expect(fix.text).toContain('**B♭♭**')
    expect(fix.text).toContain('Keep the letter B')
    expect(e.steps[2]!.text).toContain('the 7th is 9')
    expect(e.steps.at(-1)!.text).toContain('B♭♭ is the same piano key as A')
  })

  it('plays the four notes with the right gaps (G7: 4, 3, 3 semitones)', () => {
    const e = buildSeventhExample(parseNote('G'), 'dominant7')
    const midi = [...e.steps.find((s) => s.listen)!.listen!.audio.events[0]!.midi]
    expect(midi.slice(1).map((m, i) => m - midi[i]!)).toEqual([4, 3, 3])
  })
})

describe('identifySeventhExample', () => {
  for (const [quality, table] of Object.entries(SEVENTHS) as [SeventhQuality, Record<string, string>][]) {
    it(`names every ${quality} chord on the staff`, () => {
      for (const [root, spelling] of Object.entries(table)) {
        const e = identifySeventhExample(ascending(spelling))
        expect(ascii(e.answer), spelling).toBe(`It is ${root} ${SEVENTH_WORDS[quality]} (${spelling}).`)
      }
    })
  }

  it('counts from the root to the 3rd, 5th and 7th', () => {
    const e = identifySeventhExample(chordPicture(chord('B', 'half-diminished7'), 'treble'))
    expect(e.steps[2]!.result).toBe('B up to D: 3 semitones, a minor 3rd')
    expect(e.steps[3]!.result).toBe('B up to F: 6 semitones, a diminished 5th')
    expect(e.steps[4]!.result).toBe('B up to A: 10 semitones, a minor 7th')
    expect(e.steps[5]!.text).toContain('Yours are 3, 6, 10')
    expect(e.steps.at(-1)!.text).toContain('3 + 3 + 4 = 10')
  })

  it('refuses a chord that is not in root position', () => {
    expect(() => identifySeventhExample(ascending('B D F G'))).toThrow()
    expect(() => identifySeventhExample(ascending('C E G'))).toThrow()
  })
})
