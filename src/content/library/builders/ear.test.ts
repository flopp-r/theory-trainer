import { describe, expect, it } from 'vitest'
import { chord, parseKey, parseNote, parsePitch } from '../../../theory'
import { earCadenceExample, earChordExample, earInversionExample, earIntervalExample } from './ear'

const pcs = (midi: readonly number[]) => [...midi].map((m) => m % 12).sort((a, b) => a - b)

describe('earChordExample', () => {
  it('plays C major and then C minor on the same root, with only the 3rd different (hand: C E G and C Eb G)', () => {
    const e = earChordExample(parseNote('C'), 'major')
    const first = e.steps[0]!.listen!.audio.events
    const second = e.steps[2]!.listen!.audio.events
    expect(first).toHaveLength(1)
    expect(pcs(first[0]!.midi)).toEqual([0, 4, 7])
    expect(pcs(second[0]!.midi)).toEqual([0, 3, 7])
    expect(e.steps[4]!.text).toContain('E against E♭, one semitone apart')
    expect(e.answer).toBe('The chord was C major (C E G).')
  })

  it('compares a minor chord with the major chord on the same root (A minor against A major)', () => {
    const e = earChordExample(parseNote('A'), 'minor')
    expect(pcs(e.steps[0]!.listen!.audio.events[0]!.midi)).toEqual([0, 4, 9])
    expect(pcs(e.steps[2]!.listen!.audio.events[0]!.midi)).toEqual([1, 4, 9])
    expect(e.steps[4]!.text).toContain('C against C♯')
  })

  it('compares diminished with minor and augmented with major, changing only the 5th', () => {
    const dim = earChordExample(parseNote('B'), 'diminished')
    expect(pcs(dim.steps[0]!.listen!.audio.events[0]!.midi)).toEqual([2, 5, 11]) // B D F
    expect(pcs(dim.steps[2]!.listen!.audio.events[0]!.midi)).toEqual([2, 6, 11]) // B D F#
    expect(dim.steps[4]!.text).toContain('Only the 5th is different (F against F♯')
    const aug = earChordExample(parseNote('C'), 'augmented')
    expect(pcs(aug.steps[0]!.listen!.audio.events[0]!.midi)).toEqual([0, 4, 8]) // C E G#
    expect(aug.steps[4]!.text).toContain('Only the 5th is different (G♯ against G')
  })

  it('labels how it sounds as a common description and puts the staff after the listening', () => {
    const e = earChordExample(parseNote('F'), 'major')
    const text = e.steps.map((s) => s.text).join(' ')
    expect(text).toContain('often described as')
    expect(text).toContain('not rules')
    expect(e.steps[4]!.staff!.items).toHaveLength(2)
    expect(e.steps.findIndex((s) => s.staff)).toBeGreaterThan(e.steps.findIndex((s) => s.listen))
  })

  it('works for every root and triad without error', () => {
    for (const root of ['C', 'D', 'E', 'F', 'G', 'A', 'B', 'Bb', 'Eb', 'F#', 'C#', 'Ab']) {
      for (const q of ['major', 'minor', 'diminished', 'augmented'] as const) {
        expect(() => earChordExample(parseNote(root), q), `${root} ${q}`).not.toThrow()
      }
    }
  })
})

