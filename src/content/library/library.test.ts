import { describe, expect, it } from 'vitest'
import { accidentalsToShow, keySignature } from '../../theory'
import { QUESTION_TYPES, TOPICS } from '../../questions/types'
import { parsePracticeConfig, practiceConfigToQuery } from '../../ui/practice/practiceConfig'
import { parseInline } from './inline'
import { LESSONS, LESSON_ORDER, lessonForQuestionType, neighbours } from './index'
import type { StaffSpec } from '../../questions/types'
import { LIBRARY_GROUPS, type Block, workedToText } from './types'

const blocksOf = (lesson: (typeof LESSONS)[number]) => lesson.build()

/** Every piece of text in a block, for checking. */
function textsOf(block: Block): string[] {
  switch (block.type) {
    case 'p':
    case 'h':
      return [block.text]
    case 'note':
      return [block.text]
    case 'list':
    case 'steps':
      return [...block.items]
    case 'table':
      return [...block.head, ...block.rows.flat(), ...(block.caption ? [block.caption] : [])]
    case 'staff':
      return [block.caption]
    case 'listen':
      return [block.item.label]
    case 'practise':
      return [block.link.label]
    case 'worked':
      return [block.example.title, block.example.task, block.example.answer, ...block.example.steps.flatMap((s) => [s.text, ...(s.listen ? [s.listen.label] : [])])]
  }
}

function staffsOf(block: Block): StaffSpec[] {
  if (block.type === 'staff') return [block.staff]
  if (block.type === 'worked') return block.example.steps.flatMap((s) => (s.staff ? [s.staff] : []))
  return []
}

function audiosOf(block: Block) {
  if (block.type === 'listen') return [block.item.audio]
  if (block.type === 'worked') return block.example.steps.flatMap((s) => (s.listen ? [s.listen.audio] : []))
  return []
}

