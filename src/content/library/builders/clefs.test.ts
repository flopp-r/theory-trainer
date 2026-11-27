import { describe, expect, it } from 'vitest'
import { CLEF_NAMES, type ClefName, parsePitch } from '../../../theory'
import { anchorPitch, convertClefExample, countPath, guitarSoundingExample, memoryAid, middleCInClefsExample, placeNoteExample, staffLetterRows } from './clefs'

// Hand-written: the note on the bottom line of each clef (letter and octave).
const BOTTOM_LINE: Record<ClefName, [letter: string, octave: number]> = {
  treble: ['E', 4],
  bass: ['G', 2],
  alto: ['F', 3],
  tenor: ['D', 3],
}
const LETTERS = 'CDEFGAB'

/** Every natural note on a ladder of staff positions, built by hand: position -> "C4" and back. */
function ladder(clef: ClefName): Map<number, string> {
  const [letter, octave] = BOTTOM_LINE[clef]
  const map = new Map<number, string>()
  let index = LETTERS.indexOf(letter)
  let oct = octave
  map.set(0, `${LETTERS[index]}${oct}`)
  for (let position = 1; position <= 14; position++) {
    index = (index + 1) % 7
    if (index === 0) oct += 1
    map.set(position, `${LETTERS[index]}${oct}`)
  }
  index = LETTERS.indexOf(letter)
  oct = octave
  for (let position = -1; position >= -8; position--) {
    if (index === 0) oct -= 1
    index = (index + 6) % 7
    map.set(position, `${LETTERS[index]}${oct}`)
  }
  return map
}

/** Hand-written words for a staff position. */
function words(position: number): string {
  const lines = ['the bottom line', 'the 2nd line', 'the middle line', 'the 4th line', 'the top line']
  const spaces = ['the bottom space', 'the 2nd space', 'the 3rd space', 'the top space']
  if (position >= 0 && position <= 8) return position % 2 === 0 ? lines[position / 2]! : spaces[(position - 1) / 2]!
  const ordinal = ['1st', '2nd', '3rd', '4th', '5th']
  const below = position < 0
  const d = below ? -position : position - 8
  const side = below ? 'below' : 'above'
  if (d === 1) return `the space ${side} the ${below ? 'bottom' : 'top'} line`
  const n = ordinal[Math.floor(d / 2) - 1]!
  return d % 2 === 0 ? `the ${n} ledger line ${side} the staff` : `the space ${side} the ${n} ledger line`
}

/** "on" a line, "in" a space. */
const at = (position: number) => `${Math.abs(position) % 2 === 0 ? 'on' : 'in'} ${words(position)}`
/** Everything a reader sees in the steps: titles, texts and results. */
const all = (steps: readonly { title?: string; text: string; result?: string }[]) => steps.map((s) => [s.title, s.text, s.result].join(' ')).join(' ')

const ledgers = (position: number) => (position < 0 ? Math.floor(-position / 2) : position > 8 ? Math.floor((position - 8) / 2) : 0)

describe('countPath', () => {
  it('changes the octave number at C, going up and going down', () => {
    expect(countPath(parsePitch('G4'), parsePitch('C5')).map((p) => `${p.letter}${p.octave}`)).toEqual(['G4', 'A4', 'B4', 'C5'])
    expect(countPath(parsePitch('G4'), parsePitch('C4')).map((p) => `${p.letter}${p.octave}`)).toEqual(['G4', 'F4', 'E4', 'D4', 'C4'])
    expect(countPath(parsePitch('F3'), parsePitch('A2')).map((p) => `${p.letter}${p.octave}`)).toEqual(['F3', 'E3', 'D3', 'C3', 'B2', 'A2'])
    expect(countPath(parsePitch('C4'), parsePitch('C4'))).toHaveLength(1)
  })
})

describe('anchors', () => {
  it('are the notes each clef is built around', () => {
    expect(['treble', 'bass', 'alto', 'tenor'].map((c) => anchorPitch(c as ClefName)).map((p) => `${p.letter}${p.octave}`)).toEqual(['G4', 'F3', 'C4', 'C4'])
  })
})

