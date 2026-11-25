import { describe, expect, it } from 'vitest'
import { chord, chordSymbol } from './chord'
import { CADENCE_TYPES, type CadenceType, cadence, cadenceNumerals, cadenceOptions, cadenceSymbols, cadenceTarget, classifyCadence } from './cadence'
import { circleOfFifths, parseKey } from './key'

const symbols = (keyName: string, type: CadenceType, variant = 0) => cadenceSymbols(cadence(parseKey(keyName), type, variant))

describe('cadences: known answers', () => {
  it.each([
    ['C major', 'perfect', 'G-C'],
    ['C major', 'imperfect', 'C-G'],
    ['C major', 'plagal', 'F-C'],
    ['C major', 'interrupted', 'G-Am'],
    ['G major', 'perfect', 'D-G'],
    ['G major', 'plagal', 'C-G'],
    ['G major', 'interrupted', 'D-Em'],
    ['D major', 'perfect', 'A-D'],
    ['F major', 'perfect', 'C-F'],
    ['F major', 'plagal', 'Bb-F'],
    ['F major', 'interrupted', 'C-Dm'],
    ['Bb major', 'imperfect', 'Bb-F'],
    ['A minor', 'perfect', 'E-Am'],
    ['A minor', 'imperfect', 'Am-E'],
    ['A minor', 'plagal', 'Dm-Am'],
    ['A minor', 'interrupted', 'E-F'],
    ['D minor', 'perfect', 'A-Dm'],
    ['D minor', 'interrupted', 'A-Bb'],
    ['E minor', 'perfect', 'B-Em'],
    ['E minor', 'plagal', 'Am-Em'],
    ['C minor', 'interrupted', 'G-Ab'],
    ['F# minor', 'perfect', 'C#-F#m'],
  ] as [string, CadenceType, string][])('%s %s cadence is %s', (keyName, type, expected) => {
    expect(symbols(keyName, type)).toBe(expected)
  })

  it('variants', () => {
    expect(symbols('C major', 'perfect', 1)).toBe('G7-C')
    expect(symbols('C major', 'imperfect', 1)).toBe('Dm-G')
    expect(symbols('C major', 'imperfect', 2)).toBe('F-G')
    expect(symbols('A minor', 'imperfect', 1)).toBe('Bdim-E')
    expect(symbols('A minor', 'imperfect', 2)).toBe('Dm-E')
    expect(symbols('A minor', 'perfect', 1)).toBe('E7-Am')
    expect(symbols('C major', 'interrupted', 1)).toBe('G7-Am')
  })

  it('rejects variants that do not exist', () => {
    expect(() => cadence(parseKey('C major'), 'plagal', 1)).toThrow(RangeError)
    expect(() => cadence(parseKey('C major'), 'perfect', -1)).toThrow(RangeError)
  })

  it('numerals and target', () => {
    expect(cadence(parseKey('C major'), 'perfect').numerals).toEqual(['V', 'I'])
    expect(cadence(parseKey('A minor'), 'plagal').numerals).toEqual(['iv', 'i'])
    expect(cadenceTarget(parseKey('C major'), 'imperfect')).toBe('V')
    expect(cadenceTarget(parseKey('C major'), 'interrupted')).toBe('vi')
    expect(cadenceTarget(parseKey('A minor'), 'interrupted')).toBe('VI')
    expect(cadenceNumerals(parseKey('C major'), chord('G', 'dominant7'), chord('C', 'major'))).toEqual(['V7', 'I'])
  })
})

describe('classifyCadence', () => {
  it('recognises every cadence the app can generate, in every standard key (round trip)', () => {
    for (const { major, minor } of circleOfFifths()) {
      for (const k of [major, minor]) {
        for (const type of CADENCE_TYPES) {
          for (const option of cadenceOptions(k, type)) {
            expect(classifyCadence(k, option.chords[0], option.chords[1]), `${k.tonic.letter} ${k.mode} ${type}`).toBe(type)
          }
        }
      }
    }
  })

  it('every generated cadence ends on the chord its type says', () => {
    for (const { major, minor } of circleOfFifths()) {
      for (const k of [major, minor]) {
        for (const type of CADENCE_TYPES) {
          for (const option of cadenceOptions(k, type)) {
            expect(option.numerals[1]).toBe(cadenceTarget(k, type))
          }
        }
      }
    }
  })

  it('the same two chords mean different things in different keys', () => {
    // The same two chords are read against the key: G-C is V-I in C major; C-G is IV-I in G major.
    expect(classifyCadence(parseKey('C major'), chord('G', 'major'), chord('C', 'major'))).toBe('perfect')
    expect(classifyCadence(parseKey('G major'), chord('C', 'major'), chord('G', 'major'))).toBe('plagal')
    expect(classifyCadence(parseKey('C major'), chord('C', 'major'), chord('G', 'major'))).toBe('imperfect')
    expect(classifyCadence(parseKey('F major'), chord('C', 'major'), chord('F', 'major'))).toBe('perfect')
  })

  it('returns null for pairs that are not recognised cadences', () => {
    const c = parseKey('C major')
    expect(classifyCadence(c, chord('C', 'major'), chord('F', 'major'))).toBeNull() // I-IV
    expect(classifyCadence(c, chord('G', 'major'), chord('F', 'major'))).toBeNull() // V-IV
    expect(classifyCadence(c, chord('G', 'major'), chord('G', 'major'))).toBeNull() // V-V
    expect(classifyCadence(c, chord('D', 'major'), chord('G', 'major'))).toBeNull() // II-V: wrong quality
    expect(classifyCadence(c, chord('G', 'minor'), chord('C', 'major'))).toBeNull() // v-I
    expect(classifyCadence(c, chord('G', 'major'), chord('C', 'minor'))).toBeNull() // V-i in a major key
    expect(classifyCadence(parseKey('A minor'), chord('E', 'major'), chord('A', 'major'))).toBeNull() // Picardy third: not covered
    expect(classifyCadence(parseKey('A minor'), chord('E', 'minor'), chord('A', 'minor'))).toBeNull() // v-i
    expect(classifyCadence(parseKey('A minor'), chord('Bb', 'major'), chord('E', 'major'))).toBeNull()
  })

  it('is not fooled by enharmonic respellings', () => {
    // F-Bb in C major is IV-bVII, not a cadence. Spelling is checked, not just sound.
    expect(classifyCadence(parseKey('C major'), chord('F', 'major'), chord('Bb', 'major'))).toBeNull()
    expect(chordSymbol(cadence(parseKey('Gb major'), 'perfect').chords[0])).toBe('Db')
  })
})
