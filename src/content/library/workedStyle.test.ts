import { describe, expect, it } from 'vitest'
import { LESSONS } from '.'
import type { WorkedExample } from './types'

/**
 * The worked example style from docs/library.md ("Worked examples: the format"), checked on every lesson.
 * Run one lesson with: npx vitest run src/content/library/workedStyle.test.ts -t "<lesson id>"
 */
const words = (text: string) => text.trim().split(/\s+/).filter(Boolean).length
const plain = (text: string) => text.replace(/\*\*?/g, '')
const BANNED: readonly [RegExp, string][] = [
  [/\bstep \d/i, '"Step N" inside a numbered step'],
  [/✓/, 'a tick mark'],
  [/look at the picture/i, 'the filler "Look at the picture"'],
  [/anchor note/i, '"anchor note" (not a musical term)'],
  [/\bplain\b/i, '"plain" (say "natural" and explain it)'],
  [/!/, 'an exclamation mark'],
]

export function styleProblems(example: WorkedExample): string[] {
  const problems: string[] = []
  const terms = example.terms ?? []
  if (terms.length < 2) problems.push('needs "Words you need" with 2 or more terms')
  const everything = plain([example.task, example.answer, ...example.steps.flatMap((s) => [s.title ?? '', s.text, s.result ?? ''])].join(' ')).toLowerCase()
  for (const t of terms) {
    if (t.term.endsWith('.')) problems.push(`term "${t.term}" ends with a full stop`)
    if (!t.meaning.endsWith('.')) problems.push(`meaning of "${t.term}" should be a sentence ending with a full stop`)
    if (words(t.meaning) > 30) problems.push(`meaning of "${t.term}" is over 30 words`)
    const name = plain(t.term).replace(/\s*\(.*\)\s*/g, '').trim().toLowerCase()
    if (!everything.includes(name)) problems.push(`term "${t.term}" is not used in the working`)
  }
  if (example.steps.length < 3) problems.push('needs at least 3 steps')
  example.steps.forEach((s, i) => {
    const n = `step ${i + 1}`
    if (!s.title) problems.push(`${n} has no title`)
    else {
      if (words(s.title) > 10) problems.push(`${n} title is over 10 words`)
      if (/[.!]$/.test(s.title)) problems.push(`${n} title ends with punctuation`)
    }
    if (words(plain(s.text)) > 55) problems.push(`${n} text is over 55 words (${words(plain(s.text))})`)
    if (!s.result) problems.push(`${n} has no result`)
    else {
      if (words(plain(s.result)) > 20) problems.push(`${n} result is over 20 words`)
      if (s.result.endsWith('.')) problems.push(`${n} result ends with a full stop`)
    }
    for (const field of [s.title ?? '', s.text, s.result ?? '']) {
      for (const [pattern, what] of BANNED) if (pattern.test(field)) problems.push(`${n} has ${what}`)
    }
  })
  const last = example.steps[example.steps.length - 1]
  if (!last?.title?.startsWith('Check')) problems.push('the last step should be a check, titled "Check …"')
  return problems
}

describe.each(LESSONS.filter((l) => l.build().some((b) => b.type === 'worked')).map((l) => [l.id, l] as const))('worked examples in %s', (_id, lesson) => {
  it('follow the worked example style', () => {
    const examples = lesson.build().flatMap((b) => (b.type === 'worked' ? [b.example] : []))
    const problems = examples.flatMap((ex) => styleProblems(ex).map((p) => `${ex.title}: ${p}`))
    expect(problems).toEqual([])
  })
})
