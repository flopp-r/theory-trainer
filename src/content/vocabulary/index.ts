import articulation from './articulation.json'
import dynamics from './dynamics.json'
import form from './form.json'
import instruments from './instruments.json'
import ornaments from './ornaments.json'
import tempo from './tempo.json'
import texture from './texture.json'
import tonality from './tonality.json'

/**
 * One term and what it means.
 * `level` says how common it is: 1 = core, 2 = further, 3 = extra. Easy practice uses level 1, Medium 1-2, Hard 1-3.
 * `group` keeps near-synonyms apart: two terms in the same group are never offered as wrong answers for each other.
 */
export interface VocabEntry {
  readonly term: string
  readonly meaning: string
  readonly level: 1 | 2 | 3
  readonly group: string
}

export interface VocabCategory {
  /** Short name used in the address bar and in filters, e.g. "tempo". */
  readonly category: string
  /** Name shown to the learner. */
  readonly label: string
  /** Question wording for "term -> meaning"; {term} is replaced. */
  readonly askTerm: string
  /** Question wording for "meaning -> term"; {meaning} is replaced. */
  readonly askMeaning: string
  readonly entries: readonly VocabEntry[]
}

/** All vocabulary, in the order shown to the learner. The data lives in the .json files next to this one. */
export const VOCABULARY: readonly VocabCategory[] = [tempo, dynamics, articulation, ornaments, texture, form, instruments, tonality] as VocabCategory[]

export const VOCAB_CATEGORY_IDS: readonly string[] = VOCABULARY.map((c) => c.category)
