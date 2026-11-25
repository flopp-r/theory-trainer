import { at } from '../theory/util'

/** A small seedable random number generator, so tests can replay the same questions. */
export interface Rng {
  /** Float in [0, 1). */
  next(): number
  /** Whole number from min to max, both included. */
  int(min: number, max: number): number
  pick<T>(items: readonly T[]): T
  /** A shuffled copy. */
  shuffle<T>(items: readonly T[]): T[]
}

/** Turns text or a number into a 32-bit seed. */
function hashSeed(seed: number | string): number {
  if (typeof seed === 'number') return seed >>> 0
  let h = 1779033703 ^ seed.length
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(h ^ seed.charCodeAt(i), 3432918353)
    h = (h << 13) | (h >>> 19)
  }
  return h >>> 0
}

/** mulberry32: tiny, fast and good enough for choosing practice questions. Not for security. */
export function createRng(seed: number | string): Rng {
  let state = hashSeed(seed)
  const next = (): number => {
    state = (state + 0x6d2b79f5) >>> 0
    let t = state
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
  const int = (min: number, max: number): number => {
    if (!Number.isInteger(min) || !Number.isInteger(max) || max < min) {
      throw new RangeError(`int(${min}, ${max}) needs whole numbers with max >= min`)
    }
    return min + Math.floor(next() * (max - min + 1))
  }
  return {
    next,
    int,
    pick<T>(items: readonly T[]): T {
      if (items.length === 0) throw new RangeError('Cannot pick from an empty list')
      return at(items, int(0, items.length - 1))
    },
    shuffle<T>(items: readonly T[]): T[] {
      const copy = [...items]
      for (let i = copy.length - 1; i > 0; i--) {
        const j = int(0, i)
        const a = at(copy, i)
        copy[i] = at(copy, j)
        copy[j] = a
      }
      return copy
    },
  }
}

/** A fresh seed for real sessions (tests pass their own). */
export function randomSeed(): number {
  return Math.floor(Math.random() * 4294967296)
}
