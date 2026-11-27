import type { AudioSpec } from '../../../audio/types'
import {
  type Chord,
  type ChordQuality,
  type ClefName,
  type Key,
  type Letter,
  type NoteName,
  type Pitch,
  chordNotes,
  chordPitches,
  formatNote,
  identifyChord,
  intervalBetween,
  intervalName,
  letterAt,
  letterIndex,
  midiNumber,
  note,
  pitch,
  pitchClass,
  sameNote,
  withoutOctave,
} from '../../../theory'
import { chordOnStaff, chordWords } from '../../../questions/chords'
import { fitsOnStaff, noteLabel, notesLabel } from '../../../questions/pitchTools'
import type { WorkedExample, WorkedStep, WorkedTerm } from '../types'
import { listenChord } from './audio'
import { chordsOnStaff } from './common'

/*
 * Worked examples for building and identifying triads and seventh chords, and the counting helpers
 * that the inversion, Roman numeral, cadence and ear training builders share.
 *
 * Two ways of counting semitones are used, so that every example can check itself by a different route:
 *  - by letters: count the semitones between natural letters (E to F and B to C are 1, the rest are 2),
 *    then allow for the sharps and flats;
 *  - by piano keys: walk up (or down) one key at a time and count the steps.
 * Every count is checked against pitch classes, and every example against the theory engine.
 * If anything disagrees, the builder throws, so a wrong example can never be shown.
 */

/** Semitones from each natural letter up to the next one. */
const WHITE_STEP: Record<Letter, number> = { C: 2, D: 2, E: 1, F: 2, G: 2, A: 2, B: 1 }

const mod = (n: number, m: number) => ((n % m) + m) % m

/** "1 semitone", "4 semitones". */
export const st = (n: number): string => `${n} semitone${n === 1 ? '' : 's'}`

export const capital = (text: string): string => text.charAt(0).toUpperCase() + text.slice(1)

/** "3rd", "5th", "7th". */
export function ordinal(n: number): string {
  const names: Record<number, string> = { 1: '1st', 2: '2nd', 3: '3rd' }
  return names[n] ?? `${n}th`
}

/** "E, F and G" */
export function andList(items: readonly string[]): string {
  if (items.length <= 1) return items.join('')
  return `${items.slice(0, -1).join(', ')} and ${items.at(-1)!}`
}

/** What a sharp or flat is called, for the working. */
export function signName(accidental: number): string {
  switch (accidental) {
    case 1:
      return 'a sharp (♯)'
    case 2:
      return 'a double sharp'
    case -1:
      return 'a flat (♭)'
    case -2:
      return 'a double flat (♭♭)'
    default:
      throw new RangeError(`No name for an accidental of ${accidental}`)
  }
}

/**
 * Remembers which explanations one worked example has already given, so that each reminder in brackets
 * appears the first time a word is used, and not again.
 */
export class Explained {
  private readonly seen = new Set<string>()
  /** `text` the first time `key` is asked for, and '' after that. */
  once(key: string, text: string): string {
    if (this.seen.has(key)) return ''
    this.seen.add(key)
    return text
  }
  has(key: string): boolean {
    return this.seen.has(key)
  }
}

/* ------------------------------------------------------------------------------------------------
 * Words you need
 * ---------------------------------------------------------------------------------------------- */

const term = (t: string, meaning: string): WorkedTerm => ({ term: t, meaning })

/** Musical words used by the chord, Roman numeral, cadence and ear training examples, each with a plain meaning. */
export const TERM = {
  chord: term('Chord', 'Three or more notes sounded together.'),
  triad: term('Triad', 'A chord of three notes stacked in 3rds: the root, the 3rd and the 5th.'),
  seventhChord: term('7th chord', 'A triad with one more note on top, a 7th above the root: four notes stacked in 3rds.'),
  root: term('Root', 'The note a chord is built on and named after. When the chord is stacked in 3rds, it is the lowest note.'),
  third: term('3rd', 'The chord note 3 letter names above the root, counting the root as 1. From C (C, D, E) the 3rd is a kind of E.'),
  fifth: term('5th', 'The chord note 5 letter names above the root, counting the root as 1. From C the 5th is a kind of G.'),
  seventh: term('7th', 'The chord note 7 letter names above the root, counting the root as 1. From C the 7th is a kind of B.'),
  stacked: term('Stacked in 3rds', 'Each note is a 3rd above the one below: skip one letter name and take the next, as in C, E, G.'),
  semitone: term('Semitone', 'The smallest step in Western music: from one piano key to the very next key, black or white.'),
  interval: term('Interval', 'The distance between two notes. Its number counts letter names (a 3rd, a 5th); its exact size is counted in semitones.'),
  octave: term('Octave', 'From a note to the next note up with the same letter name: 8 letter names, or 12 semitones.'),
  natural: term('Natural', 'A note with no sharp or flat, such as G or B.'),
  sharp: term('Sharp (♯)', 'A sign that raises a note by 1 semitone. F♯ is 1 semitone higher than F.'),
  flat: term('Flat (♭)', 'A sign that lowers a note by 1 semitone. B♭ is 1 semitone lower than B.'),
  doubleSharp: term('Double sharp (♯♯)', 'Raises a note by 2 semitones. F♯♯ is the same piano key as G.'),
  doubleFlat: term('Double flat (♭♭)', 'Lowers a note by 2 semitones. B♭♭ is the same piano key as A.'),
  rootPosition: term('Root position', 'A chord with its root as the lowest note.'),
  inversion: term('Inversion', 'A chord with a note other than the root as its lowest note. The notes and the chord name stay the same.'),
  firstInversion: term('First inversion', 'A chord with its 3rd as the lowest note.'),
  secondInversion: term('Second inversion', 'A chord with its 5th as the lowest note.'),
  thirdInversion: term('Third inversion', 'A 7th chord with its 7th as the lowest note. Only 7th chords have a third inversion.'),
  bass: term('Bass note', 'The lowest note of a chord as it is written or played.'),
  figuredBass: term('Figured bass', 'Numbers that show the intervals above the bass note, counted in letter names. They show which inversion a chord is in.'),
  symbol: term('Chord symbol', 'A short name for a chord in letters and numbers, such as Am7: the root, then an ending for the type.'),
  slash: term('Slash chord', 'A chord symbol with a slash, such as C/E. The note after the slash is the bass note.'),
  key: term('Key', 'The set of notes a piece mainly uses, named after its home note, such as G major.'),
  scale: term('Scale', 'The notes of a key in order of pitch, using each letter name once.'),
  keySignature: term('Key signature', 'The sharps or flats at the start of each line of music. They apply to every note with that letter name.'),
  naturalMinor: term('Natural minor scale', 'The minor scale that uses only the notes of the key signature, such as A B C D E F G in A minor.'),
  degree: term('Scale degree', "A note's number in the scale, counting the tonic as 1."),
  tonic: term('Tonic', 'Scale degree 1: the key note. The chord built on it is the home chord of the key.'),
  supertonic: term('Supertonic', 'Scale degree 2, one step above the tonic.'),
  mediant: term('Mediant', 'Scale degree 3, halfway from the tonic to the dominant.'),
  subdominant: term('Subdominant', 'Scale degree 4, and the chord built on it (IV, or iv in a minor key).'),
  dominant: term('Dominant', 'Scale degree 5, and the chord built on it (V). After the tonic it is the most important note of the key.'),
  submediant: term('Submediant', 'Scale degree 6, and the chord built on it (vi in a major key, VI in a minor key).'),
  leadingNote: term('Leading note', 'Scale degree 7 when it is 1 semitone below the tonic. A minor key raises its 7th note by a semitone to make one.'),
  subtonic: term('Subtonic', 'Scale degree 7 of the natural minor scale, a tone (2 semitones) below the tonic.'),
  roman: term('Roman numeral', "A chord's name by the scale degree of its root: I, II, III, IV, V, VI, VII. Capitals mean major, small letters minor."),
  primary: term('Primary chords', 'Chords I, IV and V (i, iv and V in a minor key): the chords on the tonic, subdominant and dominant.'),
  accidental: term('Accidental', 'A sharp, flat or natural sign written in front of a note, for a note the key signature does not give.'),
  naturalSign: term('Natural sign (♮)', 'A sign that cancels a sharp or flat for that note, so it is played as a natural.'),
  cadence: term('Cadence', 'The two chords at the end of a phrase, like the punctuation at the end of a sentence.'),
  phrase: term('Phrase', 'A musical sentence: a short passage that ends with a cadence.'),
  perfectCadence: term('Perfect cadence', 'Chord V (or V7) then chord I. It sounds finished, like a full stop.'),
  imperfectCadence: term('Imperfect cadence', 'A cadence that ends on chord V, usually after I, ii or IV. It sounds unfinished, like a comma.'),
  plagalCadence: term('Plagal cadence', 'Chord IV then chord I. It sounds gentle, like the "Amen" at the end of a hymn.'),
  interruptedCadence: term('Interrupted cadence', 'Chord V (or V7) then chord vi (VI in a minor key) instead of the expected I. It sounds like a surprise.'),
  bassLine: term('Bass line', 'The lowest notes of the music, one after another.'),
} as const

