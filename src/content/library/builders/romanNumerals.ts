import {
  type Chord,
  type ChordQuality,
  type ClefName,
  type Key,
  type NoteName,
  chordFromRoman,
  chordNotes,
  keyScaleNotes,
  letterAt,
  letterIndex,
  note,
  primaryChords,
  romanNumeral,
  sameNote,
} from '../../../theory'
import { chordWords } from '../../../questions/chords'
import { keyLabel, noteLabel, notesLabel } from '../../../questions/pitchTools'
import type { WorkedExample } from '../types'
import { listenChord } from './audio'
import { chordsOnStaff } from './common'
import { assertSameNotes, chordPicture, chordSequenceAudio, qualityFromSemitones, semitoneWorking, sharedPictures } from './chords'
import { handChordSymbol } from './inversions'

/*
 * Worked examples for Roman numerals.
 * The long-hand working builds the key's scale by counting semitones, finds the chord's root in the scale,
 * and reads the numeral from its position and type. The engine's `romanNumeral` and `chordFromRoman` check it.
 */

const mod = (n: number, m: number) => ((n % m) + m) % m

const MAJOR_PATTERN = [2, 2, 1, 2, 2, 2, 1] as const
const NATURAL_MINOR_PATTERN = [2, 1, 2, 2, 1, 2, 2] as const
export const NUMERAL_LETTERS = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII'] as const

/**
 * The scale of a key, built by counting semitones from the key note with the tone and semitone pattern
 * (major, or natural minor). Checked against the engine.
 */
export function scaleByCounting(key: Key): NoteName[] {
  const pattern = key.mode === 'major' ? MAJOR_PATTERN : NATURAL_MINOR_PATTERN
  const notes: NoteName[] = [key.tonic]
  for (let i = 1; i < 7; i++) {
    const previous = notes[i - 1]!
    const letter = letterAt(letterIndex(key.tonic.letter) + i)
    const gap = semitoneWorking(previous, note(letter, 0)).total
    const accidental = mod(pattern[i - 1]! - gap + 6, 12) - 6
    if (Math.abs(accidental) > 2) throw new Error('A scale never needs more than a double sharp or flat')
    notes.push(note(letter, accidental))
  }
  assertSameNotes(`${keyLabel(key)} scale`, notes, keyScaleNotes(key, 'natural'))
  return notes
}

/** "1 G, 2 A, 3 B ..." for numbering the scale in a step. */
export function numberedScale(scale: readonly NoteName[]): string {
  return scale.map((n, i) => `${i + 1} ${noteLabel(n)}`).join(', ')
}

const scaleName = (key: Key) => (key.mode === 'major' ? `${keyLabel(key)}` : `${keyLabel(key)} (natural minor scale)`)

/** Hand-written: the chord types a numeral can stand for here. */
function numeralSuffix(quality: ChordQuality): { lower: boolean; suffix: string } {
  switch (quality) {
    case 'major':
      return { lower: false, suffix: '' }
    case 'minor':
      return { lower: true, suffix: '' }
    case 'diminished':
      return { lower: true, suffix: '°' }
    case 'dominant7':
      return { lower: false, suffix: '7' }
    default:
      throw new Error(`Numeral working does not cover ${quality} chords`)
  }
}

export interface NumeralAnalysis {
  readonly scale: NoteName[]
  /** 1 to 7 */
  readonly degree: number
  readonly numeral: string
  /** Notes of the chord that are not in the scale (only the raised 7th of a minor key is allowed). */
  readonly outside: NoteName[]
  readonly leadingNote: boolean
}

/** The numeral for a root-position chord in a key, found long-hand and checked against the engine. */
export function numeralLongHand(key: Key, chord: Chord): NumeralAnalysis {
  const scale = scaleByCounting(key)
  const index = scale.findIndex((n) => n.letter === chord.root.letter)
  const delta = chord.root.accidental - scale[index]!.accidental
  const { lower, suffix } = numeralSuffix(chord.quality)
  const leadingNote = key.mode === 'minor' && index === 6 && delta === 1 && chord.quality === 'diminished'
  if (delta !== 0 && !leadingNote) throw new RangeError('This chord is not built on a note of the key, which this working does not cover')
  const letters = NUMERAL_LETTERS[index]!
  const numeral = `${lower ? letters.toLowerCase() : letters}${suffix}`
  const outside = chordNotes(chord).filter((n) => !scale.some((s) => sameNote(s, n)))
  if (outside.length > 1 || (outside.length === 1 && !(key.mode === 'minor' && outside[0]!.letter === scale[6]!.letter && outside[0]!.accidental === scale[6]!.accidental + 1))) {
    throw new RangeError('The chord has notes that are not in the key, which this working does not cover')
  }
  const engine = romanNumeral(key, chord)
  if (engine !== numeral) throw new Error(`Numeral working gives ${numeral} but the theory engine gives ${engine}`)
  return { scale, degree: index + 1, numeral, outside, leadingNote }
}

