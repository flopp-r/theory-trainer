// @vitest-environment jsdom
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { beforeEach, describe, expect, it } from 'vitest'
import { recordSession, resetHistoryCache } from '../progress/history'
import { recordAnswer, resetMasteryCache } from '../progress/mastery'
import { ProgressScreen, areaStatus } from './ProgressScreen'

beforeEach(() => {
  localStorage.clear()
  resetMasteryCache()
  resetHistoryCache()
})

const render = () => renderToStaticMarkup(createElement(ProgressScreen))

describe('ProgressScreen', () => {
  it('explains itself when nothing has been answered yet', () => {
    expect(render()).toContain('Nothing yet')
  })

  it('shows what is due, each area with its recent score, and recent rounds', () => {
    for (let i = 0; i < 6; i++) recordAnswer({ itemId: `place-note:bass:E${i}`, type: 'place-note', topic: 'notes', label: `E${i} in bass clef`, correct: i < 2 }, 0)
    recordSession({ at: Date.UTC(2026, 10, 27), setup: 'topics=notes&clefs=treble,bass&ledger=1&level=2', total: 10, correct: 7 })
    const html = render()
    expect(html).toContain('due for review')
    expect(html).toContain('Revise your weak spots')
    expect(html).toContain('E2 in bass clef')
    expect(html).toContain('Placing notes')
    expect(html).toContain('2 of the last 6 right · Needs work')
    expect(html).toContain('href="#/practice/play?topics=notes&amp;clefs=treble,bass&amp;ledger=1&amp;level=2&amp;types=place-note"')
    expect(html).toContain('Treble and bass notes')
    expect(html).toContain('7 / 10')
  })
})

describe('areaStatus', () => {
  const area = (right: number, of: number) => ({ type: 't', topic: 'notes', answered: of, correct: right, recent: Array.from({ length: of }, (_, i) => i < right) })
  it('names how an area is going', () => {
    expect(areaStatus(area(9, 10))).toBe('Strong')
    expect(areaStatus(area(7, 10))).toBe('Getting there')
    expect(areaStatus(area(3, 10))).toBe('Needs work')
    expect(areaStatus(area(1, 2))).toBe('Too early to tell')
  })
})