/** Hand-written meanings for the interval names the examples use. */
const INTERVAL_MEANING: Record<string, string> = {
  'minor 2nd': 'A 2nd that spans 1 semitone, such as E up to F.',
  'major 2nd': 'A 2nd that spans 2 semitones (a tone), such as C up to D.',
  'minor 3rd': 'A 3rd that spans 3 semitones, such as A up to C.',
  'major 3rd': 'A 3rd that spans 4 semitones, such as C up to E.',
  'perfect 4th': 'A 4th that spans 5 semitones, such as C up to F.',
  'augmented 4th': 'A 4th that spans 6 semitones, such as F up to B.',
  'diminished 5th': 'A 5th that spans 6 semitones, 1 fewer than a perfect 5th, such as B up to F.',
  'perfect 5th': 'A 5th that spans 7 semitones, such as C up to G.',
  'augmented 5th': 'A 5th that spans 8 semitones, 1 more than a perfect 5th, such as C up to G♯.',
  'minor 6th': 'A 6th that spans 8 semitones, such as E up to C.',
  'major 6th': 'A 6th that spans 9 semitones, such as C up to A.',
  'diminished 7th': 'A 7th that spans 9 semitones, 3 fewer than an octave, such as C up to B♭♭.',
  'minor 7th': 'A 7th that spans 10 semitones, 2 fewer than an octave, such as C up to B♭.',
  'major 7th': 'A 7th that spans 11 semitones, 1 fewer than an octave, such as C up to B.',
  octave: 'From a note to the next note up with the same letter name: 8 letter names, or 12 semitones.',
}

/** The Words you need entry for an interval name such as "major 3rd". */
export function intervalTerm(name: string): WorkedTerm {
  const meaning = INTERVAL_MEANING[name]
  if (!meaning) throw new Error(`No meaning written for the interval "${name}"`)
  return term(name === 'octave' ? 'Octave' : capital(name), meaning)
}

const TRIAD_TYPE_MEANING: Record<TriadQuality, string> = {
  major: 'A triad with a major 3rd at the bottom and a minor 3rd on top: 4 then 3 semitones.',
  minor: 'A triad with a minor 3rd at the bottom and a major 3rd on top: 3 then 4 semitones.',
  diminished: 'A triad made of two minor 3rds: 3 then 3 semitones.',
  augmented: 'A triad made of two major 3rds: 4 then 4 semitones.',
}

const SEVENTH_TYPE_MEANING: Record<SeventhQuality, string> = {
  dominant7: 'A major triad with a minor 7th on top. It is the 7th chord found on the dominant (scale degree 5) of a major key.',
  major7: 'A major triad with a major 7th on top.',
  minor7: 'A minor triad with a minor 7th on top.',
  'half-diminished7': 'A diminished triad with a minor 7th on top.',
  diminished7: 'A diminished triad with a diminished 7th on top: every note is a minor 3rd above the one below.',
}

/** "Major triad" or "Dominant 7th chord", with its meaning. */
export function chordTypeTerm(quality: ChordQuality): WorkedTerm {
  if (isTriadQuality(quality)) return term(`${capital(quality)} triad`, TRIAD_TYPE_MEANING[quality])
  if (isSeventhQuality(quality)) return term(`${capital(SEVENTH_NAME[quality])} chord`, SEVENTH_TYPE_MEANING[quality])
  throw new Error(`No term for ${quality}`)
}

/** The Words you need entries for the signs on some notes. */
export function signTerms(notes: readonly NoteName[]): WorkedTerm[] {
  const out: WorkedTerm[] = []
  const has = (a: number) => notes.some((n) => n.accidental === a)
  if (has(0)) out.push(TERM.natural)
  if (has(1)) out.push(TERM.sharp)
  if (has(-1)) out.push(TERM.flat)
  if (has(2)) out.push(TERM.doubleSharp)
  if (has(-2)) out.push(TERM.doubleFlat)
  return out
}

const searchable = (text: string) => text.replace(/\*\*?/g, '').toLowerCase()

/**
 * Finish an example: keep only the terms the working really uses (the same test as workedStyle.test.ts),
 * without repeats, so a builder reads well whatever input it is given.
 */
