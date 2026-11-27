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

/** A musical word used in a worked example, with its meaning in plain words. */
export interface WorkedTerm {
  /** The word as it appears in the working, e.g. "Semitone" or "Sharp (♯)". */
  readonly term: string
  /** One plain sentence, e.g. "The smallest step in music: from one piano key to the very next." */
  readonly meaning: string
}

/** One numbered action in a worked example. See "Worked examples" in docs/library.md. */
export interface WorkedStep {
  /** What to do, as a short instruction with no full stop: "Write the letter names". */
  readonly title: string
  /** How to do it, with every count shown. One to three short sentences. */
  readonly text: string
  /** What this step gives you, with no full stop: "D E F G A B C D". */
  readonly result: string
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
  /** "Words you need": every musical word the working uses, explained. */
  readonly terms: readonly WorkedTerm[]
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
  /** "Words in this lesson": the musical words the lesson uses, each explained once. Near the top of every lesson. */
  | { readonly type: 'terms'; readonly terms: readonly WorkedTerm[] }
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
  if (example.terms.length > 0) {
    lines.push('Words you need:')
    for (const t of example.terms) lines.push(`- ${strip(t.term)}: ${strip(t.meaning)}`)
    lines.push('')
  }
  example.steps.forEach((step, i) => {
    const head = `${strip(step.title)}. ${strip(step.text)}`
    lines.push(`${i + 1}. ${head}`)
    lines.push(`   -> ${strip(step.result)}`)
  })
  lines.push('', `Answer: ${strip(example.answer)}`)
  return lines.join('\n')
}
