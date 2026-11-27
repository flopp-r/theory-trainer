import type { WorkedExample, WorkedStep, WorkedTerm } from '../types'
import { LETTERS, type NoteName, type Pitch, midiNumber, note, pitch, pitchClass } from '../../../theory'
import { noteLabel } from '../../../questions/pitchTools'
import { notesOnStaff } from './common'

/*
 * Builders about tones and semitones. Semitones are counted two ways (key by key, and by subtracting the numbers
 * 0 to 11 that every note of the octave has), then checked against the MIDI numbers of two real pitches. A disagreement throws.
 */

/** The names of the key with this number: "D" for 2, "D♯/E♭" for 3. */
export function keyNames(number: number): string {
  if (!Number.isInteger(number) || number < 0 || number > 11) throw new RangeError('A key number is from 0 to 11')
  const white = LETTERS.find((l) => pitchClass(note(l)) === number)
  if (white) return noteLabel(note(white))
  const below = LETTERS.find((l) => pitchClass(note(l, 1)) === number)!
  const above = LETTERS.find((l) => pitchClass(note(l, -1)) === number)!
  return `${noteLabel(note(below, 1))}/${noteLabel(note(above, -1))}`
}

/** Rows for the table of the twelve notes: the number, the key names, and the colour of the key. */
export function semitoneTableRows(): string[][] {
  return Array.from({ length: 12 }, (_, n) => [String(n), keyNames(n), LETTERS.some((l) => pitchClass(note(l)) === n) ? 'white' : 'black'])
}

interface Climb {
  readonly lower: Pitch
  readonly upper: Pitch
  readonly first: number
  readonly second: number
  /** Semitones going up from the first note to the next one with the second name. */
  readonly distance: number
  readonly wrapped: boolean
}