export function finish(example: WorkedExample): WorkedExample {
  const everything = searchable([example.task, example.answer, ...example.steps.flatMap((s) => [s.title ?? '', s.text, s.result ?? ''])].join(' '))
  const seen = new Set<string>()
  const terms = (example.terms ?? []).filter((t) => {
    const name = searchable(t.term).replace(/\s*\(.*\)\s*/g, '').trim()
    if (seen.has(t.term) || !everything.includes(name)) return false
    seen.add(t.term)
    return true
  })
  return {
    ...example,
    task: articles(example.task),
    answer: articles(example.answer),
    steps: example.steps.map((s) => ({ ...s, title: s.title && articles(s.title), text: articles(s.text), result: s.result && articles(s.result) })),
    terms,
  }
}

/**
 * "a augmented 5th" becomes "an augmented 5th". Only a lower-case "a" is changed: a capital A may be a note name
 * ("A augmented"), so sentences that start with an article use `article()` instead.
 */
function articles(text: string): string {
  return text.replace(/\ba (?=[aeiou])/g, 'an ')
}

/** "B♭" or, for a natural reached by cancelling a sign, "B natural (B♮)". */
export const spokenNote = (n: NoteName): string => (n.accidental === 0 ? `${n.letter} natural (${n.letter}♮)` : noteLabel(n))

/** The table of triad or 7th chord counts the first time, and a short reminder after that. */
export function countsTable(size: number, ex: Explained): string {
  return size === 3
    ? ex.once('triad-table', `Each triad type has its own counts from the root. ${TRIAD_TABLE_TEXT}`)
    : ex.once('seventh-table', `Each 7th chord type has its own counts from the root. ${SEVENTH_TABLE_TEXT}`)
}

/** "Each triad type has ... Yours are 4 and 7." the first time; "Yours are 4 and 7: the counts of a major triad." after. */
export function countsText(size: number, counts: readonly number[], quality: ChordQuality, ex: Explained): string {
  const table = countsTable(size, ex)
  return table ? `${table} Yours are ${andList(counts.map(String))}.` : `Yours are ${andList(counts.map(String))}: the counts of a ${qualityPhrase(quality)}.`
}

/** "A" or "An", for the start of a sentence. */
export const article = (word: string): string => (/^[aeiou]/i.test(word) ? `An ${word}` : `A ${word}`)

/* ------------------------------------------------------------------------------------------------
 * Counting
 * ---------------------------------------------------------------------------------------------- */

/** Hand-written interval names, by number of letter names and semitones. */
const INTERVAL_NAME: Record<string, string> = {
  '2:1': 'minor 2nd',
  '2:2': 'major 2nd',
  '3:3': 'minor 3rd',
  '3:4': 'major 3rd',
  '4:5': 'perfect 4th',
  '4:6': 'augmented 4th',
  '5:6': 'diminished 5th',
  '5:7': 'perfect 5th',
  '5:8': 'augmented 5th',
  '6:8': 'minor 6th',
  '6:9': 'major 6th',
  '7:9': 'diminished 7th',
  '7:10': 'minor 7th',
  '7:11': 'major 7th',
}

/** The letter-name number of the interval from one note up to another: 3 for a 3rd. */
export const letterNumber = (from: NoteName, to: NoteName): number => mod(letterIndex(to.letter) - letterIndex(from.letter), 7) + 1

/**
 * The name of the interval from `from` up to `to` ("major 3rd"), from the hand-written table,
 * checked against the theory engine.
 */
export function intervalWords(from: NoteName, to: NoteName, semis: number): string {
  const number = letterNumber(from, to)
  const name = INTERVAL_NAME[`${number}:${semis}`]
  if (!name) throw new Error(`No name for a ${ordinal(number)} of ${st(semis)}`)
  const low = pitch(from.letter, from.accidental, 4)
  const high = pitch(to.letter, to.accidental, letterIndex(to.letter) > letterIndex(from.letter) ? 4 : 5)
  const engine = intervalName(intervalBetween(low, high).interval)
  if (engine !== name) throw new Error(`Interval ${formatNote(from)} to ${formatNote(to)}: table says ${name}, engine says ${engine}`)
  return name
}

export interface SemitoneWorking {
  /** Semitones from the lower note up to the upper note. */
  readonly total: number
  /** The working, in sentences. */
  readonly text: string
  /** Semitones between the natural letters. */
  readonly natural: number
  /** The first part of the working: the natural letters with a running total. */
  readonly lettersText: string
  /** The second part: allowing for the signs ('' if neither note has one). */
  readonly signText: string
}

/**
 * Counts the semitones from `from` up to the next `to` above it, by letters:
 * first between the natural letters (E to F and B to C are 1, the rest are 2), with a running total,
 * then allowing for the signs on the two notes. Checked against pitch classes; throws if they disagree.
 */
export function semitoneWorking(from: NoteName, to: NoteName, ex: Explained = new Explained()): SemitoneWorking {
  const steps = mod(letterIndex(to.letter) - letterIndex(from.letter), 7)
  const pairs: string[] = []
  const totals: number[] = []
  let natural = 0
  for (let i = 0; i < steps; i++) {
    const letter = letterAt(letterIndex(from.letter) + i)
    const next = letterAt(letterIndex(from.letter) + i + 1)
    const size = WHITE_STEP[letter]
    natural += size
    totals.push(natural)
    const why = size === 1 ? ex.once('gap1', ' (no black key between them)') : ex.once('gap2', ' (one black key between them)')
    pairs.push(`${letter} to ${next} is ${i === 0 ? st(size) : size}${why}`)
  }
  const signed = from.accidental !== 0 || to.accidental !== 0
  let lettersText =
    steps === 0
      ? `Both notes use the letter ${from.letter}, so the letters are 0 semitones apart.`
      : `${signed ? 'Start with the letters' : 'One letter at a time'}: ${pairs.join(', ')}.`
  if (steps >= 2) lettersText += ` Running total: ${totals.join(', ')}.`
  let signText = ''
  let running = natural
  const adjust = (n: NoteName, isLower: boolean) => {
    if (n.accidental === 0) return
    const size = Math.abs(n.accidental)
    // A raised lower note, or a lowered upper note, brings the two notes closer together.
    const smaller = isLower ? n.accidental > 0 : n.accidental < 0
    const after = smaller ? running - size : running + size
    signText += ` ${noteLabel(n)} is ${st(size)} ${n.accidental > 0 ? 'higher' : 'lower'} than ${n.letter}, so the gap is ${size} ${smaller ? 'smaller' : 'bigger'}: ${running} ${smaller ? '−' : '+'} ${size} = ${after}.`
    running = after
  }
  adjust(from, true)
  adjust(to, false)
  const total = running
  if (total < 0 || total > 12 || mod(total, 12) !== mod(pitchClass(to) - pitchClass(from), 12)) {
    throw new Error(`Semitone count from ${formatNote(from)} to ${formatNote(to)} disagrees with pitch classes`)
  }
  return { total, natural, lettersText, signText: signText.trim(), text: `${lettersText}${signText}` }
}

