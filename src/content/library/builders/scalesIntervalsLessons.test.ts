// @vitest-environment jsdom
import { describe, expect, it } from 'vitest'
import type { StaffSpec } from '../../../questions/types'
import { DEGREE_NAMES, MAJOR_FIFTHS, MAJOR_SCALES, MINOR_FIFTHS, NATURAL_MINOR_SCALES, ascii } from '../../../questions/handTables'
import { neededLedgerLines } from '../../../ui/staff/ledger'
import { drawStaff } from '../../../ui/staff/renderStaff'
import { LESSON_ORDER, lessonById } from '../index'
import type { Block } from '../types'

// jsdom has no canvas; VexFlow falls back to its own font metrics when this returns null.
HTMLCanvasElement.prototype.getContext = () => null

const IDS = ['minor-scales', 'pentatonic-blues', 'key-signatures', 'related-keys', 'scale-degrees', 'intervals'] as const

const blocksOf = (id: string): readonly Block[] => lessonById(id)!.build()
const tableByCaption = (id: string, caption: RegExp) => {
  const block = blocksOf(id).find((b) => b.type === 'table' && b.caption !== undefined && caption.test(b.caption))
  if (!block || block.type !== 'table') throw new Error(`No table matching ${caption} in ${id}`)
  return block
}

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
      return [block.example.title, block.example.task, block.example.answer, ...block.example.steps.map((s) => s.text)]
  }
}

function staffsOf(block: Block): StaffSpec[] {
  if (block.type === 'staff') return [block.staff]
  if (block.type === 'worked') return block.example.steps.flatMap((s) => (s.staff ? [s.staff] : []))
  return []
}

