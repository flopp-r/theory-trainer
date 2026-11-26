import type { WorkedExample, WorkedStep } from '../types'
import {
  CLEF_NAMES,
  LETTERS,
  type ClefName,
  type Pitch,
  clefLabel,
  describeStaffPosition,
  diatonicStep,
  formatPitch,
  guitarSoundingPitch,
  midiNumber,
  pitch,
  pitchAtPosition,
  staffPlacement,
  staffPosition,
} from '../../../theory'
import { clefAnchor } from '../../../questions/noteName'
import { listenMelody } from './audio'
import { notesOnStaff } from './common'

/*
 * Builders about clefs and where notes sit on the staff: placing a note, converting a note to another clef,
 * middle C in every clef, the guitar's sounding pitch, and the tables of line and space notes.
 * Counting is done long-hand (letter by letter, with the octave number going up at each C) and every
 * result is cross-checked against the theory engine. A disagreement throws, so a wrong example cannot be shown.
 */

const sym = (p: Pitch) => formatPitch(p, 'symbol')
const stepsText = (n: number) => `${n} ${n === 1 ? 'step' : 'steps'}`
const clefWord = (clef: ClefName) => clefLabel(clef).toLowerCase()

/**
 * Walks from one natural note to another, one letter at a time, and returns every note on the way (both ends included).
 * The octave number goes up by one when you pass a C going up, and down by one when you leave a C going down.
 */
export function countPath(from: Pitch, to: Pitch): Pitch[] {
  const n = diatonicStep(to) - diatonicStep(from)
  const direction = n >= 0 ? 1 : -1
  let letter = from.letter
  let octave = from.octave
  const path: Pitch[] = [pitch(letter, 0, octave)]
  for (let i = 0; i < Math.abs(n); i++) {
    const index = LETTERS.indexOf(letter)
    if (direction === 1) {
      letter = LETTERS[(index + 1) % 7]!
      if (letter === 'C') octave += 1
    } else {
      if (letter === 'C') octave -= 1
      letter = LETTERS[(index + 6) % 7]!
    }
    path.push(pitch(letter, 0, octave))
  }
  if (letter !== to.letter || octave !== to.octave) throw new Error('Counting by letters did not end on the note asked for')
  return path
}

/** The note on the clef's anchor line, with its octave: treble G4, bass F3, alto and tenor C4. */
export function anchorPitch(clef: ClefName): Pitch {
  const info = clefAnchor(clef)
  const found = pitchAtPosition(info.position, clef)
  if (found.letter !== info.letter) throw new Error(`Anchor letter for ${clef} clef disagrees with the theory engine`)
  return found
}

/** The staff places walked through while counting, e.g. "the 2nd line, the 2nd space, the middle line, the 3rd space". */
function walkText(startPosition: number, count: number, direction: 1 | -1): string {
  const places = Array.from({ length: count + 1 }, (_, i) => describeStaffPosition(startPosition + direction * i))
  return places.join(', then ')
}

interface LedgerInfo {
  readonly count: number
  readonly side: 'above' | 'below' | null
  readonly text: string
}

/** Ledger lines worked out by hand, then checked against the engine. */
function ledgerInfo(position: number, p: Pitch, clef: ClefName): LedgerInfo {
  const distance = position < 0 ? -position : position > 8 ? position - 8 : 0 // 1 = the space just outside the staff
  const count = Math.floor(distance / 2)
  const side = position < 0 ? 'below' : position > 8 ? 'above' : null
  const engine = staffPlacement(p, clef)
  if (engine.ledgerLines !== count || (count > 0 && engine.ledgerSide !== side)) throw new Error('Ledger line count disagrees with the theory engine')
  if (side === null) return { count: 0, side: null, text: 'The note fits on the five lines and four spaces of the staff, so it needs **no ledger lines**.' }
  if (count === 0) {
    return { count, side, text: `The note is in the space just ${side} the staff. That space is part of the normal gap, so it needs **no ledger lines**.` }
  }
  const onLine = position % 2 === 0
  const lines = `${count === 1 ? '**1 ledger line**' : `**${count} ledger lines**`}`
  return {
    count,
    side,
    text: onLine
      ? `The note is outside the staff, so it needs ledger lines. Draw ${lines} ${side} the staff, spaced like the staff lines. The note head is centred on the last one.`
      : `The note is outside the staff, so it needs ledger lines. Draw ${lines} ${side} the staff, spaced like the staff lines. The note head sits in the space just beyond the last ledger line.`,
  }
}

function assertNatural(p: Pitch): void {
  if (p.accidental !== 0) throw new RangeError('This example is for natural notes (no sharp or flat)')
}

/**
 * "Where does this note go on the staff?" Counts from the clef's anchor, with the octave number, and ends with where to draw the note.
 */
