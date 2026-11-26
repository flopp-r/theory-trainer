import type { WorkedExample, WorkedStep } from '../types'
import {
  NOTE_VALUES,
  type NoteValueName,
  dottedCrotchets,
  dottedSemiquavers,
  noteValue,
  noteValueLabel,
  pitchAtPosition,
  restLabel,
} from '../../../theory'
import type { NotationItem, StaffSpec } from '../../../questions/types'

/*
 * Builders about note values, rests and dots. Lengths are worked out long-hand in beats and in semiquavers
 * (one crotchet beat = 4 semiquavers) and then checked against the theory engine. A disagreement throws.
 */

/** One note or rest in a worked example. `rest: true` draws a rest of that value. */
export interface Figure {
  readonly name: NoteValueName
  readonly dots?: number
  readonly rest?: boolean
}

const FRACTIONS: Record<number, string> = { 0: '', 0.25: '¼', 0.5: '½', 0.75: '¾' }

/** Beats as they are written: ¼, ½, ¾, 1, 1½, 1¾, 2, 3, 3½, 4 ... Works for any whole number of quarter-beats. */
export function beatsText(beats: number): string {
  if (beats < 0 || Math.round(beats * 4) !== beats * 4) throw new RangeError('Beats must be a whole number of quarters')
  const whole = Math.floor(beats)
  const fraction = FRACTIONS[beats - whole]!
  return whole === 0 ? fraction : `${whole}${fraction}`
}

const beatsWord = (beats: number) => `${beatsText(beats)} crotchet beat${beats === 1 ? '' : 's'}`

/** "1 beat", "2 beats", "½ a beat", "¼ of a beat": how a length reads in a sentence. */
function beatsPhrase(beats: number): string {
  if (beats === 1) return '1 beat'
  if (beats > 1) return `${beatsText(beats)} beats`
  return beats === 0.5 ? '½ a beat' : `${beatsText(beats)} of a beat`
}

const withArticle = (phrase: string) => `${/^[aeiou]/i.test(phrase) ? 'an' : 'a'} ${phrase}`

/** What each note looks like, in words. Same wording as the Practice explanations. */
const NOTE_LOOKS: Record<NoteValueName, string> = {
  semibreve: 'a hollow note head with no stem',
  minim: 'a hollow note head with a stem',
  crotchet: 'a filled-in note head with a stem',
  quaver: 'a filled-in note head with a stem and one flag',
  semiquaver: 'a filled-in note head with a stem and two flags',
}

/** What each rest looks like, in words. Same wording as the Practice explanations. */
export const REST_LOOKS: Record<NoteValueName, string> = {
  semibreve: 'a small block hanging below a line',
  minim: 'a small block sitting on top of a line',
  crotchet: 'a squiggly, zigzag shape',
  quaver: 'a slanted stroke with one hook (flag)',
  semiquaver: 'a slanted stroke with two hooks (flags)',
}

const dotWord = (dots: number) => (dots === 1 ? 'dot' : 'dots')

/** A picture of notes and rests in a row. Notes sit on the middle line of the treble staff. */
export function figuresOnStaff(figures: readonly Figure[]): StaffSpec {
  const middle = pitchAtPosition(4, 'treble')
  const items: NotationItem[] = figures.map((f) =>
    f.rest
      ? { kind: 'rest', duration: noteValue(f.name).vex, dots: f.dots ?? 0 }
      : { kind: 'notes', pitches: [middle], duration: noteValue(f.name).vex, dots: f.dots ?? 0 },
  )
  return { clef: 'treble', items }
}

function assertDots(dots: number): void {
  if (!Number.isInteger(dots) || dots < 0 || dots > 2) throw new RangeError('Dots must be 0, 1 or 2')
}

/** Length of a plain note in beats, by halving: a semibreve is 4, and each step down the family halves it. */
function plainBeats(name: NoteValueName): number {
  const index = NOTE_VALUES.findIndex((v) => v.name === name)
  const beats = 4 / 2 ** index
  if (beats !== noteValue(name).crotchets) throw new Error(`The ${name} length by halving disagrees with the theory engine`)
  return beats
}

/** What a dot-less value works out to in semiquavers, by halving 16. */
function plainSemiquavers(name: NoteValueName): number {
  return plainBeats(name) * 4
}

/** Beats each dot adds: the first dot adds half of the note, the second adds half of the first. */
function dotAdditions(name: NoteValueName, dots: number): number[] {
  const additions: number[] = []
  let add = plainBeats(name)
  for (let i = 0; i < dots; i++) {
    add = add / 2
    additions.push(add)
  }
  return additions
}

