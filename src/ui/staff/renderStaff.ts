import { Accidental, Formatter, Renderer, Stave, StaveNote, type SVGContext, Voice } from 'vexflow/bravura'
import { type ClefName, type Pitch } from '../../theory'

/** Size of the drawing in VexFlow units. The SVG scales to fit its container. */
const NOTE_WIDTH = 80
const STAVE_Y = 28 // top of the stave box; the top line is a little below this
const SIDE = 10

function accidentalSymbol(accidental: number): string | null {
  if (accidental === 0) return null
  return (accidental > 0 ? '#' : 'b').repeat(Math.abs(accidental))
}

/**
 * Draws one stave with the given clef and notes (whole notes, no stems) into `container`.
 * Replaces anything already there. `color` is used for lines, clef and notes.
 */
export function drawStaff(
  container: HTMLElement,
  clef: ClefName,
  notes: readonly Pitch[],
  color: string,
  /** How many ledger lines above and below the staff must fit. The picture is sized for this. */
  ledgerLines = 3,
): void {
  container.replaceChildren()
  const clefWidth = 60
  const width = SIDE * 2 + clefWidth + NOTE_WIDTH * Math.max(1, notes.length)

  const stave = new Stave(SIDE, STAVE_Y, width - SIDE * 2)
  stave.addClef(clef)

  // Crop the picture to the staff plus room for the clef and the allowed ledger lines.
  // Each ledger line is 10 units (two staff positions); the clef sticks out about 24 units.
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

  const staveNotes = notes.map((pitch) => {
    const note = new StaveNote({
      keys: [`${pitch.letter.toLowerCase()}/${pitch.octave}`],
      duration: 'w',
      clef,
    })
    // VexFlow draws ledger lines in a dim grey by default, which is hard to see on a dark background.
    note.setLedgerLineStyle({ ...stave.getDefaultLedgerLineStyle(), strokeStyle: color, fillStyle: color })
    const symbol = accidentalSymbol(pitch.accidental)
    if (symbol) note.addModifier(new Accidental(symbol), 0)
    return note
  })

  const voice = new Voice({ numBeats: 4 * Math.max(1, notes.length), beatValue: 4 })
  voice.setStrict(false)
  voice.addTickables(staveNotes)
  new Formatter().joinVoices([voice]).format([voice], NOTE_WIDTH * Math.max(1, notes.length) - 10)
  voice.draw(context, stave)

  // Let the SVG scale to its container. VexFlow sets a fixed pixel size in inline styles on both the
  // container and the SVG, so remove the first and replace the second.
  container.style.removeProperty('width')
  container.style.removeProperty('height')
  const svg = container.querySelector('svg')
  if (svg) {
    svg.removeAttribute('height')
    svg.setAttribute('width', '100%')
    svg.style.width = '100%'
    svg.style.height = 'auto'
  }
}
