import type { WorkedExample, WorkedStep, WorkedTerm } from '../types'
import {
  LETTERS,
  type ClefName,
  type NoteName,
  type Pitch,
  accidentalsToShow,
  describeStaffPosition,
  diatonicStep,
  formatNote,
  keyScaleNotes,
  midiNumber,
  note,
  pitch,
  pitchClass,
  sameSound,
  staffPosition,
} from '../../../theory'
import { noteLabel } from '../../../questions/pitchTools'
import { anchorPitch, atPlace, cap, clefResult, clefSentence, clefTerm, clefWord, countSteps, edgeCheck, sym } from './clefs'
import { listenMelody } from './audio'
import { notesOnStaff } from './common'

/*
 * Builders about sharps, flats and naturals: naming a note that has a sign, how long a sign lasts in a bar,
 * and notes that sound the same but are spelled differently. Each one works the answer out long-hand and
 * cross-checks it against the theory engine; a disagreement throws.
 */

const semitonesText = (n: number) => `${Math.abs(n)} semitone${Math.abs(n) === 1 ? '' : 's'}`
const mod12 = (n: number) => ((n % 12) + 12) % 12

/** The name of a sign, from the number of semitones it adds. */
export function signName(accidental: number): string {
  switch (accidental) {
    case 1:
      return 'sharp'
    case -1:
      return 'flat'
    case 0:
      return 'natural'
    case 2:
      return 'double sharp'
    case -2:
      return 'double flat'
    default:
      throw new RangeError(`There is no sign for ${accidental} semitones`)
  }
}

const withArticle = (accidental: number) => `a ${signName(accidental)}`
/** The symbol for a sign: ♯ ♭ ♮ ♯♯ ♭♭ (the app writes a double sharp or flat as two signs). */
const signSymbol = (accidental: number) => (accidental === 0 ? '♮' : noteLabel({ letter: 'C', accidental }).slice(1))

/* "Words you need" for the sign builders. */
const ACCIDENTAL_TERM: WorkedTerm = { term: 'Accidental', meaning: 'A sign written in front of a note to raise or lower it: a sharp, a flat, a natural, a double sharp or a double flat.' }
const SEMITONE_TERM: WorkedTerm = { term: 'Semitone', meaning: 'The smallest step in Western music: from one piano key to the very next key, black or white.' }
const TONE_TERM: WorkedTerm = { term: 'Tone', meaning: 'A step of two semitones, such as C up to D. There is one piano key between the two notes.' }
const SIGN_TERMS: Record<number, WorkedTerm> = {
  1: { term: 'Sharp (♯)', meaning: 'A sign that raises a note by 1 semitone. C♯ is the piano key just above C.' },
  [-1]: { term: 'Flat (♭)', meaning: 'A sign that lowers a note by 1 semitone. B♭ is the piano key just below B.' },
  2: { term: `Double sharp (${signSymbol(2)})`, meaning: 'A sign that raises a note by 2 semitones (one tone). It is printed as a small cross; this app writes it as ♯♯.' },
  [-2]: { term: `Double flat (${signSymbol(-2)})`, meaning: 'A sign that lowers a note by 2 semitones (one tone). It is printed as two flats side by side.' },
}
const NATURAL_TERM: WorkedTerm = { term: 'Natural (♮)', meaning: 'A note with no sharp or flat, such as F. The natural sign ♮ cancels an earlier sharp or flat.' }

/** The piano key a note lands on, in words: "the black key just above C", "the same piano key as G". */
function keyWords(n: NoteName): string {
  const pc = pitchClass(n)
  const white = LETTERS.find((l) => pitchClass(note(l)) === pc)
  if (white) return `the same piano key as ${white}`
  if (Math.abs(n.accidental) !== 1) throw new Error('Only single sharps and flats land on a black key next to their letter')
  return `the black key just ${n.accidental > 0 ? 'above' : 'below'} ${n.letter}`
}

