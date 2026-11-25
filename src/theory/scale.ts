import { type Interval, parseInterval, transpose, transposeNote } from './interval'
import type { NoteName, Pitch } from './pitch'
import { at } from './util'

export type ScaleType =
  | 'major'
  | 'natural-minor'
  | 'harmonic-minor'
  | 'melodic-minor'
  | 'major-pentatonic'
  | 'minor-pentatonic'
  | 'blues'

const pattern = (...names: string[]): readonly Interval[] => names.map(parseInterval)

/**
 * Each scale as intervals above the tonic. Building notes by interval (not by semitone count)
 * is what keeps the spelling right: C blues has Gb, not F#.
 * "melodic-minor" is the ascending form; descending melodic minor is the natural minor.
 * "blues" is the six-note minor blues scale (1 b3 4 b5 5 b7).
 */
export const SCALE_INTERVALS: Record<ScaleType, readonly Interval[]> = {
  major: pattern('P1', 'M2', 'M3', 'P4', 'P5', 'M6', 'M7'),
  'natural-minor': pattern('P1', 'M2', 'm3', 'P4', 'P5', 'm6', 'm7'),
  'harmonic-minor': pattern('P1', 'M2', 'm3', 'P4', 'P5', 'm6', 'M7'),
  'melodic-minor': pattern('P1', 'M2', 'm3', 'P4', 'P5', 'M6', 'M7'),
  'major-pentatonic': pattern('P1', 'M2', 'M3', 'P5', 'M6'),
  'minor-pentatonic': pattern('P1', 'm3', 'P4', 'P5', 'm7'),
  blues: pattern('P1', 'm3', 'P4', 'd5', 'P5', 'm7'),
}

export const SCALE_LABELS: Record<ScaleType, string> = {
  major: 'major',
  'natural-minor': 'natural minor',
  'harmonic-minor': 'harmonic minor',
  'melodic-minor': 'melodic minor',
  'major-pentatonic': 'major pentatonic',
  'minor-pentatonic': 'minor pentatonic',
  blues: 'blues',
}

/** The notes of a scale, tonic first, one octave (the tonic is not repeated at the top). */
export function scaleNotes(tonic: NoteName, type: ScaleType): NoteName[] {
  return SCALE_INTERVALS[type].map((i) => transposeNote(tonic, i))
}

export interface ScalePitchOptions {
  /** How many octaves to span. Default 1. */
  octaves?: number
  /** Add the tonic at the top of the last octave. Default true. */
  includeTop?: boolean
  /** Descending form (melodic minor comes down as natural minor). Default false. */
  descending?: boolean
}

/**
 * Pitches of a scale starting at `tonic`. Ascending unless `descending` is set,
 * in which case the list runs from the top note down and melodic minor uses its natural form.
 */
export function scalePitches(tonic: Pitch, type: ScaleType, options: ScalePitchOptions = {}): Pitch[] {
  const { octaves = 1, includeTop = true, descending = false } = options
  if (!Number.isInteger(octaves) || octaves < 1) throw new RangeError('octaves must be a whole number, 1 or more')
  const effective: ScaleType = descending && type === 'melodic-minor' ? 'natural-minor' : type
  const intervals = SCALE_INTERVALS[effective]
  const pitches: Pitch[] = []
  for (let octave = 0; octave < octaves; octave++) {
    for (const i of intervals) {
      pitches.push(transpose({ ...tonic, octave: tonic.octave + octave }, i))
    }
  }
  if (includeTop) pitches.push({ ...tonic, octave: tonic.octave + octaves })
  return descending ? pitches.reverse() : pitches
}

const DEGREE_NAMES = ['tonic', 'supertonic', 'mediant', 'subdominant', 'dominant', 'submediant'] as const

/**
 * Traditional names of the degrees of a seven-note scale (1-7).
 * The 7th is the "leading note" when it is a semitone below the tonic and the "subtonic" when it is a tone below.
 */
export function scaleDegreeName(type: ScaleType, degree: number): string {
  if (type === 'major-pentatonic' || type === 'minor-pentatonic' || type === 'blues') {
    throw new RangeError(`Degree names are only defined for seven-note scales, not ${SCALE_LABELS[type]}`)
  }
  if (!Number.isInteger(degree) || degree < 1 || degree > 7) throw new RangeError('Degree must be 1 to 7')
  if (degree === 7) return type === 'natural-minor' ? 'subtonic' : 'leading note'
  return at(DEGREE_NAMES, degree - 1)
}
