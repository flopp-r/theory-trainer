import type { WorkedExample } from '../types'
import { clefLabel, describeStaffPosition, formatPitch, staffPosition, type ClefName, type Pitch } from '../../../theory'
import { clefAnchor } from '../../../questions/noteName'
import { notesOnStaff } from './common'

const LETTERS = 'ABCDEFG'
const musicalAlphabet = (from: string, steps: number, direction: 1 | -1): string[] =>
  Array.from({ length: steps + 1 }, (_, i) => LETTERS.charAt((((LETTERS.indexOf(from) + direction * i) % 7) + 7) % 7))

/**
 * "Name this note" worked from the clef's anchor note, with every step shown.
 * The letters, the step count and the position all come from the theory engine.
 */
export function nameNoteExample(clef: ClefName, pitch: Pitch): WorkedExample {
  const anchor = clefAnchor(clef)
  const position = staffPosition(pitch, clef)
  const move = position - anchor.position
  const direction = move > 0 ? 1 : -1
  const counted = move === 0 ? [anchor.letter] : musicalAlphabet(anchor.letter, Math.abs(move), direction)
  const staff = notesOnStaff(clef, [pitch])
  return {
    title: `Name a note in ${clefLabel(clef).toLowerCase()}`,
    task: `What is the name of the note on this staff (${clefLabel(clef).toLowerCase()})?`,
    steps: [
      { text: `Look at the picture. The note sits on **${describeStaffPosition(position)}**.`, staff },
      { text: `${anchor.description}. So the anchor note is **${anchor.letter}**, on ${describeStaffPosition(anchor.position)}.` },
      move === 0
        ? { text: `Your note is on that same place, so there is nothing to count. The note is **${anchor.letter}**.` }
        : {
            text: `Count from the anchor to your note. Every line and every space is one step. Go **${direction === 1 ? 'up' : 'down'} ${Math.abs(move)} ${Math.abs(move) === 1 ? 'step' : 'steps'}**, saying the letters ${direction === 1 ? 'forwards' : 'backwards'} through the musical alphabet (A B C D E F G, then back to A): **${counted.join(', ')}**.`,
          },
      { text: `The last letter you say is the name of the note: **${pitch.letter}**.` },
      { text: `Check: the same note is written **${formatPitch(pitch)}** (the number says which octave). In this clef it always sits on ${describeStaffPosition(position)}.` },
    ],
    answer: `The note is ${pitch.letter}.`,
  }
}
