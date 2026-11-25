import { describe, expect, it } from 'vitest'
import { VOCABULARY, VOCAB_CATEGORY_IDS } from '../content/vocabulary'
import { createRng } from './rng'
import { choicesOf } from './testing'
import type { Difficulty, Question } from './types'
import { slug, vocabMeaningGenerator, vocabTermGenerator } from './vocabulary'

const ctx = (seed: number, difficulty: Difficulty, vocabCategories: readonly string[] = []) => ({
  rng: createRng(seed),
  clefs: ['treble'] as const,
  difficulty,
  maxLedgerLines: 1,
  vocabCategories,
})
const many = (g: { generate: (c: ReturnType<typeof ctx>) => Question }, count: number, difficulty: Difficulty, categories?: readonly string[]) =>
  Array.from({ length: count }, (_, i) => g.generate(ctx(i + 11 * difficulty, difficulty, categories)))

/** Finds the entry a question is about from its id. */
function entryOf(q: Question) {
  const [, categoryId, termSlug] = q.id.split(':')
  const category = VOCABULARY.find((c) => c.category === categoryId)!
  const entry = category.entries.find((e) => slug(e.term) === termSlug)!
  return { category, entry }
}

describe('the vocabulary data', () => {
  it('has the eight categories the plan asks for', () => {
    expect([...VOCAB_CATEGORY_IDS].sort()).toEqual(['articulation', 'dynamics', 'form', 'instruments', 'ornaments', 'tempo', 'texture', 'tonality'])
  })

  it('every entry is complete, and wording templates have their placeholders', () => {
    for (const c of VOCABULARY) {
      expect(c.label.length).toBeGreaterThan(0)
      expect(c.askTerm).toContain('{term}')
      expect(c.askMeaning).toContain('{meaning}')
      expect(c.entries.length).toBeGreaterThan(5)
      for (const e of c.entries) {
        expect(e.term.trim().length, `${c.category}`).toBeGreaterThan(0)
        expect(e.meaning.trim().length, `${c.category}: ${e.term}`).toBeGreaterThan(0)
        expect([1, 2, 3]).toContain(e.level)
        expect(e.group.length, `${c.category}: ${e.term}`).toBeGreaterThan(0)
        expect(e.meaning.toLowerCase(), `${c.category}: ${e.term}`).not.toBe(e.term.toLowerCase())
      }
    }
  })

  it('terms are unique within a category (also after turning them into ids)', () => {
    for (const c of VOCABULARY) {
      const terms = c.entries.map((e) => e.term.toLowerCase())
      expect(new Set(terms).size, c.category).toBe(terms.length)
      const slugs = c.entries.map((e) => slug(e.term))
      expect(new Set(slugs).size, c.category).toBe(slugs.length)
    }
  })

  it('entries with the same meaning are in the same group, so they can never be two options in one question', () => {
    for (const c of VOCABULARY) {
      const groupsByMeaning = new Map<string, Set<string>>()
      for (const e of c.entries) {
        const set = groupsByMeaning.get(e.meaning) ?? new Set<string>()
        set.add(e.group)
        groupsByMeaning.set(e.meaning, set)
      }
      for (const [meaning, groups] of groupsByMeaning) expect(groups.size, `${c.category}: “${meaning}”`).toBe(1)
    }
  })

  it('every level has at least four different groups, so there are always three wrong answers', () => {
    for (const c of VOCABULARY) {
      for (const level of [1, 2, 3] as const) {
        const groups = new Set(c.entries.filter((e) => e.level <= level).map((e) => e.group))
        expect(groups.size, `${c.category} level ${level}`).toBeGreaterThanOrEqual(4)
      }
    }
  })

  it('every level has plenty to ask about', () => {
    for (const c of VOCABULARY) {
      expect(c.entries.filter((e) => e.level === 1).length, `${c.category} core terms`).toBeGreaterThanOrEqual(4)
    }
  })
})

