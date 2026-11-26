import type { AudioSpec } from '../../../audio/types'
import type { StaffSpec } from '../../../questions/types'
import type { ClefName, Key, Pitch } from '../../../theory'
import type { Block, ListenItem, PractiseLink, WorkedExample } from '../types'

/** Small helpers for writing lessons. Each returns one Block. */
export const p = (text: string): Block => ({ type: 'p', text })
export const h = (text: string): Block => ({ type: 'h', text })
export const list = (...items: string[]): Block => ({ type: 'list', items })
export const steps = (...items: string[]): Block => ({ type: 'steps', items })
export const tip = (text: string): Block => ({ type: 'note', kind: 'tip', text })
export const watch = (text: string): Block => ({ type: 'note', kind: 'watch', text })
export const remember = (text: string): Block => ({ type: 'note', kind: 'remember', text })
export const table = (head: readonly string[], rows: readonly (readonly string[])[], caption?: string): Block => ({ type: 'table', head, rows, caption })
export const staffBlock = (staff: StaffSpec, caption: string): Block => ({ type: 'staff', staff, caption })
export const listenBlock = (label: string, audio: AudioSpec): Block => ({ type: 'listen', item: { label, audio } })
export const worked = (example: WorkedExample): Block => ({ type: 'worked', example })
export const practise = (link: PractiseLink): Block => ({ type: 'practise', link })

/** A picture: one note per item, in one clef, optionally with a key signature. */
export function notesOnStaff(clef: ClefName, pitches: readonly Pitch[], key?: Key): StaffSpec {
  return { clef, key, items: pitches.map((pitch) => ({ kind: 'notes' as const, pitches: [pitch] })) }
}

/** A picture of chords: each group of pitches is one chord. */
export function chordsOnStaff(clef: ClefName, chords: readonly (readonly Pitch[])[], key?: Key): StaffSpec {
  return { clef, key, items: chords.map((pitches) => ({ kind: 'notes' as const, pitches })) }
}

/** A picture of a clef (and optionally a key signature) with nothing written on it. */
export function emptyStaff(clef: ClefName, key?: Key): StaffSpec {
  return { clef, key, items: [] }
}

export function listenItem(label: string, audio: AudioSpec): ListenItem {
  return { label, audio }
}
