import { describe, expect, it } from 'vitest'
import {
  NOTE_VALUES,
  dottedCrotchets,
  dottedSemiquavers,
  formatTimeSignature,
  noteValue,
  noteValueLabel,
  parseTimeSignature,
  restLabel,
  timeSignature,
  timeSignatureInfo,
  timeSignatureTypeLabel,
} from './rhythm'

describe('note values', () => {
  it('has the five standard values with the right lengths', () => {
    expect(NOTE_VALUES.map((v) => [v.name, v.crotchets])).toEqual([
      ['semibreve', 4],
      ['minim', 2],
      ['crotchet', 1],
      ['quaver', 0.5],
      ['semiquaver', 0.25],
    ])
  })

  it('each value is exactly half the one before', () => {
    for (let i = 1; i < NOTE_VALUES.length; i++) {
      expect(NOTE_VALUES[i]!.semiquavers * 2).toBe(NOTE_VALUES[i - 1]!.semiquavers)
    }
  })

  it('semiquavers and crotchets agree', () => {
    for (const v of NOTE_VALUES) expect(v.semiquavers / 4).toBe(v.crotchets)
  })

  it('has the American names for reference', () => {
    expect(noteValue('crotchet').american).toBe('quarter note')
    expect(noteValue('minim').american).toBe('half note')
    expect(noteValue('semibreve').american).toBe('whole note')
    expect(noteValue('quaver').american).toBe('eighth note')
    expect(noteValue('semiquaver').american).toBe('sixteenth note')
  })

  it('rejects unknown names', () => {
    expect(() => noteValue('breve' as never)).toThrow(RangeError)
  })
})

describe('dots', () => {
  it.each([
    ['minim', 1, 3],
    ['crotchet', 1, 1.5],
    ['semibreve', 1, 6],
    ['quaver', 1, 0.75],
    ['minim', 2, 3.5],
    ['crotchet', 2, 1.75],
    ['crotchet', 0, 1],
  ] as const)('%s with %i dot(s) is worth %d crotchets', (name, dots, expected) => {
    expect(dottedCrotchets(name, dots)).toBe(expected)
  })

  it('stays in whole semiquavers for every value and up to two dots (except double-dotted semiquavers)', () => {
    for (const v of NOTE_VALUES) {
      expect(Number.isInteger(dottedSemiquavers(v.name, 1)) || v.name === 'semiquaver').toBe(true)
    }
    expect(dottedSemiquavers('crotchet', 1)).toBe(6)
  })

  it('a dotted note equals the note plus half of it (independent check)', () => {
    for (const v of NOTE_VALUES) {
      expect(dottedCrotchets(v.name, 1)).toBeCloseTo(v.crotchets + v.crotchets / 2, 10)
      expect(dottedCrotchets(v.name, 2)).toBeCloseTo(v.crotchets + v.crotchets / 2 + v.crotchets / 4, 10)
    }
  })

  it('rejects more than two dots', () => {
    expect(() => dottedCrotchets('minim', 3)).toThrow(RangeError)
    expect(() => dottedCrotchets('minim', -1)).toThrow(RangeError)
  })

  it('writes labels', () => {
    expect(noteValueLabel('crotchet')).toBe('crotchet')
    expect(noteValueLabel('minim', 1)).toBe('dotted minim')
    expect(noteValueLabel('minim', 2)).toBe('double-dotted minim')
    expect(restLabel('quaver')).toBe('quaver rest')
    expect(restLabel('crotchet', 1)).toBe('dotted crotchet rest')
  })
})

describe('time signatures', () => {
  const info = (text: string) => timeSignatureInfo(parseTimeSignature(text))

  it.each([
    ['2/4', 'simple', 2, 'duple', 'crotchet', 8],
    ['3/4', 'simple', 3, 'triple', 'crotchet', 12],
    ['4/4', 'simple', 4, 'quadruple', 'crotchet', 16],
    ['2/2', 'simple', 2, 'duple', 'minim', 16],
    ['3/2', 'simple', 3, 'triple', 'minim', 24],
    ['3/8', 'simple', 3, 'triple', 'quaver', 6],
    ['6/8', 'compound', 2, 'duple', 'dotted crotchet', 12],
    ['9/8', 'compound', 3, 'triple', 'dotted crotchet', 18],
    ['12/8', 'compound', 4, 'quadruple', 'dotted crotchet', 24],
    ['6/4', 'compound', 2, 'duple', 'dotted minim', 24],
    ['6/16', 'compound', 2, 'duple', 'dotted quaver', 6],
  ])('%s is %s with %i pulses (%s), %s, bar = %i semiquavers', (text, kind, pulses, grouping, pulseNote, bar) => {
    expect(info(text)).toEqual({ kind, pulses, grouping, pulseNote, barSemiquavers: bar })
  })

  it('in every supported signature, pulses x pulse length equals the bar length', () => {
    const pulseLength: Record<string, number> = {
      crotchet: 4,
      minim: 8,
      quaver: 2,
      'dotted crotchet': 6,
      'dotted minim': 12,
      'dotted quaver': 3,
      'dotted semibreve': 24,
    }
    for (const text of ['2/4', '3/4', '4/4', '2/2', '3/2', '3/8', '6/8', '9/8', '12/8', '6/4', '6/16', '9/4', '12/16']) {
      const i = info(text)
      expect(i.pulses * pulseLength[i.pulseNote]!, text).toBe(i.barSemiquavers)
    }
  })

  it('labels the type', () => {
    expect(timeSignatureTypeLabel(parseTimeSignature('6/8'))).toBe('compound duple')
    expect(timeSignatureTypeLabel(parseTimeSignature('3/4'))).toBe('simple triple')
    expect(timeSignatureTypeLabel(parseTimeSignature('12/8'))).toBe('compound quadruple')
  })

  it('rejects irregular signatures it cannot classify', () => {
    expect(() => timeSignatureInfo(timeSignature(5, 4))).toThrow(RangeError)
    expect(() => timeSignatureInfo(timeSignature(7, 8))).toThrow(RangeError)
  })

  it('formats and parses', () => {
    expect(formatTimeSignature(timeSignature(6, 8))).toBe('6/8')
    expect(parseTimeSignature('12/8')).toEqual({ beats: 12, unit: 8 })
    for (const bad of ['', '4', '4/3', '0/4', '17/4', 'x/4', '4/']) expect(() => parseTimeSignature(bad), bad).toThrow()
  })
})
