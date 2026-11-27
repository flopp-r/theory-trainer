import { describe, expect, it } from 'vitest'
import { parseTimeSignature } from '../../../theory'
import { timeSignatureExample } from './timeSignatures'

const text = (steps: readonly { title?: string; text: string; result?: string }[]) => steps.map((s) => [s.title, s.text, s.result].join(' ')).join(' ')

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
    for (const [name, beats, type, bar, beat] of TABLE) {
      const e = timeSignatureExample(parseTimeSignature(name), 'beats')
      expect(e.answer, name).toBe(`There are ${beats} main beats in each bar.`)
      expect(e.task, name).toContain('(The beats you would tap.)')
      if (type.startsWith('compound')) {
        // the check measures the bar and one beat in semiquavers and divides
        expect(text(e.steps), name).toContain(`${bar} ÷ ${bar / beats} = ${beats} beats`)
        expect(text(e.steps), name).toContain(`Each beat is a ${beat}`)
      } else {
        // the check counts the bar aloud in half-beats: 1 & 2 & ...
        expect(text(e.steps), name).toContain(Array.from({ length: beats }, (_, i) => `${i + 1} &`).join(' '))
        expect(text(e.steps), name).toContain(`${beats * 2} ÷ 2 = ${beats} beats`)
        expect(text(e.steps), name).toContain(`${beats} ${beat} beats in a bar`)
      }
      expect(e.steps[0]!.staff!.time).toEqual(parseTimeSignature(name))
      expect(e.steps.at(-1)!.title!.startsWith('Check')).toBe(true)
    }
  })

  it('gives the hand-written type for every time signature', () => {
    for (const [name, beats, type] of TABLE) {
      const e = timeSignatureExample(parseTimeSignature(name), 'classify')
      expect(e.answer, name).toBe(`${name} is ${type}.`)
      expect(e.steps.map((s) => s.result), name).toContain(type.charAt(0).toUpperCase() + type.slice(1))
      expect(e.steps.at(-1)!.title!.startsWith('Check')).toBe(true)
      expect(beats).toBeGreaterThan(1)
    }
  })

  it('divides by 3 in compound time but not in simple time', () => {
    expect(text(timeSignatureExample(parseTimeSignature('12/8'), 'beats').steps)).toContain('12 ÷ 3 = 4 groups')
    expect(text(timeSignatureExample(parseTimeSignature('9/8'), 'classify').steps)).toContain('9 ÷ 3 = 3')
    expect(text(timeSignatureExample(parseTimeSignature('6/8'), 'classify').steps)).toContain('6 ÷ 3 = 2')
    expect(text(timeSignatureExample(parseTimeSignature('3/4'), 'beats').steps)).not.toContain('÷ 3')
    expect(text(timeSignatureExample(parseTimeSignature('3/4'), 'beats').steps)).toContain('the top number is the number of beats')
    expect(text(timeSignatureExample(parseTimeSignature('3/4'), 'beats').steps)).toContain('So there are 3 beats')
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
    expect(all).toContain('3 × 4 = 12')
    expect(all).toContain('a minim is 16 ÷ 2 = 8 semiquavers')
    expect(all).toContain('a crotchet is 16 ÷ 4 = 4 semiquavers')
    expect(all).toContain('8 + 4 = 12')
    expect(all).toContain('The minim (8) covers beats 1 and 2; the crotchet (4) fills beat 3')
    expect(e.answer).toBe('A bar of 3/4 can be filled with a minim and a crotchet: 8 + 4 = 12 semiquavers (3 crotchet beats).')
    const written = e.steps.find((s) => s.title === 'Write the notes in the bar')!
    expect(written.staff!.time).toEqual(parseTimeSignature('3/4'))
    expect(written.staff!.items).toHaveLength(2)
    // one step for each note
    expect(e.steps.filter((s) => / note: the /.test(s.title ?? '')).map((s) => s.result)).toEqual(['8 semiquavers', '4 semiquavers'])
  })

  it('fills a 6/8 bar with a dotted crotchet and three quavers: 4 + 2 = 6, then 2 + 2 + 2 = 6, total 12', () => {
    const e = timeSignatureExample(parseTimeSignature('6/8'), 'fill', [{ name: 'crotchet', dots: 1 }, { name: 'quaver' }, { name: 'quaver' }, { name: 'quaver' }])
    const all = text(e.steps)
    expect(all).toContain('6 × 2 = 12')
    expect(all).toContain('4 + 2 = 6')
    expect(all).toContain('6 + 2 = 8, then 8 + 2 = 10, then 10 + 2 = 12')
    expect(all).toContain('The dotted crotchet (6) fills beat 1; the three quavers (2 + 2 + 2 = 6) fill beat 2')
    expect(e.steps.filter((s) => / note: the /.test(s.title ?? '')).map((s) => s.result)).toEqual(['6 semiquavers', '2 semiquavers', '2 semiquavers', '2 semiquavers'])
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
