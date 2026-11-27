import type { WorkedExample, WorkedStep, WorkedTerm } from '../types'
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

/** A picture of a bar: the time signature, and notes if there are any. */
export function timeSignatureStaff(ts: TimeSignature, figures: readonly Figure[]) {
  return { ...figuresOnStaff(figures), time: ts }
}

const withArticle = (phrase: string) => `${/^[aeiou]/i.test(phrase) ? 'an' : 'a'} ${phrase}`
const capital = (text: string) => text.charAt(0).toUpperCase() + text.slice(1)
const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`
const ORDINAL_WORDS = ['First', 'Second', 'Third', 'Fourth', 'Fifth', 'Sixth', 'Seventh', 'Eighth', 'Ninth', 'Tenth', 'Eleventh', 'Twelfth']
const NUMBER_WORDS: Record<number, string> = { 2: 'two', 3: 'three', 4: 'four', 5: 'five', 6: 'six' }

/* "Words you need" for the time signature builders. */
const TIME_SIGNATURE_TERM: WorkedTerm = {
  term: 'Time signature',
  meaning: 'The two numbers at the start of the music. The bottom number names a note value; the top number says how many of them fill a bar.',
}
const BAR_TERM: WorkedTerm = { term: 'Bar', meaning: 'A short section of music between two bar lines (thin upright lines). Every bar in a piece has the same length.' }
const BEAT_TERM: WorkedTerm = { term: 'Beat', meaning: 'The steady pulse of the music, the one you would tap your foot to. The main beats are the beats you tap.' }
const SEMIBREVE_TERM: WorkedTerm = { term: 'Semibreve', meaning: 'A note that lasts 4 crotchet beats. The bottom number of a time signature counts how many of a note fill one semibreve.' }
const SIMPLE_TERM: WorkedTerm = { term: 'Simple time', meaning: 'Time in which each beat splits into two equal halves. The top number is 2, 3 or 4.' }
const COMPOUND_TERM: WorkedTerm = { term: 'Compound time', meaning: 'Time in which each beat splits into three equal parts. The top number is 6, 9 or 12, and each beat is a dotted note.' }
const DOTTED_TERM: WorkedTerm = { term: 'Dotted', meaning: "A dot after a note adds half of the note's own length. A dotted crotchet lasts as long as 3 quavers." }
const SEMIQUAVER_TERM: WorkedTerm = { term: 'Semiquaver', meaning: 'The shortest note in this lesson, ¼ of a crotchet beat. 16 semiquavers fill a semibreve.' }
const GROUPING_TERMS: Record<string, WorkedTerm> = {
  duple: { term: 'Duple', meaning: 'Two main beats in each bar. Triple means three, and quadruple means four.' },
  triple: { term: 'Triple', meaning: 'Three main beats in each bar. Duple means two, and quadruple means four.' },
  quadruple: { term: 'Quadruple', meaning: 'Four main beats in each bar. Duple means two, and triple means three.' },
}

/** "4 crotchets fill a semibreve (4 × 1 = 4 beats), so 4 means a crotchet." */
function bottomNumberText(ts: TimeSignature, w: Working): string {
  const each = beatsText(4 / ts.unit)
  if (NOTE_VALUES.find((v) => v.name === w.unit)!.semiquavers * ts.unit !== 16) throw new Error('The bottom number must fill a semibreve')
  return `The bottom number names a note by how many of it fill a semibreve (a note of 4 crotchet beats). ${ts.unit} ${w.unit}s fill a semibreve (${ts.unit} × ${each} = 4 beats), so ${ts.unit} means ${withArticle(w.unit)}.`
}

/** "simple or compound?", as a step. */
function kindStep(ts: TimeSignature, w: Working): WorkedStep {
  return {
    title: 'Decide: simple or compound time',
    text: `A top number of 2, 3 or 4 means simple time (each beat splits into two). A top number of 6, 9 or 12 means compound time (each beat splits into three). The top number here is ${ts.beats}, so this is ${w.kind} time.`,
    result: `${capital(w.kind)} time`,
  }
}

/** The beat note in compound time: three bottom-number notes make one dotted note. Worked out by hand and checked. */
function compoundBeatText(w: Working): string {
  const unit = NOTE_VALUES.find((v) => v.name === w.unit)!
  const longer = NOTE_VALUES.find((v) => v.semiquavers === unit.semiquavers * 2)
  if (!longer || `dotted ${longer.name}` !== w.pulseNote || unit.semiquavers * 3 !== w.pulseSemis) throw new Error('The compound beat note disagrees with the theory engine')
  return `Three ${w.unit}s last as long as a ${w.pulseNote}: a ${longer.name} is 2 ${w.unit}s, and its dot (a dot adds half of a note's length) adds 1 more ${w.unit}. 2 + 1 = 3.`
}

