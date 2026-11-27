import type { WorkedExample, WorkedStep, WorkedTerm } from '../types'
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
  lineNotes,
  midiNumber,
  pitch,
  pitchAtPosition,
  spaceNotes,
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
 * The clef sentences, the "Words you need" and the counting helpers here are shared with notes.ts and accidentals.ts.
 */

export const sym = (p: Pitch): string => formatPitch(p, 'symbol')
export const stepsText = (n: number): string => `${n} ${n === 1 ? 'step' : 'steps'}`
export const clefWord = (clef: ClefName): string => clefLabel(clef).toLowerCase()
export const cap = (text: string): string => text.charAt(0).toUpperCase() + text.slice(1)
const ORDINALS = ['1st', '2nd', '3rd', '4th', '5th']

/** "on the bottom line", "in the 2nd space": notes sit on lines and in spaces. */
export function atPlace(position: number): string {
  return `${Math.abs(position) % 2 === 0 ? 'on' : 'in'} ${describeStaffPosition(position)}`
}

/** A place on the staff without "the", for lists: "2nd line", "space below the bottom line". */
const shortPlace = (position: number) => describeStaffPosition(position).replace(/^the /, '')

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

/** The note on the clef's own line, with its octave: treble G4, bass F3, alto and tenor C4. */
export function anchorPitch(clef: ClefName): Pitch {
  const info = clefAnchor(clef)
  const found = pitchAtPosition(info.position, clef)
  if (found.letter !== info.letter) throw new Error(`The letter of the ${clef} clef's line disagrees with the theory engine`)
  return found
}

/** What each clef sign does, in words. Checked against the engine's anchor lines in `clefSentence`. */
const CLEF_SIGN: Record<ClefName, { readonly sign: string; readonly position: number; readonly why?: string }> = {
  treble: { sign: "The treble clef's curl circles", position: 2, why: 'That is why it is also called the G clef.' },
  bass: { sign: "The bass clef's two dots sit either side of", position: 6, why: 'That is why it is also called the F clef.' },
  alto: { sign: "The alto clef's two curves point at", position: 4 },
  tenor: { sign: "The tenor clef's two curves point at", position: 6 },
}

/**
 * "The treble clef's curl circles the 2nd line, so that line is G." With `octave`, the note gets its octave number.
 * With `why`, adds where the other name (G clef, F clef) comes from, or what middle C is.
 */
export function clefSentence(clef: ClefName, options: { octave?: boolean; why?: boolean } = {}): string {
  const facts = CLEF_SIGN[clef]
  const info = clefAnchor(clef)
  if (facts.position !== info.position) throw new Error(`The ${clef} clef sentence names the wrong line`)
  const anchor = anchorPitch(clef)
  const line = describeStaffPosition(info.position)
  const isC = anchor.letter === 'C'
  const name = isC ? (options.octave ? 'middle C, C4' : 'middle C') : options.octave ? sym(anchor) : anchor.letter
  if (isC && (anchor.octave !== 4 || midiNumber(anchor) !== 60)) throw new Error('A C clef must point at middle C')
  const extra = options.why ? (isC ? ' (the C nearest the middle of a piano)' : '') : ''
  const why = options.why && facts.why ? ` ${facts.why}` : ''
  return `${facts.sign} ${line}, so that line is ${name}${extra}.${why}`
}

/** "The 2nd line is G", "The middle line is middle C": the result line for the step that finds the clef's line. */
export function clefResult(clef: ClefName, octave = false): string {
  const anchor = anchorPitch(clef)
  const line = cap(describeStaffPosition(clefAnchor(clef).position))
  if (anchor.letter === 'C') return `${line} is middle C${octave ? ', C4' : ''}`
  return `${line} is ${octave ? sym(anchor) : anchor.letter}`
}

