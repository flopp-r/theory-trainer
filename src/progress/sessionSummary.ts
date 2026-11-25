export interface AnswerResult {
  readonly itemId: string
  readonly itemLabel: string
  readonly category: string
  readonly correct: boolean
  /** Milliseconds from the question appearing to the answer. */
  readonly ms: number
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