/** The semiquaver check: bar length ÷ length of one beat = number of beats. Used for compound time. */
function lengthCheck(ts: TimeSignature, w: Working): string {
  const unit = NOTE_VALUES.find((v) => v.name === w.unit)!
  const longer = NOTE_VALUES.find((v) => v.semiquavers === unit.semiquavers * 2)!
  if (w.bar / w.pulseSemis !== w.pulses) throw new Error('Bar length divided by the beat does not give the beats')
  return `Measure in semiquavers (16 fill a semibreve). A ${w.unit} is ${w.unitSemis}, so the bar is ${ts.beats} × ${w.unitSemis} = ${w.bar}. A ${w.pulseNote} is ${longer.semiquavers} + ${w.unitSemis} = ${w.pulseSemis}. ${w.bar} ÷ ${w.pulseSemis} = ${w.pulses} beats.`
}

/** "1 & 2 & 3 &": counting a bar of simple time aloud in half-beats. */
function countAloud(w: Working): { text: string; halves: number; half: string } {
  const half = NOTE_VALUES.find((v) => v.semiquavers * 2 === w.pulseSemis)
  const halves = w.pulses * 2
  if (halves * w.pulseSemis / 2 !== w.bar) throw new Error('Half-beats do not fill the bar')
  const words = Array.from({ length: w.pulses }, (_, i) => `${i + 1} &`).join(' ')
  return { text: words, halves, half: half ? half.name : 'half-beat' }
}

function beatsExample(ts: TimeSignature, w: Working): WorkedExample {
  const top = ts.beats
  const steps: WorkedStep[] = [
    {
      title: 'Read the two numbers',
      text: `The time signature (the two numbers at the start of the music) is ${w.name}. The top number is ${top} and the bottom number is ${ts.unit}.`,
      result: `Top ${top}, bottom ${ts.unit}`,
      staff: timeSignatureStaff(ts, []),
    },
    { title: 'Turn the bottom number into a note', text: bottomNumberText(ts, w), result: `${ts.unit} means ${withArticle(w.unit)}` },
    kindStep(ts, w),
  ]
  if (w.kind === 'simple') {
    steps.push({
      title: 'Read the beats from the top number',
      text: `In simple time the top number is the number of beats (the pulse you tap) in a bar (the music between two bar lines). Each beat is one ${w.unit}. So there are ${top} beats.`,
      result: `${top} ${w.unit} beats in a bar`,
    })
    const aloud = countAloud(w)
    steps.push({
      title: 'Check by counting the bar aloud',
      text: `Each beat splits into two ${aloud.half}s, so count the bar in ${aloud.half}s, saying "&" for the second half of each beat: ${aloud.text}. That is ${aloud.halves} ${aloud.half}s, and ${aloud.halves} ÷ 2 = ${w.pulses} beats.`,
      result: `${w.pulses} beats again`,
    })
  } else {
    steps.push(
      {
        title: `Group the ${w.unit}s in threes`,
        text: `In compound time the top number counts ${w.unit}s, not beats. A bar (the music between two bar lines) holds ${top} ${w.unit}s, grouped in threes: ${top} ÷ 3 = ${w.pulses} groups. Each group is one main beat (a beat you tap).`,
        result: `${w.pulses} main beats`,
      },
      { title: 'Name the beat note', text: compoundBeatText(w), result: `Each beat is a ${w.pulseNote}` },
      { title: 'Check by measuring in semiquavers', text: lengthCheck(ts, w), result: `${w.pulses} beats again` },
    )
  }
  const terms: WorkedTerm[] = [TIME_SIGNATURE_TERM, BAR_TERM, BEAT_TERM, SEMIBREVE_TERM, w.kind === 'simple' ? SIMPLE_TERM : COMPOUND_TERM]
  if (w.kind === 'compound') terms.push(DOTTED_TERM, SEMIQUAVER_TERM)
  return {
    title: 'Beats in a bar',
    task: `How many main beats are in each bar of ${w.name}? (The beats you would tap.)`,
    terms,
    steps,
    answer: `There ${w.pulses === 1 ? 'is' : 'are'} ${plural(w.pulses, 'main beat')} in each bar.`,
  }
}

