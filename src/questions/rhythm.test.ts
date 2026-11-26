import { describe, expect, it } from 'vitest'
import { noteBeatsGenerator, noteValueGenerator, restValueGenerator, timeSigBeatsGenerator, timeSigTypeGenerator } from './rhythm'
import { createRng } from './rng'
import type { Difficulty, Question } from './types'
import { choicesOf } from './testing'

const ctx = (seed: number, difficulty: Difficulty) => ({ rng: createRng(seed), clefs: ['treble', 'alto'] as const, difficulty, maxLedgerLines: 1 })
const many = (g: { generate: (c: ReturnType<typeof ctx>) => Question }, count: number, difficulty: Difficulty) =>
  Array.from({ length: count }, (_, i) => g.generate(ctx(i + 100 * difficulty, difficulty)))

// Hand-written facts, not taken from the theory module.
const VEX: Record<string, string> = { semibreve: 'w', minim: 'h', crotchet: 'q', quaver: '8', semiquaver: '16' }
const BEATS: Record<string, number> = { semibreve: 4, minim: 2, crotchet: 1, quaver: 0.5, semiquaver: 0.25 }
const DOT_FACTOR = [1, 1.5, 1.75]
const PULSES: Record<string, number> = { '2/4': 2, '3/4': 3, '4/4': 4, '2/2': 2, '3/2': 3, '3/8': 3, '6/8': 2, '9/8': 3, '12/8': 4, '6/4': 2 }
const TYPE: Record<string, string> = {
  '2/4': 'simple duple',
  '3/4': 'simple triple',
  '4/4': 'simple quadruple',
  '2/2': 'simple duple',
  '3/2': 'simple triple',
  '3/8': 'simple triple',
  '6/8': 'compound duple',
  '9/8': 'compound triple',
  '12/8': 'compound quadruple',
  '6/4': 'compound duple',
}

function item(q: Question) {
  const it = q.notation!.staves[0]!.items[0]!
  expect(q.notation!.staves).toHaveLength(1)
  expect(q.notation!.staves[0]!.items).toHaveLength(1)
  return it
}

describe('note-value', () => {
  it('the drawn note matches the answer, at every level', () => {
    for (const level of [1, 2, 3] as const) {
      for (const q of many(noteValueGenerator, 150, level)) {
        const [, figure] = q.id.split(':')
        const [name, dots] = figure!.split('-')
        const drawn = item(q)
        expect(drawn.kind).toBe('notes')
        expect(drawn.duration).toBe(VEX[name!])
        expect(drawn.dots ?? 0).toBe(Number(dots))
        const prefix = Number(dots) === 0 ? '' : Number(dots) === 1 ? 'dotted ' : 'double-dotted '
        expect(q.correct).toBe(prefix + name)
      }
    }
  })

  it('level 1 has no dots; level 2 dots only on minim, crotchet and quaver; level 3 adds more', () => {
    const ids = (level: Difficulty) => new Set(many(noteValueGenerator, 400, level).map((q) => q.id.split(':')[1]))
    expect([...ids(1)].every((id) => id!.endsWith('-0'))).toBe(true)
    expect(ids(1).size).toBe(5)
    const l2 = [...ids(2)].filter((id) => !id!.endsWith('-0'))
    expect(l2.sort()).toEqual(['crotchet-1', 'minim-1', 'quaver-1'])
    expect(ids(3).size).toBeGreaterThan(ids(2).size)
  })

  it('a dotted note always has its undotted twin as a wrong answer (the classic confusion)', () => {
    for (const q of many(noteValueGenerator, 300, 2)) {
      const dotted = q.correct.startsWith('dotted ')
      if (dotted) expect(choicesOf(q).map((c) => c.label)).toContain(q.correct.replace('dotted ', ''))
    }
  })
})

