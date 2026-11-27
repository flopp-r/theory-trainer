import { describe, expect, it } from 'vitest'
import { type Key, parseKey, parseNote } from '../../../theory'
import { MAJOR_FIFTHS, MAJOR_SCALES, MINOR_FIFTHS, NATURAL_MINOR_SCALES, ascii } from '../../../questions/handTables'
import { relativeKeyExample } from './relatedKeys'

const major = (t: string): Key => ({ tonic: parseNote(t), mode: 'major' })
const minor = (t: string): Key => ({ tonic: parseNote(t), mode: 'minor' })

describe('relativeKeyExample: relative keys', () => {
  it('finds the relative minor of every major key: the 6th note of the hand-written major scale', () => {
    for (const [t, scale] of Object.entries(MAJOR_SCALES)) {
      const e = relativeKeyExample(major(t), 'relative')
      expect(ascii(e.answer), t).toBe(`The relative minor of ${t} major is ${scale.split(' ')[5]} minor.`)
    }
  })

  it('finds the relative major of every minor key: the 3rd note of the hand-written natural minor scale', () => {
    for (const [t, scale] of Object.entries(NATURAL_MINOR_SCALES)) {
      const e = relativeKeyExample(minor(t), 'relative')
      expect(ascii(e.answer), t).toBe(`The relative major of ${t} minor is ${scale.split(' ')[2]} major.`)
    }
  })

  it('has the working a reader needs: scale, numbered notes, the 6th or 3rd note, a distance check, a signature check with a picture', () => {
    const e = relativeKeyExample(major('G'), 'relative')
    expect(e.steps.map((s) => s.result)).toContain('G A B C D E')
    expect(e.steps.filter((s) => s.title?.startsWith('Gap '))).toHaveLength(5)
    const take = e.steps.find((s) => s.title === 'Take note 6, the submediant')!
    expect(take.result).toBe('Relative minor: E minor')
    expect(take.staff).toBeDefined()
    expect(e.steps.at(-1)!.text).toContain('Letters down from G: G, F, E')
    expect(e.steps.at(-1)!.text).toContain('G, F♯, F, E: 3 steps, so 3 semitones')
    const back = relativeKeyExample(minor('E'), 'relative')
    expect(back.steps.find((s) => s.title === 'Take note 3, the mediant')!.result).toBe('Relative major: G major')
    expect(back.steps.at(-1)!.text).toContain('Letters up from E: E, F, G')
  })
})

describe('relativeKeyExample: parallel keys', () => {
  it('finds the parallel minor of every major key where both exist, and its signature, as the hand-written tables say', () => {
    for (const [t, fifths] of Object.entries(MAJOR_FIFTHS)) {
      if (MINOR_FIFTHS[t] === undefined) continue // the parallel minor (same key note) is not one of the 15 standard minor keys
      const e = relativeKeyExample(major(t), 'parallel')
      expect(ascii(e.answer), t).toContain(`The parallel minor of ${t} major is ${t} minor.`)
      // by hand: the minor key has 3 fewer sharps (3 more flats)
      expect(MINOR_FIFTHS[t], t).toBe(fifths - 3)
    }
  })

  it('refuses the parallel keys that would need eight or more sharps or flats', () => {
    for (const t of ['Db', 'Gb', 'Cb']) expect(() => relativeKeyExample(major(t), 'parallel'), t).toThrow()
    for (const t of ['G#', 'D#', 'A#']) expect(() => relativeKeyExample(minor(t), 'parallel'), t).toThrow()
    // and those that stay inside the 30 standard keys work
    for (const t of ['Ab', 'Eb', 'Bb', 'F', 'C', 'G', 'D', 'A', 'E', 'B', 'F#', 'C#']) expect(() => relativeKeyExample(major(t), 'parallel'), t).not.toThrow()
  })

  it('counts the change in the signature: A major (3 sharps) to A minor (none)', () => {
    const e = relativeKeyExample(major('A'), 'parallel')
    const text = e.steps.map((s) => s.text).join(' ')
    expect(text).toContain('A major has 3 sharps')
    expect(text).toContain('A minor has no sharps or flats')
    expect(text).toContain('3 places')
    expect(e.steps.filter((s) => s.staff)).toHaveLength(2)
  })

  it('finds the parallel major of a minor key', () => {
    const e = relativeKeyExample(minor('E'), 'parallel')
    expect(e.answer).toContain('The parallel major of E minor is E major.')
    expect(e.answer).toContain('E minor has 1 sharp and E major has 4 sharps')
  })
})

describe('relativeKeyExample: closely related keys', () => {
  const nameOf = (k: Key) => `${k.tonic.letter}${k.tonic.accidental === 1 ? '#' : k.tonic.accidental === -1 ? 'b' : ''} ${k.mode}`

  /** By hand: every key whose signature differs by at most one sign, from the hand-written tables, excluding the key itself. */
  function expectedRelated(k: Key, fifths: number): string[] {
    const found: string[] = []
    for (const [t, f] of Object.entries(MAJOR_FIFTHS)) if (Math.abs(f - fifths) <= 1) found.push(`${t} major`)
    for (const [t, f] of Object.entries(MINOR_FIFTHS)) if (Math.abs(f - fifths) <= 1) found.push(`${t} minor`)
    return found.filter((name) => name !== nameOf(k))
  }

  it('lists the five closely related keys of every key that has five, and refuses the rest', () => {
    const all: [Key, number][] = [
      ...Object.entries(MAJOR_FIFTHS).map(([t, f]) => [major(t), f] as [Key, number]),
      ...Object.entries(MINOR_FIFTHS).map(([t, f]) => [minor(t), f] as [Key, number]),
    ]
    for (const [k, fifths] of all) {
      const label = nameOf(k)
      const expected = expectedRelated(k, fifths)
      // Keys near the ends of the circle have a neighbour that would need eight sharps or flats.
      if (expected.length < 5) {
        expect(() => relativeKeyExample(k, 'closely-related'), label).toThrow()
        continue
      }
      const answer = ascii(relativeKeyExample(k, 'closely-related').answer)
      const listed = answer.slice(answer.indexOf(' are ') + 5, -1).split(', ')
      expect([...listed].sort(), label).toEqual([...expected].sort())
    }
  })

  it('lists C major as A minor, G major, E minor, F major, D minor, in the order the working finds them', () => {
    expect(relativeKeyExample(parseKey('C major'), 'closely-related').answer).toBe(
      'The keys closely related to C major are A minor, G major, E minor, F major, D minor.',
    )
    expect(ascii(relativeKeyExample(parseKey('Eb major'), 'closely-related').answer)).toBe(
      'The keys closely related to Eb major are C minor, Bb major, G minor, Ab major, F minor.',
    )
  })

  it('works from a minor key too', () => {
    expect(relativeKeyExample(parseKey('A minor'), 'closely-related').answer).toBe(
      'The keys closely related to A minor are C major, E minor, G major, D minor, F major.',
    )
  })
})
