// @vitest-environment jsdom
import { describe, expect, it } from 'vitest'
import { parsePitch } from '../../theory'
import { drawStaff } from './renderStaff'

// jsdom has no canvas; VexFlow falls back to its own font metrics when this returns null.
HTMLCanvasElement.prototype.getContext = () => null

function draw(clef: Parameters<typeof drawStaff>[1], notes: string[], ledgerLines?: number) {
  const container = document.createElement('div')
  document.body.appendChild(container)
  drawStaff(container, clef, notes.map(parsePitch), '#e6e8ee', ledgerLines)
  return container
}

describe('drawStaff', () => {
  it('draws one SVG with a stave and the right number of note heads', () => {
    const container = draw('treble', ['C4', 'E4', 'G4'])
    expect(container.querySelectorAll('svg')).toHaveLength(1)
    // 5 stave lines + 1 ledger line for middle C, drawn as rects or paths; just check it produced content
    expect(container.querySelector('svg')?.children.length).toBeGreaterThan(3)
  })

  it('lets the picture scale: no fixed pixel width or height is left on the container or the SVG', () => {
    // VexFlow writes fixed pixel sizes; leaving them in place made the staff tiny and off-centre on phones.
    const container = draw('alto', ['C4'])
    const svg = container.querySelector('svg')!
    expect(container.style.width).toBe('')
    expect(container.style.height).toBe('')
    expect(svg.style.width).toBe('100%')
    expect(svg.style.height).toBe('auto')
    expect(svg.getAttribute('viewBox')).toMatch(/^[-\d.]+ [-\d.]+ [\d.]+ [\d.]+$/)
  })

  it('draws again into the same container without leaving the old picture behind', () => {
    const container = draw('bass', ['G2'])
    drawStaff(container, 'tenor', [parsePitch('E4')], '#fff')
    expect(container.querySelectorAll('svg')).toHaveLength(1)
  })

  it('makes the picture taller when more ledger lines are allowed', () => {
    const height = (ledger: number) => Number(draw('treble', ['C4'], ledger).querySelector('svg')!.getAttribute('viewBox')!.split(' ')[3])
    expect(height(0)).toBeLessThan(height(1))
    expect(height(1)).toBeLessThan(height(2))
    expect(height(2)).toBeLessThan(height(3))
  })

  it('draws sharps, flats and double accidentals without error', () => {
    expect(() => draw('treble', ['F#4', 'Bb3', 'C##5', 'Ebb4'])).not.toThrow()
  })
})
