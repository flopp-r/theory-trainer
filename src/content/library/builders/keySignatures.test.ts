import { describe, expect, it } from 'vitest'
import { CLEF_NAMES, type Key, parseKey, parseNote } from '../../../theory'
import { FLAT_ORDER, MAJOR_FIFTHS, MAJOR_SCALES, MINOR_FIFTHS, NATURAL_MINOR_SCALES, SHARP_ORDER, ascii } from '../../../questions/handTables'
import { fifthsByRules, keyFromSignatureExample, keySignatureTableRows, majorFifthsByRules, majorKeyKind, relativeMajorOf, relativeMinorOf, signatureFromKeyExample } from './keySignatures'
import { noteLabel } from '../../../questions/pitchTools'

const KEYS: { key: Key; name: string; fifths: number }[] = [
  ...Object.entries(MAJOR_FIFTHS).map(([t, fifths]) => ({ key: { tonic: parseNote(t), mode: 'major' } as Key, name: `${t} major`, fifths })),
  ...Object.entries(MINOR_FIFTHS).map(([t, fifths]) => ({ key: { tonic: parseNote(t), mode: 'minor' } as Key, name: `${t} minor`, fifths })),
]

/** The signs of a signature, written by hand from the order. */
function handSigns(fifths: number): string {
  const n = Math.abs(fifths)
  if (n === 0) return ''
  const order = fifths > 0 ? SHARP_ORDER : FLAT_ORDER
  return order
    .slice(0, n)
    .split('')
    .map((l) => l + (fifths > 0 ? '#' : 'b'))
    .join(' ')
}

describe('the key signature rules used by the builders', () => {
  it('give the number of sharps or flats of every standard key, as the hand-written tables say', () => {
    for (const { key, name, fifths } of KEYS) expect(fifthsByRules(key), name).toBe(fifths)
  })

  it('sort the 15 major keys into sharp keys, flat keys and C', () => {
    for (const [t, fifths] of Object.entries(MAJOR_FIFTHS)) {
      expect(majorKeyKind(parseNote(t)), t).toBe(fifths > 0 ? 'sharps' : fifths < 0 ? 'flats' : 'none')
      expect(majorFifthsByRules(parseNote(t)), t).toBe(fifths)
    }
  })

  it('find the relative major and minor by letters and semitones, as the hand-written scales say', () => {
    for (const [t, scale] of Object.entries(MAJOR_SCALES)) expect(ascii(noteLabel(relativeMinorOf(parseNote(t)))), t).toBe(scale.split(' ')[5])
    for (const [t, scale] of Object.entries(NATURAL_MINOR_SCALES)) expect(ascii(noteLabel(relativeMajorOf(parseNote(t)))), t).toBe(scale.split(' ')[2])
  })
})

describe('keyFromSignatureExample', () => {
  it('names every one of the 30 keys from its signature, in every clef', () => {
    for (const { key, name } of KEYS) {
      for (const clef of CLEF_NAMES) {
        const e = keyFromSignatureExample(key, clef)
        expect(ascii(e.answer), `${name} ${clef}`).toBe(`The ${key.mode} key is ${name}.`)
        expect(e.steps[0]!.staff, name).toEqual({ clef, key, items: [] })
      }
    }
  })

  it('states the right number and names of signs', () => {
    for (const { key, name, fifths } of KEYS) {
      const e = keyFromSignatureExample(key)
      const results = ascii(e.steps.map((s) => s.result).join(' | '))
      if (fifths !== 0) expect(results, name).toContain(handSigns(fifths))
      else expect(results, name).toContain('No sharps or flats')
    }
  })

  it('uses the one-flat exception and the second-to-last-flat rule', () => {
    expect(keyFromSignatureExample(parseKey('F major')).steps.map((s) => s.text).join(' ')).toContain('learn this one')
    expect(keyFromSignatureExample(parseKey('Eb major')).steps.map((s) => s.text).join(' ')).toContain('second-to-last')
  })

  it('finds the major key first, then the relative minor 3 letter names and 3 semitones below it', () => {
    const e = keyFromSignatureExample(parseKey('F# minor'), 'alto')
    const text = e.steps.map((s) => s.text).join(' ')
    const results = e.steps.map((s) => s.result)
    expect(results).toContain('Major key: A major')
    expect(results).toContain('Minor key: F♯ minor')
    expect(text).toContain('relative minor')
    expect(text).toContain('Count 3 letter names down from A, counting A as 1: A, G, F')
    expect(text).toContain('A, G♯, G, F♯: 3 steps, so 3 semitones')
  })

  it('checks by the circle of fifths, or by the scale when there are no signs', () => {
    const e = keyFromSignatureExample(parseKey('D major'))
    expect(e.steps.at(-1)!.title).toBe('Check another way: the circle of fifths')
    expect(e.steps.at(-1)!.text).toContain('C (0), G (1), D (2)')
    expect(keyFromSignatureExample(parseKey('Bb minor')).steps.at(-1)!.text).toContain('A (0), D (1), G (2), C (3), F (4), B♭ (5)')
    expect(keyFromSignatureExample(parseKey('C major')).steps.at(-1)!.text).toContain('C D E F G A B')
  })
})

