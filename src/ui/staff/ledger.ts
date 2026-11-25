import type { StaffSpec } from '../../questions/types'
import { staffPlacement } from '../../theory'

/** The most ledger lines any note on the staff needs. Used to size the picture. */
export function neededLedgerLines(staff: StaffSpec): number {
  let most = 0
  for (const item of staff.items) {
    if (item.kind !== 'notes') continue
    for (const pitch of item.pitches) most = Math.max(most, staffPlacement(pitch, staff.clef).ledgerLines)
  }
  return most
}