/* "Words you need", shared by the note-naming builders. Each meaning is one sentence of at most 30 words. */
export const STAFF_TERM: WorkedTerm = { term: 'Staff (or stave)', meaning: 'The five lines and four spaces that music is written on. Lines and spaces are counted from the bottom up.' }
export const STEP_TERM: WorkedTerm = { term: 'Step', meaning: 'A move from a line to the very next space, or from a space to the very next line. One step up gives the next letter name.' }
export const ALPHABET_TERM: WorkedTerm = { term: 'Musical alphabet', meaning: 'The seven letter names used for notes: A B C D E F G. After G it starts again at A.' }
export const LEDGER_TERM: WorkedTerm = { term: 'Ledger line', meaning: 'A short extra line drawn above or below the staff, for a note too high or too low to fit on the five lines.' }
export const MIDDLE_C_TERM: WorkedTerm = { term: 'Middle C', meaning: 'The C nearest the middle of a piano keyboard. With its octave number it is written C4.' }
export const OCTAVE_NUMBER_TERM: WorkedTerm = {
  term: 'Octave number',
  meaning: 'The number after a letter name, as in E4. It goes up by 1 each time you pass a C going up. Middle C is C4.',
}
export const PITCH_TERM: WorkedTerm = { term: 'Pitch', meaning: 'How high or low a note sounds. It is fixed by the letter name and the octave number together.' }

const CLEF_TERMS: Record<ClefName, WorkedTerm> = {
  treble: { term: 'Treble clef (G clef)', meaning: 'The clef for higher notes. Its curl circles the 2nd line up and fixes it as G, so it is also called the G clef.' },
  bass: { term: 'Bass clef (F clef)', meaning: 'The clef for lower notes. Its two dots sit either side of the 4th line up and fix it as F, so it is also called the F clef.' },
  alto: { term: 'Alto clef', meaning: 'A C clef: its centre points at the middle line, which makes that line middle C. The viola reads alto clef.' },
  tenor: { term: 'Tenor clef', meaning: 'A C clef: its centre points at the 4th line up, which makes that line middle C. Cellos, bassoons and trombones use it for high notes.' },
}
/** The "Words you need" entry for a clef. A clef is the sign at the start of the staff that fixes one line to one letter. */
export const clefTerm = (clef: ClefName): WorkedTerm => CLEF_TERMS[clef]

export interface Walk {
  /** Every note on the way, both ends included, with octave numbers. */
  readonly path: Pitch[]
  readonly moved: number
  readonly direction: 1 | -1
  /** Where the last note sits. */
  readonly position: number
  /** "2nd line G, bottom space F, bottom line E": each place with its letter (or note, with `octave`). */
  readonly pairs: string
  /** The places where the octave number changed: [C4, B3]. */
  readonly crossings: [Pitch, Pitch][]
}

/**
 * Counts up or down the staff from one note to another, one line or space at a time, naming each place.
 * The letters come from `countPath` (counted by hand); each place is checked against the engine's note at that position.
 */
export function walkStaff(clef: ClefName, from: Pitch, to: Pitch, octave: boolean): Walk {
  const path = countPath(from, to)
  const moved = path.length - 1
  const direction: 1 | -1 = diatonicStep(to) >= diatonicStep(from) ? 1 : -1
  const start = staffPosition(from, clef)
  const pairs = path.map((p, i) => {
    const position = start + direction * i
    const engine = pitchAtPosition(position, clef)
    if (engine.letter !== p.letter || engine.octave !== p.octave) throw new Error(`Counting on the ${clef} staff disagrees with the theory engine`)
    return `${shortPlace(position)} ${octave ? sym(p) : p.letter}`
  })
  const crossings = crossingsOf(path)
  const position = start + direction * moved
  if (position !== staffPosition(to, clef)) throw new Error('Counted position disagrees with the theory engine')
  return { path, moved, direction, position, pairs: pairs.join(', '), crossings }
}

/** The places in a count where the octave number changed: [B3, C4]. */
function crossingsOf(path: readonly Pitch[]): [Pitch, Pitch][] {
  return path.slice(1).flatMap((p, i) => (p.octave !== path[i]!.octave ? [[path[i]!, p] as [Pitch, Pitch]] : []))
}

/** " Each octave starts on C: from B3 to C4 the number goes up." Or '' if the count did not change octave. */
export function crossingSentence(walk: Pick<Walk, 'crossings'>): string {
  if (walk.crossings.length === 0) return ''
  const up = walk.crossings.every(([a, b]) => b.octave > a.octave)
  const changes = walk.crossings.map(([a, b]) => `${sym(a)} to ${sym(b)}`).join(' and ')
  return ` Each octave starts on C: from ${changes} the number ${up ? 'goes up' : 'drops'}.`
}

/** Memory aids for the line and space notes, checked against the engine's letters before they are shown. */
const AIDS: Partial<Record<ClefName, { lines: string; spaces?: string; spacesWord?: string }>> = {
  treble: { lines: 'Every Good Boy Deserves Football', spacesWord: 'FACE' },
  bass: { lines: 'Good Boys Do Fine Always', spaces: 'All Cows Eat Grass' },
}

