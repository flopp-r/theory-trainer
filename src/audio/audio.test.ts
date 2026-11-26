import { describe, expect, it } from 'vitest'
import { midiToFrequency } from './frequency'
import { HARMONICS, noteGain } from './synth'
import { type AudioSpec, specDuration } from './types'

describe('midiToFrequency', () => {
  it.each([
    [69, 440],
    [60, 261.6256],
    [57, 220],
    [81, 880],
    [48, 130.8128],
    [72, 523.2511],
    [21, 27.5],
    [108, 4186.009],
  ])('MIDI %i is %f Hz', (midi, hz) => {
    expect(midiToFrequency(midi)).toBeCloseTo(hz, 2)
  })

  it('every octave doubles the frequency and every semitone is the twelfth root of two', () => {
    for (let midi = 24; midi < 100; midi++) {
      expect(midiToFrequency(midi + 12) / midiToFrequency(midi)).toBeCloseTo(2, 10)
      expect(midiToFrequency(midi + 1) / midiToFrequency(midi)).toBeCloseTo(2 ** (1 / 12), 10)
    }
  })
})

describe('specDuration', () => {
  it('is the end of the latest event', () => {
    const spec: AudioSpec = {
      events: [
        { midi: [60], start: 0, duration: 1 },
        { midi: [64], start: 0.5, duration: 2 },
        { midi: [67], start: 2, duration: 0.25 },
      ],
    }
    expect(specDuration(spec)).toBe(2.5)
    expect(specDuration({ events: [] })).toBe(0)
  })
})

describe('noteGain', () => {
  it('keeps the sum of a chord below the limit, however many notes there are', () => {
    for (const velocity of [0.4, 0.8, 1]) {
      for (let count = 1; count <= 8; count++) {
        expect(noteGain(velocity, count) * count, `${count} notes at ${velocity}`).toBeLessThanOrEqual(0.7 + 1e-9)
      }
    }
  })

  it('louder velocity is louder, and each note of a bigger chord is quieter', () => {
    expect(noteGain(1, 3)).toBeGreaterThan(noteGain(0.5, 3))
    expect(noteGain(0.8, 2)).toBeGreaterThan(noteGain(0.8, 4))
  })

  it('has a first harmonic that dominates (so the pitch is clear)', () => {
    expect(HARMONICS[0]).toBe(1)
    for (const h of HARMONICS.slice(1)) expect(h).toBeLessThan(0.5)
  })
})