describe('placeNoteExample', () => {
  it('says where every note goes, with the right words and ledger lines, in every clef', () => {
    for (const clef of CLEF_NAMES) {
      for (const [position, name] of ladder(clef)) {
        const e = placeNoteExample(clef, parsePitch(name))
        const text = all(e.steps)
        expect(e.answer, `${clef} ${name}`).toBe(`${name} goes ${at(position)}${ledgers(position) === 0 ? '' : ledgers(position) === 1 ? ' (you need 1 ledger line)' : ` (you need ${ledgers(position)} ledger lines)`}.`)
        if (ledgers(position) === 0) expect(text, `${clef} ${name}`).toContain('No ledger lines')
        expect(e.steps.at(-1)!.title!.startsWith('Check')).toBe(true)
        expect(e.steps.at(-1)!.result).toContain(`is ${name}, as counted`)
        expect(e.steps.some((s) => s.staff)).toBe(true)
        expect(e.terms!.length).toBeGreaterThanOrEqual(2)
      }
    }
  })

  it('shows the count with octave numbers (treble C5: G4, A4, B4, C5; treble C4: G4 down to C4)', () => {
    const up = all(placeNoteExample('treble', parsePitch('C5')).steps)
    expect(up).toContain('3 steps up')
    expect(up).toContain('2nd line G4, 2nd space A4, middle line B4, 3rd space C5')
    expect(up).toContain('from B4 to C5 the number goes up')
    const down = placeNoteExample('treble', parsePitch('C4'))
    const downText = all(down.steps)
    // inside the staff to the bottom line, then on below the staff
    expect(downText).toContain('2nd line G4, bottom space F4, bottom line E4')
    expect(downText).toContain('space below the bottom line D4, 1st ledger line C4')
    expect(downText).toContain('4 steps down in all')
    expect(down.task).toContain('(middle C)')
    expect(downText).toContain('middle C is C4')
  })

  it('handles the note on the clef line itself and refuses notes with a sharp or flat', () => {
    expect(all(placeNoteExample('treble', parsePitch('G4')).steps)).toContain('nothing to count')
    expect(() => placeNoteExample('treble', parsePitch('F#4'))).toThrow()
  })
})

describe('convertClefExample', () => {
  it('puts the same letter and octave in the new clef, for every pair of clefs where both fit', () => {
    for (const from of CLEF_NAMES) {
      for (const to of CLEF_NAMES) {
        if (from === to) continue
        const fromLadder = ladder(from)
        const toLadder = ladder(to)
        for (const [position, name] of fromLadder) {
          const toPosition = [...toLadder].find(([, n]) => n === name)?.[0]
          if (toPosition === undefined || ledgers(position) > 3 || ledgers(toPosition) > 3) continue
          const e = convertClefExample(parsePitch(name), from, to)
          expect(e.answer, `${name} ${from} to ${to}`).toContain(`Write ${name} ${at(toPosition)} in ${to} clef`)
          expect(all(e.steps)).toContain(`The note is ${at(position)}`)
          expect(e.steps.at(-1)!.title!.startsWith('Check')).toBe(true)
          expect(e.steps.at(-1)!.result).toContain(`is ${name}, the same pitch as before`)
        }
      }
    }
  })

  it('shows the trap: the same place in the new clef is a different note (alto E4 to treble)', () => {
    // E4 is on the 4th line of alto. The 4th line of treble is D5, 10 semitones higher (E4 = 64, D5 = 74).
    const e = convertClefExample(parsePitch('E4'), 'alto', 'treble')
    const trap = e.steps.find((s) => s.title === 'Do not copy the place on the staff')!.text
    expect(trap).toContain('the 4th line')
    expect(trap).toContain('D5')
    expect(trap).toContain('10 semitones higher')
    expect(e.answer).toBe('Write E4 on the bottom line in treble clef.')
  })

  it('bass A3 to treble needs 2 ledger lines below, and refuses the same clef twice or too many ledger lines', () => {
    expect(convertClefExample(parsePitch('A3'), 'bass', 'treble').answer).toBe('Write A3 on the 2nd ledger line below the staff in treble clef (you need 2 ledger lines).')
    expect(() => convertClefExample(parsePitch('A3'), 'bass', 'bass')).toThrow()
    expect(() => convertClefExample(parsePitch('C2'), 'bass', 'treble')).toThrow()
  })
})

