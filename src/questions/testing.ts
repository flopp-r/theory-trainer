// Helpers for tests only.
import type { ClefName, Pitch } from '../theory'
import type { Question } from './types'

/** The clef and pitch of a question that shows exactly one note on one staff. */
export function singleNote(q: Question): { clef: ClefName; pitch: Pitch } {
  const staff = q.notation?.staves[0]
  const item = staff?.items[0]
  if (!staff || q.notation?.staves.length !== 1 || staff.items.length !== 1 || item?.kind !== 'notes' || item.pitches.length !== 1) {
    throw new Error(`Question ${q.id} does not show a single note`)
  }
  return { clef: staff.clef, pitch: item.pitches[0]! }
}

/** The answer buttons of a multiple-choice question. */
export function choicesOf(q: Question): readonly { id: string; label: string }[] {
  if (q.input.kind !== 'multiple-choice') throw new Error(`Question ${q.id} is not multiple choice`)
  return q.input.choices
}
