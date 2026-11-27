import type { WorkedExample, WorkedStep } from '../types'
import {
  type ClefName,
  type Key,
  type Letter,
  type NoteName,
  circleOfFifths,
  dominantKey,
  formatNote,
  isStandardKey,
  keyScaleNotes,
  keySignature,
  letterAt,
  letterIndex,
  pitchClass,
  subdominantKey,
} from '../../../theory'
import { keyLabel, noteLabel, notesLabel } from '../../../questions/pitchTools'
import { emptyStaff } from './common'
import {
  SEMITONES_TO_NEXT_LETTER,
  Words,
  keyWalkText,
  lettersDown,
  lettersUp,
  mod12,
  noteAt,
  prefersFlats,
  semitones,
  spellOnLetter,
  stepsWord,
} from './working'

/** The order sharps are added to a key signature, and the order flats are added. Written out by hand. */
export const SHARP_LETTERS: readonly Letter[] = ['F', 'C', 'G', 'D', 'A', 'E', 'B']
export const FLAT_LETTERS: readonly Letter[] = ['B', 'E', 'A', 'D', 'G', 'C', 'F']

/** The major keys with sharps and the major keys with flats, written out by hand (C major has neither). */
const SHARP_MAJOR_KEYS = ['G', 'D', 'A', 'E', 'B', 'F♯', 'C♯']
const FLAT_MAJOR_KEYS = ['F', 'B♭', 'E♭', 'A♭', 'D♭', 'G♭', 'C♭']

const same = (a: NoteName, b: NoteName) => a.letter === b.letter && a.accidental === b.accidental
const sameKey = (a: Key, b: Key) => a.mode === b.mode && same(a.tonic, b.tonic)

export const countWords = (fifths: number): string =>
  fifths === 0 ? 'no sharps or flats' : `${Math.abs(fifths)} ${fifths > 0 ? 'sharp' : 'flat'}${Math.abs(fifths) === 1 ? '' : 's'}`

/** Which kind of signature a major key has, from the hand-written lists. */
export function majorKeyKind(tonic: NoteName): 'sharps' | 'flats' | 'none' {
  const text = noteLabel(tonic)
  if (text === 'C') return 'none'
  if (SHARP_MAJOR_KEYS.includes(text)) return 'sharps'
  if (FLAT_MAJOR_KEYS.includes(text)) return 'flats'
  throw new Error(`${text} major is not one of the 15 standard major keys`)
}

/** The relative major of a minor key note (3 letter names and 3 semitones up). */
export const relativeMajorOf = (minorTonic: NoteName): NoteName => noteAt(minorTonic, 3, 3, 'up')
/** The relative minor of a major key note (3 letter names and 3 semitones down). */
export const relativeMinorOf = (majorTonic: NoteName): NoteName => noteAt(majorTonic, 3, 3, 'down')

/** The last sharp of a sharp major key: the note on the letter below the key note, a semitone below it. */
function lastSharpOf(tonic: NoteName): NoteName {
  const lastSharp = spellOnLetter(letterAt(letterIndex(tonic.letter) - 1), mod12(pitchClass(tonic) - 1))
  if (lastSharp.accidental !== 1) throw new Error(`The note below ${noteLabel(tonic)} is not a sharp`)
  return lastSharp
}

/**
 * The number of sharps (+) or flats (-) of a major key, worked out by the rules in the lesson:
 * with sharps, the last sharp is a semitone below the key note; with flats, the key note is the second-to-last flat.
 */
export function majorFifthsByRules(tonic: NoteName): number {
  const kind = majorKeyKind(tonic)
  if (kind === 'none') return 0
  if (kind === 'sharps') return SHARP_LETTERS.indexOf(lastSharpOf(tonic).letter) + 1
  if (tonic.letter === 'F') return -1
  return -(FLAT_LETTERS.indexOf(tonic.letter) + 2)
}

/** The same for any of the 30 keys. A minor key is found through its relative major. Throws if the rules and the engine disagree. */
export function fifthsByRules(key: Key): number {
  const major = key.mode === 'major' ? key.tonic : relativeMajorOf(key.tonic)
  const fifths = majorFifthsByRules(major)
  const engine = keySignature(key).fifths
  if (fifths !== engine) throw new Error(`The rules give ${fifths} for ${keyLabel(key)} but the theory engine says ${engine}`)
  return fifths
}

