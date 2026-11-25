import { type Interval, parseInterval, transpose, transposeNote } from './interval'
import { type NoteName, type Pitch, comparePitches, formatNote, parseNote, pitch, sameNote, shiftOctaves } from './pitch'
import { at } from './util'

export type ChordQuality =
  | 'major'
  | 'minor'
  | 'diminished'
  | 'augmented'
  | 'dominant7'
  | 'major7'
  | 'minor7'
  | 'half-diminished7'
  | 'diminished7'

export const TRIAD_QUALITIES: readonly ChordQuality[] = ['major', 'minor', 'diminished', 'augmented']
export const SEVENTH_QUALITIES: readonly ChordQuality[] = [
  'dominant7',
  'major7',
  'minor7',
  'half-diminished7',
  'diminished7',
]

export interface Chord {
  readonly root: NoteName
  readonly quality: ChordQuality
}

const pattern = (...names: string[]): readonly Interval[] => names.map(parseInterval)

/** Intervals above the root, root first. Spelled by interval, so Cdim7 is C Eb Gb Bbb. */
export const CHORD_INTERVALS: Record<ChordQuality, readonly Interval[]> = {
  major: pattern('P1', 'M3', 'P5'),
  minor: pattern('P1', 'm3', 'P5'),
  diminished: pattern('P1', 'm3', 'd5'),
  augmented: pattern('P1', 'M3', 'A5'),
  dominant7: pattern('P1', 'M3', 'P5', 'm7'),
  major7: pattern('P1', 'M3', 'P5', 'M7'),
  minor7: pattern('P1', 'm3', 'P5', 'm7'),
  'half-diminished7': pattern('P1', 'm3', 'd5', 'm7'),
  diminished7: pattern('P1', 'm3', 'd5', 'd7'),
}

export const CHORD_QUALITY_LABELS: Record<ChordQuality, string> = {
  major: 'major',
  minor: 'minor',
  diminished: 'diminished',
  augmented: 'augmented',
  dominant7: 'dominant 7th',
  major7: 'major 7th',
  minor7: 'minor 7th',
  'half-diminished7': 'half-diminished 7th',
  diminished7: 'diminished 7th',
}

export function chord(root: NoteName | string, quality: ChordQuality): Chord {
  return { root: typeof root === 'string' ? parseNote(root) : root, quality }
}

export function isSeventh(quality: ChordQuality): boolean {
  return SEVENTH_QUALITIES.includes(quality)
}

/** The chord's notes in root position, root first. */
export function chordNotes(c: Chord): NoteName[] {
  return CHORD_INTERVALS[c.quality].map((i) => transposeNote(c.root, i))
}

/** Names the chord that a root-position list of notes spells, or null if it is not one of the supported chords. */
export function identifyChord(notes: readonly NoteName[]): Chord | null {
  const root = notes[0]
  if (!root) return null
  for (const quality of [...TRIAD_QUALITIES, ...SEVENTH_QUALITIES]) {
    const candidate = chordNotes({ root, quality })
    if (candidate.length === notes.length && candidate.every((n, i) => sameNote(n, at(notes, i)))) {
      return { root, quality }
    }
  }
  return null
}

export interface VoicingOptions {
  /** 0 = root position, 1 = first inversion, ... up to the number of notes minus one. Default 0. */
  inversion?: number
  /** Octave of the lowest note. Default 4. */
  bassOctave?: number
  /** Open position: the second-lowest note is raised an octave. Default false (close position). */
  open?: boolean
}

/** The chord as pitches, lowest first. */
export function chordPitches(c: Chord, options: VoicingOptions = {}): Pitch[] {
  const { inversion = 0, bassOctave = 4, open = false } = options
  const size = CHORD_INTERVALS[c.quality].length
  if (!Number.isInteger(inversion) || inversion < 0 || inversion >= size) {
    throw new RangeError(`Inversion must be 0 to ${size - 1} for this chord, got ${inversion}`)
  }
  const root = pitch(c.root.letter, c.root.accidental, 4)
  let stack = CHORD_INTERVALS[c.quality].map((i) => transpose(root, i))
  for (let k = 0; k < inversion; k++) {
    stack = [...stack.slice(1), shiftOctaves(at(stack, 0), 1)]
  }
  const octaveShift = bassOctave - at(stack, 0).octave
  stack = stack.map((p) => shiftOctaves(p, octaveShift))
  if (open) {
    stack = stack.map((p, i) => (i === 1 ? shiftOctaves(p, 1) : p)).sort(comparePitches)
  }
  return stack
}

