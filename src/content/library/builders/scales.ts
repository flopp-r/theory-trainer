import type { WorkedExample, WorkedStep, WorkedTerm } from '../types'
import {
  type ClefName,
  type NoteName,
  formatNote,
  pitchClass,
  keyScaleNotes,
  letterAt,
  letterIndex,
  pitch,
  scalePitches,
} from '../../../theory'
import { noteLabel, notesLabel } from '../../../questions/pitchTools'
import { listenMelody } from './audio'
import { notesOnStaff } from './common'

const PATTERN = ['tone', 'tone', 'semitone', 'tone', 'tone', 'tone', 'semitone'] as const
const SIZE = { tone: 2, semitone: 1 }
/** Semitones from each natural letter up to the next one: no black key between E–F and B–C. */
const NEXT_LETTER_GAP: Record<string, number> = { C: 2, D: 2, E: 1, F: 2, G: 2, A: 2, B: 1 }

/** Names for the piano keys, for counting up one key at a time. */
const SHARP_NAMES = ['C', 'C♯', 'D', 'D♯', 'E', 'F', 'F♯', 'G', 'G♯', 'A', 'A♯', 'B']
const FLAT_NAMES = ['C', 'D♭', 'D', 'E♭', 'E', 'F', 'G♭', 'G', 'A♭', 'A', 'B♭', 'B']

const st = (n: number) => `${n} semitone${n === 1 ? '' : 's'}`

/**
 * Build a major scale step by step: one step per gap, every count shown.
 * The working counts semitones by hand; at the end it is checked against the theory engine,
 * and this function throws if the two ever disagree, so a wrong example cannot be shown.
 */