function aidFor(clef: ClefName, kind: 'lines' | 'spaces'): string {
  const aid = AIDS[clef]
  if (!aid) return ''
  const letters = (kind === 'lines' ? lineNotes(clef) : spaceNotes(clef)).map((p) => p.letter).join('')
  if (kind === 'spaces' && aid.spacesWord) {
    if (aid.spacesWord !== letters) throw new Error(`The ${clef} spaces do not spell ${aid.spacesWord}`)
    return ` (they spell ${aid.spacesWord})`
  }
  const phrase = kind === 'lines' ? aid.lines : aid.spaces
  if (!phrase) return ''
  if (phrase.split(' ').map((w) => w.charAt(0)).join('') !== letters) throw new Error(`"${phrase}" does not give ${letters}`)
  return ` (memory aid: ${phrase})`
}

/**
 * The check used by the note-naming builders, a different route from counting every step from the clef's line:
 * use lines only (or spaces only). Inside the staff, read the note from the list of line (or space) notes.
 * Outside it, carry that list on past the staff, every other letter. Checked against the engine's note at each place.
 */
export function edgeCheck(clef: ClefName, position: number, octave: boolean): { title: string; text: string; found: Pitch } {
  const label = (p: Pitch) => (octave ? sym(p) : p.letter)
  const target = pitchAtPosition(position, clef)
  const onLine = Math.abs(position) % 2 === 0
  const kind = onLine ? 'lines' : 'spaces'
  const notes = onLine ? lineNotes(clef) : spaceNotes(clef)
  const list = `In ${clefWord(clef)} the ${kind}, from the bottom, are ${notes.map(label).join(' ')}${aidFor(clef, kind)}.`
  if (position >= 0 && position <= 8) {
    const index = onLine ? position / 2 : (position - 1) / 2
    const found = notes[index]!
    if (found.letter !== target.letter || found.octave !== target.octave) throw new Error('The line and space notes disagree with the theory engine')
    const place = describeStaffPosition(position)
    const which = /\d/.test(place) ? '' : `, the ${ORDINALS[index]} ${onLine ? 'line' : 'space'} up`
    return {
      title: `Check with the ${kind} of the ${clefWord(clef)}`,
      text: `Read the note from a list instead of counting from the clef. ${list} Your note is ${atPlace(position)}${which}, so it is ${label(found)}.`,
      found,
    }
  }
  // Outside the staff: carry the list on, two steps (one line or one space) at a time, every other letter.
  const up = position > 8
  let current = up ? notes.at(-1)! : notes[0]!
  let at = up ? (onLine ? 8 : 7) : onLine ? 0 : 1
  const extra: string[] = []
  while (at !== position) {
    at += up ? 2 : -2
    const step = diatonicStep(current) + (up ? 2 : -2)
    current = pitch(LETTERS[((step % 7) + 7) % 7]!, 0, Math.floor(step / 7))
    const engine = pitchAtPosition(at, clef)
    if (engine.letter !== current.letter || engine.octave !== current.octave) throw new Error('Counting every other letter disagrees with the theory engine')
    extra.push(`${shortPlace(at).replace(/ (above|below) the staff$/, '')} ${label(current)}`)
    if (extra.length > 8) throw new Error('Too far outside the staff')
  }
  return {
    title: `Check using the ${kind} only`,
    text: `From one ${onLine ? 'line' : 'space'} to the next is every other letter (one letter is skipped). ${list} Carry on ${up ? 'above' : 'below'} the staff, every other letter${up ? '' : ' backwards'}: ${extra.join(', ')}.`,
    found: current,
  }
}

/** Options for `countSteps`. */
export interface CountOptions {
  /** Show octave numbers (E4) or letters only (E). */
  readonly octave: boolean
  /** Name of the note you are counting to, for the sentence: "C4", "Your note". */
  readonly toName: string
  /** Name of the note for the step title: "C4", "the note". */
  readonly toTitle: string
  /** Add the reminder of what a step is. */
  readonly explainStep?: boolean
  /** Add the reminder of what the musical alphabet is. */
  readonly explainAlphabet?: boolean
  /** Add the reminder of what a ledger line is. */
  readonly explainLedger?: boolean
}

