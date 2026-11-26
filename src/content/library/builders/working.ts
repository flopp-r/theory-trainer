import { type Letter, type NoteName, formatNote, letterAt, letterIndex, pitchClass } from '../../../theory'
import { noteLabel } from '../../../questions/pitchTools'

/**
 * Small pieces of long-hand working shared by the scale, key and interval builders.
 * Everything here is plain arithmetic on letter names and pitch classes (0 to 11, C = 0),
 * so that a builder can work an answer out by hand and then check it against the theory engine.
 */

export const mod12 = (n: number): number => ((n % 12) + 12) % 12

const ORDINALS = ['1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th']
export const ordinal = (n: number): string => ORDINALS[n - 1] ?? `${n}th`

export const semitones = (n: number): string => `${n} semitone${n === 1 ? '' : 's'}`

/** Semitones from each plain letter up to the next plain letter: the piano's pattern (E to F and B to C are one). */
export const SEMITONES_TO_NEXT_LETTER: Record<Letter, number> = { C: 2, D: 2, E: 1, F: 2, G: 2, A: 2, B: 1 }

/** The letters from `from`, one per step, counting `from` itself: lettersFromLetter('D', 3) is D E F. */
export function lettersUp(from: Letter, count: number): Letter[] {
  return Array.from({ length: count }, (_, i) => letterAt(letterIndex(from) + i))
}

/** The letters going down: lettersDown('F', 3) is F E D. */
export function lettersDown(from: Letter, count: number): Letter[] {
  return Array.from({ length: count }, (_, i) => letterAt(letterIndex(from) - i))
}

/** The note on `letter` that sounds at pitch class `target`. Throws if it would need more than a double sharp or flat. */
export function spellOnLetter(letter: Letter, target: number): NoteName {
  const natural = pitchClass({ letter, accidental: 0 })
  const accidental = mod12(target - natural + 6) - 6
  if (Math.abs(accidental) > 2) throw new Error(`${letter} cannot be spelled at pitch class ${target} with at most a double sharp or flat`)
  return { letter, accidental }
}

/** "a sharp", "a flat", "a double sharp", "a double flat", "no sign". */
export function signWords(accidental: number): string {
  switch (accidental) {
    case 0:
      return 'no sign'
    case 1:
      return 'a sharp'
    case -1:
      return 'a flat'
    case 2:
      return 'a double sharp'
    case -2:
      return 'a double flat'
    default:
      throw new RangeError(`No words for an accidental of ${accidental}`)
  }
}

/** "F♯ raised by a semitone is F♯♯ (a double sharp)", for any note. */
export function raiseSentence(n: NoteName): string {
  const result: NoteName = { letter: n.letter, accidental: n.accidental + 1 }
  const from = noteLabel(n)
  const to = noteLabel(result)
  switch (n.accidental) {
    case -2:
      return `${from} raised by a semitone is **${to}** (one of the two flats is cancelled).`
    case -1:
      return `${from} raised by a semitone is **${to}**: the flat is cancelled.`
    case 0:
      return `${from} raised by a semitone is **${to}**: add a sharp.`
    case 1:
      return `${from} raised by a semitone is **${to}**. That is a **double sharp**: the plain ${n.letter} raised by two semitones.`
    default:
      throw new RangeError('Cannot raise a double sharp')
  }
}

/** "G♯ lowered by a semitone is G: the sharp is cancelled." */
export function lowerSentence(n: NoteName): string {
  const result: NoteName = { letter: n.letter, accidental: n.accidental - 1 }
  const from = noteLabel(n)
  const to = noteLabel(result)
  switch (n.accidental) {
    case 2:
      return `${from} lowered by a semitone is **${to}**: one of the two sharps is cancelled.`
    case 1:
      return `${from} lowered by a semitone is **${to}**: the sharp is cancelled.`
    case 0:
      return `${from} lowered by a semitone is **${to}**: add a flat.`
    case -1:
      return `${from} lowered by a semitone is **${to}**. That is a **double flat**: the plain ${n.letter} lowered by two semitones.`
    default:
      throw new RangeError('Cannot lower a double flat')
  }
}

/** Semitones from one note up to the next (0 to 11). */
export const gapUp = (from: NoteName, to: NoteName): number => mod12(pitchClass(to) - pitchClass(from))

export type StepSize = 'tone' | 'semitone'
export const STEP_SEMITONES: Record<StepSize, number> = { tone: 2, semitone: 1 }

export const MAJOR_PATTERN: readonly StepSize[] = ['tone', 'tone', 'semitone', 'tone', 'tone', 'tone', 'semitone']
export const NATURAL_MINOR_PATTERN: readonly StepSize[] = ['tone', 'semitone', 'tone', 'tone', 'semitone', 'tone', 'tone']