const NUMBERS_TEXT = 'I is 1, II is 2, III is 3, IV is 4, V is 5, VI is 6, VII is 7'

function quickName(counts: readonly number[], root: NoteName, quality: ChordQuality, notes: readonly NoteName[]): string {
  const parts = notes
    .slice(1)
    .map((n, i) => `${noteLabel(n)} is ${counts[i]}`)
    .join(', ')
  const rule =
    counts.length === 2
      ? 'For the 3rd and 5th: major is 4 and 7; minor is 3 and 7; diminished is 3 and 6'
      : 'For the 3rd, 5th and 7th: dominant 7th is 4, 7 and 10'
  return `From the root ${noteLabel(root)} count the semitones up to each other note: ${parts} (semitones above the root). ${rule}. So the chord is **${chordWords({ root, quality })}**.`
}

/**
 * "What is the Roman numeral of this chord in this key?" for a root-position chord.
 * Working: scale by counting, find the root's number, read the numeral from its type.
 * Cross-check: the engine's `romanNumeral`.
 */
export function romanNumeralExample(key: Key, chord: Chord, clef: ClefName = 'treble'): WorkedExample {
  const a = numeralLongHand(key, chord)
  const notes = chordNotes(chord)
  const counts = notes.slice(1).map((n) => semitoneWorking(chord.root, n).total)
  if (qualityFromSemitones(counts) !== chord.quality) throw new Error('Semitone counts do not give the chord type')
  const pitches = chordPicture(chord, clef)
  const kName = keyLabel(key)
  const symbol = handChordSymbol(chord, 0)
  const words = chordWords(chord)
  const ordinalWord = ['1st', '2nd', '3rd', '4th', '5th', '6th', '7th'][a.degree - 1]!
  const { lower, suffix } = numeralSuffix(chord.quality)
  const caseText =
    chord.quality === 'major'
      ? 'The chord is **major**, so the numeral is in **capital letters**.'
      : chord.quality === 'minor'
        ? 'The chord is **minor**, so the numeral is in **small letters** (lower case).'
        : chord.quality === 'diminished'
          ? 'The chord is **diminished**, so the numeral is in **small letters** with a little circle **°** after it.'
          : 'The chord is a **dominant 7th**, so the numeral is in **capital letters** with a **7** after it.'
  const rootText = a.leadingNote
    ? `The root is ${noteLabel(chord.root)}. The scale has ${noteLabel(a.scale[6]!)} as its note 7, and ${noteLabel(chord.root)} is one semitone higher: the **raised 7th**. Minor keys use this raised note (the *leading note*) all the time, and it still counts as note **7**. The numeral letters are **${NUMERAL_LETTERS[6]}**. (${NUMBERS_TEXT}.)`
    : `The root is ${noteLabel(chord.root)}. In the scale, **${noteLabel(chord.root)} is note ${a.degree}**, the ${ordinalWord} note. The Roman numeral letters match the note number (${NUMBERS_TEXT}). So the letters are **${NUMERAL_LETTERS[a.degree - 1]}**.`
  const checkText =
    a.outside.length === 0
      ? `Check: every note of the chord, ${notesLabel(notes)}, appears in the scale of ${kName}. Chords made from a key's own notes are the ones numerals are for. ✓`
      : `Check: ${notesLabel(notes.filter((n) => !a.outside.some((o) => sameNote(o, n))))} are all in the scale. The one other note, ${noteLabel(a.outside[0]!)}, is the raised 7th, which minor keys borrow on purpose to make this chord. ✓`
  return {
    title: `Find the Roman numeral of ${words} in ${kName}`,
    task: `The key is ${kName}. What is the Roman numeral of the chord ${words} (symbol ${symbol})?`,
    steps: [
      {
        text: `Name the chord. It is in root position, so the lowest note is the root. The notes are **${notesLabel(notes)}**. ${quickName(counts, chord.root, chord.quality, notes)}`,
        staff: chordsOnStaff(clef, [pitches], key),
        listen: listenChord(`Hear ${symbol}`, pitches),
      },
      {
        text: `Write out the scale of ${scaleName(key)} and number the notes: **${numberedScale(a.scale)}**. (If you need to, build it with the method in the Major scales or Minor scales lesson.)`,
      },
      { text: rootText },
      { text: `Choose capital or small letters. ${caseText}` },
      {
        text: `Put it together: the letters **${NUMERAL_LETTERS[a.degree - 1]}**${lower ? ', in small letters' : ', in capitals'}${suffix ? `, plus **${suffix}**` : ''}. The numeral is **${a.numeral}**.`,
      },
      { text: checkText },
    ],
    answer: `In ${kName}, ${words} (${symbol}) is ${a.numeral}.`,
  }
}

