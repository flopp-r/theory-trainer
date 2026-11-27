import { useEffect, useRef, useState } from 'react'
import { useLightTheme } from '../../progress/settings'
import type { StaffSpec } from '../../questions/types'
import { clefLabel } from '../../theory'
import { type StaffGeometry, positionAtY, screenYToDrawingY } from './geometry'

interface Props {
  staff: StaffSpec
  /** Ledger lines above and below the staff that notes may need. Sizes the picture. Default 3. */
  ledgerLines?: number
  /** Screen pixels per drawing unit. Bigger makes the staff bigger (up to the width of the screen). */
  scale?: number
  /** Leave room for at least this many items. */
  minItems?: number
  /** Keep full size and let the page scroll sideways instead of shrinking (for long runs of notes). */
  scroll?: boolean
  /** Called each time the staff has been drawn (used to start the answer timer). */
  onDrawn?: () => void
  /** Makes the staff tappable: called with the staff position under the finger (see theory/clef). */
  onTap?: (position: number) => void
  /** Lowest and highest position a tap may select. Default: the staff plus ledgerLines. */
  tapRange?: readonly [number, number]
  /** Describes the picture for screen readers. Must not give away the answer. */
  label?: string
}

/**
 * Draws a stave. VexFlow is loaded the first time this appears, so the home screen stays light.
 * The default text label names the clef but never the notes (that would give the answer away).
 */
export function StaffView({ staff, ledgerLines = 3, scale, minItems, scroll, onDrawn, onTap, tapRange, label }: Props) {
  const container = useRef<HTMLDivElement>(null)
  const geometry = useRef<StaffGeometry | null>(null)
  const [failed, setFailed] = useState(false)
  const onDrawnRef = useRef(onDrawn)
  onDrawnRef.current = onDrawn
  const specKey = JSON.stringify(staff)
  const light = useLightTheme()

  useEffect(() => {
    let cancelled = false
    const element = container.current
    if (!element) return
    const color = getComputedStyle(element).color
    import('./renderStaff')
      .then(async ({ drawStaff }) => {
        // Wait for the bundled music font so the clef and note heads are drawn with it.
        await document.fonts.ready
        if (cancelled) return
        geometry.current = drawStaff(element, staff, { color, ledgerLines, scale, minItems, noShrink: scroll })
        onDrawnRef.current?.()
      })
      .catch(() => {
        if (!cancelled) setFailed(true)
      })
    return () => {
      cancelled = true
    }
    // `staff` is covered by specKey.
  }, [specKey, ledgerLines, scale, minItems, scroll, light]) // eslint-disable-line

  function handleTap(event: React.MouseEvent<HTMLDivElement>) {
    const geo = geometry.current
    const svg = container.current?.querySelector('svg')
    if (!onTap || !geo || !svg) return
    const y = screenYToDrawingY(geo, event.clientY, svg.getBoundingClientRect())
    const range = tapRange ?? ([-(2 * ledgerLines + 1), 8 + 2 * ledgerLines + 1] as const)
    onTap(positionAtY(geo, y, range))
  }

  return (
    <div
      className={`staff${onTap ? ' tappable' : ''}${scroll ? ' scrolls' : ''}`}
      role="img"
      aria-label={label ?? `${clefLabel(staff.clef)} staff`}
      onClick={onTap ? handleTap : undefined}
    >
      <div ref={container} className="staff-drawing" />
      {failed && <p className="staff-error">The music could not be drawn. Reload the page.</p>}
    </div>
  )
}
