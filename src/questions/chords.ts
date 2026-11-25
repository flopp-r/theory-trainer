import {
  CHORD_QUALITY_LABELS,
  type Chord,
  type ChordQuality,
  type ClefName,
  type Key,
  type NoteName,
  type Pitch,
  chordNotes,
  chordPitches,
  chordSymbol,
  diatonicChords,
  enharmonicSpellings,
  intervalBetween,
  intervalName,
  inversionFigure,
  inversionName,
  keyName,
  letterAt,
  letterIndex,
  note,
  pitch,
  withoutOctave,
} from '../theory'
import { at } from '../theory/util'
import { clefTags } from './noteName'
import { capitalise, multipleChoice, withArticle } from './helpers'
import { bestOctave, keyLabel, keysForDifficulty, noteLabel, notesLabel } from './pitchTools'
import type { Difficulty, Question, QuestionContext, QuestionGenerator } from './types'
import type { Rng } from './rng'

const TRIADS: ChordQuality[] = ['major', 'minor', 'diminished', 'augmented']
const SEVENTHS: ChordQuality[] = ['dominant7', 'major7', 'minor7', 'half-diminished7', 'diminished7']

/** A chord symbol with proper sharp and flat signs, e.g. "B♭m7" or "C/E". */
export function symbolLabel(c: Chord, inversion = 0): string {
  return chordSymbol(c, { inversion, style: 'symbol' })
}

/** ASCII symbol for ids. */
function symbolId(c: Chord, inversion = 0): string {
  return chordSymbol(c, { inversion })
}

/** "D minor", "B♭ dominant 7th". */
function chordWords(c: Chord): string {
  return `${noteLabel(c.root)} ${CHORD_QUALITY_LABELS[c.quality]}`
}

/** Highest accidental count allowed on any chord note at each level. */
function maxAccidental(difficulty: Difficulty): number {
  return difficulty === 3 ? 2 : 1
}

/** A random chord for the level. Every note is within the accidental limit so it stays readable. */
function randomChord(rng: Rng, difficulty: Difficulty, qualities: readonly ChordQuality[]): Chord {
  const letters = ['C', 'D', 'E', 'F', 'G', 'A', 'B'] as const
  for (let attempt = 0; attempt < 500; attempt++) {
    // Level 1 uses plain roots; later levels also use sharp and flat roots.
    const root = note(rng.pick(letters), difficulty === 1 ? 0 : rng.pick([0, 0, 0, 1, -1]))
    const quality = rng.pick(qualities)
    const chord: Chord = { root, quality }
    if (chordNotes(chord).every((n) => Math.abs(n.accidental) <= maxAccidental(difficulty))) return chord
  }
  throw new Error('Could not build a chord within the accidental limit')
}

/** The chord as pitches on the staff, in the best octave for the clef. */
export function chordOnStaff(chord: Chord, clef: ClefName, inversion = 0): Pitch[] {
  const octave = bestOctave(clef, (o) => chordPitches(chord, { inversion, bassOctave: o }))
  return chordPitches(chord, { inversion, bassOctave: octave })
}

/** How the chord is built, in words. */
const RECIPE: Record<ChordQuality, string> = {
  major: 'root, major 3rd and perfect 5th',
  minor: 'root, minor 3rd and perfect 5th',
  diminished: 'root, minor 3rd and diminished 5th',
  augmented: 'root, major 3rd and augmented 5th',
  dominant7: 'a major triad with a minor 7th added',
  major7: 'a major triad with a major 7th added',
  minor7: 'a minor triad with a minor 7th added',
  'half-diminished7': 'a diminished triad with a minor 7th added',
  diminished7: 'a diminished triad with a diminished 7th added',
}

function triadQualitiesFor(difficulty: Difficulty): ChordQuality[] {
  return difficulty === 1 ? ['major', 'minor'] : difficulty === 2 ? ['major', 'minor', 'diminished'] : TRIADS
}

/** The two stacked thirds of a triad, named. */
function thirdsDescription(pitches: readonly Pitch[]): string {
  const names = pitches.map((p) => noteLabel(withoutOctave(p)))
  const parts: string[] = []
  for (let i = 1; i < pitches.length; i++) {
    const { interval } = intervalBetween(at(pitches, i - 1), at(pitches, i))
    parts.push(`${names[i - 1]} to ${names[i]} is ${withArticle(intervalName(interval))}`)
  }
  return parts.join(', ')
}

