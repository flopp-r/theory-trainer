import { describe, expect, it } from 'vitest'
import { DEGREE_NAMES, MAJOR_FIFTHS, MAJOR_SCALES, MINOR_FIFTHS, NATURAL_MINOR_SCALES, ascii, pc } from './handTables'
import { choicesOf } from './testing'
import { createRng } from './rng'
import { scaleDegreeGenerator, scaleSpellingGenerator } from './scales'
import type { Difficulty, Question } from './types'

const ctx = (seed: number, difficulty: Difficulty) => ({ rng: createRng(seed), clefs: ['treble'] as const, difficulty, maxLedgerLines: 1 })
const many = (g: { generate: (c: ReturnType<typeof ctx>) => Question }, count: number, difficulty: Difficulty) =>
  Array.from({ length: count }, (_, i) => g.generate(ctx(i + 13 * difficulty, difficulty)))

/** Hand-written semitone steps between neighbouring notes, going up from the tonic. */
const STEPS: Record<string, number[]> = {
  major: [2, 2, 1, 2, 2, 2],
  'natural minor': [2, 1, 2, 2, 1, 2],
  'harmonic minor': [2, 1, 2, 2, 1, 3],
  'melodic minor': [2, 1, 2, 2, 2, 2],
  'major pentatonic': [2, 2, 3, 2],
  'minor pentatonic': [3, 2, 2, 3],
  blues: [3, 2, 1, 1, 3],
}

function parseScalePrompt(prompt: string) {
  const m = /^Which notes make up the ([A-G][♯♭]?) (.+) scale/.exec(prompt)!
  return { tonic: ascii(m[1]!), type: m[2]! }
}

describe('scale-spelling', () => {
  it('the answer has the right semitone steps for its scale type (checked by hand-written patterns)', () => {
    for (const level of [1, 2, 3] as const) {
      for (const q of many(scaleSpellingGenerator, 300, level)) {
        const { tonic, type } = parseScalePrompt(q.prompt)
        const notes = ascii(q.correct).split(' ')
        expect(notes[0]).toBe(tonic)
        const steps = notes.slice(1).map((n, i) => (((pc(n) - pc(notes[i]!)) % 12) + 12) % 12)
        expect(steps, `${tonic} ${type}`).toEqual(STEPS[type])
      }
    }
  })

  it('major and natural minor answers match the hand-written scale tables exactly', () => {
    let checked = 0
    for (const q of many(scaleSpellingGenerator, 600, 3)) {
      const { tonic, type } = parseScalePrompt(q.prompt)
      const table = type === 'major' ? MAJOR_SCALES : type === 'natural minor' ? NATURAL_MINOR_SCALES : null
      if (!table) continue
      expect(ascii(q.correct)).toBe(table[tonic])
      checked++
    }
    expect(checked).toBeGreaterThan(100)
  })

  it('seven-note scales use every letter name exactly once, in order', () => {
    for (const q of many(scaleSpellingGenerator, 400, 3)) {
      const { type } = parseScalePrompt(q.prompt)
      if (!['major', 'natural minor', 'harmonic minor', 'melodic minor'].includes(type)) continue
      const letters = ascii(q.correct).split(' ').map((n) => n.charAt(0))
      const start = 'CDEFGAB'.indexOf(letters[0]!)
      expect(letters.join('')).toBe(Array.from({ length: 7 }, (_, i) => 'CDEFGAB'.charAt((start + i) % 7)).join(''))
    }
  })

  it('no wrong answer is accidentally correct', () => {
    for (const q of many(scaleSpellingGenerator, 400, 3)) {
      const { tonic, type } = parseScalePrompt(q.prompt)
      for (const c of choicesOf(q)) {
        if (c.id === q.correct) continue
        const notes = ascii(c.label).split(' ')
        const steps = notes.slice(1).map((n, i) => (((pc(n) - pc(notes[i]!)) % 12) + 12) % 12)
        const sameShape = notes[0] === tonic && JSON.stringify(steps) === JSON.stringify(STEPS[type])
        // A respelled scale has the right sound but the wrong letters: it must not look like a valid spelling of the same scale.
        if (sameShape && ['major', 'natural minor', 'harmonic minor', 'melodic minor'].includes(type)) {
          const letters = notes.map((n) => n.charAt(0))
          const start = 'CDEFGAB'.indexOf(letters[0]!)
          const ok = letters.join('') === Array.from({ length: 7 }, (_, i) => 'CDEFGAB'.charAt((start + i) % 7)).join('')
          expect(ok, `${q.prompt}: ${c.label}`).toBe(false)
        }
      }
    }
  })

  it('usually offers a same-sounding but wrongly spelled scale (the classic mistake)', () => {
    let withTwin = 0
    const questions = many(scaleSpellingGenerator, 300, 3)
    for (const q of questions) {
      const correctPcs = ascii(q.correct).split(' ').map(pc).join(',')
      const twins = choicesOf(q).filter((c) => c.id !== q.correct && ascii(c.label).split(' ').map(pc).join(',') === correctPcs)
      if (twins.length > 0) withTwin++
    }
    expect(withTwin / questions.length).toBeGreaterThan(0.85)
  })

  it('level 1 is major only; level 2 adds natural minor and pentatonic; level 3 everything', () => {
    const types = (level: Difficulty) => new Set(many(scaleSpellingGenerator, 400, level).map((q) => parseScalePrompt(q.prompt).type))
    expect([...types(1)]).toEqual(['major'])
    expect([...types(2)].sort()).toEqual(['major', 'major pentatonic', 'minor pentatonic', 'natural minor'])
    expect([...types(3)].sort()).toEqual(['blues', 'harmonic minor', 'major', 'major pentatonic', 'melodic minor', 'minor pentatonic', 'natural minor'])
  })

  it('major-based scales are built on major keys and minor-based ones on minor keys, within the level limit', () => {
    const limit: Record<Difficulty, number> = { 1: 2, 2: 4, 3: 7 }
    for (const level of [1, 2, 3] as const) {
      for (const q of many(scaleSpellingGenerator, 200, level)) {
        const { tonic, type } = parseScalePrompt(q.prompt)
        const fifths = (type.startsWith('major') ? MAJOR_FIFTHS : MINOR_FIFTHS)[tonic]
        expect(fifths, `${tonic} ${type}`).not.toBeUndefined()
        expect(Math.abs(fifths!)).toBeLessThanOrEqual(limit[level])
      }
    }
  })

  it('melodic minor questions say they mean the ascending form', () => {
    const q = many(scaleSpellingGenerator, 800, 3).find((x) => x.prompt.includes('melodic minor'))!
    expect(q.prompt).toContain('(going up)')
  })
})