export interface PatternStep {
  readonly index: number // 1 for the step from note 1 to note 2
  readonly previous: NoteName
  readonly note: NoteName
  readonly size: StepSize
  readonly wanted: number
  /** Semitones from the previous note up to the plain letter. */
  readonly gap: number
  readonly accidental: number
}

/**
 * Spell a seven-note scale one note at a time from a pattern of tones and semitones.
 * Each note uses the next letter name; the sign is whatever makes the step the right size.
 */
export function spellByPattern(tonic: NoteName, pattern: readonly StepSize[]): { notes: NoteName[]; steps: PatternStep[] } {
  const notes: NoteName[] = [tonic]
  const steps: PatternStep[] = []
  pattern.slice(0, 6).forEach((size, i) => {
    const previous = notes[i]!
    const letter = letterAt(letterIndex(tonic.letter) + i + 1)
    const gap = mod12(pitchClass({ letter, accidental: 0 }) - pitchClass(previous))
    const wanted = STEP_SEMITONES[size]
    const accidental = wanted - gap
    if (Math.abs(accidental) > 2) throw new Error('A scale step never needs more than a double sharp or flat')
    const note: NoteName = { letter, accidental }
    notes.push(note)
    steps.push({ index: i + 1, previous, note, size, wanted, gap, accidental })
  })
  return { notes, steps }
}

/** The step text used in the model lessons: what the pattern says, how far the plain letter is, and what sign is needed. */
export function patternStepText(s: PatternStep): string {
  const { note, previous, size, wanted, gap, accidental } = s
  const letter = note.letter
  const fix =
    accidental === 0
      ? `That is exactly what the pattern asks for, so the note is just **${letter}**.`
      : `The pattern asks for a ${size} (${semitones(wanted)}) but the plain ${letter} is ${gap === 0 ? 'the same sound' : `${semitones(gap)} away`}. So ${letter} needs **${signWords(accidental)}** (${accidental > 0 ? 'raised' : 'lowered'} by ${semitones(Math.abs(accidental))}): the note is **${noteLabel(note)}**.`
  return `**Note ${s.index + 1} (the ${ordinal(s.index + 1)}).** The pattern says: ${size}. From ${noteLabel(previous)} to the plain ${letter} is ${semitones(gap)}. ${fix}`
}

/**
 * A whole seven-note scale as seven steps in one line, for use when the scale is only the first stage of another job:
 * "a tone above D is E, a semitone above E is F, ...". Also names the sign when one is needed.
 */
export function patternInOneLine(tonic: NoteName, pattern: readonly StepSize[]): { notes: NoteName[]; text: string } {
  const { notes, steps } = spellByPattern(tonic, pattern)
  const clauses = steps.map((s) => {
    const sign = s.accidental === 0 ? '' : ` (the plain ${s.note.letter} needs ${signWords(s.accidental)} to make a ${s.size})`
    return `a ${s.size} above ${noteLabel(s.previous)} is **${noteLabel(s.note)}**${sign}`
  })
  return { notes, text: `${noteLabel(tonic)}, then ${clauses.join('; then ')}` }
}

/** Cross-check: throw if the long-hand notes are not exactly the engine's notes. */
export function assertSameNotes(what: string, longHand: readonly NoteName[], engine: readonly NoteName[]): void {
  const a = longHand.map((n) => formatNote(n)).join(' ')
  const b = engine.map((n) => formatNote(n)).join(' ')
  if (a !== b) throw new Error(`Worked example for ${what} disagrees with the theory engine: long-hand ${a}, engine ${b}`)
}

/** "tone, semitone, tone": the gaps between neighbouring notes, from semitone counts. */
export function gapsAsWords(gaps: readonly number[]): string {
  return gaps
    .map((g) => (g === 1 ? 'semitone' : g === 2 ? 'tone' : g === 3 ? 'one and a half tones (3 semitones)' : `${g} semitones`))
    .join(', ')
}

/** The gaps in semitones between neighbouring notes of a list (the list may include the top note). */
export function gapsBetween(notes: readonly NoteName[]): number[] {
  return notes.slice(1).map((n, i) => gapUp(notes[i]!, n))
}

/**
 * The note that is `number` letter names above (or below) `from`, counting `from` as 1, and `semis` semitones away.
 * A major 3rd above C is noteAt(C, 3, 4, 'up'): the letter is E (C D E) and E is 4 semitones up.
 */
export function noteAt(from: NoteName, number: number, semis: number, direction: 'up' | 'down'): NoteName {
  const sign = direction === 'up' ? 1 : -1
  return spellOnLetter(letterAt(letterIndex(from.letter) + sign * (number - 1)), mod12(pitchClass(from) + sign * semis))
}
