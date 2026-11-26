import type { AnswerResult } from './sessionSummary'

/**
 * What the app remembers between visits: the last practice setup and a short list of finished rounds.
 * Stored on this device only, in this browser. Clearing site data removes it.
 * The version number lets later versions of the app change the shape safely.
 */

export interface SessionRecord {
  /** When the round finished, in milliseconds since 1970. */
  readonly at: number
  /** The practice setup as a query string (see practiceConfigToQuery), so like can be compared with like. */
  readonly setup: string
  readonly total: number
  readonly correct: number
}

interface StoredHistory {
  readonly version: 1
  readonly lastSetup: string | null
  readonly sessions: readonly SessionRecord[]
}

const KEY = 'theory-trainer:history'
/** Oldest rounds are dropped beyond this, so storage stays small. */
export const MAX_SESSIONS = 50
const EMPTY: StoredHistory = { version: 1, lastSetup: null, sessions: [] }

let cache: StoredHistory | null = null

function isRecord(value: unknown): value is SessionRecord {
  if (typeof value !== 'object' || value === null) return false
  const v = value as Record<string, unknown>
  return (
    typeof v.at === 'number' &&
    Number.isFinite(v.at) &&
    typeof v.setup === 'string' &&
    typeof v.total === 'number' &&
    Number.isInteger(v.total) &&
    v.total > 0 &&
    typeof v.correct === 'number' &&
    Number.isInteger(v.correct) &&
    v.correct >= 0 &&
    v.correct <= v.total
  )
}

function read(): StoredHistory {
  if (cache) return cache
  try {
    const text = localStorage.getItem(KEY)
    if (text) {
      const parsed: unknown = JSON.parse(text)
      if (typeof parsed === 'object' && parsed !== null && (parsed as { version?: unknown }).version === 1) {
        const { lastSetup, sessions } = parsed as { lastSetup?: unknown; sessions?: unknown }
        cache = {
          version: 1,
          lastSetup: typeof lastSetup === 'string' && lastSetup !== '' ? lastSetup : null,
          sessions: Array.isArray(sessions) ? sessions.filter(isRecord).slice(-MAX_SESSIONS) : [],
        }
        return cache
      }
    }
  } catch {
    // storage blocked or damaged: start empty
  }
  cache = EMPTY
  return cache
}

function write(next: StoredHistory): void {
  cache = next
  try {
    localStorage.setItem(KEY, JSON.stringify(next))
  } catch {
    // storage blocked: it still works until the app is closed
  }
}

/** The setup the learner last started, as a query string, or null if they have not started one. */
export function getLastSetup(): string | null {
  return read().lastSetup
}

export function rememberSetup(setup: string): void {
  write({ ...read(), lastSetup: setup })
}

/** Call before `recordSession`, so the round just finished is not compared with itself. */
export function previousSession(setup: string): SessionRecord | null {
  const same = read().sessions.filter((s) => s.setup === setup)
  return same.length > 0 ? same[same.length - 1]! : null
}

/** Rounds with nothing answered are not kept. */
export function recordSession(record: SessionRecord): void {
  if (record.total <= 0) return
  const current = read()
  write({ ...current, sessions: [...current.sessions, record].slice(-MAX_SESSIONS) })
}

/** For tests: forget what was read so the next call reads storage again. */
export function resetHistoryCache(): void {
  cache = null
}

/** The most recent finished round, or null. */
export function lastSession(): SessionRecord | null {
  const sessions = read().sessions
  return sessions.length > 0 ? sessions[sessions.length - 1]! : null
}

// ---- A round in progress, so a reload or a closed tab does not lose it ----

const ROUND_KEY = 'theory-trainer:round'
/** An unfinished round older than this is not offered again. */
export const ROUND_MAX_AGE_MS = 12 * 60 * 60 * 1000

export interface RoundInProgress {
  readonly setup: string
  readonly savedAt: number
  readonly results: readonly AnswerResult[]
}

function isAnswer(value: unknown): value is AnswerResult {
  if (typeof value !== 'object' || value === null) return false
  const v = value as Record<string, unknown>
  return typeof v.itemId === 'string' && typeof v.itemLabel === 'string' && typeof v.category === 'string' && typeof v.correct === 'boolean' && typeof v.ms === 'number'
}

/** The unfinished round, if there is a recent one. With `setup`, only a round on that setup. */
export function loadRound(setup?: string, now = Date.now()): RoundInProgress | null {
  try {
    const text = localStorage.getItem(ROUND_KEY)
    if (!text) return null
    const v = JSON.parse(text) as Partial<RoundInProgress> & { version?: unknown }
    if (v.version !== 1 || typeof v.setup !== 'string' || typeof v.savedAt !== 'number' || !Array.isArray(v.results)) return null
    if (now - v.savedAt > ROUND_MAX_AGE_MS || v.results.length === 0 || !v.results.every(isAnswer)) return null
    if (setup !== undefined && v.setup !== setup) return null
    return { setup: v.setup, savedAt: v.savedAt, results: v.results }
  } catch {
    return null
  }
}

export function saveRound(setup: string, results: readonly AnswerResult[], now = Date.now()): void {
  try {
    localStorage.setItem(ROUND_KEY, JSON.stringify({ version: 1, setup, savedAt: now, results }))
  } catch {
    // storage blocked: the round still works, it just cannot be resumed
  }
}

export function clearRound(): void {
  try {
    localStorage.removeItem(ROUND_KEY)
  } catch {
    // nothing to clear
  }
}