function generateTriadOnStaff(ctx: QuestionContext): Question {
  const { rng } = ctx
  const clef = rng.pick(ctx.clefs)
  const qualities = triadQualitiesFor(ctx.difficulty)
  const chord = randomChord(rng, ctx.difficulty, qualities)
  const pitches = chordOnStaff(chord, clef)
  const correct = chord.quality
  const { input } = multipleChoice(rng, correct, qualities, { count: qualities.length, layout: 'grid', fixedOrder: true })
  const stack: Record<string, string> = {
    major: 'a major 3rd with a minor 3rd on top',
    minor: 'a minor 3rd with a major 3rd on top',
    diminished: 'two minor 3rds',
    augmented: 'two major 3rds',
  }
  return {
    id: `triad-on-staff:${clef}:${symbolId(chord)}`,
    type: 'triad-on-staff',
    topic: 'chords',
    category: 'Triad types',
    itemLabel: `${symbolLabel(chord)} triad (${clef} clef)`,
    tags: clefTags(clef),
    prompt: 'What type of triad is this?',
    notation: { staves: [{ clef, items: [{ kind: 'notes', pitches }] }] },
    audio: null,
    input,
    correct,
    answerText: `It is ${withArticle(correct)} triad.`,
    explanation: `A triad is three notes stacked in thirds. Here ${thirdsDescription(pitches)}. ${capitalise(stack[correct]!)} makes a ${correct} triad: ${chordWords(chord)} (${notesLabel(chordNotes(chord))}).`,
  }
}

export const triadOnStaffGenerator: QuestionGenerator = {
  type: 'triad-on-staff',
  topic: 'chords',
  label: 'Triad types',
  generate: generateTriadOnStaff,
}

function seventhQualitiesFor(difficulty: Difficulty): ChordQuality[] {
  return difficulty === 1 ? SEVENTHS.slice(0, 3) : difficulty === 2 ? SEVENTHS.slice(0, 4) : SEVENTHS
}

const SEVENTH_LABEL: Record<string, string> = {
  dominant7: 'dominant 7th',
  major7: 'major 7th',
  minor7: 'minor 7th',
  'half-diminished7': 'half-diminished 7th',
  diminished7: 'diminished 7th',
}

function generateSeventhOnStaff(ctx: QuestionContext): Question {
  const { rng } = ctx
  const clef = rng.pick(ctx.clefs)
  const qualities = seventhQualitiesFor(ctx.difficulty)
  const chord = randomChord(rng, ctx.difficulty, qualities)
  const pitches = chordOnStaff(chord, clef)
  const correct = SEVENTH_LABEL[chord.quality]!
  const labels = qualities.map((q) => SEVENTH_LABEL[q]!)
  const { input } = multipleChoice(rng, correct, labels, { count: labels.length, layout: 'list', fixedOrder: true })
  const top = intervalBetween(at(pitches, 0), at(pitches, 3)).interval
  return {
    id: `seventh-on-staff:${clef}:${symbolId(chord)}`,
    type: 'seventh-on-staff',
    topic: 'chords',
    category: '7th chords',
    itemLabel: `${symbolLabel(chord)} (${clef} clef)`,
    tags: clefTags(clef),
    prompt: 'What type of 7th chord is this?',
    notation: { staves: [{ clef, items: [{ kind: 'notes', pitches }] }] },
    audio: null,
    input,
    correct,
    answerText: `It is ${withArticle(correct)}.`,
    explanation: `The top note is ${withArticle(intervalName(top))} above the root (${noteLabel(chord.root)}). A ${correct} chord is ${RECIPE[chord.quality]}: ${chordWords(chord)} (${notesLabel(chordNotes(chord))}).`,
  }
}

export const seventhOnStaffGenerator: QuestionGenerator = {
  type: 'seventh-on-staff',
  topic: 'chords',
  label: '7th chord types',
  generate: generateSeventhOnStaff,
}

function qualitiesForBuilding(difficulty: Difficulty): ChordQuality[] {
  return difficulty === 1 ? ['major', 'minor'] : difficulty === 2 ? TRIADS : [...TRIADS, ...SEVENTHS]
}

