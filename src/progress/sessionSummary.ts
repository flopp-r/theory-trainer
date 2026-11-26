export interface AnswerResult {
  readonly itemId: string
  readonly itemLabel: string
  readonly category: string
  readonly correct: boolean
  /** Milliseconds from the question appearing to the answer. */
  readonly ms: number
  /** The question's topic id (such as "notes"), used to offer practice on what was missed. */
  readonly topic?: string
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

/** Topic ids with at least one wrong answer, in the order first missed. */
export function missedTopics(results: readonly AnswerResult[]): string[] {
  const seen: string[] = []
  for (const r of results) {
    if (!r.correct && r.topic !== undefined && !seen.includes(r.topic)) seen.push(r.topic)
  }
  return seen
}

/** Rounds shorter than this get no verdict: a 1 out of 1 is not a result. */
export const MIN_FOR_VERDICT = 5

export function verdict(summary: SessionSummary): string {
  if (summary.accuracy === null) return ''
  if (summary.total < MIN_FOR_VERDICT) return 'Short round.'
  if (summary.accuracy >= 0.9) return 'Strong round.'
  if (summary.accuracy >= 0.7) return 'Good round.'
  if (summary.accuracy >= 0.5) return 'Getting there.'
  return 'A hard one. The questions below are the ones to look at.'
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