function classifyExample(ts: TimeSignature, w: Working): WorkedExample {
  const top = ts.beats
  const steps: WorkedStep[] = [
    {
      title: 'Read the top number',
      text: `The time signature (the two numbers at the start of the music) is ${w.name}. The top number is ${top}.`,
      result: `Top number ${top}`,
      staff: timeSignatureStaff(ts, []),
    },
    kindStep(ts, w),
    w.kind === 'simple'
      ? {
          title: 'Find the number of main beats',
          text: `In simple time the top number is the number of beats (the pulses you tap) in each bar: ${top}.`,
          result: `${plural(w.pulses, 'main beat')}`,
        }
      : {
          title: 'Find the number of main beats',
          text: `In compound time the top number counts ${w.unit}s (from the bottom number ${ts.unit}), grouped in threes. Each group is one beat (a pulse you tap). Divide by 3: ${top} ÷ 3 = ${w.pulses}.`,
          result: `${plural(w.pulses, 'main beat')}`,
        },
    {
      title: 'Name the number of beats',
      text: `Two main beats in a bar is duple, three is triple, four is quadruple. Here there ${w.pulses === 1 ? 'is' : 'are'} ${NUMBER_WORDS[w.pulses] ?? w.pulses}, so it is ${w.grouping}.`,
      result: capital(w.grouping),
    },
    {
      title: 'Put the two words together',
      text: `Say the kind of time first and the number of beats second: ${w.kind} and ${w.grouping}.`,
      result: capital(`${w.kind} ${w.grouping}`),
    },
  ]
  if (w.kind === 'simple') {
    const aloud = countAloud(w)
    steps.push({
      title: 'Check by counting the bar aloud',
      text: `The beat is ${withArticle(w.pulseNote)}, and it splits into two ${aloud.half}s, not three: that is simple time. Count aloud with "&" on each second half: ${aloud.text}. That is ${NUMBER_WORDS[w.pulses] ?? w.pulses} beats, so ${w.grouping}.`,
      result: capital(`${w.kind} ${w.grouping} again`),
    })
  } else {
    steps.push({
      title: 'Check by measuring in semiquavers',
      text: `${lengthCheck(ts, w)} That is ${w.grouping}. Each beat is three ${w.unit}s (3 × ${w.unitSemis} = ${w.pulseSemis}), so it is compound.`,
      result: capital(`${w.kind} ${w.grouping} again`),
    })
  }
  const terms: WorkedTerm[] = [TIME_SIGNATURE_TERM, BEAT_TERM, w.kind === 'simple' ? SIMPLE_TERM : COMPOUND_TERM, GROUPING_TERMS[w.grouping]!]
  if (w.kind === 'compound') terms.push(SEMIQUAVER_TERM)
  return {
    title: 'The type of a time signature',
    task: `What type of time signature is ${w.name}?`,
    terms,
    steps,
    answer: `${w.name} is ${w.kind} ${w.grouping}.`,
  }
}