/** The rows of the table of all 15 major keys and their relative minors, built by the engine. */
export function keySignatureTableRows(): string[][] {
  return circleOfFifths().map((entry) => [
    entry.fifths === 0 ? 'None' : `${Math.abs(entry.fifths)} ${entry.fifths > 0 ? 'sharp' : 'flat'}${Math.abs(entry.fifths) === 1 ? '' : 's'}`,
    keyLabel(entry.major),
    keyLabel(entry.minor),
    entry.fifths === 0 ? '–' : notesLabel(keySignature(entry.major).accidentals),
  ])
}

/** The keys at each step round the circle of fifths, from C major (or A minor) to this key. */
export function circlePath(key: Key): Key[] {
  const target = keySignature(key).fifths
  const start: Key = key.mode === 'major' ? { tonic: { letter: 'C', accidental: 0 }, mode: 'major' } : { tonic: { letter: 'A', accidental: 0 }, mode: 'minor' }
  const path: Key[] = [start]
  for (let i = 0; i < Math.abs(target); i++) {
    const last = path[path.length - 1]!
    path.push(target > 0 ? dominantKey(last) : subdominantKey(last))
  }
  if (!sameKey(path[path.length - 1]!, key)) throw new Error('The circle of fifths does not lead to this key')
  return path
}

function assertScaleMatchesSignature(key: Key): void {
  const signs = keyScaleNotes(key).filter((n) => n.accidental !== 0)
  const a = signs.map((n) => formatNote(n)).sort().join(' ')
  const b = keySignature(key).accidentals.map((n) => formatNote(n)).sort().join(' ')
  if (a !== b) throw new Error(`The signs in the ${keyLabel(key)} scale (${a}) are not the signature (${b})`)
}


/** "F (1), C (2), G (3)": counting along the order of sharps or flats. */
const countAlong = (order: readonly Letter[], n: number): string => order.slice(0, n).map((l, i) => `${l} (${i + 1})`).join(', ')

/**
 * Two steps that find the relative key: count 3 letter names, then 3 semitones (one piano key at a time).
 * Up from a minor key note to its relative major, down from a major key note to its relative minor.
 */
export function relativeKeySteps(from: Key, lead: string, resultLabel: string): { key: Key; steps: WorkedStep[] } {
  const up = from.mode === 'minor'
  const target = up ? relativeMajorOf(from.tonic) : relativeMinorOf(from.tonic)
  const key: Key = { tonic: target, mode: up ? 'major' : 'minor' }
  const letters = (up ? lettersUp : lettersDown)(from.tonic.letter, 3)
  const direction = up ? 'up' : 'down'
  return {
    key,
    steps: [
      {
        title: `Count 3 letter names ${direction} from ${from.tonic.letter}`,
        text: `${lead} Count 3 letter names ${direction} from ${from.tonic.letter}, counting ${from.tonic.letter} as 1: ${letters.join(', ')}.`,
        result: `Letter: ${target.letter}`,
      },
      {
        title: `Count 3 semitones ${direction} from ${noteLabel(from.tonic)}`,
        text: `Count ${direction} one piano key at a time from ${noteLabel(from.tonic)}. Count the steps, not the key you start on: ${keyWalkText(from.tonic, target, 3, direction, prefersFlats(from.tonic, target))}. It lands on ${noteLabel(target)}, which uses the letter ${target.letter}.`,
        result: `${resultLabel}: ${keyLabel(key)}`,
      },
    ],
  }
}

/**
 * The steps that find the key signature of a major key by the rules: sharp key or flat key, then
 * the last sharp and its place in the order of sharps, or the key note's place in the order of flats.
 * Returns the number of sharps (+) or flats (-), checked against the engine.
 */
