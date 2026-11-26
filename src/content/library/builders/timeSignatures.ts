import type { WorkedExample, WorkedStep } from '../types'
import {
  NOTE_VALUES,
  type NoteValueName,
  type TimeSignature,
  dottedSemiquavers,
  formatTimeSignature,
  noteValueLabel,
  timeSignatureInfo,
} from '../../../theory'
import { type Figure, beatsText, figuresOnStaff } from './rhythm'

/*
 * Builders about time signatures. The working is done by hand (top number, bottom number, simple or compound,
 * length of the bar in semiquavers) and checked against `timeSignatureInfo`. A disagreement throws.
 */

export type TimeTask = 'beats' | 'classify' | 'fill'

const UNIT_NAME: Record<number, NoteValueName> = { 2: 'minim', 4: 'crotchet', 8: 'quaver', 16: 'semiquaver' }
const GROUPING: Record<number, string> = { 2: 'duple', 3: 'triple', 4: 'quadruple' }
/** Three of the bottom-number notes make this dotted note (by length in semiquavers). */
const COMPOUND_BEAT: Record<number, string> = { 24: 'dotted semibreve', 12: 'dotted minim', 6: 'dotted crotchet', 3: 'dotted quaver' }

interface Working {
  readonly name: string
  readonly unit: NoteValueName
  /** Length of one bottom-number note in semiquavers. */
  readonly unitSemis: number
  readonly bar: number
  readonly kind: 'simple' | 'compound'
  readonly pulses: number
  readonly pulseSemis: number
  readonly pulseNote: string
  readonly grouping: string
}

/** Everything about a time signature, worked out by hand and then checked against the engine. */
function work(ts: TimeSignature): Working {
  const name = formatTimeSignature(ts)
  const unit = UNIT_NAME[ts.unit]!
  const unitSemis = 16 / ts.unit
  const bar = ts.beats * unitSemis
  const simple = ts.beats === 2 || ts.beats === 3 || ts.beats === 4
  const compound = ts.beats === 6 || ts.beats === 9 || ts.beats === 12
  if (!simple && !compound) throw new RangeError(`${name} is not simple or compound in the way this lesson explains (top number 2, 3, 4, 6, 9 or 12)`)
  const pulses = simple ? ts.beats : ts.beats / 3
  const pulseSemis = simple ? unitSemis : 3 * unitSemis
  const pulseNote = simple ? unit : COMPOUND_BEAT[pulseSemis]!
  const working: Working = { name, unit, unitSemis, bar, kind: simple ? 'simple' : 'compound', pulses, pulseSemis, pulseNote, grouping: GROUPING[pulses]! }

  const engine = timeSignatureInfo(ts)
  if (
    engine.kind !== working.kind ||
    engine.pulses !== pulses ||
    engine.grouping !== working.grouping ||
    engine.pulseNote !== pulseNote ||
    engine.barSemiquavers !== bar ||
    pulses * pulseSemis !== bar
  ) {
    throw new Error(`Working for ${name} disagrees with the theory engine`)
  }
  return working
}

/** "a minim and a crotchet", "a, b and c". */
function andList(items: readonly string[]): string {
  return items.length <= 1 ? items.join('') : `${items.slice(0, -1).join(', ')} and ${items.at(-1)}`
}

const unitMeaning = 'The bottom number says which note value is one unit: 2 is a minim, 4 is a crotchet, 8 is a quaver, 16 is a semiquaver.'

/** A picture of a bar: the time signature, and notes if there are any. */
export function timeSignatureStaff(ts: TimeSignature, figures: readonly Figure[]) {
  return { ...figuresOnStaff(figures), time: ts }
}