describe('middleCInClefsExample', () => {
  it('puts middle C where the hand-written table says', () => {
    const e = middleCInClefsExample()
    expect(e.steps).toHaveLength(5)
    expect(e.answer).toBe(
      'Middle C is on treble clef: the 1st ledger line below the staff; bass clef: the 1st ledger line above the staff; alto clef: the middle line; tenor clef: the 4th line.',
    )
    expect(e.steps.slice(0, 4).every((s) => s.staff)).toBe(true)
    // the check joins the staves: bass top line A3, treble bottom line E4, and B3 C4 D4 between them
    expect(e.steps.at(-1)!.text).toContain('top line is A3')
    expect(e.steps.at(-1)!.text).toContain('bottom line is E4')
    expect(e.steps.at(-1)!.text).toContain('B3, C4, D4')
  })
})

describe('guitarSoundingExample', () => {
  it('sounds the same letter one octave lower', () => {
    for (const name of ['E4', 'G4', 'C5', 'A3', 'B4']) {
      const p = parsePitch(name)
      const e = guitarSoundingExample(p)
      expect(e.answer).toBe(`The written note ${name} sounds as ${p.letter}${p.octave - 1}, one octave lower.`)
      expect(e.steps.some((s) => s.listen)).toBe(true)
      // the check counts 8 letter names down and ends on the sounding note
      expect(e.steps.at(-1)!.text).toMatch(new RegExp(`${name}(, [A-G]\\d){7}\\.`))
      expect(e.steps.at(-1)!.result).toBe(`8 letter names down from ${name} is ${p.letter}${p.octave - 1}`)
    }
  })
})

describe('staffLetterRows', () => {
  it('matches the hand-written line and space notes', () => {
    const rows = staffLetterRows(['treble', 'bass', 'alto', 'tenor'])
    // Bottom to top: line, space, line, space ...
    expect(rows.map((r) => r[1]).join('')).toBe('EFGABCDEF') // treble
    expect(rows.map((r) => r[2]).join('')).toBe('GABCDEFGA') // bass
    expect(rows.map((r) => r[3]).join('')).toBe('FGABCDEFG') // alto
    expect(rows.map((r) => r[4]).join('')).toBe('DEFGABCDE') // tenor
    expect(rows[0]![0]).toBe('1st line (bottom)')
    expect(rows[8]![0]).toBe('5th line (top)')
    // lines are the even rows
    expect(rows.filter((_, i) => i % 2 === 0).map((r) => r[1]).join('')).toBe('EGBDF')
    expect(rows.filter((_, i) => i % 2 === 1).map((r) => r[1]).join('')).toBe('FACE')
  })
})

describe('memoryAid', () => {
  it('bolds the first letters and refuses an aid whose letters do not fit', () => {
    expect(memoryAid('Every Good Boy Deserves Football', 'EGBDF')).toBe('**E**very **G**ood **B**oy **D**eserves **F**ootball')
    expect(memoryAid('All Cows Eat Grass', 'ACEG')).toBe('**A**ll **C**ows **E**at **G**rass')
    expect(() => memoryAid('Every Good Boy Deserves Fun', 'EGBDX')).toThrow()
  })
})

describe('alto compared with treble and bass (a fact the alto lesson states)', () => {
  it('has, at every place on the staff, the letter one further on than treble and one further back than bass', () => {
    const rows = staffLetterRows(['treble', 'alto', 'bass'])
    for (const [, treble, alto, bass] of rows) {
      expect(LETTERS.indexOf(alto!)).toBe((LETTERS.indexOf(treble!) + 1) % 7)
      expect(LETTERS.indexOf(alto!)).toBe((LETTERS.indexOf(bass!) + 6) % 7)
    }
  })
})
