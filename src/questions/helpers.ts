import type { Rng } from './rng'
import type { Choice, ChoiceLayout, QuestionInput } from './types'

export interface ChoiceOptions {
  /** How many buttons. Default 4. */
  count?: number
  layout?: ChoiceLayout
  /**
   * Keep the options in the order given in `candidates` (for fixed sets such as major / minor / diminished / augmented).
   * Default: shuffled.
   */
  fixedOrder?: boolean
}

/**
 * Builds a multiple-choice input: the correct answer plus wrong ones picked from `candidates`.
 * Labels are the ids, so every option must be a distinct piece of text. Throws if there are
 * not enough different wrong answers, which is a bug in the question generator.
 */
export function multipleChoice(
  rng: Rng,
  correct: string,
  candidates: readonly string[],
  options: ChoiceOptions = {},
): { input: Extract<QuestionInput, { kind: 'multiple-choice' }>; correct: string } {
  const { count = 4, layout = 'grid', fixedOrder = false } = options
  const unique = [...new Set([...candidates, correct])]
  const wrong = unique.filter((c) => c !== correct)
  if (wrong.length < count - 1) {
    throw new Error(`Need ${count - 1} wrong answers for "${correct}" but only have ${wrong.length}`)
  }
  const picked = new Set(rng.shuffle(wrong).slice(0, count - 1))
  picked.add(correct)
  const ordered = fixedOrder ? unique.filter((c) => picked.has(c)) : rng.shuffle([...picked])
  const choices: Choice[] = ordered.map((label) => ({ id: label, label }))
  return { input: { kind: 'multiple-choice', choices, layout }, correct }
}

/** "a", "an": the article for a word, using the first letter's sound for the words this app uses. */
export function withArticle(word: string): string {
  return /^[aeiou]/i.test(word) || /^(8|11|18)/.test(word) ? `an ${word}` : `a ${word}`
}

/** Picks `count` different items from a list. */
export function pickSome<T>(rng: Rng, items: readonly T[], count: number): T[] {
  if (items.length < count) throw new RangeError(`Cannot pick ${count} from ${items.length}`)
  return rng.shuffle(items).slice(0, count)
}
