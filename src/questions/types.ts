import type { AudioSpec } from '../audio/types'
import type { ClefName, Key, Pitch, TimeSignature } from '../theory'
import type { Rng } from './rng'

export type Topic = 'notes' | 'rhythm' | 'keys' | 'scales' | 'intervals' | 'chords' | 'cadences' | 'vocabulary' | 'ear'

export const TOPICS: readonly { id: Topic; label: string; summary: string }[] = [
  { id: 'notes', label: 'Notes', summary: 'Names, accidentals, clefs, placing notes' },
  { id: 'rhythm', label: 'Rhythm', summary: 'Note and rest values, dots, time signatures' },
  { id: 'keys', label: 'Keys', summary: 'Key signatures and related keys' },
  { id: 'scales', label: 'Scales', summary: 'Building scales, degree names' },
  { id: 'intervals', label: 'Intervals', summary: 'Naming and building intervals' },
  { id: 'chords', label: 'Chords', summary: 'Triads, sevenths, inversions, numerals' },
  { id: 'cadences', label: 'Cadences', summary: 'Perfect, imperfect, plagal, interrupted' },
  { id: 'vocabulary', label: 'Vocabulary', summary: 'Italian terms, dynamics, instruments, forms' },
  { id: 'ear', label: 'Ear training', summary: 'Chords, intervals, cadences and inversions by ear (needs sound)' },
]

export const QUESTION_TYPES = [
  'note-name',
  'note-accidental',
  'clef-compare',
  'place-note',
  'note-value',
  'rest-value',
  'note-beats',
  'time-sig-beats',
  'time-sig-type',
  'key-from-signature',
  'signature-from-key',
  'relative-key',
  'scale-spelling',
  'scale-degree',
  'interval-on-staff',
  'interval-above',
  'triad-on-staff',
  'seventh-on-staff',
  'chord-notes',
  'chord-symbol',
  'inversion',
  'roman-numeral',
  'cadence-on-staff',
  'cadence-by-name',
  'vocab-term',
  'vocab-meaning',
  'ear-chord-quality',
  'ear-interval',
  'ear-cadence',
  'ear-inversion',
] as const
export type QuestionType = (typeof QUESTION_TYPES)[number]

export type Difficulty = 1 | 2 | 3

export const DIFFICULTY_LABELS: Record<Difficulty, string> = { 1: 'Easy', 2: 'Medium', 3: 'Hard' }

export type Duration = 'w' | 'h' | 'q' | '8' | '16'

/** One note, or a chord if there are several pitches. `color` highlights it (used for feedback). */
export interface NotesItem {
  readonly kind: 'notes'
  readonly pitches: readonly Pitch[]
  /** Default: a whole note. */
  readonly duration?: Duration
  readonly dots?: number
  readonly color?: string
}

export interface RestItem {
  readonly kind: 'rest'
  readonly duration: Duration
  readonly dots?: number
}

export type NotationItem = NotesItem | RestItem

/** One stave: a clef, optional key and time signature, and what is written on it. */
export interface StaffSpec {
  readonly clef: ClefName
  readonly key?: Key
  readonly time?: TimeSignature
  readonly items: readonly NotationItem[]
}

/** What to draw: one or more staves stacked top to bottom. */
export interface NotationSpec {
  readonly staves: readonly StaffSpec[]
}

export interface Choice {
  /** Stable value compared with `Question.correct`. */
  readonly id: string
  /** What the button shows. */
  readonly label: string
}

/** How the buttons are laid out: a row of short labels, two columns, or one per line for long text. */
export type ChoiceLayout = 'letters' | 'grid' | 'list'

export type QuestionInput =
  | { readonly kind: 'multiple-choice'; readonly choices: readonly Choice[]; readonly layout: ChoiceLayout }
  /** The learner taps the staff to place a note. The answer is a staff position (see theory/clef). */
  | { readonly kind: 'tap-staff'; readonly clef: ClefName; readonly ledgerLines: number }

export interface Question {
  /** Same item, same id, every time it is asked. Used for statistics and spaced repetition. */
  readonly id: string
  readonly type: QuestionType
  readonly topic: Topic
  /** Shown in the session summary, e.g. "Alto clef" or "Key signatures". */
  readonly category: string
  /** Short name of the thing being tested, for lists of mistakes, e.g. "E4 in alto clef". */
  readonly itemLabel: string
  /** Content tags for coverage lists, e.g. "aqa-candidate" or "extra". */
  readonly tags: readonly string[]
  readonly prompt: string
  readonly notation: NotationSpec | null
  /** What to play, for ear-training questions. */
  readonly audio: AudioSpec | null
  /** Shown after answering: what was played, written on the staff. */
  readonly reveal?: NotationSpec
  readonly input: QuestionInput
  /** For multiple choice: the `id` of the correct choice. For tap-staff: the staff position as text. */
  readonly correct: string
  /** A sentence telling the learner the right answer, shown after a wrong answer, e.g. "It is C." */
  readonly answerText: string
  /** Shown after answering, right or wrong. */
  readonly explanation: string
}

export interface QuestionContext {
  readonly rng: Rng
  /** Clefs the learner chose. Used by every question that draws a staff. */
  readonly clefs: readonly ClefName[]
  readonly difficulty: Difficulty
  /** Most ledger lines allowed for note questions, 0 to 3. */
  readonly maxLedgerLines: number
  /** Vocabulary categories to draw from. Empty or missing means all. */
  readonly vocabCategories?: readonly string[]
  /** Item id of the previous question, so the same item is not asked twice in a row. */
  readonly avoidItemId?: string
}

export interface QuestionGenerator {
  readonly type: QuestionType
  readonly topic: Topic
  readonly label: string
  generate(context: QuestionContext): Question
}
