import type { WorkedExample } from '../types'
import {
  type ClefName,
  type NoteName,
  formatNote,
  keyScaleNotes,
  letterAt,
  letterIndex,
  pitch,
  pitchClass,
  scalePitches,
} from '../../../theory'
import { keyLabel, noteLabel, notesLabel } from '../../../questions/pitchTools'
import { listenMelody } from './audio'
import { notesOnStaff } from './common'

const TONE_OR_SEMITONE = ['tone', 'tone', 'semitone', 'tone', 'tone', 'tone', 'semitone'] as const
const SIZE = { tone: 2, semitone: 1 }

const ordinal = (n: number) => ['1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th'][n - 1]!

function sign(accidental: number): string {
  return accidental === 0 ? 'no sign' : accidental === 1 ? 'a sharp' : accidental === -1 ? 'a flat' : accidental === 2 ? 'a double sharp' : 'a double flat'
}

/**
 * Build a major scale step by step.
 * The working counts semitones with pitch classes; at the end it is checked against the theory engine,
 * and this function throws if the two ever disagree, so a wrong example cannot be shown.
 */
export function majorScaleExample(tonic: NoteName, clef: ClefName = 'treble'): WorkedExample {
  const name = noteLabel(tonic)
  const letters = Array.from({ length: 8 }, (_, i) => letterAt(letterIndex(tonic.letter) + i))
  const notes: NoteName[] = [tonic]
  const stepTexts: string[] = []

  for (let i = 1; i <= 7; i++) {
    const previous = notes[i - 1]!
    const letter = letters[i]!
    const naturalPc = pitchClass({ letter, accidental: 0 })
    const gap = (((naturalPc - pitchClass(previous)) % 12) + 12) % 12 // semitones from the last note to the plain letter
    const wanted = SIZE[TONE_OR_SEMITONE[i - 1]!]
    const accidental = wanted - gap
    if (Math.abs(accidental) > 2) throw new Error('A major scale never needs more than a double sharp or flat')
    const next: NoteName = { letter, accidental }
    notes.push(next)
    const stepName = TONE_OR_SEMITONE[i - 1]!
    const fix =
      accidental === 0
        ? `That is exactly what the pattern asks for, so the note is just **${letter}**.`
        : `The pattern asks for a ${stepName} (${wanted} semitone${wanted === 1 ? '' : 's'}) but the plain ${letter} is ${gap === 0 ? 'the same sound' : `${gap} semitone${gap === 1 ? '' : 's'} away`}. So ${letter} needs **${sign(accidental)}** (${accidental > 0 ? 'raised' : 'lowered'} by ${Math.abs(accidental)} semitone${Math.abs(accidental) === 1 ? '' : 's'}): the note is **${noteLabel(next)}**.`
    stepTexts.push(
      `**Note ${i + 1} (the ${ordinal(i + 1)}).** The pattern says: ${stepName}. From ${noteLabel(previous)} to the plain ${letter} is ${gap} semitone${gap === 1 ? '' : 's'}. ${fix}`,
    )
  }

  // Cross-check against the engine: the long-hand working must give the same scale.
  const expected = keyScaleNotes({ tonic, mode: 'major' })
  if (formatNote(expected[6]!) !== formatNote(notes[6]!) || expected.some((n, i) => formatNote(n) !== formatNote(notes[i]!))) {
    throw new Error(`Worked example for ${name} major disagrees with the theory engine`)
  }
  const last = notes[6]!
  const backToTonic = (((pitchClass(tonic) - pitchClass(last)) % 12) + 12) % 12

  const scale = scalePitches(pitch(tonic.letter, tonic.accidental, clef === 'bass' ? 3 : clef === 'alto' || clef === 'tenor' ? 3 : 4), 'major')
  return {
    title: `Build the ${name} major scale`,
    task: `Write the notes of the ${name} major scale.`,
    steps: [
      { text: `Start on the key note, **${name}**. This is note 1.` },
      {
        text: `Write the letter names in order, one after another, starting on ${tonic.letter}, and finish with ${tonic.letter} again: **${letters.join(' ')}**. A scale uses every letter once, so this fixes the *letters*. The pattern below fixes the *signs* (sharps and flats).`,
      },
      { text: `Write the major scale pattern above the letters: **tone, tone, semitone, tone, tone, tone, semitone**. A tone is 2 semitones and a semitone is 1.` },
      ...stepTexts.map((text) => ({ text })),
      {
        text: `Check the last step: from ${noteLabel(last)} back up to ${noteLabel(tonic)} is ${backToTonic} semitone${backToTonic === 1 ? '' : 's'}, which is the semitone the pattern ends with.`,
      },
      {
        text: `Write it out: **${notesLabel(notes)}** (the last note is the key note again, one octave higher). Here it is on the staff, with the sound.`,
        staff: notesOnStaff(clef, scale),
        listen: listenMelody(`Hear the ${name} major scale`, scale),
      },
    ],
    answer: `The ${name} major scale is ${notesLabel(notes)}. (Key: ${keyLabel({ tonic, mode: 'major' })}.)`,
  }
}
