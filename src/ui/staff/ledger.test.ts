import { describe, expect, it } from 'vitest'
import type { StaffSpec } from '../../questions/types'
import { parsePitch } from '../../theory'
import { neededLedgerLines } from './ledger'

const staff = (clef: StaffSpec['clef'], ...groups: string[][]): StaffSpec => ({
  clef,
  items: groups.map((g) => ({ kind: 'notes' as const, pitches: g.map(parsePitch) })),
})

describe('neededLedgerLines', () => {
  it('is 0 for notes on or next to the staff', () => {
    expect(neededLedgerLines(staff('treble', ['E4'], ['F5'], ['D4'], ['G5']))).toBe(0)
  })
  it('counts ledger lines above and below, and takes the largest', () => {
    expect(neededLedgerLines(staff('treble', ['C4']))).toBe(1)
    expect(neededLedgerLines(staff('treble', ['A3'], ['C4']))).toBe(2)
    expect(neededLedgerLines(staff('treble', ['E4'], ['C6']))).toBe(2)
    expect(neededLedgerLines(staff('bass', ['C4'], ['E2']))).toBe(1)
  })
  it('looks inside chords and ignores rests', () => {
    expect(neededLedgerLines(staff('treble', ['A3', 'C4', 'E4']))).toBe(2)
    expect(neededLedgerLines({ clef: 'treble', items: [{ kind: 'rest', duration: 'q' }] })).toBe(0)
    expect(neededLedgerLines({ clef: 'alto', items: [] })).toBe(0)
  })
})