function beatsExample(ts: TimeSignature, w: Working): WorkedExample {
  const top = ts.beats
  const steps: WorkedStep[] = [
    { text: `Look at the time signature: **${w.name}**. The top number is **${top}** and the bottom number is **${ts.unit}**.`, staff: timeSignatureStaff(ts, []) },
    { text: `${unitMeaning} So the bottom number ${ts.unit} means **${w.unit}s**.` },
    w.kind === 'simple'
      ? { text: `A top number of 2, 3 or 4 means **simple time**, and ${top} is one of those. So the top number is the number of beats in a bar: **${top}**. Each beat is one ${w.unit}.` }
      : {
          text: `A top number of 6, 9 or 12 means **compound time**, and ${top} is one of those. In compound time the ${w.unit}s are counted in **threes**. Each group of three is one main beat, a **${w.pulseNote}**. Divide by 3: ${top} ÷ 3 = **${w.pulses}** main beats.`,
        },
    {
      text: `Check: ${w.pulses} beats × ${w.pulseSemis} semiquavers in each ${w.pulseNote} = ${w.bar}. A bar of ${top} ${w.unit}s is ${top} × ${w.unitSemis} = ${w.bar} semiquavers. They match.`,
    },
  ]
  return {
    title: 'Beats in a bar',
    task: `How many main beats are in each bar of ${w.name}? (The beats you would tap.)`,
    steps,
    answer: `There ${w.pulses === 1 ? 'is' : 'are'} ${w.pulses} main beats in each bar.`,
  }
}

function classifyExample(ts: TimeSignature, w: Working): WorkedExample {
  const top = ts.beats
  const half = NOTE_VALUES.find((v) => v.semiquavers === w.pulseSemis / 2)
  const halves = half ? `two ${half.name}s` : 'two shorter notes'
  const steps: WorkedStep[] = [
    { text: `Look at the time signature: **${w.name}**. The top number is **${top}**.`, staff: timeSignatureStaff(ts, []) },
    {
      text:
        w.kind === 'simple'
          ? `**Step 1: simple or compound?** A top number of 2, 3 or 4 means **simple** time. ${top} is one of those, so this is simple time. Each beat splits into **two**.`
          : `**Step 1: simple or compound?** A top number of 6, 9 or 12 means **compound** time. ${top} is one of those, so this is compound time. Each beat splits into **three**.`,
    },
    {
      text:
        w.kind === 'simple'
          ? `**Step 2: how many beats?** In simple time the top number is the number of beats: **${w.pulses}**.`
          : `**Step 2: how many beats?** In compound time divide the top number by 3: ${top} ÷ 3 = **${w.pulses}**.`,
    },
    { text: `**Step 3: name the number of beats.** 2 beats is **duple**, 3 beats is **triple**, 4 beats is **quadruple**. ${w.pulses} beats is **${w.grouping}**.` },
    { text: `**Step 4: put the two words together:** ${w.kind} + ${w.grouping} = **${w.kind} ${w.grouping}**.` },
    {
      text:
        w.kind === 'simple'
          ? `Check: the beat is a ${w.pulseNote} (${w.pulseSemis} semiquavers) and it splits into ${halves}. ${w.pulses} beats × ${w.pulseSemis} = ${w.bar} semiquavers, the length of the bar.`
          : `Check: the beat is a ${w.pulseNote} (${w.pulseSemis} semiquavers) and it splits into three ${w.unit}s (3 × ${w.unitSemis} = ${w.pulseSemis}). ${w.pulses} beats × ${w.pulseSemis} = ${w.bar} semiquavers, the length of the bar.`,
    },
  ]
  return {
    title: 'The type of a time signature',
    task: `What type of time signature is ${w.name}?`,
    steps,
    answer: `${w.name} is ${w.kind} ${w.grouping}.`,
  }
}

/** Length in semiquavers built by hand: the note, plus half of it for the first dot, plus half of that for the second. */
function lengthByHand(figure: Figure): number {
  const dots = figure.dots ?? 0
  const base = NOTE_VALUES.find((v) => v.name === figure.name)!.semiquavers
  let length = base
  let add = base
  for (let i = 0; i < dots; i++) {
    add /= 2
    length += add
  }
  if (!Number.isInteger(length)) throw new RangeError(`A ${noteValueLabel(figure.name, dots)} is not a whole number of semiquavers`)
  if (length !== dottedSemiquavers(figure.name, dots)) throw new Error('Note length disagrees with the theory engine')
  return length
}

