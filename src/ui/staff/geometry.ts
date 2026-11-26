/** Where things are in a drawn staff, in drawing units. */
export interface StaffGeometry {
  readonly viewBox: { readonly x: number; readonly y: number; readonly width: number; readonly height: number }
  /** y of the five staff lines, top to bottom. */
  readonly lineYs: readonly number[]
}

/**
 * Turns a y coordinate (in drawing units) into a staff position: 0 = bottom line, 1 = first space ... 8 = top line.
 * Each position is half a line gap, so the nearest one wins. The result is kept within `range`.
 */
export function positionAtY(geometry: StaffGeometry, y: number, range: readonly [number, number]): number {
  const bottom = geometry.lineYs[4]
  const top = geometry.lineYs[0]
  if (bottom === undefined || top === undefined) throw new Error('Geometry has no staff lines')
  const halfGap = (bottom - top) / 8
  const position = Math.round((bottom - y) / halfGap)
  return Math.max(range[0], Math.min(range[1], position))
}

/** Converts a screen y (pixels) to drawing units for an SVG whose size on screen is `rect`. */
export function screenYToDrawingY(geometry: StaffGeometry, clientY: number, rect: { top: number; height: number }): number {
  return geometry.viewBox.y + ((clientY - rect.top) * geometry.viewBox.height) / rect.height
}