/** The chord's notes with one note replaced by its enharmonic twin: right sound, wrong spelling. */
function respellOneNote(chord: Chord, rng: Rng): NoteName[] | null {
  const notes = chordNotes(chord)
  const indexes = rng.shuffle(notes.map((_, i) => i).filter((i) => i > 0))
  for (const i of indexes) {
    const n = at(notes, i)
    const twin = enharmonicSpellings(pitch(n.letter, n.accidental, 4), 1)[0]
    if (twin) {
      const copy = [...notes]
      copy[i] = withoutOctave(twin)
      return copy
    }
  }
  return null
}

function generateChordNotes(ctx: QuestionContext): Question {
  const { rng } = ctx
  const qualities = qualitiesForBuilding(ctx.difficulty)
  const chord = randomChord(rng, ctx.difficulty, qualities)
  const correct = notesLabel(chordNotes(chord))
  const wrong: string[] = []
  const respelled = respellOneNote(chord, rng)
  if (respelled) wrong.push(notesLabel(respelled))
  for (const q of qualities.filter((x) => x !== chord.quality)) wrong.push(notesLabel(chordNotes({ root: chord.root, quality: q })))
  // A chord with the same quality built on the note above or below.
  for (const d of [-1, 1]) {
    const root = note(letterAt(letterIndex(chord.root.letter) + d), chord.root.accidental)
    wrong.push(notesLabel(chordNotes({ root, quality: chord.quality })))
  }
  const { input } = multipleChoice(rng, correct, wrong, { layout: 'list', prefer: wrong.slice(0, 2) })
  return {
    id: `chord-notes:${symbolId(chord)}`,
    type: 'chord-notes',
    topic: 'chords',
    category: 'Building chords',
    itemLabel: `${symbolLabel(chord)} notes`,
    tags: ['aqa-candidate'],
    prompt: `Which notes make up ${symbolLabel(chord)} (${chordWords(chord)})?`,
    notation: null,
    audio: null,
    input,
    correct,
    answerText: `${symbolLabel(chord)} is ${correct}.`,
    explanation: `${chordWords(chord)} is ${RECIPE[chord.quality]}. From ${noteLabel(chord.root)}: ${correct}.`,
  }
}

export const chordNotesGenerator: QuestionGenerator = {
  type: 'chord-notes',
  topic: 'chords',
  label: 'Building chords',
  generate: generateChordNotes,
}

function generateChordSymbol(ctx: QuestionContext): Question {
  const { rng } = ctx
  const clef = rng.pick(ctx.clefs)
  const qualities = qualitiesForBuilding(ctx.difficulty)
  const chord = randomChord(rng, ctx.difficulty, qualities)
  const size = chordNotes(chord).length
  const inversion = ctx.difficulty === 3 ? rng.int(0, size - 1) : 0
  const pitches = chordOnStaff(chord, clef, inversion)
  const correct = symbolLabel(chord, inversion)
  const wrong: string[] = []
  // Same root, other quality (and the same bass note if inverted, where it exists).
  for (const q of qualities.filter((x) => x !== chord.quality)) {
    const other: Chord = { root: chord.root, quality: q }
    wrong.push(symbolLabel(other, inversion < chordNotes(other).length ? inversion : 0))
  }
  // Same quality on an enharmonic root (G♭ instead of F♯): right sound, wrong spelling.
  const twin = enharmonicSpellings(pitch(chord.root.letter, chord.root.accidental, 4), 1)[0]
  if (twin) wrong.push(symbolLabel({ root: withoutOctave(twin), quality: chord.quality }, 0))
  // Same quality on a neighbouring root.
  for (const d of [-1, 1]) {
    wrong.push(symbolLabel({ root: note(letterAt(letterIndex(chord.root.letter) + d), chord.root.accidental), quality: chord.quality }, 0))
  }
  // For an inverted chord the root position symbol is a classic wrong answer.
  const rootPosition = inversion > 0 ? [symbolLabel(chord, 0)] : []
  const { input } = multipleChoice(rng, correct, [...rootPosition, ...wrong], { layout: 'grid', prefer: [...rootPosition, wrong[0]!] })
  const base =
    inversion === 0
      ? `The notes ${notesLabel(pitches.map(withoutOctave))} are stacked in thirds from ${noteLabel(chord.root)}: ${chordWords(chord)} is ${RECIPE[chord.quality]}, so the symbol is ${correct}.`
      : `The notes are ${chordWords(chord)} (${notesLabel(chordNotes(chord))}) with ${noteLabel(at(chordNotes(chord), inversion))} in the bass, so it is written ${correct}.`
  return {
    id: `chord-symbol:${clef}:${symbolId(chord, inversion)}`,
    type: 'chord-symbol',
    topic: 'chords',
    category: 'Chord symbols',
    itemLabel: `${correct} (${clef} clef)`,
    tags: clefTags(clef),
    prompt:
      ctx.difficulty === 3
        ? 'What is the chord symbol for this chord? (If the lowest note is not the root, add a slash and the bass note.)'
        : 'What is the chord symbol for this chord?',
    notation: { staves: [{ clef, items: [{ kind: 'notes', pitches }] }] },
    audio: null,
    input,
    correct,
    answerText: `It is ${correct}.`,
    explanation: base,
  }
}