describe('the lessons that exist', () => {
  it('have unique, tidy ids that are listed in LESSON_ORDER, and a real group', () => {
    const ids = LESSONS.map((l) => l.id)
    expect(new Set(ids).size).toBe(ids.length)
    for (const l of LESSONS) {
      expect(l.id, l.id).toMatch(/^[a-z]+(-[a-z]+)*$/)
      expect(LESSON_ORDER, l.id).toContain(l.id)
      expect(LIBRARY_GROUPS.map((g) => g.id), l.id).toContain(l.group)
      expect(l.title.trim().length, l.id).toBeGreaterThan(5)
      expect(l.summary.trim().length, l.id).toBeGreaterThan(20)
      expect(l.summary.endsWith('.'), `${l.id} summary should be a sentence`).toBe(true)
    }
  })

  it('only name lessons to read first that exist and come earlier', () => {
    for (const l of LESSONS) {
      for (const before of l.before ?? []) {
        expect(LESSON_ORDER.indexOf(before), `${l.id} before ${before}`).toBeGreaterThanOrEqual(0)
        expect(LESSON_ORDER.indexOf(before), `${l.id} before ${before}`).toBeLessThan(LESSON_ORDER.indexOf(l.id))
      }
    }
  })

  it('only cover real question types', () => {
    for (const l of LESSONS) for (const t of l.covers) expect(QUESTION_TYPES, `${l.id}: ${t}`).toContain(t)
  })

  it('build without error and are substantial', () => {
    for (const l of LESSONS) {
      const blocks = blocksOf(l)
      expect(blocks.length, l.id).toBeGreaterThan(8)
      expect(blocks.some((b) => b.type === 'practise'), `${l.id} needs a Practise link`).toBe(true)
    }
  })

  it('have worked examples (two or more; vocabulary needs none, ear training one)', () => {
    for (const l of LESSONS) {
      const count = blocksOf(l).filter((b) => b.type === 'worked').length
      const needed = l.id === 'vocabulary' ? 0 : l.id === 'ear-training' ? 1 : 2
      expect(count, `${l.id} has ${count} worked examples`).toBeGreaterThanOrEqual(needed)
    }
  })

  it('every worked example is complete: a question, at least three steps, and an answer', () => {
    for (const l of LESSONS) {
      for (const b of blocksOf(l)) {
        if (b.type !== 'worked') continue
        const e = b.example
        expect(e.title.trim().length, l.id).toBeGreaterThan(5)
        expect(e.task.trim().length, `${l.id}: ${e.title}`).toBeGreaterThan(10)
        expect(e.answer.trim().length, `${l.id}: ${e.title}`).toBeGreaterThan(3)
        expect(e.steps.length, `${l.id}: ${e.title}`).toBeGreaterThanOrEqual(3)
        for (const s of e.steps) expect(s.text.trim().length, `${l.id}: ${e.title}`).toBeGreaterThan(10)
        // the plain-text copy has every step in it
        const copy = workedToText(e)
        expect(copy).toContain(`${e.steps.length}. `)
        expect(copy).not.toContain('**')
      }
    }
  })

  it('have text with balanced bold and italic marks and no leftover placeholders', () => {
    for (const l of LESSONS) {
      for (const b of blocksOf(l)) {
        for (const t of textsOf(b)) {
          expect(() => parseInline(t), `${l.id}: ${t.slice(0, 60)}`).not.toThrow()
          expect(t, l.id).not.toMatch(/TODO|TBD|FIXME|undefined|NaN|\[object/)
          expect(t.trim().length, `${l.id}: empty text`).toBeGreaterThan(0)
        }
      }
    }
  })

  it('draw only notation that can be written: key signatures exist and accidentals are printable', () => {
    for (const l of LESSONS) {
      for (const b of blocksOf(l)) {
        for (const staff of staffsOf(b)) {
          if (staff.key) expect(() => keySignature(staff.key!), l.id).not.toThrow()
          const groups = staff.items.map((i) => (i.kind === 'notes' ? i.pitches : []))
          expect(() => accidentalsToShow(groups, staff.key ?? null), l.id).not.toThrow()
        }
      }
    }
  })

  it('play only sounds the synth can make', () => {
    for (const l of LESSONS) {
      for (const b of blocksOf(l)) {
        for (const audio of audiosOf(b)) {
          expect(audio.events.length, l.id).toBeGreaterThan(0)
          for (const e of audio.events) {
            expect(e.duration, l.id).toBeGreaterThan(0)
            expect(e.start, l.id).toBeGreaterThanOrEqual(0)
            for (const m of e.midi) {
              expect(Number.isInteger(m), l.id).toBe(true)
              expect(m, l.id).toBeGreaterThanOrEqual(36)
              expect(m, l.id).toBeLessThanOrEqual(96)
            }
          }
        }
      }
    }
  })

  it('have Practise links that Practice understands', () => {
    for (const l of LESSONS) {
      for (const b of blocksOf(l)) {
        if (b.type !== 'practise') continue
        for (const t of b.link.topics) expect(TOPICS.map((x) => x.id), l.id).toContain(t)
        const config = {
          topics: b.link.topics,
          clefs: b.link.clefs ?? (['alto'] as const),
          maxLedgerLines: 1,
          difficulty: b.link.level ?? 2,
          vocabCategories: [],
        }
        const round = parsePracticeConfig(new URLSearchParams(practiceConfigToQuery(config)))
        expect(round.topics, l.id).toEqual(b.link.topics)
      }
    }
  })
})

describe('the whole library', () => {
  it('has every lesson in LESSON_ORDER (this fails until all lessons are written)', () => {
    const have = new Set(LESSONS.map((l) => l.id))
    for (const id of LESSON_ORDER) expect(have.has(id), `missing lesson: ${id}`).toBe(true)
  })

  it('explains every question type, so the "Read the lesson" button always has somewhere to go', () => {
    for (const type of QUESTION_TYPES) expect(lessonForQuestionType(type), `no lesson covers ${type}`).toBeDefined()
  })

  it('lets you move between lessons in order', () => {
    const first = LESSONS[0]!
    expect(neighbours(first.id).previous).toBeUndefined()
    expect(neighbours(first.id).next).toBe(LESSONS[1])
    expect(neighbours('no-such-lesson')).toEqual({ previous: undefined, next: undefined })
  })
})
