import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { lessonForQuestionType } from '../../content/library'
import { type AnswerResult } from '../../progress/sessionSummary'
import { DEFAULT_PRACTICE_CONFIG, type PracticeConfig } from './practiceConfig'
import { SessionSummaryView } from './SessionSummaryView'

let n = 0
const answer = (type: string, correct: boolean, topic = 'notes'): AnswerResult => {
  n += 1
  return { itemId: `${type}-${n}`, itemLabel: `${type} item ${n}`, category: type, correct, ms: 1000, topic, type }
}

const render = (results: AnswerResult[], config: PracticeConfig = DEFAULT_PRACTICE_CONFIG, previous: { at: number; setup: string; total: number; correct: number } | null = null) =>
  renderToStaticMarkup(createElement(SessionSummaryView, { results, config, previous, onAgain: () => {} }))

describe('SessionSummaryView', () => {
  it('offers the weakest question type as the next round, even in a one-topic round', () => {
    const results = [...Array.from({ length: 4 }, () => answer('note-name', true)), answer('place-note', false), answer('place-note', false), answer('note-name', false)]
    const html = render(results)
    expect(html).toContain('Practise your weakest area')
    expect(html).toContain('Placing notes · 2 of 2 missed')
    expect(html).toContain('href="#/practice/play?topics=notes&amp;clefs=treble,bass&amp;ledger=1&amp;level=2&amp;types=place-note"')
    // Another round is then the secondary action.
    expect(html).toMatch(/<button[^>]*class="btn wide"[^>]*>Another round/)
  })

  it('does not offer it when the round was already only that area, or nothing was missed', () => {
    const already: PracticeConfig = { ...DEFAULT_PRACTICE_CONFIG, types: ['place-note'] }
    expect(render([answer('place-note', false)], already)).not.toContain('weakest area')
    const html = render(Array.from({ length: 6 }, () => answer('note-name', true)))
    expect(html).not.toContain('weakest area')
    expect(html).toMatch(/class="btn wide primary"[^>]*>Another round/)
    expect(html).not.toContain('To revisit')
  })

  it('groups what to revisit by the lesson that teaches it, with a button to read it', () => {
    const lesson = lessonForQuestionType('place-note')
    expect(lesson).toBeDefined()
    const html = render([answer('place-note', false), answer('place-note', false)])
    expect(html).toContain('To revisit')
    expect(html).toContain(`Read “${lesson!.title.replace(/&/g, '&amp;')}”`)
  })

  it('shows the verdict and the comparison, and no time per question', () => {
    const results = Array.from({ length: 10 }, (_, i) => answer('note-name', i < 8))
    const html = render(results, DEFAULT_PRACTICE_CONFIG, { at: 1, setup: 'x', total: 10, correct: 5 })
    expect(html).toContain('8 / 10')
    expect(html).toContain('Good round.')
    expect(html).toContain('Up from 5 / 10 last time.')
    expect(html).not.toContain('per question')
  })

  it('folds the per-area table away, weakest first', () => {
    const html = render([answer('note-name', true), answer('place-note', false)])
    expect(html).toMatch(/<details class="panel disclosure"><summary>By area<\/summary>/)
    expect(html.indexOf('place-note</span>')).toBeLessThan(html.indexOf('note-name</span>'))
  })
})
