import { describe, expect, it } from 'vitest'
import { createRng } from './rng'

describe('createRng', () => {
  it('gives the same sequence for the same seed, and different ones for different seeds', () => {
    const a = createRng(42)
    const b = createRng(42)
    const c = createRng(43)
    const seqA = Array.from({ length: 20 }, () => a.next())
    expect(Array.from({ length: 20 }, () => b.next())).toEqual(seqA)
    expect(Array.from({ length: 20 }, () => c.next())).not.toEqual(seqA)
  })

  it('accepts text seeds', () => {
    expect(createRng('hello').next()).toBe(createRng('hello').next())
    expect(createRng('hello').next()).not.toBe(createRng('hellp').next())
  })

  it('next() stays in [0, 1)', () => {
    const rng = createRng(1)
    for (let i = 0; i < 10000; i++) {
      const v = rng.next()
      expect(v).toBeGreaterThanOrEqual(0)
      expect(v).toBeLessThan(1)
    }
  })

  it('int() covers the whole range, including both ends, and nothing outside it', () => {
    const rng = createRng(7)
    const seen = new Set<number>()
    for (let i = 0; i < 2000; i++) seen.add(rng.int(3, 9))
    expect([...seen].sort((x, y) => x - y)).toEqual([3, 4, 5, 6, 7, 8, 9])
    expect(rng.int(5, 5)).toBe(5)
    expect(() => rng.int(5, 4)).toThrow(RangeError)
    expect(() => rng.int(1.5, 3)).toThrow(RangeError)
  })

  it('pick() is roughly even', () => {
    const rng = createRng(99)
    const counts = { a: 0, b: 0, c: 0, d: 0 }
    for (let i = 0; i < 8000; i++) counts[rng.pick(['a', 'b', 'c', 'd'] as const)]++
    for (const count of Object.values(counts)) {
      expect(count).toBeGreaterThan(1700)
      expect(count).toBeLessThan(2300)
    }
    expect(() => rng.pick([])).toThrow(RangeError)
  })

  it('shuffle() keeps every item, does not change the input, and is repeatable', () => {
    const input = [1, 2, 3, 4, 5, 6, 7, 8]
    const out = createRng(5).shuffle(input)
    expect(input).toEqual([1, 2, 3, 4, 5, 6, 7, 8])
    expect([...out].sort((x, y) => x - y)).toEqual(input)
    expect(createRng(5).shuffle(input)).toEqual(out)
    expect(out).not.toEqual(input)
  })
})
