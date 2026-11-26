import { describe, expect, it } from 'vitest'
import { type AnswerResult, compareWithPrevious, missedTopics, summariseSession, verdict } from './sessionSummary'

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

describe('missedTopics, verdict and compareWithPrevious', () => {
  const answer = (topic: string, correct: boolean) => ({ itemId: `${topic}${correct}`, itemLabel: topic, category: topic, correct, ms: 1000, topic })

  it('lists topics with a wrong answer once each, in the order first missed', () => {
    expect(missedTopics([answer('keys', false), answer('notes', true), answer('ear', false), answer('keys', false)])).toEqual(['keys', 'ear'])
    expect(missedTopics([answer('notes', true)])).toEqual([])
    expect(missedTopics([{ itemId: 'a', itemLabel: 'a', category: 'a', correct: false, ms: 1 }])).toEqual([])
  })

  const summaryOf = (correct: number, total: number) =>
    summariseSession(Array.from({ length: total }, (_, i) => answer('notes', i < correct)))

  it('gives a verdict by accuracy, and none for a very short round', () => {
    expect(verdict(summaryOf(10, 10))).toBe('Strong round.')
    expect(verdict(summaryOf(7, 10))).toBe('Good round.')
    expect(verdict(summaryOf(5, 10))).toBe('Getting there.')
    expect(verdict(summaryOf(2, 10))).toMatch(/hard one/)
    expect(verdict(summaryOf(1, 2))).toBe('Short round.')
    expect(verdict(summariseSession([]))).toBe('')
  })

  it('compares with the last round only when both are long enough to mean something', () => {
    expect(compareWithPrevious(summaryOf(8, 10), { total: 10, correct: 5 })).toBe('Up from 5 / 10 last time.')
    expect(compareWithPrevious(summaryOf(4, 10), { total: 10, correct: 8 })).toBe('Down from 8 / 10 last time.')
    expect(compareWithPrevious(summaryOf(7, 10), { total: 10, correct: 7 })).toBe('About the same as last time (7 / 10).')
    expect(compareWithPrevious(summaryOf(8, 10), null)).toBeNull()
    expect(compareWithPrevious(summaryOf(8, 10), { total: 2, correct: 1 })).toBeNull()
    expect(compareWithPrevious(summaryOf(1, 2), { total: 10, correct: 5 })).toBeNull()
  })
})
