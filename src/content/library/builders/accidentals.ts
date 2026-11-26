import type { WorkedExample, WorkedStep } from '../types'
import {
  type ClefName,
  type NoteName,
  type Pitch,
  accidentalsToShow,
  clefLabel,
  describeStaffPosition,
  diatonicStep,
  formatNote,
  formatPitch,
  keyScaleNotes,
  midiNumber,
  pitch,
  sameSound,
  staffPosition,
} from '../../../theory'
import { clefAnchor } from '../../../questions/noteName'
import { noteLabel } from '../../../questions/pitchTools'
import { anchorPitch, countPath } from './clefs'
import { listenMelody } from './audio'
import { notesOnStaff } from './common'

/*
 * Builders about sharps, flats and naturals: naming a note that has a sign, how long a sign lasts in a bar,
 * and notes that sound the same but are spelled differently. Each one works the answer out long-hand and
 * cross-checks it against the theory engine; a disagreement throws.
 */

const sym = (p: Pitch) => formatPitch(p, 'symbol')
const stepsText = (n: number) => `${n} ${n === 1 ? 'step' : 'steps'}`
const ordinal = (n: number) => ['1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th'][n - 1] ?? `${n}th`

/** The name of a sign, from the number of semitones it adds. */
export function signName(accidental: number): string {
  switch (accidental) {
    case 1:
      return 'sharp'
    case -1:
      return 'flat'
    case 0:
      return 'natural'
    case 2:
      return 'double sharp'
    case -2:
      return 'double flat'
    default:
      throw new RangeError(`There is no sign for ${accidental} semitones`)
  }
}

const withArticle = (accidental: number) => `a ${signName(accidental)}`
const semitonesText = (n: number) => `${Math.abs(n)} semitone${Math.abs(n) === 1 ? '' : 's'}`

/** "Name a note with a sharp, flat, double sharp or double flat": count the plain note first, then add the sign. */
export function nameAccidentalExample(clef: ClefName, target: Pitch): WorkedExample {
  if (target.accidental === 0) throw new RangeError('The note needs a sharp or flat')
  const sign = signName(target.accidental)
  const anchor = anchorPitch(clef)
  const info = clefAnchor(clef)
  const plain = pitch(target.letter, 0, target.octave)
  const path = countPath(anchor, plain)
  const moved = path.length - 1
  const direction: 1 | -1 = diatonicStep(plain) >= diatonicStep(anchor) ? 1 : -1
  const position = info.position + direction * moved
  if (position !== staffPosition(target, clef)) throw new Error('Counted position disagrees with the theory engine')
  // The sign must change the sound by exactly the number of semitones it stands for.
  if (midiNumber(target) - midiNumber(plain) !== target.accidental) throw new Error('The sign does not match the change in sound')

  const letters = path.map((p) => p.letter)
  const where = describeStaffPosition(position)
  const name = noteLabel(target)
  const up = target.accidental > 0
  return {
    title: `Name a note with ${withArticle(target.accidental)} in ${clefLabel(clef).toLowerCase()}`,
    task: `What is the name of this note (${clefLabel(clef).toLowerCase()})? It has ${withArticle(target.accidental)} in front.`,
    steps: [
      {
        text: `Look at the picture. The note head sits on **${where}**. In front of it is ${withArticle(target.accidental)}${Math.abs(target.accidental) === 2 ? '' : ` (${up ? '♯' : '♭'})`}.`,
        staff: notesOnStaff(clef, [target]),
      },
      { text: 'Ignore the sign for now and find the **letter**. The sign never changes the place on the staff, only the sound.' },
      {
        text:
          moved === 0
            ? `${info.description}. Your note is on that line, so the letter is **${target.letter}**.`
            : `${info.description}, so the anchor is **${anchor.letter}**. Count **${stepsText(moved)} ${direction === 1 ? 'up' : 'down'}**, saying the letters ${direction === 1 ? 'forwards' : 'backwards'}: **${letters.join(', ')}**. The letter is **${target.letter}**.`,
      },
      {
        text: `Now add the sign. ${withArticle(target.accidental)[0]!.toUpperCase()}${withArticle(target.accidental).slice(1)} ${up ? 'raises' : 'lowers'} the note by ${semitonesText(target.accidental)}. So the plain ${target.letter} becomes **${name}**.`,
      },
      {
        text: `Check: the sign sits in front of the note head, on the same line or space. We say the letter first and the sign second, so this is "${target.letter} ${sign}", written **${name}**. The plain ${target.letter} would be ${semitonesText(target.accidental)} ${up ? 'lower' : 'higher'}.`,
      },
    ],
    answer: `The note is ${name}.`,
  }
}

interface CarryRow {
  readonly note: Pitch
  readonly printed: boolean
  readonly reason: string
}