export function signatureSteps(major: NoteName, w: Words): { fifths: number; steps: WorkedStep[] } {
  const majorKey: Key = { tonic: major, mode: 'major' }
  const fifths = fifthsByRules(majorKey)
  const kind = majorKeyKind(major)
  const name = keyLabel(majorKey)
  const n = Math.abs(fifths)
  const signs = keySignature(majorKey).accidentals
  const steps: WorkedStep[] = [
    {
      title: `Decide whether ${name} has sharps or flats`,
      text: `Learn these two lists. Major keys with sharps: G, D, A, E, B, F♯, C♯. Major keys with flats: F, B♭, E♭, A♭, D♭, G♭, C♭. ${
        kind === 'none'
          ? `${name} is in neither list, so its ${w.say('keySignature', 'key signature')} is empty.`
          : `${name} is in the ${kind === 'sharps' ? 'first' : 'second'} list, so its ${w.say('keySignature', 'key signature')} has ${w.say(kind === 'sharps' ? 'sharp' : 'flat', kind)}.`
      }`,
      result: kind === 'none' ? `${name}: no sharps or flats` : `${name} has ${kind}`,
    },
  ]
  if (kind === 'sharps') {
    const last = lastSharpOf(major)
    const before = last.letter
    const letterGap = SEMITONES_TO_NEXT_LETTER[before]
    const distance = letterGap + major.accidental
    const how =
      major.accidental === 0
        ? `${before} up to ${noteLabel(major)} is ${semitones(distance)}.`
        : `${before} up to ${major.letter} is ${semitones(letterGap)}, and ${noteLabel(major)} is 1 higher, so ${before} up to ${noteLabel(major)} is ${semitones(distance)}.`
    if (distance !== 2) throw new Error('The letter below a sharp key note is always 2 semitones below it')
    steps.push({
      title: 'Find the last sharp',
      text: `The last sharp is always the ${w.say('leadingNote', 'leading note')}, so it uses the letter before ${major.letter}: ${before}. ${how} That is 1 too many, so raise ${before} with ${w.say('sharp', 'a sharp')}: ${noteLabel(last)}.`,
      result: `Last sharp: ${noteLabel(last)}`,
    })
    const place = SHARP_LETTERS.indexOf(before) + 1
    if (place !== n) throw new Error('The place of the last sharp must be the number of sharps')
    steps.push({
      title: 'Count along the order of sharps',
      text: `Sharps are always added in the same order, the ${w.named('orderOfSharps', 'order of sharps')}: F C G D A E B. Count along it until you reach ${before}: ${countAlong(SHARP_LETTERS, n)}. So ${name} has the first ${n === 1 ? 'sharp' : `${n} sharps`} of the order.`,
      result: `${countWords(fifths)}: ${notesLabel(signs)}`,
    })
  } else if (kind === 'flats' && n === 1) {
    steps.push({
      title: 'Learn the one-flat key',
      text: `F major has just one flat, B♭. Learn this one: the second-to-last flat rule needs at least two flats. (B♭ is note 4 of F major: F, G, A, B♭.)`,
      result: '1 flat: B♭',
    })
  } else if (kind === 'flats') {
    const place = FLAT_LETTERS.indexOf(major.letter) + 1
    if (major.accidental !== -1) throw new Error('A flat key with two or more flats has a flat key note')
    steps.push({
      title: 'Find the key note in the order of flats',
      text: `Flats are always added in the same order, the ${w.named('orderOfFlats', 'order of flats')}: B E A D G C F. In a key with two or more flats, the ${w.say('tonic', 'key note')} is always the second-to-last flat. Find ${major.letter} in the order: ${countAlong(FLAT_LETTERS, place)}.`,
      result: `${noteLabel(major)} is flat number ${place}`,
    })
    if (place + 1 !== n) throw new Error('The last flat must come one place after the key note')
    steps.push({
      title: 'Add one for the last flat',
      text: `The last flat is the next one in the order: ${FLAT_LETTERS[place]}, number ${place + 1}. So ${name} has the first ${n} flats of the order.`,
      result: `${countWords(fifths)}: ${notesLabel(signs)}`,
    })
  }
  return { fifths, steps }
}

/** The last step of both examples: check by the circle of fifths (or, for no signs, by the scale itself). */
export function circleCheckStep(key: Key, w: Words): WorkedStep {
  const fifths = keySignature(key).fifths
  const n = Math.abs(fifths)
  if (n === 0) {
    const scale = keyScaleNotes(key)
    if (scale.some((x) => x.accidental !== 0)) throw new Error('A key with no signs has only natural notes')
    return {
      title: 'Check another way: write the scale',
      text: `The ${keyLabel(key)} scale${key.mode === 'minor' ? ' (natural minor)' : ''} is ${notesLabel(scale)}. Every note is a ${w.say('natural', 'natural')}, so the key needs no sharps or flats.`,
      result: `${keyLabel(key)}: no sharps or flats, as found`,
    }
  }
  const path = circlePath(key)
  const sign = fifths > 0 ? 'sharp' : 'flat'
  return {
    title: 'Check another way: the circle of fifths',
    text: `On the ${w.say('circleOfFifths', 'circle of fifths')}, start at ${keyLabel(path[0]!)}, with no sharps or flats. Each step ${fifths > 0 ? 'up' : 'down'} a ${w.say('perfectFifth', 'perfect 5th')} adds one ${sign}: ${path.map((k, i) => `${noteLabel(k.tonic)} (${i})`).join(', ')}.`,
    result: `${keyLabel(key)} is ${stepsWord(n)} along: ${countWords(fifths)}`,
  }
}