/** Note in the bass for a given inversion. */
export function bassNote(c: Chord, inversion = 0): NoteName {
  return at(chordNotes(c), inversion)
}

const SUFFIX: Record<ChordQuality, string> = {
  major: '',
  minor: 'm',
  diminished: 'dim',
  augmented: 'aug',
  dominant7: '7',
  major7: 'maj7',
  minor7: 'm7',
  'half-diminished7': 'm7b5',
  diminished7: 'dim7',
}

/** Other ways people write each chord, accepted when reading a symbol. */
const SUFFIX_ALIASES: Record<ChordQuality, readonly string[]> = {
  major: ['maj', 'M'],
  minor: ['min', 'mi', '-'],
  diminished: ['°', 'o'],
  augmented: ['+'],
  dominant7: [],
  major7: ['M7', 'Δ', 'Δ7', 'ma7'],
  minor7: ['min7', 'mi7', '-7'],
  'half-diminished7': ['ø', 'ø7', 'm7♭5', 'min7b5', 'min7♭5'],
  diminished7: ['°7', 'o7'],
}

export interface ChordSymbolOptions {
  /** Adds a slash bass note when the chord is inverted, e.g. C/E. */
  inversion?: number
  style?: 'ascii' | 'symbol'
}

/** "C", "Cm", "Cdim", "Caug", "C7", "Cmaj7", "Cm7", "Cm7b5", "Cdim7", "F#m", "Bb7/D". */
export function chordSymbol(c: Chord, options: ChordSymbolOptions = {}): string {
  const { inversion = 0, style = 'ascii' } = options
  const base = formatNote(c.root, style) + SUFFIX[c.quality]
  return inversion > 0 ? `${base}/${formatNote(bassNote(c, inversion), style)}` : base
}

export interface ParsedChordSymbol {
  readonly chord: Chord
  readonly inversion: number
}

// Accidentals are optional and all one kind; written with `+` so an empty match cannot hide the flat branch.
const ROOT_RE = /^([A-G](?:[#♯]+|[b♭]+)?)(.*)$/

/** Reads "Cmaj7", "F#m7b5", "Bb", "G7/B" (and common alternative spellings such as "C-7" or "CΔ"). */
export function parseChordSymbol(text: string): ParsedChordSymbol {
  const [main = '', slash, ...extra] = text.trim().split('/')
  if (extra.length > 0) throw new SyntaxError(`Not a chord symbol: "${text}"`)
  const match = ROOT_RE.exec(main)
  if (!match) throw new SyntaxError(`Not a chord symbol: "${text}"`)
  const suffix = match[2] ?? ''
  const quality = (Object.keys(SUFFIX) as ChordQuality[]).find(
    (q) => SUFFIX[q] === suffix || SUFFIX_ALIASES[q].includes(suffix),
  )
  if (quality === undefined) throw new SyntaxError(`Unknown chord type "${suffix}" in "${text}"`)
  const parsed: Chord = { root: parseNote(match[1] ?? ''), quality }
  if (slash === undefined) return { chord: parsed, inversion: 0 }
  const bass = parseNote(slash)
  const inversion = chordNotes(parsed).findIndex((n) => sameNote(n, bass))
  if (inversion < 0) throw new SyntaxError(`${slash} is not a note of ${main}, so "${text}" is not an inversion`)
  return { chord: parsed, inversion }
}

/** Figured-bass label for an inversion: triads 5/3, 6, 6/4; sevenths 7, 6/5, 4/3, 4/2. */
export function inversionFigure(quality: ChordQuality, inversion: number): string {
  const figures = isSeventh(quality) ? ['7', '6/5', '4/3', '4/2'] : ['5/3', '6', '6/4']
  const figure = figures[inversion]
  if (figure === undefined) throw new RangeError(`No inversion ${inversion} for a ${quality} chord`)
  return figure
}

const ORDINAL_INVERSIONS = ['root position', 'first inversion', 'second inversion', 'third inversion']

export function inversionName(inversion: number): string {
  return at(ORDINAL_INVERSIONS, inversion)
}
