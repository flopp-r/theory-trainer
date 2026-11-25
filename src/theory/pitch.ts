import { at, mod } from './util'

export const LETTERS = ['C', 'D', 'E', 'F', 'G', 'A', 'B'] as const
export type Letter = (typeof LETTERS)[number]

/** Semitones above C for each natural note. */
const LETTER_SEMITONES: Record<Letter, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 }

/**
 * A note name without an octave. `accidental` is a whole number of semitones:
 * -1 flat, 0 natural, +1 sharp, +2 double sharp, -2 double flat.
 * The spelling is kept: F# and Gb are different NoteNames.
 */
export interface NoteName {
  readonly letter: Letter
  readonly accidental: number
}

/** A spelled note with an octave. Octave numbers change at C (scientific pitch: middle C = C4). */
export interface Pitch extends NoteName {
  readonly octave: number
}

export function note(letter: Letter, accidental = 0): NoteName {
  assertInteger(accidental, 'accidental')
  return { letter, accidental }
}

export function pitch(letter: Letter, accidental: number, octave: number): Pitch {
  assertInteger(accidental, 'accidental')
  assertInteger(octave, 'octave')
  return { letter, accidental, octave }
}

function assertInteger(value: number, label: string): void {
  if (!Number.isInteger(value)) throw new RangeError(`${label} must be a whole number, got ${value}`)
}

export function letterIndex(letter: Letter): number {
  return LETTERS.indexOf(letter)
}

export function letterAt(index: number): Letter {
  return at(LETTERS, mod(index, 7))
}

/** MIDI note number. C4 = 60, A4 = 69. B#3 and C4 are both 60. */
export function midiNumber(p: Pitch): number {
  return 12 * (p.octave + 1) + LETTER_SEMITONES[p.letter] + p.accidental
}

/** 0-11, where C = 0. */
export function pitchClass(n: NoteName): number {
  return mod(LETTER_SEMITONES[n.letter] + n.accidental, 12)
}

/**
 * Position counted in letter names only (ignores accidentals): C4 = 28, D4 = 29, ... B4 = 34, C5 = 35.
 * This is what staff position and interval numbers depend on.
 */
export function diatonicStep(p: Pitch): number {
  return p.octave * 7 + letterIndex(p.letter)
}

/** Build the pitch with the given letter step and MIDI number; the accidental is whatever makes them agree. */
export function pitchFromStep(step: number, midi: number): Pitch {
  const letter = letterAt(step)
  const octave = Math.floor(step / 7)
  const natural = 12 * (octave + 1) + LETTER_SEMITONES[letter]
  return { letter, accidental: midi - natural, octave }
}

export function shiftOctaves(p: Pitch, octaves: number): Pitch {
  assertInteger(octaves, 'octaves')
  return { ...p, octave: p.octave + octaves }
}

export function withoutOctave(p: Pitch): NoteName {
  return { letter: p.letter, accidental: p.accidental }
}

/** Same letter and accidental. */
export function sameNote(a: NoteName, b: NoteName): boolean {
  return a.letter === b.letter && a.accidental === b.accidental
}

/** Same letter, accidental and octave. */
export function samePitch(a: Pitch, b: Pitch): boolean {
  return sameNote(a, b) && a.octave === b.octave
}

/** Same sounding pitch (may be spelled differently, e.g. C#4 and Db4). */
export function sameSound(a: Pitch, b: Pitch): boolean {
  return midiNumber(a) === midiNumber(b)
}

/** Sort order: lowest sounding pitch first; ties (enharmonics) by letter step. */
export function comparePitches(a: Pitch, b: Pitch): number {
  return midiNumber(a) - midiNumber(b) || diatonicStep(a) - diatonicStep(b)
}

/**
 * Other spellings of the same sounding pitch, lowest letter step first.
 * `maxAccidental` limits how many sharps/flats a spelling may have (default: double sharp/flat).
 */
export function enharmonicSpellings(p: Pitch, maxAccidental = 2): Pitch[] {
  const midi = midiNumber(p)
  const found: Pitch[] = []
  for (let octave = p.octave - 1; octave <= p.octave + 1; octave++) {
    for (const letter of LETTERS) {
      const candidate = pitchFromStep(octave * 7 + letterIndex(letter), midi)
      if (Math.abs(candidate.accidental) <= maxAccidental && !samePitch(candidate, p)) {
        found.push(candidate)
      }
    }
  }
  return found.sort((a, b) => diatonicStep(a) - diatonicStep(b))
}

export type AccidentalStyle = 'ascii' | 'symbol'

function accidentalText(accidental: number, style: AccidentalStyle): string {
  if (accidental === 0) return ''
  const mark = accidental > 0 ? (style === 'ascii' ? '#' : '♯') : style === 'ascii' ? 'b' : '♭'
  return mark.repeat(Math.abs(accidental))
}

/** "F#", "Bb", "Ebb" (ascii) or "F♯", "B♭" (symbol). Naturals have no sign. */
export function formatNote(n: NoteName, style: AccidentalStyle = 'ascii'): string {
  return n.letter + accidentalText(n.accidental, style)
}

/** "F#4", "Bb3". */
export function formatPitch(p: Pitch, style: AccidentalStyle = 'ascii'): string {
  return formatNote(p, style) + String(p.octave)
}

const ACCIDENTAL_PATTERN = '([#♯]*|[b♭]*|x)'
const NOTE_RE = new RegExp(`^([A-G])${ACCIDENTAL_PATTERN}$`)
const PITCH_RE = new RegExp(`^([A-G])${ACCIDENTAL_PATTERN}(-?\\d+)$`)

function parseAccidental(text: string): number {
  if (text === 'x') return 2
  if (text === '') return 0
  return /^[#♯]+$/.test(text) ? text.length : -text.length
}

/** Parses "C", "F#", "Bb", "Ebb", "G##" (also ♯ ♭ and x for double sharp). Letters must be capitals. */
export function parseNote(text: string): NoteName {
  const match = NOTE_RE.exec(text.trim())
  if (!match) throw new SyntaxError(`Not a note name: "${text}"`)
  return { letter: match[1] as Letter, accidental: parseAccidental(match[2] ?? '') }
}

/** Parses "C4", "F#3", "Bb5", "C-1". The octave is required. */
export function parsePitch(text: string): Pitch {
  const match = PITCH_RE.exec(text.trim())
  if (!match) throw new SyntaxError(`Not a pitch: "${text}"`)
  return {
    letter: match[1] as Letter,
    accidental: parseAccidental(match[2] ?? ''),
    octave: Number(match[3]),
  }
}
