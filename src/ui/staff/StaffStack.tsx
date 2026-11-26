import { useRef } from 'react'
import type { NotationSpec } from '../../questions/types'
import { neededLedgerLines } from './ledger'
import { StaffView } from './StaffView'

/** Draws every stave of a question, top to bottom. `onDrawn` is called once each stave is drawn. */
export function StaffStack({
  notation,
  ledgerLines,
  scroll,
  onDrawn,
}: {
  notation: NotationSpec
  /** Minimum ledger lines to leave room for. Each stave grows if its notes need more. Default 1. */
  ledgerLines?: number
  /** Keep long pictures full size and let them scroll sideways. */
  scroll?: boolean
  onDrawn?: () => void
}) {
  // Each stave reports when it is drawn; `onDrawn` fires once all of them have been.
  const total = notation.staves.length
  const drawn = useRef(new Set<number>())
  return (
    <div className="staff-stack">
      {notation.staves.map((staff, index) => (
        <StaffView
          key={index}
          staff={staff}
          // Several staves share one screen, so each is sized to what it needs and drawn a little smaller.
          ledgerLines={total > 1 ? neededLedgerLines(staff) : Math.max(ledgerLines ?? 1, neededLedgerLines(staff))}
          scale={total > 1 ? 1.2 : scroll ? 1.5 : 3.2}
          scroll={scroll}
          label={total > 1 ? `Staff ${index + 1} of ${total}, ${staff.clef} clef` : undefined}
          onDrawn={() => {
            drawn.current.add(index)
            if (drawn.current.size === total) onDrawn?.()
          }}
        />
      ))}
    </div>
  )
}
