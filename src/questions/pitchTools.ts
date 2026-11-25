import {
  type ClefName,
  type Key,
  type Letter,
  type NoteName,
  type Pitch,
  type StaffPosition,
  diatonicStep,
  formatNote,
  formatPitch,
  keyFromFifths,
  keyName,
  midiNumber,
  pitchAtPosition,
  staffPlacement,
  staffPosition,
} from '../theory'
import { at } from '../theory/util'
import type { Difficulty } from './types'

/** "F♯", "B♭" (proper signs, for showing to the learner). */
export function noteLabel(n: NoteName): string {
  return formatNote(n, 'symbol')
}

/** "F♯ A♯ C♯": a list of notes for answer buttons. */
export function notesLabel(notes: readonly NoteName[]): string {
  return notes.map(noteLabel).join(' ')
}

/** "C major", "F♯ minor" with proper signs. */
export function keyLabel(k: Key): string {
  return keyName(k).replace(/#/g, '♯').replace(/^([A-G])b/, '$1♭')
}

/** Pitch name with octave and, for middle C, a reminder: "C4 (middle C)". */
export function pitchLabel(p: Pitch): string {
  const name = formatPitch(p, 'symbol')
  return p.letter === 'C' && p.accidental === 0 && p.octave === 4 ? `${name} (middle C)` : name
}

/** The natural pitch at a staff position, with an accidental. */
export function pitchAt(clef: ClefName, position: StaffPosition, accidental = 0): Pitch {
  return pitchAtPosition(position, clef, accidental)
}

/** True if every pitch fits on the staff using at most `maxLedger` ledger lines. */
export function fitsOnStaff(pitches: readonly Pitch[], clef: ClefName, maxLedger: number): boolean {
  return pitches.every((p) => staffPlacement(p, clef).ledgerLines <= maxLedger)
}

/**
 * The octave to build a chord in so that it sits comfortably on the staff in this clef:
 * every note within `maxLedger` ledger lines, as close to the middle of the staff as possible.
 * `build(octave)` must return the chord's pitches for that bass octave.
 */
export function bestOctave(clef: ClefName, build: (bassOctave: number) => readonly Pitch[], maxLedger = 1): number {
  let best: { octave: number; score: number } | null = null
  for (let octave = 0; octave <= 7; octave++) {
    const pitches = build(octave)
    if (!fitsOnStaff(pitches, clef, maxLedger)) continue
    const positions = pitches.map((p) => staffPosition(p, clef))
    const centre = (Math.min(...positions) + Math.max(...positions)) / 2
    const score = Math.abs(centre - 4)
    if (!best || score < best.score) best = { octave, score }
  }
  if (!best) throw new Error('No octave fits this chord on the staff')
  return best.octave
}

/** Letters stepped up from a note: "C D E" for 3 steps from C (inclusive). */
export function lettersFrom(start: Letter, count: number, direction: 'up' | 'down' = 'up'): Letter[] {
  const order: Letter[] = ['C', 'D', 'E', 'F', 'G', 'A', 'B']
  const first = order.indexOf(start)
  return Array.from({ length: count }, (_, i) => at(order, (((first + (direction === 'up' ? i : -i)) % 7) + 7) % 7))
}

/** Highest number of sharps or flats a key may have at each difficulty level. */
export const MAX_ACCIDENTALS: Record<Difficulty, number> = { 1: 2, 2: 4, 3: 7 }

/** Keys available at a difficulty: major or minor with up to the allowed number of sharps or flats. */
export function keysForDifficulty(mode: 'major' | 'minor', difficulty: Difficulty): Key[] {
  const max = MAX_ACCIDENTALS[difficulty]
  const keys: Key[] = []
  for (let fifths = -max; fifths <= max; fifths++) keys.push(keyFromFifths(fifths, mode))
  return keys
}

/** Sound-based size of a pitch step for tests and checks. */
export function semitonesBetween(a: Pitch, b: Pitch): number {
  return Math.abs(midiNumber(b) - midiNumber(a))
}

/** Steps between two pitches counted in letter names. */
export function lettersBetween(a: Pitch, b: Pitch): number {
  return Math.abs(diatonicStep(b) - diatonicStep(a))
}