describe('vocabulary questions', () => {
  it('term questions: the right answer is the term’s meaning, and no wrong answer comes from the same group', () => {
    for (const level of [1, 2, 3] as const) {
      for (const q of many(vocabTermGenerator, 400, level)) {
        const { category, entry } = entryOf(q)
        expect(q.correct).toBe(entry.meaning)
        expect(q.prompt).toBe(category.askTerm.replace('{term}', entry.term))
        for (const c of choicesOf(q)) {
          if (c.id === q.correct) continue
          const owners = category.entries.filter((e) => e.meaning === c.label)
          expect(owners.length, c.label).toBeGreaterThan(0)
          for (const owner of owners) expect(owner.group, `${q.id}: ${c.label}`).not.toBe(entry.group)
        }
      }
    }
  })

  it('meaning questions: the right answer is the term, and no wrong answer comes from the same group', () => {
    for (const level of [1, 2, 3] as const) {
      for (const q of many(vocabMeaningGenerator, 400, level)) {
        const { category, entry } = entryOf(q)
        expect(q.correct).toBe(entry.term)
        expect(q.prompt).toBe(category.askMeaning.replace('{meaning}', entry.meaning))
        for (const c of choicesOf(q)) {
          if (c.id === q.correct) continue
          const owner = category.entries.find((e) => e.term === c.label)!
          expect(owner, c.label).toBeDefined()
          expect(owner.group, `${q.id}: ${c.label}`).not.toBe(entry.group)
        }
      }
    }
  })

  it('instrument questions ask for the family, and every family offered is a real, different one', () => {
    for (const q of many(vocabTermGenerator, 400, 2, ['instruments'])) {
      expect(q.prompt).toMatch(/^Which family does the .+ belong to\?$/)
      const labels = choicesOf(q).map((c) => c.label)
      for (const l of labels) expect(['woodwind', 'brass', 'string', 'percussion']).toContain(l)
      expect(new Set(labels).size).toBe(4)
    }
    for (const q of many(vocabMeaningGenerator, 200, 2, ['instruments'])) {
      expect(q.prompt).toMatch(/^Which of these instruments is in the .+ family\?$/)
    }
  })

  it('level 1 uses core terms only; level 2 adds further terms; level 3 adds the extras', () => {
    const levels = (level: Difficulty) => new Set(many(vocabTermGenerator, 800, level).map((q) => entryOf(q).entry.level))
    expect([...levels(1)]).toEqual([1])
    expect([...levels(2)].sort()).toEqual([1, 2])
    expect([...levels(3)].sort()).toEqual([1, 2, 3])
  })

  it('wrong answers also respect the level', () => {
    for (const q of many(vocabMeaningGenerator, 300, 1)) {
      const { category } = entryOf(q)
      for (const c of choicesOf(q)) {
        const owner = category.entries.find((e) => e.term === c.label)!
        expect(owner.level).toBe(1)
      }
    }
  })

  it('only uses the categories asked for, and uses all of them when none are asked for', () => {
    const only = new Set(many(vocabTermGenerator, 200, 2, ['tempo', 'dynamics']).map((q) => q.id.split(':')[1]))
    expect([...only].sort()).toEqual(['dynamics', 'tempo'])
    const all = new Set(many(vocabTermGenerator, 600, 2).map((q) => q.id.split(':')[1]))
    expect(all.size).toBe(8)
  })

  it('unknown category names fall back to everything instead of failing', () => {
    expect(() => many(vocabTermGenerator, 20, 1, ['cooking'])).not.toThrow()
    const ids = new Set(many(vocabTermGenerator, 400, 1, ['cooking']).map((q) => q.id.split(':')[1]))
    expect(ids.size).toBeGreaterThan(1)
  })

  it('explanations name similar terms, so near-synonyms are taught rather than hidden', () => {
    const q = many(vocabTermGenerator, 800, 2, ['tempo']).find((x) => entryOf(x).entry.term === 'Rallentando')!
    expect(q.explanation).toContain('Ritardando')
  })

  it('item ids look like type:category:term', () => {
    const q = vocabTermGenerator.generate(ctx(1, 2, ['instruments']))
    expect(q.id).toMatch(/^vocab-term:instruments:[a-z0-9-]+$/)
    expect(vocabMeaningGenerator.generate(ctx(1, 2)).id.startsWith('vocab-meaning:')).toBe(true)
    expect(slug('French horn')).toBe('french-horn')
    expect(slug('Più mosso')).toBe('piu-mosso')
    expect(slug('piano (p)')).toBe('piano-p')
  })

  it('every question is tagged for AQA checking', () => {
    for (const q of many(vocabTermGenerator, 100, 2)) expect(q.tags).toEqual(['aqa-candidate'])
  })
})
