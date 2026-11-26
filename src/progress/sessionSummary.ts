export interface AnswerResult {
  readonly itemId: string
  readonly itemLabel: string
  readonly category: string
  readonly correct: boolean
  /** Milliseconds from the question appearing to the answer. */
  readonly ms: number
  /** The question's topic id (such as "notes"), used to offer practice on what was missed. */
  readonly topic?: string
  /** The question type id (such as "place-note"): which area of the topic, and which lesson covers it. */
  readonly type?: string
}

export interface CategorySummary {
  readonly category: string
  readonly total: number
  readonly correct: number
}

export interface MissedItem {
  readonly itemId: string
  readonly itemLabel: string
  readonly misses: number
}

export interface SessionSummary {
  readonly total: number
  readonly correct: number
  /** 0 to 1, or null when nothing was answered. */
  readonly accuracy: number | null
  /** Mean time per answer in milliseconds, or null when nothing was answered. */
  readonly averageMs: number | null
  /** In the order each category was first seen. */
  readonly byCategory: readonly CategorySummary[]
  /** Items answered wrongly at least once, most misses first (ties in the order first missed). */
  readonly missed: readonly MissedItem[]
}

export function summariseSession(results: readonly AnswerResult[]): SessionSummary {
  const total = results.length
  const correct = results.filter((r) => r.correct).length

  const categories = new Map<string, { total: number; correct: number }>()
  const missed = new Map<string, { itemLabel: string; misses: number }>()
  for (const r of results) {
    const entry = categories.get(r.category) ?? { total: 0, correct: 0 }
    entry.total += 1
    if (r.correct) entry.correct += 1
    categories.set(r.category, entry)
    if (!r.correct) {
      const item = missed.get(r.itemId) ?? { itemLabel: r.itemLabel, misses: 0 }
      item.misses += 1
      missed.set(r.itemId, item)
    }
  }

  return {
    total,
    correct,
    accuracy: total === 0 ? null : correct / total,
    averageMs: total === 0 ? null : results.reduce((sum, r) => sum + r.ms, 0) / total,
    byCategory: [...categories].map(([category, v]) => ({ category, ...v })),
    missed: [...missed]
      .map(([itemId, v]) => ({ itemId, ...v }))
      .sort((a, b) => b.misses - a.misses),
  }
}

export interface WeakArea {
  /** Question type id, such as "place-note". */
  readonly type: string
  /** Topic id of that question type, such as "notes". */
  readonly topic: string
  readonly missed: number
  readonly total: number
}

/**
 * The question type with the most wrong answers: what to practise next.
 * Ties go to the lower share right, then to the one missed first. Null when nothing was wrong
 * (or the answers carry no type, as in rounds saved by older versions).
 */
export function weakestArea(results: readonly AnswerResult[]): WeakArea | null {
  const areas = new Map<string, { topic: string; missed: number; total: number; firstMiss: number }>()
  results.forEach((r, index) => {
    if (r.type === undefined || r.topic === undefined) return
    const area = areas.get(r.type) ?? { topic: r.topic, missed: 0, total: 0, firstMiss: Infinity }
    area.total += 1
    if (!r.correct) {
      area.missed += 1
      area.firstMiss = Math.min(area.firstMiss, index)
    }
    areas.set(r.type, area)
  })
  let best: (WeakArea & { firstMiss: number }) | null = null
  for (const [type, a] of areas) {
    if (a.missed === 0) continue
    const better =
      best === null ||
      a.missed > best.missed ||
      (a.missed === best.missed && a.missed / a.total > best.missed / best.total) ||
      (a.missed === best.missed && a.missed / a.total === best.missed / best.total && a.firstMiss < best.firstMiss)
    if (better) best = { type, ...a }
  }
  return best && { type: best.type, topic: best.topic, missed: best.missed, total: best.total }
}

/** Rounds shorter than this get no verdict: a 1 out of 1 is not a result. */
export const MIN_FOR_VERDICT = 5

export function verdict(summary: SessionSummary): string {
  if (summary.accuracy === null) return ''
  if (summary.total < MIN_FOR_VERDICT) return 'Short round.'
  if (summary.accuracy >= 0.9) return 'Strong round.'
  if (summary.accuracy >= 0.7) return 'Good round.'
  if (summary.accuracy >= 0.5) return 'Getting there.'
  return 'A hard round. Start with what you missed, below.'
}

/** How this round compares with the last round on the same setup, or null if there is nothing fair to compare. */
export function compareWithPrevious(
  summary: SessionSummary,
  previous: { readonly total: number; readonly correct: number } | null,
): string | null {
  if (summary.accuracy === null || summary.total < MIN_FOR_VERDICT || previous === null || previous.total < MIN_FOR_VERDICT) return null
  const was = `${previous.correct} / ${previous.total}`
  const change = summary.accuracy - previous.correct / previous.total
  if (Math.abs(change) < 0.05) return `About the same as last time (${was}).`
  return change > 0 ? `Up from ${was} last time.` : `Down from ${was} last time.`
}
