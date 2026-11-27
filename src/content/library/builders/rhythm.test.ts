import { describe, expect, it } from 'vitest'
import type { NoteValueName } from '../../../theory'
import { beatsText, figuresOnStaff, nameNoteValueExample, nameRestExample, noteBeatsExample, sumValuesExample } from './rhythm'

const text = (steps: readonly { title?: string; text: string; result?: string }[]) => steps.map((s) => [s.title, s.text, s.result].join(' ')).join(' ')

// Hand-written: beats for each value with 0, 1 and 2 dots. Only the ones that fit in quarters are shown as beats.
const BEATS: Record<string, string> = {
  semibreve: '4',
  'dotted semibreve': '6',
  'double-dotted semibreve': '7',
  minim: '2',
  'dotted minim': '3',
  'double-dotted minim': '3½',
  crotchet: '1',
  'dotted crotchet': '1½',
  'double-dotted crotchet': '1¾',
  quaver: '½',
  'dotted quaver': '¾',
  semiquaver: '¼',
}

describe('beatsText', () => {
  it('writes quarters of a beat the way the app does', () => {
    expect([0.25, 0.5, 0.75, 1, 1.5, 1.75, 2, 3, 3.5, 4, 6, 7].map(beatsText)).toEqual(['¼', '½', '¾', '1', '1½', '1¾', '2', '3', '3½', '4', '6', '7'])
    expect(() => beatsText(0.875)).toThrow()
    expect(() => beatsText(-1)).toThrow()
  })
})

describe('noteBeatsExample', () => {
  it('gives the hand-written number of beats for every value and number of dots that fit in quarters', () => {
    for (const [label, beats] of Object.entries(BEATS)) {
      const dots = label.startsWith('double-dotted') ? 2 : label.startsWith('dotted') ? 1 : 0
      const name = label.replace('double-dotted ', '').replace('dotted ', '') as NoteValueName
      const e = noteBeatsExample(name, dots)
      const unit = beats.startsWith('¼') || beats.startsWith('½') || beats.startsWith('¾') ? 'of a crotchet beat' : beats === '1' ? 'crotchet beat' : 'crotchet beats'
      expect(e.answer, label).toBe(`A ${label} is worth ${beats} ${unit}.`)
      expect(e.steps[0]!.staff, label).toBeDefined()
      expect(e.steps.at(-1)!.title!.startsWith('Check'), label).toBe(true)
      expect(e.terms!.length, label).toBeGreaterThanOrEqual(2)
    }
  })

  it('shows the long-hand sum: dotted minim 2 + 1 = 3, double-dotted minim 2 + 1 + ½ = 3½, dotted crotchet 1 + ½ = 1½', () => {
    expect(text(noteBeatsExample('minim', 1).steps)).toContain('2 + 1 = 3')
    expect(text(noteBeatsExample('minim', 2).steps)).toContain('2 + 1 + ½ = 3½')
    expect(text(noteBeatsExample('crotchet', 1).steps)).toContain('1 + ½ = 1½')
    expect(text(noteBeatsExample('quaver', 1).steps)).toContain('½ + ¼ = ¾')
    // the length without dots comes from halving the semibreve, every division shown
    expect(text(noteBeatsExample('quaver', 1).steps)).toContain('semibreve 4, minim 4 ÷ 2 = 2, crotchet 2 ÷ 2 = 1, quaver 1 ÷ 2 = ½')
  })

  it('checks in semiquavers (dotted minim 8 + 4 = 12, 12 ÷ 4 = 3)', () => {
    expect(text(noteBeatsExample('minim', 1).steps)).toContain('8 + 4 = 12 semiquavers. Then 12 ÷ 4 = 3 beats')
    expect(text(noteBeatsExample('crotchet', 0).steps)).toContain('A crotchet is 4 semiquavers (16 halved twice: 8, 4). Then 4 ÷ 4 = 1 beat')
  })

  it('refuses lengths that are not a whole number of quarter beats, and bad dot counts', () => {
    expect(() => noteBeatsExample('quaver', 2)).toThrow()
    expect(() => noteBeatsExample('crotchet', 3)).toThrow()
  })
})

describe('sentences read well', () => {
  it('says "an eighth note", "½ a beat" and "¼ of a beat"', () => {
    expect(text(nameNoteValueExample('quaver').steps)).toContain('this is an eighth note')
    expect(text(nameNoteValueExample('minim').steps)).toContain('this is a half note')
    expect(text(noteBeatsExample('quaver', 0).steps)).toContain('Quaver: ½ a beat')
    expect(text(noteBeatsExample('semiquaver', 0).steps)).toContain('¼ of a beat')
    expect(noteBeatsExample('quaver', 0).answer).toBe('A quaver is worth ½ of a crotchet beat.')
    expect(text(nameRestExample('quaver').steps)).toContain('½ a beat of silence')
    const twoQuavers = sumValuesExample([{ name: 'quaver' }, { name: 'quaver' }])
    expect(twoQuavers.steps.map((s) => s.title)).toContain('Second: the quaver')
    expect(text(twoQuavers.steps)).toContain('½ + ½ = 1')
  })
})