const wordCount = (text: string) => text.replace(/\*\*?/g, '').trim().split(/\s+/).filter(Boolean).length

/** Longest step text before a count is split into two steps (letters, then signs). */
const SPLIT_AT = 50

/** "the flat on E♭", "the sharps on F♯ and C♯". */
function signsOn(notes: readonly NoteName[]): string {
  const signed = notes.filter((n) => n.accidental !== 0)
  const kinds = new Set(signed.map((n) => (n.accidental > 0 ? 'sharp' : 'flat')))
  const word = kinds.size === 1 ? [...kinds][0]! : 'sign'
  return `the ${word}${signed.length > 1 ? 's' : ''} on ${andList(signed.map(noteLabel))}`
}

/**
 * The steps for one count by letters: one step, or two (letters, then signs) when one would be too long to read.
 * `result` is the result of the last step.
 */
function countingSteps(from: NoteName, to: NoteName, w: SemitoneWorking, title: string, result: string): WorkedStep[] {
  if (w.signText === '' || wordCount(w.text) <= SPLIT_AT) return [{ title, text: w.text, result }]
  const naturalFrom = note(from.letter, 0)
  const naturalTo = note(to.letter, 0)
  return [
    { title, text: w.lettersText, result: `${noteLabel(naturalFrom)} up to ${noteLabel(naturalTo)}: ${st(w.natural)}` },
    { title: `Allow for ${signsOn([from, to])}`, text: w.signText, result },
  ]
}

/** Names for the piano keys, for counting one key at a time. */
const SHARP_KEYS = ['C', 'C♯', 'D', 'D♯', 'E', 'F', 'F♯', 'G', 'G♯', 'A', 'A♯', 'B']
const FLAT_KEYS = ['C', 'D♭', 'D', 'E♭', 'E', 'F', 'G♭', 'G', 'A♭', 'A', 'B♭', 'B']

/** Use flat names for the black keys when the notes are spelled with flats. */
export const prefersFlats = (notes: readonly NoteName[]): boolean => notes.some((n) => n.accidental < 0)

/** " E♯ is the same piano key as F." for spellings that are not the usual name of a key. */
function sameKeyNotes(notes: readonly NoteName[]): string {
  const odd = notes.filter((n, i) => notes.findIndex((m) => sameNote(m, n)) === i && SHARP_KEYS[pitchClass(n)] !== noteLabel(n) && FLAT_KEYS[pitchClass(n)] !== noteLabel(n))
  return odd.map((n) => ` ${noteLabel(n)} is the same piano key as ${SHARP_KEYS[pitchClass(n)] === FLAT_KEYS[pitchClass(n)] ? SHARP_KEYS[pitchClass(n)] : `${SHARP_KEYS[pitchClass(n)]} or ${FLAT_KEYS[pitchClass(n)]}`}.`).join('')
}

export interface Walk {
  readonly steps: number
  /** "E♭, E, F, G♭, G: 4 steps" (with a reminder the first time). */
  readonly text: string
  /** Sentences for any note spelled unusually, such as " E♯ is the same piano key as F.", or ''. */
  readonly note: string
}

/**
 * Walk up (or down) one piano key at a time from `from` to `to`, naming every key, and count the steps.
 * This is a different route from counting by letters, so it is used for the checks.
 */
export function pianoWalk(from: NoteName, to: NoteName, ex: Explained, direction: 'up' | 'down' = 'up', flats?: boolean): Walk {
  const sign = direction === 'up' ? 1 : -1
  const steps = mod(sign * (pitchClass(to) - pitchClass(from)), 12)
  if (steps === 0) throw new Error('A walk needs two different piano keys')
  const names = (flats ?? prefersFlats([from, to])) ? FLAT_KEYS : SHARP_KEYS
  const keys = [noteLabel(from), ...Array.from({ length: steps - 1 }, (_, i) => names[mod(pitchClass(from) + sign * (i + 1), 12)]!), noteLabel(to)]
  const reminder = ex.once('walk', ' (count the steps, not the first key)')
  return { steps, text: `${keys.join(', ')}: ${steps} step${steps === 1 ? '' : 's'}${reminder}`, note: sameKeyNotes([from, to]) }
}

/** The steps that count by letters from one note up to another and name the interval. */
export function countStep(from: NoteName, to: NoteName, ex: Explained, title?: string): { steps: WorkedStep[]; total: number; name: string } {
  const w = semitoneWorking(from, to, ex)
  const name = intervalWords(from, to, w.total)
  return {
    total: w.total,
    name,
    steps: countingSteps(from, to, w, title ?? `Count from ${noteLabel(from)} up to ${noteLabel(to)}`, `${noteLabel(from)} up to ${noteLabel(to)}: ${st(w.total)}, a ${name}`),
  }
}

/* ------------------------------------------------------------------------------------------------
 * Recipes
 * ---------------------------------------------------------------------------------------------- */

/** Hand-written recipes: the semitones from the root to the 3rd, 5th (and 7th). Not taken from the engine. */
export const TRIAD_RECIPE = {
  major: { third: 4, fifth: 7, lower: 'major 3rd', upper: 'minor 3rd', fifthName: 'perfect 5th', lowerSemis: 4, upperSemis: 3 },
  minor: { third: 3, fifth: 7, lower: 'minor 3rd', upper: 'major 3rd', fifthName: 'perfect 5th', lowerSemis: 3, upperSemis: 4 },
  diminished: { third: 3, fifth: 6, lower: 'minor 3rd', upper: 'minor 3rd', fifthName: 'diminished 5th', lowerSemis: 3, upperSemis: 3 },
  augmented: { third: 4, fifth: 8, lower: 'major 3rd', upper: 'major 3rd', fifthName: 'augmented 5th', lowerSemis: 4, upperSemis: 4 },
} as const
export type TriadQuality = keyof typeof TRIAD_RECIPE

