import { describe, expect, it } from 'vitest'
import { CLEF_NAMES, type ClefName, accidentalsToShow, keySignature, staffPlacement } from '../theory'
import { GENERATORS, generateQuestion } from './registry'
import { createRng } from './rng'
import { type Difficulty, QUESTION_TYPES, type Question, type QuestionContext, TOPICS } from './types'

/**
 * Rules every question type must follow, checked for every generator, level, clef choice and many seeds.
 * Type-specific correctness (is the answer actually right?) is tested in each type's own file.
 */
const LEVELS: Difficulty[] = [1, 2, 3]
const CLEF_SETS: ClefName[][] = [['treble'], ['bass'], ['alto'], ['tenor'], [...CLEF_NAMES]]
const SEEDS = 12

function context(seed: number, clefs: ClefName[], difficulty: Difficulty, maxLedgerLines = 1): QuestionContext {
  return { rng: createRng(seed), clefs, difficulty, maxLedgerLines }
}

function* allQuestions(): Generator<{ q: Question; clefs: ClefName[]; level: Difficulty; ledger: number; label: string }> {
  for (const generator of GENERATORS) {
    for (const level of LEVELS) {
      for (const clefs of CLEF_SETS) {
        for (const ledger of [0, 1, 3]) {
          for (let seed = 0; seed < SEEDS; seed++) {
            const q = generator.generate(context(seed * 7919 + level, clefs, level, ledger))
            yield { q, clefs, level, ledger, label: `${generator.type} L${level} ${clefs.join('+')} ledger${ledger} seed${seed}` }
          }
        }
      }
    }
  }
}

describe('every question type follows the rules', () => {
  it('has a generator for every declared type, and no duplicates', () => {
    expect(GENERATORS.map((g) => g.type).sort()).toEqual([...QUESTION_TYPES].sort())
    expect(new Set(GENERATORS.map((g) => g.type)).size).toBe(GENERATORS.length)
  })

  it('every topic has at least one question type', () => {
    for (const topic of TOPICS) expect(GENERATORS.some((g) => g.topic === topic.id), topic.id).toBe(true)
  })

  it('is repeatable: the same seed gives the same question', () => {
    for (const g of GENERATORS) {
      for (const level of LEVELS) {
        expect(g.generate(context(5, ['alto', 'treble'], level))).toEqual(g.generate(context(5, ['alto', 'treble'], level)))
      }
    }
  })

  it('basic fields are filled in and consistent with the generator', () => {
    for (const { q, label } of allQuestions()) {
      const generator = GENERATORS.find((g) => g.type === q.type)!
      expect(q.topic, label).toBe(generator.topic)
      expect(q.id.startsWith(`${q.type}:`), label).toBe(true)
      for (const field of ['prompt', 'category', 'itemLabel', 'answerText', 'explanation'] as const) {
        expect(q[field].trim().length, `${label}: ${field}`).toBeGreaterThan(0)
      }
      expect(q.tags.length, label).toBeGreaterThan(0)
      for (const tag of q.tags) expect(['aqa-candidate', 'extra']).toContain(tag)
      if (q.topic === 'ear') {
        expect(q.audio, label).not.toBeNull()
        expect(q.notation, label).toBeNull()
        expect(q.reveal, label).toBeDefined()
        const events = q.audio!.events
        expect(events.length, label).toBeGreaterThan(0)
        let end = 0
        for (const e of events) {
          expect(e.midi.length, label).toBeGreaterThan(0)
          expect(e.duration, label).toBeGreaterThan(0)
          expect(e.start, label).toBeGreaterThanOrEqual(0)
          for (const m of e.midi) {
            expect(Number.isInteger(m), label).toBe(true)
            expect(m, label).toBeGreaterThanOrEqual(36)
            expect(m, label).toBeLessThanOrEqual(90)
          }
          end = Math.max(end, e.start + e.duration)
        }
        // Long enough to hear, short enough not to be tedious.
        expect(end, label).toBeGreaterThan(1.5)
        expect(end, label).toBeLessThan(9)
      } else {
        expect(q.audio, label).toBeNull()
        expect(q.reveal, label).toBeUndefined()
      }
    }
  })

  it('multiple choice: choices are distinct, the answer is one of them, and the layout fits', () => {
    for (const { q, label } of allQuestions()) {
      if (q.input.kind !== 'multiple-choice') continue
      const ids = q.input.choices.map((c) => c.id)
      const labels = q.input.choices.map((c) => c.label)
      expect(new Set(ids).size, `${label}: duplicate ids ${ids}`).toBe(ids.length)
      expect(new Set(labels).size, `${label}: duplicate labels ${labels}`).toBe(labels.length)
      expect(ids, label).toContain(q.correct)
      expect(ids.length, label).toBeGreaterThanOrEqual(2)
      expect(ids.length, label).toBeLessThanOrEqual(7)
      for (const l of labels) expect(l.trim().length, label).toBeGreaterThan(0)
      if (q.input.layout === 'letters') expect(ids, label).toEqual(['A', 'B', 'C', 'D', 'E', 'F', 'G'])
    }
  })

  it('tap questions: the answer is a position inside the allowed range and the staff matches the clef', () => {
    for (const { q, ledger, label } of allQuestions()) {
      if (q.input.kind !== 'tap-staff') continue
      const position = Number(q.correct)
      expect(Number.isInteger(position), label).toBe(true)
      expect(position, label).toBeGreaterThanOrEqual(-(2 * ledger + 1))
      expect(position, label).toBeLessThanOrEqual(8 + 2 * ledger + 1)
      expect(q.notation?.staves[0]?.clef, label).toBe(q.input.clef)
      expect(q.input.ledgerLines, label).toBe(ledger)
    }
  })

  it('what is drawn can be drawn: accidentals are writable, key signatures standard, notes within ledger limits', () => {
    for (const { q, clefs, ledger, label } of allQuestions()) {
      for (const staff of [...(q.notation?.staves ?? []), ...(q.reveal?.staves ?? [])]) {
        if (staff.key) expect(() => keySignature(staff.key!), label).not.toThrow()
        const groups = staff.items.map((i) => (i.kind === 'notes' ? i.pitches : []))
        expect(() => accidentalsToShow(groups, staff.key ?? null), label).not.toThrow()
        for (const item of staff.items) {
          if (item.kind !== 'notes') continue
          expect(item.pitches.length, label).toBeGreaterThan(0)
          for (const p of item.pitches) {
            expect(Math.abs(p.accidental), `${label}: ${p.letter}${p.accidental}`).toBeLessThanOrEqual(2)
            // Note questions obey the learner's ledger setting; everything else stays within one ledger line.
            const limit = q.topic === 'notes' ? Math.max(ledger, 1) : 1
            expect(staffPlacement(p, staff.clef).ledgerLines, `${label}: ${p.letter}${p.octave}`).toBeLessThanOrEqual(limit)
          }
        }
      }
      // Questions only use the clefs the learner chose (comparing clefs may bring in one more).
      if (q.type !== 'clef-compare') {
        for (const staff of [...(q.notation?.staves ?? []), ...(q.reveal?.staves ?? [])]) expect(clefs, label).toContain(staff.clef)
      }
    }
  })

  it('an item id always means the same question and answer', () => {
    const seen = new Map<string, { prompt: string; correct: string; answerText: string }>()
    for (const { q, label } of allQuestions()) {
      const earlier = seen.get(q.id)
      if (earlier) {
        expect(q.prompt, `${label}: prompt changed for ${q.id}`).toBe(earlier.prompt)
        expect(q.correct, `${label}: answer changed for ${q.id}`).toBe(earlier.correct)
        expect(q.answerText, `${label}: answer text changed for ${q.id}`).toBe(earlier.answerText)
      } else {
        seen.set(q.id, { prompt: q.prompt, correct: q.correct, answerText: q.answerText })
      }
    }
  })
})

