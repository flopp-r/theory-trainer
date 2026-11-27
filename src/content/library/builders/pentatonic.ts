import type { WorkedExample, WorkedStep } from '../types'
import { type ClefName, type NoteName, SCALE_LABELS, letterAt, letterIndex, pitch, pitchClass, scaleNotes, scalePitches } from '../../../theory'
import { noteLabel, notesLabel } from '../../../questions/pitchTools'
import { listenMelody } from './audio'
import { notesOnStaff } from './common'
import {
  MAJOR_PATTERN,
  NATURAL_MINOR_PATTERN,
  Words,
  assertSameNotes,
  gapUp,
  gapsBetween,
  joinAnd,
  keyNoteStep,
  keyWalkText,
  letterNamesStep,
  mod12,
  patternStep,
  prefersFlats,
  scaleGapSteps,
  semitoneChangeText,
  spellByPattern,
  spellOnLetter,
} from './working'

export type PentatonicType = 'major-pentatonic' | 'minor-pentatonic' | 'blues'

/** Which notes (counting from 1) of the parent seven-note scale each scale keeps. Written out by hand. */
const KEPT_DEGREES: Record<'major-pentatonic' | 'minor-pentatonic', readonly number[]> = {
  'major-pentatonic': [1, 2, 3, 5, 6],
  'minor-pentatonic': [1, 3, 4, 5, 7],
}

/**
 * Build a major pentatonic, minor pentatonic or blues scale.
 * The working builds the parent scale one gap at a time (only as far as it needs), picks notes from it by number,
 * and for the blues scale adds the flattened 5th. The answer is checked against the theory engine; this throws if they disagree.
 */
