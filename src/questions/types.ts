import type { ClefName, Pitch } from '../theory'

export type QuestionType = 'note-name'

export type InputKind = 'multiple-choice' | 'piano' | 'tap-staff'

export interface Choice {
  /** Stable value compared with `Question.correct`. */
  readonly id: string
  /** What the button shows. */
  readonly label: string
}

/** What to draw on the staff. */
export interface NotationSpec {
  readonly clef: ClefName
  readonly notes: readonly Pitch[]
}

/** What to play. Filled in from Phase 4; null until then. */
export type AudioSpec = null

export interface Question {
  /** Same item, same id, every time it is asked. Used for statistics and spaced repetition. */
  readonly id: string
  readonly type: QuestionType
  /** Shown in the session summary, e.g. "Alto clef". */
  readonly category: string
  /** Short name of the thing being tested, for lists of mistakes, e.g. "E4 in alto clef". */
  readonly itemLabel: string
  /** Content tags for coverage lists, e.g. "aqa" or "extra". */
  readonly tags: readonly string[]
  readonly prompt: string
  readonly notation: NotationSpec | null
  readonly audio: AudioSpec
  readonly input: { readonly kind: 'multiple-choice'; readonly choices: readonly Choice[] }
  /** The `id` of the correct choice. */
  readonly correct: string
  /** Shown after answering, right or wrong. */
  readonly explanation: string
}