/**
 * The counting steps from one note to another on the staff, naming every line and space on the way.
 * Inside the staff this is one step. When the note is outside the staff it is two: up (or down) to the edge of the staff,
 * then on along the ledger lines. Returns the whole walk too.
 */
export function countSteps(clef: ClefName, from: Pitch, to: Pitch, o: CountOptions): { walk: Walk; steps: WorkedStep[] } {
  const walk = walkStaff(clef, from, to, o.octave)
  if (walk.moved === 0) throw new RangeError('Nothing to count')
  const label = (p: Pitch) => (o.octave ? sym(p) : p.letter)
  const dir = walk.direction === 1 ? 'up' : 'down'
  const way = walk.direction === 1 ? 'forwards' : 'backwards'
  const startInside = staffPosition(from, clef) >= 0 && staffPosition(from, clef) <= 8
  const outside = walk.position < 0 || walk.position > 8
  const edge = walk.direction === 1 ? 8 : 0
  const split = outside && startInside && staffPosition(from, clef) !== edge
  const first = split ? walkStaff(clef, from, pitchAtPosition(edge, clef), o.octave) : walk
  const stepWord = o.explainStep ? ' (a move to the very next line or space)' : ''
  const saying = o.explainAlphabet ? `Say the musical alphabet (A to G, then A again) ${way}, one letter per step${stepWord}` : `Say the letters ${way}, one per step${stepWord}`
  const steps: WorkedStep[] = [
    {
      title: split ? `Count ${dir} from ${label(from)} to the ${walk.direction === 1 ? 'top' : 'bottom'} line` : `Count ${dir} from ${label(from)} to ${o.toTitle}`,
      text: `${o.toName} is ${walk.direction === 1 ? 'higher' : 'lower'} than ${label(from)}. ${saying}: ${first.pairs}.${o.octave ? crossingSentence(first) : ''}`,
      result: o.octave
        ? `${stepsText(first.moved)} ${dir}: ${label(first.path.at(-1)!)} ${atPlace(first.position)}`
        : `${stepsText(first.moved)} ${dir}: ${first.path.map(label).join(', ')}`,
    },
  ]
  if (split) {
    const second = walkStaff(clef, pitchAtPosition(edge, clef), to, o.octave)
    const ledger = o.explainLedger ? ', on ledger lines (short extra lines) and the spaces between' : ', on ledger lines and the spaces between'
    steps.push({
      title: `Carry on ${walk.direction === 1 ? 'above' : 'below'} the staff`,
      text: `Keep counting ${dir}${ledger}: ${second.pairs.split(', ').slice(1).map((pair) => pair.replace(/ (above|below) the staff /, ' ')).join(', ')}. That is ${stepsText(second.moved).replace(/steps?/, (w) => `more ${w}`)}, ${walk.moved} in all.${o.octave ? crossingSentence(second) : ''}`,
      result: o.octave
        ? `${stepsText(walk.moved)} ${dir} in all: ${label(to)}`
        : `${stepsText(second.moved).replace(/steps?/, (w) => `more ${w}`)}: ${second.path.slice(1).map(label).join(', ')}`,
    })
  }
  return { walk, steps }
}

interface LedgerInfo {
  readonly count: number
  readonly side: 'above' | 'below' | null
  readonly title: string
  readonly text: string
  readonly result: string
}

const ledgerCount = (n: number) => (n === 1 ? '1 ledger line' : `${n} ledger lines`)

/** Ledger lines worked out by hand, then checked against the engine. */
function ledgerInfo(position: number, p: Pitch, clef: ClefName): LedgerInfo {
  const distance = position < 0 ? -position : position > 8 ? position - 8 : 0 // 1 = the space just outside the staff
  const count = Math.floor(distance / 2)
  const side = position < 0 ? 'below' : position > 8 ? 'above' : null
  const engine = staffPlacement(p, clef)
  if (engine.ledgerLines !== count || (count > 0 && engine.ledgerSide !== side)) throw new Error('Ledger line count disagrees with the theory engine')
  const title = 'Draw any ledger lines you need'
  if (side === null) return { count, side, title, text: 'The note is on the five lines and four spaces of the staff, so it needs no ledger lines.', result: 'No ledger lines' }
  if (count === 0) {
    return {
      count,
      side,
      title,
      text: `The note is in the space just ${side} the ${side === 'below' ? 'bottom' : 'top'} line, touching it. That space belongs to the staff, so it needs no ledger lines.`,
      result: 'No ledger lines',
    }
  }
  const onLine = position % 2 === 0
  const where = onLine ? `The note head is centred on the ${count === 1 ? 'ledger line' : `${ORDINALS[count - 1]} one`}.` : 'The note head sits in the space just beyond the last one.'
  return {
    count,
    side,
    title,
    text: `Draw ${ledgerCount(count)} ${side} the staff, counting outwards from it, spaced like the staff lines. ${where} Do not draw more lines than you need.`,
    result: `${ledgerCount(count)} ${side} the staff`,
  }
}