function carryRows(notes: readonly Pitch[]): CarryRow[] {
  const state = new Map<string, number>() // the sign in force for each letter + octave, once it has appeared in the bar
  const rows: CarryRow[] = []
  notes.forEach((note, i) => {
    const slot = `${note.letter}${note.octave}`
    const earlier = state.get(slot)
    const inForce = earlier ?? 0
    const printed = note.accidental !== inForce
    const otherOctave = notes
      .slice(0, i)
      .find((n) => n.letter === note.letter && n.octave !== note.octave && n.accidental !== 0)
    const octaveNote = otherOctave
      ? ` The ${signName(otherOctave.accidental)} on ${otherOctave.letter}${otherOctave.octave} earlier does not help here: ${slot} is a different pitch because the octave number is different.`
      : ''
    let reason: string
    if (printed && note.accidental !== 0 && earlier === undefined) {
      reason = `**${noteLabel(note)} needs ${withArticle(note.accidental)}.** Nothing earlier in the bar has changed ${slot}, so without a sign it would be read as plain ${note.letter}.${octaveNote}`
    } else if (printed && note.accidental !== 0) {
      reason = `**${noteLabel(note)} needs its own sign.** Earlier in the bar ${slot} was ${inForce === 0 ? 'plain' : withArticle(inForce)}, and this note is different.`
    } else if (printed) {
      reason = `**A natural sign (♮) is printed.** The ${signName(inForce)} on ${slot} from earlier in the bar is still in force, so a natural is needed to cancel it and give plain ${note.letter} again.`
    } else if (note.accidental !== 0) {
      reason = `**No sign.** The ${signName(note.accidental)} on ${slot} earlier in the bar is still in force, and this is the same pitch (same letter, same octave). It is still ${noteLabel(note)}.`
    } else if (earlier === undefined) {
      reason = `**No sign.** ${slot} is a plain note and nothing earlier in the bar has changed it.${octaveNote}`
    } else {
      reason = `**No sign.** ${slot} is plain here, the same as the last time it appeared in the bar.`
    }
    state.set(slot, note.accidental)
    rows.push({ note, printed, reason })
  })
  return rows
}

/**
 * Shows a short bar and, for each note, whether a sign is printed and why.
 * The reasons are worked out by hand with one rule (a sign lasts for the rest of the bar, for the same letter and octave),
 * then checked against the theory engine's `accidentalsToShow`. This throws if the two disagree.
 */
export function accidentalCarryExample(notes: readonly Pitch[], clef: ClefName = 'treble'): WorkedExample {
  if (notes.length < 2) throw new RangeError('A bar needs at least two notes')
  const rows = carryRows(notes)
  const engine = accidentalsToShow(
    notes.map((n) => [n]),
    null,
  )
  rows.forEach((row, i) => {
    const sign = engine[i]![0]!
    if ((sign !== null) !== row.printed) throw new Error(`Note ${i + 1}: the rule and the theory engine disagree about printing a sign`)
    if (sign !== null) {
      const expected = { '#': 1, b: -1, n: 0, '##': 2, bb: -2 }[sign]
      if (expected !== row.note.accidental) throw new Error(`Note ${i + 1}: the sign printed does not match the note`)
    }
  })

  const printed = rows.flatMap((row, i) => (row.printed ? [{ n: i + 1, label: row.note.accidental === 0 ? '♮' : noteLabel(row.note).slice(1) }] : []))
  const none = rows.flatMap((row, i) => (row.printed ? [] : [i + 1]))
  const list = (values: readonly (string | number)[]) =>
    values.length <= 1 ? values.join('') : `${values.slice(0, -1).join(', ')} and ${values.at(-1)}`
  const summary = `Signs are printed on ${printed.length === 1 ? 'note' : 'notes'} ${list(printed.map((s) => `${s.n} (${s.label})`))}. There is no sign on ${none.length === 1 ? 'note' : 'notes'} ${list(none)}.`

  const steps: WorkedStep[] = [
    {
      text: `Here is one bar. Number the notes 1 to ${notes.length} from the left. The rule: a sign **lasts for the rest of the bar**, but only for the **same pitch** (same letter **and** same octave).`,
      staff: notesOnStaff(clef, notes),
    },
    ...rows.map((row, i) => ({ text: `**Note ${i + 1}, ${sym(row.note)}.** ${row.reason}` })),
    { text: `Check: ${summary} Count again: ${printed.length} sign${printed.length === 1 ? '' : 's'} printed and ${none.length} not printed make ${notes.length} notes.` },
  ]
  return {
    title: 'How long a sharp, flat or natural lasts',
    task: `In this bar, which notes have a sign printed in front of them, and why do the others not need one?`,
    steps,
    answer: summary,
  }
}

