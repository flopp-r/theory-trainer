import type { WorkedExample } from '../types'
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

/** "How many semitones from this note up to that one?" Counts key by key and by numbers. */
export function semitoneCountExample(a: NoteName, b: NoteName): WorkedExample {
  const c = climb(a, b)
  const from = noteLabel(a)
  const to = noteLabel(b)
  const keys = Array.from({ length: c.distance }, (_, i) => ({ count: i + 1, number: (c.first + i + 1) % 12 }))
  if (keys.at(-1)!.number !== c.second) throw new Error('Counting key by key did not end on the second note')

  return {
    title: 'Count the semitones between two notes',
    task: `How many semitones are there going up from ${from} to ${to}?`,
    steps: [
      { text: `Going **up** from ${from} to the next ${to} above it. Here are the two notes on the staff.`, staff: notesOnStaff('treble', [c.lower, c.upper]) },
      { text: `Look up the number of the first note in the table of twelve notes: ${from} is number **${c.first}**.` },
      { text: `Look up the number of the second note: ${to} is number **${c.second}**.` },
      c.wrapped
        ? {
            text: `${to} (${c.second}) is a smaller number than ${from} (${c.first}). That means going up we pass the next **C**, which is number 12, and start the numbers again. So count ${to} as ${c.second} + 12 = **${c.second + 12}**. Now subtract: ${c.second + 12} − ${c.first} = **${c.distance}**.`,
          }
        : { text: `Subtract the first number from the second: ${c.second} − ${c.first} = **${c.distance}**.` },
      {
        text: `Count it a second way, key by key, going up from ${from}. Do not count the key you start on, and stop on ${to}: ${keys.map((k) => `${k.count} ${keyNames(k.number)}`).join(', ')}. That is **${c.distance}** keys.`,
      },
      { text: `Check: counting key by key gives ${c.distance} and subtracting the numbers gives ${c.distance}. They agree.` },
      { text: `In tones and semitones: ${plural(c.distance, 'semitone')} is ${toneWords(c.distance)}, because a tone is 2 semitones.` },
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
  const between = c.distance - 1
  return {
    title: 'Is it a tone or a semitone?',
    task: `Is the step from ${from} up to ${to} a tone or a semitone?`,
    steps: [
      { text: `Going up from ${from} to ${to}. Here are the two notes.`, staff: notesOnStaff('treble', [c.lower, c.upper]) },
      { text: `Look up the numbers in the table of twelve notes: ${from} is **${c.first}** and ${to} is **${c.second}**${c.wrapped ? ` (which is ${c.second + 12} counting past the next C)` : ''}.` },
      { text: `Subtract: ${c.wrapped ? c.second + 12 : c.second} − ${c.first} = **${c.distance}** semitone${c.distance === 1 ? '' : 's'}.` },
      { text: `1 semitone is a **semitone**. 2 semitones is a **tone**. So this step is a **${answer}**.` },
      {
        text: `Check on the keyboard: ${between === 0 ? `there is **no key** between ${from} and ${to}, so they are next-door keys: a semitone` : `there is **one key** between ${from} and ${to} (${keyNames((c.first + 1) % 12)}), so they are two keys apart: a tone`}.`,
      },
    ],
    answer: `It is a ${answer}.`,
  }
}
