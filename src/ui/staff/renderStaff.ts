import { Accidental, Dot, Formatter, Renderer, Stave, StaveNote, type SVGContext, Voice } from 'vexflow/bravura'
import type { NotationItem, StaffSpec } from '../../questions/types'
import type { StaffGeometry } from './geometry'
import { type AccidentalSign, type Key, type Pitch, accidentalsToShow, comparePitches, diatonicStep, formatNote, pitchAtPosition } from '../../theory'

/** Drawing units. The SVG scales to fit its box, so these only set proportions. */
const ITEM_WIDTH = 62
const SIDE = 10
const STAVE_Y = 28

export interface DrawOptions {
  /** Colour of lines, clef, notes and text. */
  color: string
  /** How many ledger lines above and below must fit. Sizes the picture. Default 3. */
  ledgerLines?: number
  /** Screen pixels per drawing unit, before shrinking to fit the screen. Default 1.75. */
  scale?: number
  /** Leave room for at least this many items, even if fewer are drawn. */
  minItems?: number
}

/** VexFlow's name for a key: "D", "Bb", "F#m". */
export function vexKeySpec(key: Key): string {
  return formatNote(key.tonic) + (key.mode === 'minor' ? 'm' : '')
}

const DUR = { w: 'w', h: 'h', q: 'q', '8': '8', '16': '16' } as const

/** Pitches lowest first, which is the order VexFlow wants the keys of a chord in. */
function sortedPitches(pitches: readonly Pitch[]): Pitch[] {
  return [...pitches].sort((a, b) => diatonicStep(a) - diatonicStep(b) || comparePitches(a, b))
}

function addDots(note: StaveNote, dots: number | undefined): void {
  for (let i = 0; i < (dots ?? 0); i++) Dot.buildAndAttach([note], { all: true })
}

/**
 * Draws one stave into `container`, replacing what was there. Returns the geometry for hit-testing.
 * Accidentals are worked out from the key signature (see `accidentalsToShow`), not left to VexFlow.
 */
export function drawStaff(container: HTMLElement, spec: StaffSpec, options: DrawOptions): StaffGeometry {
  const { color, ledgerLines = 3, scale = 1.75, minItems = 1 } = options
  container.replaceChildren()

  const stave = new Stave(SIDE, STAVE_Y, 600)
  stave.addClef(spec.clef)
  if (spec.key) stave.addKeySignature(vexKeySpec(spec.key))
  if (spec.time) stave.addTimeSignature(`${spec.time.beats}/${spec.time.unit}`)
  const width = stave.getNoteStartX() + ITEM_WIDTH * Math.max(minItems, spec.items.length) + SIDE * 2
  stave.setWidth(width - SIDE * 2)

  // Crop to the staff plus room for the clef and the allowed ledger lines (10 units each).
  const room = Math.max(24, 10 * ledgerLines + 15)
  const top = stave.getYForLine(0) - room
  const height = stave.getYForLine(4) + room - top

  const renderer = new Renderer(container as HTMLDivElement, Renderer.Backends.SVG)
  renderer.resize(width, height)
  const context = renderer.getContext() as SVGContext // the SVG backend is chosen above
  context.setViewBox(0, top, width, height)
  context.setFillStyle(color)
  context.setStrokeStyle(color)
  stave.setContext(context).draw()

  if (spec.items.length > 0) {
    const groups = spec.items.map((item) => (item.kind === 'notes' ? sortedPitches(item.pitches) : []))
    const signs = accidentalsToShow(groups, spec.key ?? null)
    const restKey = pitchAtPosition(4, spec.clef) // rests sit on the middle line
    const notes = spec.items.map((item, i) => makeNote(item, groups[i] ?? [], signs[i] ?? [], spec, restKey, color, stave))
    const voice = new Voice({ numBeats: 4 * notes.length, beatValue: 4 })
    voice.setStrict(false)
    voice.addTickables(notes)
    new Formatter().joinVoices([voice]).format([voice], Math.max(20, ITEM_WIDTH * spec.items.length - 20))
    voice.draw(context, stave)
  }

  // VexFlow writes fixed pixel sizes on the container and the SVG. Remove them so the picture scales,
  // but never bigger than `scale` pixels per unit.
  container.style.removeProperty('width')
  container.style.removeProperty('height')
  const svg = container.querySelector('svg')
  if (svg) {
    svg.removeAttribute('height')
    svg.setAttribute('width', '100%')
    svg.style.width = `min(100%, ${Math.round(width * scale)}px)`
    svg.style.height = 'auto'
  }

  return { viewBox: { x: 0, y: top, width, height }, lineYs: [0, 1, 2, 3, 4].map((line) => stave.getYForLine(line)) }
}

function makeNote(
  item: NotationItem,
  pitches: readonly Pitch[],
  signs: readonly (AccidentalSign | null)[],
  spec: StaffSpec,
  restKey: Pitch,
  color: string,
  stave: Stave,
): StaveNote {
  const keyName = (p: Pitch) => `${p.letter.toLowerCase()}/${p.octave}`
  let note: StaveNote
  if (item.kind === 'rest') {
    note = new StaveNote({ keys: [keyName(restKey)], duration: `${DUR[item.duration]}r`, clef: spec.clef })
  } else {
    note = new StaveNote({ keys: pitches.map(keyName), duration: DUR[item.duration ?? 'w'], clef: spec.clef })
    signs.forEach((sign, index) => {
      if (sign) note.addModifier(new Accidental(sign), index)
    })
  }
  addDots(note, item.dots)

  // VexFlow draws ledger lines in a dim grey by default, which is hard to see on a dark background.
  const own = item.kind === 'notes' ? item.color : undefined
  const paint = own ?? color
  note.setLedgerLineStyle({ ...stave.getDefaultLedgerLineStyle(), strokeStyle: paint, fillStyle: paint })
  if (own) note.setStyle({ fillStyle: own, strokeStyle: own })
  return note
}