/** "Name a note with a sharp, flat, double sharp or double flat": find the letter first, then add the sign. */
export function nameAccidentalExample(clef: ClefName, target: Pitch): WorkedExample {
  if (target.accidental === 0) throw new RangeError('The note needs a sharp or flat')
  const anchor = anchorPitch(clef)
  const natural = pitch(target.letter, 0, target.octave)
  const position = staffPosition(target, clef)
  if (position !== staffPosition(natural, clef)) throw new Error('A sign must not move the note on the staff')
  const counting = position === staffPosition(anchor, clef) ? null : countSteps(clef, anchor, natural, { octave: false, toName: 'Your note', toTitle: 'your note', explainStep: true })
  const letter = counting ? counting.walk.path.at(-1)!.letter : anchor.letter
  if (letter !== target.letter) throw new Error('Counting gave the wrong letter')
  // The sign must change the sound by exactly the number of semitones it stands for.
  if (midiNumber(target) - midiNumber(natural) !== target.accidental) throw new Error('The sign does not match the change in sound')
  const check = edgeCheck(clef, position, false)
  if (check.found.letter !== letter) throw new Error('The check gives a different letter')

  const where = describeStaffPosition(position)
  const name = noteLabel(target)
  const sign = signName(target.accidental)
  const up = target.accidental > 0
  const double = Math.abs(target.accidental) === 2
  const halfway: NoteName = { letter: target.letter, accidental: up ? 1 : -1 }
  const outside = position < 0 || position > 8

  const terms: WorkedTerm[] = [ACCIDENTAL_TERM, SIGN_TERMS[target.accidental]!, SEMITONE_TERM, clefTerm(clef)]
  if (outside) terms.push({ term: 'Ledger line', meaning: 'A short extra line drawn above or below the staff, for a note too high or too low to fit on the five lines.' })

  const raise = double
    ? `A ${sign} ${up ? 'raises' : 'lowers'} a note by 2 semitones, one at a time: ${target.letter} ${up ? 'up' : 'down'} 1 semitone is ${noteLabel(halfway)}, and 1 more is ${name}. ${name} is ${keyWords(target)}.`
    : `A ${sign} (${signSymbol(target.accidental)}) ${up ? 'raises' : 'lowers'} a note by 1 semitone. ${target.letter} ${up ? 'raised' : 'lowered'} by 1 semitone is ${name}, ${keyWords(target)}.`
  const steps: WorkedStep[] = [
    {
      title: 'Find where the note head sits',
      text: `The note head is ${atPlace(position)}. In front of it is an accidental (a sign that raises or lowers a note): ${withArticle(target.accidental)}${double ? '' : ` (${signSymbol(target.accidental)})`}.`,
      result: `${cap(where)}, with ${withArticle(target.accidental)}`,
      staff: notesOnStaff(clef, [target]),
    },
    {
      title: 'Find the letter first',
      text: `An accidental changes the sound, never the place on the staff. So name the note as if the sign were not there. ${clefSentence(clef)}`,
      result: clefResult(clef),
    },
    ...(counting
      ? counting.steps
      : [{ title: 'See that there is nothing to count', text: `Your note is ${atPlace(position)}, the line the clef fixes, so the letter is ${letter}.`, result: `The letter is ${letter}` }]),
    {
      title: `Add the ${sign}`,
      text: `${raise} Say the letter first and the sign second: "${target.letter} ${sign}".`,
      result: `The note is ${name}`,
    },
    {
      title: check.title,
      text: `${check.text} With the ${sign} in front it is ${name}.`,
      result: `${cap(where)} is ${letter}, so the note is ${name}`,
    },
  ]
  return {
    title: `Name a note with ${withArticle(target.accidental)} in ${clefWord(clef)}`,
    task: `What is the name of this note (${clefWord(clef)})? It has ${withArticle(target.accidental)} in front.`,
    terms,
    steps,
    answer: `The note is ${name}.`,
  }
}

interface CarryRow {
  readonly note: Pitch
  readonly printed: boolean
  readonly title: string
  readonly text: string
  readonly result: string
}