function assertNatural(p: Pitch): void {
  if (p.accidental !== 0) throw new RangeError('This example is for natural notes (no sharp or flat)')
}

/** "the G just above middle C": how the clef's own note relates to middle C. */
function besideMiddleC(p: Pitch): string {
  const gap = midiNumber(p) - 60
  if (gap === 0) return ''
  if (Math.abs(gap) >= 12) throw new Error('The clef notes are all within an octave of middle C')
  return ` (the ${p.letter} just ${gap > 0 ? 'above' : 'below'} middle C)`
}

/** "The 4 in C4 is its octave number (...)": the reminder used the first time octave numbers appear. */
function octaveReminder(p: Pitch): string {
  return `The ${p.octave} in ${sym(p)} is its octave number (it goes up by 1 each time you pass a C going up).`
}

/**
 * "Where does this note go on the staff?" Counts from the clef's line, with the octave number, and ends with where to draw the note.
 */
export function placeNoteExample(clef: ClefName, target: Pitch): WorkedExample {
  assertNatural(target)
  const anchor = anchorPitch(clef)
  const name = sym(target)
  const counting = staffPosition(target, clef) === staffPosition(anchor, clef) ? null : countSteps(clef, anchor, target, { octave: true, toName: name, toTitle: name, explainStep: true, explainLedger: true })
  const position = counting ? counting.walk.position : staffPosition(anchor, clef)
  const back = pitchAtPosition(position, clef)
  if (back.letter !== target.letter || back.octave !== target.octave) throw new Error('Position does not give the note back')

  const ledger = ledgerInfo(position, target, clef)
  const where = describeStaffPosition(position)
  const middleC = target.letter === 'C' && target.octave === 4
  const outside = position < 0 || position > 8
  const check = edgeCheck(clef, position, true)
  if (check.found.letter !== target.letter || check.found.octave !== target.octave) throw new Error('The check does not give the same note')

  const terms: WorkedTerm[] = [STAFF_TERM, clefTerm(clef), OCTAVE_NUMBER_TERM, MIDDLE_C_TERM, STEP_TERM]
  if (outside) terms.push(LEDGER_TERM)

  const steps: WorkedStep[] = [
    {
      title: 'Read the letter and the octave number',
      text: `${name} is the letter ${target.letter} with octave number ${target.octave} (the number goes up by 1 each time you pass a C going up, and middle C is C4).${middleC ? ' So this note is middle C itself, the C nearest the middle of a piano.' : ''}`,
      result: `Letter ${target.letter}, octave ${target.octave}`,
    },
    {
      title: 'Find the line the clef fixes',
      text: `${clefSentence(clef, { octave: true }).replace(/\.$/, `${besideMiddleC(anchor)}.`)} You will count from this line of the staff (the five lines and four spaces).`,
      result: clefResult(clef, true),
      staff: notesOnStaff(clef, [anchor]),
    },
    ...(counting
      ? counting.steps
      : [{ title: 'See that there is nothing to count', text: `${name} is the note on the clef's own line, so it goes on ${where}. There are no steps (moves to the next line or space) to count.`, result: `0 steps: ${cap(where)}` }]),
    { title: ledger.title, text: ledger.text, result: ledger.result },
    {
      title: 'Draw the note head',
      text: `Draw the note head centred ${atPlace(position)}${position % 2 === 0 ? ': the line passes through the middle of the head' : ': the head fills the space, touching the line on each side'}.`,
      result: `${name} ${atPlace(position)}`,
      staff: notesOnStaff(clef, [target]),
    },
    { title: check.title, text: check.text, result: `${cap(where)} is ${name}, as counted` },
  ]
  return {
    title: `Place ${name} on the ${clefWord(clef)} staff`,
    task: `Where does ${name}${middleC ? ' (middle C)' : ''} go on the ${clefWord(clef)} staff?`,
    terms,
    steps,
    answer: `${name} goes ${atPlace(position)}${ledger.count > 0 ? ` (you need ${ledgerCount(ledger.count)})` : ''}.`,
  }
}