export function pentatonicExample(tonic: NoteName, type: PentatonicType, clef: ClefName = 'treble'): WorkedExample {
  const name = noteLabel(tonic)
  const label = SCALE_LABELS[type]
  const isMajor = type === 'major-pentatonic'
  const kind = isMajor ? 'major' : 'natural minor'
  const parent = spellByPattern(tonic, isMajor ? MAJOR_PATTERN : NATURAL_MINOR_PATTERN).notes
  const kept = KEPT_DEGREES[isMajor ? 'major-pentatonic' : 'minor-pentatonic']
  const leftOut = [1, 2, 3, 4, 5, 6, 7].filter((d) => !kept.includes(d))
  const pentatonic = kept.map((d) => parent[d - 1]!)

  // Blues: the flattened 5th sits between the 4th and 5th notes of the minor pentatonic.
  const fifth = parent[4]!
  const blueNote = spellOnLetter(fifth.letter, mod12(pitchClass(tonic) + 6))
  if (blueNote.accidental !== fifth.accidental - 1) throw new Error('The flattened 5th must be the 5th note lowered by a semitone')
  const result: NoteName[] = type === 'blues' ? [pentatonic[0]!, pentatonic[1]!, pentatonic[2]!, blueNote, pentatonic[3]!, pentatonic[4]!] : pentatonic
  assertSameNotes(`${name} ${label}`, result, scaleNotes(tonic, type))

  const startPitch = pitch(tonic.letter, tonic.accidental, clef === 'bass' || clef === 'alto' || clef === 'tenor' ? 3 : 4)
  const pitches = scalePitches(startPitch, type)
  if (pitches.length !== result.length + 1) throw new Error('The picture must have the scale and the key note again at the top')

  const w = new Words()
  const parentWord = isMajor ? 'major' : 'natural minor'
  // A major pentatonic never uses note 7, so the working stops at note 6.
  const lastNeeded = Math.max(...kept)
  const gapCount = lastNeeded - 1

  const steps: WorkedStep[] = []
  if (type === 'blues') {
    steps.push({
      title: 'Choose the scale to start from',
      text: `The ${w.say('bluesScale', 'blues scale')} starts from the ${w.say('pentatonic', 'minor pentatonic scale')}: notes 1, 3, 4, 5 and 7 of the natural minor scale on the same key note. Then it adds one note, the ${w.say('blueNote', 'blue note')}.`,
      result: `Start from ${name} natural minor`,
    })
  } else {
    steps.push({
      title: 'Choose the scale to start from',
      text: `A ${w.say('pentatonic', 'pentatonic scale')} keeps five notes of a seven-note scale with the same key note. The ${label} scale keeps notes ${joinAnd(kept.map(String))} of the ${parentWord} scale.`,
      result: `Start from ${name} ${parentWord}`,
    })
  }
  steps.push(keyNoteStep(tonic, `${name} ${parentWord}`, w))
  steps.push(
    letterNamesStep(tonic, lastNeeded, w, lastNeeded === 7 ? `You need notes 1 to 7.` : `Note 7 is left out, so you need notes 1 to ${lastNeeded} only.`),
  )
  steps.push(patternStep(kind, gapCount, w))
  const gaps = scaleGapSteps(tonic, kind, gapCount, w)
  assertSameNotes(`${name} ${parentWord} (gap steps)`, gaps.notes, parent.slice(0, lastNeeded))
  steps.push(...gaps.steps)

  const semitoneSteps = isMajor ? 'between notes 3 and 4, and between notes 7 and 8' : 'between notes 2 and 3, and between notes 5 and 6'
  const leftText = leftOut.map((d) => (d <= lastNeeded ? `note ${d} (${noteLabel(parent[d - 1]!)})` : `note ${d}, which you did not need to work out`))
  steps.push({
    title: `Leave out notes ${leftOut[0]} and ${leftOut[1]}`,
    text: `Leave out ${joinAnd(leftText)}. This removes both semitone steps of the ${parentWord} scale, ${semitoneSteps}.`,
    result: `Left out: notes ${leftOut[0]} and ${leftOut[1]}`,
  })
  steps.push({
    title: 'Keep the other five notes',
    text: `Keep ${joinAnd(kept.map((d) => `note ${d} (${noteLabel(parent[d - 1]!)})`))}.`,
    result: type === 'blues' ? `${name} minor pentatonic: ${notesLabel(pentatonic)}` : notesLabel(pentatonic),
  })

  if (type === 'blues') {
    const lower = semitoneChangeText(fifth, -1, w)
    assertSameNotes('the blue note', [lower.note], [blueNote])
    steps.push({
      title: 'Find the blue note',
      text: `The blue note is note 5 lowered by a semitone. Note 5 is ${noteLabel(fifth)}. ${lower.text}`,
      result: `Blue note: ${noteLabel(blueNote)}`,
    })
    const fourth = parent[3]!
    const fourthLetter = letterAt(letterIndex(fifth.letter) - 1)
    if (fourthLetter !== fourth.letter) throw new Error('Note 4 must use the letter before note 5')
    const other = spellOnLetter(fourth.letter, pitchClass(blueNote))
    steps.push({
      title: 'Spell the blue note with the letter of note 5',
      text: `${noteLabel(blueNote)} is the same piano key as ${noteLabel(other)}: the two names are ${w.say('enharmonic', 'enharmonic')}. Use ${noteLabel(blueNote)}. The blue note is a lowered note 5, so it keeps note 5's letter, ${fifth.letter}. ${noteLabel(other)} would use the letter of note 4.`,
      result: `${noteLabel(blueNote)}, not ${noteLabel(other)}`,
    })
    if (gapUp(fourth, blueNote) !== 1 || gapUp(blueNote, fifth) !== 1) throw new Error('The blue note must sit a semitone above the 4th and a semitone below the 5th')
    steps.push({
      title: 'Put the blue note between notes 4 and 5',
      text: `The blue note sits between note 4 (${noteLabel(fourth)}) and note 5 (${noteLabel(fifth)}), a semitone from each. The letter ${fifth.letter} now appears twice, which is normal in the blues scale.`,
      result: notesLabel(result),
    })
  }

  steps.push({
    title: 'Write the scale out',
    text: `Read the ${type === 'blues' ? 'six' : 'five'} notes from the bottom up and finish on the key note again, ${w.say('octave', 'one octave')} higher.`,
    result: `${notesLabel(result)} ${name}`,
    staff: notesOnStaff(clef, pitches),
    listen: listenMelody(`Hear the ${name} ${label} scale`, pitches),
  })

  if (type === 'blues') {
    const six = gapUp(tonic, blueNote)
    if (six !== 6) throw new Error('The blue note must be 6 semitones above the key note')
    steps.push({
      title: 'Check another way: count up to the blue note',
      text: `The blue note is always 6 semitones above the key note, halfway to the octave. Count up one piano key at a time from ${name}. Count the steps, not the key you start on: ${keyWalkText(tonic, blueNote, 6, 'up', prefersFlats(tonic, blueNote))}.`,
      result: `${noteLabel(blueNote)} is 6 semitones above ${name}, as it should be`,
    })
  } else {
    const withTop = [...result, tonic]
    const sizes = gapsBetween(withTop)
    if (sizes.some((g) => g < 2)) throw new Error('A pentatonic scale has no semitone steps')
    const measured = sizes.map((g, i) => `${noteLabel(withTop[i]!)} up to ${noteLabel(withTop[i + 1]!)} is ${g}`)
    steps.push({
      title: 'Check another way: measure each gap',
      text: `Measure each gap of your answer in semitones, counting piano keys: ${measured.join(', ')}. None is a single semitone, which is right for a pentatonic scale.`,
      result: 'No semitone steps, as it should be',
    })
  }

  return {
    title: `Build the ${name} ${label} scale`,
    task: `Write the notes of the ${name} ${label} scale, going up.`,
    steps,
    terms: w.terms(),
    answer: `The ${name} ${label} scale is ${notesLabel(result)} ${name}.`,
  }
}