/** The notes that fill a bar one main beat at a time (used when no notes are given). */
function defaultFill(w: Working): Figure[] {
  const figure: Figure =
    w.kind === 'simple'
      ? { name: w.unit }
      : { name: NOTE_VALUES.find((v) => v.semiquavers === (w.pulseSemis * 2) / 3)!.name, dots: 1 }
  return Array.from({ length: w.pulses }, () => figure)
}

function fillExample(ts: TimeSignature, w: Working, notes: readonly Figure[]): WorkedExample {
  if (notes.some((n) => n.rest)) throw new RangeError('Fill the bar with notes, not rests')
  const lengths = notes.map(lengthByHand)
  const total = lengths.reduce((a, b) => a + b, 0)
  if (total !== w.bar) throw new RangeError(`These notes add up to ${total} semiquavers, but a bar of ${w.name} is ${w.bar}`)
  const labels = notes.map((n) => noteValueLabel(n.name, n.dots ?? 0))
  const workings = notes.map((n, i) => {
    const base = NOTE_VALUES.find((v) => v.name === n.name)!.semiquavers
    const dots = n.dots ?? 0
    if (dots === 0) return `${labels[i]} = ${lengths[i]}`
    const parts = [base]
    let add = base
    for (let d = 0; d < dots; d++) {
      add /= 2
      parts.push(add)
    }
    return `${labels[i]} = ${parts.join(' + ')} = ${lengths[i]}`
  })

  // Where each note starts, in beats.
  let start = 0
  const where = notes.map((_, i) => {
    const beat = Math.floor(start / w.pulseSemis) + 1
    const exact = start % w.pulseSemis === 0
    const text = `the ${labels[i]} starts ${exact ? 'on' : 'part-way through'} beat ${beat}`
    start += lengths[i]!
    return text
  })

  const running = lengths.map((_, i) => lengths.slice(0, i + 1).reduce((a, b) => a + b, 0))
  const steps: WorkedStep[] = [
    { text: `Here is an empty bar of **${w.name}**. We need to fill it exactly.`, staff: timeSignatureStaff(ts, []) },
    {
      text: `**Length of the bar.** The bottom number ${ts.unit} means ${w.unit}s, and one ${w.unit} is ${w.unitSemis} semiquaver${w.unitSemis === 1 ? '' : 's'}. The top number ${ts.beats} says how many fit in the bar: ${ts.beats} × ${w.unitSemis} = **${w.bar} semiquavers**.`,
    },
    {
      text: `**Length of each note we will use**, in semiquavers (a dot adds half): ${workings.join('; ')}.`,
    },
    {
      text: `**Add them up** in order: ${lengths.join(' + ')} = **${total}**. Running totals: ${running.join(', ')}. The bar needs ${w.bar}, so the bar is exactly full.`,
    },
    { text: `Write the notes in the bar.`, staff: timeSignatureStaff(ts, notes) },
    {
      text: `Check: ${total} = ${w.bar}, so nothing is missing and nothing spills over. The beats are ${w.pulseNote}s (${w.pulseSemis} semiquavers each), ${w.pulses} in the bar: ${where.join('; ')}.`,
    },
  ]
  return {
    title: `Fill a bar of ${w.name}`,
    task: `Fill one bar of ${w.name} using note values that add up exactly to the bar.`,
    steps,
    answer: `A bar of ${w.name} can be filled with ${andList(labels.map((l) => `a ${l}`))}: ${lengths.join(' + ')} = ${w.bar} semiquavers (${beatsText(w.bar / 4)} crotchet beats).`,
  }
}

/**
 * A worked example about one time signature.
 * `beats`: how many main beats in a bar. `classify`: simple or compound, and duple, triple or quadruple.
 * `fill`: fill one bar with notes (pass `notes`, or the bar is filled one main beat at a time).
 * Throws unless the top number is 2, 3, 4, 6, 9 or 12, or if the notes do not add up to a full bar.
 */
export function timeSignatureExample(ts: TimeSignature, task: TimeTask, notes?: readonly Figure[]): WorkedExample {
  const w = work(ts)
  if (task === 'beats') return beatsExample(ts, w)
  if (task === 'classify') return classifyExample(ts, w)
  return fillExample(ts, w, notes ?? defaultFill(w))
}