/**
 * Two spellings of one sound (a sharp and a flat on neighbouring letters, such as F♯ and G♭), and why you must choose
 * by the letter the scale needs. Each of the two tonics is a major key that needs one of the spellings.
 */
export function enharmonicExample(sharpNote: Pitch, flatNote: Pitch, sharpKeyTonic: NoteName, flatKeyTonic: NoteName): WorkedExample {
  if (sharpNote.accidental !== 1 || flatNote.accidental !== -1) throw new RangeError('Give a sharp spelling first and a flat spelling second')
  if (!sameSound(sharpNote, flatNote)) throw new Error('The two spellings do not sound the same')
  // The plain letters must be a tone apart (so there is a black key between them), and the flat's letter is the next one up.
  const letterGap = midiNumber(pitch(flatNote.letter, 0, flatNote.octave)) - midiNumber(pitch(sharpNote.letter, 0, sharpNote.octave))
  if (diatonicStep(flatNote) - diatonicStep(sharpNote) !== 1 || letterGap !== 2) throw new RangeError('The two notes must be on neighbouring letters a tone apart')

  const sharpName = noteLabel(sharpNote)
  const flatName = noteLabel(flatNote)
  const inScale = (scale: readonly NoteName[], n: NoteName) => scale.some((s) => formatNote(s) === formatNote(n))
  const sharpScale = keyScaleNotes({ tonic: sharpKeyTonic, mode: 'major' })
  const flatScale = keyScaleNotes({ tonic: flatKeyTonic, mode: 'major' })
  if (!inScale(sharpScale, sharpNote) || inScale(sharpScale, flatNote)) throw new Error(`${noteLabel(sharpKeyTonic)} major must contain ${sharpName} and not ${flatName}`)
  if (!inScale(flatScale, flatNote) || inScale(flatScale, sharpNote)) throw new Error(`${noteLabel(flatKeyTonic)} major must contain ${flatName} and not ${sharpName}`)
  const indexIn = (scale: readonly NoteName[], n: NoteName) => scale.findIndex((s) => formatNote(s) === formatNote(n)) + 1
  const scaleText = (scale: readonly NoteName[]) => scale.map((n) => noteLabel(n)).join(' ')
  const sharpTonicName = noteLabel(sharpKeyTonic)
  const flatTonicName = noteLabel(flatKeyTonic)

  return {
    title: `${sharpName} or ${flatName}? Choosing the spelling`,
    task: `${sharpName} and ${flatName} sound the same. How do you decide which one to write?`,
    steps: [
      {
        text: `Here are the two notes side by side. Listen: they sound exactly the same.`,
        staff: notesOnStaff('treble', [sharpNote, flatNote]),
        listen: listenMelody(`Hear ${sharpName} then ${flatName}`, [sharpNote, flatNote]),
      },
      {
        text: `Why? On a piano ${sharpName} is the key one semitone **above** ${sharpNote.letter}, and ${flatName} is the key one semitone **below** ${flatNote.letter}. ${sharpNote.letter} and ${flatNote.letter} are a tone (2 semitones) apart, so there is one key between them, and both names point at it. Notes like this are called **enharmonic equivalents**.`,
      },
      {
        text: `The names are different because the **letters** are different: ${sharpNote.letter} for ${sharpName}, ${flatNote.letter} for ${flatName}. The letter matters, because a scale uses **each letter once**.`,
      },
      {
        text: `Try ${sharpTonicName} major: **${scaleText(sharpScale)}**. Its ${ordinal(indexIn(sharpScale, sharpNote))} note must use the letter ${sharpNote.letter}, and the scale already has a plain ${flatNote.letter} (the ${ordinal(indexIn(sharpScale, { letter: flatNote.letter, accidental: 0 }))} note). So here the note is **${sharpName}**. Writing ${flatName} would use the letter ${flatNote.letter} twice and miss ${sharpNote.letter}.`,
      },
      {
        text: `Try ${flatTonicName} major: **${scaleText(flatScale)}**. Its ${ordinal(indexIn(flatScale, flatNote))} note must use the letter ${flatNote.letter}, and the scale already has a plain ${sharpNote.letter} (the ${ordinal(indexIn(flatScale, { letter: sharpNote.letter, accidental: 0 }))} note). So here the note is **${flatName}**. Writing ${sharpName} would use the letter ${sharpNote.letter} twice and miss ${flatNote.letter}.`,
      },
      {
        text: `Check: in each scale the seven notes use the seven letters A to G once each. ${sharpTonicName} major has ${sharpName} and not ${flatName}; ${flatTonicName} major has ${flatName} and not ${sharpName}.`,
      },
    ],
    answer: `${sharpName} and ${flatName} are the same sound. Write the one whose letter you need: ${sharpName} in ${sharpTonicName} major, ${flatName} in ${flatTonicName} major.`,
  }
}
