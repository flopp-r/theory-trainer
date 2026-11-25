import { describe, expect, it } from 'vitest'
import { type AnswerResult, summariseSession } from './sessionSummary'

const r = (itemId: string, category: string, correct: boolean, ms = 1000): AnswerResult => ({
  itemId,
  itemLabel: `label ${itemId}`,
  category,
  correct,
  ms,
})

describe('summariseSession', () => {
  it('handles an empty session', () => {
    expect(summariseSession([])).toEqual({
      total: 0,
      correct: 0,
      accuracy: null,
      averageMs: null,
      byCategory: [],
      missed: [],
    })
  })

  it('counts totals, accuracy and average time', () => {
    const s = summariseSession([r('a', 'Alto clef', true, 1000), r('b', 'Alto clef', false, 3000), r('c', 'Treble clef', true, 2000), r('d', 'Treble clef', true, 2000)])
    expect(s.total).toBe(4)
    expect(s.correct).toBe(3)
    expect(s.accuracy).toBe(0.75)
    expect(s.averageMs).toBe(2000)
  })

  it('breaks results down by category in the order first seen', () => {
    const s = summariseSession([r('a', 'Treble clef', true), r('b', 'Alto clef', false), r('c', 'Treble clef', false), r('d', 'Alto clef', false)])
    expect(s.byCategory).toEqual([
      { category: 'Treble clef', total: 2, correct: 1 },
      { category: 'Alto clef', total: 2, correct: 0 },
    ])
  })

  it('lists missed items once each, most misses first, and leaves out items answered correctly', () => {
    const s = summariseSession([
      r('a', 'x', false),
      r('b', 'x', false),
      r('b', 'x', false),
      r('c', 'x', true),
      r('a', 'x', true), // answered right later: still counts as a miss earlier in the session
      r('d', 'x', false),
      r('b', 'x', false),
    ])
    expect(s.missed.map((m) => [m.itemId, m.misses])).toEqual([
      ['b', 3],
      ['a', 1],
      ['d', 1],
    ])
    expect(s.missed[0]?.itemLabel).toBe('label b')
  })

  it('correct plus wrong always equals total', () => {
    const results = Array.from({ length: 50 }, (_, i) => r(`i${i % 7}`, i % 2 ? 'A' : 'B', i % 3 === 0))
    const s = summariseSession(results)
    expect(s.byCategory.reduce((n, c) => n + c.total, 0)).toBe(s.total)
    expect(s.byCategory.reduce((n, c) => n + c.correct, 0)).toBe(s.correct)
    expect(s.missed.reduce((n, m) => n + m.misses, 0)).toBe(s.total - s.correct)
  })
})
