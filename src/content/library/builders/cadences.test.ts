import { describe, expect, it } from 'vitest'
import { CADENCE_TYPES, type CadenceType, keyFromFifths, parseKey } from '../../../theory'
import { ascii } from '../../../questions/handTables'
import { cadenceExample, cadenceFromNumerals } from './cadences'

// Hand-written: the chord symbols of each cadence (ASCII), first chord then second chord.
const MAJOR: Record<string, Record<CadenceType, string>> = {
  'C major': { perfect: 'G then C', imperfect: 'C then G', plagal: 'F then C', interrupted: 'G then Am' },
  'G major': { perfect: 'D then G', imperfect: 'G then D', plagal: 'C then G', interrupted: 'D then Em' },
  'D major': { perfect: 'A then D', imperfect: 'D then A', plagal: 'G then D', interrupted: 'A then Bm' },
  'F major': { perfect: 'C then F', imperfect: 'F then C', plagal: 'Bb then F', interrupted: 'C then Dm' },
  'Bb major': { perfect: 'F then Bb', imperfect: 'Bb then F', plagal: 'Eb then Bb', interrupted: 'F then Gm' },
}
const MINOR: Record<string, Record<CadenceType, string>> = {
  'A minor': { perfect: 'E then Am', imperfect: 'Am then E', plagal: 'Dm then Am', interrupted: 'E then F' },
  'E minor': { perfect: 'B then Em', imperfect: 'Em then B', plagal: 'Am then Em', interrupted: 'B then C' },
  'D minor': { perfect: 'A then Dm', imperfect: 'Dm then A', plagal: 'Gm then Dm', interrupted: 'A then Bb' },
  'C minor': { perfect: 'G then Cm', imperfect: 'Cm then G', plagal: 'Fm then Cm', interrupted: 'G then Ab' },
}

// Hand-written numerals for each.
const NUMERALS_MAJOR: Record<CadenceType, string> = { perfect: 'V then I', imperfect: 'I then V', plagal: 'IV then I', interrupted: 'V then vi' }
const NUMERALS_MINOR: Record<CadenceType, string> = { perfect: 'V then i', imperfect: 'i then V', plagal: 'iv then i', interrupted: 'V then VI' }

describe('cadenceFromNumerals', () => {
  it('matches the four patterns (and only those)', () => {
    expect(cadenceFromNumerals('V', 'I', false)).toBe('perfect')
    expect(cadenceFromNumerals('V7', 'I', false)).toBe('perfect')
    expect(cadenceFromNumerals('I', 'V', false)).toBe('imperfect')
    expect(cadenceFromNumerals('ii', 'V', false)).toBe('imperfect')
    expect(cadenceFromNumerals('IV', 'V', false)).toBe('imperfect')
    expect(cadenceFromNumerals('IV', 'I', false)).toBe('plagal')
    expect(cadenceFromNumerals('V', 'vi', false)).toBe('interrupted')
    expect(cadenceFromNumerals('vi', 'V', false)).toBeNull()
    expect(cadenceFromNumerals('I', 'IV', false)).toBeNull()
    expect(cadenceFromNumerals('V', 'i', true)).toBe('perfect')
    expect(cadenceFromNumerals('ii°', 'V', true)).toBe('imperfect')
    expect(cadenceFromNumerals('iv', 'i', true)).toBe('plagal')
    expect(cadenceFromNumerals('V', 'VI', true)).toBe('interrupted')
    expect(cadenceFromNumerals('V', 'vi', true)).toBeNull()
  })
})