describe('earIntervalExample', () => {
  it('plays a perfect 5th (7 semitones) and a perfect 4th (5 semitones) up from C', () => {
    const e = earIntervalExample(parsePitch('C4'), 'P5', 'P4')
    expect(e.steps[0]!.listen!.audio.events.map((x) => x.midi)).toEqual([[60], [67]])
    expect(e.steps[1]!.listen!.audio.events.map((x) => x.midi)).toEqual([[60], [65]])
    const results = e.steps.map((s) => s.result)
    expect(results).toContain('C up to G: 7 semitones, a perfect 5th')
    expect(results).toContain('C up to F: 5 semitones, a perfect 4th')
    expect(results).toContain('Interval 1 is wider')
    expect(e.steps.at(-1)!.text).toContain('F, F♯, G: 2 steps')
    expect(e.steps.at(-1)!.result).toBe('The perfect 5th is 2 semitones wider, as you heard')
  })

  it('plays a major 3rd (4 semitones) and a minor 3rd (3 semitones), with the 3rds spelled E and E-flat', () => {
    const e = earIntervalExample(parsePitch('C4'), 'M3', 'm3')
    expect(e.steps[0]!.listen!.audio.events.map((x) => x.midi)).toEqual([[60], [64]])
    expect(e.steps[1]!.listen!.audio.events.map((x) => x.midi)).toEqual([[60], [63]])
    const results = e.steps.map((s) => s.result)
    expect(results).toContain('C up to E: 4 semitones, a major 3rd')
    expect(results).toContain('C up to E♭: 3 semitones, a minor 3rd')
    expect(e.steps.at(-1)!.text).toContain('E♭, E: 1 step')
  })

  it('offers tune memory aids only when both intervals have one', () => {
    const withAids = earIntervalExample(parsePitch('C4'), 'P5', 'P4').steps.map((s) => s.title)
    expect(withAids).toContain('Try a memory aid')
    const without = earIntervalExample(parsePitch('C4'), 'M6', 'm6').steps.map((s) => s.title)
    expect(without).not.toContain('Try a memory aid')
  })

  it('refuses two intervals of the same size', () => {
    expect(() => earIntervalExample(parsePitch('C4'), 'P5', 'P5')).toThrow()
  })
})

describe('earCadenceExample', () => {
  it('plays the key chord, then the two chords, with the timing the listening questions use', () => {
    const e = earCadenceExample(parseKey('G major'), 'interrupted')
    const events = e.steps[0]!.listen!.audio.events
    expect(events.map((x) => x.start)).toEqual([0, 2.1, 3.5])
    // G major: key chord G B D, then D F# A, then Em E G B
    expect(events.map((x) => pcs(x.midi))).toEqual([[2, 7, 11], [2, 6, 9], [4, 7, 11]])
    expect(e.answer).toBe('It was an interrupted cadence in G major (V then vi).')
  })

  it('describes each type as often described, and works in major and minor keys', () => {
    for (const type of ['perfect', 'imperfect', 'plagal', 'interrupted'] as const) {
      for (const k of ['C major', 'A minor', 'D major', 'E minor']) {
        const e = earCadenceExample(parseKey(k), type)
        expect(e.steps.map((s) => s.text).join(' '), `${k} ${type}`).toContain('often described')
      }
    }
  })
})

describe('earInversionExample', () => {
  it('plays the lowest note alone: C for root position, E for first inversion, G for second (C major)', () => {
    const expectedBass = [0, 4, 7]
    for (const inversion of [0, 1, 2]) {
      const e = earInversionExample(chord('C', 'major'), inversion)
      const bass = e.steps[1]!.listen!.audio.events[0]!.midi
      expect(bass).toHaveLength(1)
      expect(bass[0]! % 12).toBe(expectedBass[inversion])
    }
  })

  it('names the gaps from the bottom: first inversion has a 3rd then a 4th, second inversion a 4th then a 3rd', () => {
    const gaps = (c: string, q: 'major' | 'minor', inversion: number) => {
      const e = earInversionExample(chord(c, q), inversion)
      return ['Count the lower gap', 'Count the upper gap'].map((t) => e.steps.find((s) => s.title === t)!.result!.replace(/^.*, an? /, ''))
    }
    expect(gaps('C', 'major', 1)).toEqual(['minor 3rd', 'perfect 4th'])
    expect(gaps('C', 'major', 2)).toEqual(['perfect 4th', 'major 3rd'])
    expect(gaps('A', 'minor', 1)).toEqual(['major 3rd', 'perfect 4th'])
    expect(gaps('C', 'major', 0)).toEqual(['major 3rd', 'minor 3rd'])
  })

  it('checks by turning the root-position chord over', () => {
    expect(earInversionExample(chord('A', 'minor'), 2).steps.at(-1)!.text).toContain('C E A, then E A C')
  })

  it('plays the root-position chord for comparison, and only handles major and minor triads', () => {
    const e = earInversionExample(chord('C', 'major'), 1)
    expect(pcs(e.steps[2]!.listen!.audio.events[0]!.midi)).toEqual([0, 4, 7])
    expect(() => earInversionExample(chord('B', 'diminished'), 1)).toThrow()
    expect(() => earInversionExample(chord('G', 'dominant7'), 1)).toThrow()
  })
})
