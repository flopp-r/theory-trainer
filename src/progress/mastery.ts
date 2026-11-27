/**
 * What the app learns about the learner, for spaced repetition. Stored on this device only.
 *
 * Two things are tracked:
 * - Areas: each question type (such as "placing notes"), with the last 20 answers, so weak areas can be found.
 * - Items: each exact question that has ever been missed (such as "E4 in bass clef"). A missed item comes back
 *   for review after a growing gap: straight away, then 1, 3, 7 and 14 days. A right answer moves it to the next
 *   gap; a wrong one starts it again. After the 14-day review it counts as learned and stops being scheduled.
 *   Items that were never missed are not scheduled: normal rounds keep practising them.
 */

export const DAY_MS = 24 * 60 * 60 * 1000
/** Days to wait after a right answer, by the box the item moves into (box 1 to 4). Box 5 means learned. */
export const REVIEW_GAPS_DAYS = [0, 1, 3, 7, 14] as const
export const LEARNED_BOX = 5
/** How many recent answers an area remembers. */
export const AREA_MEMORY = 20
/** An area needs this many answers before it can be called weak. */
export const MIN_AREA_ANSWERS = 5
const MAX_ITEMS = 1500

export interface AreaRecord {
  readonly type: string
  readonly topic: string
  /** All answers ever, for the progress screen. */
  readonly answered: number
  readonly correct: number
  /** The last answers, oldest first: true for right. */
  readonly recent: readonly boolean[]
}

export interface ItemRecord {
  readonly id: string
  readonly type: string
  readonly topic: string
  /** Short name of the thing asked, such as "E4 in bass clef". */
  readonly label: string
  /** 0 after a miss; 1 to 4 while being reviewed; 5 once learned. */
  readonly box: number
  /** When it is next due, in milliseconds since 1970. Null once learned. */
  readonly due: number | null
  readonly misses: number
  readonly lastSeen: number
}

interface Stored {
  readonly version: 1
  readonly areas: Record<string, AreaRecord>
  readonly items: Record<string, ItemRecord>
}

const KEY = 'theory-trainer:mastery'
const EMPTY: Stored = { version: 1, areas: {}, items: {} }
let cache: Stored | null = null
const listeners = new Set<() => void>()

const isNum = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v)
const isStr = (v: unknown): v is string => typeof v === 'string' && v !== ''

function validArea(v: unknown): v is AreaRecord {
  if (typeof v !== 'object' || v === null) return false
  const a = v as Record<string, unknown>
  return isStr(a.type) && isStr(a.topic) && isNum(a.answered) && isNum(a.correct) && Array.isArray(a.recent) && a.recent.every((r) => typeof r === 'boolean')
}

function validItem(v: unknown): v is ItemRecord {
  if (typeof v !== 'object' || v === null) return false
  const i = v as Record<string, unknown>
  return (
    isStr(i.id) && isStr(i.type) && isStr(i.topic) && typeof i.label === 'string' && isNum(i.box) && i.box >= 0 && i.box <= LEARNED_BOX &&
    (i.due === null || isNum(i.due)) && isNum(i.misses) && isNum(i.lastSeen)
  )
}

function read(): Stored {
  if (cache) return cache
  try {
    const text = localStorage.getItem(KEY)
    if (text) {
      const parsed = JSON.parse(text) as { version?: unknown; areas?: unknown; items?: unknown }
      if (parsed && parsed.version === 1) {
        const areas: Record<string, AreaRecord> = {}
        const items: Record<string, ItemRecord> = {}
        if (parsed.areas && typeof parsed.areas === 'object') for (const v of Object.values(parsed.areas)) if (validArea(v)) areas[v.type] = v
        if (parsed.items && typeof parsed.items === 'object') for (const v of Object.values(parsed.items)) if (validItem(v)) items[v.id] = v
        cache = { version: 1, areas, items }
        return cache
      }
    }
  } catch {
    // storage blocked or damaged: start empty
  }
  cache = EMPTY
  return cache
}

