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
  keyFromFifths,
  keyScaleNotes,
  keySignature,
  letterAt,
  letterIndex,
  pitchClass,
  subdominantKey,
} from '../../../theory'
import { keyLabel, noteLabel, notesLabel } from '../../../questions/pitchTools'
import { emptyStaff } from './common'
import { mod12, noteAt, ordinal, signWords, spellOnLetter } from './working'

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

/**
 * The number of sharps (+) or flats (-) of a major key, worked out by the rules in the lesson:
 * with sharps, the last sharp is a semitone below the key note; with flats, the key note is the second-to-last flat.
 */
export function majorFifthsByRules(tonic: NoteName): number {
  const kind = majorKeyKind(tonic)
  if (kind === 'none') return 0
  if (kind === 'sharps') {
    const lastSharp = spellOnLetter(letterAt(letterIndex(tonic.letter) - 1), mod12(pitchClass(tonic) - 1))
    if (lastSharp.accidental !== 1) throw new Error(`The note below ${noteLabel(tonic)} is not a sharp`)
    return SHARP_LETTERS.indexOf(lastSharp.letter) + 1
  }
  if (tonic.letter === 'F') return -1
  const place = FLAT_LETTERS.indexOf(tonic.letter)
  return -(place + 2)
}

/** The same for any of the 30 keys. A minor key is found through its relative major. */
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