/**
 * "Which key has this signature?" Works from the picture to the answer by the rules in the lesson
 * (name the signs in order, then last sharp / second-to-last flat), and checks the answer against the engine,
 * both by the key signature itself and by the signs in the key's scale. Throws if they disagree.
 */
export function keyFromSignatureExample(key: Key, clef: ClefName = 'treble'): WorkedExample {
  if (!isStandardKey(key)) throw new Error(`${keyLabel(key)} is not a standard key`)
  const signature = keySignature(key)
  const fifths = fifthsByRules(key) // throws if the rules and the engine disagree
  const major: NoteName = key.mode === 'major' ? key.tonic : relativeMajorOf(key.tonic)
  const majorKey: Key = { tonic: major, mode: 'major' }
  const n = signature.count
  const kind = signature.kind
  const order = kind === 'sharps' ? SHARP_LETTERS : FLAT_LETTERS
  const signs = signature.accidentals
  if (signs.some((s, i) => s.letter !== order[i])) throw new Error('The signs are not in the usual order')
  assertScaleMatchesSignature(key)

  const w = new Words()
  const signWord = kind === 'sharps' ? (n === 1 ? 'a sharp' : 'sharps') : n === 1 ? 'a flat' : 'flats'
  const steps: WorkedStep[] = [
    {
      title: 'Count the signs after the clef',
      text:
        n === 0
          ? `This ${w.say('keySignature', 'key signature')} is in the ${clef} clef. There are no sharps or flats after the clef.`
          : `This ${w.say('keySignature', 'key signature')} is in the ${clef} clef. Count the signs straight after the clef: there ${n === 1 ? 'is 1' : `are ${n}`}, and ${n === 1 ? 'it is' : 'they are all'} ${w.say(kind === 'sharps' ? 'sharp' : 'flat', signWord)}. You only need to count them: where each one sits does not matter here.`,
      result: n === 0 ? 'No sharps or flats' : countWords(fifths),
      staff: emptyStaff(clef, key),
    },
  ]

  if (n > 0) {
    steps.push({
      title: `Name the ${kind} from the order`,
      text:
        kind === 'sharps'
          ? `Sharps are always added in the same order, the ${w.named('orderOfSharps', 'order of sharps')}: F C G D A E B. Take the first ${n === 1 ? 'one' : n}: ${countAlong(SHARP_LETTERS, n)}.`
          : `Flats are always added in the same order, the ${w.named('orderOfFlats', 'order of flats')}: B E A D G C F. Take the first ${n === 1 ? 'one' : n}: ${countAlong(FLAT_LETTERS, n)}.`,
      result: notesLabel(signs),
    })
  }

  if (n === 0) {
    steps.push({ title: 'Use the no-signs rule', text: 'With no sharps or flats, the major key is C major.', result: 'Major key: C major' })
  } else if (kind === 'sharps') {
    const last = signs[n - 1]!
    const next = letterAt(letterIndex(last.letter) + 1)
    const gap = SEMITONES_TO_NEXT_LETTER[last.letter]
    if (major.letter !== next || mod12(pitchClass(major) - pitchClass(last)) !== 1) throw new Error('The key note must be a semitone above the last sharp, on the next letter')
    const how =
      gap === 2
        ? `${last.letter} up to ${next} is 2 semitones, and ${noteLabel(last)} is 1 higher than ${last.letter}, so ${noteLabel(last)} up to ${next} is 1: the key note is ${noteLabel(major)}.`
        : `${last.letter} up to ${next} is only 1 semitone, so ${noteLabel(last)} is the same piano key as ${next}, and the key note is ${noteLabel(major)}.`
    steps.push({
      title: 'Go up a semitone from the last sharp',
      text: `The last sharp, ${noteLabel(last)}, is always the ${w.named('leadingNote', 'leading note')} of the major key: a semitone below its ${w.say('tonic', 'key note')}. ${how}`,
      result: `Major key: ${keyLabel(majorKey)}`,
    })
  } else if (n === 1) {
    steps.push({
      title: 'Use the one-flat rule',
      text: 'With one flat there is no second-to-last flat, so learn this one: one flat, B♭, means F major. (B♭ is note 4 of F major: F, G, A, B♭.)',
      result: 'Major key: F major',
    })
  } else {
    const second = signs[n - 2]!
    if (!same(second, major)) throw new Error('The key note must be the second-to-last flat')
    steps.push({
      title: 'Take the second-to-last flat',
      text: `With two or more flats, the ${w.say('tonic', 'key note')} of the major key is the second-to-last flat. Here that is ${noteLabel(second)}. (This works because the last flat is always note 4 of the major scale, and each flat is a 4th above the one before.)`,
      result: `Major key: ${keyLabel(majorKey)}`,
    })
  }

  if (key.mode === 'minor') {
    const relative = relativeKeySteps(
      majorKey,
      `The question asks for the minor key: the ${w.say('relativeMinor', 'relative minor')} of ${keyLabel(majorKey)}.`,
      'Minor key',
    )
    if (!sameKey(relative.key, key)) throw new Error('The relative minor worked out by counting is not the key asked for')
    steps.push(...relative.steps)
  }

  steps.push(circleCheckStep(key, w))
  return {
    title: `Read a key signature: ${countWords(fifths)}`,
    task: `Which ${key.mode} key has this key signature (${clef} clef)? It has ${countWords(fifths)}.`,
    steps,
    terms: w.terms(),
    answer: `The ${key.mode} key is ${keyLabel(key)}.`,
  }
}

