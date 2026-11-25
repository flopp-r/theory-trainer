import { describe, expect, it } from 'vitest'
import { multipleChoice, pickSome, withArticle } from './helpers'
import { createRng } from './rng'

describe('multipleChoice', () => {
  const pool = ['a', 'b', 'c', 'd', 'e', 'f']

  it('always includes the correct answer, has the right number of distinct choices, and ids equal labels', () => {
    for (let seed = 0; seed < 200; seed++) {
      const { input, correct } = multipleChoice(createRng(seed), 'c', pool, { count: 4 })
      expect(input.choices).toHaveLength(4)
      expect(new Set(input.choices.map((c) => c.id)).size).toBe(4)
      expect(input.choices.map((c) => c.id)).toContain(correct)
      for (const c of input.choices) expect(c.id).toBe(c.label)
    }
  })

  it('puts the correct answer in different places (not always first or last)', () => {
    const positions = new Set<number>()
    for (let seed = 0; seed < 200; seed++) {
      const { input } = multipleChoice(createRng(seed), 'c', pool)
      positions.add(input.choices.findIndex((c) => c.id === 'c'))
    }
    expect(positions.size).toBe(4)
  })

  it('includes preferred wrong answers whenever they are available', () => {
    for (let seed = 0; seed < 200; seed++) {
      const { input } = multipleChoice(createRng(seed), 'c', pool, { prefer: ['e', 'f'] })
      const ids = input.choices.map((c) => c.id)
      expect(ids).toContain('e')
      expect(ids).toContain('f')
    }
  })

  it('ignores preferred answers that are the correct one or not in the candidates, and never exceeds the count', () => {
    for (let seed = 0; seed < 50; seed++) {
      const { input } = multipleChoice(createRng(seed), 'c', pool, { prefer: ['c', 'zzz', 'a', 'b', 'd', 'e'] })
      expect(input.choices).toHaveLength(4)
      expect(new Set(input.choices.map((c) => c.id)).size).toBe(4)
    }
  })

  it('fixedOrder keeps the order of the candidates', () => {
    for (let seed = 0; seed < 100; seed++) {
      const { input } = multipleChoice(createRng(seed), 'c', pool, { fixedOrder: true })
      const ids = input.choices.map((c) => c.id)
      expect(ids).toEqual([...ids].sort())
    }
  })

  it('works with fewer choices and with the correct answer missing from the candidates', () => {
    const { input } = multipleChoice(createRng(1), 'z', ['a', 'b'], { count: 3 })
    expect(input.choices.map((c) => c.id).sort()).toEqual(['a', 'b', 'z'])
    expect(multipleChoice(createRng(1), 'a', ['a', 'b'], { count: 2 }).input.choices).toHaveLength(2)
  })

  it('ignores duplicates among the candidates', () => {
    const { input } = multipleChoice(createRng(1), 'a', ['b', 'b', 'c', 'c', 'd', 'a'])
    expect(new Set(input.choices.map((c) => c.id)).size).toBe(4)
  })

  it('throws when there are not enough different wrong answers (a bug in the question)', () => {
    expect(() => multipleChoice(createRng(1), 'a', ['b', 'c'])).toThrow(Error)
  })

  it('carries the layout', () => {
    expect(multipleChoice(createRng(1), 'a', pool, { layout: 'list' }).input.layout).toBe('list')
    expect(multipleChoice(createRng(1), 'a', pool).input.layout).toBe('grid')
  })
})

describe('small helpers', () => {
  it('pickSome takes distinct items', () => {
    const picked = pickSome(createRng(1), [1, 2, 3, 4, 5], 3)
    expect(new Set(picked).size).toBe(3)
    expect(() => pickSome(createRng(1), [1], 2)).toThrow(RangeError)
  })

  it('withArticle chooses a or an', () => {
    expect(withArticle('major 3rd')).toBe('a major 3rd')
    expect(withArticle('augmented 4th')).toBe('an augmented 4th')
    expect(withArticle('8ve')).toBe('an 8ve')
  })
})
