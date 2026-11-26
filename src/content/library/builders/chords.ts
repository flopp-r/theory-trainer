import type { AudioSpec } from '../../../audio/types'
import {
  type Chord,
  type ChordQuality,
  type ClefName,
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
  pitchClass,
  sameNote,
  withoutOctave,
} from '../../../theory'
import { chordOnStaff, chordWords } from '../../../questions/chords'
import { fitsOnStaff, noteLabel, notesLabel } from '../../../questions/pitchTools'
import type { WorkedExample } from '../types'
import { listenChord } from './audio'
import { chordsOnStaff } from './common'

/*
 * Worked examples for building and identifying triads and seventh chords.
 *
 * The long-hand working is done by counting semitones from the root, using only the white-key distances
 * (E to F and B to C are 1 semitone, every other neighbouring pair of letters is 2) and the signs on the notes.
 * At the end each example is cross-checked against the theory engine, which works by naming intervals
 * instead of counting. If the two ever disagree, the builder throws, so a wrong example can never be shown.
 */

/** Semitones from each plain letter up to the next plain letter. */
const WHITE_STEP: Record<Letter, number> = { C: 2, D: 2, E: 1, F: 2, G: 2, A: 2, B: 1 }

const mod = (n: number, m: number) => ((n % m) + m) % m

