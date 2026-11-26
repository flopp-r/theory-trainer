import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { type AnswerResult } from '../../progress/sessionSummary'
import { DEFAULT_PRACTICE_CONFIG, type PracticeConfig } from './practiceConfig'
import { SessionSummaryView } from './SessionSummaryView'

const answer = (topic: string, correct: boolean, n: number): AnswerResult => ({
  itemId: `${topic}-${n}`,
  itemLabel: `${topic} item ${n}`,
  category: topic,
  correct,
  ms: 1000,
  topic,
})

const render = (results: AnswerResult[], config: PracticeConfig, previous = null as { at: number; setup: string; total: number; correct: number } | null) =>
  renderToStaticMarkup(createElement(SessionSummaryView, { results, config, previous, onAgain: () => {} }))

const mixed: PracticeConfig = { ...DEFAULT_PRACTICE_CONFIG, topics: ['notes', 'keys', 'ear'] }

describe('SessionSummaryView', () => {
  it('offers practice on the topics that were missed, when that is fewer than the topics chosen', () => {
    const results = [
      ...Array.from({ length: 4 }, (_, i) => answer('notes', true, i)),
      answer('keys', false, 0),
      answer('keys', true, 1),
      answer('ear', true, 0),
    ]
    const html = render(results, mixed)
    expect(html).toContain('Practise what you missed')
    expect(html).toContain('href="#/practice/play?topics=keys&amp;')
    // Change setup still keeps everything that was chosen.
    expect(html).toContain('href="#/practice?topics=notes,keys,ear&amp;')
    // Another round is then the secondary action.
    expect(html).toMatch(/<button[^>]*class="btn wide"[^>]*>Another round/)
  })

  it('does not offer it when every chosen topic was missed, or nothing was', () => {
    const allMissed = [answer('notes', false, 0), answer('keys', false, 0), answer('ear', false, 0)]
    expect(render(allMissed, mixed)).not.toContain('Practise what you missed')
    const none = Array.from({ length: 6 }, (_, i) => answer('notes', true, i))
    const html = render(none, mixed)
    expect(html).not.toContain('Practise what you missed')
    expect(html).toMatch(/class="btn wide primary"[^>]*>Another round/)
  })

  it('shows the verdict and the comparison with the last round', () => {
    const results = Array.from({ length: 10 }, (_, i) => answer('notes', i < 8, i))
    const html = render(results, DEFAULT_PRACTICE_CONFIG, { at: 1, setup: 'x', total: 10, correct: 5 })
    expect(html).toContain('8 / 10')
    expect(html).toContain('Good round.')
    expect(html).toContain('Up from 5 / 10 last time.')
  })

  it('uses plain headings', () => {
    const results = [answer('notes', false, 0), answer('keys', true, 0)]
    const html = render(results, mixed)
    expect(html).toContain('By area')
    expect(html).toContain('To revisit')
    expect(html).not.toContain('By clef')
  })
})