/** One row per note: whether a sign is printed, and why, from the rule "a sign lasts to the bar line, for the same letter and octave". */
function carryRows(notes: readonly Pitch[]): CarryRow[] {
  const state = new Map<string, { accidental: number; from: number }>() // the sign in force for each letter + octave, and the note that set it
  const explained = new Set<number>()
  const reminder = (accidental: number) => {
    if (explained.has(accidental)) return ''
    explained.add(accidental)
    const what = accidental === 0 ? 'cancels a sharp or flat' : `${accidental > 0 ? 'raises' : 'lowers'} a note by ${semitonesText(accidental)}`
    return ` (${signSymbol(accidental)} ${what})`
  }
  return notes.map((n, i) => {
    const slot = `${n.letter}${n.octave}`
    const earlier = state.get(slot)
    const inForce = earlier?.accidental ?? 0
    const printed = n.accidental !== inForce
    const label = noteLabel(n)
    const otherOctave = notes.slice(0, i).find((m) => m.letter === n.letter && m.octave !== n.octave && m.accidental !== 0)
    const octaveNote = otherOctave
      ? ` The ${signName(otherOctave.accidental)} on ${otherOctave.letter}${otherOctave.octave} does not count here: ${slot} has a different octave number, so it is a different pitch.`
      : ''
    let text: string
    if (printed && n.accidental !== 0 && earlier === undefined) {
      text = `Nothing earlier in the bar has changed ${slot}, so without a sign it would be ${n.letter} natural. Print ${withArticle(n.accidental)}${reminder(n.accidental)}.${octaveNote}`
    } else if (printed && n.accidental !== 0) {
      text = `${slot} was ${inForce === 0 ? `${n.letter} natural` : noteLabel({ letter: n.letter, accidental: inForce })} at note ${earlier!.from}. This note is ${label}, so it needs its own sign: print ${withArticle(n.accidental)}${reminder(n.accidental)}.`
    } else if (printed) {
      text = `The ${signName(inForce)} printed at note ${earlier!.from} still holds for ${slot}, so without a sign this would be ${noteLabel({ letter: n.letter, accidental: inForce })}. Print a natural sign${reminder(0)} to get ${n.letter} natural.`
    } else if (n.accidental !== 0) {
      text = `The ${signName(n.accidental)} printed at note ${earlier!.from} still holds for ${slot} until the bar line, and this is the same pitch (same letter, same octave). No sign is needed: it is still ${label}.`
    } else if (earlier === undefined) {
      text = `${slot} has no sharp or flat, and nothing earlier in the bar has changed it. No sign is needed.${octaveNote}`
    } else {
      text = `${slot} is ${n.letter} natural here, the same as at note ${earlier.from}, and nothing has changed it since. No sign is needed.`
    }
    if (printed || earlier === undefined) state.set(slot, { accidental: n.accidental, from: i + 1 })
    return {
      note: n,
      printed,
      title: `Note ${i + 1}: ${sym(n)}`,
      text,
      result: printed ? `Print ${signSymbol(n.accidental)}` : 'No sign',
    }
  })
}

const andList = (values: readonly (string | number)[]) => (values.length <= 1 ? values.join('') : `${values.slice(0, -1).join(', ')} and ${values.at(-1)}`)

/**
 * Shows a short bar and, for each note, whether a sign is printed and why.
 * The reasons are worked out by hand with one rule (a sign lasts for the rest of the bar, for the same letter and octave),
 * checked again pitch by pitch, and then against the theory engine's `accidentalsToShow`. This throws if any of them disagree.
 */
