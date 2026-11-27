import { describe, expect, it } from 'vitest'
import { VOCABULARY } from '../../vocabulary'
import { plainText } from '../inline'
import type { Block } from '../types'
import { CHORDS_EAR_LESSONS } from './c-chords-ear'

const ids = CHORDS_EAR_LESSONS.map((l) => l.id)
const lesson = (id: string) => CHORDS_EAR_LESSONS.find((l) => l.id === id)!
const workedIn = (id: string) => lesson(id).build().filter((b): b is Extract<Block, { type: 'worked' }> => b.type === 'worked')

function textsOf(block: Block): string[] {
  switch (block.type) {
    case 'p':
    case 'h':
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
    case 'terms':
      return block.terms.flatMap((t) => [t.term, t.meaning])
    case 'worked':
      return [
        block.example.title,
        block.example.task,
        block.example.answer,
        ...block.example.steps.flatMap((s) => [s.title ?? '', s.text, s.result ?? '']),
        ...(block.example.terms ?? []).flatMap((t) => [t.term, t.meaning]),
      ]
  }
}

describe('the chords, cadences, vocabulary and ear lessons', () => {
  it('are the seven lessons, in order, in the right groups', () => {
    expect(ids).toEqual(['triads', 'seventh-chords', 'inversions-chord-symbols', 'roman-numerals', 'cadences', 'vocabulary', 'ear-training'])
    expect(CHORDS_EAR_LESSONS.map((l) => l.group)).toEqual(['chords', 'chords', 'chords', 'chords', 'cadences', 'vocabulary', 'ear'])
  })

  it('name the lessons to read first and the question types they cover', () => {
    expect(lesson('triads').before).toEqual(['intervals'])
    expect(lesson('seventh-chords').before).toEqual(['triads'])
    expect(lesson('inversions-chord-symbols').before).toEqual(['seventh-chords'])
    expect(lesson('roman-numerals').before).toEqual(['inversions-chord-symbols', 'key-signatures'])
    expect(lesson('cadences').before).toEqual(['roman-numerals'])
    expect(lesson('ear-training').before).toEqual(['cadences', 'inversions-chord-symbols'])
    expect(lesson('triads').covers).toEqual(['triad-on-staff', 'chord-notes'])
    expect(lesson('seventh-chords').covers).toEqual(['seventh-on-staff'])
    expect(lesson('inversions-chord-symbols').covers).toEqual(['inversion', 'chord-symbol'])
    expect(lesson('roman-numerals').covers).toEqual(['roman-numeral'])
    expect(lesson('cadences').covers).toEqual(['cadence-on-staff', 'cadence-by-name'])
    expect(lesson('vocabulary').covers).toEqual(['vocab-term', 'vocab-meaning'])
    expect(lesson('ear-training').covers).toEqual(['ear-chord-quality', 'ear-interval', 'ear-cadence', 'ear-inversion'])
  })

  it('have as many worked examples as the plan asks for', () => {
    expect(workedIn('triads').length).toBeGreaterThanOrEqual(7)
    expect(workedIn('seventh-chords').length).toBeGreaterThanOrEqual(6)
    expect(workedIn('inversions-chord-symbols').length).toBeGreaterThanOrEqual(7)
    expect(workedIn('roman-numerals').length).toBeGreaterThanOrEqual(8)
    expect(workedIn('cadences').length).toBeGreaterThanOrEqual(6)
    expect(workedIn('ear-training').length).toBeGreaterThanOrEqual(1)
  })

  it('end every worked example with a check', () => {
    for (const l of CHORDS_EAR_LESSONS) {
      for (const b of l.build()) {
        if (b.type !== 'worked') continue
        expect(b.example.steps.at(-1)!.title?.startsWith('Check another way'), `${l.id}: ${b.example.title}`).toBe(true)
      }
    }
  })

  it('write sharps and flats with the proper signs, never typed as # or b after a note letter', () => {
    for (const l of CHORDS_EAR_LESSONS) {
      for (const b of l.build()) {
        for (const t of textsOf(b)) {
          const text = plainText(t)
          expect(text, `${l.id}: ${text.slice(0, 60)}`).not.toMatch(/\b[A-G]#/)
          expect(text, `${l.id}: ${text.slice(0, 60)}`).not.toMatch(/\b[A-G]b\b/)
        }
      }
    }
  })

  it('put a picture and a sound in the worked examples that build or hear chords', () => {
    for (const id of ['triads', 'seventh-chords', 'inversions-chord-symbols', 'roman-numerals', 'cadences']) {
      for (const b of workedIn(id)) {
        expect(b.example.steps.some((s) => s.staff), `${id}: ${b.example.title}`).toBe(true)
        expect(b.example.steps.some((s) => s.listen), `${id}: ${b.example.title}`).toBe(true)
      }
    }
  })

  it('use UK spelling for the words most likely to slip', () => {
    for (const l of CHORDS_EAR_LESSONS) {
      for (const b of l.build()) {
        for (const t of textsOf(b)) expect(t, l.id).not.toMatch(/\b(color|practice(?= (it|the|your|each)\b)|quarter note|half note|whole note|eighth note)\b/i)
      }
    }
  })
})

describe('the vocabulary lesson is built from the vocabulary data', () => {
  const blocks = lesson('vocabulary').build()

  it('has a heading and a table for every category, in the data order', () => {
    const headings = blocks.filter((b) => b.type === 'h').map((b) => (b as { text: string }).text)
    let last = -1
    for (const c of VOCABULARY) {
      const at = headings.indexOf(c.label)
      expect(at, c.label).toBeGreaterThan(last)
      last = at
    }
    expect(blocks.filter((b) => b.type === 'table')).toHaveLength(VOCABULARY.length)
  })

  it('shows every term with its meaning, and marks the extra (level 3) terms', () => {
    const tables = blocks.filter((b): b is Extract<Block, { type: 'table' }> => b.type === 'table')
    VOCABULARY.forEach((category, i) => {
      const rows = tables[i]!.rows
      expect(rows).toHaveLength(category.entries.length)
      category.entries.forEach((e, r) => {
        expect(plainText(rows[r]![0]!)).toBe(e.level === 3 ? `${e.term} (extra)` : e.term)
        expect(rows[r]![1]).toBe(e.meaning)
      })
    })
  })

  it('says plainly that the list is the app\'s own and not an official list', () => {
    const text = blocks.flatMap(textsOf).join(' ')
    expect(text).toContain("the app's own list")
    expect(text).toContain('not treat it as an official list')
  })

  it('ends with the revision steps and a Practise link to vocabulary', () => {
    const last = blocks.filter((b) => b.type === 'practise') as Extract<Block, { type: 'practise' }>[]
    expect(last.length).toBeGreaterThan(0)
    for (const p of last) expect(p.link.topics).toEqual(['vocabulary'])
    expect(blocks.some((b) => b.type === 'h' && b.text === 'How to revise vocabulary')).toBe(true)
  })
})

describe('the ear training lesson', () => {
  it('links to the ear topic and gives a sound for every skill', () => {
    const blocks = lesson('ear-training').build()
    expect(blocks.filter((b) => b.type === 'practise').every((b) => b.type === 'practise' && b.link.topics.join() === 'ear')).toBe(true)
    const headings = blocks.filter((b) => b.type === 'h').map((b) => (b as { text: string }).text)
    for (const skill of ['Chord quality', 'Intervals', 'Cadences', 'Inversions']) expect(headings).toContain(skill)
    expect(blocks.filter((b) => b.type === 'listen').length).toBeGreaterThanOrEqual(20)
  })

  it('plays C major and C minor side by side with only the middle note changed (hand: C E G and C Eb G)', () => {
    const blocks = lesson('ear-training').build()
    const listens = blocks.filter((b): b is Extract<Block, { type: 'listen' }> => b.type === 'listen')
    const major = listens.find((b) => b.item.label === 'Hear C major')!
    const minor = listens.find((b) => b.item.label === 'Hear C minor')!
    const pcs = (b: typeof major) => [...b.item.audio.events[0]!.midi].map((m) => m % 12).sort((a, c) => a - c)
    expect(pcs(major)).toEqual([0, 4, 7])
    expect(pcs(minor)).toEqual([0, 3, 7])
  })
})