describe('scale-degree', () => {
  it('degree names match a hand-written list, in major and natural minor', () => {
    for (const level of [1, 2, 3] as const) {
      for (const q of many(scaleDegreeGenerator, 300, level)) {
        if (!q.id.includes(':name:')) continue
        const degree = Number(q.id.split(':').at(-1))
        const minor = q.id.includes(':natural-minor:')
        const expected = minor && degree === 7 ? 'subtonic' : DEGREE_NAMES[degree - 1]
        expect(q.correct).toBe(expected)
        expect(q.prompt).toContain(minor ? 'natural minor' : 'major scale')
      }
    }
  })

  it('note answers match the hand-written scale tables', () => {
    let checked = 0
    for (const level of [1, 2, 3] as const) {
      for (const q of many(scaleDegreeGenerator, 300, level)) {
        if (!q.id.includes(':note:')) continue
        const [, , scale, tonic, degree] = q.id.split(':')
        const table = scale === 'major' ? MAJOR_SCALES : NATURAL_MINOR_SCALES
        const notes = table[tonic!]!.split(' ')
        expect(ascii(q.correct)).toBe(notes[Number(degree) - 1])
        // and the term in the prompt is the right name for that degree
        const term = /which note is the ([a-z ]+)\?/.exec(q.prompt)![1]!
        expect(term).toBe(scale === 'natural-minor' && Number(degree) === 7 ? 'subtonic' : DEGREE_NAMES[Number(degree) - 1])
        // wrong answers are other notes of the same scale
        for (const c of choicesOf(q)) expect(notes).toContain(ascii(c.label))
        checked++
      }
    }
    expect(checked).toBeGreaterThan(200)
  })

  it('natural minor appears only at the hardest level', () => {
    expect(many(scaleDegreeGenerator, 300, 1).every((q) => !q.id.includes('natural-minor'))).toBe(true)
    expect(many(scaleDegreeGenerator, 300, 2).every((q) => !q.id.includes('natural-minor'))).toBe(true)
    expect(many(scaleDegreeGenerator, 300, 3).some((q) => q.id.includes('natural-minor'))).toBe(true)
  })

  it('covers all seven degrees', () => {
    const degrees = new Set(many(scaleDegreeGenerator, 400, 1).filter((q) => q.id.includes(':name:')).map((q) => q.id.split(':').at(-1)))
    expect(degrees.size).toBe(7)
  })
})
