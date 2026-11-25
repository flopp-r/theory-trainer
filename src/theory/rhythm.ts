/*
 * Rhythm: note and rest values, dots, and time signatures.
 * Names are the British ones used in UK teaching (semibreve, minim, crotchet, quaver, semiquaver).
 * One crotchet = 1 beat in these helpers; every duration is also given in semiquavers so that
 * sums are always whole numbers.
 */

export type NoteValueName = 'semibreve' | 'minim' | 'crotchet' | 'quaver' | 'semiquaver'

export interface NoteValue {
  readonly name: NoteValueName
  /** Length in semiquavers: 16, 8, 4, 2 or 1. */
  readonly semiquavers: number
  /** Length in crotchet beats: 4, 2, 1, 0.5 or 0.25. */
  readonly crotchets: number
  /** The American name, for reference. */
  readonly american: string
  /** VexFlow duration code. */
  readonly vex: 'w' | 'h' | 'q' | '8' | '16'
}

export const NOTE_VALUES: readonly NoteValue[] = [
  { name: 'semibreve', semiquavers: 16, crotchets: 4, american: 'whole note', vex: 'w' },
  { name: 'minim', semiquavers: 8, crotchets: 2, american: 'half note', vex: 'h' },
  { name: 'crotchet', semiquavers: 4, crotchets: 1, american: 'quarter note', vex: 'q' },
  { name: 'quaver', semiquavers: 2, crotchets: 0.5, american: 'eighth note', vex: '8' },
  { name: 'semiquaver', semiquavers: 1, crotchets: 0.25, american: 'sixteenth note', vex: '16' },
]

export function noteValue(name: NoteValueName): NoteValue {
  const found = NOTE_VALUES.find((v) => v.name === name)
  if (!found) throw new RangeError(`Unknown note value: ${String(name)}`)
  return found
}

/** A dot adds half of the value; a second dot adds a quarter, and so on. */
export function dottedSemiquavers(name: NoteValueName, dots: number): number {
  if (!Number.isInteger(dots) || dots < 0 || dots > 2) throw new RangeError('Dots must be 0, 1 or 2')
  // Each dot adds half of the previous addition: value x (1 + 1/2 + 1/4 ...) = value x (2 - 1/2^dots).
  // These are all powers of two, so the arithmetic is exact.
  return noteValue(name).semiquavers * (2 - 0.5 ** dots)
}

/** Length in crotchet beats, e.g. a dotted minim is 3. */
export function dottedCrotchets(name: NoteValueName, dots: number): number {
  return dottedSemiquavers(name, dots) / 4
}

/** "dotted crotchet", "double-dotted minim", "quaver". */
export function noteValueLabel(name: NoteValueName, dots = 0): string {
  const prefix = dots === 0 ? '' : dots === 1 ? 'dotted ' : 'double-dotted '
  return prefix + name
}

/** "crotchet rest", "dotted minim rest". */
export function restLabel(name: NoteValueName, dots = 0): string {
  return `${noteValueLabel(name, dots)} rest`
}

export interface TimeSignature {
  readonly beats: number
  /** The note value of the bottom number: 2 = minim, 4 = crotchet, 8 = quaver, 16 = semiquaver. */
  readonly unit: 2 | 4 | 8 | 16
}

export function timeSignature(beats: number, unit: 2 | 4 | 8 | 16): TimeSignature {
  if (!Number.isInteger(beats) || beats < 1 || beats > 16) throw new RangeError('Top number must be a whole number from 1 to 16')
  return { beats, unit }
}

/** "3/4". */
export function formatTimeSignature(ts: TimeSignature): string {
  return `${ts.beats}/${ts.unit}`
}

export function parseTimeSignature(text: string): TimeSignature {
  const match = /^(\d{1,2})\/(2|4|8|16)$/.exec(text.trim())
  if (!match) throw new SyntaxError(`Not a time signature: "${text}"`)
  return timeSignature(Number(match[1]), Number(match[2]) as 2 | 4 | 8 | 16)
}

export type TimeKind = 'simple' | 'compound'
export type TimeGrouping = 'duple' | 'triple' | 'quadruple'

export interface TimeSignatureInfo {
  readonly kind: TimeKind
  /** Beats you count (pulses) in one bar. 6/8 has 2, not 6. */
  readonly pulses: number
  readonly grouping: TimeGrouping
  /** The note that gets one pulse, e.g. "crotchet" in 3/4 and "dotted crotchet" in 6/8. */
  readonly pulseNote: string
  /** Length of the bar in semiquavers. */
  readonly barSemiquavers: number
}

const UNIT_NAMES: Record<number, NoteValueName> = { 2: 'minim', 4: 'crotchet', 8: 'quaver', 16: 'semiquaver' }
const GROUPING: Record<number, TimeGrouping> = { 2: 'duple', 3: 'triple', 4: 'quadruple' }

/**
 * Classifies a time signature.
 * Simple time has a top number of 2, 3 or 4: each beat is the bottom-number note.
 * Compound time has a top number of 6, 9 or 12: each beat is three of the bottom-number notes (a dotted note),
 * so 6/8 has two beats a bar, 9/8 three and 12/8 four.
 * Other top numbers (5, 7 and so on) are irregular and not supported here.
 */
export function timeSignatureInfo(ts: TimeSignature): TimeSignatureInfo {
  const unitName = UNIT_NAMES[ts.unit]
  if (!unitName) throw new RangeError('Unsupported bottom number')
  const barSemiquavers = ts.beats * (16 / ts.unit)
  if (ts.beats === 2 || ts.beats === 3 || ts.beats === 4) {
    return { kind: 'simple', pulses: ts.beats, grouping: GROUPING[ts.beats]!, pulseNote: unitName, barSemiquavers }
  }
  if (ts.beats === 6 || ts.beats === 9 || ts.beats === 12) {
    const pulses = ts.beats / 3
    // Three units make a dotted note one size up: 3 quavers = dotted crotchet.
    const dotted: Record<number, string> = { 2: 'dotted semibreve', 4: 'dotted minim', 8: 'dotted crotchet', 16: 'dotted quaver' }
    return { kind: 'compound', pulses, grouping: GROUPING[pulses]!, pulseNote: dotted[ts.unit]!, barSemiquavers }
  }
  throw new RangeError(`${formatTimeSignature(ts)} is irregular and not supported`)
}

/** "simple duple", "compound triple". */
export function timeSignatureTypeLabel(ts: TimeSignature): string {
  const info = timeSignatureInfo(ts)
  return `${info.kind} ${info.grouping}`
}
