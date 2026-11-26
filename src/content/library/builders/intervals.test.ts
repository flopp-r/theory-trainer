import { describe, expect, it } from 'vitest'
import { type Pitch, parsePitch } from '../../../theory'
import { LETTER_PC, ascii } from '../../../questions/handTables'
import { buildIntervalExample, intervalNameExample, intervalTableRows, invertIntervalExample, qualityFromSemitones, semitonesOf } from './intervals'

// Written out by hand. The semitone size of each interval, by number (2 to 8) and short name.
const SEMITONES: Record<string, number> = {
  d2: 0, m2: 1, M2: 2, A2: 3,
  d3: 2, m3: 3, M3: 4, A3: 5,
  d4: 4, P4: 5, A4: 6,
  d5: 6, P5: 7, A5: 8,
  d6: 7, m6: 8, M6: 9, A6: 10,
  d7: 9, m7: 10, M7: 11, A7: 12,
  d8: 11, P8: 12, A8: 13,
}
const COMMON = ['m2', 'M2', 'm3', 'M3', 'P4', 'A4', 'd5', 'P5', 'm6', 'M6', 'm7', 'M7', 'P8']
const QUALITY_WORD: Record<string, string> = { P: 'perfect', M: 'major', m: 'minor', A: 'augmented', d: 'diminished' }
const NUMBER_WORD: Record<string, string> = { '2': '2nd', '3': '3rd', '4': '4th', '5': '5th', '6': '6th', '7': '7th', '8': 'octave' }
const longName = (short: string) => `${QUALITY_WORD[short.charAt(0)]} ${NUMBER_WORD[short.slice(1)]}`
const article = (word: string) => (/^[aeiou]/.test(word) ? 'an' : 'a')

