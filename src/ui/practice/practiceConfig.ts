import { DIFFICULTY_LABELS, type Difficulty, type Topic, TOPICS } from '../../questions/types'
import { CLEF_NAMES, type ClefName } from '../../theory'

export interface PracticeConfig {
  readonly topics: readonly Topic[]
  readonly clefs: readonly ClefName[]
  /** Most ledger lines above or below the staff for note questions, 0 to 3. */
  readonly maxLedgerLines: number
  readonly difficulty: Difficulty
  /** Vocabulary categories to use. Empty means all of them. */
  readonly vocabCategories: readonly string[]
}

export const DEFAULT_PRACTICE_CONFIG: PracticeConfig = {
  topics: ['notes'],
  clefs: ['alto'],
  maxLedgerLines: 1,
  difficulty: 2,
  vocabCategories: [],
}

/** Topics where the chosen clefs matter. */
export const TOPICS_USING_CLEFS: readonly Topic[] = ['notes', 'rhythm', 'keys', 'intervals', 'chords', 'cadences']

const ALL_TOPICS: readonly Topic[] = TOPICS.map((t) => t.id)

/** Reads the setup from the page address. Anything missing or invalid falls back to the default for that part. */
export function parsePracticeConfig(query: URLSearchParams): PracticeConfig {
  const wantedTopics = (query.get('topics') ?? '').split(',')
  const topics = ALL_TOPICS.filter((t) => wantedTopics.includes(t))
  const wantedClefs = (query.get('clefs') ?? '').split(',')
  const clefs = CLEF_NAMES.filter((c) => wantedClefs.includes(c))
  const ledgerText = query.get('ledger')
  const levelText = query.get('level')
  const vocab = (query.get('vocab') ?? '')
    .split(',')
    .filter((v) => /^[a-z-]{1,30}$/.test(v))
  return {
    topics: topics.length > 0 ? topics : DEFAULT_PRACTICE_CONFIG.topics,
    clefs: clefs.length > 0 ? clefs : DEFAULT_PRACTICE_CONFIG.clefs,
    maxLedgerLines: ledgerText !== null && /^[0-3]$/.test(ledgerText) ? Number(ledgerText) : DEFAULT_PRACTICE_CONFIG.maxLedgerLines,
    difficulty: levelText !== null && /^[1-3]$/.test(levelText) ? (Number(levelText) as Difficulty) : DEFAULT_PRACTICE_CONFIG.difficulty,
    vocabCategories: [...new Set(vocab)],
  }
}

/** The part of the address after "?" for this setup. Topics and clefs are always in the same order. */
export function practiceConfigToQuery(config: PracticeConfig): string {
  const topics = ALL_TOPICS.filter((t) => config.topics.includes(t))
  const clefs = CLEF_NAMES.filter((c) => config.clefs.includes(c))
  const parts = [
    `topics=${topics.join(',')}`,
    `clefs=${clefs.join(',')}`,
    `ledger=${config.maxLedgerLines}`,
    `level=${config.difficulty}`,
  ]
  if (config.vocabCategories.length > 0) parts.push(`vocab=${config.vocabCategories.join(',')}`)
  return parts.join('&')
}

export function difficultyLabel(level: Difficulty): string {
  return DIFFICULTY_LABELS[level]
}