export const SEVENTH_RECIPE = {
  dominant7: { third: 4, fifth: 7, seventh: 10, triad: 'major', seventhName: 'minor 7th' },
  major7: { third: 4, fifth: 7, seventh: 11, triad: 'major', seventhName: 'major 7th' },
  minor7: { third: 3, fifth: 7, seventh: 10, triad: 'minor', seventhName: 'minor 7th' },
  'half-diminished7': { third: 3, fifth: 6, seventh: 10, triad: 'diminished', seventhName: 'minor 7th' },
  diminished7: { third: 3, fifth: 6, seventh: 9, triad: 'diminished', seventhName: 'diminished 7th' },
} as const
export type SeventhQuality = keyof typeof SEVENTH_RECIPE

/** The names used in the app for the five seventh chords. */
export const SEVENTH_NAME: Record<SeventhQuality, string> = {
  dominant7: 'dominant 7th',
  major7: 'major 7th',
  minor7: 'minor 7th',
  'half-diminished7': 'half-diminished 7th',
  diminished7: 'diminished 7th',
}

export const isTriadQuality = (q: ChordQuality): q is TriadQuality => q in TRIAD_RECIPE
export const isSeventhQuality = (q: ChordQuality): q is SeventhQuality => q in SEVENTH_RECIPE

/** "major triad" or "dominant 7th chord". */
export function qualityPhrase(quality: ChordQuality): string {
  if (isTriadQuality(quality)) return `${quality} triad`
  if (isSeventhQuality(quality)) return `${SEVENTH_NAME[quality]} chord`
  throw new Error(`No words for ${quality}`)
}

/** The semitones from the root to each upper note, from the hand-written recipes. */
export function recipeCounts(quality: ChordQuality): number[] {
  if (isTriadQuality(quality)) return [TRIAD_RECIPE[quality].third, TRIAD_RECIPE[quality].fifth]
  if (isSeventhQuality(quality)) return [SEVENTH_RECIPE[quality].third, SEVENTH_RECIPE[quality].fifth, SEVENTH_RECIPE[quality].seventh]
  throw new Error(`No recipe for ${quality}`)
}

/** The chord type that has these semitone distances from its root, or null. Hand-written table. */
export function qualityFromSemitones(counts: readonly number[]): ChordQuality | null {
  const key = counts.join(',')
  const table: Record<string, ChordQuality> = {
    '4,7': 'major',
    '3,7': 'minor',
    '3,6': 'diminished',
    '4,8': 'augmented',
    '4,7,10': 'dominant7',
    '4,7,11': 'major7',
    '3,7,10': 'minor7',
    '3,6,10': 'half-diminished7',
    '3,6,9': 'diminished7',
  }
  return table[key] ?? null
}

export const TRIAD_TABLE_TEXT = 'Major is 4 and 7. Minor is 3 and 7. Diminished is 3 and 6. Augmented is 4 and 8.'
export const SEVENTH_TABLE_TEXT = 'Dominant 7th: 4, 7, 10. Major 7th: 4, 7, 11. Minor 7th: 3, 7, 10. Half-diminished 7th: 3, 6, 10. Diminished 7th: 3, 6, 9.'

/** Throws unless the long-hand notes are exactly what the engine says. */
export function assertSameNotes(label: string, longHand: readonly NoteName[], engine: readonly NoteName[]): void {
  if (longHand.length !== engine.length || engine.some((n, i) => !sameNote(n, longHand[i]!))) {
    throw new Error(`${label}: working gives ${notesLabel(longHand)} but the theory engine gives ${notesLabel(engine)}`)
  }
}

/* ------------------------------------------------------------------------------------------------
 * Steps shared by the builders
 * ---------------------------------------------------------------------------------------------- */

const ROLE_NUMBER = { '3rd': 3, '5th': 5, '7th': 7 } as const
export type Role = keyof typeof ROLE_NUMBER
export const ROLES: readonly Role[] = ['3rd', '5th', '7th']

/** Words for raising or lowering a letter, with the reminder in brackets the first time. */
function fixWords(letter: Letter, accidental: number, ex: Explained): string {
  switch (accidental) {
    case 1:
      return `raise ${letter} with a sharp${ex.once('sharp', ' (♯ raises a note by 1 semitone)')}`
    case 2:
      return `raise ${letter} with a double sharp${ex.once('double-sharp', ' (♯♯ raises a note by 2 semitones)')}`
    case -1:
      return `lower ${letter} with a flat${ex.once('flat', ' (♭ lowers a note by 1 semitone)')}`
    case -2:
      return `lower ${letter} with a double flat${ex.once('double-flat', ' (♭♭ lowers a note by 2 semitones)')}`
    default:
      throw new RangeError(`A chord note never needs an accidental of ${accidental}`)
  }
}

/**
 * Finds one note of a chord the long way, as two steps:
 * count by letters from the root up to the natural letter, then add the sign that makes the count match the recipe.
 */
export function spellNoteSteps(root: NoteName, role: Role, wanted: number, ex: Explained): { note: NoteName; steps: WorkedStep[] } {
  const number = ROLE_NUMBER[role]
  const letter = letterAt(letterIndex(root.letter) + number - 1)
  const count = semitoneWorking(root, note(letter, 0), ex)
  const accidental = mod(wanted - count.total + 6, 12) - 6
  if (Math.abs(accidental) > 2) throw new Error('A chord note never needs more than a double sharp or flat here')
  const result = note(letter, accidental)
  const label = noteLabel(result)
  const target = intervalWords(root, result, wanted)
  const size = Math.abs(accidental)
  let fix: string
  if (accidental === 0) {
    fix = `They match, so ${letter} stays a natural${ex.once('natural', ' (no sharp or flat)')}: **${label}**.`
  } else {
    const unusual = size === 2 || SHARP_KEYS[pitchClass(result)] !== label && FLAT_KEYS[pitchClass(result)] !== label
    const keep = unusual ? ` Keep the letter ${letter}: the ${role} must be ${number} letter names above the root.` : ''
    fix = `That is ${size} too ${accidental > 0 ? 'few' : 'many'}, so ${fixWords(letter, accidental, ex)}: **${label}**.${keep}`
  }
  return {
    note: result,
    steps: [
      ...countingSteps(root, note(letter, 0), count, `Count from ${noteLabel(root)} up to ${letter}`, `${noteLabel(root)} up to ${letter}: ${st(count.total)}`),
      {
        title: `Make the ${role} a ${target}`,
        text: `${article(target)} is ${st(wanted)} above the root. You counted ${count.total}. ${fix}`,
        result: `${role}: ${label}`,
      },
    ],
  }
}

/** The root step of a build example. */
function rootStep(root: NoteName, ex: Explained): WorkedStep {
  return {
    title: 'Write the root',
    text: `The root${ex.once('root', ' (the note the chord is built on and named after)')} is ${noteLabel(root)}. It is the lowest note when the chord is stacked in 3rds.`,
    result: `Root: ${noteLabel(root)}`,
  }
}