/** The names of the keys at each step round the circle of fifths, starting at C major (or A minor) and going to this key. */
function circlePath(key: Key): Key[] {
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

function pathText(path: readonly Key[]): string {
  return path.map((k, i) => `${keyLabel(k)} (${i === 0 ? 'none' : countWords(keySignature(k).fifths)})`).join(' → ')
}

/** Every sharp or flat that the natural scale of the key has, as text, to compare with the signature. */
function scaleSigns(key: Key): NoteName[] {
  return keyScaleNotes(key).filter((n) => n.accidental !== 0)
}

function assertScaleMatchesSignature(key: Key): void {
  const signs = scaleSigns(key)
  const signature = keySignature(key).accidentals
  const a = signs.map((n) => formatNote(n)).sort().join(' ')
  const b = signature.map((n) => formatNote(n)).sort().join(' ')
  if (a !== b) throw new Error(`The signs in the ${keyLabel(key)} scale (${a}) are not the signature (${b})`)
}

/**
 * One sentence saying how many sharps or flats a key has and why, by the rules in the Key signatures lesson.
 * (Throws if the rules and the theory engine disagree.)
 */
export function signatureSentence(key: Key): string {
  const fifths = fifthsByRules(key)
  const major: NoteName = key.mode === 'major' ? key.tonic : relativeMajorOf(key.tonic)
  const majorName = `${noteLabel(major)} major`
  const signs = keySignature(key).accidentals
  const n = Math.abs(fifths)
  let sentence: string
  if (fifths === 0) {
    sentence = 'C major has no sharps or flats.'
  } else if (fifths > 0) {
    const last = signs[n - 1]!
    sentence = `The last sharp of ${majorName} is ${noteLabel(last)} (a semitone below ${noteLabel(major)}), the ${ordinal(n)} letter in F C G D A E B. So ${majorName} has ${countWords(fifths)}: ${notesLabel(signs)}.`
  } else if (n === 1) {
    sentence = 'F major has one flat, B♭ (this one has to be learned).'
  } else {
    sentence = `The key note ${noteLabel(major)} is the second-to-last flat, so the last flat is the next letter along in B E A D G C F, which is ${FLAT_LETTERS[n - 1]}. So ${majorName} has ${countWords(fifths)}: ${notesLabel(signs)}.`
  }
  return key.mode === 'major' ? sentence : `${keyLabel(key)} has the same signature as its relative major, ${majorName}. ${sentence}`
}

const clefWords = (clef: ClefName): string => `${clef} clef`

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
  const majorName = `${noteLabel(major)} major`
  const n = signature.count
  const kind = signature.kind
  const order = kind === 'sharps' ? SHARP_LETTERS : FLAT_LETTERS
  const signs = signature.accidentals
  // The long-hand names of the signs must be the first n letters of the order.
  if (signs.some((s, i) => s.letter !== order[i])) throw new Error('The signs are not in the usual order')
  assertScaleMatchesSignature(key)

  const steps: WorkedStep[] = []
  steps.push({
    text:
      n === 0
        ? `Look at the picture (${clefWords(clef)}). There are **no sharps or flats** after the clef.`
        : `Look at the picture (${clefWords(clef)}). Count the signs after the clef: there ${n === 1 ? 'is **1**' : `are **${n}**`}, and ${n === 1 ? 'it is a' : 'they are all'} **${kind === 'sharps' ? (n === 1 ? 'sharp (♯)' : 'sharps (♯)') : n === 1 ? 'flat (♭)' : 'flats (♭)'}**. You only need to count them: the signs are drawn in a set zigzag pattern, which is different in each clef.`,
    staff: emptyStaff(clef, key),
  })

  let majorStep: string
  if (n === 0) {
    majorStep = 'With no sharps or flats the major key is **C major**.'
  } else if (kind === 'sharps') {
    const last = signs[n - 1]!
    const nextLetter = letterAt(letterIndex(last.letter) + 1)
    const sign = major.accidental
    steps.push({
      text: `Name the sharps. They are always added in the order **F C G D A E B**. So ${n === 1 ? 'the one sharp is' : `the ${n} sharps are the first ${n} of those`}: **${notesLabel(signs)}**. The last sharp is **${noteLabel(last)}**.`,
    })
    majorStep = `**Sharps rule:** the major key is a **semitone above the last sharp**. Take the next letter name after ${last.letter}, which is ${nextLetter}. ${sign === 0 ? `The plain ${nextLetter}` : `${nextLetter} with ${signWords(sign)}`} is exactly one semitone above ${noteLabel(last)}. So the major key is **${majorName}**.`
  } else {
    const flatsText = signs.map(noteLabel)
    steps.push({
      text: `Name the flats. They are always added in the order **B E A D G C F** (the sharps' order backwards). So ${n === 1 ? 'the one flat is' : `the ${n} flats are the first ${n} of those`}: **${notesLabel(signs)}**.`,
    })
    majorStep =
      n === 1
        ? `**One flat:** there is no second-to-last flat to use, so this one has to be learned. One flat (B♭) is **F major**.`
        : `**Flats rule:** with two or more flats the major key is the **second-to-last flat**. The flats are ${flatsText.join(', ')}; the second-to-last is ${flatsText[n - 2]}. So the major key is **${majorName}**.`
  }
  steps.push({ text: majorStep })

  if (key.mode === 'minor') {
    const down = [major.letter, letterAt(letterIndex(major.letter) - 1), letterAt(letterIndex(major.letter) - 2)]
    steps.push({
      text: `The question asks for the **minor** key. The minor key with the same signature is the **relative minor**, which starts **3 semitones below** the major key note. Count 3 letter names down from ${major.letter}: ${down.join(', ')}. The letter is ${key.tonic.letter}, and ${noteLabel(key.tonic)} is 3 semitones below ${noteLabel(major)}. So the minor key is **${keyLabel(key)}**. (Another way: the minor key starts on the 6th note of the major scale.)`,
    })
  }

  const scale = keyScaleNotes(key)
  const signsInScale = scaleSigns(key)
  steps.push({
    text: `Check by writing the scale of ${keyLabel(key)}${key.mode === 'minor' ? ' (the natural minor form)' : ''}: **${notesLabel(scale)}**. ${
      n === 0
        ? 'It has no sharps or flats, which matches the picture.'
        : `The ${kind === 'sharps' ? 'sharps' : 'flats'} in it are ${notesLabel(signsInScale)} (${signsInScale.length} of them): the same as the signature. ✓`
    }`,
  })
  const other = key.mode === 'major' ? keyFromFifths(fifths, 'minor') : keyFromFifths(fifths, 'major')
  steps.push({
    text: `One signature, two keys: this signature belongs to **${keyLabel(key.mode === 'major' ? key : other)}** *and* to **${keyLabel(key.mode === 'major' ? other : key)}**. The question says which one it wants. Here it asked for the ${key.mode} key.`,
  })

  return {
    title: `Read a key signature: ${countWords(fifths)}`,
    task: `Which ${key.mode} key has this key signature (${clefWords(clef)})? It has ${countWords(fifths)}.`,
    steps,
    answer: `The ${key.mode} key is ${keyLabel(key)}.`,
  }
}

/**
 * "Write the key signature of this key." The working finds the sharp or flat key, counts how many signs by the rules,
 * names them from the usual order, and checks with the circle of fifths and with the engine. Throws if they disagree.
 */
