import type { AudioSpec } from '../audio/types'
import { type Pitch, comparePitches, midiNumber } from '../theory'

/** How a chord is played: all notes together, or the notes one by one and then all together. */
export type ChordStyle = 'block' | 'broken'

const mid = (pitches: readonly Pitch[]) => [...pitches].sort(comparePitches).map(midiNumber)

/** A chord for listening. "Broken" plays the notes from the bottom up and then the whole chord. */
export function chordAudio(pitches: readonly Pitch[], style: ChordStyle): AudioSpec {
  const notes = mid(pitches)
  if (style === 'block') return { events: [{ midi: notes, start: 0, duration: 2.2 }] }
  const gap = 0.4
  const events = notes.map((m, i) => ({ midi: [m], start: i * gap, duration: 0.55 }))
  return { events: [...events, { midi: notes, start: notes.length * gap + 0.3, duration: 2 }] }
}

export type IntervalMode = 'up' | 'down' | 'together'

/** Two notes for listening: one after the other going up or down, or both together. */
export function intervalAudio(lower: Pitch, upper: Pitch, mode: IntervalMode): AudioSpec {
  const low = midiNumber(lower)
  const high = midiNumber(upper)
  if (mode === 'together') return { events: [{ midi: [low, high], start: 0, duration: 2.4 }] }
  const [first, second] = mode === 'up' ? [low, high] : [high, low]
  return {
    events: [
      { midi: [first], start: 0, duration: 1 },
      { midi: [second], start: 1.1, duration: 1.4 },
    ],
  }
}

/** The key chord first, a pause, then the two cadence chords. */
export function cadenceAudio(keyChord: readonly Pitch[], first: readonly Pitch[], second: readonly Pitch[]): AudioSpec {
  return {
    events: [
      { midi: mid(keyChord), start: 0, duration: 1.4 },
      { midi: mid(first), start: 2.1, duration: 1.3 },
      { midi: mid(second), start: 3.5, duration: 2.2 },
    ],
  }
}
