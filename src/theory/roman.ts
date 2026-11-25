import { type Chord, type ChordQuality, identifyChord, inversionFigure, isSeventh } from './chord'
import { type Key } from './key'
import { type NoteName, letterAt, letterIndex, note } from './pitch'
import { scaleNotes } from './scale'
import { at, mod } from './util'

/*
 * Roman numeral conventions used here (written down in docs/theory-engine.md):
 *  - The numeral is the chord's root measured against the major scale (major keys)
 *    or the NATURAL minor scale (minor keys).
 *  - Upper case: major, augmented, dominant 7th, major 7th. Lower case: minor, diminished,
 *    half-diminished, diminished 7th, minor 7th.
 *  - Suffixes: ° diminished, ø half-diminished, + augmented, "maj" for major 7th.
 *  - Inversions use figured bass: I, I6, I6/4, V7, V6/5, V4/3, V4/2.
 *  - A root a semitone above or below its reference gets a ♯ or ♭ prefix (♭VII in a major key).
 *  - In a minor key, a diminished-type chord on the raised 7th (the leading note) is written
 *    plain "vii°" / "vii°7"; the natural 7th is "VII".
 */

const NUMERALS = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII']

const LOWER_CASE: ReadonlySet<ChordQuality> = new Set([
  'minor',
  'diminished',
  'half-diminished7',
  'diminished7',
  'minor7',
])

const DIMINISHED_TYPES: ReadonlySet<ChordQuality> = new Set(['diminished', 'half-diminished7', 'diminished7'])

/** The note a numeral is measured from: degree 0-6 of the major scale (major key) or natural minor scale (minor key). */
function referenceNote(key: Key, degree: number): NoteName {
  return at(scaleNotes(key.tonic, key.mode === 'major' ? 'major' : 'natural-minor'), degree)
}

/** What follows the numeral letters, e.g. "°7", "6/5", "maj7", "ø7". */
function suffixFor(quality: ChordQuality, inversion: number): string {
  const figure = inversionFigure(quality, inversion)
  // Root-position triads have no figure; root-position sevenths show "7".
  const shown = !isSeventh(quality) && inversion === 0 ? '' : figure
  switch (quality) {
    case 'major':
    case 'minor':
    case 'dominant7':
    case 'minor7':
      return shown
    case 'diminished':
      return '°' + shown
    case 'augmented':
      return '+' + shown
    case 'major7':
      return 'maj' + shown
    case 'half-diminished7':
      return 'ø' + shown
    case 'diminished7':
      return '°' + shown
  }
}

/** The Roman numeral for a chord in a key, e.g. "V7", "ii°", "♭VII", "I6/4". */
export function romanNumeral(key: Key, c: Chord, inversion = 0): string {
  const degree = mod(letterIndex(c.root.letter) - letterIndex(key.tonic.letter), 7)
  const delta = c.root.accidental - referenceNote(key, degree).accidental
  if (Math.abs(delta) > 1) {
    throw new RangeError('The chord root is more than a semitone away from the scale: cannot write a Roman numeral')
  }
  let prefix = delta === 1 ? '♯' : delta === -1 ? '♭' : ''
  if (key.mode === 'minor' && degree === 6 && delta === 1 && DIMINISHED_TYPES.has(c.quality)) {
    prefix = '' // the leading-note chord is plain vii°
  }
  const letters = at(NUMERALS, degree)
  const numeral = LOWER_CASE.has(c.quality) ? letters.toLowerCase() : letters
  return prefix + numeral + suffixFor(c.quality, inversion)
}

