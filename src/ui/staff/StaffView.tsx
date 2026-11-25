import { useEffect, useRef, useState } from 'react'
import type { ClefName, Pitch } from '../../theory'
import { clefLabel, formatPitch } from '../../theory'

interface Props {
  clef: ClefName
  notes: readonly Pitch[]
  /** Ledger lines above and below the staff that notes may need. Sizes the picture. Default 3. */
  ledgerLines?: number
  /** Called each time the staff has been drawn (used to start the answer timer). */
  onDrawn?: () => void
}

/**
 * Draws notes on a staff. VexFlow is loaded the first time this appears, so the home screen stays light.
 * The picture's text label says which clef it is but never names the notes (that would give the answer away).
 */
export function StaffView({ clef, notes, ledgerLines = 3, onDrawn }: Props) {
  const container = useRef<HTMLDivElement>(null)
  const [failed, setFailed] = useState(false)
  const notesKey = notes.map((n) => formatPitch(n)).join(' ')
  const onDrawnRef = useRef(onDrawn)
  onDrawnRef.current = onDrawn

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
        drawStaff(element, clef, notes, color, ledgerLines)
        onDrawnRef.current?.()
      })
      .catch(() => {
        if (!cancelled) setFailed(true)
      })
    return () => {
      cancelled = true
    }
    // `notes` is covered by notesKey.
  }, [clef, notesKey, ledgerLines]) // eslint-disable-line

  return (
    <div className="staff" role="img" aria-label={`${clefLabel(clef)} with ${notes.length === 1 ? 'a note' : 'notes'}`}>
      <div ref={container} className="staff-drawing" />
      {failed && <p className="staff-error">The music could not be drawn. Reload the page.</p>}
    </div>
  )
}
