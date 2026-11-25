// @vitest-environment jsdom
import { Formatter, Renderer, Stave, StaveNote, Voice } from 'vexflow/bravura'
import { describe, expect, it } from 'vitest'
import { CLEF_NAMES, naturalPitchesInClef, staffPosition } from '../../theory'

// jsdom has no canvas; VexFlow falls back to its own font metrics when this returns null.
HTMLCanvasElement.prototype.getContext = () => null

/**
 * VexFlow draws the notes; src/theory decides where they belong.
 * This test renders every natural note in every clef and checks that VexFlow puts the
 * note head at the staff position the theory engine calculated.
 */
describe('VexFlow agrees with the theory engine', () => {
  for (const clef of CLEF_NAMES) {
    it(`${clef} clef: every note from 3 ledger lines below to 3 above`, () => {
      const div = document.createElement('div')
      document.body.appendChild(div)
      const renderer = new Renderer(div, Renderer.Backends.SVG)
      renderer.resize(300, 400)
      const context = renderer.getContext()
      const stave = new Stave(10, 150, 250)
      stave.addClef(clef)
      stave.setContext(context).draw()

      for (const pitch of naturalPitchesInClef(clef, 3)) {
        const key = `${pitch.letter.toLowerCase()}/${pitch.octave}`
        const note = new StaveNote({ keys: [key], duration: 'w', clef })
        const voice = new Voice({ numBeats: 4, beatValue: 4 }).addTickables([note])
        new Formatter().joinVoices([voice]).format([voice], 150)
        note.setStave(stave)
        const y = note.getYs()[0]
        const position = staffPosition(pitch, clef)
        // VexFlow counts lines from the top (0) to the bottom (4); half-steps are spaces.
        const expectedY = stave.getYForLine((8 - position) / 2)
        expect(y, `${clef} ${key} (position ${position})`).toBeCloseTo(expectedY, 3)
      }
    })
  }
})
