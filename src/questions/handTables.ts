// Facts written out by hand for tests. They deliberately do not use the theory module.
// Used by tests only.

/** Sharps (+) or flats (-) in each major key. */
export const MAJOR_FIFTHS: Record<string, number> = {
  C: 0, G: 1, D: 2, A: 3, E: 4, B: 5, 'F#': 6, 'C#': 7,
  F: -1, Bb: -2, Eb: -3, Ab: -4, Db: -5, Gb: -6, Cb: -7,
}

/** Sharps (+) or flats (-) in each minor key. */
export const MINOR_FIFTHS: Record<string, number> = {
  A: 0, E: 1, B: 2, 'F#': 3, 'C#': 4, 'G#': 5, 'D#': 6, 'A#': 7,
  D: -1, G: -2, C: -3, F: -4, Bb: -5, Eb: -6, Ab: -7,
}

export const SHARP_ORDER = 'FCGDAEB'
export const FLAT_ORDER = 'BEADGCF'

export const MAJOR_SCALES: Record<string, string> = {
  C: 'C D E F G A B', G: 'G A B C D E F#', D: 'D E F# G A B C#', A: 'A B C# D E F# G#',
  E: 'E F# G# A B C# D#', B: 'B C# D# E F# G# A#', 'F#': 'F# G# A# B C# D# E#', 'C#': 'C# D# E# F# G# A# B#',
  F: 'F G A Bb C D E', Bb: 'Bb C D Eb F G A', Eb: 'Eb F G Ab Bb C D', Ab: 'Ab Bb C Db Eb F G',
  Db: 'Db Eb F Gb Ab Bb C', Gb: 'Gb Ab Bb Cb Db Eb F', Cb: 'Cb Db Eb Fb Gb Ab Bb',
}

export const NATURAL_MINOR_SCALES: Record<string, string> = {
  A: 'A B C D E F G', E: 'E F# G A B C D', B: 'B C# D E F# G A', 'F#': 'F# G# A B C# D E',
  'C#': 'C# D# E F# G# A B', 'G#': 'G# A# B C# D# E F#', 'D#': 'D# E# F# G# A# B C#', 'A#': 'A# B# C# D# E# F# G#',
  D: 'D E F G A Bb C', G: 'G A Bb C D Eb F', C: 'C D Eb F G Ab Bb', F: 'F G Ab Bb C Db Eb',
  Bb: 'Bb C Db Eb F Gb Ab', Eb: 'Eb F Gb Ab Bb Cb Db', Ab: 'Ab Bb Cb Db Eb Fb Gb',
}

export const DEGREE_NAMES = ['tonic', 'supertonic', 'mediant', 'subdominant', 'dominant', 'submediant', 'leading note']

/** Turns "F♯", "B♭", "F♯♯" into "F#", "Bb", "F##". */
export function ascii(text: string): string {
  return text.replace(/♯/g, '#').replace(/♭/g, 'b')
}

export const LETTER_PC: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 }

/** Pitch class of a note written like "F#", "Bb", "F##". */
export function pc(note: string): number {
  const letter = note.charAt(0)
  const sharps = (note.match(/#/g) ?? []).length
  const flats = (note.match(/b/g) ?? []).length
  return (((LETTER_PC[letter]! + sharps - flats) % 12) + 12) % 12
}
