import type { WorkedExample, WorkedStep } from '../types'
import { type ClefName, type NoteName, SCALE_LABELS, pitch, pitchClass, scaleNotes, scalePitches } from '../../../theory'
import { noteLabel, notesLabel } from '../../../questions/pitchTools'
import { listenMelody } from './audio'
import { notesOnStaff } from './common'
import {
  MAJOR_PATTERN,
  NATURAL_MINOR_PATTERN,
  assertSameNotes,
  gapUp,
  gapsAsWords,
  gapsBetween,
  lowerSentence,
  mod12,
  ordinal,
  patternInOneLine,
  semitones,
  spellOnLetter,
} from './working'

export type PentatonicType = 'major-pentatonic' | 'minor-pentatonic' | 'blues'

/** Which notes (counting from 1) of the parent seven-note scale each scale keeps. */
const KEPT_DEGREES: Record<'major-pentatonic' | 'minor-pentatonic', readonly number[]> = {
  'major-pentatonic': [1, 2, 3, 5, 6],
  'minor-pentatonic': [1, 3, 4, 5, 7],
}

const joinWords = (items: readonly string[]): string => (items.length <= 1 ? (items[0] ?? '') : `${items.slice(0, -1).join(', ')} and ${items.at(-1)}`)

/**
 * Build a major pentatonic, minor pentatonic or blues scale.
 * The working builds the seven-note parent scale by its pattern, picks notes from it by number, and (for the blues scale)
 * adds the flattened 5th. The answer is then checked against the theory engine, and this function throws if they disagree.
 */
