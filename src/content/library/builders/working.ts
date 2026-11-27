import type { WorkedStep, WorkedTerm } from '../types'
import { type Letter, type NoteName, formatNote, letterAt, letterIndex, pitchClass } from '../../../theory'
import { noteLabel } from '../../../questions/pitchTools'

/**
 * Small pieces of long-hand working shared by the scale, key and interval builders.
 * Everything here is arithmetic on letter names and pitch classes (0 to 11, C = 0),
 * so that a builder can work an answer out by hand and then check it against the theory engine.
 */

export const mod12 = (n: number): number => ((n % 12) + 12) % 12

const ORDINALS = ['1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th']
export const ordinal = (n: number): string => ORDINALS[n - 1] ?? `${n}th`

export const semitones = (n: number): string => `${n} semitone${n === 1 ? '' : 's'}`
export const stepsWord = (n: number): string => `${n} step${n === 1 ? '' : 's'}`

/** "a, b and c". */
export const joinAnd = (items: readonly string[]): string =>
  items.length <= 1 ? (items[0] ?? '') : `${items.slice(0, -1).join(', ')} and ${items.at(-1)}`

/** "a" or "an" for a word such as "augmented 4th" or "octave". */
export const article = (word: string): string => (/^[aeiou]/i.test(word) ? 'an' : 'a')

/** Semitones from each natural letter up to the next natural letter: the piano's pattern (E to F and B to C are one). */
export const SEMITONES_TO_NEXT_LETTER: Record<Letter, number> = { C: 2, D: 2, E: 1, F: 2, G: 2, A: 2, B: 1 }

/** Why a pair of neighbouring natural letters is 1 or 2 semitones apart. */
export const blackKeyReason = (size: number): string => (size === 1 ? 'there is no black key between them' : 'there is one black key between them')

/** The letters from `from`, one per step, counting `from` itself: lettersUp('D', 3) is D E F. */
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

/** Semitones from one note up to the next (0 to 11). */
export const gapUp = (from: NoteName, to: NoteName): number => mod12(pitchClass(to) - pitchClass(from))

export type StepSize = 'tone' | 'semitone'
export const STEP_SEMITONES: Record<StepSize, number> = { tone: 2, semitone: 1 }

export const MAJOR_PATTERN: readonly StepSize[] = ['tone', 'tone', 'semitone', 'tone', 'tone', 'tone', 'semitone']
export const NATURAL_MINOR_PATTERN: readonly StepSize[] = ['tone', 'semitone', 'tone', 'tone', 'semitone', 'tone', 'tone']

/**
 * Spell a seven-note scale one note at a time from a pattern of tones and semitones.
 * Each note uses the next letter name; the sign is whatever makes the step the right size.
 */
export function spellByPattern(tonic: NoteName, pattern: readonly StepSize[]): { notes: NoteName[] } {
  const notes: NoteName[] = [tonic]
  pattern.slice(0, 6).forEach((size, i) => {
    const previous = notes[i]!
    const letter = letterAt(letterIndex(tonic.letter) + i + 1)
    const gap = mod12(pitchClass({ letter, accidental: 0 }) - pitchClass(previous))
    const accidental = STEP_SEMITONES[size] - gap
    if (Math.abs(accidental) > 2) throw new Error('A scale step never needs more than a double sharp or flat')
    notes.push({ letter, accidental })
  })
  return { notes }
}

