import type { AudioSpec } from '../../audio/types'
import type { QuestionType, StaffSpec, Topic } from '../../questions/types'
import type { ClefName } from '../../theory'

export type LibraryGroupId = 'start' | 'notes' | 'rhythm' | 'scales-keys' | 'intervals' | 'chords' | 'cadences' | 'vocabulary' | 'ear'

export const LIBRARY_GROUPS: readonly { readonly id: LibraryGroupId; readonly title: string; readonly blurb: string }[] = [
  { id: 'start', title: 'Start here', blurb: 'What the marks on the page mean.' },
  { id: 'notes', title: 'Notes and clefs', blurb: 'Naming notes in every clef, sharps and flats.' },
  { id: 'rhythm', title: 'Rhythm', blurb: 'How long notes last, and how music is counted.' },
  { id: 'scales-keys', title: 'Scales and keys', blurb: 'Building scales and understanding key signatures.' },
  { id: 'intervals', title: 'Intervals', blurb: 'The distance between two notes.' },
  { id: 'chords', title: 'Chords', blurb: 'Building and naming chords.' },
  { id: 'cadences', title: 'Cadences', blurb: 'How phrases end.' },
  { id: 'vocabulary', title: 'Vocabulary', blurb: 'The words that go with the music.' },
  { id: 'ear', title: 'Ear training', blurb: 'Learning to recognise what you hear.' },
]

/** A short piece of sound with a label for its button. */
export interface ListenItem {
  readonly label: string
  readonly audio: AudioSpec
}

/** One numbered action in a worked example. */
export interface WorkedStep {
  /** What to do and what you get. Plain sentences; see the style guide in docs/library.md. */
  readonly text: string
  /** A picture that helps with this step. */
  readonly staff?: StaffSpec
  /** Something to listen to at this step. */
  readonly listen?: ListenItem
}

/**
 * A complete piece of working, from the question to the answer, that a beginner can follow and copy.
 * Build these with the theory engine so every spelling and count in the working is right.
 */
export interface WorkedExample {
  readonly title: string
  /** The question, in one sentence. */
  readonly task: string
  readonly steps: readonly WorkedStep[]
  /** The final answer, in one sentence. */
  readonly answer: string
}

/** How the "Practise this" button sets up Practice. */
export interface PractiseLink {
  readonly label: string
  readonly topics: readonly Topic[]
  readonly level?: 1 | 2 | 3
  readonly clefs?: readonly ClefName[]
}

export type Block =
  /** A paragraph. Inline: **bold** and *italic*. */
  | { readonly type: 'p'; readonly text: string }
  /** A sub-heading inside the lesson. */
  | { readonly type: 'h'; readonly text: string }
  | { readonly type: 'list'; readonly items: readonly string[] }
  /** Numbered steps: a method to follow. */
  | { readonly type: 'steps'; readonly items: readonly string[] }
  /** A highlighted box: `tip` (a helpful trick), `watch` (a common mistake), `remember` (a fact to keep). */
  | { readonly type: 'note'; readonly kind: 'tip' | 'watch' | 'remember'; readonly text: string }
  | { readonly type: 'table'; readonly head: readonly string[]; readonly rows: readonly (readonly string[])[]; readonly caption?: string }
  /** A picture of notation. */
  | { readonly type: 'staff'; readonly staff: StaffSpec; readonly caption: string }
  /** A button that plays a sound. */
  | { readonly type: 'listen'; readonly item: ListenItem }
  | { readonly type: 'worked'; readonly example: WorkedExample }
  | { readonly type: 'practise'; readonly link: PractiseLink }

export interface LibraryLesson {
  /** Short, lower-case, with hyphens. Used in the page address. */
  readonly id: string
  readonly title: string
  readonly group: LibraryGroupId
  /** One sentence for the list. */
  readonly summary: string
  /** Lessons worth reading first (ids). */
  readonly before?: readonly string[]
  /** The question types this lesson helps with. The "Read the lesson" button in Practice uses this. */
  readonly covers: readonly QuestionType[]
  /** Builds the content when the lesson is opened. */
  build(): readonly Block[]
}

/** Plain-text version of a worked example, for copying into notes or homework. */
export function workedToText(example: WorkedExample): string {
  const strip = (text: string) => text.replace(/\*\*(.+?)\*\*/g, '$1').replace(/\*(.+?)\*/g, '$1')
  const lines = [example.title, '', `Question: ${strip(example.task)}`, '']
  example.steps.forEach((step, i) => lines.push(`${i + 1}. ${strip(step.text)}`))
  lines.push('', `Answer: ${strip(example.answer)}`)
  return lines.join('\n')
}
