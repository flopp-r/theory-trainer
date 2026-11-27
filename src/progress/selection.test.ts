import { describe, expect, it } from 'vitest'
import { type QuestionContext, createRng, generateQuestion } from '../questions'
import type { AreaRecord, ItemRecord } from './mastery'
import { type Focus, pickQuestion, reviewScope } from './selection'

const context = (seed: number, avoidItemId?: string): QuestionContext => ({
  rng: createRng(seed),
  clefs: ['treble', 'bass'],
  difficulty: 2,
  maxLedgerLines: 1,
  avoidItemId,
})

// A real item id, so the search can find it.
const realItem = (): ItemRecord => {
  const q = generateQuestion(context(7), ['notes'], ['note-name'])
  return { id: q.id, type: 'note-name', topic: 'notes', label: q.itemLabel, box: 0, due: 0, misses: 1, lastSeen: 0 }
}
const area = (type: string, topic: string, right: number, of: number): AreaRecord => ({
  type,
  topic,
  answered: of,
  correct: right,
  recent: Array.from({ length: of }, (_, i) => i < right),
})
const none: Focus = { due: [], weak: [] }

describe('pickQuestion', () => {
  it('asks the exact due item in a review round (share 1)', () => {
    const item = realItem()
    for (let seed = 1; seed <= 20; seed++) {
      const q = pickQuestion(context(seed), ['notes'], undefined, { due: [item], weak: [] }, 1)
      expect(q.type).toBe('note-name')
    }
    const hits = Array.from({ length: 20 }, (_, s) => pickQuestion(context(s + 100), ['notes'], undefined, { due: [item], weak: [] }, 1)).filter((q) => q.id === item.id)
    expect(hits.length).toBeGreaterThanOrEqual(12)
  })

  it('ignores due items outside the round, and never repeats the question just asked', () => {
    const item = realItem()
    for (let seed = 1; seed <= 30; seed++) {
      expect(pickQuestion(context(seed), ['rhythm'], undefined, { due: [item], weak: [] }, 1).topic).toBe('rhythm')
      expect(pickQuestion(context(seed, item.id), ['notes'], undefined, { due: [item], weak: [] }, 1).id).not.toBe(item.id)
    }
  })

  it('goes to weak areas, the weaker more often', () => {
    const weak = [area('place-note', 'notes', 1, 10), area('note-accidental', 'notes', 8, 10)]
    const counts: Record<string, number> = {}
    for (let seed = 1; seed <= 300; seed++) {
      const q = pickQuestion(context(seed), ['notes'], undefined, { due: [], weak }, 1)
      counts[q.type] = (counts[q.type] ?? 0) + 1
    }
    expect(Object.keys(counts).sort()).toEqual(['note-accidental', 'place-note'])
    expect(counts['place-note']!).toBeGreaterThan(counts['note-accidental']! * 2)
  })

  it('in a normal round, gives about half the questions to the focus', () => {
    const weak = [area('relative-key', 'keys', 0, 10)]
    let focused = 0
    for (let seed = 1; seed <= 400; seed++) if (pickQuestion(context(seed), ['keys'], undefined, { due: [], weak }, 0.5).type === 'relative-key') focused++
    // Half by design, plus the share of random questions that happen to be that type anyway.
    expect(focused / 400).toBeGreaterThan(0.5)
    expect(focused / 400).toBeLessThan(0.8)
  })

  it('is an ordinary random question when nothing is known', () => {
    for (let seed = 1; seed <= 20; seed++) expect(pickQuestion(context(seed), ['notes', 'rhythm'], undefined, none, 1).topic).toMatch(/notes|rhythm/)
  })

  it('stays inside the round\'s own question types', () => {
    const weak = [area('relative-key', 'keys', 0, 10)]
    for (let seed = 1; seed <= 30; seed++) expect(pickQuestion(context(seed), ['keys'], ['key-from-signature'], { due: [], weak }, 1).type).toBe('key-from-signature')
  })
})

describe('reviewScope', () => {
  it('covers the topics and types of what is due and weak', () => {
    const scope = reviewScope({ due: [realItem()], weak: [area('relative-key', 'keys', 2, 10), area('nonsense', 'x', 0, 10)] })
    expect(scope.types.sort()).toEqual(['note-name', 'relative-key'])
    expect(scope.topics.sort()).toEqual(['keys', 'notes'])
  })
})
