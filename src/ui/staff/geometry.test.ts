import { describe, expect, it } from 'vitest'
import { type StaffGeometry, positionAtY, screenYToDrawingY } from './geometry'

// Staff lines 10 units apart: top line at y=60 ... bottom line at y=100.
const geo: StaffGeometry = { viewBox: { x: 0, y: 20, width: 160, height: 120 }, lineYs: [60, 70, 80, 90, 100] }
const range = [-7, 15] as const

describe('positionAtY', () => {
  it('maps each line and space to its position', () => {
    // bottom line 100 -> 0, then every 5 units up is one position
    for (let position = -7; position <= 15; position++) {
      expect(positionAtY(geo, 100 - position * 5, range)).toBe(position)
    }
  })

  it('picks the nearest position between two', () => {
    expect(positionAtY(geo, 100 - 1.9, range)).toBe(0)
    expect(positionAtY(geo, 100 - 2.6, range)).toBe(1)
    expect(positionAtY(geo, 100 - 7.4, range)).toBe(1)
    expect(positionAtY(geo, 100 - 7.6, range)).toBe(2)
  })

  it('keeps the answer within the allowed range', () => {
    expect(positionAtY(geo, -500, range)).toBe(15)
    expect(positionAtY(geo, 500, range)).toBe(-7)
    expect(positionAtY(geo, -500, [0, 8])).toBe(8)
  })

  it('copes with a different line gap', () => {
    const wide: StaffGeometry = { viewBox: geo.viewBox, lineYs: [0, 20, 40, 60, 80] }
    expect(positionAtY(wide, 80, range)).toBe(0)
    expect(positionAtY(wide, 0, range)).toBe(8)
    expect(positionAtY(wide, 50, range)).toBe(3)
  })
})

describe('screenYToDrawingY', () => {
  it('scales the screen position into drawing units', () => {
    // SVG shown 240px tall for 120 units: 2px per unit, top of the picture is unit 20.
    expect(screenYToDrawingY(geo, 300, { top: 300, height: 240 })).toBe(20)
    expect(screenYToDrawingY(geo, 540, { top: 300, height: 240 })).toBe(140)
    expect(screenYToDrawingY(geo, 420, { top: 300, height: 240 })).toBe(80)
  })
})