/** The letter step of a build example: skip one letter each time. */
export function letterStep(root: NoteName, count: number, ex: Explained): { letters: Letter[]; step: WorkedStep } {
  const letters = Array.from({ length: count }, (_, i) => letterAt(letterIndex(root.letter) + 2 * i))
  const skips = letters
    .slice(1)
    .map((l, i) => `from ${letters[i]!}, skip ${letterAt(letterIndex(letters[i]!) + 1)} and take ${l}`)
    .join('; ')
  return {
    letters,
    step: {
      title: 'Write the letter names',
      text: `A ${count === 3 ? 'triad' : '7th chord'} is stacked in 3rds${ex.once('stacked', ' (each note is a 3rd above the one below)')}, so skip one letter name and take the next: ${skips}. Sharps and flats come later.`,
      result: `Letters: ${letters.join(', ')}`,
    },
  }
}

/**
 * The step that lists the notes as written on a staff, with the picture and the sound.
 */
export function nameNotesStep(pitches: readonly Pitch[], clef: ClefName, label = 'Hear this chord', key?: Key): WorkedStep {
  const names = pitches.map((p) => noteLabel(withoutOctave(p)))
  return {
    title: 'Name the notes from the bottom up',
    text: 'Use the clef to name each note. Keep any sharp or flat written in front of a note, or given by a key signature.',
    result: names.join(', '),
    staff: chordsOnStaff(clef, [[...pitches]], key),
    listen: listenChord(label, pitches),
  }
}

/** Throws unless each letter is two letters above the one before (stacked in thirds from the bottom). */
function assertStackedInThirds(notes: readonly NoteName[]): void {
  for (let i = 1; i < notes.length; i++) {
    if (mod(letterIndex(notes[i]!.letter) - letterIndex(notes[i - 1]!.letter), 7) !== 2) {
      throw new Error('These notes are not stacked in thirds from the bottom, so this is not a root-position chord')
    }
  }
}

/** The step that checks the letters skip one each time, so the lowest note is the root. */
export function stackedStep(notes: readonly NoteName[], ex: Explained): WorkedStep {
  const bits = notes.slice(1).map((n, i) => `${notes[i]!.letter} to ${n.letter} skips ${letterAt(letterIndex(notes[i]!.letter) + 1)}`)
  return {
    title: 'Check the notes are stacked in 3rds',
    text: `${capital(bits.join('; '))}. Each note is a 3rd above the one below, so the chord is in root position${ex.once('root-position', ' (root at the bottom)')}: the lowest note is the root${ex.once('root', ' (the note the chord is built on and named after)')}.`,
    result: `Root: ${noteLabel(notes[0]!)}`,
  }
}

/** The pitches of a chord in the best octave for a clef, for pictures and sounds that must match. */
export function chordPicture(chord: Chord, clef: ClefName, inversion = 0): Pitch[] {
  return chordOnStaff(chord, clef, inversion)
}

/**
 * Several chords in the same octave, so a picture of them (and the sound) looks and sounds like one passage.
 * Tries the usual octave for the clef first, then the ones either side. Throws if none fits.
 */
export function sharedPictures(chords: readonly Chord[], clef: ClefName): Pitch[][] {
  const preferred = clef === 'treble' ? 4 : 3
  for (const octave of [preferred, preferred - 1, preferred + 1]) {
    const pictures = chords.map((c) => chordPitches(c, { bassOctave: octave }))
    const all = pictures.flat().map(midiNumber)
    if (pictures.every((p) => fitsOnStaff(p, clef, 1)) && Math.min(...all) >= 36 && Math.max(...all) <= 96) return pictures
  }
  throw new Error('These chords do not fit one octave on the staff')
}

/** Chords played one after another, each held for `hold` seconds. */
export function chordSequenceAudio(chords: readonly (readonly Pitch[])[], gap = 1.5, hold = 1.4): AudioSpec {
  return {
    events: chords.map((c, i) => ({ midi: [...c].sort((a, b) => midiNumber(a) - midiNumber(b)).map(midiNumber), start: Math.round(i * gap * 100) / 100, duration: hold })),
  }
}

/**
 * "Check another way: count the 3rds by piano keys": walks between neighbouring notes of a chord stacked in 3rds.
 * Returns the walks' text pieces and the sizes.
 */
export function neighbourWalks(notes: readonly NoteName[], ex: Explained): { sizes: number[]; text: string } {
  const flats = prefersFlats(notes)
  const walks = notes.slice(1).map((n, i) => ({ from: notes[i]!, to: n, walk: pianoWalk(notes[i]!, n, ex, 'up', flats) }))
  const text = walks.map((w) => `${noteLabel(w.from)} to ${noteLabel(w.to)}: ${w.walk.text}.`).join(' ') + sameKeyNotes(notes)
  return { sizes: walks.map((w) => w.walk.steps), text }
}

/* ------------------------------------------------------------------------------------------------
 * Triads
 * ---------------------------------------------------------------------------------------------- */

/**
 * Build a triad from its root and type.
 * Working: letters, then semitone counts by letters from the root. Check: the two 3rds counted by piano keys.
 * Cross-check: the engine's `chordNotes`, `identifyChord` and interval names.
 */
