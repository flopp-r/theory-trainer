import {
  type Chord,
  type ChordQuality,
  type ClefName,
  type Key,
  type NoteName,
  chordFromRoman,
  chordNotes,
  keyScaleNotes,
  keySignature,
  letterAt,
  letterIndex,
  note,
  primaryChords,
  romanNumeral,
  sameNote,
  withoutOctave,
} from '../../../theory'
import { chordWords } from '../../../questions/chords'
import { keyLabel, noteLabel, notesLabel } from '../../../questions/pitchTools'
import type { WorkedExample, WorkedStep, WorkedTerm } from '../types'
import { listenChord } from './audio'
import { chordsOnStaff } from './common'
import {
  type Role,
  Explained,
  ROLES,
  TERM,
  TRIAD_TABLE_TEXT,
  andList,
  assertSameNotes,
  capital,
  chordPicture,
  countsText,
  spokenNote,
  chordSequenceAudio,
  chordTypeTerm,
  countStep,
  finish,
  intervalTerm,
  nameNotesStep,
  neighbourWalks,
  qualityFromSemitones,
  qualityPhrase,
  semitoneWorking,
  sharedPictures,
  signTerms,
  stackedStep,
} from './chords'
import { handChordSymbol } from './inversions'

/*
 * Worked examples for Roman numerals.
 * The long-hand working writes the key's scale from its key signature, finds the chord's root in the scale,
 * and reads the numeral from its scale degree and type. The scale is cross-checked by counting tones and semitones,
 * and the numerals by the engine's `romanNumeral` and `chordFromRoman`.
 */

const mod = (n: number, m: number) => ((n % m) + m) % m

const MAJOR_PATTERN = [2, 2, 1, 2, 2, 2, 1] as const
const NATURAL_MINOR_PATTERN = [2, 1, 2, 2, 1, 2, 2] as const
export const NUMERAL_LETTERS = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII'] as const
const NUMBERS_TEXT = 'I = 1, II = 2, III = 3, IV = 4, V = 5, VI = 6, VII = 7'

/** Hand-written names of the scale degrees. Degree 7 of the natural minor scale is the subtonic. */
const DEGREE_NAME = ['tonic', 'supertonic', 'mediant', 'subdominant', 'dominant', 'submediant', 'leading note'] as const
const DEGREE_TERM: Record<string, WorkedTerm> = {
  tonic: TERM.tonic,
  supertonic: TERM.supertonic,
  mediant: TERM.mediant,
  subdominant: TERM.subdominant,
  dominant: TERM.dominant,
  submediant: TERM.submediant,
  'leading note': TERM.leadingNote,
  subtonic: TERM.subtonic,
}

/** The name of a scale degree (1 to 7). `raised` is for degree 7 of a minor key raised to a leading note. */
export function degreeName(key: Key, degree: number, raised = false): string {
  if (degree === 7 && key.mode === 'minor' && !raised) return 'subtonic'
  return DEGREE_NAME[degree - 1]!
}

export const degreeTerm = (name: string): WorkedTerm => DEGREE_TERM[name]!

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

/**
 * Two steps: write the scale of the key from its key signature, then number the notes as scale degrees.
 * The scale is worked out from the key signature here and checked against `scaleByCounting` (a different route).
 */
export function scaleSteps(key: Key, ex: Explained): { scale: NoteName[]; steps: WorkedStep[] } {
  const kName = keyLabel(key)
  const letters = Array.from({ length: 7 }, (_, i) => letterAt(letterIndex(key.tonic.letter) + i))
  const signature = keySignature(key)
  const scale = letters.map((l) => signature.accidentals.find((a) => a.letter === l) ?? note(l, 0))
  assertSameNotes(`${kName} scale from the key signature`, scale, scaleByCounting(key))
  const signs = signature.accidentals.map(noteLabel)
  const kind = signature.kind === 'sharps' ? 'sharp' : 'flat'
  const sigText =
    signs.length === 0
      ? 'no sharps or flats, so every note is a natural'
      : signs.length === 7
        ? `7 ${kind}s, so every letter takes a ${kind}`
        : `${signs.length} ${kind}${signs.length === 1 ? '' : 's'}: ${andList(signs)}. So ${andList(signature.accidentals.map((a) => a.letter))} ${signs.length === 1 ? 'becomes' : 'become'} ${andList(signs)}`
  const minorText = key.mode === 'minor' ? ' This gives the natural minor scale.' : ''
  return {
    scale,
    steps: [
      {
        title: `Write out the scale of ${kName}`,
        text: `Write seven letter names from the tonic${ex.once('tonic', ' (the key note)')}, ${noteLabel(key.tonic)}: ${letters.join(', ')}. The key signature of ${kName} has ${sigText}.${minorText}`,
        result: notesLabel(scale),
      },
      {
        title: 'Number the notes as scale degrees',
        text: `A scale degree${ex.once('degree', " (a note's number in the scale)")} counts up from the tonic, ${noteLabel(key.tonic)}, which is 1.`,
        result: numberedScale(scale),
      },
    ],
  }
}

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

