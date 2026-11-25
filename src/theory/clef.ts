import type { Pitch } from './pitch'
import { diatonicStep, letterAt, parsePitch, pitch } from './pitch'
import { at } from './util'

export type ClefName = 'treble' | 'bass' | 'alto' | 'tenor'

export const CLEF_NAMES: readonly ClefName[] = ['treble', 'bass', 'alto', 'tenor']

/**
 * Staff positions count letter steps from the bottom line:
 * 0 = bottom line, 1 = first space, 2 = second line ... 8 = top line.
 * Negative numbers are below the staff, numbers above 8 are above it.
 * Even numbers are lines (or ledger lines), odd numbers are spaces.
 */
export type StaffPosition = number

interface ClefDefinition {
  /** The natural note that sits at `position` in this clef. */
  readonly reference: Pitch
  readonly position: StaffPosition
}

const CLEFS: Record<ClefName, ClefDefinition> = {
  treble: { reference: parsePitch('G4'), position: 2 }, // G clef: G4 on the 2nd line
  bass: { reference: parsePitch('F3'), position: 6 }, // F clef: F3 on the 4th line
  alto: { reference: parsePitch('C4'), position: 4 }, // C clef: middle C on the middle line
  tenor: { reference: parsePitch('C4'), position: 6 }, // C clef: middle C on the 4th line
}

/** Where a pitch sits on the staff in the given clef. Accidentals do not move a note. */
export function staffPosition(p: Pitch, clef: ClefName): StaffPosition {
  const def = CLEFS[clef]
  return diatonicStep(p) - diatonicStep(def.reference) + def.position
}

/** The natural (no sharp or flat) pitch at a staff position. Add an accidental to change it. */
export function pitchAtPosition(position: StaffPosition, clef: ClefName, accidental = 0): Pitch {
  if (!Number.isInteger(position)) throw new RangeError('Staff position must be a whole number')
  const def = CLEFS[clef]
  const step = diatonicStep(def.reference) + (position - def.position)
  return pitch(letterAt(step), accidental, Math.floor(step / 7))
}

export interface StaffPlacement {
  readonly position: StaffPosition
  /** True if the note head sits on a line (or ledger line), false if in a space. */
  readonly onLine: boolean
  /** Ledger lines needed, and on which side. */
  readonly ledgerLines: number
  readonly ledgerSide: 'above' | 'below' | null
}

/** Position plus how many ledger lines are needed. */
export function staffPlacement(p: Pitch, clef: ClefName): StaffPlacement {
  const position = staffPosition(p, clef)
  let ledgerLines = 0
  let ledgerSide: 'above' | 'below' | null = null
  if (position < 0) {
    ledgerLines = Math.floor(-position / 2)
    ledgerSide = ledgerLines > 0 ? 'below' : null
  } else if (position > 8) {
    ledgerLines = Math.floor((position - 8) / 2)
    ledgerSide = ledgerLines > 0 ? 'above' : null
  }
  return { position, onLine: position % 2 === 0, ledgerLines, ledgerSide }
}

/**
 * Every natural pitch that can be written in the clef using at most `maxLedgerLines`
 * ledger lines above or below, lowest first.
 */
export function naturalPitchesInClef(clef: ClefName, maxLedgerLines: number): Pitch[] {
  if (!Number.isInteger(maxLedgerLines) || maxLedgerLines < 0) {
    throw new RangeError('maxLedgerLines must be a whole number, 0 or more')
  }
  const lowest = -(2 * maxLedgerLines + 1)
  const highest = 8 + 2 * maxLedgerLines + 1
  const pitches: Pitch[] = []
  for (let position = lowest; position <= highest; position++) {
    pitches.push(pitchAtPosition(position, clef))
  }
  return pitches
}

/** The five natural notes on the staff lines, bottom to top (e.g. treble: E4 G4 B4 D5 F5). */
export function lineNotes(clef: ClefName): Pitch[] {
  return [0, 2, 4, 6, 8].map((position) => pitchAtPosition(position, clef))
}

/** The four natural notes in the spaces, bottom to top (e.g. treble: F4 A4 C5 E5). */
export function spaceNotes(clef: ClefName): Pitch[] {
  return [1, 3, 5, 7].map((position) => pitchAtPosition(position, clef))
}

export function clefLabel(clef: ClefName): string {
  return `${at(['Treble', 'Bass', 'Alto', 'Tenor'], CLEF_NAMES.indexOf(clef))} clef`
}

const ORDINAL = ['1st', '2nd', '3rd', '4th', '5th']

/**
 * Plain-words description of where a staff position is, for explanations:
 * "the middle line", "the 3rd space", "the 1st ledger line below the staff".
 */
export function describeStaffPosition(position: StaffPosition): string {
  if (!Number.isInteger(position)) throw new RangeError('Staff position must be a whole number')
  if (position >= 0 && position <= 8) {
    if (position % 2 === 0) {
      const line = position / 2
      return line === 0 ? 'the bottom line' : line === 4 ? 'the top line' : line === 2 ? 'the middle line' : `the ${ORDINAL[line]} line`
    }
    const space = (position - 1) / 2
    return space === 0 ? 'the bottom space' : space === 3 ? 'the top space' : `the ${ORDINAL[space]} space`
  }
  const below = position < 0
  const distance = below ? -position : position - 8 // 1 = space just outside the staff
  const side = below ? 'below' : 'above'
  if (distance === 1) return `the space ${side} the ${below ? 'bottom' : 'top'} line`
  const ledger = Math.floor(distance / 2)
  return distance % 2 === 0
    ? `the ${ORDINAL[ledger - 1] ?? `${ledger}th`} ledger line ${side} the staff`
    : `the space ${side} the ${ORDINAL[ledger - 1] ?? `${ledger}th`} ledger line`
}
