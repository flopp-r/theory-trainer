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
      const text = ascii(e.steps.map((s) => s.text).join(' '))
      if (fifths !== 0) expect(text, name).toContain(handSigns(fifths))
      else expect(text, name).toContain('no sharps or flats')
    }
  })

  it('uses the one-flat exception and the second-to-last-flat rule', () => {
    expect(keyFromSignatureExample(parseKey('F major')).steps.map((s) => s.text).join(' ')).toContain('has to be learned')
    expect(keyFromSignatureExample(parseKey('Eb major')).steps.map((s) => s.text).join(' ')).toContain('second-to-last')
  })

  it('says one signature belongs to two keys, and finds the minor key 3 semitones below the major', () => {
    const text = keyFromSignatureExample(parseKey('F# minor'), 'alto').steps.map((s) => s.text).join(' ')
    expect(text).toContain('A major')
    expect(text).toContain('F♯ minor')
    expect(text).toContain('3 semitones below')
    expect(text).toContain('Count 3 letter names down from A: A, G, F')
  })

  it('has a check that writes the scale', () => {
    const e = keyFromSignatureExample(parseKey('D major'))
    expect(ascii(e.steps.find((s) => s.text.startsWith('Check'))!.text)).toContain('D E F# G A B C#')
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
      expect(e.steps.at(-1)!.staff).toEqual({ clef, key: parseKey('D major'), items: [] })
    }
  })

  it('checks with the circle of fifths, counting one sign per step from C', () => {
    const text = signatureFromKeyExample(parseKey('D major')).steps.map((s) => s.text).join(' ')
    expect(text).toContain('C major (none) → G major (1 sharp) → D major (2 sharps)')
    const flats = signatureFromKeyExample(parseKey('Ab major')).steps.map((s) => s.text).join(' ')
    expect(flats).toContain('C major (none) → F major (1 flat) → B♭ major (2 flats) → E♭ major (3 flats) → A♭ major (4 flats)')
  })

  it('works with the relative major for a minor key', () => {
    const text = signatureFromKeyExample(parseKey('F# minor')).steps[0]!.text
    expect(text).toContain('minor')
    expect(text).toContain('A major')
    expect(text).toContain('F, G, A')
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
