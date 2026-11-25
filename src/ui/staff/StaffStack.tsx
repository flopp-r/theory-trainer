import { useRef } from 'react'
import type { NotationSpec } from '../../questions/types'
import { neededLedgerLines } from './ledger'
import { StaffView } from './StaffView'

/** Draws every stave of a question, top to bottom. `onDrawn` is called once each stave is drawn. */
export function StaffStack({
  notation,
  ledgerLines,
  onDrawn,
}: {
  notation: NotationSpec
  /** Minimum ledger lines to leave room for. Each stave grows if its notes need more. Default 1. */
  ledgerLines?: number
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
          ledgerLines={Math.max(ledgerLines ?? 1, neededLedgerLines(staff))}
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