export function accidentalCarryExample(notes: readonly Pitch[], clef: ClefName = 'treble'): WorkedExample {
  if (notes.length < 2) throw new RangeError('A bar needs at least two notes')
  const rows = carryRows(notes)
  const engine = accidentalsToShow(
    notes.map((n) => [n]),
    null,
  )
  rows.forEach((row, i) => {
    const sign = engine[i]![0]!
    if ((sign !== null) !== row.printed) throw new Error(`Note ${i + 1}: the rule and the theory engine disagree about printing a sign`)
    if (sign !== null) {
      const expected = { '#': 1, b: -1, n: 0, '##': 2, bb: -2 }[sign]
      if (expected !== row.note.accidental) throw new Error(`Note ${i + 1}: the sign printed does not match the note`)
    }
  })

  // The check goes pitch by pitch instead of note by note: a sign is needed wherever a pitch's spelling changes.
  const slots: { slot: string; indexes: number[] }[] = []
  notes.forEach((n, i) => {
    const slot = `${n.letter}${n.octave}`
    const found = slots.find((s) => s.slot === slot)
    if (found) found.indexes.push(i + 1)
    else slots.push({ slot, indexes: [i + 1] })
  })
  const checkSigns = new Set<number>()
  const checkParts = slots.map(({ slot, indexes }) => {
    let current = 0
    const changes = indexes.filter((i) => {
      const changed = notes[i - 1]!.accidental !== current
      current = notes[i - 1]!.accidental
      return changed
    })
    changes.forEach((c) => checkSigns.add(c))
    const which = `${slot} (${indexes.length === 1 ? 'note' : 'notes'} ${andList(indexes)})`
    return changes.length === 0 ? `${which} never changes: no sign.` : `${which} changes at ${changes.length === 1 ? 'note' : 'notes'} ${andList(changes)}.`
  })
  const printedIndexes = rows.flatMap((row, i) => (row.printed ? [i + 1] : []))
  if (printedIndexes.join() !== [...checkSigns].sort((a, b) => a - b).join()) throw new Error('Checking pitch by pitch gives different signs')

  const printed = rows.flatMap((row, i) => (row.printed ? [{ n: i + 1, label: signSymbol(row.note.accidental) }] : []))
  const none = rows.flatMap((row, i) => (row.printed ? [] : [i + 1]))
  const summary = `Signs are printed on ${printed.length === 1 ? 'note' : 'notes'} ${andList(printed.map((s) => `${s.n} (${s.label})`))}. There is no sign on ${none.length === 1 ? 'note' : 'notes'} ${andList(none)}.`

  const accidentals = new Set(notes.map((n) => n.accidental))
  const terms: WorkedTerm[] = [
    { term: 'Bar', meaning: 'A short section of music. Bars are separated by bar lines, thin upright lines across the staff.' },
    ACCIDENTAL_TERM,
    ...[1, -1, 2, -2].filter((a) => accidentals.has(a)).map((a) => SIGN_TERMS[a]!),
    NATURAL_TERM,
    { term: 'Pitch', meaning: 'How high or low a note sounds. F4 and F5 are different pitches: same letter, different octave number.' },
  ]

  const steps: WorkedStep[] = [
    {
      title: 'Number the notes',
      text: `This is one bar (the music between two bar lines). Number the notes from the left, 1 to ${notes.length}.`,
      result: `Notes 1 to ${notes.length}`,
      staff: notesOnStaff(clef, notes),
    },
    {
      title: 'Remember the rule for accidentals',
      text: 'An accidental (a sharp, flat or natural sign) lasts until the bar line, but only for the same pitch: the same letter and the same octave number. After the bar line, every note starts again with no sign.',
      result: 'A sign holds for the same letter and octave, to the bar line',
    },
    ...rows.map((row) => ({ title: row.title, text: row.text, result: row.result })),
    {
      title: 'Check pitch by pitch',
      text: `Now go through each pitch instead of each note. A sign is needed only where a pitch changes from what is in force (starting with no sign). ${checkParts.join(' ')}`,
      result: `Signs on ${printedIndexes.length === 1 ? 'note' : 'notes'} ${andList(printedIndexes)}, as before`,
    },
  ]
  return {
    title: 'How long a sharp, flat or natural lasts',
    task: 'In this bar, which notes have a sign printed in front of them, and why do the others not need one?',
    terms,
    steps,
    answer: summary,
  }
}

/**
 * Two spellings of one sound (a sharp and a flat on neighbouring letters, such as F♯ and G♭), and why you must choose
 * by the letter the scale needs. Each of the two tonics is a major key that needs one of the spellings.
 */
