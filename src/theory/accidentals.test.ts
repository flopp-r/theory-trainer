import { describe, expect, it } from 'vitest'
import { accidentalsToShow } from './accidentals'
import { circleOfFifths, keyName, parseKey } from './key'
import { parsePitch } from './pitch'
import { scalePitches } from './scale'

const show = (keyName: string | null, groups: string[][]) =>
  accidentalsToShow(
    groups.map((g) => g.map(parsePitch)),
    keyName ? parseKey(keyName) : null,
  )

describe('accidentalsToShow', () => {
  it('prints sharps and flats that are not in the key', () => {
    expect(show(null, [['F#4'], ['Bb3'], ['C4']])).toEqual([['#'], ['b'], [null]])
    expect(show('C major', [['F#4', 'A4', 'C5']])).toEqual([['#', null, null]])
  })

  it('prints nothing for notes the key signature already covers', () => {
    expect(show('D major', [['F#4'], ['C#5'], ['D4']])).toEqual([[null], [null], [null]])
    expect(show('Eb major', [['Bb3'], ['Eb4'], ['Ab4']])).toEqual([[null], [null], [null]])
    expect(show('Cb major', [['Cb4'], ['Fb4'], ['Bb3']])).toEqual([[null], [null], [null]])
  })

  it('prints a natural when a note cancels the key signature', () => {
    expect(show('D major', [['F4']])).toEqual([['n']])
    expect(show('Bb major', [['B3']])).toEqual([['n']])
    expect(show('Cb major', [['B3']])).toEqual([['n']])
  })

  it('a printed accidental holds for the same pitch for the rest of the bar', () => {
    expect(show(null, [['F#4'], ['F#4'], ['F#4']])).toEqual([['#'], [null], [null]])
    // back to natural needs a natural sign, and then holds
    expect(show(null, [['F#4'], ['F4'], ['F4']])).toEqual([['#'], ['n'], [null]])
  })

  it('does not carry to another octave', () => {
    expect(show(null, [['F#4'], ['F5']])).toEqual([['#'], [null]])
    expect(show(null, [['F#4'], ['F#5']])).toEqual([['#'], ['#']])
  })

  it('in a key with a signature, returning to the signature accidental prints it again', () => {
    // D major: F#4 (nothing), F4 (natural), F#4 (sharp again)
    expect(show('D major', [['F#4'], ['F4'], ['F#4']])).toEqual([[null], ['n'], ['#']])
  })

  it('handles double sharps and flats', () => {
    expect(show('G# minor', [['F##4']])).toEqual([['##']])
    expect(show(null, [['Ebb4']])).toEqual([['bb']])
    // F# major has six sharps (F C G D A E), so E# is in the signature and E natural needs a sign.
    expect(show('F# major', [['E#4'], ['E4']])).toEqual([[null], ['n']])
  })

  it('works through chords', () => {
    // A minor cadence: E major chord (G#), then A minor chord
    expect(show('A minor', [['E4', 'G#4', 'B4'], ['E4', 'A4', 'C5']])).toEqual([[null, '#', null], [null, null, null]])
    // D major: A major chord has C# which is in the signature
    expect(show('D major', [['E4', 'A4', 'C#5']])).toEqual([[null, null, null]])
  })

  it('rejects accidentals it cannot write', () => {
    expect(() => show(null, [['C###4']])).toThrow(RangeError)
  })

  it('in every standard key, the key\'s own scale needs no accidentals', () => {
    for (const { major, minor } of circleOfFifths()) {
      for (const k of [major, minor]) {
        const type = k.mode === 'major' ? 'major' : 'natural-minor'
        const scale = scalePitches({ ...k.tonic, octave: 4 }, type, { octaves: 2 })
        const result = accidentalsToShow(scale.map((p) => [p]), k)
        expect(result.flat().every((sign) => sign === null), `${keyName(k)}`).toBe(true)
      }
    }
  })

  it('in every standard key, raising the 7th for harmonic minor needs exactly one accidental', () => {
    for (const { minor } of circleOfFifths()) {
      const scale = scalePitches({ ...minor.tonic, octave: 4 }, 'harmonic-minor')
      const printed = accidentalsToShow(scale.map((p) => [p]), minor).flat().filter((s) => s !== null)
      expect(printed, keyName(minor)).toHaveLength(1)
    }
  })
})
