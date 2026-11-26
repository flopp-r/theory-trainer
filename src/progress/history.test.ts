// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest'
import { MAX_SESSIONS, ROUND_MAX_AGE_MS, clearRound, getLastSetup, lastSession, loadRound, previousSession, recordSession, rememberSetup, resetHistoryCache, saveRound } from './history'

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

describe('lastSession', () => {
  it('is the most recent round of any setup', () => {
    expect(lastSession()).toBeNull()
    recordSession(rec({ at: 1 }))
    recordSession(rec({ at: 2, setup: 'topics=keys' }))
    expect(lastSession()?.setup).toBe('topics=keys')
  })
})

describe('a round in progress', () => {
  const answer = { itemId: 'a', itemLabel: 'A', category: 'Notes', correct: true, ms: 900, topic: 'notes', type: 'note-name' }

  it('is kept and given back for the same setup', () => {
    saveRound('topics=notes', [answer, { ...answer, correct: false }], 1000)
    expect(loadRound('topics=notes', 2000)?.results).toHaveLength(2)
    expect(loadRound(undefined, 2000)?.setup).toBe('topics=notes')
  })

  it('is not given back for another setup, when too old, or after clearing', () => {
    saveRound('topics=notes', [answer], 1000)
    expect(loadRound('topics=keys', 2000)).toBeNull()
    expect(loadRound('topics=notes', 1000 + ROUND_MAX_AGE_MS + 1)).toBeNull()
    clearRound()
    expect(loadRound()).toBeNull()
  })

  it('ignores damaged data', () => {
    for (const bad of ['not json', '{"version":2}', '{"version":1,"setup":"x","savedAt":1,"results":[{"nope":1}]}', '{"version":1,"setup":"x","savedAt":1,"results":[]}']) {
      localStorage.setItem('theory-trainer:round', bad)
      expect(loadRound(undefined, 2)).toBeNull()
    }
  })
})
