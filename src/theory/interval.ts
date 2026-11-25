import type { NoteName, Pitch } from './pitch'
import { diatonicStep, midiNumber, pitch, pitchFromStep, withoutOctave } from './pitch'
import { at } from './util'

export type IntervalQuality =
  | 'doubly-diminished'
  | 'diminished'
  | 'minor'
  | 'perfect'
  | 'major'
  | 'augmented'
  | 'doubly-augmented'

/**
 * An interval measured upwards. `number` counts letter names inclusively:
 * 1 = unison, 3 = third, 8 = octave, 9 = ninth, 15 = two octaves.
 */
export interface Interval {
  readonly number: number
  readonly quality: IntervalQuality
}

export type Direction = 'up' | 'down'

/** Semitones from the tonic for the 1st-7th degrees of a major scale. */
const MAJOR_SCALE_SEMITONES = [0, 2, 4, 5, 7, 9, 11] as const

/** Unisons, 4ths, 5ths (and their octave repeats) take "perfect"; the rest take "major/minor". */
function isPerfectType(simpleIndex: number): boolean {
  return simpleIndex === 0 || simpleIndex === 3 || simpleIndex === 4
}

const PERFECT_ADJUSTMENT: Partial<Record<IntervalQuality, number>> = {
  'doubly-diminished': -2,
  diminished: -1,
  perfect: 0,
  augmented: 1,
  'doubly-augmented': 2,
}

const MAJOR_ADJUSTMENT: Partial<Record<IntervalQuality, number>> = {
  'doubly-diminished': -3,
  diminished: -2,
  minor: -1,
  major: 0,
  augmented: 1,
  'doubly-augmented': 2,
}

function assertValidNumber(n: number): void {
  if (!Number.isInteger(n) || n < 1) throw new RangeError(`Interval number must be a whole number of 1 or more, got ${n}`)
}

/** Builds an interval, rejecting combinations that do not exist (e.g. "major 5th", "perfect 3rd"). */
export function interval(number: number, quality: IntervalQuality): Interval {
  intervalSemitones({ number, quality }) // validates
  return { number, quality }
}

/** Number of semitones in the interval. Throws if the quality does not exist for that number. */
export function intervalSemitones(i: Interval): number {
  assertValidNumber(i.number)
  const octaves = Math.floor((i.number - 1) / 7)
  const simpleIndex = (i.number - 1) % 7
  const table = isPerfectType(simpleIndex) ? PERFECT_ADJUSTMENT : MAJOR_ADJUSTMENT
  const adjustment = table[i.quality]
  if (adjustment === undefined) {
    throw new RangeError(`A ${i.quality} ${i.number} does not exist`)
  }
  // A diminished unison would be a *descending* interval, so it is not a valid upward interval.
  if (i.number === 1 && adjustment < 0) {
    throw new RangeError(`A ${i.quality} unison does not exist`)
  }
  return octaves * 12 + at(MAJOR_SCALE_SEMITONES, simpleIndex) + adjustment
}

function qualityFromAdjustment(perfectType: boolean, adjustment: number): IntervalQuality {
  const table = perfectType ? PERFECT_ADJUSTMENT : MAJOR_ADJUSTMENT
  for (const [quality, value] of Object.entries(table)) {
    if (value === adjustment) return quality as IntervalQuality
  }
  throw new RangeError('Interval is more than doubly augmented or diminished, which this app does not support')
}

/**
 * The interval between two pitches, and which way it goes from `from` to `to`.
 * Spelling matters: C4 to G#4 is an augmented 5th, C4 to Ab4 is a minor 6th.
 * Identical pitches give a perfect unison, direction "up".
 */
export function intervalBetween(from: Pitch, to: Pitch): { interval: Interval; direction: Direction } {
  const goesDown =
    diatonicStep(to) < diatonicStep(from) ||
    (diatonicStep(to) === diatonicStep(from) && midiNumber(to) < midiNumber(from))
  const lower = goesDown ? to : from
  const upper = goesDown ? from : to
  const number = diatonicStep(upper) - diatonicStep(lower) + 1
  const semitones = midiNumber(upper) - midiNumber(lower)
  const octaves = Math.floor((number - 1) / 7)
  const simpleIndex = (number - 1) % 7
  const perfectType = isPerfectType(simpleIndex)
  const adjustment = semitones - octaves * 12 - at(MAJOR_SCALE_SEMITONES, simpleIndex)
  return {
    interval: { number, quality: qualityFromAdjustment(perfectType, adjustment) },
    direction: goesDown ? 'down' : 'up',
  }
}

/** The pitch an interval above (or below) `from`, spelled correctly. */
export function transpose(from: Pitch, by: Interval, direction: Direction = 'up'): Pitch {
  const sign = direction === 'up' ? 1 : -1
  const steps = sign * (by.number - 1)
  return pitchFromStep(diatonicStep(from) + steps, midiNumber(from) + sign * intervalSemitones(by))
}

/** Like `transpose`, for note names without an octave. */
export function transposeNote(from: NoteName, by: Interval, direction: Direction = 'up'): NoteName {
  return withoutOctave(transpose(pitch(from.letter, from.accidental, 4), by, direction))
}

const INVERTED_QUALITY: Record<IntervalQuality, IntervalQuality> = {
  'doubly-diminished': 'doubly-augmented',
  diminished: 'augmented',
  minor: 'major',
  perfect: 'perfect',
  major: 'minor',
  augmented: 'diminished',
  'doubly-augmented': 'doubly-diminished',
}

/** Inverts a simple interval (unison to octave): major 3rd becomes minor 6th, perfect 5th becomes perfect 4th. */
export function invertInterval(i: Interval): Interval {
  if (i.number > 8) throw new RangeError('Only simple intervals (up to an octave) can be inverted')
  intervalSemitones(i)
  const inverted: Interval = { number: 9 - i.number, quality: INVERTED_QUALITY[i.quality] }
  if (inverted.number === 1 && (inverted.quality === 'diminished' || inverted.quality === 'doubly-diminished')) {
    throw new RangeError(`The inversion of a ${i.quality} octave would be a ${inverted.quality} unison, which does not exist`)
  }
  return inverted
}

const ORDINALS: Record<number, string> = { 1: 'unison', 8: 'octave', 2: '2nd', 3: '3rd' }

function numberName(n: number): string {
  return ORDINALS[n] ?? `${n}th`
}

/** "major 3rd", "perfect 5th", "augmented 4th", "perfect octave". */
export function intervalName(i: Interval): string {
  intervalSemitones(i)
  return `${i.quality.replace('-', ' ')} ${numberName(i.number)}`
}

const SHORT_QUALITY: Record<IntervalQuality, string> = {
  'doubly-diminished': 'dd',
  diminished: 'd',
  minor: 'm',
  perfect: 'P',
  major: 'M',
  augmented: 'A',
  'doubly-augmented': 'AA',
}

/** "M3", "m6", "P5", "A4", "d5". */
export function intervalShortName(i: Interval): string {
  intervalSemitones(i)
  return `${SHORT_QUALITY[i.quality]}${i.number}`
}

/** Reads "M3", "P5", "A4", "d7", "dd3", "m10". */
export function parseInterval(text: string): Interval {
  const match = /^(dd|d|m|P|M|A|AA)(\d+)$/.exec(text.trim())
  if (!match) throw new SyntaxError(`Not an interval: "${text}"`)
  const quality = (Object.keys(SHORT_QUALITY) as IntervalQuality[]).find((q) => SHORT_QUALITY[q] === match[1])
  if (!quality) throw new SyntaxError(`Not an interval: "${text}"`)
  return interval(Number(match[2]), quality)
}
