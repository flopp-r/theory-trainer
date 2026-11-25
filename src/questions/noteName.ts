import {
  CLEF_NAMES,
  type ClefName,
  type Letter,
  type Pitch,
  clefLabel,
  formatPitch,
  letterAt,
  letterIndex,
  naturalPitchesInClef,
  staffPlacement,
  staffPosition,
} from '../theory'
import { at } from '../theory/util'
import type { Rng } from './rng'
import type { Question } from './types'

export interface NoteNameOptions {
  /** Clefs to draw from. Must not be empty. */
  clefs: readonly ClefName[]
  /** Most ledger lines allowed above or below the staff. 0 to 3. */
  maxLedgerLines: number
  /** Item id of the previous question, so the same note is not asked twice in a row. */
  avoidItemId?: string
}

/** The line or space each clef is built around, which the explanation counts from. */
const ANCHORS: Record<ClefName, { letter: Letter; position: number; description: string }> = {
  treble: { letter: 'G', position: 2, description: 'The treble clef curls around the second line up, which is G' },
  bass: { letter: 'F', position: 6, description: 'The two dots of the bass clef sit either side of the fourth line up, which is F' },
  alto: { letter: 'C', position: 4, description: 'The alto clef points at the middle line, which is middle C' },
  tenor: { letter: 'C', position: 6, description: 'The tenor clef points at the fourth line up, which is middle C' },
}

/** Counts from the clef's anchor note to the note on the staff, naming each step. */
export function explainNoteName(clef: ClefName, pitch: Pitch): string {
  const anchor = ANCHORS[clef]
  const position = staffPosition(pitch, clef)
  const steps = position - anchor.position
  const answer = pitch.letter
  const start = `${anchor.description}.`
  if (steps === 0) return `${start} This note is on that line, so it is ${answer}.`
  const direction = steps > 0 ? 'up' : 'down'
  const names: string[] = []
  for (let i = 0; i <= Math.abs(steps); i++) {
    names.push(letterAt(letterIndex(anchor.letter) + (steps > 0 ? i : -i)))
  }
  const count = Math.abs(steps)
  return `${start} Count ${count} ${count === 1 ? 'step' : 'steps'} ${direction} (every line and every space is a step): ${names.join(', ')}. The note is ${answer}.`
}

/** Choices are the seven letter names, A to G. */
const CHOICES = ['A', 'B', 'C', 'D', 'E', 'F', 'G'].map((letter) => ({ id: letter, label: letter }))

/** "note-name:alto:C4" - the same note in the same clef is always the same item. */
export function noteNameItemId(clef: ClefName, pitch: Pitch): string {
  return `note-name:${clef}:${formatPitch(pitch)}`
}

/** Tags used for coverage lists. Treble and bass are candidates for the AQA list; alto and tenor are extras. */
function tagsFor(clef: ClefName): readonly string[] {
  return clef === 'treble' || clef === 'bass' ? ['aqa-candidate'] : ['extra']
}

/** "Which note is this?" for a natural note in one of the chosen clefs. */
export function generateNoteNameQuestion(rng: Rng, options: NoteNameOptions): Question {
  const { clefs, maxLedgerLines, avoidItemId } = options
  if (clefs.length === 0) throw new RangeError('Choose at least one clef')
  for (const clef of clefs) {
    if (!CLEF_NAMES.includes(clef)) throw new RangeError(`Unknown clef: ${String(clef)}`)
  }
  if (!Number.isInteger(maxLedgerLines) || maxLedgerLines < 0 || maxLedgerLines > 3) {
    throw new RangeError('maxLedgerLines must be 0, 1, 2 or 3')
  }

  // Try a few times to avoid repeating the previous item; give up gracefully if the pool is tiny.
  let clef: ClefName = at(clefs, 0)
  let pitch: Pitch = at(naturalPitchesInClef(clef, maxLedgerLines), 0)
  for (let attempt = 0; attempt < 10; attempt++) {
    clef = rng.pick(clefs)
    pitch = rng.pick(naturalPitchesInClef(clef, maxLedgerLines))
    if (noteNameItemId(clef, pitch) !== avoidItemId) break
  }

  // Sanity check: the note must fit in the requested ledger-line limit.
  if (staffPlacement(pitch, clef).ledgerLines > maxLedgerLines) {
    throw new Error('Generated a note outside the ledger-line limit')
  }

  return {
    id: noteNameItemId(clef, pitch),
    type: 'note-name',
    category: clefLabel(clef),
    itemLabel: `${formatPitch(pitch)} in ${clefLabel(clef).toLowerCase()}`,
    tags: tagsFor(clef),
    prompt: 'Which note is this?',
    notation: { clef, notes: [pitch] },
    audio: null,
    input: { kind: 'multiple-choice', choices: CHOICES },
    correct: pitch.letter,
    explanation: explainNoteName(clef, pitch),
  }
}