/** The "same place, different note" trap: what you get by copying the staff position into the new clef. */
function trapStep(position: number, to: ClefName, target: Pitch): WorkedStep {
  const wrong = pitchAtPosition(position, to)
  const gap = Math.abs(midiNumber(wrong) - midiNumber(target))
  const higher = midiNumber(wrong) > midiNumber(target)
  if (gap === 0) throw new Error('Two different clefs never give the same note at the same place')
  return {
    title: 'Do not copy the place on the staff',
    text: `If you copied the place, ${describeStaffPosition(position)}, into ${clefWord(to)}, you would write ${sym(wrong)}. That is ${gap} semitone${gap === 1 ? '' : 's'} ${higher ? 'higher' : 'lower'} than ${sym(target)} (a semitone is one piano key to the very next), so it is a different note.`,
    result: `${cap(describeStaffPosition(position))} in ${clefWord(to)} would be ${sym(wrong)}: wrong`,
  }
}

/**
 * Writes a note again in a different clef. Works out the letter and octave in the first clef,
 * then counts from the second clef's line. Cross-checks that the sound (MIDI number) is unchanged.
 */
export function convertClefExample(target: Pitch, fromClef: ClefName, toClef: ClefName): WorkedExample {
  assertNatural(target)
  if (fromClef === toClef) throw new RangeError('Choose two different clefs')
  if (staffPlacement(target, fromClef).ledgerLines > 3 || staffPlacement(target, toClef).ledgerLines > 3) {
    throw new RangeError('The note needs more than 3 ledger lines in one of the clefs')
  }
  const fromAnchor = anchorPitch(fromClef)
  const toAnchor = anchorPitch(toClef)
  const name = sym(target)
  const same = (clef: ClefName, a: Pitch) => staffPosition(target, clef) === staffPosition(a, clef)
  const fromCount = same(fromClef, fromAnchor) ? null : countSteps(fromClef, fromAnchor, target, { octave: true, toName: 'The note', toTitle: 'the note', explainStep: true, explainLedger: true })
  const toCount = same(toClef, toAnchor) ? null : countSteps(toClef, toAnchor, target, { octave: true, toName: name, toTitle: name, explainLedger: !fromCount || fromCount.steps.length === 1 })
  const fromPosition = staffPosition(target, fromClef)
  const toPosition = toCount ? toCount.walk.position : staffPosition(toAnchor, toClef)
  const converted = pitchAtPosition(toPosition, toClef)
  if (midiNumber(converted) !== midiNumber(target) || converted.letter !== target.letter || converted.octave !== target.octave) {
    throw new Error('The note written in the new clef does not sound the same')
  }

  const toLedger = ledgerInfo(toPosition, target, toClef)
  const fromWhere = describeStaffPosition(fromPosition)
  const toWhere = describeStaffPosition(toPosition)
  const check = edgeCheck(toClef, toPosition, true)
  if (check.found.letter !== target.letter || check.found.octave !== target.octave) throw new Error('The check does not give the same note')
  const outside = (p: number) => p < 0 || p > 8

  const terms: WorkedTerm[] = [clefTerm(fromClef), clefTerm(toClef), PITCH_TERM, OCTAVE_NUMBER_TERM, STEP_TERM]
  if (outside(fromPosition) || outside(toPosition)) terms.push(LEDGER_TERM)
  terms.push({ term: 'Semitone', meaning: 'The smallest step in Western music: from one piano key to the very next key, black or white.' })

  return {
    title: `Convert a note from ${clefWord(fromClef)} to ${clefWord(toClef)}`,
    task: `This note is written in ${clefWord(fromClef)}. Write the same pitch in ${clefWord(toClef)}.`,
    terms,
    steps: [
      {
        title: `Find where the note sits in ${clefWord(fromClef)}`,
        text: `Count the lines and spaces from the bottom up. The note is ${atPlace(fromPosition)} of the ${clefWord(fromClef)} staff.`,
        result: cap(fromWhere),
        staff: notesOnStaff(fromClef, [target]),
      },
      {
        title: `Find the line the ${clefWord(fromClef)} fixes`,
        text: `${clefSentence(fromClef, { octave: true })} ${octaveReminder(fromAnchor)}`,
        result: clefResult(fromClef, true),
      },
      ...(fromCount
        ? fromCount.steps
        : [{ title: 'See that there is nothing to count', text: `The note is on that line, so it is ${name}. There are no steps (moves to the next line or space) to count.`, result: `The note is ${name}` }]),
      {
        title: 'Keep the same letter and octave number',
        text: `The note is ${name}. Its pitch (how high or low it sounds) is fixed by the letter and the octave number together. To write the same pitch in ${clefWord(toClef)}, write ${name} again. Only its place on the staff changes.`,
        result: `Write ${name} in ${clefWord(toClef)}`,
      },
      {
        title: `Find the line the ${clefWord(toClef)} fixes`,
        text: clefSentence(toClef, { octave: true }),
        result: clefResult(toClef, true),
        staff: notesOnStaff(toClef, [toAnchor]),
      },
      ...(toCount
        ? toCount.steps
        : [{ title: 'See that there is nothing to count', text: `${name} is the note on the clef's own line, so it goes on ${toWhere}.`, result: `0 steps: ${cap(toWhere)}` }]),
      { title: toLedger.title, text: toLedger.text, result: toLedger.result },
      {
        title: 'Write the note',
        text: `Draw ${name} ${atPlace(toPosition)} in ${clefWord(toClef)}.`,
        result: `${name} ${atPlace(toPosition)} in ${clefWord(toClef)}`,
        staff: notesOnStaff(toClef, [converted]),
      },
      trapStep(fromPosition, toClef, target),
      { title: check.title, text: check.text, result: `${cap(toWhere)} is ${name}, the same pitch as before` },
    ],
    answer: `Write ${name} ${atPlace(toPosition)} in ${clefWord(toClef)}${toLedger.count > 0 ? ` (you need ${ledgerCount(toLedger.count)})` : ''}.`,
  }
}

