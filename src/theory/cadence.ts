import { type Chord, chordSymbol } from './chord'
import type { Key } from './key'
import { chordFromRoman, romanNumeral } from './roman'
import { at } from './util'

export type CadenceType = 'perfect' | 'imperfect' | 'plagal' | 'interrupted'

export const CADENCE_TYPES: readonly CadenceType[] = ['perfect', 'imperfect', 'plagal', 'interrupted']

export const CADENCE_LABELS: Record<CadenceType, string> = {
  perfect: 'perfect',
  imperfect: 'imperfect',
  plagal: 'plagal',
  interrupted: 'interrupted',
}

/*
 * Definitions used (also in docs/theory-engine.md):
 *  - perfect:     V (or V7) then I
 *  - imperfect:   any of I, ii, IV then V
 *  - plagal:      IV then I
 *  - interrupted: V (or V7) then vi (VI in a minor key)
 * In minor keys the chords are i, ii°, iv, V, VI. V is major (raised leading note).
 * A "Picardy third" (major tonic at the end of a minor-key perfect cadence) is not covered.
 */
const MAJOR_OPTIONS: Record<CadenceType, readonly (readonly [string, string])[]> = {
  perfect: [
    ['V', 'I'],
    ['V7', 'I'],
  ],
  imperfect: [
    ['I', 'V'],
    ['ii', 'V'],
    ['IV', 'V'],
  ],
  plagal: [['IV', 'I']],
  interrupted: [
    ['V', 'vi'],
    ['V7', 'vi'],
  ],
}

const MINOR_OPTIONS: Record<CadenceType, readonly (readonly [string, string])[]> = {
  perfect: [
    ['V', 'i'],
    ['V7', 'i'],
  ],
  imperfect: [
    ['i', 'V'],
    ['ii°', 'V'],
    ['iv', 'V'],
  ],
  plagal: [['iv', 'i']],
  interrupted: [
    ['V', 'VI'],
    ['V7', 'VI'],
  ],
}

export interface Cadence {
  readonly type: CadenceType
  readonly key: Key
  readonly numerals: readonly [string, string]
  readonly chords: readonly [Chord, Chord]
}

function build(type: CadenceType, key: Key, pair: readonly [string, string]): Cadence {
  const first = chordFromRoman(key, pair[0]).chord
  const second = chordFromRoman(key, pair[1]).chord
  return { type, key, numerals: [pair[0], pair[1]], chords: [first, second] }
}

/** Every way this app writes the cadence in the key (e.g. perfect: V-I and V7-I). */
export function cadenceOptions(key: Key, type: CadenceType): Cadence[] {
  const table = key.mode === 'major' ? MAJOR_OPTIONS : MINOR_OPTIONS
  return table[type].map((pair) => build(type, key, pair))
}

/** One cadence of the given type. `variant` picks among the options (0 = the plainest). */
export function cadence(key: Key, type: CadenceType, variant = 0): Cadence {
  const options = cadenceOptions(key, type)
  const option = options[variant]
  if (!option) throw new RangeError(`A ${type} cadence has ${options.length} variants; ${variant} is out of range`)
  return option
}

/** "G-C", "G7-C", "F-C". */
export function cadenceSymbols(c: Cadence): string {
  return c.chords.map((x) => chordSymbol(x)).join('-')
}

function sameChord(a: Chord, b: Chord): boolean {
  return a.quality === b.quality && a.root.letter === b.root.letter && a.root.accidental === b.root.accidental
}

/**
 * Names the cadence formed by two chords in a key, or null if they are not one of the
 * recognised patterns (including cadences with chords this app does not list, such as vi-V).
 */
export function classifyCadence(key: Key, first: Chord, second: Chord): CadenceType | null {
  for (const type of CADENCE_TYPES) {
    for (const option of cadenceOptions(key, type)) {
      if (sameChord(option.chords[0], first) && sameChord(option.chords[1], second)) return type
    }
  }
  return null
}

/** Numerals of the two chords, e.g. ["V", "I"]. */
export function cadenceNumerals(key: Key, first: Chord, second: Chord): [string, string] {
  return [romanNumeral(key, first), romanNumeral(key, second)]
}

/** The final chord of a cadence type, which is a handy hint ("ends on V"). */
export function cadenceTarget(key: Key, type: CadenceType): string {
  return at(cadenceOptions(key, type), 0).numerals[1]
}
