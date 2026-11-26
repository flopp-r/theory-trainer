import type { QuestionType } from '../../questions/types'
import { NOTES_RHYTHM_LESSONS } from './lessons/a-notes-rhythm'
import { SCALES_INTERVALS_LESSONS } from './lessons/b-scales-intervals'
import { CHORDS_EAR_LESSONS } from './lessons/c-chords-ear'
import { START_LESSONS } from './lessons/start'
import { MAJOR_SCALES_LESSON } from './lessons/scales-keys-model'
import { LIBRARY_GROUPS, type LibraryGroupId, type LibraryLesson } from './types'

/**
 * The order lessons are shown and read in. A lesson's `before` list may only name lessons earlier in this list.
 * Add a new lesson's id here when you add the lesson.
 */
export const LESSON_ORDER: readonly string[] = [
  'reading-music',
  'note-names-treble-bass',
  'alto-tenor-clefs',
  'accidentals',
  'octaves-and-instruments',
  'note-rest-values',
  'time-signatures',
  'tones-semitones',
  'major-scales',
  'minor-scales',
  'pentatonic-blues',
  'key-signatures',
  'related-keys',
  'scale-degrees',
  'intervals',
  'triads',
  'seventh-chords',
  'inversions-chord-symbols',
  'roman-numerals',
  'cadences',
  'vocabulary',
  'ear-training',
]

const ALL: LibraryLesson[] = [
  ...START_LESSONS,
  ...NOTES_RHYTHM_LESSONS,
  MAJOR_SCALES_LESSON,
  ...SCALES_INTERVALS_LESSONS,
  ...CHORDS_EAR_LESSONS,
]

/** All lessons that exist, in reading order. */
export const LESSONS: readonly LibraryLesson[] = [...ALL].sort((a, b) => LESSON_ORDER.indexOf(a.id) - LESSON_ORDER.indexOf(b.id))

export { LIBRARY_GROUPS }
export type { LibraryGroupId, LibraryLesson }

export function lessonById(id: string): LibraryLesson | undefined {
  return LESSONS.find((l) => l.id === id)
}

/** The lesson that best explains a question type (the first one that lists it). */
export function lessonForQuestionType(type: QuestionType): LibraryLesson | undefined {
  return LESSONS.find((l) => l.covers.includes(type))
}

/** The lessons either side of this one in reading order. */
export function neighbours(id: string): { previous?: LibraryLesson; next?: LibraryLesson } {
  const i = LESSONS.findIndex((l) => l.id === id)
  return { previous: i > 0 ? LESSONS[i - 1] : undefined, next: i >= 0 ? LESSONS[i + 1] : undefined }
}
