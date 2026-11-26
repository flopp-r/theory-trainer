import { VOCAB_CATEGORY_IDS } from '../../content/vocabulary'
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
  clefs: ['treble', 'bass'],
  maxLedgerLines: 1,
  difficulty: 2,
  vocabCategories: [],
}

/** Questions in one round. */
export const ROUND_LENGTH = 10

/** Topics where the chosen clefs matter. */
export const TOPICS_USING_CLEFS: readonly Topic[] = ['notes', 'rhythm', 'keys', 'intervals', 'chords', 'cadences', 'ear']

const ALL_TOPICS: readonly Topic[] = TOPICS.map((t) => t.id)

/** Reads the setup from the page address. Anything missing or invalid falls back to the default for that part. */
export function parsePracticeConfig(query: URLSearchParams): PracticeConfig {
  const wantedTopics = (query.get('topics') ?? '').split(',')
  const topics = ALL_TOPICS.filter((t) => wantedTopics.includes(t))
  const wantedClefs = (query.get('clefs') ?? '').split(',')
  const clefs = CLEF_NAMES.filter((c) => wantedClefs.includes(c))
  const ledgerText = query.get('ledger')
  const levelText = query.get('level')
  const wantedVocab = (query.get('vocab') ?? '').split(',')
  // Only real category names, in the order they are shown.
  const vocab = VOCAB_CATEGORY_IDS.filter((v) => wantedVocab.includes(v))
  return {
    topics: topics.length > 0 ? topics : DEFAULT_PRACTICE_CONFIG.topics,
    clefs: clefs.length > 0 ? clefs : DEFAULT_PRACTICE_CONFIG.clefs,
    maxLedgerLines: ledgerText !== null && /^[0-3]$/.test(ledgerText) ? Number(ledgerText) : DEFAULT_PRACTICE_CONFIG.maxLedgerLines,
    difficulty: levelText !== null && /^[1-3]$/.test(levelText) ? (Number(levelText) as Difficulty) : DEFAULT_PRACTICE_CONFIG.difficulty,
    vocabCategories: vocab,
  }
}

/** The part of the address after "?" for this setup. Topics and clefs are always in the same order. */
export function practiceConfigToQuery(config: PracticeConfig): string {
  const topics = ALL_TOPICS.filter((t) => config.topics.includes(t))
  const clefs = CLEF_NAMES.filter((c) => config.clefs.includes(c))
  const vocabIds = VOCAB_CATEGORY_IDS.filter((v) => config.vocabCategories.includes(v))
  const parts = [
    `topics=${topics.join(',')}`,
    `clefs=${clefs.join(',')}`,
    `ledger=${config.maxLedgerLines}`,
    `level=${config.difficulty}`,
  ]
  if (vocabIds.length > 0) parts.push(`vocab=${vocabIds.join(',')}`)
  return parts.join('&')
}

export function difficultyLabel(level: Difficulty): string {
  return DIFFICULTY_LABELS[level]
}

function describeClefs(clefs: readonly ClefName[]): string {
  const names = CLEF_NAMES.filter((c) => clefs.includes(c)).map((c) => c.toLowerCase())
  if (names.length === CLEF_NAMES.length) return 'All clefs'
  const text = names.length > 1 ? `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}` : (names[0] ?? '')
  return `${text.charAt(0).toUpperCase()}${text.slice(1)} clef${names.length > 1 ? 's' : ''}`
}

/** A short line for buttons, e.g. "Notes · Treble and bass clefs · Medium". */
export function describeSetup(config: PracticeConfig): string {
  const labels = ALL_TOPICS.filter((t) => config.topics.includes(t)).map((t) => TOPICS.find((x) => x.id === t)?.label ?? t)
  const topics = labels.length === ALL_TOPICS.length ? 'All topics' : labels.length <= 3 ? labels.join(', ') : `${labels.length} topics`
  const parts = [topics]
  if (config.topics.some((t) => TOPICS_USING_CLEFS.includes(t))) parts.push(describeClefs(config.clefs))
  parts.push(DIFFICULTY_LABELS[config.difficulty])
  return parts.join(' · ')
}
