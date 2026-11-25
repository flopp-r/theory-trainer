import type { Pitch } from './pitch'
import { midiNumber, parsePitch, shiftOctaves } from './pitch'

export interface PitchRange {
  readonly low: Pitch
  readonly high: Pitch
}

/**
 * Range used to weight note questions towards what a viola player reads.
 * The low end is the open C string (C3), which is a fact of the instrument.
 * The high end (A5) is a limit chosen for this app so that questions stay readable
 * and do not need many ledger lines. It is not a limit of the instrument.
 */
export const VIOLA_RANGE: PitchRange = { low: parsePitch('C3'), high: parsePitch('A5') }

export function isInRange(p: Pitch, range: PitchRange): boolean {
  const midi = midiNumber(p)
  return midi >= midiNumber(range.low) && midi <= midiNumber(range.high)
}

/**
 * The guitar sounds an octave lower than its written (treble clef) music.
 * Written E4 sounds E3. Use this when a question or card talks about what is heard.
 */
export function guitarSoundingPitch(written: Pitch): Pitch {
  return shiftOctaves(written, -1)
}

/** Inverse of `guitarSoundingPitch`: the note to write for a sounding guitar pitch. */
export function guitarWrittenPitch(sounding: Pitch): Pitch {
  return shiftOctaves(sounding, 1)
}