/**
 * "Write the key signature of this key." The working finds the relative major of a minor key, decides sharps or flats,
 * counts the signs by the rules, writes them in the usual order, and checks with the circle of fifths. Throws if anything disagrees with the engine.
 */
export function signatureFromKeyExample(key: Key, clef: ClefName = 'treble'): WorkedExample {
  if (!isStandardKey(key)) throw new Error(`${keyLabel(key)} is not a standard key`)
  const signature = keySignature(key)
  const w = new Words()
  const steps: WorkedStep[] = []
  let major: NoteName = key.tonic
  if (key.mode === 'minor') {
    const relative = relativeKeySteps(
      key,
      `${keyLabel(key)} has the same ${w.say('keySignature', 'key signature')} as its ${w.say('relativeMajor', 'relative major')}.`,
      'Relative major',
    )
    steps.push(...relative.steps)
    major = relative.key.tonic
  }
  const found = signatureSteps(major, w)
  steps.push(...found.steps)
  const fifths = found.fifths
  if (fifths !== fifthsByRules(key)) throw new Error('A minor key must have the same signature as its relative major')
  const n = Math.abs(fifths)
  const kind = fifths > 0 ? 'sharps' : 'flats'
  const order = kind === 'sharps' ? SHARP_LETTERS : FLAT_LETTERS
  const signs: NoteName[] = order.slice(0, n).map((letter) => ({ letter, accidental: kind === 'sharps' ? 1 : -1 }))
  if (signs.length !== signature.accidentals.length || signs.some((s, i) => !same(s, signature.accidentals[i]!))) {
    throw new Error(`Signs for ${keyLabel(key)} disagree with the theory engine`)
  }
  steps.push({
    title: 'Write the signs after the clef',
    text:
      n === 0
        ? `There is nothing to write: the ${clef} clef stands on its own, with no sharps or flats after it.`
        : `Write the ${n === 1 ? 'one sign' : `${n} signs`} straight after the clef, in the order you counted them: ${notesLabel(signs)}. Here ${n === 1 ? 'it is' : 'they are'} in the ${clef} clef.`,
    result: n === 0 ? 'Nothing after the clef' : notesLabel(signs),
    staff: emptyStaff(clef, key),
  })
  steps.push(circleCheckStep(key, w))

  return {
    title: `Write the key signature of ${keyLabel(key)}`,
    task: `Write the key signature of ${keyLabel(key)}. How many sharps or flats does it have, and which?`,
    steps,
    terms: w.terms(),
    answer: n === 0 ? `${keyLabel(key)} has no sharps or flats.` : `${keyLabel(key)} has ${countWords(fifths)}: ${notesLabel(signs)}.`,
  }
}