export const chordSymbolGenerator: QuestionGenerator = {
  type: 'chord-symbol',
  topic: 'chords',
  label: 'Chord symbols',
  generate: generateChordSymbol,
}

function generateInversion(ctx: QuestionContext): Question {
  const { rng } = ctx
  const clef = rng.pick(ctx.clefs)
  const sevenths = ctx.difficulty === 3
  const chord = randomChord(rng, ctx.difficulty, sevenths ? SEVENTHS : TRIADS.slice(0, ctx.difficulty === 1 ? 2 : 3))
  const size = chordNotes(chord).length
  const inversion = rng.int(0, size - 1)
  const pitches = chordOnStaff(chord, clef, inversion)
  const names = Array.from({ length: size }, (_, i) => inversionName(i))
  const correct = inversionName(inversion)
  const { input } = multipleChoice(rng, correct, names, { count: size, layout: 'grid', fixedOrder: true })
  const bass = at(chordNotes(chord), inversion)
  const position = ['root', '3rd', '5th', '7th'][inversion]!
  return {
    id: `inversion:${clef}:${symbolId(chord, inversion)}`,
    type: 'inversion',
    topic: 'chords',
    category: 'Inversions',
    itemLabel: `${symbolLabel(chord, inversion)} (${clef} clef)`,
    tags: clefTags(clef),
    prompt: 'Which inversion is this chord?',
    notation: { staves: [{ clef, items: [{ kind: 'notes', pitches }] }] },
    audio: null,
    input,
    correct,
    answerText: `It is in ${correct}.`,
    explanation: `The chord is ${chordWords(chord)} (${notesLabel(chordNotes(chord))}). The lowest note is ${noteLabel(bass)}, the ${position} of the chord, so it is in ${correct}. (Figured bass: ${inversionFigure(chord.quality, inversion)}.)`,
  }
}

export const inversionGenerator: QuestionGenerator = {
  type: 'inversion',
  topic: 'chords',
  label: 'Inversions',
  generate: generateInversion,
}

/** The same numeral with upper and lower case swapped: ii <-> II, V <-> v. A classic mistake. */
function swapNumeralCase(numeral: string): string {
  const match = /^([♯♭]?)([IVivx]+)(.*)$/.exec(numeral)
  if (!match) return numeral
  const letters = match[2]!
  const swapped = letters === letters.toUpperCase() ? letters.toLowerCase() : letters.toUpperCase()
  return `${match[1]}${swapped}${match[3]}`
}

interface NumeralEntry {
  readonly numeral: string
  readonly chord: Chord
}

