import type { AudioSpec } from '../../../audio/types'
import { type Pitch, comparePitches, midiNumber } from '../../../theory'
import type { ListenItem } from '../types'

const midis = (pitches: readonly Pitch[]) => [...pitches].sort(comparePitches).map(midiNumber)

/** The notes one after another, going up the list in order given. */
export function melodyAudio(pitches: readonly Pitch[], noteLength = 0.55): AudioSpec {
  return { events: pitches.map((pitch, i) => ({ midi: [midiNumber(pitch)], start: i * noteLength, duration: noteLength * 1.2 })) }
}

/** All the notes together, held. */
export function chordAudioBlock(pitches: readonly Pitch[], seconds = 2.2): AudioSpec {
  return { events: [{ midi: midis(pitches), start: 0, duration: seconds }] }
}

export const listenMelody = (label: string, pitches: readonly Pitch[]): ListenItem => ({ label, audio: melodyAudio(pitches) })
export const listenChord = (label: string, pitches: readonly Pitch[]): ListenItem => ({ label, audio: chordAudioBlock(pitches) })