export function enharmonicExample(sharpNote: Pitch, flatNote: Pitch, sharpKeyTonic: NoteName, flatKeyTonic: NoteName): WorkedExample {
  if (sharpNote.accidental !== 1 || flatNote.accidental !== -1) throw new RangeError('Give a sharp spelling first and a flat spelling second')
  if (!sameSound(sharpNote, flatNote)) throw new Error('The two spellings do not sound the same')
  // The natural letters must be a tone apart (so there is a black key between them), and the flat's letter is the next one up.
  const letterGap = midiNumber(pitch(flatNote.letter, 0, flatNote.octave)) - midiNumber(pitch(sharpNote.letter, 0, sharpNote.octave))
  if (diatonicStep(flatNote) - diatonicStep(sharpNote) !== 1 || letterGap !== 2) throw new RangeError('The two notes must be on neighbouring letters a tone apart')
  if (mod12(pitchClass(sharpNote) - pitchClass(note(sharpNote.letter))) !== 1 || mod12(pitchClass(note(flatNote.letter)) - pitchClass(flatNote)) !== 1) {
    throw new Error('A sharp must be 1 semitone above its letter and a flat 1 semitone below')
  }

  const sharpName = noteLabel(sharpNote)
  const flatName = noteLabel(flatNote)
  const same = (a: NoteName, b: NoteName) => formatNote(a) === formatNote(b)
  const sharpScale = keyScaleNotes({ tonic: sharpKeyTonic, mode: 'major' })
  const flatScale = keyScaleNotes({ tonic: flatKeyTonic, mode: 'major' })
  if (!sharpScale.some((n) => same(n, sharpNote)) || sharpScale.some((n) => same(n, flatNote))) throw new Error(`${noteLabel(sharpKeyTonic)} major must contain ${sharpName} and not ${flatName}`)
  if (!flatScale.some((n) => same(n, flatNote)) || flatScale.some((n) => same(n, sharpNote))) throw new Error(`${noteLabel(flatKeyTonic)} major must contain ${flatName} and not ${sharpName}`)

  /** The working for one key: which note number the black key is, and which neighbour already uses the other letter. */
  const choose = (scale: readonly NoteName[], tonic: NoteName, keep: Pitch, other: Pitch) => {
    const index = scale.findIndex((n) => same(n, keep)) + 1
    const letters = scale.map((n) => n.letter)
    if (new Set(letters).size !== 7) throw new Error('A major scale uses each letter once')
    // Count letters from the key note to the note: they must end on the letter of the name we keep.
    const counted = Array.from({ length: index }, (_, i) => LETTERS[(LETTERS.indexOf(tonic.letter) + i) % 7]!)
    if (counted.at(-1) !== keep.letter) throw new Error('Counting letters gives a different letter')
    const otherIndex = scale.findIndex((n) => n.letter === other.letter) + 1
    const swapped = scale.map((n, i) => (i === index - 1 ? noteLabel(other) : noteLabel(n)))
    return { index, counted, otherIndex, swapped }
  }
  const inSharp = choose(sharpScale, sharpKeyTonic, sharpNote, flatNote)
  const inFlat = choose(flatScale, flatKeyTonic, flatNote, sharpNote)
  const scaleText = (scale: readonly NoteName[]) => scale.map((n) => noteLabel(n)).join(' ')
  const sharpTonic = noteLabel(sharpKeyTonic)
  const flatTonic = noteLabel(flatKeyTonic)

  const decide = (key: string, work: ReturnType<typeof choose>, keep: Pitch, other: Pitch, scale: readonly NoteName[]): WorkedStep => ({
    title: `Choose the name in ${key} major`,
    text: `The black key is note ${work.index} of ${key} major. Count ${work.index} letters from the key note: ${work.counted.join(', ')}. So note ${work.index} must use the letter ${keep.letter}. The letter ${other.letter} is already used by note ${work.otherIndex}, ${noteLabel(scale[work.otherIndex - 1]!)}. So the name is ${noteLabel(keep)}.`,
    result: `${key} major uses ${noteLabel(keep)}`,
  })

  return {
    title: `${sharpName} or ${flatName}? Choosing the spelling`,
    task: `${sharpName} and ${flatName} sound the same. How do you decide which one to write?`,
    terms: [
      SEMITONE_TERM,
      TONE_TERM,
      SIGN_TERMS[1]!,
      SIGN_TERMS[-1]!,
      { term: 'Enharmonic equivalents', meaning: 'Two names for the same sound, such as F♯ and G♭. They are the same piano key.' },
      { term: 'Scale', meaning: 'A set of notes in order of pitch, using each letter name once.' },
      { term: 'Key note', meaning: 'The note a scale starts on and is named after. D major starts on D.' },
    ],
    steps: [
      {
        title: 'Listen to the two notes',
        text: `Play ${sharpName}, then ${flatName}. They sound exactly the same.`,
        result: 'The same sound',
        staff: notesOnStaff('treble', [sharpNote, flatNote]),
        listen: listenMelody(`Hear ${sharpName} then ${flatName}`, [sharpNote, flatNote]),
      },
      {
        title: `Find ${sharpName} on the piano`,
        text: `A sharp (♯) raises a note by 1 semitone (from one piano key to the very next). So ${sharpName} is 1 semitone above ${sharpNote.letter}: the black key just above ${sharpNote.letter}.`,
        result: `${sharpName}: the key just above ${sharpNote.letter}`,
      },
      {
        title: `Find ${flatName} on the piano`,
        text: `A flat (♭) lowers a note by 1 semitone. So ${flatName} is 1 semitone below ${flatNote.letter}: the black key just below ${flatNote.letter}.`,
        result: `${flatName}: the key just below ${flatNote.letter}`,
      },
      {
        title: 'See that they are the same key',
        text: `${sharpNote.letter} up to ${flatNote.letter} is a tone (2 semitones), so there is exactly one key between them. ${sharpName} and ${flatName} both name that key. Two names for one sound are called enharmonic equivalents.`,
        result: `${sharpName} and ${flatName} are enharmonic equivalents`,
      },
      {
        title: 'Compare the letters',
        text: `${sharpName} uses the letter ${sharpNote.letter}. ${flatName} uses the letter ${flatNote.letter}. A scale (notes in order of pitch) uses each letter name once, so the letter the scale needs decides the name.`,
        result: `${sharpName} uses ${sharpNote.letter}; ${flatName} uses ${flatNote.letter}`,
      },
      {
        title: `Write out ${sharpTonic} major`,
        text: `${sharpTonic} major starts on its key note (the note it is named after), ${sharpTonic}. Its notes are ${scaleText(sharpScale)}. Its letters are ${sharpScale.map((n) => n.letter).join(' ')}: each letter once.`,
        result: scaleText(sharpScale),
      },
      decide(sharpTonic, inSharp, sharpNote, flatNote, sharpScale),
      {
        title: `Write out ${flatTonic} major`,
        text: `${flatTonic} major starts on ${flatTonic}. Its notes are ${scaleText(flatScale)}. Its letters are ${flatScale.map((n) => n.letter).join(' ')}: each letter once.`,
        result: scaleText(flatScale),
      },
      decide(flatTonic, inFlat, flatNote, sharpNote, flatScale),
      {
        title: 'Check by trying the other name',
        text: `Swap the names and see what goes wrong. ${sharpTonic} major with ${flatName} would be ${inSharp.swapped.join(' ')}: two ${flatNote.letter}s and no ${sharpNote.letter}. ${flatTonic} major with ${sharpName} would be ${inFlat.swapped.join(' ')}: two ${sharpNote.letter}s and no ${flatNote.letter}. Both are wrong, so the choices stand.`,
        result: `${sharpName} in ${sharpTonic} major, ${flatName} in ${flatTonic} major`,
      },
    ],
    answer: `${sharpName} and ${flatName} are the same sound. Write the one whose letter you need: ${sharpName} in ${sharpTonic} major, ${flatName} in ${flatTonic} major.`,
  }
}
