import { describe, expect, it } from 'vitest'
import { chord, chordSymbol, parseChordSymbol } from './chord'
import { circleOfFifths, parseKey } from './key'
import { chordFromRoman, diatonicChords, primaryChords, romanNumeral } from './roman'

const numeral = (keyName: string, symbol: string) => {
  const { chord: c, inversion } = parseChordSymbol(symbol)
  return romanNumeral(parseKey(keyName), c, inversion)
}
const fromNumeral = (keyName: string, text: string) => {
  const { chord: c, inversion } = chordFromRoman(parseKey(keyName), text)
  return chordSymbol(c, { inversion })
}

describe('romanNumeral: major keys', () => {
  it.each([
    ['C major', 'C', 'I'],
    ['C major', 'Dm', 'ii'],
    ['C major', 'Em', 'iii'],
    ['C major', 'F', 'IV'],
    ['C major', 'G', 'V'],
    ['C major', 'Am', 'vi'],
    ['C major', 'Bdim', 'vii°'],
    ['C major', 'G7', 'V7'],
    ['C major', 'Dm7', 'ii7'],
    ['C major', 'Cmaj7', 'Imaj7'],
    ['C major', 'Fmaj7', 'IVmaj7'],
    ['C major', 'Bm7b5', 'viiø7'],
    ['C major', 'Bb', '♭VII'],
    ['C major', 'Eb', '♭III'],
    ['C major', 'Ab', '♭VI'],
    ['C major', 'D', 'II'],
    ['C major', 'F#dim', '♯iv°'],
    ['G major', 'D', 'V'],
    ['G major', 'C', 'IV'],
    ['G major', 'Em', 'vi'],
    ['G major', 'F#dim', 'vii°'],
    ['D major', 'A7', 'V7'],
    ['Bb major', 'F', 'V'],
    ['Bb major', 'Eb', 'IV'],
    ['Bb major', 'Gm', 'vi'],
    ['Bb major', 'Adim', 'vii°'],
    ['F# major', 'C#', 'V'],
    ['F# major', 'E#dim', 'vii°'],
    ['Cb major', 'Gb', 'V'],
  ])('in %s, %s is %s', (keyName, symbol, expected) => {
    expect(numeral(keyName, symbol)).toBe(expected)
  })
})

describe('romanNumeral: minor keys', () => {
  it.each([
    ['A minor', 'Am', 'i'],
    ['A minor', 'Bdim', 'ii°'],
    ['A minor', 'C', 'III'],
    ['A minor', 'Dm', 'iv'],
    ['A minor', 'E', 'V'],
    ['A minor', 'Em', 'v'],
    ['A minor', 'F', 'VI'],
    ['A minor', 'G', 'VII'],
    ['A minor', 'G#dim', 'vii°'],
    ['A minor', 'G#dim7', 'vii°7'],
    ['A minor', 'E7', 'V7'],
    ['A minor', 'Bm7b5', 'iiø7'],
    ['A minor', 'Caug', 'III+'],
    ['A minor', 'F#dim', '♯vi°'],
    ['E minor', 'B', 'V'],
    ['E minor', 'D#dim', 'vii°'],
    ['E minor', 'D', 'VII'],
    ['C minor', 'Bdim', 'vii°'],
    ['C minor', 'Bb', 'VII'],
    ['C minor', 'Ab', 'VI'],
    ['C minor', 'Fm', 'iv'],
    ['C minor', 'G', 'V'],
    ['G# minor', 'D#', 'V'],
    ['G# minor', 'F##dim', 'vii°'],
  ])('in %s, %s is %s', (keyName, symbol, expected) => {
    expect(numeral(keyName, symbol)).toBe(expected)
  })
})

describe('inversions use figured bass', () => {
  it.each([
    ['C major', 'C', 'I'],
    ['C major', 'C/E', 'I6'],
    ['C major', 'C/G', 'I6/4'],
    ['C major', 'F/A', 'IV6'],
    ['C major', 'G/D', 'V6/4'],
    ['C major', 'G7', 'V7'],
    ['C major', 'G7/B', 'V6/5'],
    ['C major', 'G7/D', 'V4/3'],
    ['C major', 'G7/F', 'V4/2'],
    ['C major', 'Bdim/D', 'vii°6'],
    ['C major', 'Dm7/F', 'ii6/5'],
    ['C major', 'Cmaj7/E', 'Imaj6/5'],
    ['A minor', 'Am/C', 'i6'],
    ['A minor', 'G#dim7/B', 'vii°6/5'],
    ['A minor', 'Bm7b5/F', 'iiø4/3'],
  ])('in %s, %s is %s', (keyName, symbol, expected) => {
    expect(numeral(keyName, symbol)).toBe(expected)
  })
})

