// @vitest-environment jsdom
import { describe, expect, it } from 'vitest'
import { CLEF_NAMES, type ClefName } from '../../theory'
import { GENERATORS } from '../../questions/registry'
import { createRng } from '../../questions/rng'
import type { Difficulty } from '../../questions/types'
import { neededLedgerLines } from './ledger'
import { drawStaff } from './renderStaff'

// jsdom has no canvas; VexFlow falls back to its own font metrics when this returns null.
HTMLCanvasElement.prototype.getContext = () => null

/** Draws every staff of every kind of question, so a question that VexFlow cannot draw is found here, not on a phone. */
describe('every question can be drawn', () => {
  const clefSets: ClefName[][] = [['treble'], ['bass'], ['alto'], ['tenor'], [...CLEF_NAMES]]
  it('draws every staff of every question type at every level and clef choice', () => {
    let drawn = 0
    for (const g of GENERATORS) {
      for (const level of [1, 2, 3] as Difficulty[]) {
        for (const clefs of clefSets) {
          for (let seed = 0; seed < 4; seed++) {
            const q = g.generate({ rng: createRng(seed * 101 + level), clefs, difficulty: level, maxLedgerLines: 2 })
            for (const staff of [...(q.notation?.staves ?? []), ...(q.reveal?.staves ?? [])]) {
              const container = document.createElement('div')
              const geometry = drawStaff(container, staff, { color: '#fff', ledgerLines: Math.max(2, neededLedgerLines(staff)) })
              expect(container.querySelector('svg'), `${q.id}`).not.toBeNull()
              expect(geometry.lineYs).toHaveLength(5)
              drawn++
            }
          }
        }
      }
    }
    expect(drawn).toBeGreaterThan(1000)
  })
})