export function placeNoteExample(clef: ClefName, target: Pitch): WorkedExample {
  assertNatural(target)
  const anchor = anchorPitch(clef)
  const info = clefAnchor(clef)
  const path = countPath(anchor, target)
  const moved = path.length - 1
  const direction: 1 | -1 = diatonicStep(target) >= diatonicStep(anchor) ? 1 : -1
  const position = info.position + direction * moved
  if (position !== staffPosition(target, clef)) throw new Error('Counted position disagrees with the theory engine')
  const back = pitchAtPosition(position, clef)
  if (back.letter !== target.letter || back.octave !== target.octave) throw new Error('Position does not give the note back')

  const name = sym(target)
  const ledger = ledgerInfo(position, target, clef)
  const where = describeStaffPosition(position)
  const middleC = target.letter === 'C' && target.octave === 4
  const goes = `goes on **${where}**`

  const octaveStep: WorkedStep = {
    text: `Read the name: **${name}**${middleC ? ' (middle C)' : ''}. The letter is **${target.letter}**. The number, **${target.octave}**, is the octave number. It changes at every C: octave ${target.octave} runs from C${target.octave} up to B${target.octave}, and the next note after B${target.octave} is C${target.octave + 1}.${middleC ? ' (In Practice the question says "Middle C is C4" to remind you.)' : ''}`,
  }
  const steps: WorkedStep[] = [
    octaveStep,
    {
      text: `${info.description}. In ${clefWord(clef)} that note is **${sym(anchor)}**, on ${describeStaffPosition(info.position)}.`,
      staff: notesOnStaff(clef, [anchor]),
    },
    moved === 0
      ? { text: `Your note is the anchor note itself, so there is nothing to count: ${name} ${goes}.` }
      : {
          text: `Count **${stepsText(moved)} ${direction === 1 ? 'up' : 'down'}** from ${sym(anchor)}, one letter at a time, ${direction === 1 ? 'adding 1 to the octave number when you pass a C' : 'taking 1 off the octave number when you step down from a C'}: **${path.map(sym).join(', ')}**. The last note is ${name}, so you have the right letter **and** the right octave.`,
        },
    moved === 0
      ? { text: `The anchor is on ${describeStaffPosition(info.position)}.` }
      : {
          text: `Now take the same ${stepsText(moved)} on the staff, one line or space at a time, going ${direction === 1 ? 'up' : 'down'}: ${walkText(info.position, moved, direction)}. Your note is on **${where}**.`,
        },
    { text: ledger.text },
    {
      text: `Draw the note head **centred** on ${where}${position % 2 === 0 ? ': the line passes through the middle of the head' : ': the head fills the space, touching the line above and the line below'}.`,
      staff: notesOnStaff(clef, [target]),
    },
    {
      text: `Check: read it back with the naming method. From the anchor ${sym(anchor)}, ${moved === 0 ? 'there is nothing to count' : `${stepsText(moved)} ${direction === 1 ? 'up' : 'down'} lands on ${target.letter}`}. The letter ${target.letter} and the octave number ${target.octave} both match ${name}.`,
    },
  ]
  return {
    title: `Place ${name} on ${clefWord(clef)} staff`,
    task: `Where does ${name}${middleC ? ' (middle C)' : ''} go on the ${clefWord(clef)} staff?`,
    steps,
    answer: `${name} ${goes}${ledger.count > 0 ? ` (you need ${ledger.count === 1 ? '1 ledger line' : `${ledger.count} ledger lines`})` : ''}.`,
  }
}

/** The text for the "not the same pitch" trap: what you get by copying the staff position into the new clef. */
function trapText(position: number, to: ClefName, target: Pitch): string {
  const wrong = pitchAtPosition(position, to)
  const gap = Math.abs(midiNumber(wrong) - midiNumber(target))
  const higher = midiNumber(wrong) > midiNumber(target)
  return `Do not copy the place on the staff. The same place (${describeStaffPosition(position)}) in ${clefWord(to)} is **${sym(wrong)}**, which sounds ${gap} semitone${gap === 1 ? '' : 's'} ${higher ? 'higher' : 'lower'} than ${sym(target)}. It is a different pitch.`
}

/**
 * Writes a note again in a different clef. Works out the letter and octave in the first clef,
 * then counts from the second clef's anchor. Cross-checks that the sound (MIDI number) is unchanged.
 */
