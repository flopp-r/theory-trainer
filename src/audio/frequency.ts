/** Frequency in hertz of a MIDI note, in equal temperament with A4 (MIDI 69) = 440 Hz. */
export function midiToFrequency(midi: number): number {
  return 440 * 2 ** ((midi - 69) / 12)
}