export function signatureFromKeyExample(key: Key, clef: ClefName = 'treble'): WorkedExample {
  if (!isStandardKey(key)) throw new Error(`${keyLabel(key)} is not a standard key`)
  const fifths = fifthsByRules(key)
  const signature = keySignature(key)
  const major: NoteName = key.mode === 'major' ? key.tonic : relativeMajorOf(key.tonic)
  const majorName = `${noteLabel(major)} major`
  const kind = majorKeyKind(major)
  const n = Math.abs(fifths)
  const order = kind === 'sharps' ? SHARP_LETTERS : FLAT_LETTERS
  const signs: NoteName[] = order.slice(0, n).map((letter) => ({ letter, accidental: kind === 'sharps' ? 1 : -1 }))
  if (signs.length !== signature.accidentals.length || signs.some((s, i) => !same(s, signature.accidentals[i]!))) {
    throw new Error(`Signs for ${keyLabel(key)} disagree with the theory engine`)
  }

  const steps: WorkedStep[] = []
  if (key.mode === 'major') {
    steps.push({ text: `${keyLabel(key)} is a **major** key, so we can work with it directly.` })
  } else {
    const up = [key.tonic.letter, letterAt(letterIndex(key.tonic.letter) + 1), letterAt(letterIndex(key.tonic.letter) + 2)]
    steps.push({
      text: `${keyLabel(key)} is a **minor** key. A minor key has the same signature as its **relative major**, which starts **3 semitones above**. Count 3 letter names up from ${key.tonic.letter}: ${up.join(', ')}. The letter is ${major.letter}, and ${noteLabel(major)} is 3 semitones above ${noteLabel(key.tonic)}. So work with **${majorName}**.`,
    })
  }

  const kindText =
    kind === 'none'
      ? `C major is the one major key with **no sharps or flats**.`
      : kind === 'sharps'
        ? `Learn which major keys have sharps: **G, D, A, E, B, F♯, C♯**. ${majorName} is in that list, so it has **sharps**.`
        : `Learn which major keys have flats: **F, B♭, E♭, A♭, D♭, G♭, C♭**. ${majorName} is in that list, so it has **flats**.`
  steps.push({ text: kindText })

  if (kind === 'sharps') {
    const lastSharp = signs[n - 1]!
    const place = SHARP_LETTERS.indexOf(lastSharp.letter)
    steps.push({
      text: `**Sharps rule:** the last sharp is a **semitone below the key note**. The letter before ${major.letter} is ${lastSharp.letter}, and ${noteLabel(lastSharp)} is exactly one semitone below ${noteLabel(major)}. So the last sharp is **${noteLabel(lastSharp)}**.`,
    })
    steps.push({
      text: `Find ${lastSharp.letter} in the order **F C G D A E B**: it is letter number ${place + 1}. So the signature has **${n} sharp${n === 1 ? '' : 's'}**, and they are the first ${n} letters of the order: **${notesLabel(signs)}**.`,
    })
  } else if (kind === 'flats') {
    if (n === 1) {
      steps.push({ text: `**One flat:** F major has one flat, B♭. This one has to be learned: the flats rule below needs two flats or more.` })
    } else {
      const place = FLAT_LETTERS.indexOf(major.letter)
      const lastFlat = FLAT_LETTERS[place + 1]!
      steps.push({
        text: `**Flats rule:** the key note is the **second-to-last flat**. Find ${major.letter} in the order **B E A D G C F**: it is letter number ${place + 1}. The last flat is the one after it, letter number ${place + 2}, which is ${lastFlat}.`,
      })
      steps.push({
        text: `So the flats run from the start of the order up to ${lastFlat}: that is **${n} flats**, **${notesLabel(signs)}**.`,
      })
    }
  } else {
    steps.push({ text: `So there is nothing to write: **no sharps and no flats**.` })
  }

  if (kind !== 'none') {
    const path = circlePath({ tonic: major, mode: 'major' })
    steps.push({
      text: `Check with the circle of fifths. Start at C major, which has no signs. Each step to the key a perfect 5th ${kind === 'sharps' ? 'higher' : 'lower'} adds one ${kind === 'sharps' ? 'sharp' : 'flat'}: ${pathText(path)}. ${majorName} is ${n} step${n === 1 ? '' : 's'} from C major, so it has ${countWords(fifths)}. ✓`,
    })
  } else {
    steps.push({ text: `Check with the circle of fifths: C major is where the circle starts, with no signs at all. ✓` })
  }

  steps.push({
    text:
      n === 0
        ? `Write the signature: there is nothing after the clef. Here is the ${clefWords(clef)} for ${keyLabel(key)}, with no signs.`
        : `Write the signature: put ${n === 1 ? 'the one sign' : `all ${n} signs`} after the clef, in order: **${notesLabel(signs)}**. Here it is in ${clefWords(clef)}.`,
    staff: emptyStaff(clef, key),
  })

  return {
    title: `Write the key signature of ${keyLabel(key)}`,
    task: `Write the key signature of ${keyLabel(key)}. How many sharps or flats does it have, and which?`,
    steps,
    answer: n === 0 ? `${keyLabel(key)} has no sharps or flats.` : `${keyLabel(key)} has ${countWords(fifths)}: ${notesLabel(signs)}.`,
  }
}