export function convertClefExample(target: Pitch, fromClef: ClefName, toClef: ClefName): WorkedExample {
  assertNatural(target)
  if (fromClef === toClef) throw new RangeError('Choose two different clefs')
  const fromAnchor = anchorPitch(fromClef)
  const fromInfo = clefAnchor(fromClef)
  const toAnchor = anchorPitch(toClef)
  const toInfo = clefAnchor(toClef)

  const fromPath = countPath(fromAnchor, target)
  const fromMoved = fromPath.length - 1
  const fromDir: 1 | -1 = diatonicStep(target) >= diatonicStep(fromAnchor) ? 1 : -1
  const fromPosition = fromInfo.position + fromDir * fromMoved
  if (fromPosition !== staffPosition(target, fromClef)) throw new Error('Position in the first clef disagrees with the theory engine')

  const toPath = countPath(toAnchor, target)
  const toMoved = toPath.length - 1
  const toDir: 1 | -1 = diatonicStep(target) >= diatonicStep(toAnchor) ? 1 : -1
  const toPosition = toInfo.position + toDir * toMoved
  const converted = pitchAtPosition(toPosition, toClef)
  if (midiNumber(converted) !== midiNumber(target) || converted.letter !== target.letter || converted.octave !== target.octave) {
    throw new Error('The note written in the new clef does not sound the same')
  }
  if (staffPlacement(target, fromClef).ledgerLines > 3 || staffPlacement(target, toClef).ledgerLines > 3) {
    throw new RangeError('The note needs more than 3 ledger lines in one of the clefs')
  }

  const name = sym(target)
  const toLedger = ledgerInfo(toPosition, target, toClef)
  const fromWhere = describeStaffPosition(fromPosition)
  const toWhere = describeStaffPosition(toPosition)

  return {
    title: `Convert a note from ${clefWord(fromClef)} to ${clefWord(toClef)}`,
    task: `This note is written in ${clefWord(fromClef)}. Write the same pitch in ${clefWord(toClef)}.`,
    steps: [
      { text: `Look at the note in ${clefWord(fromClef)}. It sits on **${fromWhere}**.`, staff: notesOnStaff(fromClef, [target]) },
      {
        text:
          fromMoved === 0
            ? `${fromInfo.description}. The note is on that line, so it is **${name}**.`
            : `Name it with its octave. ${fromInfo.description}, so the anchor is **${sym(fromAnchor)}**. Count **${stepsText(fromMoved)} ${fromDir === 1 ? 'up' : 'down'}**: **${fromPath.map(sym).join(', ')}**. The note is **${name}**.`,
      },
      {
        text: `Keep that name. The pitch is fixed by the letter **and** the octave number, so in ${clefWord(toClef)} you must write **${name}** again.`,
      },
      {
        text: `Now go to ${clefWord(toClef)}. ${toInfo.description}. In this clef that note is **${sym(toAnchor)}**, on ${describeStaffPosition(toInfo.position)}.`,
        staff: notesOnStaff(toClef, [toAnchor]),
      },
      {
        text:
          toMoved === 0
            ? `${name} is the anchor note, so it goes on ${describeStaffPosition(toInfo.position)}.`
            : `Count from ${sym(toAnchor)} to ${name}: **${stepsText(toMoved)} ${toDir === 1 ? 'up' : 'down'}**: **${toPath.map(sym).join(', ')}**. On the staff that is ${walkText(toInfo.position, toMoved, toDir)}. So ${name} goes on **${toWhere}**.`,
      },
      { text: toLedger.text },
      {
        text: `Here is ${name} written in ${clefWord(toClef)}.`,
        staff: notesOnStaff(toClef, [converted]),
      },
      { text: trapText(fromPosition, toClef, target) },
      {
        text: `Check: both staves show **${name}** (letter ${target.letter}, octave ${target.octave}). The note moved from ${fromWhere} to ${toWhere}, but the sound is the same.`,
      },
    ],
    answer: `Write ${name} on ${toWhere} in ${clefWord(toClef)}${toLedger.count > 0 ? ` (you need ${toLedger.count === 1 ? '1 ledger line' : `${toLedger.count} ledger lines`})` : ''}.`,
  }
}

/** Middle C (C4) written in each of the four clefs. */
export function middleCInClefsExample(): WorkedExample {
  const middleC = pitch('C', 0, 4)
  const steps: WorkedStep[] = []
  const places: string[] = []
  for (const clef of CLEF_NAMES) {
    const anchor = anchorPitch(clef)
    const info = clefAnchor(clef)
    const path = countPath(anchor, middleC)
    const moved = path.length - 1
    const direction: 1 | -1 = diatonicStep(middleC) >= diatonicStep(anchor) ? 1 : -1
    const position = info.position + direction * moved
    if (position !== staffPosition(middleC, clef)) throw new Error(`Middle C in ${clef} clef disagrees with the theory engine`)
    if (midiNumber(pitchAtPosition(position, clef)) !== 60) throw new Error('Middle C must be MIDI 60 in every clef')
    const where = describeStaffPosition(position)
    places.push(`${clefWord(clef)}: ${where}`)
    steps.push({
      text:
        moved === 0
          ? `**${clefLabel(clef)}.** ${info.description}. That note is middle C, so there is nothing to count. Middle C is on **${where}**.`
          : `**${clefLabel(clef)}.** ${info.description}, so the anchor is ${sym(anchor)}. Count **${stepsText(moved)} ${direction === 1 ? 'up' : 'down'}**: ${path.map(sym).join(', ')}. Middle C is on **${where}**.`,
      staff: notesOnStaff(clef, [middleC]),
    })
  }
  steps.push({
    text: 'Check: all four pictures show the same note, **C4**. The place on the staff is different in each clef, but the sound is the same.',
  })
  return {
    title: 'Middle C in all four clefs',
    task: 'Where is middle C (C4) written in treble, bass, alto and tenor clef?',
    steps,
    answer: `Middle C is on ${places.join('; ')}.`,
  }
}

