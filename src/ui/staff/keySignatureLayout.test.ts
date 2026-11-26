// @vitest-environment jsdom
import { KeySignature, Renderer, Stave } from 'vexflow/bravura'
import { describe, expect, it } from 'vitest'
import { CLEF_NAMES, type ClefName, circleOfFifths, keyName, keySignature, pitchAtPosition } from '../../theory'
import { vexKeySpec } from './renderStaff'

// jsdom has no canvas; VexFlow falls back to its own font metrics when this returns null.
HTMLCanvasElement.prototype.getContext = () => null

function accidentalsDrawn(clef: ClefName, spec: string): { type: string; position: number }[] {
  const div = document.createElement('div')
  const renderer = new Renderer(div, Renderer.Backends.SVG)
  renderer.resize(300, 200)
  const stave = new Stave(10, 20, 250)
  stave.addClef(clef)
  stave.addKeySignature(spec)
  stave.setContext(renderer.getContext()).draw()
  const sig = stave.getModifiers().find((m) => m instanceof KeySignature) as unknown as { accList: { type: string; line: number }[] }
  // VexFlow counts lines downwards from the top line in steps of 1 (so 0.5 is a space); my positions count up in half-lines.
  return sig.accList.map((a) => ({ type: a.type, position: 8 - 2 * a.line }))
}

describe('VexFlow key signatures agree with the theory engine', () => {
  for (const clef of CLEF_NAMES) {
    it(`${clef} clef: every one of the 30 standard keys has the right number, kind and letters of accidentals`, () => {
      for (const { major, minor } of circleOfFifths()) {
        for (const key of [major, minor]) {
          const expected = keySignature(key)
          const drawn = accidentalsDrawn(clef, vexKeySpec(key))
          const label = `${clef} ${keyName(key)}`
          expect(drawn.length, label).toBe(expected.count)
          drawn.forEach((a, i) => {
            const wanted = expected.accidentals[i]!
            expect(a.type, `${label} accidental ${i + 1}`).toBe(wanted.accidental > 0 ? '#' : 'b')
            // The staff position VexFlow chose must be a place where that letter sits in this clef.
            expect(pitchAtPosition(a.position, clef).letter, `${label} accidental ${i + 1}`).toBe(wanted.letter)
          })
        }
      }
    })

    it(`${clef} clef: every accidental sits on or next to the staff`, () => {
      for (const { major } of circleOfFifths()) {
        for (const a of accidentalsDrawn(clef, vexKeySpec(major))) {
          expect(a.position).toBeGreaterThanOrEqual(-1)
          expect(a.position).toBeLessThanOrEqual(9)
        }
      }
    })
  }

  it('treble and bass layouts match the standard patterns (positions: 0 = bottom line, 8 = top line)', () => {
    const positions = (clef: ClefName, spec: string) => accidentalsDrawn(clef, spec).map((a) => a.position)
    expect(positions('treble', 'C#')).toEqual([8, 5, 9, 6, 3, 7, 4]) // F C G D A E B
    expect(positions('treble', 'Cb')).toEqual([4, 7, 3, 6, 2, 5, 1]) // B E A D G C F
    expect(positions('bass', 'C#')).toEqual([6, 3, 7, 4, 1, 5, 2])
    expect(positions('bass', 'Cb')).toEqual([2, 5, 1, 4, 0, 3, -1])
  })
})
