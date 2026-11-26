import { describe, expect, it } from 'vitest'
import { note, parseNote, parsePitch } from '../../../theory'
import { MAJOR_SCALES, ascii } from '../../../questions/handTables'
import { accidentalCarryExample, enharmonicExample, nameAccidentalExample, signName } from './accidentals'

const text = (steps: readonly { text: string }[]) => steps.map((s) => s.text).join(' ')

describe('signName', () => {
  it('names each sign', () => {
    expect([1, -1, 0, 2, -2].map(signName)).toEqual(['sharp', 'flat', 'natural', 'double sharp', 'double flat'])
    expect(() => signName(3)).toThrow()
  })
})

describe('nameAccidentalExample', () => {
  // Hand-counted: treble C5 is in the 3rd space (G4 up 3: G A B C). Bass B2 is on the 2nd line (F3 down 4: F E D C B... that is F3 to B2).
  it.each([
    ['treble', 'C#5', 'C♯', 'G, A, B, C', 'a sharp', 'raises'],
    ['bass', 'Bb2', 'B♭', 'F, E, D, C, B', 'a flat', 'lowers'],
    ['treble', 'F##4', 'F♯♯', 'G, F', 'a double sharp', 'raises'],
    ['alto', 'Ebb4', 'E♭♭', 'C, D, E', 'a double flat', 'lowers'],
  ])('%s %s is named %s', (clef, pitchText, label, counted, signText, verb) => {
    const e = nameAccidentalExample(clef as 'treble', parsePitch(pitchText))
    expect(e.answer).toBe(`The note is ${label}.`)
    const all = text(e.steps)
    expect(all).toContain(`**${counted}**`)
    expect(all).toContain(signText)
    expect(all).toContain(verb)
    expect(e.steps[0]!.staff).toBeDefined()
    expect(e.steps.at(-1)!.text.startsWith('Check')).toBe(true)
  })

  it('says how many semitones the sign changes the note by', () => {
    expect(text(nameAccidentalExample('treble', parsePitch('F##4')).steps)).toContain('2 semitones')
    expect(text(nameAccidentalExample('treble', parsePitch('F#4')).steps)).toContain('1 semitone.')
  })

  it('refuses a plain note', () => {
    expect(() => nameAccidentalExample('treble', parsePitch('F4'))).toThrow()
  })
})

describe('accidentalCarryExample', () => {
  it('prints a sign on notes 1, 4 and 5 only in F♯4 G4 F♯4 F♯5 F4 F4', () => {
    // By hand: 1 sharp is new. 2 G is plain. 3 the sharp on F4 still holds. 4 F5 is another pitch, so it needs its own sharp.
    // 5 F4 is plain again, so a natural cancels the sharp. 6 the natural still holds.
    const bar = ['F#4', 'G4', 'F#4', 'F#5', 'F4', 'F4'].map(parsePitch)
    const e = accidentalCarryExample(bar)
    expect(e.steps).toHaveLength(1 + 6 + 1)
    expect(e.answer).toBe('Signs are printed on notes 1 (♯), 4 (♯) and 5 (♮). There is no sign on notes 2, 3 and 6.')
    const [, n1, n2, n3, n4, n5, n6] = e.steps.map((s) => s.text)
    expect(n1).toContain('needs a sharp')
    expect(n2).toContain('**No sign.**')
    expect(n3).toContain('still in force')
    expect(n3).toContain('same letter, same octave')
    expect(n4).toContain('needs a sharp')
    expect(n4).toContain('does not help here')
    expect(n5).toContain('natural sign')
    expect(n6).toContain('No sign')
    expect(e.steps[0]!.staff!.items).toHaveLength(6)
  })

  it('handles a flat followed by a sharp on the same pitch, and a repeated flat', () => {
    // B♭4 prints a flat; B♭4 again does not; B♯4 differs from the flat in force, so it prints its own sign.
    const e = accidentalCarryExample(['Bb4', 'Bb4', 'B#4'].map(parsePitch))
    expect(e.answer).toBe('Signs are printed on notes 1 (♭) and 3 (♯). There is no sign on note 2.')
    expect(text(e.steps)).toContain('needs its own sign')
  })

  it('needs at least two notes', () => {
    expect(() => accidentalCarryExample([parsePitch('C4')])).toThrow()
  })
})

describe('enharmonicExample', () => {
  it('chooses F♯ in D major and G♭ in D♭ major, matching the hand-written scales', () => {
    expect(MAJOR_SCALES['D']).toContain('F#')
    expect(MAJOR_SCALES['D']).not.toContain('Gb')
    expect(MAJOR_SCALES['Db']).toContain('Gb')
    expect(MAJOR_SCALES['Db']).not.toContain('F#')
    const e = enharmonicExample(parsePitch('F#4'), parsePitch('Gb4'), note('D'), note('D', -1))
    expect(ascii(e.answer)).toBe('F# and Gb are the same sound. Write the one whose letter you need: F# in D major, Gb in Db major.')
    const all = text(e.steps)
    expect(all).toContain('D E F♯ G A B C♯')
    expect(all).toContain('D♭ E♭ F G♭ A♭ B♭ C')
    expect(all).toContain('enharmonic equivalents')
    expect(e.steps[0]!.listen).toBeDefined()
  })

  it('works for C♯ and D♭ (A major and A♭ major)', () => {
    expect(MAJOR_SCALES['A']).toContain('C#')
    expect(MAJOR_SCALES['Ab']).toContain('Db')
    const e = enharmonicExample(parsePitch('C#4'), parsePitch('Db4'), parseNote('A'), parseNote('Ab'))
    expect(ascii(e.answer)).toContain('C# in A major, Db in Ab major')
  })

  it('refuses keys that do not need the spellings, and pairs that are not enharmonic', () => {
    expect(() => enharmonicExample(parsePitch('F#4'), parsePitch('Gb4'), note('D'), note('G'))).toThrow()
    expect(() => enharmonicExample(parsePitch('F#4'), parsePitch('Ab4'), note('D'), note('D', -1))).toThrow()
    expect(() => enharmonicExample(parsePitch('E#4'), parsePitch('Gb4'), note('D'), note('D', -1))).toThrow()
  })
})