/**
 * Guitar music is written one octave higher than it sounds.
 * Takes the note as written (in treble clef) and works out the note you hear.
 */
export function guitarSoundingExample(written: Pitch): WorkedExample {
  assertNatural(written)
  const anchor = anchorPitch('treble')
  const info = clefAnchor('treble')
  const path = countPath(anchor, written)
  const moved = path.length - 1
  const direction: 1 | -1 = diatonicStep(written) >= diatonicStep(anchor) ? 1 : -1
  const position = info.position + direction * moved
  if (position !== staffPosition(written, 'treble')) throw new Error('Written position disagrees with the theory engine')

  // Long-hand: same letter, octave number one lower. Then the engine must agree, and the sound must be 12 semitones lower.
  const sounding = pitch(written.letter, 0, written.octave - 1)
  const engine = guitarSoundingPitch(written)
  if (engine.letter !== sounding.letter || engine.accidental !== sounding.accidental || engine.octave !== sounding.octave) {
    throw new Error('Guitar sounding pitch disagrees with the theory engine')
  }
  if (midiNumber(written) - midiNumber(sounding) !== 12) throw new Error('An octave must be 12 semitones')

  const w = sym(written)
  const s = sym(sounding)
  return {
    title: 'Guitar: written note and sounding note',
    task: `A guitar part is written in treble clef. What note do you hear when the player plays the note written as ${w}?`,
    steps: [
      { text: `Look at the written note. It sits on **${describeStaffPosition(position)}**.`, staff: notesOnStaff('treble', [written]) },
      {
        text:
          moved === 0
            ? `${info.description}. The note is on that line, so it is **${w}**.`
            : `Name it with its octave. ${info.description}, so the anchor is **${sym(anchor)}**. Count **${stepsText(moved)} ${direction === 1 ? 'up' : 'down'}**: **${path.map(sym).join(', ')}**. The written note is **${w}**.`,
      },
      {
        text: `The guitar **sounds one octave lower than it is written**. Keep the letter (${written.letter}) and take 1 off the octave number: ${written.octave} becomes ${sounding.octave}. The note you hear is **${s}**.`,
      },
      {
        text: `Here are the two notes: the sounding note ${s} on the left, and the written note ${w} on the right.`,
        staff: notesOnStaff('treble', [sounding, written]),
        listen: listenMelody(`Hear ${s} then ${w}`, [sounding, written]),
      },
      {
        text: `Check: an octave is 12 semitones, and ${s} is 12 semitones below ${w}. Same letter name, different octave number.`,
      },
    ],
    answer: `The written note ${w} sounds as ${s}, one octave lower.`,
  }
}

/** Labels for the lines and spaces of the staff, from the bottom up (position 0 to 8). */
export const STAFF_PLACE_LABELS: readonly string[] = [
  '1st line (bottom)',
  '1st space',
  '2nd line',
  '2nd space',
  '3rd line (middle)',
  '3rd space',
  '4th line',
  '4th space',
  '5th line (top)',
]

/** Rows for a table: the place on the staff, then the letter of the natural note there in each clef. Bottom to top. */
export function staffLetterRows(clefs: readonly ClefName[]): string[][] {
  return STAFF_PLACE_LABELS.map((label, position) => [label, ...clefs.map((clef) => pitchAtPosition(position, clef).letter)])
}

/**
 * A memory aid with the first letter of each word in bold. Throws if the first letters are not the letters it is meant to give,
 * so a memory aid that does not fit cannot be shown.
 */
export function memoryAid(phrase: string, letters: string): string {
  const words = phrase.split(' ')
  const initials = words.map((w) => w.charAt(0)).join('')
  if (initials !== letters) throw new Error(`"${phrase}" gives ${initials}, not ${letters}`)
  return words.map((w) => `**${w.charAt(0)}**${w.slice(1)}`).join(' ')
}