export function buildTriadExample(root: NoteName, quality: TriadQuality, clef: ClefName = 'treble'): WorkedExample {
  const ex = new Explained()
  const recipe = TRIAD_RECIPE[quality]
  const label = chordWords({ root, quality })
  const first = rootStep(root, ex)
  const { step: lettersStep } = letterStep(root, 3, ex)
  const recipeStep: WorkedStep = {
    title: `Look up the recipe for a ${quality} triad`,
    text: `${article(quality)} triad has a ${recipe.lower} from the root to the 3rd and a ${recipe.fifthName} from the root to the 5th. Counted in semitones${ex.once('semitone', ' (one piano key to the very next, black or white)')}, the 3rd is ${recipe.third} above the root and the 5th is ${recipe.fifth} above it.`,
    result: `3rd: ${st(recipe.third)} up. 5th: ${st(recipe.fifth)} up`,
  }
  const third = spellNoteSteps(root, '3rd', recipe.third, ex)
  const fifth = spellNoteSteps(root, '5th', recipe.fifth, ex)
  const notes = [root, third.note, fifth.note]

  // Cross-check against the engine, by a different route (intervals, not counting).
  const chord: Chord = { root, quality }
  assertSameNotes(`${label} triad`, notes, chordNotes(chord))
  const found = identifyChord(notes)
  if (!found || found.quality !== quality || !sameNote(found.root, root)) throw new Error(`${label}: the engine does not recognise ${notesLabel(notes)} as this triad`)

  const pitches = chordPicture(chord, clef)
  const walks = neighbourWalks(notes, ex)
  if (walks.sizes[0] !== recipe.lowerSemis || walks.sizes[1] !== recipe.upperSemis) throw new Error(`${label}: the piano-key check does not match the recipe`)
  const lowerName = intervalWords(root, third.note, walks.sizes[0])
  const upperName = intervalWords(third.note, fifth.note, walks.sizes[1])
  if (lowerName !== recipe.lower || upperName !== recipe.upper) throw new Error(`${label}: interval names do not match the recipe`)

  return finish({
    title: `Build the ${label} triad`,
    task: `Write the notes of the ${label} triad.`,
    terms: [
      TERM.triad,
      TERM.root,
      TERM.stacked,
      TERM.third,
      TERM.fifth,
      TERM.semitone,
      intervalTerm(recipe.lower),
      intervalTerm(recipe.upper),
      intervalTerm(recipe.fifthName),
      chordTypeTerm(quality),
      ...signTerms(notes),
    ],
    steps: [
      first,
      lettersStep,
      recipeStep,
      ...third.steps,
      ...fifth.steps,
      {
        title: 'Write the triad out',
        text: 'Read your notes from the root up. On the staff they sit on three neighbouring lines or in three neighbouring spaces, because each note skips one letter name.',
        result: notesLabel(notes),
        staff: chordsOnStaff(clef, [pitches]),
        listen: listenChord(`Hear ${label}`, pitches),
      },
      {
        title: 'Check another way: count the 3rds by piano keys',
        text: `Count up one piano key at a time. ${walks.text} ${article(quality)} triad is ${recipe.lowerSemis} then ${recipe.upperSemis}: a ${recipe.lower} with a ${recipe.upper} on top.`,
        result: `${walks.sizes[0]} then ${walks.sizes[1]}: ${label}, as it should be`,
      },
    ],
    answer: `The ${label} triad is ${notesLabel(notes)}.`,
  })
}

/**
 * Identify a root-position triad written on a staff.
 * Working: count the two 3rds by letters. Check: root to 5th by piano keys.
 * Cross-check: the engine's `identifyChord` and interval names.
 */
export function identifyTriadExample(pitches: readonly Pitch[], clef: ClefName = 'treble'): WorkedExample {
  if (pitches.length !== 3) throw new Error('A triad has three notes')
  const ex = new Explained()
  const notes = pitches.map(withoutOctave)
  assertStackedInThirds(notes)
  const [root, middle, top] = notes as [NoteName, NoteName, NoteName]
  const names = nameNotesStep(pitches, clef, 'Hear this triad')
  const stacked = stackedStep(notes, ex)
  const lower = countStep(root, middle, ex, `Count from the root up to the 3rd, ${noteLabel(middle)}`)
  const upper = countStep(middle, top, ex, `Count from the 3rd up to the 5th, ${noteLabel(top)}`)
  const quality = qualityFromSemitones([lower.total, lower.total + upper.total])
  if (!quality || !isTriadQuality(quality)) throw new Error(`${notesLabel(notes)} is not one of the four triads (${lower.total} then ${upper.total})`)
  const recipe = TRIAD_RECIPE[quality]
  const found = identifyChord(notes)
  if (!found || found.quality !== quality || !sameNote(found.root, root)) throw new Error(`Working says ${quality} but the engine says otherwise for ${notesLabel(notes)}`)
  const label = chordWords(found)
  const walk = pianoWalk(root, top, ex)
  if (walk.steps !== lower.total + upper.total || walk.steps !== recipe.fifth) throw new Error('The piano-key check does not match the two 3rds')
  const fifthName = intervalWords(root, top, walk.steps)

  return finish({
    title: `Identify the triad on the staff: ${label}`,
    task: 'Look at the triad on the staff. What type of triad is it, and what is it called?',
    terms: [
      TERM.triad,
      TERM.root,
      TERM.rootPosition,
      TERM.third,
      TERM.fifth,
      TERM.semitone,
      intervalTerm(lower.name),
      intervalTerm(upper.name),
      intervalTerm(fifthName),
      chordTypeTerm(quality),
      ...signTerms(notes).filter((t) => t !== TERM.natural),
    ],
    steps: [
      names,
      stacked,
      ...lower.steps,
      ...upper.steps,
      {
        title: 'Match the two 3rds to a triad type',
        text: `A 3rd of 4 semitones is a major 3rd; a 3rd of 3 semitones is a minor 3rd. Major triad: 4 then 3. Minor: 3 then 4. Diminished: 3 then 3. Augmented: 4 then 4. Yours is ${lower.total} then ${upper.total}, and the root is ${noteLabel(root)}.`,
        result: `${article(quality)} triad: ${label}`,
      },
      {
        title: 'Check another way: count from the root to the 5th',
        text: `Count up one piano key at a time from ${noteLabel(root)} to ${noteLabel(top)}: ${walk.text}.${walk.note} Your two 3rds add up to the same: ${lower.total} + ${upper.total} = ${walk.steps}.`,
        result: `${st(walk.steps)}: a ${fifthName}, as a ${quality} triad needs`,
      },
    ],
    answer: `It is a ${quality} triad: ${label} (${notesLabel(notes)}).`,
  })
}

/* ------------------------------------------------------------------------------------------------
 * Seventh chords
 * ---------------------------------------------------------------------------------------------- */

/**
 * Build a seventh chord from its root and type.
 * Working: letters, then semitone counts by letters from the root.
 * Checks: the triad at the bottom by piano keys, and the 7th counted down from the octave.
 * Cross-check: the engine's `chordNotes`, `identifyChord` and interval names.
 */