describe('nameNoteValueExample', () => {
  it('names every value from its shape', () => {
    const expected: Record<NoteValueName, string> = { semibreve: 'semibreve', minim: 'minim', crotchet: 'crotchet', quaver: 'quaver', semiquaver: 'semiquaver' }
    for (const [name, label] of Object.entries(expected)) {
      const e = nameNoteValueExample(name as NoteValueName)
      expect(e.answer).toBe(`It is a ${label}.`)
      expect(e.steps[0]!.staff).toBeDefined()
    }
  })

  it('names dotted and double-dotted notes and quotes the American name', () => {
    expect(nameNoteValueExample('minim', 1).answer).toBe('It is a dotted minim.')
    expect(text(nameNoteValueExample('minim', 1).steps)).toContain('dotted half note')
    expect(nameNoteValueExample('crotchet', 2).answer).toBe('It is a double-dotted crotchet.')
    expect(text(nameNoteValueExample('quaver').steps)).toContain('1 flag')
    expect(text(nameNoteValueExample('semiquaver').steps)).toContain('2 flags')
    // the check builds up from the semibreve: a quaver has the first 3 changes, a semibreve none
    expect(nameNoteValueExample('quaver').steps.at(-1)!.text).toContain('the first 3 changes')
    expect(nameNoteValueExample('semibreve').steps.at(-1)!.text).toContain('none of these changes')
    expect(text(nameNoteValueExample('semibreve').steps)).toContain('hollow')
  })
})

describe('nameRestExample', () => {
  // Hand-written from the Practice explanations.
  const looks: Record<NoteValueName, string> = {
    semibreve: 'a small block hanging below a line',
    minim: 'a small block sitting on top of a line',
    crotchet: 'a squiggly, zigzag shape',
    quaver: 'a slanted stroke with one hook (flag)',
    semiquaver: 'a slanted stroke with two hooks (flags)',
  }
  it('describes each rest the way Practice does and names it', () => {
    for (const [name, look] of Object.entries(looks)) {
      const e = nameRestExample(name as NoteValueName)
      expect(e.answer).toBe(`It is a ${name} rest.`)
      expect(text(e.steps)).toContain(look)
      expect(e.steps[0]!.staff!.items[0]!.kind).toBe('rest')
    }
  })
})

describe('sumValuesExample', () => {
  it('adds minim + dotted crotchet + quaver = 2 + 1½ + ½ = 4', () => {
    const e = sumValuesExample([{ name: 'minim' }, { name: 'crotchet', dots: 1 }, { name: 'quaver' }])
    expect(text(e.steps)).toContain('2 + 1½ = 3½, then 3½ + ½ = 4')
    expect(text(e.steps)).toContain('8 + 6 + 2 = 16 semiquavers, and 16 ÷ 4 = 4')
    expect(e.steps.filter((s) => /^(First|Second|Third): /.test(s.title ?? '')).map((s) => s.result)).toEqual(['2 beats', '1½ beats', '½ a beat'])
    expect(e.answer).toBe('Altogether they last 4 crotchet beats.')
  })

  it('counts a rest like the note with the same name', () => {
    const e = sumValuesExample([{ name: 'crotchet' }, { name: 'minim', rest: true }, { name: 'crotchet' }])
    expect(e.answer).toBe('Altogether they last 4 crotchet beats.')
    expect(text(e.steps)).toContain('minim rest')
    expect(e.steps[0]!.staff!.items.map((i) => i.kind)).toEqual(['notes', 'rest', 'notes'])
  })

  it('needs two or more figures', () => {
    expect(() => sumValuesExample([{ name: 'minim' }])).toThrow()
  })
})

describe('figuresOnStaff', () => {
  it('draws notes and rests with the right duration codes and dots', () => {
    const staff = figuresOnStaff([{ name: 'semibreve' }, { name: 'minim', dots: 1 }, { name: 'quaver', rest: true }, { name: 'semiquaver' }])
    expect(staff.items.map((i) => i.duration)).toEqual(['w', 'h', '8', '16'])
    expect(staff.items.map((i) => i.dots)).toEqual([0, 1, 0, 0])
    expect(staff.items.map((i) => i.kind)).toEqual(['notes', 'notes', 'rest', 'notes'])
  })
})
