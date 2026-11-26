/** One sound in a playback: one or more notes that start together. */
export interface AudioEvent {
  /** MIDI note numbers (60 = middle C). Several numbers make a chord. */
  readonly midi: readonly number[]
  /** Seconds from the start of the playback. */
  readonly start: number
  /** How long the notes are held, in seconds. */
  readonly duration: number
  /** Loudness from 0 to 1. Default 0.8. */
  readonly velocity?: number
}

/** Everything needed to play something: a list of timed events. */
export interface AudioSpec {
  readonly events: readonly AudioEvent[]
}

/** Total length in seconds, including the time the last notes are held. */
export function specDuration(spec: AudioSpec): number {
  return spec.events.reduce((end, e) => Math.max(end, e.start + e.duration), 0)
}

/**
 * Plays sound. The first call to `unlock` must happen inside a tap or click (browsers refuse to make sound otherwise).
 * The synth is one implementation; a version that plays recorded piano notes can replace it without changing anything else.
 */
export interface AudioEngine {
  /** False if this device cannot make sound at all. */
  readonly available: boolean
  /** Starts the audio system. Call from a tap. Resolves to true if sound can play. */
  unlock(): Promise<boolean>
  /** Plays the spec, stopping anything already playing. Resolves when it has finished (or was stopped). */
  play(spec: AudioSpec): Promise<void>
  /** Stops whatever is playing. */
  stop(): void
}