describe('rest-value', () => {
  it('the drawn rest matches the answer', () => {
    for (const level of [1, 2, 3] as const) {
      for (const q of many(restValueGenerator, 120, level)) {
        const [, figure] = q.id.split(':')
        const [name, dots] = figure!.split('-')
        const drawn = item(q)
        expect(drawn.kind).toBe('rest')
        expect(drawn.duration).toBe(VEX[name!])
        expect(drawn.dots ?? 0).toBe(Number(dots))
        expect(q.correct).toBe(`${Number(dots) === 0 ? '' : 'dotted '}${name} rest`)
      }
    }
  })

  it('dotted rests only appear at the hardest level', () => {
    expect(many(restValueGenerator, 300, 1).every((q) => !q.correct.includes('dotted'))).toBe(true)
    expect(many(restValueGenerator, 300, 2).every((q) => !q.correct.includes('dotted'))).toBe(true)
    expect(many(restValueGenerator, 300, 3).some((q) => q.correct.includes('dotted'))).toBe(true)
  })
})

describe('note-beats', () => {
  const label = (n: number) => ({ 0.25: '¼', 0.5: '½', 0.75: '¾', 1.5: '1½', 1.75: '1¾', 3.5: '3½' } as Record<number, string>)[n] ?? String(n)

  it('the answer equals value x dot factor, checked against a hand-written table', () => {
    for (const level of [1, 2, 3] as const) {
      for (const q of many(noteBeatsGenerator, 200, level)) {
        const [name, dots] = q.id.split(':')[1]!.split('-')
        expect(q.correct).toBe(label(BEATS[name!]! * DOT_FACTOR[Number(dots)]!))
        const drawn = item(q)
        expect(drawn.duration).toBe(VEX[name!])
        expect(drawn.dots ?? 0).toBe(Number(dots))
      }
    }
  })

  it('a dotted note has the undotted value among the wrong answers', () => {
    for (const q of many(noteBeatsGenerator, 200, 2)) {
      const [name, dots] = q.id.split(':')[1]!.split('-')
      if (Number(dots) > 0) expect(choicesOf(q).map((c) => c.label)).toContain(label(BEATS[name!]!))
    }
  })
})

describe('time signature questions', () => {
  it('beats per bar match a hand-written table, and the drawn signature matches the id', () => {
    for (const level of [1, 2, 3] as const) {
      for (const q of many(timeSigBeatsGenerator, 150, level)) {
        const ts = q.id.split(':')[1]!
        expect(q.correct).toBe(String(PULSES[ts]))
        const staff = q.notation!.staves[0]!
        expect(`${staff.time!.beats}/${staff.time!.unit}`).toBe(ts)
      }
    }
  })

  it('level 1 beats questions use simple time only; compound time appears from level 2', () => {
    const l1 = new Set(many(timeSigBeatsGenerator, 200, 1).map((q) => q.id.split(':')[1]))
    expect([...l1].sort()).toEqual(['2/4', '3/4', '4/4'])
    const l2 = new Set(many(timeSigBeatsGenerator, 500, 2).map((q) => q.id.split(':')[1]))
    expect(l2.has('6/8')).toBe(true)
  })

  it('in compound time the top number is offered as a tempting wrong answer', () => {
    for (const q of many(timeSigBeatsGenerator, 300, 2)) {
      const ts = q.id.split(':')[1]!
      if (['6/8', '9/8', '12/8', '6/4'].includes(ts)) expect(choicesOf(q).map((c) => c.id)).toContain(ts.split('/')[0])
    }
  })

  it('type matches a hand-written table at every level', () => {
    for (const level of [1, 2, 3] as const) {
      const types = new Set<string>()
      for (const q of many(timeSigTypeGenerator, 200, level)) {
        const ts = q.id.split(':')[1]!
        expect(q.correct).toBe(TYPE[ts])
        types.add(ts)
      }
      if (level === 1) expect([...types].sort()).toEqual(['2/4', '3/4', '4/4', '6/8'])
    }
  })

  it('explanations mention the numbers they reason about', () => {
    const q = timeSigTypeGenerator.generate(ctx(3, 2))
    expect(q.explanation).toContain(q.id.split(':')[1])
    const b = timeSigBeatsGenerator.generate(ctx(3, 2))
    expect(b.explanation.length).toBeGreaterThan(40)
  })
})