const NUMERAL_RE = /^(VII|VI|IV|V|III|II|I|vii|vi|iv|v|iii|ii|i)(°|7)?$/

export interface NumeralBuild {
  readonly scale: NoteName[]
  readonly degree: number
  readonly quality: ChordQuality
  readonly usedRaised: boolean
  readonly numbers: number[]
  readonly notes: NoteName[]
  readonly counts: number[]
  readonly chord: Chord
}

/** The chord for a numeral, built long-hand by stacking scale notes in thirds, and checked against the engine. */
export function buildFromNumeral(key: Key, numeral: string): NumeralBuild {
  const match = NUMERAL_RE.exec(numeral)
  if (!match) throw new SyntaxError(`Not a numeral this working covers: ${numeral}`)
  const letters = match[1]!
  const mark = match[2] ?? ''
  const upper = letters === letters.toUpperCase()
  const degree = NUMERAL_LETTERS.indexOf(letters.toUpperCase() as (typeof NUMERAL_LETTERS)[number]) + 1
  const quality: ChordQuality = mark === '°' ? 'diminished' : mark === '7' ? 'dominant7' : upper ? 'major' : 'minor'
  if ((mark === '°' && upper) || (mark === '7' && !upper)) throw new SyntaxError(`Not a numeral this working covers: ${numeral}`)
  const scale = scaleByCounting(key)
  const usedRaised = key.mode === 'minor' && ((degree === 5 && upper) || (degree === 7 && quality === 'diminished'))
  const used = scale.map((n, i) => (usedRaised && i === 6 ? note(n.letter, n.accidental + 1) : n))
  const count = quality === 'dominant7' ? 4 : 3
  const numbers = Array.from({ length: count }, (_, k) => ((degree - 1 + 2 * k) % 7) + 1)
  const notes = numbers.map((n) => used[n - 1]!)
  const counts = notes.slice(1).map((n) => semitoneWorking(notes[0]!, n).total)
  const found = qualityFromSemitones(counts)
  if (found !== quality) throw new Error(`Stacking thirds for ${numeral} in ${keyLabel(key)} gives ${found}, not ${quality}`)
  const chord: Chord = { root: notes[0]!, quality }
  const engine = chordFromRoman(key, numeral)
  if (engine.inversion !== 0 || engine.chord.quality !== quality || !sameNote(engine.chord.root, chord.root)) {
    throw new Error(`Working gives ${chordWords(chord)} for ${numeral} in ${keyLabel(key)} but the engine disagrees`)
  }
  assertSameNotes(`${numeral} in ${keyLabel(key)}`, notes, chordNotes(engine.chord))
  return { scale, degree, quality, usedRaised, numbers, notes, counts, chord }
}

const RAISED_TEXT = 'In a minor key, V and vii° are built with the 7th note raised by a semitone (the leading note). Without that, V would be a minor chord.'

/**
 * "Write the chord for this Roman numeral in this key."
 * Working: number the scale, find the root, stack every other scale note, check the type.
 * Cross-check: the engine's `chordFromRoman`.
 */
export function chordFromNumeralExample(key: Key, numeral: string, clef: ClefName = 'treble'): WorkedExample {
  const b = buildFromNumeral(key, numeral)
  const kName = keyLabel(key)
  const symbol = handChordSymbol(b.chord, 0)
  const pitches = chordPicture(b.chord, clef)
  const root = b.notes[0]!
  const typeText =
    b.quality === 'major'
      ? 'capital letters, so a **major** chord'
      : b.quality === 'minor'
        ? 'small letters, so a **minor** chord'
        : b.quality === 'diminished'
          ? 'small letters with a **°**, so a **diminished** chord'
          : 'capital letters with a **7**, so a **dominant 7th** chord'
  const lettersOnly = numeral.replace(/[°7]/g, '')
  const stackNames = b.notes.map((n) => noteLabel(n))
  const roles = b.numbers.map((n, i) => `${n} (${noteLabel(b.notes[i]!)})`).join(', ')
  return {
    title: `Write the chord for ${numeral} in ${kName}`,
    task: `In ${kName}, write the chord with the Roman numeral ${numeral}.`,
    steps: [
      {
        text: `Read the numeral **${numeral}**. The letters **${lettersOnly}** are a number: ${NUMBERS_TEXT}. So the root of the chord is **note ${b.degree}** of the scale. The numeral is in ${typeText}.`,
      },
      { text: `Write out the scale of ${scaleName(key)} and number the notes: **${numberedScale(b.scale)}**.` },
      {
        text: `Find note ${b.degree}: it is **${noteLabel(root)}**. That is the root of the chord.`,
      },
      {
        text: `Build the chord by stacking thirds **using only the notes of the key**. Start on note ${b.degree}, skip one note, take the next, and so on. The note numbers are ${b.numbers.join(', ')}.${
          b.usedRaised ? ` ${RAISED_TEXT} Here that means note 7 is ${noteLabel(b.scale[6]!)} raised to **${noteLabel(note(b.scale[6]!.letter, b.scale[6]!.accidental + 1))}**.` : ''
        } The notes are **${stackNames.join(', ')}**.`,
        staff: chordsOnStaff(clef, [pitches], key),
        listen: listenChord(`Hear ${symbol}`, pitches),
      },
      {
        text: `Check the type by counting semitones from the root ${noteLabel(root)}: ${b.notes
          .slice(1)
          .map((n, i) => `${noteLabel(n)} is ${b.counts[i]}`)
          .join(', ')}. ${b.quality === 'major' ? '4 and 7 is major' : b.quality === 'minor' ? '3 and 7 is minor' : b.quality === 'diminished' ? '3 and 6 is diminished' : '4, 7 and 10 is a dominant 7th'}, which matches the numeral ✓.`,
      },
      {
        text: `Write the answer: the chord is **${chordWords(b.chord)}**, symbol **${symbol}**, notes **${notesLabel(b.notes)}**. Note numbers used: ${roles}.`,
      },
    ],
    answer: `In ${kName}, ${numeral} is ${symbol}: ${notesLabel(b.notes)}.`,
  }
}