function write(next: Stored): void {
  cache = next
  try {
    localStorage.setItem(KEY, JSON.stringify(next))
  } catch {
    // storage blocked: it still works until the app is closed
  }
  for (const listener of listeners) listener()
}

/** The facts about one answer that mastery needs. */
export interface AnswerFacts {
  readonly itemId: string
  readonly type: string
  readonly topic: string
  readonly label: string
  readonly correct: boolean
}

/** The next state of an item after an answer. Exported for tests. */
export function nextItem(previous: ItemRecord | undefined, facts: AnswerFacts, now: number): ItemRecord | undefined {
  if (!facts.correct) {
    return { id: facts.itemId, type: facts.type, topic: facts.topic, label: facts.label, box: 0, due: now, misses: (previous?.misses ?? 0) + 1, lastSeen: now }
  }
  // A right answer only matters for an item that is being reviewed.
  if (!previous || previous.box >= LEARNED_BOX) return previous && { ...previous, lastSeen: now }
  const box = previous.box + 1
  const due = box >= LEARNED_BOX ? null : now + REVIEW_GAPS_DAYS[box]! * DAY_MS
  return { ...previous, label: facts.label, box, due, lastSeen: now }
}

/** Record one answer. Call it once per answer, when it is given. */
export function recordAnswer(facts: AnswerFacts, now = Date.now()): void {
  const current = read()
  const area = current.areas[facts.type]
  const recent = [...(area?.recent ?? []), facts.correct].slice(-AREA_MEMORY)
  const areas = {
    ...current.areas,
    [facts.type]: {
      type: facts.type,
      topic: facts.topic,
      answered: (area?.answered ?? 0) + 1,
      correct: (area?.correct ?? 0) + (facts.correct ? 1 : 0),
      recent,
    },
  }
  let items = current.items
  const item = nextItem(current.items[facts.itemId], facts, now)
  if (item) {
    items = { ...items, [item.id]: item }
    const ids = Object.keys(items)
    if (ids.length > MAX_ITEMS) {
      // Forget the learned items seen longest ago first.
      const oldest = Object.values(items)
        .sort((a, b) => Number(b.box >= LEARNED_BOX) - Number(a.box >= LEARNED_BOX) || a.lastSeen - b.lastSeen)
        .slice(0, ids.length - MAX_ITEMS)
      items = { ...items }
      for (const o of oldest) delete items[o.id]
    }
  }
  write({ version: 1, areas, items })
}

export function getAreas(): readonly AreaRecord[] {
  return Object.values(read().areas)
}

export function getItems(): readonly ItemRecord[] {
  return Object.values(read().items)
}

/** Share of the recent answers that were right, or null with no answers. */
export function recentAccuracy(area: AreaRecord): number | null {
  return area.recent.length === 0 ? null : area.recent.filter(Boolean).length / area.recent.length
}

/** Items due for review now, the longest overdue first. */
export function dueItems(now = Date.now()): ItemRecord[] {
  return getItems()
    .filter((i) => i.due !== null && i.due <= now)
    .sort((a, b) => a.due! - b.due!)
}

/** How weak an area is, 0 (all right) to 1 (all wrong). Null when there are too few answers to say. */
export function weakness(area: AreaRecord): number | null {
  const accuracy = recentAccuracy(area)
  return accuracy === null || area.recent.length < MIN_AREA_ANSWERS ? null : 1 - accuracy
}

/** Areas with enough answers and at least one recent miss, weakest first. */
export function weakAreas(): AreaRecord[] {
  return getAreas()
    .filter((a) => (weakness(a) ?? 0) > 0)
    .sort((a, b) => weakness(b)! - weakness(a)! || b.answered - a.answered)
}

/** Forget everything learned (used by "Reset my progress"). */
export function resetMastery(): void {
  try {
    localStorage.removeItem(KEY)
  } catch {
    // nothing to remove
  }
  cache = null
  for (const listener of listeners) listener()
}

export function subscribeMastery(listener: () => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

/** For tests: forget what was read so the next call reads storage again. */
export function resetMasteryCache(): void {
  cache = null
}