/** The chords that can be asked about in a key at a level. */
function numeralPool(key: Key, difficulty: Difficulty): NumeralEntry[] {
  const harmonic = diatonicChords(key, { form: 'harmonic' })
  const natural = diatonicChords(key, { form: 'natural' })
  const pick = (list: ReturnType<typeof diatonicChords>, degrees: number[]) =>
    list.filter((d) => degrees.includes(d.degree)).map((d) => ({ numeral: d.numeral, chord: d.chord }))
  if (key.mode === 'major') {
    if (difficulty === 1) return pick(natural, [1, 2, 4, 5, 6])
    if (difficulty === 2) return pick(natural, [1, 2, 3, 4, 5, 6, 7])
    return [...pick(natural, [1, 2, 3, 4, 5, 6, 7]), ...diatonicChords(key, { sevenths: true }).filter((d) => [2, 5].includes(d.degree)).map((d) => ({ numeral: d.numeral, chord: d.chord }))]
  }
  if (difficulty === 1) return [...pick(natural, [1, 4, 6]), ...pick(harmonic, [5])]
  if (difficulty === 2) return [...pick(natural, [1, 2, 3, 4, 6, 7]), ...pick(harmonic, [5, 7])]
  return [...pick(natural, [1, 2, 3, 4, 5, 6, 7]), ...pick(harmonic, [5, 7]), ...diatonicChords(key, { sevenths: true, form: 'harmonic' }).filter((d) => d.degree === 5).map((d) => ({ numeral: d.numeral, chord: d.chord }))]
}

function generateRomanNumeral(ctx: QuestionContext): Question {
  const { rng } = ctx
  const clef = rng.pick(ctx.clefs)
  const mode = ctx.difficulty === 1 ? 'major' : rng.pick(['major', 'minor'] as const)
  const key = rng.pick(keysForDifficulty(mode, ctx.difficulty))
  const pool = numeralPool(key, ctx.difficulty)
  const entry = rng.pick(pool)
  const kName = keyLabel(key)
  const degreeOf = (n: NoteName) => letterIndex(n.letter) - letterIndex(key.tonic.letter)
  const degree = ((degreeOf(entry.chord.root) % 7) + 7) % 7 + 1
  const ordinal = ['1st', '2nd', '3rd', '4th', '5th', '6th', '7th'][degree - 1]!

  if (rng.next() < 0.5) {
    // Chord on the staff -> numeral.
    const pitches = chordOnStaff(entry.chord, clef)
    const correct = entry.numeral
    const wrong = [swapNumeralCase(correct), ...pool.map((e) => e.numeral)]
    const { input } = multipleChoice(rng, correct, wrong, { layout: 'grid', prefer: [swapNumeralCase(correct)] })
    return {
      id: `roman-numeral:numeral:${keyName(key)}:${clef}:${correct}`,
      type: 'roman-numeral',
      topic: 'chords',
      category: 'Roman numerals',
      itemLabel: `${correct} in ${kName}`,
      tags: clefTags(clef),
      prompt: `The key is ${kName}. What is the Roman numeral of this chord?`,
      notation: { staves: [{ clef, key, items: [{ kind: 'notes', pitches }] }] },
      audio: null,
      input,
      correct,
      answerText: `It is ${correct}.`,
      explanation: `The chord is ${symbolLabel(entry.chord)} (${chordWords(entry.chord)}). In ${kName}, ${noteLabel(entry.chord.root)} is the ${ordinal} note, so the numeral is ${correct}. Upper case means major, lower case means minor${correct.includes('°') ? ', and ° means diminished' : ''}.`,
    }
  }

  // Numeral -> chord symbol.
  const correct = symbolLabel(entry.chord)
  const wrong = pool.map((e) => symbolLabel(e.chord))
  const { input } = multipleChoice(rng, correct, wrong, { layout: 'grid' })
  return {
    id: `roman-numeral:chord:${keyName(key)}:${entry.numeral}`,
    type: 'roman-numeral',
    topic: 'chords',
    category: 'Roman numerals',
    itemLabel: `${entry.numeral} in ${kName}`,
    tags: ['aqa-candidate'],
    prompt: `In ${kName}, which chord is ${entry.numeral}?`,
    notation: null,
    audio: null,
    input,
    correct,
    answerText: `${entry.numeral} in ${kName} is ${correct}.`,
    explanation: `${entry.numeral} is built on the ${ordinal} note of ${kName}, which is ${noteLabel(entry.chord.root)}. ${chordWords(entry.chord)}: ${correct} (${notesLabel(chordNotes(entry.chord))}). Upper-case numerals are major chords; lower-case ones are minor or diminished.`,
  }
}

export const romanNumeralGenerator: QuestionGenerator = {
  type: 'roman-numeral',
  topic: 'chords',
  label: 'Roman numerals',
  generate: generateRomanNumeral,
}