const ORDER = 'CDEFGAB'
const accidentalOf = (s: string) => (s.match(/#/g) ?? []).length - (s.match(/b/g) ?? []).length
const SHORT_BY_NUMBER_AND_SEMITONES = new Map(Object.entries(SEMITONES).map(([short, semis]) => [`${short.slice(1)}:${semis}`, short]))

/** Hand arithmetic: semitones from one written pitch to another (letters, accidentals and octaves). */
function handSemitones(lower: string, upper: string): number {
  const oct = (s: string) => Number(s.slice(-1))
  const body = (s: string) => s.slice(0, -1)
  const value = (s: string) => oct(s) * 12 + LETTER_PC[body(s).charAt(0)]! + accidentalOf(body(s))
  return value(upper) - value(lower)
}

const asPitchText = (p: Pitch) => `${p.letter}${p.accidental > 0 ? '#'.repeat(p.accidental) : 'b'.repeat(-p.accidental)}${p.octave}`

describe('the interval table', () => {
  it('has the semitone sizes of the hand-written table', () => {
    for (const row of intervalTableRows()) {
      const [name, short, semis] = row as [string, string, string]
      expect(Number(semis), name).toBe(SEMITONES[short])
      expect(name, short).toBe(longName(short))
    }
    expect(intervalTableRows().map((r) => r[1])).toEqual(COMMON)
  })

  it('works out the quality from the number and the semitones, and back', () => {
    for (const [short, semis] of Object.entries(SEMITONES)) {
      const number = Number(short.slice(1))
      const quality = qualityFromSemitones(number, semis)
      expect(QUALITY_WORD[short.charAt(0)], short).toBe(quality)
      expect(semitonesOf(number, quality), short).toBe(semis)
    }
  })
})

describe('intervalNameExample', () => {
  it('names every interval from a 2nd to an octave on natural notes and on notes with one sharp or flat, as the hand-written table says', () => {
    let checked = 0
    for (const lowerLetter of ORDER) {
      for (const lowerAcc of ['', '#', 'b']) {
        for (let above = 1; above <= 7; above++) {
          for (const upperAcc of ['', '#', 'b']) {
            const idx = ORDER.indexOf(lowerLetter) + above
            const upperLetter = ORDER[idx % 7]!
            const upperOctave = 4 + Math.floor(idx / 7)
            const lower = `${lowerLetter}${lowerAcc}4`
            const upper = `${upperLetter}${upperAcc}${upperOctave}`
            const number = above + 1
            const semis = handSemitones(lower, upper)
            const short = SHORT_BY_NUMBER_AND_SEMITONES.get(`${number}:${semis}`)
            if (!short) continue // doubly augmented or diminished: not covered
            const e = intervalNameExample(parsePitch(lower), parsePitch(upper))
            const name = longName(short)
            expect(ascii(e.answer), `${lower} to ${upper}`).toBe(`The interval from ${lower.slice(0, -1)} to ${upper.slice(0, -1)} is ${article(name)} ${name} (${short}).`)
            checked++
          }
        }
      }
    }
    expect(checked).toBeGreaterThan(300)
  })

  it('counts the letters and the semitones the way the lesson says, with a picture of the two notes', () => {
    const e = intervalNameExample(parsePitch('Bb3'), parsePitch('F4'))
    const text = e.steps.map((s) => s.text).join(' ')
    expect(text).toContain('B, C, D, E, F')
    expect(text).toContain('B to C is 1, C to D is 2, D to E is 2, E to F is 1')
    expect(text).toContain('Add them up: **6**')
    expect(text).toContain('add 1')
    expect(text).toContain('7 semitones')
    expect(e.steps[0]!.staff!.items).toHaveLength(2)
    expect(e.steps.at(-1)!.listen).toBeDefined()
  })

  it('treats C to F♯ and C to G♭ as two different intervals with the same six semitones', () => {
    const augmented = intervalNameExample(parsePitch('C4'), parsePitch('F#4'))
    const diminished = intervalNameExample(parsePitch('C4'), parsePitch('Gb4'))
    expect(augmented.answer).toContain('augmented 4th (A4)')
    expect(diminished.answer).toContain('diminished 5th (d5)')
    expect(augmented.steps.map((s) => s.text).join(' ')).toContain('6 semitones')
    expect(diminished.steps.map((s) => s.text).join(' ')).toContain('6 semitones')
  })

  it('says "an" before octave and augmented', () => {
    expect(intervalNameExample(parsePitch('C4'), parsePitch('C5')).steps[1]!.text).toContain('an **octave**')
    expect(intervalNameExample(parsePitch('C4'), parsePitch('F#4')).answer).toContain('is an augmented 4th')
  })

  it('refuses a pair that is not a 2nd to an octave going up', () => {
    expect(() => intervalNameExample(parsePitch('E4'), parsePitch('C4'))).toThrow()
    expect(() => intervalNameExample(parsePitch('C4'), parsePitch('D5'))).toThrow()
    expect(() => intervalNameExample(parsePitch('C4'), parsePitch('C4'))).toThrow()
  })
})

describe('buildIntervalExample', () => {
  it('builds every interval above and below notes with no sign, one sharp or one flat, as hand arithmetic says', () => {
    let checked = 0
    for (const startLetter of ORDER) {
      for (const startAcc of ['', '#', 'b']) {
        for (const [short, semis] of Object.entries(SEMITONES)) {
          for (const direction of ['up', 'down'] as const) {
            if (short === 'd2' && direction === 'down') continue
            const number = Number(short.slice(1))
            const sign = direction === 'up' ? 1 : -1
            const letter = ORDER[(((ORDER.indexOf(startLetter) + sign * (number - 1)) % 7) + 7) % 7]!
            const targetPc = (((LETTER_PC[startLetter]! + accidentalOf(startAcc) + sign * semis) % 12) + 12) % 12
            // the sign that makes the letter sound like the target pitch class (at most a double sharp or flat)
            const acc = [-2, -1, 0, 1, 2].find((a) => (((LETTER_PC[letter]! + a - targetPc) % 12) + 12) % 12 === 0)
            if (acc === undefined) continue
            const target = letter + (acc > 0 ? '#'.repeat(acc) : 'b'.repeat(-acc))
            const e = buildIntervalExample(parsePitch(`${startLetter}${startAcc}4`), short, direction)
            const name = longName(short)
            expect(ascii(e.answer), `${short} ${direction} ${startLetter}${startAcc}`).toBe(
              `${article(name) === 'an' ? 'An' : 'A'} ${name} ${direction === 'up' ? 'above' : 'below'} ${startLetter}${startAcc} is ${target}.`,
            )
            checked++
          }
        }
      }
    }
    expect(checked).toBeGreaterThan(900)
  })

  it('works the lesson examples: major 3rd above Bb is D, perfect 5th above F# is C#, minor 3rd below F is D, minor 6th above G is Eb', () => {
    expect(ascii(buildIntervalExample(parsePitch('Bb4'), 'M3', 'up').answer)).toBe('A major 3rd above Bb is D.')
    expect(ascii(buildIntervalExample(parsePitch('F#4'), 'P5', 'up').answer)).toBe('A perfect 5th above F# is C#.')
    expect(ascii(buildIntervalExample(parsePitch('F4'), 'm3', 'down').answer)).toBe('A minor 3rd below F is D.')
    expect(ascii(buildIntervalExample(parsePitch('G4'), 'm6', 'up').answer)).toBe('A minor 6th above G is Eb.')
  })

  it('shows its working: letters, a walk along the plain letters, the fix for the sign, a picture and a check', () => {
    const e = buildIntervalExample(parsePitch('F#4'), 'P5', 'up')
    const text = e.steps.map((s) => s.text).join(' ')
    expect(text).toContain('F, G, A, B, C')
    expect(text).toContain('F to G is 2, G to A is 2, A to B is 2, B to C is 1')
    expect(text).toContain('7 − 1 = 6')
    expect(text).toContain('1 semitone too few')
    expect(e.steps.at(-1)!.text).toContain('Check')
    expect(e.steps.some((s) => s.staff && s.staff.items.length === 2)).toBe(true)
    expect(e.steps.some((s) => s.listen)).toBe(true)
  })

  it('says "an augmented 4th" with the right article', () => {
    expect(ascii(buildIntervalExample(parsePitch('C4'), 'A4', 'up').answer)).toBe('An augmented 4th above C is F#.')
  })

  it('puts the new note where the picture expects it, in order from the start note', () => {
    const e = buildIntervalExample(parsePitch('F4'), 'm3', 'down')
    const picture = e.steps.find((s) => s.staff && s.staff.items.length === 2)!
    const notes = picture.staff!.items.map((i) => (i.kind === 'notes' ? asPitchText(i.pitches[0]!) : ''))
    expect(notes).toEqual(['F4', 'D4'])
  })
})

describe('invertIntervalExample', () => {
  const INVERSIONS: [string, string][] = [
    ['m2', 'M7'], ['M2', 'm7'], ['m3', 'M6'], ['M3', 'm6'], ['P4', 'P5'], ['A4', 'd5'], ['d4', 'A5'], ['A2', 'd7'], ['d3', 'A6'],
  ]
  it('inverts every interval from a 2nd to a 7th as the hand-written pairs say: numbers add to 9, semitones to 12, quality flips', () => {
    for (const [a, b] of INVERSIONS) {
      for (const [from, to] of [[a, b], [b, a]] as const) {
        expect(Number(from.slice(1)) + Number(to.slice(1)), from).toBe(9)
        expect(SEMITONES[from]! + SEMITONES[to]!, from).toBe(12)
        for (const lower of ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4']) {
          const e = invertIntervalExample(parsePitch(lower), from)
          const fromName = longName(from)
          const toName = longName(to)
          expect(e.answer, `${from} from ${lower}`).toBe(`The inversion of ${article(fromName)} ${fromName} is ${article(toName)} ${toName} (${to}).`)
        }
      }
    }
  })

  it('shows the notes before and after, the number rule, the 12-semitone rule and the quality swap', () => {
    const e = invertIntervalExample(parsePitch('C4'), 'M3')
    const text = e.steps.map((s) => s.text).join(' ')
    expect(text).toContain('E, F, G, A, B, C')
    expect(text).toContain('3 + 6 = 9')
    expect(text).toContain('12 − 4 = **8 semitones**')
    expect(text).toContain('major and minor swap')
    expect(e.steps.filter((s) => s.staff)).toHaveLength(2)
  })

  it('does not take a unison or an octave', () => {
    expect(() => invertIntervalExample(parsePitch('C4'), 'P8')).toThrow()
  })
})