/** Why the numeral has capitals or small letters, for each chord type. */
const CASE_RULE = 'Capital letters mean a major chord. Small letters mean a minor chord. Small letters with ° (a small circle) mean a diminished chord. A capital with 7 after it means a dominant 7th chord.'

const CASE_RESULT: Record<string, string> = {
  major: 'a major chord, so use capital letters',
  minor: 'a minor chord, so use small letters',
  diminished: 'a diminished chord, so use small letters and °',
  dominant7: 'a dominant 7th chord, so use capitals and 7',
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

/** The raised 7th explained, for a note of a minor-key chord that is not in the natural minor scale. */
function raisedText(key: Key, scale: readonly NoteName[], raised: NoteName): string {
  return `The natural minor scale of ${keyLabel(key)} has ${noteLabel(scale[6]!)}, not ${spokenNote(raised)}. ${noteLabel(raised)} is scale degree 7 raised by a semitone, which makes it a leading note (1 semitone below the tonic). Minor keys raise degree 7 in chords V and vii°.`
}

export interface ChordNumeralSteps {
  readonly steps: WorkedStep[]
  /** The counting and naming steps (the first part of `steps`). */
  readonly nameSteps: WorkedStep[]
  /** The scale degree and numeral steps (the rest of `steps`). */
  readonly degreeSteps: WorkedStep[]
  readonly analysis: NumeralAnalysis
  readonly counts: number[]
  readonly names: string[]
  readonly terms: WorkedTerm[]
}

/**
 * The steps that name a root-position chord and find its Roman numeral in a key, given the scale already written:
 * count from the root, match the type, find the scale degree, write the numeral.
 * `which` is "" for a single chord, or "first" / "second" in a cadence.
 */
export function numeralSteps(key: Key, chord: Chord, ex: Explained, which = ''): ChordNumeralSteps {
  const a = numeralLongHand(key, chord)
  const notes = chordNotes(chord)
  const root = chord.root
  const own = which ? `${which} chord` : 'chord'
  const counted = notes.slice(1).map((n, i) => countStep(root, n, ex, `Count from ${noteLabel(root)} up to the ${ROLES[i] as Role}, ${noteLabel(n)}`))
  const counts = counted.map((c) => c.total)
  if (qualityFromSemitones(counts) !== chord.quality) throw new Error('Semitone counts do not give the chord type')
  const symbol = handChordSymbol(chord, 0)
  const words = chordWords(chord)
  const letters = NUMERAL_LETTERS[a.degree - 1]!
  const dName = degreeName(key, a.degree, a.leadingNote)
  const raisedNote = a.outside[0]
  const findText = a.leadingNote
    ? `${raisedText(key, a.scale, root)} It still counts as degree 7.`
    : `${noteLabel(root)} is scale degree ${a.degree}, the ${dName}.`
  const nameSteps: WorkedStep[] = [
    ...counted.flatMap((c) => c.steps),
    {
      title: `Name the ${own} from its counts`,
      text: countsText(notes.length, counts, chord.quality, ex),
      result: `${capital(qualityPhrase(chord.quality))}: ${words}, symbol ${symbol}`,
    },
  ]
  const degreeSteps: WorkedStep[] = [
    {
      title: `Find the root, ${noteLabel(root)}, in the scale`,
      text: findText,
      result: `Scale degree ${a.degree}: the ${dName}`,
    },
    ...(raisedNote && !a.leadingNote
      ? [
          {
            title: `Look at ${noteLabel(raisedNote)}, which is not in the scale`,
            text: raisedText(key, a.scale, raisedNote),
            result: `${noteLabel(raisedNote)}: degree 7, raised`,
          },
        ]
      : []),
    {
      title: `Write degree ${a.degree} as a Roman numeral`,
      text: ex.has('numbers') ? `Degree ${a.degree} in Roman numerals is ${letters}.` : `Roman numerals${ex.once('roman', ' (chord names by scale degree)')} count ${NUMBERS_TEXT}.${ex.once('numbers', '')} Degree ${a.degree} is ${letters}.`,
      result: letters,
    },
    {
      title: 'Choose capital or small letters',
      text: `${ex.once('case-rule', `${CASE_RULE} `)}${words} is ${CASE_RESULT[chord.quality]}.`,
      result: which ? `${capital(which)} chord: ${a.numeral}` : `Numeral: ${a.numeral}`,
    },
  ]
  const terms: WorkedTerm[] = [
    TERM.root,
    ...counted.map((c) => intervalTerm(c.name)),
    chordTypeTerm(chord.quality),
    degreeTerm(dName),
    ...(raisedNote ? [TERM.leadingNote, TERM.naturalMinor] : []),
  ]
  return { steps: [...nameSteps, ...degreeSteps], nameSteps, degreeSteps, analysis: a, counts, names: counted.map((c) => c.name), terms }
}

const KEY_TERMS = [TERM.key, TERM.scale, TERM.keySignature, TERM.tonic, TERM.degree, TERM.roman, TERM.naturalMinor]

/**
 * "What is the Roman numeral of this chord in this key?" for a root-position chord.
 * Working: name the chord by counting, write and number the scale, find the root's degree, read the numeral.
 * Check: build the chord back from the numeral. Cross-check: the engine's `romanNumeral` and `chordFromRoman`.
 */
export function romanNumeralExample(key: Key, chord: Chord, clef: ClefName = 'treble'): WorkedExample {
  const ex = new Explained()
  const kName = keyLabel(key)
  const pitches = chordPicture(chord, clef)
  const symbol = handChordSymbol(chord, 0)
  const words = chordWords(chord)
  const names = nameNotesStep(pitches, clef, `Hear ${symbol}`, key)
  const stacked = stackedStep(pitches.map(withoutOctave), ex)
  const { steps: scaleWork } = scaleSteps(key, ex)
  const n = numeralSteps(key, chord, ex)
  const a = n.analysis
  // Check by the reverse route: build the chord from the numeral by stacking scale notes.
  const back = buildFromNumeral(key, a.numeral)
  assertSameNotes(`${a.numeral} built back`, back.notes, chordNotes(chord))
  const raised = back.usedRaised ? ` A minor key raises degree 7 in this chord: ${noteLabel(back.scale[6]!)} becomes ${spokenNote(note(back.scale[6]!.letter, back.scale[6]!.accidental + 1))}.` : ''

  return finish({
    title: `Find the Roman numeral of ${words} in ${kName}`,
    task: `The key is ${kName}. What is the Roman numeral of the chord ${words} (symbol ${symbol})?`,
    terms: [...KEY_TERMS, TERM.rootPosition, TERM.stacked, TERM.semitone, ...n.terms, ...signTerms(chordNotes(chord)).filter((t) => t !== TERM.natural)],
    steps: [
      names,
      stacked,
      ...n.nameSteps,
      ...scaleWork,
      ...n.degreeSteps,
      {
        title: 'Check another way: build the chord from the numeral',
        text: `Start on scale degree ${a.degree} and stack 3rds using only scale notes: take a note, skip one, take the next. That gives degrees ${back.numbers.join(', ')}${back.numbers.some((x, i) => i > 0 && x < back.numbers[i - 1]!) ? ex.once('wrap', ' (after 7, start again at 1)') : ''}.${raised} The notes are ${notesLabel(back.notes)}, the chord on the staff.`,
        result: `${a.numeral} in ${kName} is ${notesLabel(back.notes)}, as given`,
      },
    ],
    answer: `In ${kName}, ${words} (${symbol}) is ${a.numeral}.`,
  })
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

/** Why degree 7 is raised, for the step that stacks the chord. */
function raisedStackText(b: NumeralBuild, numeral: string): string {
  if (!b.usedRaised) return ''
  const from = b.scale[6]!
  const to = note(from.letter, from.accidental + 1)
  const without = b.degree === 5 ? 'Without it, the chord would be minor (v).' : 'Without it, the chord would be major (VII).'
  return ` In a minor key, ${numeral} uses scale degree 7 raised by a semitone (the leading note): ${noteLabel(from)} becomes ${spokenNote(to)}. ${without}`
}

/** The steps that build a chord from a numeral: degree, stack, count, match. Used here and for cadences. */
export function stackSteps(key: Key, numeral: string, ex: Explained, which = '', decoded = false): { build: NumeralBuild; steps: WorkedStep[]; terms: WorkedTerm[] } {
  const b = buildFromNumeral(key, numeral)
  const own = which ? `the ${which} chord, ${numeral}` : numeral
  const wraps = b.numbers.some((n, i) => i > 0 && n < b.numbers[i - 1]!)
  const root = b.notes[0]!
  const dName = degreeName(key, b.degree, b.usedRaised && b.degree === 7)
  const counted = b.notes.slice(1).map((n, i) => countStep(root, n, ex, `Count from ${noteLabel(root)} up to the ${ROLES[i] as Role}, ${noteLabel(n)}`))
  if (counted.map((c) => c.total).join(',') !== b.counts.join(',')) throw new Error('Counts disagree')
  const symbol = handChordSymbol(b.chord, 0)
  return {
    build: b,
    steps: [
      {
        title: `Find the root of ${own}`,
        text: `${decoded ? '' : `${numeral.replace(/[°7]/g, '')} is ${b.degree} in Roman numerals, so the root is scale degree ${b.degree}. `}Scale degree ${b.degree} of ${keyLabel(key)} is ${noteLabel(root)}, the ${dName}.`,
        result: `Root: ${noteLabel(root)}`,
      },
      {
        title: `Build ${numeral}: stack 3rds on ${noteLabel(root)}`,
        text: `Take the root, skip one scale note, take the next${b.notes.length === 4 ? ', and do it twice more' : ', and do it once more'}: scale degrees ${b.numbers.join(', ')}${wraps ? ex.once('wrap', ' (after 7, start again at 1)') : ''}.${raisedStackText(b, numeral)}`,
        result: notesLabel(b.notes),
      },
      ...counted.flatMap((c) => c.steps),
      {
        title: `Check the counts match ${numeral}`,
        text: `${b.notes.length === 3 ? ex.once('triad-table', `${TRIAD_TABLE_TEXT} `) : 'A dominant 7th chord is 4, 7 and 10. '}Yours are ${andList(b.counts.map(String))}: a ${qualityPhrase(b.quality)}. ${MATCH_CASE[b.quality]}, so it matches ${numeral}.`,
        result: `${numeral} = ${symbol}: ${notesLabel(b.notes)}`,
      },
    ],
    terms: [TERM.root, degreeTerm(dName), ...counted.map((c) => intervalTerm(c.name)), chordTypeTerm(b.quality), ...(b.usedRaised ? [TERM.leadingNote] : [])],
  }
}

/** The part of the case rule that applies to each type. */
const MATCH_CASE: Record<string, string> = {
  major: 'Capital letters mean a major chord',
  minor: 'Small letters mean a minor chord',
  diminished: 'Small letters with ° mean a diminished chord',
  dominant7: 'A capital with 7 means a dominant 7th chord',
}

/** Words for reading the numeral's case before building. */
const READ_CASE: Record<string, string> = {
  major: 'It is in capital letters, so the chord is major.',
  minor: 'It is in small letters, so the chord is minor.',
  diminished: 'It is in small letters with °, so the chord is diminished.',
  dominant7: 'It is in capitals with 7 after it, so the chord is a dominant 7th chord: a major triad with a minor 7th on top.',
}

/**
 * "Write the chord for this Roman numeral in this key."
 * Working: read the numeral, write and number the scale, stack scale notes in 3rds, count to confirm the type.
 * Check: the 3rds by piano keys. Cross-check: the engine's `chordFromRoman`.
 */
export function chordFromNumeralExample(key: Key, numeral: string, clef: ClefName = 'treble'): WorkedExample {
  const ex = new Explained()
  const kName = keyLabel(key)
  const { steps: scaleWork } = scaleSteps(key, ex)
  const s = stackSteps(key, numeral, ex, '', true)
  const b = s.build
  const symbol = handChordSymbol(b.chord, 0)
  const pitches = chordPicture(b.chord, clef)
  const walks = neighbourWalks(b.notes, ex)
  if (walks.sizes.reduce((x, y) => x + y, 0) !== b.counts.at(-1)) throw new Error('The piano-key check does not add up')
  const [findRoot, stack, ...rest] = s.steps
  return finish({
    title: `Write the chord for ${numeral} in ${kName}`,
    task: `In ${kName}, write the chord with the Roman numeral ${numeral}.`,
    terms: [...KEY_TERMS, TERM.stacked, TERM.semitone, ...s.terms, ...signTerms(b.notes).filter((t) => t !== TERM.natural)],
    steps: [
      {
        title: `Read the letters of ${numeral}`,
        text: `A Roman numeral${ex.once('roman', ' (a chord named by the scale degree of its root)')} counts ${NUMBERS_TEXT}. ${numeral.replace(/[°7]/g, '')} is ${b.degree}, so the root is scale degree ${b.degree}.`,
        result: `Root: scale degree ${b.degree}`,
      },
      {
        title: `Read the case of ${numeral}`,
        text: READ_CASE[b.quality]!,
        result: `A ${qualityPhrase(b.quality)}`,
      },
      ...scaleWork,
      findRoot!,
      { ...stack!, staff: chordsOnStaff(clef, [pitches], key), listen: listenChord(`Hear ${symbol}`, pitches) },
      ...rest,
      {
        title: 'Check another way: count the 3rds by piano keys',
        text: `Count up one piano key at a time. ${walks.text} Added up: ${walks.sizes.join(' + ')} = ${b.counts.at(-1)}.`,
        result: `${b.counts.at(-1)}, as you counted to the top note: ${qualityPhrase(b.quality)}`,
      },
    ],
    answer: `In ${kName}, ${numeral} is ${symbol}: ${notesLabel(b.notes)}.`,
  })
}

/**
 * "What are the primary chords in this key?" (I, IV and V; i, iv and V in a minor key).
 * Working: stack scale notes for each and count to confirm the type.
 * Check: together the three chords use every scale degree. Cross-check: the engine's `primaryChords`.
 */
export function primaryChordsExample(key: Key, clef: ClefName = 'treble'): WorkedExample {
  const ex = new Explained()
  const numerals = key.mode === 'major' ? ['I', 'IV', 'V'] : ['i', 'iv', 'V']
  const kName = keyLabel(key)
  const { scale, steps: scaleWork } = scaleSteps(key, ex)
  const built = numerals.map((n) => stackSteps(key, n, ex))
  const builds = built.map((x) => x.build)
  const engine = primaryChords(key)
  builds.forEach((b, i) => {
    const e = engine[i]!
    if (e.chord.quality !== b.chord.quality || !sameNote(e.chord.root, b.chord.root) || e.numeral !== numerals[i]) {
      throw new Error(`Primary chord ${numerals[i]} in ${keyLabel(key)} disagrees with the engine`)
    }
  })
  const symbols = builds.map((b) => handChordSymbol(b.chord, 0))
  const pictures = sharedPictures(
    builds.map((b) => b.chord),
    clef,
  )
  // Check: between them the three chords use every scale degree once or more (with degree 7 raised in a minor key).
  const used = builds.flatMap((b) => b.notes)
  const letters = new Set(used.map((n) => n.letter))
  if (letters.size !== 7) throw new Error('The primary chords should use all seven letter names')
  const raised = builds[2]!.usedRaised
  const full = scale.map((n, i) => (raised && i === 6 ? note(n.letter, n.accidental + 1) : n))
  if (!full.every((n) => used.some((u) => sameNote(u, n)))) throw new Error('The primary chords should use every note of the scale')

  return finish({
    title: `The primary chords in ${kName}`,
    task: `Write the three primary chords of ${kName}, with their Roman numerals.`,
    terms: [...KEY_TERMS, TERM.primary, TERM.subdominant, TERM.dominant, TERM.stacked, TERM.semitone, ...built.flatMap((x) => x.terms), ...signTerms(used).filter((t) => t !== TERM.natural)],
    steps: [
      ...scaleWork,
      {
        title: 'Find the tonic, subdominant and dominant',
        text: `The primary chords${ex.once('primary', ' (the three most important chords of a key)')} are built on scale degrees 1, 4 and 5: the tonic, the subdominant and the dominant.`,
        result: `1 ${noteLabel(scale[0]!)}, 4 ${noteLabel(scale[3]!)}, 5 ${noteLabel(scale[4]!)}`,
      },
      ...built.flatMap((x) => x.steps.slice(1)),
      {
        title: 'Write the three chords on the staff',
        text: `Write the key signature of ${kName}, then the three chords one after another. Press the button to hear them in turn.`,
        result: numerals.map((n, i) => `${n} = ${symbols[i]}`).join(', '),
        staff: chordsOnStaff(clef, pictures, key),
        listen: { label: `Hear ${numerals.join(' ')}`, audio: chordSequenceAudio(pictures) },
      },
      {
        title: 'Check another way: look for every scale degree',
        text: `List the notes of all three chords: ${builds.map((b) => notesLabel(b.notes)).join('; ')}. Between them they use all seven letter names, so every note of the scale appears${raised ? ', with degree 7 raised' : ''}: ${notesLabel(full)}.`,
        result: 'All seven scale degrees, as the primary chords should give',
      },
    ],
    answer: `The primary chords of ${kName} are ${numerals.map((n, i) => `${n} = ${symbols[i]}`).join(', ')}.`,
  })
}