describe('cadenceExample', () => {
  for (const [table, numerals] of [[MAJOR, NUMERALS_MAJOR], [MINOR, NUMERALS_MINOR]] as const) {
    it(`gets every cadence right in the hand-written ${table === MAJOR ? 'major' : 'minor'} keys, whether identified or written`, () => {
      for (const [keyName, row] of Object.entries(table)) {
        for (const type of CADENCE_TYPES) {
          const id = cadenceExample(parseKey(keyName), type, 'identify')
          expect(ascii(id.answer), `${keyName} ${type}`).toBe(`It is a ${type} cadence (${numerals[type]}, ${row[type]}).`.replace('a imperfect', 'an imperfect').replace('a interrupted', 'an interrupted'))
          const written = cadenceExample(parseKey(keyName), type, 'write')
          expect(ascii(written.answer), `${keyName} ${type}`).toBe(`The ${type} cadence in ${keyName} is ${row[type]} (${numerals[type]}).`)
        }
      }
    })
  }

  it('identify: numbers the scale, names both chords, pairs the numerals, matches the pattern and checks', () => {
    const e = cadenceExample(parseKey('C major'), 'perfect', 'identify')
    expect(e.steps).toHaveLength(7)
    expect(e.steps[0]!.staff!.items).toHaveLength(2)
    expect(e.steps[0]!.staff!.key).toBeDefined()
    expect(e.steps[1]!.text).toContain('1 C, 2 D, 3 E, 4 F, 5 G, 6 A, 7 B')
    expect(e.steps[2]!.text).toContain('note 5')
    expect(e.steps[3]!.text).toContain('note 1')
    expect(e.steps[4]!.text).toContain('**V then I**')
    expect(e.steps[5]!.text).toContain('is a **perfect** cadence')
    expect(e.steps[6]!.text.startsWith('Check')).toBe(true)
  })

  it('plays the key chord at 0 s, then the two chords at 2.1 s and 3.5 s', () => {
    const e = cadenceExample(parseKey('C major'), 'perfect', 'identify')
    const events = e.steps[0]!.listen!.audio.events
    expect(events.map((x) => x.start)).toEqual([0, 2.1, 3.5])
    const pcs = events.map((x) => [...x.midi].map((m) => m % 12).sort((a, b) => a - b))
    expect(pcs).toEqual([[0, 4, 7], [2, 7, 11], [0, 4, 7]]) // C E G, then G B D, then C E G
  })

  it('plays the plagal cadence in D major as D, then G, then D', () => {
    const e = cadenceExample(parseKey('D major'), 'plagal', 'write')
    const events = e.steps.find((s) => s.listen)!.listen!.audio.events
    const pcs = events.map((x) => [...x.midi].map((m) => m % 12).sort((a, b) => a - b))
    expect(pcs).toEqual([[2, 6, 9], [2, 7, 11], [2, 6, 9]])
  })

  it('says the key signature already gives D major its F sharp, and minor keys need a sign for the leading note', () => {
    const dMajor = cadenceExample(parseKey('D major'), 'plagal', 'write')
    expect(dMajor.steps.map((s) => s.text).join(' ')).toContain('no sign is needed')
    const aMinor = cadenceExample(parseKey('A minor'), 'perfect', 'write')
    expect(aMinor.steps.map((s) => s.text).join(' ')).toContain('G♯ needs a sharp')
    const cMinor = cadenceExample(parseKey('C minor'), 'perfect', 'write')
    expect(cMinor.steps.map((s) => s.text).join(' ')).toContain('B needs a natural')
  })

  it('also works with the V7 version and with every standard key without error', () => {
    expect(ascii(cadenceExample(parseKey('C major'), 'perfect', 'identify', 1).answer)).toContain('V7 then I, G7 then C')
    for (let fifths = -7; fifths <= 7; fifths++) {
      for (const mode of ['major', 'minor'] as const) {
        for (const type of CADENCE_TYPES) {
          expect(() => cadenceExample(keyFromFifths(fifths, mode), type, 'identify'), `${fifths} ${mode} ${type}`).not.toThrow()
          expect(() => cadenceExample(keyFromFifths(fifths, mode), type, 'write'), `${fifths} ${mode} ${type}`).not.toThrow()
        }
      }
    }
  })
})