/** Length in semiquavers built by hand: the note, plus half of it for the first dot, plus half of that for the second. */
function lengthByHand(figure: Figure): { length: number; text: string } {
  const dots = figure.dots ?? 0
  const value = NOTE_VALUES.find((v) => v.name === figure.name)!
  const fit = 16 / value.semiquavers // how many of this note fill a semibreve
  const base = 16 / fit
  let length = base
  let add = base
  const adds: number[] = []
  for (let i = 0; i < dots; i++) {
    add /= 2
    adds.push(add)
    length += add
  }
  if (!Number.isInteger(length)) throw new RangeError(`A ${noteValueLabel(figure.name, dots)} is not a whole number of semiquavers`)
  if (length !== dottedSemiquavers(figure.name, dots)) throw new Error('Note length disagrees with the theory engine')
  const baseText = fit === 1 ? `A ${figure.name} is 16 semiquavers.` : `${fit} ${figure.name}s fill a semibreve, so a ${figure.name} is 16 ÷ ${fit} = ${base} semiquaver${base === 1 ? '' : 's'}.`
  const dotText =
    dots === 0
      ? ''
      : ` The ${dots === 1 ? 'dot adds half of that' : 'dots add half, then half again'}: ${adds.map((a, i) => `${i === 0 ? base : adds[i - 1]!} ÷ 2 = ${a}`).join(', then ')}. ${[base, ...adds].join(' + ')} = ${length}.`
  return { length, text: `${baseText}${dotText}` }
}

/** The notes that fill a bar one main beat at a time (used when no notes are given). */
function defaultFill(w: Working): Figure[] {
  const figure: Figure =
    w.kind === 'simple'
      ? { name: w.unit }
      : { name: NOTE_VALUES.find((v) => v.semiquavers === (w.pulseSemis * 2) / 3)!.name, dots: 1 }
  return Array.from({ length: w.pulses }, () => figure)
}

/** Groups notes into whole beats for the check: "the minim (8) covers beats 1 and 2". Throws if the notes do not line up with the beats. */
function beatGroups(labels: readonly string[], lengths: readonly number[], w: Working): string[] {
  const groups: string[] = []
  let start = 0
  let members: number[] = []
  let sum = 0
  lengths.forEach((length, i) => {
    members.push(i)
    sum += length
    if (sum % w.pulseSemis === 0) {
      const first = start / w.pulseSemis + 1
      const last = (start + sum) / w.pulseSemis
      const beats = first === last ? `beat ${first}` : last === first + 1 ? `beats ${first} and ${last}` : `beats ${first} to ${last}`
      const same = members.every((m) => labels[m] === labels[members[0]!])
      const names = members.length === 1 ? `the ${labels[i]}` : same && NUMBER_WORDS[members.length] ? `the ${NUMBER_WORDS[members.length]} ${labels[i]}s` : `the ${andList(members.map((m) => labels[m]!))}`
      const lengthText = members.length === 1 ? `${sum}` : `${members.map((m) => lengths[m]).join(' + ')} = ${sum}`
      groups.push(`${names} (${lengthText}) ${members.length === 1 && first === last ? 'fills' : first === last ? 'fill' : members.length === 1 ? 'covers' : 'cover'} ${beats}`)
      start += sum
      members = []
      sum = 0
    }
  })
  if (members.length > 0) throw new RangeError('The notes do not line up with the beats')
  return groups
}

