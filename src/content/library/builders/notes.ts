import type { WorkedExample, WorkedTerm } from '../types'
import { clefLabel, describeStaffPosition, staffPosition, type ClefName, type Pitch } from '../../../theory'
import { clefAnchor } from '../../../questions/noteName'
import { notesOnStaff } from './common'
import {
  ALPHABET_TERM,
  LEDGER_TERM,
  MIDDLE_C_TERM,
  STAFF_TERM,
  STEP_TERM,
  anchorPitch,
  atPlace,
  cap,
  clefResult,
  clefSentence,
  clefTerm,
  countSteps,
  edgeCheck,
} from './clefs'

/**
 * "Name this note", worked from the line the clef fixes, with every step shown.
 * The letters are counted by hand one line or space at a time (`walkStaff`), each place is checked against the theory engine,
 * and the check reads the note again from the line and space notes (or from the edge of the staff). A disagreement throws.
 */
export function nameNoteExample(clef: ClefName, pitch: Pitch): WorkedExample {
  if (pitch.accidental !== 0) throw new RangeError('This example is for natural notes (no sharp or flat)')
  const info = clefAnchor(clef)
  const anchor = anchorPitch(clef)
  const position = staffPosition(pitch, clef)
  const outside = position < 0 || position > 8
  const counting = position === info.position ? null : countSteps(clef, anchor, pitch, { octave: false, toName: 'Your note', toTitle: 'your note', explainStep: true, explainAlphabet: true })
  const counted = counting ? counting.walk.path.at(-1)!.letter : info.letter
  if (counted !== pitch.letter || (counting && counting.walk.position !== position)) throw new Error('Counting did not give the note asked for')
  const check = edgeCheck(clef, position, false)
  if (check.found.letter !== counted) throw new Error('The check gives a different letter')

  const where = describeStaffPosition(position)
  const clefName = clefLabel(clef).toLowerCase()

  const terms: WorkedTerm[] = [STAFF_TERM, clefTerm(clef)]
  if (anchor.letter === 'C') terms.push(MIDDLE_C_TERM)
  terms.push(STEP_TERM, ALPHABET_TERM)
  if (outside) terms.push(LEDGER_TERM)

  const sits = outside
    ? `Your note is ${position < 0 ? 'below' : 'above'} the staff, so count outwards from it. Ledger lines (short extra lines for notes outside the staff) count like staff lines. The note is ${atPlace(position)}.`
    : `Count the lines and spaces from the bottom up. Your note is ${atPlace(position)}.`

  return {
    title: `Name a note in ${clefName}`,
    task: `What is the name of the note on this staff (${clefName})?`,
    terms,
    steps: [
      {
        title: 'Find the clef',
        text: `The sign at the start of the staff (the five lines and four spaces) is the ${clefName}. A clef fixes one line to one letter name. ${clefSentence(clef, { why: true })}`,
        result: clefResult(clef),
        staff: notesOnStaff(clef, [pitch]),
      },
      { title: 'Find where your note sits', text: sits, result: cap(where) },
      ...(counting
        ? counting.steps
        : [
            {
              title: 'See that there is nothing to count',
              text: `Your note is ${atPlace(position)}, the line the clef fixes. You move 0 steps (a step is a move to the very next line or space), so the letter stays ${info.letter}.`,
              result: `0 steps: ${info.letter}`,
            },
          ]),
      {
        title: 'Read the last letter',
        text: `The last letter you said, ${counted}, belongs to ${where}, where your note sits. That letter is the name of the note.`,
        result: `The note is ${counted}`,
      },
      { title: check.title, text: check.text, result: `${cap(where)} is ${check.found.letter}, as counted` },
    ],
    answer: `The note is ${pitch.letter}.`,
  }
}