describe('signatureFromKeyExample', () => {
  it('writes the right number and order of signs for every one of the 30 keys', () => {
    for (const { key, name, fifths } of KEYS) {
      const e = signatureFromKeyExample(key)
      const answer = ascii(e.answer)
      if (fifths === 0) expect(answer, name).toBe(`${name} has no sharps or flats.`)
      else expect(answer, name).toBe(`${name} has ${Math.abs(fifths)} ${fifths > 0 ? 'sharp' : 'flat'}${Math.abs(fifths) === 1 ? '' : 's'}: ${handSigns(fifths)}.`)
    }
  })

  it('draws the answer in the clef asked for', () => {
    for (const clef of CLEF_NAMES) {
      const e = signatureFromKeyExample(parseKey('D major'), clef)
      expect(e.steps.find((s) => s.title === 'Write the signs after the clef')!.staff).toEqual({ clef, key: parseKey('D major'), items: [] })
    }
  })

  it('checks with the circle of fifths, counting one sign per step from C', () => {
    const text = signatureFromKeyExample(parseKey('D major')).steps.map((s) => s.text).join(' ')
    expect(text).toContain('C (0), G (1), D (2)')
    const flats = signatureFromKeyExample(parseKey('Ab major')).steps.map((s) => s.text).join(' ')
    expect(flats).toContain('C (0), F (1), B♭ (2), E♭ (3), A♭ (4)')
    expect(flats).toContain('Find A in the order: B (1), E (2), A (3)')
    expect(signatureFromKeyExample(parseKey('Ab major')).steps.map((s) => s.result)).toContain('4 flats: B♭ E♭ A♭ D♭')
  })

  it('works with the relative major for a minor key', () => {
    const e = signatureFromKeyExample(parseKey('F# minor'))
    expect(e.steps[0]!.text).toContain('relative major')
    expect(e.steps[0]!.text).toContain('F, G, A')
    expect(e.steps[1]!.result).toBe('Relative major: A major')
  })

  it('refuses a theoretical key', () => {
    expect(() => signatureFromKeyExample(parseKey('G# major'))).toThrow()
    expect(() => keyFromSignatureExample(parseKey('Db minor'))).toThrow()
  })
})

describe('keySignatureTableRows', () => {
  it('lists the 15 signatures with the major and minor key that share them, as the hand-written tables say', () => {
    const rows = keySignatureTableRows()
    expect(rows).toHaveLength(15)
    for (const row of rows) {
      const major = Object.entries(MAJOR_FIFTHS).find(([t]) => ascii(row[1]!) === `${t} major`)
      const minor = Object.entries(MINOR_FIFTHS).find(([t]) => ascii(row[2]!) === `${t} minor`)
      expect(major, row[1]).toBeDefined()
      expect(minor, row[2]).toBeDefined()
      expect(major![1]).toBe(minor![1])
      expect(ascii(row[3]!).replace('–', '')).toBe(handSigns(major![1]))
      const n = Math.abs(major![1])
      expect(row[0]).toBe(n === 0 ? 'None' : `${n} ${major![1] > 0 ? 'sharp' : 'flat'}${n === 1 ? '' : 's'}`)
    }
  })
})