/** Middle C (C4) written in each of the four clefs: one step per clef, then a check from the edges of the staves. */
export function middleCInClefsExample(): WorkedExample {
  const middleC = pitch('C', 0, 4)
  const steps: WorkedStep[] = []
  const places: string[] = []
  for (const clef of CLEF_NAMES) {
    const anchor = anchorPitch(clef)
    const walk = walkStaff(clef, anchor, middleC, true)
    if (midiNumber(pitchAtPosition(walk.position, clef)) !== 60) throw new Error('Middle C must be MIDI 60 in every clef')
    const where = describeStaffPosition(walk.position)
    places.push(`${clefWord(clef)}: ${where}`)
    const dir = walk.direction === 1 ? 'up' : 'down'
    steps.push(
      walk.moved === 0
        ? {
            title: `${clefLabel(clef)}: read the line it points at`,
            text: `${clefSentence(clef)} There is nothing to count.`,
            result: cap(where),
            staff: notesOnStaff(clef, [middleC]),
          }
        : {
            title: `${clefLabel(clef)}: count ${dir} from ${sym(anchor)} to C4`,
            text: `${clef === 'treble' ? clefSentence(clef, { octave: true }).replace(/\.$/, ` (the ${anchor.octave} is its octave number).`) : clefSentence(clef, { octave: true })} ${stepsText(walk.moved)} ${dir}: ${walk.pairs}.${crossingSentence(walk)}`,
            result: cap(where),
            staff: notesOnStaff(clef, [middleC]),
          },
    )
  }

  // The check joins the two staves: the notes between the top line of the bass staff and the bottom line of the treble staff.
  const bassTop = lineNotes('bass').at(-1)!
  const trebleBottom = lineNotes('treble')[0]!
  const between = countPath(bassTop, trebleBottom).slice(1, -1)
  const middle = between[Math.floor(between.length / 2)]!
  if (between.length !== 3 || midiNumber(middle) !== 60) throw new Error('Middle C should be the middle of three notes between the staves')
  if (staffPosition(middle, 'bass') !== 10 || staffPosition(middle, 'treble') !== -2) throw new Error('Middle C should be on one ledger line between the staves')
  steps.push({
    title: 'Check by joining the treble and bass staves',
    text: `Put the treble staff above the bass staff. The bass staff's top line is ${sym(bassTop)} and the treble staff's bottom line is ${sym(trebleBottom)}. Between them come ${between.map(sym).join(', ')}: a space, a ledger line, a space. So C4 sits on the one ledger line between the staves. The C clefs point at it directly.`,
    result: 'C4: one ledger line below treble, one above bass',
  })
  return {
    title: 'Middle C in all four clefs',
    task: 'Where is middle C (C4) written in treble, bass, alto and tenor clef?',
    terms: [
      MIDDLE_C_TERM,
      OCTAVE_NUMBER_TERM,
      { term: 'Treble clef (G clef)', meaning: 'A clef whose curl circles the 2nd line up and fixes it as G4, the G just above middle C.' },
      { term: 'Bass clef (F clef)', meaning: 'A clef whose two dots sit either side of the 4th line up and fix it as F3, the F just below middle C.' },
      { term: 'C clef', meaning: 'A clef that points straight at middle C. The alto clef and the tenor clef are both C clefs.' },
      LEDGER_TERM,
    ],
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
  const w = sym(written)
  const counting = staffPosition(written, 'treble') === staffPosition(anchor, 'treble') ? null : countSteps('treble', anchor, written, { octave: true, toName: 'The note', toTitle: 'the note', explainStep: true, explainLedger: true })
  const position = staffPosition(written, 'treble')

  // Long-hand: same letter, octave number one lower. Then the engine must agree, and the sound must be 12 semitones lower.
  const sounding = pitch(written.letter, 0, written.octave - 1)
  const engine = guitarSoundingPitch(written)
  if (engine.letter !== sounding.letter || engine.accidental !== sounding.accidental || engine.octave !== sounding.octave) {
    throw new Error('Guitar sounding pitch disagrees with the theory engine')
  }
  if (midiNumber(written) - midiNumber(sounding) !== 12) throw new Error('An octave must be 12 semitones')
  // The check counts 8 letter names down from the written note, without using the octave-number rule.
  const down = countPath(written, sounding)
  if (down.length !== 8) throw new Error('An octave spans 8 letter names')
  const s = sym(sounding)

  return {
    title: 'Guitar: written note and sounding note',
    task: `A guitar part is written in treble clef. What note do you hear when the player plays the note written as ${w}?`,
    terms: [
      { term: 'Written pitch', meaning: 'The note as it is printed on the page.' },
      { term: 'Sounding pitch', meaning: 'The note you actually hear when the instrument plays.' },
      { term: 'Octave', meaning: 'The distance from a note to the next note with the same letter name: 8 letter names, or 12 semitones.' },
      OCTAVE_NUMBER_TERM,
      clefTerm('treble'),
      STEP_TERM,
    ],
    steps: [
      {
        title: 'Find where the written note sits',
        text: `Count the lines and spaces from the bottom up. The note is ${atPlace(position)} of the treble clef staff.`,
        result: cap(describeStaffPosition(position)),
        staff: notesOnStaff('treble', [written]),
      },
      {
        title: 'Find the line the treble clef fixes',
        text: `${clefSentence('treble', { octave: true })} ${octaveReminder(anchor)}`,
        result: clefResult('treble', true),
      },
      ...(counting
        ? counting.steps
        : [{ title: 'See that there is nothing to count', text: `The note is on that line, so it is ${w}. There are no steps (moves to the next line or space) to count.`, result: `The note is ${w}` }]),
      {
        title: 'Move it down one octave',
        text: `The note on the page, its written pitch, is ${w}. A guitar's sounding pitch (the note you hear) is one octave (8 letter names, or 12 semitones) lower. Keep the letter ${written.letter} and take 1 off the octave number: ${written.octave} − 1 = ${sounding.octave}.`,
        result: `Sounding pitch: ${s}`,
      },
      {
        title: 'Listen to the two notes',
        text: `Play ${s}, then ${w}. They share the letter name ${written.letter} and sound alike, but ${s} is clearly lower.`,
        result: `${s} sounds one octave below ${w}`,
        staff: notesOnStaff('treble', [sounding, written]),
        listen: listenMelody(`Hear ${s} then ${w}`, [sounding, written]),
      },
      {
        title: 'Check by counting 8 letter names down',
        text: `An octave spans 8 letter names, counting both ends. Count down letter by letter from ${w} instead: ${down.map(sym).join(', ')}. That is 8 letter names, so you have gone down one octave.${crossingSentence({ crossings: crossingsOf(down) })}`,
        result: `8 letter names down from ${w} is ${s}`,
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