/** "3rd", "5th", "7th". */
export function ordinal(n: number): string {
  const names: Record<number, string> = { 1: '1st', 2: '2nd', 3: '3rd' }
  return names[n] ?? `${n}th`
}

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`

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

export interface SemitoneWorking {
  /** Semitones from the lower note up to the upper note. */
  readonly total: number
  /** The working, in plain sentences. */
  readonly text: string
}

/**
 * Counts the semitones from `from` up to the next `to` above it, the long way:
 * first between the plain letters (white-key distances), then adjusting for the signs on the two notes.
 * Checked against pitch classes; throws if the two methods disagree.
 */
export function semitoneWorking(from: NoteName, to: NoteName): SemitoneWorking {
  const steps = mod(letterIndex(to.letter) - letterIndex(from.letter), 7)
  const parts: string[] = []
  let plain = 0
  for (let i = 0; i < steps; i++) {
    const letter = letterAt(letterIndex(from.letter) + i)
    const next = letterAt(letterIndex(from.letter) + i + 1)
    plain += WHITE_STEP[letter]
    parts.push(`${letter} to ${next} is ${WHITE_STEP[letter]}`)
  }
  const total = plain - from.accidental + to.accidental
  if (total < 0 || total > 12 || mod(total, 12) !== mod(pitchClass(to) - pitchClass(from), 12)) {
    throw new Error(`Semitone count from ${formatNote(from)} to ${formatNote(to)} disagrees with pitch classes`)
  }
  const walk =
    steps === 0
      ? `${from.letter} and ${to.letter} are the same letter, so the plain letters are 0 apart.`
      : `Plain ${from.letter} up to plain ${to.letter}: ${parts.join(', ')}. That makes ${plain}.`
  const signs: string[] = []
  const adjust = (n: NoteName, isLower: boolean) => {
    if (n.accidental === 0) return
    const size = Math.abs(n.accidental)
    const kind = n.accidental > 0 ? (size === 1 ? 'a sharp' : 'a double sharp') : size === 1 ? 'a flat' : 'a double flat'
    // A sharp on the lower note shortens the gap; a flat on the lower note lengthens it. The upper note is the other way round.
    const adds = isLower ? n.accidental < 0 : n.accidental > 0
    signs.push(`${noteLabel(n)} has ${kind} on the ${isLower ? 'lower' : 'upper'} note: ${adds ? 'add' : 'take away'} ${size}`)
  }
  adjust(from, true)
  adjust(to, false)
  const signText = signs.length === 0 ? 'Neither note has a sign.' : `Signs: ${signs.join('; ')}.`
  return { total, text: `${walk} ${signText} Total: **${plural(total, 'semitone')}**.` }
}

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

export interface SpelledNote {
  readonly note: NoteName
  /** The working for this one note, ready to use as a step. */
  readonly text: string
  /** Semitones the sign added (+) or took away (-). */
  readonly accidental: number
}

/**
 * Finds one note of a chord by the long-hand method: take the letter `letterSteps` above the root,
 * count the semitones from the root to that plain letter, and add the sign that makes the count right.
 */
export function spellAbove(root: NoteName, letterSteps: number, wanted: number, jobName: string): SpelledNote {
  const letter = letterAt(letterIndex(root.letter) + letterSteps)
  const gap = semitoneWorking(root, note(letter, 0))
  const accidental = mod(wanted - gap.total + 6, 12) - 6
  if (Math.abs(accidental) > 2) throw new Error('A chord note never needs more than a double sharp or flat here')
  const result = note(letter, accidental)
  const size = Math.abs(accidental)
  let fix: string
  if (accidental === 0) {
    fix = `That is exactly ${wanted}, so ${letter} needs no sign. The note is **${noteLabel(result)}**.`
  } else if (accidental > 0) {
    fix = `That is ${size} too few. Raise ${letter} by ${plural(size, 'semitone')} with ${signName(accidental)}. The note is **${noteLabel(result)}**.`
  } else {
    fix = `That is ${size} too many. Lower ${letter} by ${plural(size, 'semitone')} with ${signName(accidental)}. The note is **${noteLabel(result)}**.`
  }
  return {
    note: result,
    accidental,
    text: `**The ${jobName}.** The letter is ${letter}. Count from ${noteLabel(root)} up to plain ${letter}. ${gap.text} The ${jobName} must be **${wanted}** semitones above the root. ${fix}`,
  }
}

/** Throws unless the long-hand notes are exactly what the engine says. */
export function assertSameNotes(label: string, longHand: readonly NoteName[], engine: readonly NoteName[]): void {
  if (longHand.length !== engine.length || engine.some((n, i) => !sameNote(n, longHand[i]!))) {
    throw new Error(`${label}: working gives ${notesLabel(longHand)} but the theory engine gives ${notesLabel(engine)}`)
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

/** Steps shared by the build examples: write the root and the letters. */
function letterStep(root: NoteName, count: number): { letters: Letter[]; text: string } {
  const letters = Array.from({ length: count }, (_, i) => letterAt(letterIndex(root.letter) + 2 * i))
  const skips = letters
    .slice(1)
    .map((l, i) => `from ${letters[i]!}, skip ${letterAt(letterIndex(letters[i]!) + 1)} and take **${l}**`)
    .join('; ')
  return {
    letters,
    text: `Write the **letter names**. A chord is built in **thirds**, so each time you skip one letter and take the next: ${skips}. The letters are **${letters.join(', ')}**. (Letters only for now. The sharps and flats come next.)`,
  }
}

/**
 * Build a triad from its root and type.
 * Working: letters, then semitone counts. Cross-check: the engine's `chordNotes` and `identifyChord`.
 */
export function buildTriadExample(root: NoteName, quality: TriadQuality, clef: ClefName = 'treble'): WorkedExample {
  const recipe = TRIAD_RECIPE[quality]
  const label = chordWords({ root, quality })
  const { letters, text: lettersText } = letterStep(root, 3)
  const third = spellAbove(root, 2, recipe.third, '3rd')
  const fifth = spellAbove(root, 4, recipe.fifth, '5th')
  const notes = [root, third.note, fifth.note]

  // Cross-check against the engine, by a different route (intervals, not counting).
  const chord: Chord = { root, quality }
  assertSameNotes(`${label} triad`, notes, chordNotes(chord))
  const found = identifyChord(notes)
  if (!found || found.quality !== quality || !sameNote(found.root, root)) throw new Error(`${label}: the engine does not recognise ${notesLabel(notes)} as this triad`)

  // Check step: the two thirds, counted from the notes written down.
  const lower = mod(pitchClass(third.note) - pitchClass(root), 12)
  const upper = mod(pitchClass(fifth.note) - pitchClass(third.note), 12)
  const whole = mod(pitchClass(fifth.note) - pitchClass(root), 12)
  const pitches = chordPicture(chord, clef)
  const nameOf = (a: Pitch, b: Pitch) => intervalName(intervalBetween(a, b).interval)
  const lowerName = nameOf(pitches[0]!, pitches[1]!)
  const upperName = nameOf(pitches[1]!, pitches[2]!)
  const wholeName = nameOf(pitches[0]!, pitches[2]!)
  if (lower !== recipe.lowerSemis || upper !== recipe.upperSemis || whole !== recipe.fifth) {
    throw new Error(`${label}: the check counts do not match the recipe`)
  }
  if (lowerName !== recipe.lower || upperName !== recipe.upper || wholeName !== recipe.fifthName) {
    throw new Error(`${label}: interval names from the engine (${lowerName}, ${upperName}, ${wholeName}) do not match the recipe`)
  }

  return {
    title: `Build the ${label} triad`,
    task: `Write the notes of the ${label} triad.`,
    steps: [
      { text: `Write the **root**: **${noteLabel(root)}**. The root is the note the chord is named after, and it is the first note of the triad.` },
      { text: lettersText },
      {
        text: `Look up the recipe. A ${quality} triad is a **${recipe.lower}** (${recipe.lowerSemis} semitones) with a **${recipe.upper}** (${recipe.upperSemis} semitones) on top. So the 3rd must be **${recipe.third}** semitones above the root, and the 5th must be ${recipe.lowerSemis} + ${recipe.upperSemis} = **${recipe.fifth}** semitones above the root. That distance is a ${recipe.fifthName}.`,
      },
      { text: third.text },
      { text: fifth.text },
      {
        text: `Check by counting each third from the notes you wrote. ${noteLabel(root)} to ${noteLabel(third.note)} is ${lower} semitones: a ${lowerName}. ${noteLabel(third.note)} to ${noteLabel(fifth.note)} is ${upper} semitones: a ${upperName}. ${noteLabel(root)} to ${noteLabel(fifth.note)} is ${whole} semitones: a ${wholeName}. That is the recipe for ${quality}: ${recipe.lower} then ${recipe.upper}. The letters ${letters.join(', ')} also each skip one letter, as they should.`,
      },
      {
        text: `Write it out: **${notesLabel(notes)}**. On the staff the three notes sit on neighbouring lines or neighbouring spaces (skipping a letter means skipping one line or space). Press the button to hear it.`,
        staff: chordsOnStaff(clef, [pitches]),
        listen: listenChord(`Hear ${label}`, pitches),
      },
    ],
    answer: `The ${label} triad is ${notesLabel(notes)}.`,
  }
}

/** Letters of the notes, bottom to top, must each be two letters above the one before (stacked in thirds). */
function assertStackedInThirds(notes: readonly NoteName[]): void {
  for (let i = 1; i < notes.length; i++) {
    if (mod(letterIndex(notes[i]!.letter) - letterIndex(notes[i - 1]!.letter), 7) !== 2) {
      throw new Error('These notes are not stacked in thirds from the bottom, so this is not a root-position chord')
    }
  }
}

function nameNotesStep(pitches: readonly Pitch[], what: string): string {
  const names = pitches.map((p) => noteLabel(withoutOctave(p)))
  return `Read the ${what} notes from the bottom up: **${names.join(', ')}**. Any sharp or flat written in front of a note belongs to that note. (Use the key signature too, if there is one.)`
}

function thirdsStep(notes: readonly NoteName[]): string {
  const bits = notes.slice(1).map((n, i) => {
    const before = notes[i]!
    return `${before.letter} to ${n.letter} skips ${letterAt(letterIndex(before.letter) + 1)}`
  })
  return `Check the letters are stacked in thirds, with one letter skipped each time: ${bits.join('; ')}. So this chord is in its basic form and the lowest note, **${noteLabel(notes[0]!)}**, is the **root**.`
}

/**
 * Identify a root-position triad written on a staff.
 * Working: count the two thirds in semitones. Cross-check: the engine's `identifyChord`.
 */
export function identifyTriadExample(pitches: readonly Pitch[], clef: ClefName = 'treble'): WorkedExample {
  if (pitches.length !== 3) throw new Error('A triad has three notes')
  const notes = pitches.map(withoutOctave)
  assertStackedInThirds(notes)
  const [root, middle, top] = notes as [NoteName, NoteName, NoteName]
  const lower = semitoneWorking(root, middle)
  const upper = semitoneWorking(middle, top)
  const quality = qualityFromSemitones([lower.total, lower.total + upper.total])
  if (!quality || !isTriadQuality(quality)) throw new Error(`${notesLabel(notes)} is not one of the four triads (${lower.total} then ${upper.total})`)
  const recipe = TRIAD_RECIPE[quality]
  const found = identifyChord(notes)
  if (!found || found.quality !== quality || !sameNote(found.root, root)) throw new Error(`Working says ${quality} but the engine says otherwise for ${notesLabel(notes)}`)
  const label = chordWords(found)
  const topInterval = intervalName(intervalBetween(pitches[0]!, pitches[2]!).interval)
  if (topInterval !== recipe.fifthName) throw new Error(`The 5th should be a ${recipe.fifthName} but the engine says ${topInterval}`)

  return {
    title: `Identify the triad on the staff: ${label}`,
    task: 'Look at the triad on the staff. What type of triad is it, and what is it called?',
    steps: [
      { text: nameNotesStep(pitches, 'three'), staff: chordsOnStaff(clef, [[...pitches]]), listen: listenChord('Hear this triad', pitches) },
      { text: thirdsStep(notes) },
      { text: `Count the semitones from the root up to the middle note. ${lower.text}` },
      { text: `Count the semitones from the middle note up to the top note. ${upper.text}` },
      {
        text: `Match your two numbers to the table: **major** is 4 then 3, **minor** is 3 then 4, **diminished** is 3 then 3, **augmented** is 4 then 4. Yours is ${lower.total} then ${upper.total}: a ${recipe.lower} then a ${recipe.upper}, so it is **${quality}**.`,
      },
      {
        text: `Check: from the root ${noteLabel(root)} to the top note ${noteLabel(top)} is ${lower.total + upper.total} semitones, which is a ${recipe.fifthName}. A ${quality} triad always has a ${recipe.fifthName}. ${noteLabel(root)} is the root, so the chord is **${label}**.`,
      },
    ],
    answer: `It is a ${quality} triad: ${label} (${notesLabel(notes)}).`,
  }
}

/**
 * Build a seventh chord from its root and type.
 * Working: letters, then semitone counts. Cross-check: the engine's `chordNotes` and `identifyChord`.
 */
export function buildSeventhExample(root: NoteName, quality: SeventhQuality, clef: ClefName = 'treble'): WorkedExample {
  const recipe = SEVENTH_RECIPE[quality]
  const label = chordWords({ root, quality })
  const { letters, text: lettersText } = letterStep(root, 4)
  const third = spellAbove(root, 2, recipe.third, '3rd')
  const fifth = spellAbove(root, 4, recipe.fifth, '5th')
  const seventh = spellAbove(root, 6, recipe.seventh, '7th')
  const notes = [root, third.note, fifth.note, seventh.note]

  const chord: Chord = { root, quality }
  assertSameNotes(label, notes, chordNotes(chord))
  const found = identifyChord(notes)
  if (!found || found.quality !== quality || !sameNote(found.root, root)) throw new Error(`${label}: the engine does not recognise ${notesLabel(notes)}`)

  const pitches = chordPicture(chord, clef)
  const sevenName = intervalName(intervalBetween(pitches[0]!, pitches[3]!).interval)
  if (sevenName !== recipe.seventhName) throw new Error(`${label}: the 7th should be a ${recipe.seventhName} but the engine says ${sevenName}`)
  const triadNotes = notes.slice(0, 3)
  const triadFound = identifyChord(triadNotes)
  if (!triadFound || triadFound.quality !== recipe.triad) throw new Error(`${label}: the three lower notes should make a ${recipe.triad} triad`)

  const triadWords = `${recipe.triad} triad`
  const doubleFlat = seventh.accidental === -2
  return {
    title: `Build ${label}`,
    task: `Write the notes of ${label}.`,
    steps: [
      { text: `Write the **root**: **${noteLabel(root)}**. The root is the note the chord is named after.` },
      { text: lettersText },
      {
        text: `Look up the recipe. ${label} is a **${triadWords}** (3rd ${recipe.third} semitones above the root, 5th ${recipe.fifth} semitones above the root) with a **${recipe.seventhName}** added on top. A ${recipe.seventhName} is **${recipe.seventh}** semitones above the root.`,
      },
      { text: third.text },
      { text: fifth.text },
      {
        text: `${seventh.text}${doubleFlat ? ` A double flat lowers a note by two semitones. It looks unusual, but it is correct: the 7th must use the letter ${seventh.note.letter}, and a single flat would be the wrong size.` : ''}`,
      },
      {
        text: `Check. The lower three notes, ${notesLabel(triadNotes)}, are a ${triadWords}: ${recipe.triad === 'major' ? '4 then 3' : recipe.triad === 'minor' ? '3 then 4' : '3 then 3'} semitones. The top note ${noteLabel(seventh.note)} is ${recipe.seventh} semitones above the root ${noteLabel(root)}: a ${sevenName}. The letters ${letters.join(', ')} skip one letter each time. ✓`,
      },
      {
        text: `Write it out: **${notesLabel(notes)}**. On the staff the four notes sit on neighbouring lines or neighbouring spaces. Press the button to hear it.`,
        staff: chordsOnStaff(clef, [pitches]),
        listen: listenChord(`Hear ${label}`, pitches),
      },
    ],
    answer: `${label} is ${notesLabel(notes)}.`,
  }
}

/**
 * Identify a root-position seventh chord written on a staff.
 * Working: count from the root to each other note. Cross-check: the engine's `identifyChord`.
 */
export function identifySeventhExample(pitches: readonly Pitch[], clef: ClefName = 'treble'): WorkedExample {
  if (pitches.length !== 4) throw new Error('A seventh chord has four notes')
  const notes = pitches.map(withoutOctave)
  assertStackedInThirds(notes)
  const [root, third, fifth, seventh] = notes as [NoteName, NoteName, NoteName, NoteName]
  const a = semitoneWorking(root, third)
  const b = semitoneWorking(root, fifth)
  const c = semitoneWorking(root, seventh)
  const quality = qualityFromSemitones([a.total, b.total, c.total])
  if (!quality || !isSeventhQuality(quality)) throw new Error(`${notesLabel(notes)} is not one of the five seventh chords (${a.total}, ${b.total}, ${c.total})`)
  const recipe = SEVENTH_RECIPE[quality]
  const found = identifyChord(notes)
  if (!found || found.quality !== quality || !sameNote(found.root, root)) throw new Error(`Working says ${quality} but the engine disagrees for ${notesLabel(notes)}`)
  const label = chordWords(found)
  const sevenName = intervalName(intervalBetween(pitches[0]!, pitches[3]!).interval)
  if (sevenName !== recipe.seventhName) throw new Error(`The 7th should be a ${recipe.seventhName} but the engine says ${sevenName}`)

  return {
    title: `Identify the 7th chord on the staff: ${label}`,
    task: 'Look at the chord on the staff. What type of 7th chord is it, and what is it called?',
    steps: [
      { text: nameNotesStep(pitches, 'four'), staff: chordsOnStaff(clef, [[...pitches]]), listen: listenChord('Hear this chord', pitches) },
      { text: thirdsStep(notes) },
      { text: `Count the semitones from the root up to the **3rd** (${noteLabel(third)}). ${a.text}` },
      { text: `Count from the root up to the **5th** (${noteLabel(fifth)}). ${b.text}` },
      { text: `Count from the root up to the **7th** (${noteLabel(seventh)}). ${c.text} (Counting every note from the root, not from the note before, stops one slip from spoiling the rest.)` },
      {
        text: `Match your three numbers (3rd, 5th, 7th) to the table: **dominant 7th** 4, 7, 10; **major 7th** 4, 7, 11; **minor 7th** 3, 7, 10; **half-diminished 7th** 3, 6, 10; **diminished 7th** 3, 6, 9. Yours are ${a.total}, ${b.total}, ${c.total}, so it is a **${SEVENTH_NAME[quality]}**.`,
      },
      {
        text: `Check: the lower three notes, ${notesLabel(notes.slice(0, 3))}, make a ${recipe.triad} triad, and the top note ${noteLabel(seventh)} is a ${recipe.seventhName} above the root. A ${SEVENTH_NAME[quality]} is a ${recipe.triad} triad with a ${recipe.seventhName} added. ✓ The chord is **${label}**.`,
      },
    ],
    answer: `It is ${label} (${notesLabel(notes)}).`,
  }
}