describe('chordFromRoman', () => {
  it.each([
    ['C major', 'I', 'C'],
    ['C major', 'ii', 'Dm'],
    ['C major', 'V7', 'G7'],
    ['C major', 'vii°', 'Bdim'],
    ['C major', 'viio', 'Bdim'],
    ['C major', 'viiø7', 'Bm7b5'],
    ['C major', 'bVII', 'Bb'],
    ['C major', '♭VII', 'Bb'],
    ['C major', '#iv°', 'F#dim'],
    ['C major', 'I6', 'C/E'],
    ['C major', 'V6/5', 'G7/B'],
    ['C major', 'V4/2', 'G7/F'],
    ['G major', 'V', 'D'],
    ['G major', 'vii°', 'F#dim'],
    ['Eb major', 'IV', 'Ab'],
    ['Eb major', 'vi', 'Cm'],
    ['A minor', 'i', 'Am'],
    ['A minor', 'iv', 'Dm'],
    ['A minor', 'V', 'E'],
    ['A minor', 'V7', 'E7'],
    ['A minor', 'VII', 'G'],
    ['A minor', 'vii°', 'G#dim'],
    ['A minor', 'vii°7', 'G#dim7'],
    ['A minor', 'VI', 'F'],
    ['A minor', 'III+', 'Caug'],
    ['C# minor', 'vii°', 'B#dim'],
    ['C# minor', 'VII', 'B'],
    ['C minor', 'vii°6', 'Bdim/D'],
  ])('in %s, %s is %s', (keyName, text, expected) => {
    expect(fromNumeral(keyName, text)).toBe(expected)
  })

  it('rejects things that are not numerals or do not make sense', () => {
    const k = parseKey('C major')
    for (const text of ['', 'VIII', 'IIII', 'x', 'I7maj', 'i+', 'V°', 'Iø', 'vimaj7', 'I6/5x', 'ii6/4/5', 'I+7', 'ii6/4/6', 'V7/V', 'iø6']) {
      expect(() => chordFromRoman(k, text), text).toThrow(SyntaxError)
    }
  })

  it('refuses roots that are not a semitone from the scale', () => {
    expect(() => romanNumeral(parseKey('C major'), chord('C#', 'major'), 0)).not.toThrow() // ♯I
    expect(() => romanNumeral(parseKey('C major'), chord('Cx', 'major'), 0)).toThrow(RangeError)
  })
})

describe('round trip over every standard key', () => {
  it('numeral -> chord -> numeral gives the same numeral for every diatonic chord, inversion and key', () => {
    for (const { major, minor } of circleOfFifths()) {
      for (const k of [major, minor]) {
        for (const form of ['natural', 'harmonic'] as const) {
          for (const sevenths of [false, true]) {
            for (const d of diatonicChords(k, { form, sevenths })) {
              const size = sevenths ? 4 : 3
              for (let inversion = 0; inversion < size; inversion++) {
                const text = romanNumeral(k, d.chord, inversion)
                const back = chordFromRoman(k, text)
                expect(back, `${k.tonic.letter}${k.mode} ${text}`).toEqual({ chord: d.chord, inversion })
              }
            }
          }
        }
      }
    }
  })
})

describe('diatonicChords', () => {
  const symbols = (keyName: string, options?: Parameters<typeof diatonicChords>[1]) =>
    diatonicChords(parseKey(keyName), options).map((d) => `${d.numeral}=${chordSymbol(d.chord)}`)

  it('major key triads', () => {
    expect(symbols('C major')).toEqual(['I=C', 'ii=Dm', 'iii=Em', 'IV=F', 'V=G', 'vi=Am', 'vii°=Bdim'])
    expect(symbols('F major')).toEqual(['I=F', 'ii=Gm', 'iii=Am', 'IV=Bb', 'V=C', 'vi=Dm', 'vii°=Edim'])
    expect(symbols('F# major')).toEqual(['I=F#', 'ii=G#m', 'iii=A#m', 'IV=B', 'V=C#', 'vi=D#m', 'vii°=E#dim'])
  })

  it('major key sevenths', () => {
    expect(symbols('C major', { sevenths: true })).toEqual([
      'Imaj7=Cmaj7',
      'ii7=Dm7',
      'iii7=Em7',
      'IVmaj7=Fmaj7',
      'V7=G7',
      'vi7=Am7',
      'viiø7=Bm7b5',
    ])
  })

  it('minor key triads (natural and harmonic)', () => {
    expect(symbols('A minor')).toEqual(['i=Am', 'ii°=Bdim', 'III=C', 'iv=Dm', 'v=Em', 'VI=F', 'VII=G'])
    expect(symbols('A minor', { form: 'harmonic' })).toEqual(['i=Am', 'ii°=Bdim', 'III+=Caug', 'iv=Dm', 'V=E', 'VI=F', 'vii°=G#dim'])
  })

  it('harmonic minor sevenths include the diminished 7th on the leading note, and omit unsupported chords', () => {
    const list = symbols('A minor', { form: 'harmonic', sevenths: true })
    // Degree 1 (A C E G#, minor-major 7th) and degree 3 (C E G# B, augmented major 7th) are not supported chords.
    expect(list).toEqual(['iiø7=Bm7b5', 'iv7=Dm7', 'V7=E7', 'VImaj7=Fmaj7', 'vii°7=G#dim7'])
  })

  it('natural minor sevenths', () => {
    expect(symbols('A minor', { sevenths: true })).toEqual([
      'i7=Am7',
      'iiø7=Bm7b5',
      'IIImaj7=Cmaj7',
      'iv7=Dm7',
      'v7=Em7',
      'VImaj7=Fmaj7',
      'VII7=G7',
    ])
  })

  it('primary chords', () => {
    const p = (keyName: string) => primaryChords(parseKey(keyName)).map((d) => `${d.numeral}=${chordSymbol(d.chord)}`)
    expect(p('C major')).toEqual(['I=C', 'IV=F', 'V=G'])
    expect(p('D major')).toEqual(['I=D', 'IV=G', 'V=A'])
    expect(p('A minor')).toEqual(['i=Am', 'iv=Dm', 'V=E'])
    expect(p('C minor')).toEqual(['i=Cm', 'iv=Fm', 'V=G'])
    expect(p('Eb major')).toEqual(['I=Eb', 'IV=Ab', 'V=Bb'])
  })
})