describe('the scales, keys and intervals lessons', () => {
  it('are the six lessons, with the fixed ids, group, order and links', () => {
    const expected: Record<string, { group: string; before: string[]; covers: string[] }> = {
      'minor-scales': { group: 'scales-keys', before: ['major-scales'], covers: ['scale-spelling'] },
      'pentatonic-blues': { group: 'scales-keys', before: ['minor-scales'], covers: ['scale-spelling'] },
      'key-signatures': { group: 'scales-keys', before: ['minor-scales'], covers: ['key-from-signature', 'signature-from-key'] },
      'related-keys': { group: 'scales-keys', before: ['key-signatures'], covers: ['relative-key'] },
      'scale-degrees': { group: 'scales-keys', before: ['major-scales'], covers: ['scale-degree'] },
      intervals: { group: 'intervals', before: ['accidentals', 'major-scales'], covers: ['interval-on-staff', 'interval-above'] },
    }
    for (const id of IDS) {
      const lesson = lessonById(id)!
      expect(lesson, id).toBeDefined()
      expect(lesson.group, id).toBe(expected[id]!.group)
      expect([...(lesson.before ?? [])], id).toEqual(expected[id]!.before)
      expect([...lesson.covers], id).toEqual(expected[id]!.covers)
    }
    // reading order is the fixed one
    expect(IDS.map((id) => LESSON_ORDER.indexOf(id))).toEqual(IDS.map((id) => LESSON_ORDER.indexOf(id)).sort((a, b) => a - b))
  })

  it('have the lesson shape: an opening, a "Words in this lesson" list, facts, "The method", worked examples, common mistakes, "Try it"', () => {
    for (const id of IDS) {
      const blocks = blocksOf(id)
      const headings = blocks.flatMap((b) => (b.type === 'h' ? [b.text] : []))
      expect(blocks[0]!.type, id).toBe('p')
      expect(headings, id).not.toContain('What you need to know first')
      expect(blocks.filter((b) => b.type === 'terms'), `${id} has one words list`).toHaveLength(1)
      expect(headings.some((h) => h.startsWith('The facts')), id).toBe(true)
      expect(headings.some((h) => h.startsWith('The method')), id).toBe(true)
      expect(headings.some((h) => h.startsWith('Worked example')), id).toBe(true)
      expect(headings, id).toContain('Common mistakes')
      expect(headings.at(-1), id).toBe('Try it')
      // in that order
      const at = (prefix: string) => headings.findIndex((h) => h.startsWith(prefix))
      expect(blocks.findIndex((b) => b.type === 'terms'), id).toBeLessThan(blocks.findIndex((b) => b.type === 'h'))
      expect(at('The facts'), id).toBeLessThan(at('The method'))
      expect(at('The method'), id).toBeLessThan(at('Worked example'))
      expect(at('Worked example'), id).toBeLessThan(at('Common mistakes'))
      expect(blocks.some((b) => b.type === 'steps'), `${id} has numbered steps`).toBe(true)
      expect(blocks.some((b) => b.type === 'note' && b.kind === 'remember'), `${id} has a remember box`).toBe(true)
      expect(blocks.filter((b) => b.type === 'note' && b.kind === 'watch').length, `${id} warns about mistakes`).toBeGreaterThanOrEqual(2)
    }
  })

  it('have at least as many worked examples as asked for, and staff pictures', () => {
    const needed: Record<string, number> = { 'minor-scales': 6, 'pentatonic-blues': 4, 'key-signatures': 7, 'related-keys': 5, 'scale-degrees': 4, intervals: 8 }
    for (const id of IDS) {
      const blocks = blocksOf(id)
      expect(blocks.filter((b) => b.type === 'worked').length, id).toBeGreaterThanOrEqual(needed[id]!)
      expect(blocks.flatMap(staffsOf).length, `${id} pictures`).toBeGreaterThan(0)
      expect(blocks.filter((b) => b.type === 'practise').length, `${id} practise links`).toBeGreaterThanOrEqual(1)
    }
  })

  it('draw every staff picture (so VexFlow can draw it on a phone)', () => {
    let drawn = 0
    for (const id of IDS) {
      for (const block of blocksOf(id)) {
        for (const staff of staffsOf(block)) {
          const container = document.createElement('div')
          const geometry = drawStaff(container, staff, { color: '#fff', ledgerLines: Math.max(2, neededLedgerLines(staff)) })
          expect(container.querySelector('svg'), id).not.toBeNull()
          expect(geometry.lineYs, id).toHaveLength(5)
          drawn++
        }
      }
    }
    expect(drawn).toBeGreaterThan(60)
  })

  it('never type # or b as a sharp or flat in prose, and use UK spelling', () => {
    for (const id of IDS) {
      for (const block of blocksOf(id)) {
        for (const t of textsOf(block)) {
          expect(t, `${id}: ${t.slice(0, 50)}`).not.toMatch(/\b[A-G]#/)
          expect(t, `${id}: ${t.slice(0, 50)}`).not.toMatch(/\b[A-G]b(?![a-z])/)
          expect(t, id).not.toMatch(/\b(color|colors|quarter note|half note)\b/i)
        }
      }
    }
  })

  it('never describe where key signature signs sit in alto or tenor clef in words', () => {
    for (const id of IDS) {
      for (const block of blocksOf(id)) {
        for (const t of textsOf(block)) {
          if (/alto|tenor/i.test(t)) expect(t, `${id}: ${t.slice(0, 60)}`).not.toMatch(/(top|bottom|middle|2nd|3rd|4th) (line|space)/)
        }
      }
    }
  })
})

describe('the tables in the lessons agree with the hand-written tables', () => {
  it('lists all 15 key signatures with the right major, minor and signs', () => {
    for (const id of ['key-signatures']) {
      const t = tableByCaption(id, /All 15 key signatures/)
      expect(t.rows).toHaveLength(15)
      for (const row of t.rows) {
        const major = Object.entries(MAJOR_FIFTHS).find(([k]) => ascii(row[1]!) === `${k} major`)!
        const minor = Object.entries(MINOR_FIFTHS).find(([k]) => ascii(row[2]!) === `${k} minor`)!
        expect(major[1], row[1]).toBe(minor[1])
        const n = Math.abs(major[1])
        expect(row[0]).toBe(n === 0 ? 'None' : `${n} ${major[1] > 0 ? 'sharp' : 'flat'}${n === 1 ? '' : 's'}`)
        const letters = (major[1] > 0 ? 'FCGDAEB' : 'BEADGCF').slice(0, n).split('')
        expect(ascii(row[3]!).replace('–', '')).toBe(letters.map((l) => l + (major[1] > 0 ? '#' : 'b')).join(' '))
      }
    }
  })

  it('has the order of sharps and flats', () => {
    const t = tableByCaption('key-signatures', /order of sharps and flats/)
    expect(t.rows[0]![1]!.replace(/\s+/g, '')).toBe('FCGDAEB')
    expect(t.rows[1]![1]!.replace(/\s+/g, '').slice(0, 7)).toBe('BEADGCF')
  })

  it('lists parallel keys only where both keys are standard, with signatures 3 places apart', () => {
    const t = tableByCaption('related-keys', /Parallel pairs/)
    expect(t.rows.length).toBe(12)
    for (const row of t.rows) {
      const tonic = ascii(row[0]!).replace(' major', '')
      expect(ascii(row[1]!)).toBe(`${tonic} minor`)
      expect(MINOR_FIFTHS[tonic], tonic).toBeDefined()
      expect(MINOR_FIFTHS[tonic]).toBe(MAJOR_FIFTHS[tonic]! - 3)
    }
    // the major keys left out are exactly the ones whose parallel minor is missing from the hand-written minor table
    const left = Object.keys(MAJOR_FIFTHS).filter((k) => MINOR_FIFTHS[k] === undefined || !t.rows.some((r) => ascii(r[0]!) === `${k} major`))
    expect(left.sort()).toEqual(['Cb', 'Db', 'Gb'])
    const warning = blocksOf('related-keys').find((b) => b.type === 'note' && b.kind === 'tip' && b.text.includes('do not exist'))!
    expect(textsOf(warning)[0]).toContain('D♭ major, G♭ major or C♭ major')
    expect(textsOf(warning)[0]).toContain('G♯ minor, D♯ minor or A♯ minor')
  })

  it('lists the intervals with the right semitones', () => {
    const t = tableByCaption('intervals', /intervals to know/)
    const hand: [string, string, string][] = [
      ['minor 2nd', 'm2', '1'], ['major 2nd', 'M2', '2'], ['minor 3rd', 'm3', '3'], ['major 3rd', 'M3', '4'], ['perfect 4th', 'P4', '5'],
      ['augmented 4th', 'A4', '6'], ['diminished 5th', 'd5', '6'], ['perfect 5th', 'P5', '7'], ['minor 6th', 'm6', '8'], ['major 6th', 'M6', '9'],
      ['minor 7th', 'm7', '10'], ['major 7th', 'M7', '11'], ['perfect octave', 'P8', '12'],
    ]
    expect(t.rows.map((r) => [...r])).toEqual(hand)
  })

  it('lists the white-note intervals above C and D with the right size and name', () => {
    const above = (id: RegExp, expected: string[][]) => expect(tableByCaption('intervals', id).rows.map((r) => [...r])).toEqual(expected)
    above(/above C\./, [
      ['C to D', '2', '2', 'major 2nd'], ['C to E', '3', '4', 'major 3rd'], ['C to F', '4', '5', 'perfect 4th'], ['C to G', '5', '7', 'perfect 5th'],
      ['C to A', '6', '9', 'major 6th'], ['C to B', '7', '11', 'major 7th'], ['C to the next C up', '8', '12', 'perfect octave'],
    ])
    above(/above D\./, [
      ['D to E', '2', '2', 'major 2nd'], ['D to F', '3', '3', 'minor 3rd'], ['D to G', '4', '5', 'perfect 4th'], ['D to A', '5', '7', 'perfect 5th'],
      ['D to B', '6', '9', 'major 6th'], ['D to C', '7', '10', 'minor 7th'], ['D to the next D up', '8', '12', 'perfect octave'],
    ])
  })

  it('lists the inversions: numbers add to 9, semitones add to 12', () => {
    const t = tableByCaption('intervals', /Inversions/)
    const hand = [
      ['minor 2nd (1)', 'major 7th (11)'], ['major 2nd (2)', 'minor 7th (10)'], ['minor 3rd (3)', 'major 6th (9)'],
      ['major 3rd (4)', 'minor 6th (8)'], ['perfect 4th (5)', 'perfect 5th (7)'], ['augmented 4th (6)', 'diminished 5th (6)'],
    ]
    expect(t.rows.map((r) => [...r])).toEqual(hand)
  })

  it('lists the scale degrees of D major and A natural minor', () => {
    const t = tableByCaption('scale-degrees', /Degree names/)
    const d = MAJOR_SCALES.D!.split(' ')
    const a = NATURAL_MINOR_SCALES.A!.split(' ')
    t.rows.forEach((row, i) => {
      expect(row[0]).toBe(String(i + 1))
      expect(row[1]).toContain(i === 6 ? 'leading note (major); subtonic (natural minor)' : DEGREE_NAMES[i]!)
      expect(ascii(row[2]!)).toBe(d[i])
      expect(ascii(row[3]!)).toBe(a[i])
    })
    expect(t.rows).toHaveLength(7)
  })

  it('lists four minor keys with their relative major and natural minor notes', () => {
    const t = tableByCaption('minor-scales', /Four minor keys/)
    const hand: [string, string, string][] = [
      ['A minor', 'C major', 'A B C D E F G'], ['E minor', 'G major', 'E F# G A B C D'], ['D minor', 'F major', 'D E F G A Bb C'], ['C minor', 'Eb major', 'C D Eb F G Ab Bb'],
    ]
    expect(t.rows.map((r) => r.map(ascii))).toEqual(hand)
  })

  it('shows C pentatonic and blues, with the blue note spelled Gb', () => {
    const t = tableByCaption('pentatonic-blues', /Each pentatonic scale/)
    expect(t.rows.map((r) => ascii(r[1]!))).toEqual(['C D E F G A B', 'C D E G A', 'C D Eb F G Ab Bb', 'C Eb F G Bb', 'C Eb F Gb G Bb'])
  })
})
