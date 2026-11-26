// @vitest-environment jsdom
import { describe, expect, it } from 'vitest'
import type { StaffSpec } from '../../questions/types'
import { parseKey, parsePitch, parseTimeSignature } from '../../theory'
import { drawStaff, resolveColor, vexKeySpec } from './renderStaff'

// jsdom has no canvas; VexFlow falls back to its own font metrics when this returns null.
HTMLCanvasElement.prototype.getContext = () => null

const notes = (...names: string[]) => ({ kind: 'notes' as const, pitches: names.map(parsePitch) })

function draw(spec: StaffSpec, ledgerLines?: number) {
  const container = document.createElement('div')
  document.body.appendChild(container)
  const geometry = drawStaff(container, spec, { color: '#e6e8ee', ledgerLines })
  return { container, geometry }
}

describe('drawStaff', () => {
  it('draws one SVG with content', () => {
    const { container } = draw({ clef: 'treble', items: [notes('C4'), notes('E4'), notes('G4')] })
    expect(container.querySelectorAll('svg')).toHaveLength(1)
    expect(container.querySelector('svg')?.children.length).toBeGreaterThan(3)
  })

  it('lets the picture scale: no fixed pixel width or height is left on the container or the SVG', () => {
    // VexFlow writes fixed pixel sizes; leaving them in place made the staff tiny and off-centre on phones.
    const { container } = draw({ clef: 'alto', items: [notes('C4')] })
    const svg = container.querySelector('svg')!
    expect(container.style.width).toBe('')
    expect(container.style.height).toBe('')
    expect(svg.style.width).toMatch(/^min\(100%, \d+px\)$/)
    expect(svg.style.height).toBe('auto')
    expect(svg.getAttribute('viewBox')).toMatch(/^[-\d.]+ [-\d.]+ [\d.]+ [\d.]+$/)
  })

  it('draws again into the same container without leaving the old picture behind', () => {
    const { container } = draw({ clef: 'bass', items: [notes('G2')] })
    drawStaff(container, { clef: 'tenor', items: [notes('E4')] }, { color: '#fff' })
    expect(container.querySelectorAll('svg')).toHaveLength(1)
  })

  it('makes the picture taller when more ledger lines are allowed', () => {
    const height = (ledger: number) =>
      draw({ clef: 'treble', items: [notes('C4')] }, ledger).geometry.viewBox.height
    expect(height(0)).toBeLessThan(height(1))
    expect(height(1)).toBeLessThan(height(2))
    expect(height(2)).toBeLessThan(height(3))
  })

  it('reports five evenly spaced staff lines inside the picture, top to bottom', () => {
    const { geometry } = draw({ clef: 'treble', items: [notes('C4')] }, 2)
    expect(geometry.lineYs).toHaveLength(5)
    for (let i = 1; i < 5; i++) expect(geometry.lineYs[i]! - geometry.lineYs[i - 1]!).toBeCloseTo(10, 5)
    const { y, height } = geometry.viewBox
    expect(geometry.lineYs[0]!).toBeGreaterThan(y)
    expect(geometry.lineYs[4]!).toBeLessThan(y + height)
  })

  it('makes room for the key and time signature', () => {
    const plain = draw({ clef: 'treble', items: [notes('C4')] }).geometry.viewBox.width
    const withKey = draw({ clef: 'treble', key: parseKey('Db major'), items: [notes('C4')] }).geometry.viewBox.width
    const withBoth = draw({ clef: 'treble', key: parseKey('Db major'), time: parseTimeSignature('6/8'), items: [notes('C4')] }).geometry.viewBox.width
    expect(withKey).toBeGreaterThan(plain)
    expect(withBoth).toBeGreaterThan(withKey)
  })

  it('draws every kind of item without error', () => {
    const items = [
      notes('F#4', 'A4', 'C#5'), // chord with accidental
      { kind: 'notes' as const, pitches: [parsePitch('B3')], duration: 'q' as const, dots: 1 },
      { kind: 'notes' as const, pitches: [parsePitch('E4')], duration: '8' as const, color: '#5eead4' },
      { kind: 'rest' as const, duration: 'h' as const },
      { kind: 'rest' as const, duration: '16' as const, dots: 2 },
      { kind: 'notes' as const, pitches: [parsePitch('C##5'), parsePitch('Ebb4')], duration: 'w' as const },
    ]
    for (const clef of ['treble', 'bass', 'alto', 'tenor'] as const) {
      expect(() => draw({ clef, key: parseKey('D major'), time: parseTimeSignature('3/4'), items })).not.toThrow()
    }
  })

  it('draws an empty staff (used for tap-to-place questions)', () => {
    const { container, geometry } = draw({ clef: 'alto', items: [] }, 2)
    expect(container.querySelector('svg')).not.toBeNull()
    expect(geometry.lineYs).toHaveLength(5)
  })

  it('draws a chord given in any order', () => {
    expect(() => draw({ clef: 'treble', items: [notes('G4', 'C4', 'E4')] })).not.toThrow()
  })
})

describe('vexKeySpec', () => {
  it('writes the names VexFlow expects', () => {
    expect(vexKeySpec(parseKey('D major'))).toBe('D')
    expect(vexKeySpec(parseKey('Bb major'))).toBe('Bb')
    expect(vexKeySpec(parseKey('F# minor'))).toBe('F#m')
    expect(vexKeySpec(parseKey('Eb minor'))).toBe('Ebm')
  })
})

describe('resolveColor', () => {
  it('leaves a plain colour alone', () => {
    expect(resolveColor('#5eead4', null)).toBe('#5eead4')
  })

  it('reads a theme variable from the page, and uses the fallback when it is not set', () => {
    const element = document.createElement('div')
    element.style.setProperty('--staff-good', '#8bd3a5')
    document.body.append(element)
    expect(resolveColor('var(--staff-good, #0f766e)', element)).toBe('#8bd3a5')
    expect(resolveColor('var(--not-set, #0f766e)', element)).toBe('#0f766e')
    expect(resolveColor('var(--not-set)', null)).toBe('currentColor')
    element.remove()
  })
})
