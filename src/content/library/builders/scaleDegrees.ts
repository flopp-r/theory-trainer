import type { WorkedExample } from '../types'
import type { StaffSpec } from '../../../questions/types'
import { type ClefName, type Key, keyScaleNotes, pitch, scaleDegreeName, scalePitches } from '../../../theory'
import { keyLabel, noteLabel, notesLabel } from '../../../questions/pitchTools'
import { listenMelody } from './audio'
import { MAJOR_PATTERN, NATURAL_MINOR_PATTERN, assertSameNotes, gapUp, lettersUp, noteAt, ordinal, patternInOneLine, semitones } from './working'

/** The traditional names of the first six degrees, written out by hand. The 7th depends on the scale. */
export const DEGREE_TERMS = ['tonic', 'supertonic', 'mediant', 'subdominant', 'dominant', 'submediant'] as const

/** Semitones above the key note of each degree, for the major scale and for the natural minor scale. */
const DEGREE_SEMITONES = {
  major: [0, 2, 4, 5, 7, 9, 11],
  minor: [0, 2, 3, 5, 7, 8, 10],
} as const

/** The colour the app uses for "this one" in notation (the accent colour). */
// Drawn on the paper-coloured staff card, so dark enough to read on it.
const HIGHLIGHT = '#0f766e'

export type DegreeQuestion = 'note' | 'name'

/**
 * Worked examples about scale degrees. `ask: 'note'` gives the name ("the dominant of D major") and asks for the note;
 * `ask: 'name'` gives the number ("the 4th degree") and asks for the name and the note.
 * Minor keys use the natural minor scale. The scale is written by its pattern; the degree's name comes from a hand-written
 * list (and, for the 7th, from the gap to the key note); everything is checked against the engine.
 */
export function scaleDegreeExample(key: Key, degree: number, ask: DegreeQuestion = 'note', clef: ClefName = 'treble'): WorkedExample {
  if (!Number.isInteger(degree) || degree < 1 || degree > 7) throw new RangeError('Degree must be 1 to 7')
  const isMajor = key.mode === 'major'
  const scaleName = isMajor ? 'major' : 'natural minor'
  const keyName = keyLabel(key)
  const scale = patternInOneLine(key.tonic, isMajor ? MAJOR_PATTERN : NATURAL_MINOR_PATTERN)
  assertSameNotes(`${keyName} scale`, scale.notes, keyScaleNotes(key))
  const tonic = key.tonic
  const wanted = scale.notes[degree - 1]!

  // The second route: the degree is a known number of letter names and semitones above the key note.
  const semis = DEGREE_SEMITONES[key.mode][degree - 1]!
  assertSameNotes(`the ${ordinal(degree)} degree of ${keyName}`, [noteAt(tonic, degree, semis, 'up')], [wanted])

  // The name.
  const gapToTonic = gapUp(scale.notes[6]!, tonic)
  const term = degree === 7 ? (gapToTonic === 1 ? 'leading note' : gapToTonic === 2 ? 'subtonic' : 'unnamed') : DEGREE_TERMS[degree - 1]!
  const engineTerm = scaleDegreeName(isMajor ? 'major' : 'natural-minor', degree)
  if (term !== engineTerm) throw new Error(`The name of degree ${degree} in ${keyName} is "${term}" by hand but "${engineTerm}" in the engine`)

  const start = pitch(tonic.letter, tonic.accidental, clef === 'treble' ? 4 : 3)
  const pitches = scalePitches(start, isMajor ? 'major' : 'natural-minor')
  const staff: StaffSpec = {
    clef,
    items: pitches.map((p, i) => ({ kind: 'notes' as const, pitches: [p], ...(i === degree - 1 ? { color: HIGHLIGHT } : {}) })),
  }

  const names = [...DEGREE_TERMS, isMajor ? 'leading note' : 'subtonic']
  const nameList = names.map((n, i) => `${i + 1} ${n}`).join(', ')
  const numbered = scale.notes.map((n, i) => `${i + 1} ${noteLabel(n)}`).join(', ')
  const inKey = `${keyName}${isMajor ? '' : ' (natural minor)'}`

  const seventhExplanation =
    degree === 7
      ? ` The 7th is a special case. In ${scaleName === 'major' ? 'a major scale' : 'the natural minor scale'} it is ${semitones(gapToTonic)} below the key note (${noteLabel(wanted)} up to ${noteLabel(tonic)}), and ${gapToTonic === 1 ? 'a note a semitone below the key note is called a **leading note**' : 'a note a tone below the key note is called a **subtonic**'}.`
      : ''

  const firstSteps =
    ask === 'note'
      ? [
          {
            text: `Turn the name into a number. The degree names in order are: ${nameList}. The **${term}** is number **${degree}**: it is the **${ordinal(degree)}** note of the scale.${seventhExplanation}`,
          },
        ]
      : [
          {
            text: `Look up the name for number ${degree}. The degree names in order are: ${nameList}. Number **${degree}** is the **${term}**.${seventhExplanation}`,
          },
        ]

  const distanceWords = (() => {
    const letters = lettersUp(tonic.letter, degree).join(', ')
    if (degree === 1) return `The tonic is the key note itself, ${noteLabel(tonic)}.`
    return `The ${ordinal(degree)} note is ${degree} letter names up from ${noteLabel(tonic)} (${letters}), and ${noteLabel(wanted)} is ${semitones(semis)} above ${noteLabel(tonic)}.`
  })()

  return {
    title: ask === 'note' ? `Find the ${term} of ${keyName}` : `Name the ${ordinal(degree)} degree of ${keyName}`,
    task:
      ask === 'note'
        ? `In ${inKey}, which note is the ${term}?`
        : `In ${inKey}, what is the ${ordinal(degree)} note of the scale called, and which note is it?`,
    steps: [
      ...firstSteps,
      { text: `Write the ${scaleName} scale from ${noteLabel(tonic)}, using its pattern (${isMajor ? 'tone, tone, semitone, tone, tone, tone, semitone' : 'tone, semitone, tone, tone, semitone, tone, tone'}). Working note by note: ${scale.text}. So the scale is **${notesLabel(scale.notes)}**.` },
      { text: `Number the notes: ${numbered}.` },
      {
        text: `Pick note number ${degree}: it is **${noteLabel(wanted)}**. Here is the scale on the staff, with that note in colour, and the sound.`,
        staff,
        listen: listenMelody(`Hear the ${keyName} scale`, pitches),
      },
      { text: `Check. ${distanceWords} ✓` },
    ],
    answer:
      ask === 'note'
        ? `The ${term} of ${inKey} is ${noteLabel(wanted)}.`
        : `The ${ordinal(degree)} degree of ${inKey} is the ${term}, and in this key it is ${noteLabel(wanted)}.`,
  }
}