describe('generateQuestion (mixing topics)', () => {
  it('only produces questions from the chosen topics, and uses every type in them', () => {
    const topics = ['rhythm', 'notes'] as const
    const rng = createRng(1)
    const seenTypes = new Set<string>()
    for (let i = 0; i < 600; i++) {
      const q = generateQuestion({ rng, clefs: ['treble', 'alto'], difficulty: 2, maxLedgerLines: 1 }, topics)
      expect(topics).toContain(q.topic)
      seenTypes.add(q.type)
    }
    const expected = GENERATORS.filter((g) => topics.includes(g.topic as never)).map((g) => g.type)
    expect([...seenTypes].sort()).toEqual([...expected].sort())
  })

  it('does not repeat the previous item when there are other items to ask', () => {
    const rng = createRng(2)
    let previous: string | undefined
    for (let i = 0; i < 400; i++) {
      const q = generateQuestion({ rng, clefs: ['treble'], difficulty: 2, maxLedgerLines: 1, avoidItemId: previous }, ['notes', 'rhythm'])
      expect(q.id).not.toBe(previous)
      previous = q.id
    }
  })

  it('refuses an empty topic list', () => {
    expect(() => generateQuestion(context(1, ['treble'], 1), [])).toThrow(RangeError)
  })

  it('asks only the chosen question types when types are given', () => {
    const rng = createRng(3)
    for (let i = 0; i < 100; i++) {
      const q = generateQuestion({ rng, clefs: ['treble'], difficulty: 2, maxLedgerLines: 1 }, ['notes', 'keys'], ['place-note', 'relative-key'])
      expect(['place-note', 'relative-key']).toContain(q.type)
    }
    // An empty list means every type.
    const q = generateQuestion({ rng, clefs: ['treble'], difficulty: 2, maxLedgerLines: 1 }, ['notes'], [])
    expect(q.topic).toBe('notes')
  })

  it('refuses types that do not belong to the chosen topics', () => {
    expect(() => generateQuestion(context(1, ['treble'], 1), ['notes'], ['relative-key'])).toThrow(RangeError)
  })
})