/** Cross-check: throw if the long-hand notes are not exactly the engine's notes. */
export function assertSameNotes(what: string, longHand: readonly NoteName[], engine: readonly NoteName[]): void {
  const a = longHand.map((n) => formatNote(n)).join(' ')
  const b = engine.map((n) => formatNote(n)).join(' ')
  if (a !== b) throw new Error(`Worked example for ${what} disagrees with the theory engine: long-hand ${a}, engine ${b}`)
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

// ---------------------------------------------------------------------------------------------------------------------
// Words you need
// ---------------------------------------------------------------------------------------------------------------------

export interface TermDef {
  /** The word as listed under "Words you need". */
  readonly term: string
  /** One plain sentence, at most 30 words. */
  readonly meaning: string
  /** The short reminder put in brackets the first time the word is used in the steps. */
  readonly reminder: string
}

/** Every musical word the scale, key and interval examples use, with its meaning and its short reminder. */
export const TERMS = {
  scale: { term: 'Scale', meaning: 'A set of notes in order of pitch, going up or down by step and using each letter name once.', reminder: 'notes in order, each letter name once' },
  tonic: { term: 'Key note (tonic)', meaning: 'The note a scale or key starts on and is named after. It is note 1 of the scale.', reminder: 'the note a key is named after' },
  semitone: { term: 'Semitone', meaning: 'The smallest step in Western music: from one piano key to the very next key, black or white.', reminder: 'the smallest step, from one piano key to the very next' },
  tone: { term: 'Tone', meaning: 'A step of two semitones, such as C up to D.', reminder: '2 semitones' },
  natural: { term: 'Natural', meaning: 'A note with no sharp or flat, such as E or B.', reminder: 'no sharp or flat' },
  sharp: { term: 'Sharp (♯)', meaning: 'A sign that raises a note by one semitone. F♯ is one semitone higher than F.', reminder: '♯ raises a note by 1 semitone' },
  flat: { term: 'Flat (♭)', meaning: 'A sign that lowers a note by one semitone. B♭ is one semitone lower than B.', reminder: '♭ lowers a note by 1 semitone' },
  doubleSharp: {
    term: 'Double sharp',
    meaning: 'A sign that raises a note by two semitones. It is usually printed as a small x; this app writes it ♯♯.',
    reminder: 'it raises a note by 2 semitones',
  },
  doubleFlat: { term: 'Double flat', meaning: 'A sign that lowers a note by two semitones. It is written ♭♭.', reminder: 'it lowers a note by 2 semitones' },
  octave: { term: 'Octave', meaning: 'The distance from a note to the next note with the same letter name: 8 letter names, or 12 semitones.', reminder: '8 letter names, 12 semitones' },
  majorScale: { term: 'Major scale', meaning: 'The scale whose steps go tone, tone, semitone, tone, tone, tone, semitone.', reminder: 'tone, tone, semitone, tone, tone, tone, semitone' },
  naturalMinor: {
    term: 'Natural minor scale',
    meaning: 'The basic minor scale. Its steps go tone, semitone, tone, tone, semitone, tone, tone.',
    reminder: 'the basic minor scale',
  },
  harmonicMinor: {
    term: 'Harmonic minor scale',
    meaning: 'The natural minor scale with its 7th note raised by a semitone, so that the 7th leads up to the key note.',
    reminder: 'natural minor with the 7th note raised',
  },
  melodicMinor: {
    term: 'Melodic minor scale',
    meaning: 'Going up: the natural minor scale with its 6th and 7th notes raised by a semitone. Coming down: the natural minor scale unchanged.',
    reminder: 'the 6th and 7th raised going up, nothing raised coming down',
  },
  leadingNote: {
    term: 'Leading note',
    meaning: 'A 7th note that is a semitone below the key note. It sounds as if it wants to rise, or "lead", to the key note.',
    reminder: 'a semitone below the key note',
  },
  subtonic: { term: 'Subtonic', meaning: 'The name for the 7th note when it is a tone below the key note, as in the natural minor scale.', reminder: 'a 7th note a tone below the key note' },
  scaleDegree: { term: 'Scale degree', meaning: "A note's position in the scale, counting the key note as 1. The 5th degree is the 5th note.", reminder: "a note's number in the scale" },
  supertonic: { term: 'Supertonic', meaning: 'The 2nd degree of a scale. "Super" means above: it is one step above the tonic.', reminder: 'degree 2' },
  mediant: { term: 'Mediant', meaning: 'The 3rd degree of a scale. It is halfway between the tonic (note 1) and the dominant (note 5).', reminder: 'degree 3' },
  subdominant: { term: 'Subdominant', meaning: 'The 4th degree of a scale. "Sub" means below: it is a perfect 5th below the tonic, as the dominant is a 5th above.', reminder: 'degree 4' },
  dominant: { term: 'Dominant', meaning: 'The 5th degree of a scale, a perfect 5th above the tonic. After the tonic it is the most important note.', reminder: 'degree 5' },
  submediant: { term: 'Submediant', meaning: 'The 6th degree of a scale. It is a 3rd below the tonic, as the mediant is a 3rd above.', reminder: 'degree 6' },
  pentatonic: { term: 'Pentatonic scale', meaning: 'A scale of five different notes. "Penta" means five.', reminder: 'a five-note scale' },
  bluesScale: { term: 'Blues scale', meaning: 'The minor pentatonic scale plus one extra note, the blue note, so it has six different notes.', reminder: 'minor pentatonic plus the blue note' },
  blueNote: { term: 'Blue note', meaning: 'The flattened 5th: note 5 of the scale lowered by a semitone. It keeps the letter name of note 5.', reminder: 'the flattened 5th' },
  enharmonic: { term: 'Enharmonic', meaning: 'Two names for the same piano key, such as F♯ and G♭. They sound the same but are spelled differently.', reminder: 'two names for the same piano key' },
  keySignature: {
    term: 'Key signature',
    meaning: 'The sharps or flats written straight after the clef. Each one applies to every note with that letter name, in every octave.',
    reminder: 'the sharps or flats written after the clef',
  },
  orderOfSharps: { term: 'Order of sharps', meaning: 'The fixed order sharps are added to a key signature: F C G D A E B.', reminder: 'the fixed order sharps are added' },
  orderOfFlats: { term: 'Order of flats', meaning: 'The fixed order flats are added to a key signature: B E A D G C F, the order of sharps backwards.', reminder: 'the fixed order flats are added' },
  relativeMinor: {
    term: 'Relative minor',
    meaning: 'The minor key that has the same notes and key signature as a major key. Its key note is 3 semitones lower.',
    reminder: '3 semitones lower, with the same key signature',
  },
  relativeMajor: {
    term: 'Relative major',
    meaning: 'The major key that has the same notes and key signature as a minor key. Its key note is 3 semitones higher.',
    reminder: '3 semitones higher, with the same key signature',
  },
  parallel: { term: 'Parallel keys', meaning: 'A major key and a minor key with the same key note, such as A major and A minor.', reminder: 'the same key note, the other mode' },
  closelyRelated: {
    term: 'Closely related keys',
    meaning: 'Keys whose key signatures differ by no more than one sharp or flat. Every key has five of them.',
    reminder: 'key signatures that differ by one sign at most',
  },
  circleOfFifths: {
    term: 'Circle of fifths',
    meaning: 'The keys in a ring, each a perfect 5th above the one before. Each step up adds a sharp or takes away a flat.',
    reminder: 'the keys in order, a perfect 5th apart',
  },
  perfectFifth: { term: 'Perfect 5th', meaning: 'An interval of 5 letter names (counting both notes) and 7 semitones, such as C up to G.', reminder: '5 letter names, 7 semitones' },
  interval: { term: 'Interval', meaning: 'The distance between two notes. Its name has a quality and a number, as in "major 3rd".', reminder: 'the distance between two notes' },
  number: {
    term: 'Number (of an interval)',
    meaning: 'How many letter names the interval spans, counting both notes. C up to E is C, D, E: a 3rd.',
    reminder: 'how many letter names, counting both notes',
  },
  quality: {
    term: 'Quality (of an interval)',
    meaning: 'The word before the number: major, minor, perfect, augmented or diminished. It comes from the number of semitones.',
    reminder: 'major, minor, perfect, augmented or diminished',
  },
  major: { term: 'Major (interval)', meaning: 'The larger of the two normal sizes of a 2nd, 3rd, 6th or 7th. A major 3rd is 4 semitones.', reminder: 'the larger normal size' },
  minor: { term: 'Minor (interval)', meaning: 'The smaller of the two normal sizes of a 2nd, 3rd, 6th or 7th: one semitone less than major.', reminder: 'one semitone less than major' },
  perfect: { term: 'Perfect (interval)', meaning: 'The one normal size of a 4th, 5th or octave: 5, 7 and 12 semitones.', reminder: 'the one normal size of a 4th, 5th or octave' },
  augmented: { term: 'Augmented', meaning: 'One semitone bigger than a major or perfect interval.', reminder: 'one semitone bigger than major or perfect' },
  diminished: { term: 'Diminished', meaning: 'One semitone smaller than a minor or perfect interval.', reminder: 'one semitone smaller than minor or perfect' },
  inversion: {
    term: 'Inversion (of an interval)',
    meaning: 'Turning an interval upside down: the lower note moves up an octave, so it becomes the upper note.',
    reminder: 'turning it upside down',
  },
} as const satisfies Record<string, TermDef>

export type TermId = keyof typeof TERMS

/**
 * The "Words you need" list of one worked example, built as the steps are written.
 * `say` gives the word with its short reminder in brackets the first time, and the plain word after that,
 * and every word said is added to the list, in the order it is first used.
 */
export class Words {
  private readonly used: TermId[] = []

  say(id: TermId, word: string): string {
    if (this.used.includes(id)) return word
    this.used.push(id)
    return `${word} (${TERMS[id].reminder})`
  }

  /** Add a word to the list without a reminder, because the text around it explains it. */
  add(id: TermId): void {
    if (!this.used.includes(id)) this.used.push(id)
  }

  /** The word as it is, added to the list without a reminder (the sentence it is in explains it). */
  named(id: TermId, word: string): string {
    this.add(id)
    return word
  }

  has(id: TermId): boolean {
    return this.used.includes(id)
  }

  terms(): WorkedTerm[] {
    return this.used.map((id) => ({ term: TERMS[id].term, meaning: TERMS[id].meaning }))
  }
}

/** The word and its term for a sign: "a sharp", "a double flat". Says the reminder the first time. */
export function signPhrase(accidental: number, w: Words): string {
  switch (accidental) {
    case 1:
      return w.say('sharp', 'a sharp')
    case 2:
      return w.say('doubleSharp', 'a double sharp')
    case -1:
      return w.say('flat', 'a flat')
    case -2:
      return w.say('doubleFlat', 'a double flat')
    default:
      throw new RangeError(`No sign phrase for ${accidental}`)
  }
}

// ---------------------------------------------------------------------------------------------------------------------
// Counting piano keys
// ---------------------------------------------------------------------------------------------------------------------

const SHARP_KEY_NAMES = ['C', 'C♯', 'D', 'D♯', 'E', 'F', 'F♯', 'G', 'G♯', 'A', 'A♯', 'B']
const FLAT_KEY_NAMES = ['C', 'D♭', 'D', 'E♭', 'E', 'F', 'G♭', 'G', 'A♭', 'A', 'B♭', 'B']

/** True when a list of notes reads better with flat names for the black keys. */
export const prefersFlats = (...notes: readonly NoteName[]): boolean => notes.some((n) => n.accidental < 0) || notes.every((n) => n.accidental === 0 && n.letter === 'F')

/**
 * The piano keys passed when counting `count` semitones up or down from `from`, one key at a time, ending on `to`.
 * The first and last names are the notes' own spellings. Throws if `to` is not `count` semitones away.
 */
export function keyWalk(from: NoteName, to: NoteName, count: number, direction: 'up' | 'down', flats: boolean): string[] {
  const sign = direction === 'up' ? 1 : -1
  if (mod12(pitchClass(from) + sign * count) !== pitchClass(to)) throw new Error(`${noteLabel(to)} is not ${count} semitones ${direction} from ${noteLabel(from)}`)
  const names = flats ? FLAT_KEY_NAMES : SHARP_KEY_NAMES
  const middle = Array.from({ length: Math.max(0, count - 1) }, (_, i) => names[mod12(pitchClass(from) + sign * (i + 1))]!)
  return count === 0 ? [noteLabel(from)] : [noteLabel(from), ...middle, noteLabel(to)]
}

/** "D, D♯, E, F, F♯: 4 steps, so 4 semitones" (the key you start on is not counted). */
export function keyWalkText(from: NoteName, to: NoteName, count: number, direction: 'up' | 'down', flats: boolean): string {
  if (count === 0) return `${keyWalk(from, to, 0, direction, flats)[0]} and ${noteLabel(to)} are the same piano key: 0 steps, so 0 semitones`
  return `${keyWalk(from, to, count, direction, flats).join(', ')}: ${stepsWord(count)}, so ${semitones(count)}`
}

// ---------------------------------------------------------------------------------------------------------------------
// Building a scale one gap at a time (the method of the Major scales lesson)
// ---------------------------------------------------------------------------------------------------------------------

export type ScaleKind = 'major' | 'natural minor'
export const patternOf = (kind: ScaleKind): readonly StepSize[] => (kind === 'major' ? MAJOR_PATTERN : NATURAL_MINOR_PATTERN)

/** Step: write the key note. */
export function keyNoteStep(tonic: NoteName, scaleName: string, w: Words): WorkedStep {
  const name = noteLabel(tonic)
  w.add('tonic')
  return {
    title: 'Write the key note',
    text: `The key note, or tonic, is the note a scale or key is named after. For ${scaleName} it is ${name}. It is note 1 of the scale.`,
    result: `Note 1: ${name}`,
  }
}

/** Step: write the letter names, for the whole scale (8 letters) or only as far as the note you need. */
export function letterNamesStep(tonic: NoteName, count: number, w: Words, why = ''): WorkedStep {
  const letters = lettersUp(tonic.letter, count)
  const fixed =
    count === 8
      ? `A ${w.say('scale', 'scale')} uses every letter name once, so the letters are now fixed. Only the sharps or flats are left to work out.`
      : `Each letter name is used once, so the letters are now fixed.`
  return {
    title: 'Write the letter names',
    text: `${why ? `${why} ` : ''}Write ${count} letter names in alphabetical order, starting on ${tonic.letter}. After G, go back to A. ${fixed}`,
    result: letters.join(' '),
  }
}

/** Step: write the pattern of tones and semitones (all seven gaps, or only the first few). */
export function patternStep(kind: ScaleKind, gaps: number, w: Words): WorkedStep {
  const pattern = patternOf(kind)
  // The step itself spells out the pattern, so the scale's name needs no reminder in brackets here.
  w.add(kind === 'major' ? 'majorScale' : 'naturalMinor')
  const scaleWord = `${kind} scale`
  const which =
    gaps === 7
      ? 'There is one step of the pattern for each of the seven gaps between your eight letters.'
      : `You need only the first ${gaps === 1 ? 'step' : `${gaps} steps`}: one for each gap between your ${gaps + 1} letters.`
  return {
    title: `Write the ${kind} pattern`,
    text: `Every ${scaleWord} climbs in the same pattern of ${w.say('semitone', 'semitones')} and ${w.say('tone', 'tones')}. ${which}`,
    result: gaps === 7 ? pattern.join(', ') : `${pattern.join(', ')} (use the first ${gaps})`,
  }
}

export interface GapWorking {
  readonly notes: NoteName[]
  readonly steps: WorkedStep[]
}

/**
 * One step per gap of the scale, exactly as in the Major scales lesson: how far the next letter is,
 * what the pattern asks for, and which sign (if any) fixes the difference. `gaps` is how many to work out (1 to 7);
 * the 7th gap leads back to the key note. The notes are checked against `spellByPattern` here,
 * and each builder checks them against the theory engine as well.
 */
export function scaleGapSteps(tonic: NoteName, kind: ScaleKind, gaps: number, w: Words): GapWorking {
  if (gaps < 1 || gaps > 7) throw new RangeError('A scale has 1 to 7 gaps')
  const pattern = patternOf(kind)
  const notes: NoteName[] = [tonic]
  const steps: WorkedStep[] = []
  for (let i = 1; i <= gaps; i++) {
    const previous = notes[i - 1]!
    const prev = noteLabel(previous)
    const letter = letterAt(letterIndex(tonic.letter) + i)
    const letterGap = SEMITONES_TO_NEXT_LETTER[previous.letter]
    const gap = letterGap - previous.accidental // a sharp on the lower note makes the gap smaller, a flat makes it bigger
    const size = pattern[i - 1]!
    const wanted = STEP_SEMITONES[size]
    const accidental = wanted - gap
    if (Math.abs(accidental) > 2) throw new Error('A scale never needs more than a double sharp or flat')
    const note: NoteName = { letter, accidental }
    notes.push(note)

    const count =
      previous.accidental === 0
        ? `From ${prev} up to ${letter} is ${semitones(letterGap)} (${blackKeyReason(letterGap)}).`
        : `From ${previous.letter} up to ${letter} is ${semitones(letterGap)}. Your note is ${prev}, which is ${semitones(Math.abs(previous.accidental))} ${previous.accidental > 0 ? 'higher' : 'lower'} than ${previous.letter}, so the gap is ${semitones(gap)}${gap === 0 ? ` (${prev} and ${letter} are the same piano key)` : ''}.`
    const ask = `The pattern asks for a ${size} (${semitones(wanted)}).`
    const fix =
      accidental === 0
        ? `They match, so ${letter} stays a ${w.say('natural', 'natural')}: **${letter}**.`
        : accidental > 0
          ? `The gap is ${semitones(accidental)} too small, so raise ${letter} with ${signPhrase(accidental, w)}: **${noteLabel(note)}**.`
          : `The gap is ${semitones(-accidental)} too big, so lower ${letter} with ${signPhrase(accidental, w)}: **${noteLabel(note)}**.`
    steps.push({
      title: `Gap ${i}: ${prev} up to ${letter}`,
      text: `${count} ${ask} ${fix}`,
      result: i === 7 ? `Note 8: ${noteLabel(note)}, the key note again` : `Note ${i + 1}: ${noteLabel(note)}`,
    })
  }
  if (gaps === 7 && (notes[7]!.letter !== tonic.letter || notes[7]!.accidental !== tonic.accidental)) {
    throw new Error(`The last gap of ${noteLabel(tonic)} ${kind} does not lead back to the key note`)
  }
  assertSameNotes(`${noteLabel(tonic)} ${kind} (gap by gap)`, notes.slice(0, Math.min(gaps + 1, 7)), spellByPattern(tonic, pattern).notes.slice(0, Math.min(gaps + 1, 7)))
  return { notes, steps }
}

/**
 * One note changed by a semitone, keeping its letter: "C raised by a semitone is C♯", with the reason for the sign.
 * Used for the raised 6th and 7th of the minor scales and the flattened 5th of the blues scale.
 */
export function semitoneChangeText(n: NoteName, by: 1 | -1, w: Words): { note: NoteName; text: string } {
  const note: NoteName = { letter: n.letter, accidental: n.accidental + by }
  const from = noteLabel(n)
  const to = noteLabel(note)
  let how: string
  if (by > 0) {
    if (n.accidental === -2) how = `take away one of its two flats: **${to}**`
    else if (n.accidental === -1) how = `cancel the flat, so ${from} becomes ${w.say('natural', 'natural')} **${to}**`
    else if (n.accidental === 0) how = `add ${signPhrase(1, w)}: **${to}**`
    else if (n.accidental === 1) how = `the sharp becomes ${signPhrase(2, w)}: **${to}**`
    else throw new RangeError('Cannot raise a double sharp')
  } else if (n.accidental === 2) how = `take away one of its two sharps: **${to}**`
  else if (n.accidental === 1) how = `cancel the sharp, so ${from} becomes ${w.say('natural', 'natural')} **${to}**`
  else if (n.accidental === 0) how = `add ${signPhrase(-1, w)}: **${to}**`
  else if (n.accidental === -1) how = `the flat becomes ${signPhrase(-2, w)}: **${to}**`
  else throw new RangeError('Cannot lower a double flat')
  return { note, text: `To ${by > 0 ? 'raise' : 'lower'} ${from} by a semitone and keep the letter ${n.letter}, ${how}.` }
}
