import { parseInterval, transposeNote } from './interval'
import { type Letter, type NoteName, formatNote, note, parseNote } from './pitch'
import { type ScaleType, scaleNotes } from './scale'
import { at, mod } from './util'

export type Mode = 'major' | 'minor'

export interface Key {
  readonly tonic: NoteName
  readonly mode: Mode
}

export function key(tonic: NoteName | string, mode: Mode): Key {
  return { tonic: typeof tonic === 'string' ? parseNote(tonic) : tonic, mode }
}

/** Notes in the order they are added as sharps are added to a key signature (and the reverse for flats). */
const SHARP_ORDER: readonly Letter[] = ['F', 'C', 'G', 'D', 'A', 'E', 'B']
const FLAT_ORDER: readonly Letter[] = ['B', 'E', 'A', 'D', 'G', 'C', 'F']

/** Where each natural note sits on the line of fifths: F C G D A E B = -1 0 1 2 3 4 5. */
const FIFTHS_OF_LETTER: Record<Letter, number> = { F: -1, C: 0, G: 1, D: 2, A: 3, E: 4, B: 5 }

/** Position of a note on the line of fifths. C = 0, G = 1, F = -1, F# = 6, Bb = -2. */
export function fifthsPosition(n: NoteName): number {
  return FIFTHS_OF_LETTER[n.letter] + 7 * n.accidental
}

/** Inverse of `fifthsPosition`. */
export function noteAtFifthsPosition(position: number): NoteName {
  if (!Number.isInteger(position)) throw new RangeError('Position must be a whole number')
  const shifted = position + 1
  return note(at(SHARP_ORDER, mod(shifted, 7)), Math.floor(shifted / 7))
}

export interface KeySignature {
  /** Positive = sharps, negative = flats, 0 = none. */
  readonly fifths: number
  readonly kind: 'sharps' | 'flats' | 'none'
  readonly count: number
  /** The sharps or flats in the order they are written. */
  readonly accidentals: NoteName[]
}

/** Number of sharps (+) or flats (-) in the key's signature. Works for theoretical keys beyond 7 too. */
export function keyFifths(k: Key): number {
  return fifthsPosition(k.tonic) - (k.mode === 'minor' ? 3 : 0)
}

/** Keys with no more than seven sharps or flats: the ones that exist in practice. */
export function isStandardKey(k: Key): boolean {
  return Math.abs(keyFifths(k)) <= 7
}

/** The signature of a key. Throws for theoretical keys (e.g. G# major, with eight sharps). */
export function keySignature(k: Key): KeySignature {
  const fifths = keyFifths(k)
  if (Math.abs(fifths) > 7) {
    throw new RangeError(`${keyName(k)} has ${Math.abs(fifths)} ${fifths > 0 ? 'sharps' : 'flats'}: not a standard key`)
  }
  const order = fifths >= 0 ? SHARP_ORDER : FLAT_ORDER
  const accidentals = order.slice(0, Math.abs(fifths)).map((letter) => note(letter, fifths > 0 ? 1 : -1))
  return {
    fifths,
    kind: fifths > 0 ? 'sharps' : fifths < 0 ? 'flats' : 'none',
    count: Math.abs(fifths),
    accidentals,
  }
}

/** The key with the given number of sharps (+) or flats (-). */
export function keyFromFifths(fifths: number, mode: Mode): Key {
  return { tonic: noteAtFifthsPosition(mode === 'major' ? fifths : fifths + 3), mode }
}

/** The key with the same signature and the other mode: C major <-> A minor. */
export function relativeKey(k: Key): Key {
  return k.mode === 'major'
    ? { tonic: transposeNote(k.tonic, parseInterval('m3'), 'down'), mode: 'minor' }
    : { tonic: transposeNote(k.tonic, parseInterval('m3'), 'up'), mode: 'major' }
}

/** The key with the same tonic and the other mode: C major <-> C minor. */
export function parallelKey(k: Key): Key {
  return { tonic: k.tonic, mode: k.mode === 'major' ? 'minor' : 'major' }
}

/** One step round the circle of fifths clockwise (one more sharp). */
export function dominantKey(k: Key): Key {
  return keyFromFifths(keyFifths(k) + 1, k.mode)
}

/** One step round the circle of fifths anticlockwise (one more flat). */
export function subdominantKey(k: Key): Key {
  return keyFromFifths(keyFifths(k) - 1, k.mode)
}

/** Keys whose signature differs from this one by at most one sharp or flat (the key itself is excluded). */
export function closelyRelatedKeys(k: Key): Key[] {
  const base = keyFifths(k)
  const related: Key[] = []
  for (const mode of ['major', 'minor'] as const) {
    for (const delta of [-1, 0, 1]) {
      const candidate = keyFromFifths(base + delta, mode)
      if (!(mode === k.mode && delta === 0)) related.push(candidate)
    }
  }
  return related
}

export interface CircleEntry {
  readonly fifths: number
  readonly major: Key
  readonly minor: Key
}

/** The circle of fifths from seven flats to seven sharps, with the major and relative minor key at each step. */
export function circleOfFifths(): CircleEntry[] {
  const entries: CircleEntry[] = []
  for (let fifths = -7; fifths <= 7; fifths++) {
    entries.push({ fifths, major: keyFromFifths(fifths, 'major'), minor: keyFromFifths(fifths, 'minor') })
  }
  return entries
}

/** The scale a key is built on. Minor keys default to the natural minor. */
export function keyScaleNotes(k: Key, minorForm: 'natural' | 'harmonic' | 'melodic' = 'natural'): NoteName[] {
  const type: ScaleType =
    k.mode === 'major' ? 'major' : minorForm === 'natural' ? 'natural-minor' : minorForm === 'harmonic' ? 'harmonic-minor' : 'melodic-minor'
  return scaleNotes(k.tonic, type)
}

/** "C major", "F# minor", "Bb major". */
export function keyName(k: Key): string {
  return `${formatNote(k.tonic)} ${k.mode}`
}

/** Reads "C major", "F# minor", "Bb major". */
export function parseKey(text: string): Key {
  const match = /^(\S+)\s+(major|minor)$/.exec(text.trim())
  if (!match) throw new SyntaxError(`Not a key: "${text}"`)
  return { tonic: parseNote(match[1] ?? ''), mode: match[2] as Mode }
}
