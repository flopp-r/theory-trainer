// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest'
import {
  DAY_MS,
  LEARNED_BOX,
  dueItems,
  getAreas,
  getItems,
  nextItem,
  recentAccuracy,
  recordAnswer,
  resetMastery,
  resetMasteryCache,
  weakAreas,
} from './mastery'

const KEY = 'theory-trainer:mastery'
const answer = (correct: boolean, itemId = 'place-note:bass:E2', type = 'place-note') => ({ itemId, type, topic: 'notes', label: 'E2 in bass clef', correct })

beforeEach(() => {
  localStorage.clear()
  resetMasteryCache()
})

describe('review schedule for a missed item', () => {
  it('comes back straight away, then after 1, 3, 7 and 14 days, then counts as learned', () => {
    const t0 = 1_000_000
    let item = nextItem(undefined, answer(false), t0)!
    expect(item).toMatchObject({ box: 0, due: t0, misses: 1 })
    const gaps: (number | null)[] = []
    let t = t0
    for (let i = 0; i < 5; i++) {
      item = nextItem(item, answer(true), t)!
      gaps.push(item.due === null ? null : (item.due - t) / DAY_MS)
      t = item.due ?? t
    }
    expect(gaps).toEqual([1, 3, 7, 14, null])
    expect(item.box).toBe(LEARNED_BOX)
  })

  it('starts again after a miss at any point', () => {
    let item = nextItem(undefined, answer(false), 0)!
    item = nextItem(item, answer(true), 0)!
    item = nextItem(item, answer(true), DAY_MS)!
    expect(item.box).toBe(2)
    item = nextItem(item, answer(false), 2 * DAY_MS)!
    expect(item).toMatchObject({ box: 0, due: 2 * DAY_MS, misses: 2 })
  })

  it('does not schedule an item that was never missed', () => {
    expect(nextItem(undefined, answer(true), 0)).toBeUndefined()
  })
})

describe('recordAnswer and what is due', () => {
  it('keeps a missed item due until it is answered right, then due again a day later', () => {
    recordAnswer(answer(false), 0)
    expect(dueItems(0).map((i) => i.id)).toEqual(['place-note:bass:E2'])
    recordAnswer(answer(true), 10)
    expect(dueItems(10)).toEqual([])
    expect(dueItems(10 + DAY_MS).map((i) => i.id)).toEqual(['place-note:bass:E2'])
  })

  it('lists the longest overdue first', () => {
    recordAnswer(answer(false, 'a'), 5)
    recordAnswer(answer(false, 'b'), 1)
    expect(dueItems(10).map((i) => i.id)).toEqual(['b', 'a'])
  })

  it('remembers the last 20 answers of each area and finds weak areas, weakest first', () => {
    for (let i = 0; i < 25; i++) recordAnswer(answer(i % 2 === 0, `n${i}`, 'note-name'), i)
    for (let i = 0; i < 6; i++) recordAnswer(answer(i === 0, `p${i}`, 'place-note'), i)
    for (let i = 0; i < 3; i++) recordAnswer(answer(false, `k${i}`, 'relative-key'), i) // too few to judge
    const names = getAreas().find((a) => a.type === 'note-name')!
    expect(names.answered).toBe(25)
    expect(names.recent).toHaveLength(20)
    expect(recentAccuracy(names)).toBe(0.5)
    expect(weakAreas().map((a) => a.type)).toEqual(['place-note', 'note-name'])
  })

  it('survives a reload, and reset forgets everything', () => {
    recordAnswer(answer(false), 0)
    resetMasteryCache()
    expect(getItems()).toHaveLength(1)
    resetMastery()
    expect(getItems()).toHaveLength(0)
    expect(localStorage.getItem(KEY)).toBeNull()
  })

  it('ignores damaged data and bad records', () => {
    for (const bad of ['not json', '{"version":2}', 'null']) {
      localStorage.setItem(KEY, bad)
      resetMasteryCache()
      expect(getItems()).toEqual([])
    }
    localStorage.setItem(
      KEY,
      JSON.stringify({
        version: 1,
        areas: { x: { type: 'x', topic: 'notes', answered: 1, correct: 1, recent: [true] }, bad: { type: 'bad' } },
        items: { a: { id: 'a', type: 'x', topic: 'notes', label: 'A', box: 9, due: 0, misses: 1, lastSeen: 0 } },
      }),
    )
    resetMasteryCache()
    expect(getAreas().map((a) => a.type)).toEqual(['x'])
    expect(getItems()).toEqual([])
  })
})