/**
 * "What are the primary chords in this key?" (I, IV and V; i, iv and V in a minor key).
 * Working: stack scale notes for each. Cross-check: the engine's `primaryChords`.
 */
export function primaryChordsExample(key: Key, clef: ClefName = 'treble'): WorkedExample {
  const numerals = key.mode === 'major' ? ['I', 'IV', 'V'] : ['i', 'iv', 'V']
  const builds = numerals.map((n) => buildFromNumeral(key, n))
  const engine = primaryChords(key)
  builds.forEach((b, i) => {
    const e = engine[i]!
    if (e.chord.quality !== b.chord.quality || !sameNote(e.chord.root, b.chord.root) || e.numeral !== numerals[i]) {
      throw new Error(`Primary chord ${numerals[i]} in ${keyLabel(key)} disagrees with the engine`)
    }
  })
  const kName = keyLabel(key)
  const symbols = builds.map((b) => handChordSymbol(b.chord, 0))
  const pictures = sharedPictures(
    builds.map((b) => b.chord),
    clef,
  )
  const scale = builds[0]!.scale
  const describe = (i: number) => {
    const b = builds[i]!
    return `**${numerals[i]}**: start on note ${b.degree}, take every other note: note numbers ${b.numbers.join(', ')}, which are **${notesLabel(b.notes)}**. It is ${symbols[i]}, a ${b.quality} chord.${
      b.usedRaised ? ` (Note 7, ${noteLabel(scale[6]!)}, is raised to ${noteLabel(b.notes[1]!)} for V in a minor key.)` : ''
    }`
  }
  return {
    title: `The primary chords in ${kName}`,
    task: `Write the three primary chords of ${kName}, with their Roman numerals.`,
    steps: [
      { text: `Write out the scale of ${scaleName(key)} and number the notes: **${numberedScale(scale)}**.` },
      {
        text: `The primary chords are built on notes **1**, **4** and **5** of the scale: ${numerals.join(', ')}. In ${kName} those roots are ${noteLabel(scale[0]!)}, ${noteLabel(scale[3]!)} and ${noteLabel(scale[4]!)}.${
          key.mode === 'minor' ? ' In a minor key the chord on note 5 is written V in capitals, because it is a major chord here (see the facts above).' : ''
        }`,
      },
      { text: `Build the first chord by stacking thirds from note 1. ${describe(0)}` },
      { text: `Build the second chord from note 4. ${describe(1)}` },
      { text: `Build the third chord from note 5. ${describe(2)}` },
      {
        text: `Check the types by counting semitones from each root. ${builds
          .map((b, i) => `${numerals[i]}: ${b.counts.join(' and ')} ${b.quality === 'major' ? '(major)' : '(minor)'}`)
          .join('; ')}. ${key.mode === 'major' ? 'All three primary chords of a major key are major, which is why they are all capitals.' : 'In this minor key i and iv are minor (small letters) and V is major (capital).'} ✓`,
      },
      {
        text: `Here are the three chords on the staff with the key signature of ${kName}, followed by the sound (${symbols.join(', ')} one after another).`,
        staff: chordsOnStaff(clef, pictures, key),
        listen: { label: `Hear ${numerals.join(' ')}`, audio: chordSequenceAudio(pictures) },
      },
    ],
    answer: `The primary chords of ${kName} are ${numerals.map((n, i) => `${n} = ${symbols[i]}`).join(', ')}.`,
  }
}