const NUMERAL_RE = /^([♯♭#b]?)(VII|VI|IV|V|III|II|I|vii|vi|iv|v|iii|ii|i)(°|o|ø|\+)?(maj)?(7|6\/5|4\/3|4\/2|6\/4|6)?$/

/** Reads a Roman numeral in a key and returns the chord and its inversion. Accepts ASCII "#", "b", "o" too. */
export function chordFromRoman(key: Key, text: string): { chord: Chord; inversion: number } {
  const match = NUMERAL_RE.exec(text.trim())
  if (!match) throw new SyntaxError(`Not a Roman numeral: "${text}"`)
  const [, prefix = '', letters = '', rawSymbol = '', maj = '', figure = ''] = match
  const upper = letters === letters.toUpperCase()
  const degree = NUMERALS.indexOf(letters.toUpperCase())
  const symbol = rawSymbol === 'o' ? '°' : rawSymbol
  const sevenFigure = ['7', '6/5', '4/3', '4/2'].includes(figure)
  const triadFigure = ['', '6', '6/4'].includes(figure)
  const bad = (why: string) => new SyntaxError(`"${text}": ${why}`)

  let quality: ChordQuality
  let inversion: number
  if (maj) {
    if (!upper) throw bad('"maj" needs an upper-case numeral')
    if (symbol) throw bad('"maj" cannot be combined with ° ø or +')
    if (!sevenFigure) throw bad('"maj" needs a seventh figure (7, 6/5, 4/3 or 4/2)')
    quality = 'major7'
  } else if (symbol === 'ø') {
    if (upper) throw bad('ø needs a lower-case numeral')
    if (!sevenFigure && figure !== '') throw bad('ø is a seventh chord')
    quality = 'half-diminished7'
  } else if (symbol === '°') {
    if (upper) throw bad('° needs a lower-case numeral')
    quality = sevenFigure ? 'diminished7' : 'diminished'
  } else if (symbol === '+') {
    if (!upper) throw bad('+ needs an upper-case numeral')
    if (!triadFigure) throw bad('augmented chords are triads here')
    quality = 'augmented'
  } else {
    quality = sevenFigure ? (upper ? 'dominant7' : 'minor7') : upper ? 'major' : 'minor'
  }
  if (isSeventh(quality)) {
    const figures = ['7', '6/5', '4/3', '4/2']
    inversion = figure === '' ? 0 : figures.indexOf(figure)
  } else {
    inversion = ['', '6', '6/4'].indexOf(figure)
  }
  if (inversion < 0) throw bad('the figure does not match the chord type')

  let root = referenceNote(key, degree)
  const shift = prefix === '♯' || prefix === '#' ? 1 : prefix === '♭' || prefix === 'b' ? -1 : 0
  let accidental = root.accidental + shift
  if (key.mode === 'minor' && degree === 6 && shift === 0 && (quality === 'diminished' || quality === 'half-diminished7' || quality === 'diminished7')) {
    accidental += 1 // plain vii° in a minor key is on the raised 7th
  }
  root = note(letterAt(letterIndex(key.tonic.letter) + degree), accidental)
  return { chord: { root, quality }, inversion }
}

export interface DiatonicChord {
  /** 1-7 */
  readonly degree: number
  readonly chord: Chord
  readonly numeral: string
}

/**
 * Chords built by stacking thirds on each note of a key's scale.
 * Minor keys use `form`: "natural" (i ii° III iv v VI VII) or "harmonic" (i ii° III+ iv V VI vii°).
 * Set `sevenths` for four-note chords.
 * Chords whose quality this app does not support are left out rather than guessed:
 * in harmonic minor with sevenths that means degree 1 (minor-major 7th) and degree 3 (augmented major 7th).
 */
export function diatonicChords(
  key: Key,
  options: { sevenths?: boolean; form?: 'natural' | 'harmonic' } = {},
): DiatonicChord[] {
  const { sevenths = false, form = 'natural' } = options
  const scale =
    key.mode === 'major'
      ? scaleNotes(key.tonic, 'major')
      : scaleNotes(key.tonic, form === 'harmonic' ? 'harmonic-minor' : 'natural-minor')
  const size = sevenths ? 4 : 3
  const chords: DiatonicChord[] = []
  scale.forEach((_, i) => {
    const notes = Array.from({ length: size }, (_unused, k) => at(scale, (i + 2 * k) % 7))
    const c = identifyChord(notes)
    if (c) chords.push({ degree: i + 1, chord: c, numeral: romanNumeral(key, c) })
  })
  return chords
}

/** The primary chords: I, IV and V (in a minor key: i, iv and V, with the major V from the harmonic minor). */
export function primaryChords(key: Key): DiatonicChord[] {
  const all = diatonicChords(key, { form: 'harmonic' }) // triads: every degree is present
  return [1, 4, 5].map((degree) => at(all, degree - 1))
}
