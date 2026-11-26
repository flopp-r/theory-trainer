import type { Key } from './key'
import { keySignature } from './key'
import type { Letter, Pitch } from './pitch'

/** What to print in front of a note head: sharp, flat, natural, double sharp or double flat. */
export type AccidentalSign = '#' | 'b' | 'n' | '##' | 'bb'

function signFor(accidental: number): AccidentalSign {
  switch (accidental) {
    case 0:
      return 'n'
    case 1:
      return '#'
    case -1:
      return 'b'
    case 2:
      return '##'
    case -2:
      return 'bb'
    default:
      throw new RangeError(`Cannot write an accidental of ${accidental} semitones`)
  }
}

/**
 * Which accidentals to print on a run of notes in one bar, following the usual rules:
 * - a note that the key signature already alters gets no sign;
 * - a note that differs from the key signature gets a sign;
 * - once a sign has been printed it holds for the same pitch (same letter, same octave) for the rest of the bar;
 * - going back to the key signature's own accidental needs a sign (a natural, or the sharp/flat again).
 *
 * `groups` are the sounding groups in order: one pitch for a note, several for a chord.
 * The result has the same shape; null means "print nothing".
 */
export function accidentalsToShow(groups: readonly (readonly Pitch[])[], key: Key | null): (AccidentalSign | null)[][] {
  const signature = new Map<Letter, number>()
  if (key) {
    for (const n of keySignature(key).accidentals) signature.set(n.letter, n.accidental)
  }
  const current = new Map<string, number>()
  return groups.map((group) =>
    group.map((p) => {
      const slot = `${p.letter}${p.octave}`
      const active = current.get(slot) ?? signature.get(p.letter) ?? 0
      current.set(slot, p.accidental)
      return p.accidental === active ? null : signFor(p.accidental)
    }),
  )
}
