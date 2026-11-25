import { useState } from 'react'
import type { Question } from '../../questions/types'
import { pitchAtPosition } from '../../theory'
import { StaffView } from '../staff/StaffView'

const GOOD = '#5eead4'
const BAD = '#ff8a80'

/**
 * Tap the staff to place a note, nudge it with the arrows, then press Check.
 * After checking, the right place is drawn in green and a wrong guess in red.
 */
export function TapStaff({
  question,
  onSubmit,
  onDrawn,
  submitted,
}: {
  question: Question
  onSubmit: (position: number) => void
  onDrawn: () => void
  /** The position that was submitted, or null while still answering. */
  submitted: number | null
}) {
  const input = question.input
  if (input.kind !== 'tap-staff') throw new Error('TapStaff needs a tap-staff question')
  const base = question.notation?.staves[0]
  if (!base) throw new Error('Tap question has no staff')
  const [selected, setSelected] = useState<number | null>(null)
  const range: [number, number] = [-(2 * input.ledgerLines + 1), 8 + 2 * input.ledgerLines + 1]
  const correct = Number(question.correct)
  const answered = submitted !== null

  const markers = answered
    ? [
        ...(submitted !== correct ? [{ position: submitted, color: BAD }] : []),
        { position: correct, color: GOOD },
      ]
    : selected !== null
      ? [{ position: selected, color: undefined }]
      : []
  const staff = {
    ...base,
    items: markers.map((m) => ({
      kind: 'notes' as const,
      pitches: [pitchAtPosition(m.position, input.clef)],
      ...(m.color ? { color: m.color } : {}),
    })),
  }

  const move = (delta: number) => setSelected((s) => Math.max(range[0], Math.min(range[1], (s ?? 4) + delta)))

  return (
    <div className="tap-area">
      <StaffView
        staff={staff}
        ledgerLines={input.ledgerLines}
        scale={2.4}
        minItems={1}
        onDrawn={onDrawn}
        onTap={answered ? undefined : setSelected}
        tapRange={range}
        label={`${input.clef} clef staff. Tap a line or space to place the note.`}
      />
      {!answered && (
        <div className="tap-controls">
          <button type="button" className="btn" onClick={() => move(1)} aria-label="Move the note up one step">
            ▲
          </button>
          <button type="button" className="btn" onClick={() => move(-1)} aria-label="Move the note down one step">
            ▼
          </button>
          <button type="button" className="btn primary" disabled={selected === null} onClick={() => selected !== null && onSubmit(selected)}>
            Check
          </button>
        </div>
      )}
    </div>
  )
}