/** The first note and the next second note above it, with the distance by numbers, checked against real pitches. */
function climb(a: NoteName, b: NoteName): Climb {
  const first = pitchClass(a)
  const second = pitchClass(b)
  if (first === second) throw new RangeError('These two names are the same key, so there is nothing to count')
  const wrapped = second < first
  const distance = (wrapped ? second + 12 : second) - first
  const lower = pitch(a.letter, a.accidental, 4)
  let upper = pitch(b.letter, b.accidental, 4)
  while (midiNumber(upper) <= midiNumber(lower)) upper = pitch(b.letter, b.accidental, upper.octave + 1)
  if (midiNumber(upper) - midiNumber(lower) !== distance) throw new Error('Counting semitones disagrees with the MIDI numbers')
  return { lower, upper, first, second, distance, wrapped }
}

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`

/** "a semitone", "a tone", "a tone and a semitone", "2 tones", "3 tones and a semitone". */
export function toneWords(semitones: number): string {
  if (semitones < 1) throw new RangeError('Count at least one semitone')
  const tones = Math.floor(semitones / 2)
  const rest = semitones % 2
  if (tones === 0) return 'a semitone'
  const toneText = tones === 1 ? 'a tone' : plural(tones, 'tone')
  return rest ? `${toneText} and a semitone` : toneText
}

const SHARP_NAMES = ['C', 'C♯', 'D', 'D♯', 'E', 'F', 'F♯', 'G', 'G♯', 'A', 'A♯', 'B']
const FLAT_NAMES = ['C', 'D♭', 'D', 'E♭', 'E', 'F', 'G♭', 'G', 'A♭', 'A', 'B♭', 'B']

/* "Words you need" for the semitone builders. */
const SEMITONE_TERM: WorkedTerm = { term: 'Semitone', meaning: 'The smallest step in Western music: from one piano key to the very next key, black or white.' }
const TONE_TERM: WorkedTerm = { term: 'Tone', meaning: 'A step of two semitones, such as C up to D. There is one key between the two notes.' }
const OCTAVE_TERM: WorkedTerm = { term: 'Octave', meaning: 'The distance from a note to the next note with the same letter name, such as C up to the next C. It is 12 semitones.' }
const SHARP_TERM: WorkedTerm = { term: 'Sharp (♯)', meaning: 'A sign that raises a note by 1 semitone. C♯ is the key just above C.' }
const FLAT_TERM: WorkedTerm = { term: 'Flat (♭)', meaning: 'A sign that lowers a note by 1 semitone. D♭ is the key just below D.' }

/** The white keys with their numbers: "C 0, D 2, E 4, F 5, G 7, A 9, B 11". */
function whiteKeyNumbers(): string {
  return LETTERS.map((l) => `${l} ${pitchClass(note(l))}`).join(', ')
}

/** The number of a note worked out from its letter: "D♭ is 1 semitone below D, so its number is 2 − 1 = 1." */
function numberStep(n: NoteName, which: 'first' | 'second', staffPitches?: readonly Pitch[]): WorkedStep {
  const label = noteLabel(n)
  const white = pitchClass(note(n.letter))
  const raw = white + n.accidental
  const number = ((raw % 12) + 12) % 12
  if (number !== pitchClass(n)) throw new Error(`The number of ${label} disagrees with the theory engine`)
  let text: string
  if (n.accidental === 0) text = `${label} is a white key, number ${number}.`
  else {
    const up = n.accidental > 0
    const size = Math.abs(n.accidental)
    const how = `${label} is ${plural(size, 'semitone')} ${up ? 'above' : 'below'} ${n.letter} (a ${up ? 'sharp raises' : 'flat lowers'} a note by 1 semitone${size === 2 ? ', and a double sign by 2' : ''})`
    const sum = `${white} ${up ? '+' : '−'} ${size} = ${raw}`
    text = raw === number ? `${how}, so its number is ${sum}.` : `${how}: ${sum}, which is ${number} after going round past C.`
  }
  return { title: `Find the number of the ${which} note, ${label}`, text, result: `${label} = ${number}`, staff: staffPitches ? notesOnStaff('treble', staffPitches) : undefined }
}

/** The shared numbering steps for both semitone builders: number the keys, find both numbers, add 12 if needed, subtract. */
function numberSteps(a: NoteName, b: NoteName, c: Climb): WorkedStep[] {
  const from = noteLabel(a)
  const to = noteLabel(b)
  const steps: WorkedStep[] = [
    {
      title: 'Number the piano keys from C',
      text: 'Give each of the 12 keys in an octave (C up to the next C) a number, counting black and white keys, from C = 0. Most white keys are 2 apart, with a black key between. E to F and B to C have no black key between, so they are 1 apart.',
      result: whiteKeyNumbers(),
    },
    numberStep(a, 'first', [c.lower, c.upper]),
    numberStep(b, 'second'),
  ]
  if (c.wrapped) {
    steps.push({
      title: `Add 12 to the number of ${to}`,
      text: `${to} (${c.second}) is a smaller number than ${from} (${c.first}), because going up from ${from} you pass the next C. That C is an octave (12 semitones) above the C numbered 0, so it is number 12. Count ${to} as ${c.second} + 12 = ${c.second + 12}.`,
      result: `${to} counts as ${c.second + 12}`,
    })
  }
  const top = c.wrapped ? c.second + 12 : c.second
  steps.push({
    title: 'Subtract the first number from the second',
    text: `Each number is one key, so the difference is the number of semitones (one key to the very next): ${top} − ${c.first} = ${c.distance}.`,
    result: plural(c.distance, 'semitone'),
  })
  return steps
}

/** "1 C♯, 2 D, 3 D♯": the keys passed one at a time, not counting the starting key. Flat names when either note is a flat. */
function keyByKey(a: NoteName, b: NoteName, c: Climb): string {
  const names = a.accidental < 0 || b.accidental < 0 ? FLAT_NAMES : SHARP_NAMES
  const keys = Array.from({ length: c.distance }, (_, i) => (c.first + i + 1) % 12)
  if (keys.at(-1) !== c.second) throw new Error('Counting key by key did not end on the second note')
  return keys.map((k, i) => `${i + 1} ${i === keys.length - 1 ? noteLabel(b) : names[k]!}`).join(', ')
}

const signTerms = (a: NoteName, b: NoteName): WorkedTerm[] => [
  ...(a.accidental > 0 || b.accidental > 0 ? [SHARP_TERM] : []),
  ...(a.accidental < 0 || b.accidental < 0 ? [FLAT_TERM] : []),
]

/** "How many semitones from this note up to that one?" Counts by numbering the keys, then checks key by key. */
export function semitoneCountExample(a: NoteName, b: NoteName): WorkedExample {
  const c = climb(a, b)
  const from = noteLabel(a)
  const to = noteLabel(b)
  const tones = Math.floor(c.distance / 2)
  const left = c.distance % 2
  const toneText =
    c.distance === 1
      ? 'A tone is 2 semitones, so 1 semitone is less than a tone: it is just a semitone.'
      : `A tone is 2 semitones. ${c.distance} ÷ 2 = ${tones}${left ? ', with 1 left over' : ', with nothing left over'}. So ${plural(c.distance, 'semitone')} is ${toneWords(c.distance)}.`
  return {
    title: 'Count the semitones between two notes',
    task: `How many semitones are there going up from ${from} to ${to}?`,
    terms: [SEMITONE_TERM, TONE_TERM, OCTAVE_TERM, ...signTerms(a, b)],
    steps: [
      ...numberSteps(a, b, c),
      { title: 'Say it in tones and semitones', text: toneText, result: capitalFirst(toneWords(c.distance)) },
      {
        title: 'Check by counting key by key',
        text: `Start on ${from} and do not count it: a semitone is a move, and you have not moved yet. Count each key you move to, black or white, and stop on ${to}: ${keyByKey(a, b, c)}.`,
        result: `${plural(c.distance, 'key')}, so ${plural(c.distance, 'semitone')}`,
      },
    ],
    answer: `There ${c.distance === 1 ? 'is' : 'are'} ${plural(c.distance, 'semitone')} from ${from} up to ${to}.`,
  }
}

/** "Is the step from this note up to that one a tone or a semitone?" Only for steps of one or two semitones. */
export function toneOrSemitoneExample(a: NoteName, b: NoteName): WorkedExample {
  const c = climb(a, b)
  if (c.distance !== 1 && c.distance !== 2) throw new RangeError('A tone or a semitone: the notes must be 1 or 2 semitones apart')
  const from = noteLabel(a)
  const to = noteLabel(b)
  const answer = c.distance === 1 ? 'semitone' : 'tone'
  const between = keyNames((c.first + 1) % 12)
  return {
    title: 'Is it a tone or a semitone?',
    task: `Is the step from ${from} up to ${to} a tone or a semitone?`,
    terms: [SEMITONE_TERM, TONE_TERM, OCTAVE_TERM, ...signTerms(a, b)],
    steps: [
      ...numberSteps(a, b, c),
      {
        title: 'Name the step',
        text: `A step of 1 semitone is called a semitone. A step of 2 semitones is called a tone (two semitones together). This step is ${plural(c.distance, 'semitone')}, so it is a ${answer}.`,
        result: `A ${answer}`,
      },
      {
        title: 'Check on the keyboard',
        text:
          c.distance === 1
            ? `Look for a key between ${from} and ${to}. There is none: they are next-door keys, one semitone apart. So the step is a semitone.`
            : `Look for a key between ${from} and ${to}. There is one, ${between.replace('/', ' or ')}. So ${from} and ${to} are two keys apart, which is a tone.`,
        result: c.distance === 1 ? 'No key between: a semitone' : 'One key between: a tone',
      },
    ],
    answer: `It is a ${answer}.`,
  }
}

const capitalFirst = (text: string) => text.charAt(0).toUpperCase() + text.slice(1)