/** Total beats worked out by adding the note and its dot amounts, checked against the engine. */
function totalBeats(name: NoteValueName, dots: number): number {
  assertDots(dots)
  const total = plainBeats(name) + dotAdditions(name, dots).reduce((a, b) => a + b, 0)
  if (total !== dottedCrotchets(name, dots)) throw new Error(`The length of a ${noteValueLabel(name, dots)} disagrees with the theory engine`)
  if (total * 4 !== dottedSemiquavers(name, dots)) throw new Error('Beats and semiquavers disagree')
  return total
}

const american = (name: NoteValueName, dots: number) => `${dots === 0 ? '' : dots === 1 ? 'dotted ' : 'double-dotted '}${noteValue(name).american}`

function dotExplain(dots: number): string {
  return dots === 1
    ? 'The **dot** after the note head makes it half as long again.'
    : 'The **two dots** after the note head make it longer: the first adds half the note, and the second adds half of what the first added.'
}

/** "Name this note", by looking at the head, the stem and the flags, then the dots. */
export function nameNoteValueExample(name: NoteValueName, dots = 0): WorkedExample {
  assertDots(dots)
  const vex = noteValue(name).vex
  // What the picture shows, from the way the note is drawn.
  const hollow = vex === 'w' || vex === 'h'
  const stem = vex !== 'w'
  const flags = vex === '8' ? 1 : vex === '16' ? 2 : 0
  // Name it from those features alone, then check that it is the note we meant.
  const found: NoteValueName = hollow ? (stem ? 'minim' : 'semibreve') : flags === 0 ? 'crotchet' : flags === 1 ? 'quaver' : 'semiquaver'
  if (found !== name) throw new Error(`Naming ${name} from its shape gave ${found}`)

  const label = noteValueLabel(name, dots)
  const steps: WorkedStep[] = [
    { text: 'Look at the note.', staff: figuresOnStaff([{ name, dots }]) },
    { text: `Look at the **head**. Is it filled in or hollow? It is **${hollow ? 'hollow' : 'filled in'}**.` },
    hollow
      ? { text: `Does it have a **stem** (the straight line up or down from the head)? ${stem ? 'Yes. A hollow head with a stem is a **minim**.' : 'No. A hollow head with no stem is a **semibreve**.'}` }
      : {
          text: `A filled-in head with a stem is at least a crotchet. Now count the **flags** (the little tails on the end of the stem). There ${flags === 0 ? 'are **no flags**, so it is a **crotchet**' : flags === 1 ? 'is **one flag**, so it is a **quaver**' : 'are **two flags**, so it is a **semiquaver**'}.`,
        },
    dots === 0
      ? { text: 'Is there a **dot** just after the head? No, so there is nothing to add to the name.' }
      : { text: `Is there a **dot** just after the head? Yes, there ${dots === 1 ? 'is **1 dot**' : 'are **2 dots**'}. ${dotExplain(dots)} So we say **${label}**.` },
    {
      text: `Check: the shape (${NOTE_LOOKS[name]}) matches a ${name}. In American names this is ${withArticle(american(name, dots))}. It lasts ${beatsPhrase(totalBeats(name, dots))}.`,
    },
  ]
  return {
    title: dots === 0 ? 'Name a note from its shape' : `Name a note with ${dots === 1 ? 'a dot' : 'two dots'}`,
    task: 'What is the name of this note?',
    steps,
    answer: `It is a ${label}.`,
  }
}

/** "Name this rest", from its shape. */
export function nameRestExample(name: NoteValueName, dots = 0): WorkedExample {
  assertDots(dots)
  const label = restLabel(name, dots)
  return {
    title: 'Name a rest from its shape',
    task: 'What is the name of this rest?',
    steps: [
      { text: 'Look at the rest. A **rest** is a sign for silence: you count the time but play nothing.', staff: figuresOnStaff([{ name, dots, rest: true }]) },
      { text: `Match the shape. This one is ${REST_LOOKS[name]}. That is the shape of a **${name} rest**.` },
      dots === 0
        ? { text: 'Is there a dot after it? No, so there is nothing to add to the name.' }
        : { text: `Is there a dot after it? Yes, there ${dots === 1 ? 'is 1 dot' : 'are 2 dots'}. A dot after a rest works just like a dot after a note. So it is a **${label}**.` },
      { text: `A rest lasts as long as the note with the same name. A ${noteValueLabel(name, dots)} lasts ${beatsWord(totalBeats(name, dots))}, so this rest is ${beatsPhrase(totalBeats(name, dots))} of silence.` },
      { text: `Check: the shape (${REST_LOOKS[name]}) belongs to a ${name} rest, and the name matches. The note with this name is ${NOTE_LOOKS[name]}.` },
    ],
    answer: `It is a ${label}.`,
  }
}

/**
 * "How many crotchet beats is this note worth?" The working is long-hand: the plain value (by halving from the semibreve),
 * plus what each dot adds. It is checked against `dottedCrotchets` and throws if they disagree.
 */