export function buildSeventhExample(root: NoteName, quality: SeventhQuality, clef: ClefName = 'treble'): WorkedExample {
  const ex = new Explained()
  const recipe = SEVENTH_RECIPE[quality]
  const name = SEVENTH_NAME[quality]
  const label = chordWords({ root, quality })
  const first = rootStep(root, ex)
  const { step: lettersStep } = letterStep(root, 4, ex)
  const third = spellNoteSteps(root, '3rd', recipe.third, ex)
  const fifth = spellNoteSteps(root, '5th', recipe.fifth, ex)
  const seventh = spellNoteSteps(root, '7th', recipe.seventh, ex)
  const notes = [root, third.note, fifth.note, seventh.note]
  const triadRecipe = TRIAD_RECIPE[recipe.triad]

  const chord: Chord = { root, quality }
  assertSameNotes(label, notes, chordNotes(chord))
  const found = identifyChord(notes)
  if (!found || found.quality !== quality || !sameNote(found.root, root)) throw new Error(`${label}: the engine does not recognise ${notesLabel(notes)}`)
  const pitches = chordPicture(chord, clef)
  const sevenName = intervalName(intervalBetween(pitches[0]!, pitches[3]!).interval)
  if (sevenName !== recipe.seventhName) throw new Error(`${label}: the 7th should be a ${recipe.seventhName} but the engine says ${sevenName}`)
  const triadFound = identifyChord(notes.slice(0, 3))
  if (!triadFound || triadFound.quality !== recipe.triad) throw new Error(`${label}: the three lower notes should make a ${recipe.triad} triad`)

  const recipeStep: WorkedStep = {
    title: `Look up the recipe for a ${name} chord`,
    text: `A ${name} chord is a ${recipe.triad} triad with a ${recipe.seventhName} on top. Counted in semitones${ex.once('semitone', ' (one piano key to the very next, black or white)')} above the root, the 3rd is ${recipe.third}, the 5th is ${recipe.fifth} and the 7th is ${recipe.seventh}.`,
    result: `3rd: ${recipe.third}, 5th: ${recipe.fifth}, 7th: ${recipe.seventh} semitones above the root`,
  }
  const walks = neighbourWalks(notes.slice(0, 3), ex)
  if (walks.sizes[0] !== triadRecipe.lowerSemis || walks.sizes[1] !== triadRecipe.upperSemis) throw new Error(`${label}: the piano-key check of the triad fails`)
  const down = pianoWalk(root, seventh.note, ex, 'down')
  if (12 - down.steps !== recipe.seventh) throw new Error(`${label}: counting down from the octave does not give the 7th`)

  return finish({
    title: `Build ${label}`,
    task: `Write the notes of ${label}.`,
    terms: [
      TERM.seventhChord,
      chordTypeTerm(quality),
      TERM.root,
      TERM.stacked,
      TERM.triad,
      TERM.third,
      TERM.fifth,
      TERM.seventh,
      TERM.semitone,
      intervalTerm(triadRecipe.lower),
      intervalTerm(triadRecipe.fifthName),
      intervalTerm(recipe.seventhName),
      TERM.octave,
      ...signTerms(notes),
    ],
    steps: [
      first,
      lettersStep,
      recipeStep,
      ...third.steps,
      ...fifth.steps,
      ...seventh.steps,
      {
        title: 'Write the chord out',
        text: 'Read your notes from the root up. On the staff they sit on four neighbouring lines or in four neighbouring spaces, because each note skips one letter name.',
        result: notesLabel(notes),
        staff: chordsOnStaff(clef, [pitches]),
        listen: listenChord(`Hear ${label}`, pitches),
      },
      {
        title: 'Check another way: the triad at the bottom',
        text: `Count up one piano key at a time between the lower three notes. ${walks.text} ${walks.sizes[0]} then ${walks.sizes[1]} is a ${recipe.triad} triad, as a ${name} chord needs.`,
        result: `${notesLabel(notes.slice(0, 3))}: a ${recipe.triad} triad`,
      },
      {
        title: 'Check another way: count down from the octave',
        text: `The ${noteLabel(root)} an octave above the root is 12 semitones up. Count down one piano key at a time from it to the 7th: ${down.text}.${down.note} So the 7th is 12 − ${down.steps} = ${12 - down.steps} semitones above the root.`,
        result: `${noteLabel(seventh.note)} is ${st(recipe.seventh)} up: a ${recipe.seventhName}, as it should be`,
      },
    ],
    answer: `${label} is ${notesLabel(notes)}.`,
  })
}

/**
 * Identify a root-position seventh chord written on a staff.
 * Working: count from the root to each other note by letters. Check: the 3rds between neighbours by piano keys.
 * Cross-check: the engine's `identifyChord` and interval names.
 */
export function identifySeventhExample(pitches: readonly Pitch[], clef: ClefName = 'treble'): WorkedExample {
  if (pitches.length !== 4) throw new Error('A seventh chord has four notes')
  const ex = new Explained()
  const notes = pitches.map(withoutOctave)
  assertStackedInThirds(notes)
  const [root, third, fifth, seventh] = notes as [NoteName, NoteName, NoteName, NoteName]
  const names = nameNotesStep(pitches, clef)
  const stacked = stackedStep(notes, ex)
  const counts = [third, fifth, seventh].map((n, i) => countStep(root, n, ex, `Count from the root up to the ${ROLES[i]!}, ${noteLabel(n)}`))
  const totals = counts.map((c) => c.total)
  const quality = qualityFromSemitones(totals)
  if (!quality || !isSeventhQuality(quality)) throw new Error(`${notesLabel(notes)} is not one of the five seventh chords (${totals.join(', ')})`)
  const recipe = SEVENTH_RECIPE[quality]
  const found = identifyChord(notes)
  if (!found || found.quality !== quality || !sameNote(found.root, root)) throw new Error(`Working says ${quality} but the engine disagrees for ${notesLabel(notes)}`)
  const label = chordWords(found)
  const sevenName = intervalName(intervalBetween(pitches[0]!, pitches[3]!).interval)
  if (sevenName !== recipe.seventhName) throw new Error(`The 7th should be a ${recipe.seventhName} but the engine says ${sevenName}`)
  const walks = neighbourWalks(notes, ex)
  const sum = walks.sizes.reduce((a, b) => a + b, 0)
  if (sum !== totals[2]) throw new Error('The 3rds between neighbours do not add up to the 7th')

  return finish({
    title: `Identify the 7th chord on the staff: ${label}`,
    task: 'Look at the chord on the staff. What type of 7th chord is it, and what is it called?',
    terms: [
      TERM.seventhChord,
      TERM.root,
      TERM.rootPosition,
      TERM.semitone,
      ...counts.map((c) => intervalTerm(c.name)),
      chordTypeTerm(quality),
      ...signTerms(notes).filter((t) => t !== TERM.natural),
    ],
    steps: [
      names,
      stacked,
      ...counts.flatMap((c) => c.steps),
      {
        title: 'Match the three counts to a 7th chord type',
        text: `Each type has its own three counts from the root (to the 3rd, 5th and 7th). ${SEVENTH_TABLE_TEXT} Yours are ${totals.join(', ')}, and the root is ${noteLabel(root)}.`,
        result: `A ${SEVENTH_NAME[quality]} chord: ${label}`,
      },
      {
        title: 'Check another way: count the 3rds between neighbours',
        text: `Count up one piano key at a time between neighbouring notes. ${walks.text} Added up: ${walks.sizes.join(' + ')} = ${sum}.`,
        result: `${sum}, the same as your count from the root to the 7th`,
      },
    ],
    answer: `It is ${label} (${notesLabel(notes)}).`,
  })
}