export function pentatonicExample(tonic: NoteName, type: PentatonicType, clef: ClefName = 'treble'): WorkedExample {
  const name = noteLabel(tonic)
  const label = SCALE_LABELS[type]
  const isMajor = type === 'major-pentatonic'
  const parentName = isMajor ? 'major' : 'natural minor'
  const parent = patternInOneLine(tonic, isMajor ? MAJOR_PATTERN : NATURAL_MINOR_PATTERN)
  const kept = KEPT_DEGREES[isMajor ? 'major-pentatonic' : 'minor-pentatonic']
  const pentatonic = kept.map((d) => parent.notes[d - 1]!)
  const leftOut = [1, 2, 3, 4, 5, 6, 7].filter((d) => !kept.includes(d))

  // Blues: the flattened 5th sits between the 4th and 5th notes of the minor pentatonic.
  const fifth = parent.notes[4]!
  const blueNote = spellOnLetter(fifth.letter, mod12(pitchClass(tonic) + 6))
  const loweredFifth: NoteName = { letter: fifth.letter, accidental: fifth.accidental - 1 }
  if (blueNote.accidental !== loweredFifth.accidental) throw new Error('The flattened 5th must be the 5th note lowered by a semitone')
  const result: NoteName[] = type === 'blues' ? [pentatonic[0]!, pentatonic[1]!, pentatonic[2]!, blueNote, pentatonic[3]!, pentatonic[4]!] : pentatonic

  assertSameNotes(`${name} ${label}`, result, scaleNotes(tonic, type))

  const startPitch = pitch(tonic.letter, tonic.accidental, clef === 'bass' || clef === 'alto' || clef === 'tenor' ? 3 : 4)
  const pitches = scalePitches(startPitch, type)
  if (pitches.length !== result.length + 1) throw new Error('The picture must have the scale and the key note again at the top')
  const withTop = [...result, tonic]
  const gaps = gapsBetween(withTop)
  const numbered = parent.notes.map((n, i) => `${i + 1} ${noteLabel(n)}`).join(', ')
  const parentStep: WorkedStep = {
    text: `Write the ${parentName} scale from ${name}, using its pattern (${isMajor ? 'tone, tone, semitone, tone, tone, tone, semitone' : 'tone, semitone, tone, tone, semitone, tone, tone'}). Working note by note: ${parent.text}. So ${name} ${parentName} is **${notesLabel(parent.notes)}**.`,
  }
  const numberStep: WorkedStep = { text: `Number the notes: ${numbered}.` }

  if (type !== 'blues') {
    const keptText = kept.map((d) => `${d} (${noteLabel(parent.notes[d - 1]!)})`)
    const leftText = leftOut.map((d) => `${d} (${noteLabel(parent.notes[d - 1]!)})`)
    const noSemitone = gaps.every((g) => g >= 2)
    if (!noSemitone) throw new Error('A pentatonic scale has no semitone steps')
    return {
      title: `Build the ${name} ${label} scale`,
      task: `Write the notes of the ${name} ${label} scale.`,
      steps: [
        { text: `Start with the idea. **Pentatonic** means *five notes* ("penta" is five). A ${label} scale is chosen from the ${parentName} scale that starts on the same key note, ${name}.` },
        parentStep,
        numberStep,
        {
          text: `Keep notes **${joinWords(kept.map(String))}** and leave out notes **${joinWords(leftOut.map(String))}**. Keep: ${joinWords(keptText)}. Leave out: ${joinWords(leftText)}.`,
        },
        {
          text: `Write the five notes in order and finish on the key note again: **${notesLabel(pentatonic)} ${name}**. Here it is on the staff, with the sound.`,
          staff: notesOnStaff(clef, pitches),
          listen: listenMelody(`Hear the ${name} ${label} scale`, pitches),
        },
        {
          text: `Check. There are five different notes. The gaps between neighbours (including the step back up to ${name}) are ${gaps.join(', ')} semitones: **${gapsAsWords(gaps)}**. None of them is a single semitone. The two notes you left out (the ${ordinal(leftOut[0]!)} and ${ordinal(leftOut[1]!)}) are the ones that sat next to the ${parentName} scale's two semitone steps. ✓`,
        },
      ],
      answer: `The ${name} ${label} scale is ${notesLabel(pentatonic)} ${name}.`,
    }
  }

  // blues
  const fourth = parent.notes[3]!
  const alternative = spellOnLetter(fourth.letter, pitchClass(blueNote))
  const alternativeText =
    Math.abs(alternative.accidental) === 1
      ? ` On a keyboard it is the same key as ${noteLabel(alternative)}, but ${noteLabel(alternative)} uses the letter ${fourth.letter}, which belongs to the 4th note. In this app the blue note is spelled as a *flattened 5th*, so it keeps the 5th's letter, ${fifth.letter}.`
      : ''
  const downToBlue = gapUp(fourth, blueNote)
  const blueToFifth = gapUp(blueNote, fifth)
  if (downToBlue !== 1 || blueToFifth !== 1) throw new Error('The blue note must sit a semitone above the 4th and a semitone below the 5th')
  const keptText = kept.map((d) => `${d} (${noteLabel(parent.notes[d - 1]!)})`)
  return {
    title: `Build the ${name} blues scale`,
    task: `Write the notes of the ${name} blues scale.`,
    steps: [
      { text: `Start with the idea. The blues scale in this app is the **minor pentatonic** scale with one extra note, the **blue note**, which is the *flattened 5th*. So it has **six** notes.` },
      parentStep,
      numberStep,
      {
        text: `Pick out the minor pentatonic notes: keep notes **${joinWords(kept.map(String))}**, which are ${joinWords(keptText)}. That is **${notesLabel(pentatonic)}**.`,
      },
      {
        text: `Find the blue note. The 5th note of the natural minor scale is ${noteLabel(fifth)}. Lower it by a semitone: ${lowerSentence(fifth)}${alternativeText}`,
      },
      {
        text: `Put the blue note **between the 4th and 5th notes**, so the order is: ${notesLabel(result)}. Write it out and finish on the key note: **${notesLabel(result)} ${name}**. Here it is on the staff, with the sound.`,
        staff: notesOnStaff(clef, pitches),
        listen: listenMelody(`Hear the ${name} blues scale`, pitches),
      },
      {
        text: `Check. There are six notes, and the gaps between neighbours (including the step back up to ${name}) are ${gaps.join(', ')} semitones. The blue note ${noteLabel(blueNote)} is ${semitones(downToBlue)} above the 4th note ${noteLabel(fourth)} and ${semitones(blueToFifth)} below the 5th note ${noteLabel(fifth)}. The letter ${fifth.letter} appears twice (${noteLabel(blueNote)} and ${noteLabel(fifth)}), which is normal for this scale. ✓`,
      },
    ],
    answer: `The ${name} blues scale is ${notesLabel(result)} ${name}.`,
  }
}