export function noteBeatsExample(name: NoteValueName, dots = 0): WorkedExample {
  assertDots(dots)
  const label = noteValueLabel(name, dots)
  const plain = plainBeats(name)
  const additions = dotAdditions(name, dots)
  const total = totalBeats(name, dots)
  const semis = plainSemiquavers(name)
  const semiAdd = additions.map((a) => a * 4)
  const semiTotal = semis + semiAdd.reduce((a, b) => a + b, 0)
  if (semiTotal !== dottedSemiquavers(name, dots)) throw new Error('Semiquaver working disagrees with the theory engine')

  const steps: WorkedStep[] = [
    { text: `Look at the note and name it: it is a **${label}**.`, staff: figuresOnStaff([{ name, dots }]) },
    {
      text: `Start with the plain value, ignoring any dots. The family goes 4, 2, 1, ½, ¼ beats for semibreve, minim, crotchet, quaver, semiquaver. A ${name} is worth **${beatsPhrase(plain)}**.`,
    },
  ]
  if (dots === 0) {
    steps.push({ text: 'Look for a dot after the note head. There is none, so nothing is added.' })
  } else {
    steps.push({ text: `Look for dots after the note head. There ${dots === 1 ? 'is 1 dot' : 'are 2 dots'}. ${dotExplain(dots)}` })
    additions.forEach((add, i) => {
      const from = i === 0 ? `half of the note (${beatsText(plain)} ÷ 2)` : `half of what the first dot added (${beatsText(additions[i - 1]!)} ÷ 2)`
      steps.push({ text: `The ${i === 0 ? 'first' : 'second'} dot adds ${from} = **${beatsText(add)}**.` })
    })
  }
  const sum = [plain, ...additions].map(beatsText).join(' + ')
  steps.push({
    text: dots === 0 ? `So the ${name} is worth **${beatsPhrase(total)}**.` : `Add up: ${sum} = **${beatsText(total)}**.`,
  })
  const semiSum = [semis, ...semiAdd].join(' + ')
  steps.push({
    text: `Check a different way, with the smallest note. A semiquaver is ¼ of a beat, so 4 semiquavers make 1 beat. A ${label} is ${dots === 0 ? semis : `${semiSum} = ${semiTotal}`} semiquavers, and ${semiTotal} ÷ 4 = ${beatsText(total)}. Same answer.`,
  })
  return {
    title: dots === 0 ? 'Beats in a plain note' : dots === 1 ? 'Beats in a dotted note' : 'Beats in a double-dotted note',
    task: `How many crotchet beats is a ${label} worth?`,
    steps,
    answer: `A ${label} is worth ${beatsWord(total)}.`,
  }
}

/** Adds up a short run of notes and rests in beats. Checked against the engine and in semiquavers. */
export function sumValuesExample(figures: readonly Figure[]): WorkedExample {
  if (figures.length < 2) throw new RangeError('Give at least two notes or rests to add up')
  const parts = figures.map((f) => {
    const dots = f.dots ?? 0
    return { f, dots, beats: totalBeats(f.name, dots), label: f.rest ? restLabel(f.name, dots) : noteValueLabel(f.name, dots) }
  })
  const total = parts.reduce((sum, p) => sum + p.beats, 0)
  const semis = parts.map((p) => p.beats * 4)
  const semiTotal = semis.reduce((a, b) => a + b, 0)
  const engineTotal = figures.reduce((sum, f) => sum + dottedSemiquavers(f.name, f.dots ?? 0), 0)
  if (semiTotal !== engineTotal || total * 4 !== engineTotal) throw new Error('The total disagrees with the theory engine')

  const steps: WorkedStep[] = [
    { text: `Here is the run. Name each note or rest from left to right: ${parts.map((p) => withArticle(p.label)).join(', ')}.`, staff: figuresOnStaff(figures) },
    ...parts.map((p) => ({
      text: `**${withArticle(p.label)[0]!.toUpperCase()}${withArticle(p.label).slice(1)}.** ${p.dots === 0 ? `A plain ${p.f.name}` : `A ${p.f.name} plus its ${dotWord(p.dots)}`} = **${beatsPhrase(p.beats)}**.${p.f.rest ? ' (A rest counts the same as the note with that name.)' : ''}`,
    })),
    { text: `Add them in order: ${parts.map((p) => beatsText(p.beats)).join(' + ')} = **${beatsText(total)}**.` },
    {
      text: `Check in semiquavers (4 to a beat): ${semis.join(' + ')} = ${semiTotal} semiquavers, and ${semiTotal} ÷ 4 = ${beatsText(total)} beats. Same total.`,
    },
  ]
  return {
    title: 'Add up a run of note values',
    task: `How many crotchet beats do these notes and rests last altogether?`,
    steps,
    answer: `Altogether they last ${beatsWord(total)}.`,
  }
}
