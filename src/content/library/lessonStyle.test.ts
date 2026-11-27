import { describe, expect, it } from 'vitest'
import { LESSONS } from '.'
import { plainText } from './inline'
import type { Block, LibraryLesson } from './types'

/**
 * The lesson style from docs/library.md ("Writing a lesson"), checked on every lesson.
 * Run one lesson with: npx vitest run src/content/library/lessonStyle.test.ts -t "<lesson id>"
 */
const words = (text: string) => text.trim().split(/\s+/).filter(Boolean).length

/** The text a reader reads as explanation: paragraphs, lists, method steps and notes (not tables or captions). */
function proseOf(block: Block): string[] {
  switch (block.type) {
    case 'p':
    case 'note':
      return [block.text]
    case 'list':
    case 'steps':
      return [...block.items]
    default:
      return []
  }
}

/** Everything written in the lesson outside its worked examples. */
function textOf(blocks: readonly Block[]): string[] {
  return blocks.flatMap((b) => {
    switch (b.type) {
      case 'p':
      case 'h':
      case 'note':
        return [b.text]
      case 'list':
      case 'steps':
        return [...b.items]
      case 'table':
        return [...b.head, ...b.rows.flat(), ...(b.caption ? [b.caption] : [])]
      case 'staff':
        return [b.caption]
      case 'terms':
        return b.terms.flatMap((t) => [t.term, t.meaning])
      default:
        return []
    }
  })
}

const BANNED: readonly [RegExp, string][] = [
  [/\bplain\b/i, '"plain": say "natural" (a note with no sharp or flat) and explain it'],
  [/anchor/i, '"anchor": say "the line the clef fixes"'],
  [/look at the picture/i, 'the filler "Look at the picture"'],
  [/✓/, 'a tick mark'],
  [/!(?!\w)/, 'an exclamation mark'],
  [/\bin this lesson\b/i, '"in this lesson"'],
  [/\byou will (learn|be able to)\b/i, '"you will learn / be able to"'],
  [/\bby the end\b/i, '"by the end"'],
]

export function lessonProblems(lesson: LibraryLesson): string[] {
  const problems: string[] = []
  const blocks = lesson.build()
  const isVocabulary = lesson.id === 'vocabulary'

  // 1. Words in this lesson: one list, near the top, with proper entries.
  const termBlocks = blocks.flatMap((b, i) => (b.type === 'terms' ? [{ at: i, terms: b.terms }] : []))
  if (termBlocks.length !== 1) problems.push(`needs exactly one "Words in this lesson" list (has ${termBlocks.length})`)
  const list = termBlocks[0]
  if (list) {
    if (list.at > 5) problems.push('the "Words in this lesson" list should come within the first few blocks')
    if (!isVocabulary && (list.terms.length < 3 || list.terms.length > 16)) problems.push(`"Words in this lesson" should have 3 to 16 words (has ${list.terms.length})`)
    const everything = plainText(textOf(blocks.filter((b) => b.type !== 'terms')).join(' ')).toLowerCase()
    const workedText = blocks
      .flatMap((b) => (b.type === 'worked' ? [b.example.task, b.example.answer, ...b.example.steps.flatMap((s) => [s.title, s.text, s.result])] : []))
      .join(' ')
      .toLowerCase()
    for (const t of list.terms) {
      if (t.term.endsWith('.')) problems.push(`word "${t.term}" ends with a full stop`)
      if (!t.meaning.endsWith('.')) problems.push(`meaning of "${t.term}" should be a sentence ending with a full stop`)
      if (words(t.meaning) > 30) problems.push(`meaning of "${t.term}" is over 30 words`)
      const name = plainText(t.term).replace(/\s*\(.*\)\s*/g, '').trim().toLowerCase()
      if (!everything.includes(name) && !workedText.includes(name)) problems.push(`word "${t.term}" is not used anywhere in the lesson`)
    }
    // the same word must not be defined twice
    const seen = new Set<string>()
    for (const t of list.terms) {
      const key = plainText(t.term).toLowerCase()
      if (seen.has(key)) problems.push(`word "${t.term}" is listed twice`)
      seen.add(key)
    }
  }

  // 2. The old repeated block is gone.
  for (const b of blocks) if (b.type === 'h' && /what you need to know first/i.test(b.text)) problems.push('the "What you need to know first" block is replaced by "Words in this lesson"')

  // 3. The opening says something about music in its first paragraph, with no filler.
  const first = blocks.find((b) => b.type === 'p')
  if (first && first.type === 'p' && words(plainText(first.text)) < 12) problems.push('the first paragraph is too short to explain what the lesson is about')

  // 4. Banned phrases, anywhere in the lesson text.
  for (const text of textOf(blocks)) {
    for (const [pattern, what] of BANNED) if (pattern.test(plainText(text))) problems.push(`${what}: "${plainText(text).slice(0, 70)}…"`)
  }

  // 5. Bold is for the word being defined, not for emphasis everywhere: at most one bold phrase per 30 words of prose.
  const prose = blocks.flatMap(proseOf)
  const total = words(plainText(prose.join(' ')))
  const bold = prose.reduce((n, t) => n + (t.match(/\*\*[^*]+\*\*/g)?.length ?? 0), 0)
  if (!isVocabulary && total > 0 && bold > Math.ceil(total / 30)) problems.push(`too much bold: ${bold} bold phrases in ${total} words (limit ${Math.ceil(total / 30)})`)

  // 6. Mistake boxes: a bold lead, then a concrete wrong-then-right comparison, in a sentence or two.
  for (const b of blocks) {
    if (b.type !== 'note' || b.kind !== 'watch') continue
    if (!/^\*\*[^*]+\*\*/.test(b.text)) problems.push(`a "Watch out" box should start with a bold name for the mistake: "${plainText(b.text).slice(0, 50)}…"`)
    if (words(plainText(b.text)) > 70) problems.push(`a "Watch out" box is over 70 words: "${plainText(b.text).slice(0, 50)}…"`)
  }
  const watchCount = blocks.filter((b) => b.type === 'note' && b.kind === 'watch').length
  if (!isVocabulary && (watchCount < 2 || watchCount > 4)) problems.push(`a lesson should have 2 to 4 "Watch out" boxes (has ${watchCount})`)

  return problems
}

describe.each(LESSONS.map((l) => [l.id, l] as const))('lesson text in %s', (_id, lesson) => {
  it('follows the lesson style', () => {
    expect(lessonProblems(lesson)).toEqual([])
  })
})
