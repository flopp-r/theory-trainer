import { describe, expect, it } from 'vitest'
import { parseTimeSignature } from '../../../theory'
import { timeSignatureExample } from './timeSignatures'

const text = (steps: readonly { text: string }[]) => steps.map((s) => s.text).join(' ')

// Hand-written: time signature, main beats in a bar, type, length of a bar in semiquavers, the beat note.
const TABLE: [ts: string, beats: number, type: string, bar: number, beat: string][] = [
  ['2/4', 2, 'simple duple', 8, 'crotchet'],
  ['3/4', 3, 'simple triple', 12, 'crotchet'],
  ['4/4', 4, 'simple quadruple', 16, 'crotchet'],
  ['2/2', 2, 'simple duple', 16, 'minim'],
  ['3/2', 3, 'simple triple', 24, 'minim'],
  ['3/8', 3, 'simple triple', 6, 'quaver'],
  ['6/8', 2, 'compound duple', 12, 'dotted crotchet'],
  ['9/8', 3, 'compound triple', 18, 'dotted crotchet'],
  ['12/8', 4, 'compound quadruple', 24, 'dotted crotchet'],
  ['6/4', 2, 'compound duple', 24, 'dotted minim'],
]

describe('timeSignatureExample', () => {
  it('gives the hand-written number of beats for every time signature', () => {
    for (const [name, beats, , bar] of TABLE) {
      const e = timeSignatureExample(parseTimeSignature(name), 'beats')
      expect(e.answer, name).toBe(`There are ${beats} main beats in each bar.`)
      expect(e.task, name).toContain('(The beats you would tap.)')
      expect(text(e.steps), name).toContain(`${beats} beats × ${bar / beats} semiquavers`)
      expect(text(e.steps), name).toContain(`= ${bar}`)
      expect(e.steps[0]!.staff!.time).toEqual(parseTimeSignature(name))
      expect(e.steps.at(-1)!.text.startsWith('Check')).toBe(true)
    }
  })

  it('gives the hand-written type for every time signature', () => {
    for (const [name, beats, type] of TABLE) {
      const e = timeSignatureExample(parseTimeSignature(name), 'classify')
      expect(e.answer, name).toBe(`${name} is ${type}.`)
      expect(text(e.steps), name).toContain(`**${type}**`)
      expect(e.steps.at(-1)!.text.startsWith('Check')).toBe(true)
      expect(beats).toBeGreaterThan(1)
    }
  })

  it('divides by 3 in compound time but not in simple time', () => {
    expect(text(timeSignatureExample(parseTimeSignature('12/8'), 'beats').steps)).toContain('12 ÷ 3 = **4**')
    expect(text(timeSignatureExample(parseTimeSignature('9/8'), 'classify').steps)).toContain('9 ÷ 3 = **3**')
    expect(text(timeSignatureExample(parseTimeSignature('6/8'), 'classify').steps)).toContain('6 ÷ 3 = **2**')
    expect(text(timeSignatureExample(parseTimeSignature('3/4'), 'beats').steps)).not.toContain('÷ 3')
    expect(text(timeSignatureExample(parseTimeSignature('3/4'), 'beats').steps)).toContain('the top number is the number of beats in a bar: **3**')
  })

  it('refuses irregular time signatures', () => {
    expect(() => timeSignatureExample(parseTimeSignature('5/4'), 'beats')).toThrow()
    expect(() => timeSignatureExample(parseTimeSignature('7/8'), 'classify')).toThrow()
  })
})

describe('timeSignatureExample (fill)', () => {
  it('fills a 3/4 bar with a minim and a crotchet: 8 + 4 = 12', () => {
    const e = timeSignatureExample(parseTimeSignature('3/4'), 'fill', [{ name: 'minim' }, { name: 'crotchet' }])
    const all = text(e.steps)
    expect(all).toContain('3 × 4 = **12 semiquavers**')
    expect(all).toContain('minim = 8; crotchet = 4')
    expect(all).toContain('8 + 4 = **12**')
    expect(all).toContain('the minim starts on beat 1; the crotchet starts on beat 3')
    expect(e.answer).toBe('A bar of 3/4 can be filled with a minim and a crotchet: 8 + 4 = 12 semiquavers (3 crotchet beats).')
    expect(e.steps[4]!.staff!.time).toEqual(parseTimeSignature('3/4'))
    expect(e.steps[4]!.staff!.items).toHaveLength(2)
  })

  it('fills a 6/8 bar with a dotted crotchet and three quavers: 4 + 2 = 6, then 2 + 2 + 2 = 6, total 12', () => {
    const e = timeSignatureExample(parseTimeSignature('6/8'), 'fill', [{ name: 'crotchet', dots: 1 }, { name: 'quaver' }, { name: 'quaver' }, { name: 'quaver' }])
    const all = text(e.steps)
    expect(all).toContain('6 × 2 = **12 semiquavers**')
    expect(all).toContain('dotted crotchet = 4 + 2 = 6')
    expect(all).toContain('6 + 2 + 2 + 2 = **12**')
    expect(all).toContain('the dotted crotchet starts on beat 1; the quaver starts on beat 2; the quaver starts part-way through beat 2; the quaver starts part-way through beat 2')
  })

  it('fills one beat at a time when no notes are given (2 dotted crotchets in 6/8, 4 crotchets in 4/4)', () => {
    expect(timeSignatureExample(parseTimeSignature('6/8'), 'fill').answer).toBe(
      'A bar of 6/8 can be filled with a dotted crotchet and a dotted crotchet: 6 + 6 = 12 semiquavers (3 crotchet beats).',
    )
    expect(timeSignatureExample(parseTimeSignature('4/4'), 'fill').answer).toBe(
      'A bar of 4/4 can be filled with a crotchet, a crotchet, a crotchet and a crotchet: 4 + 4 + 4 + 4 = 16 semiquavers (4 crotchet beats).',
    )
    expect(timeSignatureExample(parseTimeSignature('12/8'), 'fill').answer).toContain('6 + 6 + 6 + 6 = 24 semiquavers (6 crotchet beats)')
  })

  it('refuses notes that do not fill the bar exactly, and rests', () => {
    expect(() => timeSignatureExample(parseTimeSignature('3/4'), 'fill', [{ name: 'minim' }, { name: 'minim' }])).toThrow()
    expect(() => timeSignatureExample(parseTimeSignature('3/4'), 'fill', [{ name: 'minim' }])).toThrow()
    expect(() => timeSignatureExample(parseTimeSignature('3/4'), 'fill', [{ name: 'minim' }, { name: 'crotchet', rest: true }])).toThrow()
  })
})