export function majorScaleExample(tonic: NoteName, clef: ClefName = 'treble'): WorkedExample {
  const name = noteLabel(tonic)
  const letters = Array.from({ length: 8 }, (_, i) => letterAt(letterIndex(tonic.letter) + i))
  const notes: NoteName[] = [tonic]
  const gapSteps: WorkedStep[] = []
  let sharpExplained = false
  let flatExplained = false
  let naturalExplained = false

  for (let i = 1; i <= 7; i++) {
    const previous = notes[i - 1]!
    const letter = letters[i]!
    const letterGap = NEXT_LETTER_GAP[previous.letter]!
    const gap = letterGap - previous.accidental // a sharp on the lower note makes the gap smaller, a flat makes it bigger
    const kind = PATTERN[i - 1]!
    const wanted = SIZE[kind]
    const accidental = wanted - gap
    if (Math.abs(accidental) > 2) throw new Error('A major scale never needs more than a double sharp or flat')
    const next: NoteName = { letter, accidental }
    notes.push(next)

    const keys = letterGap === 1 ? 'there is no black key between them' : 'there is one black key between them'
    const count =
      previous.accidental === 0
        ? `From ${previous.letter} up to ${letter} is ${st(letterGap)} (${keys}).`
        : `From ${previous.letter} up to ${letter} is ${st(letterGap)}. Your note is ${noteLabel(previous)}, which is ${st(Math.abs(previous.accidental))} ${previous.accidental > 0 ? 'higher' : 'lower'} than ${previous.letter}, so the gap is ${st(gap)}${gap === 0 ? ` (${noteLabel(previous)} and ${letter} are the same piano key)` : ''}.`
    const ask = `The pattern asks for a ${kind} (${st(wanted)}).`
    let fix: string
    if (accidental === 0) {
      fix = `They match, so this note stays a natural${naturalExplained ? '' : ' (no sharp or flat)'}: **${letter}**.`
      naturalExplained = true
    } else if (accidental > 0) {
      const sign = accidental === 1 ? 'a sharp' : 'a double sharp'
      const reminder = sharpExplained ? '' : ` (${accidental === 1 ? '♯' : '𝄪'} raises a note by ${st(accidental)})`
      sharpExplained = true
      fix = `The gap is ${st(accidental)} too small, so raise ${letter} with ${sign}${reminder}: **${noteLabel(next)}**.`
    } else {
      const sign = accidental === -1 ? 'a flat' : 'a double flat'
      const reminder = flatExplained ? '' : ` (${accidental === -1 ? '♭' : '𝄫'} lowers a note by ${st(-accidental)})`
      flatExplained = true
      fix = `The gap is ${st(-accidental)} too big, so lower ${letter} with ${sign}${reminder}: **${noteLabel(next)}**.`
    }
    gapSteps.push({
      title: `Gap ${i}: ${noteLabel(previous)} up to ${letter}`,
      text: `${count} ${ask} ${fix}`,
      result: i === 7 ? `Note 8: ${noteLabel(next)}, the key note again` : `Note ${i + 1}: ${noteLabel(next)}`,
    })
  }

  // Cross-check against the engine: the long-hand working must give the same scale.
  const expected = keyScaleNotes({ tonic, mode: 'major' })
  if (expected.some((n, i) => formatNote(n) !== formatNote(notes[i]!)) || formatNote(notes[7]!) !== formatNote(tonic)) {
    throw new Error(`Worked example for ${name} major disagrees with the theory engine`)
  }
  // The check walks up one piano key at a time from the key note to note 3: a different route from the gaps.
  const third = notes[2]!
  const walkLength = (((pitchClass(third) - pitchClass(tonic)) % 12) + 12) % 12
  if (walkLength !== 4) throw new Error(`The 3rd of ${name} major should be 4 semitones above it`)
  const names = tonic.accidental < 0 || formatNote(tonic) === 'F' ? FLAT_NAMES : SHARP_NAMES
  const walk = [name, ...Array.from({ length: walkLength - 1 }, (_, i) => names[(pitchClass(tonic) + i + 1) % 12]!), noteLabel(third)]

  const accidentals = notes.slice(0, 7).map((n) => n.accidental)
  const terms: WorkedTerm[] = [
    { term: 'Scale', meaning: 'A set of notes in order of pitch, going up or down by step and using each letter name once.' },
    { term: 'Key note (tonic)', meaning: `The note a scale starts and ends on, and is named after. Here it is ${name}.` },
    { term: 'Semitone', meaning: 'The smallest step in Western music: from one piano key to the very next key, black or white.' },
    { term: 'Tone', meaning: 'A step of two semitones, such as C up to D.' },
    { term: 'Natural', meaning: 'A note with no sharp or flat, such as E or B.' },
  ]
  if (accidentals.some((a) => a > 0)) terms.push({ term: 'Sharp (♯)', meaning: 'A sign that raises a note by one semitone. F♯ is one semitone higher than F.' })
  if (accidentals.some((a) => a < 0)) terms.push({ term: 'Flat (♭)', meaning: 'A sign that lowers a note by one semitone. B♭ is one semitone lower than B.' })
  terms.push({ term: 'Octave', meaning: 'The distance from a note to the next note with the same letter name: 8 letter names, or 12 semitones.' })

  const scale = scalePitches(pitch(tonic.letter, tonic.accidental, clef === 'treble' ? 4 : 3), 'major')
  return {
    title: `Build the ${name} major scale`,
    task: `Write the notes of the ${name} major scale, going up.`,
    terms,
    steps: [
      {
        title: 'Write the key note',
        text: `The key note, or tonic (the note the scale is named after), is ${name}. It is note 1 of the scale.`,
        result: `Note 1: ${name}`,
      },
      {
        title: 'Write the letter names',
        text: `Write eight letter names in alphabetical order, starting on ${tonic.letter}. After G, go back to A. A scale uses every letter name once, so the letters are now fixed. Only the sharps or flats are left to work out.`,
        result: letters.join(' '),
      },
      {
        title: 'Write the major scale pattern',
        text: 'Every major scale climbs in the same pattern of tones (steps of 2 semitones) and semitones (the smallest step, from one piano key to the next). There is one step of the pattern for each of the seven gaps between your eight letters.',
        result: 'tone, tone, semitone, tone, tone, tone, semitone',
      },
      ...gapSteps,
      {
        title: 'Write the scale out',
        text: 'Read your notes from the bottom up. The last note is the key note again, one octave (8 letter names) higher.',
        result: notesLabel(notes),
        staff: notesOnStaff(clef, scale),
        listen: listenMelody(`Hear the ${name} major scale`, scale),
      },
      {
        title: 'Check another way: count up to note 3',
        text: `In every major scale, note 3 is 4 semitones above the key note. Count up one piano key at a time from ${name}, without using your gaps: ${walk.join(', ')}. Count the steps, not the key you start on: 4 steps, so 4 semitones.`,
        result: `${noteLabel(third)} is 4 semitones above ${name}, as it should be`,
      },
    ],
    answer: `The ${name} major scale is ${notesLabel(notes)}.`,
  }
}
