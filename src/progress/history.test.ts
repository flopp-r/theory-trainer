// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest'
import { MAX_SESSIONS, getLastSetup, previousSession, recordSession, rememberSetup, resetHistoryCache } from './history'

const KEY = 'theory-trainer:history'
const rec = (over: Partial<{ at: number; setup: string; total: number; correct: number }> = {}) => ({
  at: 1,
  setup: 'topics=notes',
  total: 10,
  correct: 7,
  ...over,
})

beforeEach(() => {
  localStorage.clear()
  resetHistoryCache()
})

describe('history', () => {
  it('starts empty', () => {
    expect(getLastSetup()).toBeNull()
    expect(previousSession('topics=notes')).toBeNull()
  })

  it('remembers the last setup after the app is reopened', () => {
    rememberSetup('topics=keys&clefs=treble')
    resetHistoryCache()
    expect(getLastSetup()).toBe('topics=keys&clefs=treble')
  })

  it('finds the latest earlier round with the same setup, and ignores other setups', () => {
    recordSession(rec({ at: 1, correct: 4 }))
    recordSession(rec({ at: 2, setup: 'topics=keys', correct: 9 }))
    recordSession(rec({ at: 3, correct: 6 }))
    resetHistoryCache()
    expect(previousSession('topics=notes')).toEqual(rec({ at: 3, correct: 6 }))
    expect(previousSession('topics=keys')?.correct).toBe(9)
    expect(previousSession('topics=ear')).toBeNull()
  })

  it('does not keep a round with nothing answered', () => {
    recordSession(rec({ total: 0, correct: 0 }))
    expect(previousSession('topics=notes')).toBeNull()
  })

  it('keeps only the most recent rounds', () => {
    for (let i = 0; i < MAX_SESSIONS + 5; i += 1) recordSession(rec({ at: i }))
    resetHistoryCache()
    const stored = JSON.parse(localStorage.getItem(KEY)!)
    expect(stored.sessions).toHaveLength(MAX_SESSIONS)
    expect(stored.sessions[0].at).toBe(5)
  })

  it('stores a version number', () => {
    rememberSetup('topics=notes')
    expect(JSON.parse(localStorage.getItem(KEY)!).version).toBe(1)
  })

  it('ignores damaged or unknown data and drops bad records', () => {
    for (const bad of ['not json', '{"version":2,"lastSetup":"x"}', 'null', '[]', '{"version":1,"lastSetup":7,"sessions":"no"}']) {
      localStorage.setItem(KEY, bad)
      resetHistoryCache()
      expect(getLastSetup()).toBeNull()
      expect(previousSession('x')).toBeNull()
    }
    localStorage.setItem(
      KEY,
      JSON.stringify({ version: 1, lastSetup: 'a', sessions: [rec({ correct: 11 }), { nope: true }, rec({ at: 9 })] }),
    )
    resetHistoryCache()
    expect(getLastSetup()).toBe('a')
    expect(previousSession('topics=notes')).toEqual(rec({ at: 9 }))
  })
})