function fillExample(ts: TimeSignature, w: Working, notes: readonly Figure[]): WorkedExample {
  if (notes.some((n) => n.rest)) throw new RangeError('Fill the bar with notes, not rests')
  if (notes.length > ORDINAL_WORDS.length) throw new RangeError('Too many notes for one example')
  const works = notes.map(lengthByHand)
  const lengths = works.map((x) => x.length)
  const total = lengths.reduce((a, b) => a + b, 0)
  if (total !== w.bar) throw new RangeError(`These notes add up to ${total} semiquavers, but a bar of ${w.name} is ${w.bar}`)
  const labels = notes.map((n) => noteValueLabel(n.name, n.dots ?? 0))
  const groups = beatGroups(labels, lengths, w)

  const running: string[] = []
  let sum = lengths[0]!
  for (const length of lengths.slice(1)) {
    running.push(`${sum} + ${length} = ${sum + length}`)
    sum += length
  }
  const hasDot = notes.some((n) => (n.dots ?? 0) > 0)
  const fit = ts.unit
  const steps: WorkedStep[] = [
    {
      title: 'Read the time signature',
      text: `The time signature (the two numbers at the start) is ${w.name}. The bottom number ${ts.unit} means ${w.unit}s (${ts.unit} of them fill a semibreve). The top number says a bar holds ${ts.beats} of them.`,
      result: `A bar holds ${ts.beats} ${w.unit}s`,
      staff: timeSignatureStaff(ts, []),
    },
    {
      title: 'Work out the bar length in semiquavers',
      text: `Measure in semiquavers (the shortest note here; 16 fill a semibreve), so every length is a whole number. ${fit} ${w.unit}s fill a semibreve, so a ${w.unit} is 16 ÷ ${fit} = ${w.unitSemis}. The bar holds ${ts.beats}: ${ts.beats} × ${w.unitSemis} = ${w.bar}.`,
      result: `The bar is ${w.bar} semiquavers`,
    },
    ...notes.map((_, i) => ({
      title: `${ORDINAL_WORDS[i]} note: the ${labels[i]}`,
      text: labels.indexOf(labels[i]!) < i ? `Another ${labels[i]}, the same length as note ${labels.indexOf(labels[i]!) + 1}: ${lengths[i]} semiquaver${lengths[i] === 1 ? '' : 's'}.` : works[i]!.text,
      result: `${lengths[i]} semiquaver${lengths[i] === 1 ? '' : 's'}`,
    })),
    {
      title: 'Add the lengths with a running total',
      text: `Add one note at a time: ${running.join(', then ')}. The bar needs ${w.bar}, so it is exactly full: nothing missing, nothing spilling over.`,
      result: `${total} semiquavers: the bar is full`,
    },
    { title: 'Write the notes in the bar', text: `Write the notes in order after the time signature: ${labels.join(', ')}.`, result: capital(labels.join(', ')), staff: timeSignatureStaff(ts, notes) },
    {
      title: 'Check beat by beat',
      text: `Now check against the beats instead of the total. ${w.name} has ${plural(w.pulses, 'beat')}, each ${withArticle(w.pulseNote)} (${w.pulseSemis} semiquavers). ${capital(groups.join('; '))}. Every beat is filled.`,
      result: w.pulses === 2 ? 'Both beats are filled' : `All ${w.pulses} beats are filled`,
    },
  ]
  const terms: WorkedTerm[] = [TIME_SIGNATURE_TERM, BAR_TERM, SEMIBREVE_TERM, SEMIQUAVER_TERM, BEAT_TERM]
  if (hasDot) terms.push(DOTTED_TERM)
  return {
    title: `Fill a bar of ${w.name}`,
    task: `Fill one bar of ${w.name} using note values that add up exactly to the bar.`,
    terms,
    steps,
    answer: `A bar of ${w.name} can be filled with ${andList(labels.map((l) => withArticle(l)))}: ${lengths.join(' + ')} = ${w.bar} semiquavers (${beatsText(w.bar / 4)} crotchet beats).`,
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
