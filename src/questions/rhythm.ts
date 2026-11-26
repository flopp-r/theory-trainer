import {
  NOTE_VALUES,
  type NoteValueName,
  type TimeSignature,
  dottedCrotchets,
  formatTimeSignature,
  noteValue,
  noteValueLabel,
  parseTimeSignature,
  pitchAtPosition,
  restLabel,
  timeSignatureInfo,
  timeSignatureTypeLabel,
} from '../theory'
import { multipleChoice } from './helpers'
import type { Duration, Question, QuestionContext, QuestionGenerator } from './types'

interface Figure {
  readonly name: NoteValueName
  readonly dots: number
}

/** Which note and rest values (with dots) can be asked at each level. */
function figuresFor(difficulty: 1 | 2 | 3): Figure[] {
  const plain = NOTE_VALUES.map((v) => ({ name: v.name, dots: 0 }))
  if (difficulty === 1) return plain
  const dotted: Figure[] = [
    { name: 'minim', dots: 1 },
    { name: 'crotchet', dots: 1 },
    { name: 'quaver', dots: 1 },
  ]
  if (difficulty === 2) return [...plain, ...dotted]
  return [...plain, ...dotted, { name: 'semibreve', dots: 1 }, { name: 'minim', dots: 2 }, { name: 'crotchet', dots: 2 }]
}

const key = (f: Figure) => `${f.name}-${f.dots}`

/** A note of this value sits on the middle line of the clef, so the clef hardly matters for rhythm questions. */
function rhythmStaff(ctx: QuestionContext) {
  return ctx.rng.pick(ctx.clefs)
}

const NOTE_LOOKS: Record<NoteValueName, string> = {
  semibreve: 'A semibreve is a hollow note head with no stem.',
  minim: 'A minim is a hollow note head with a stem.',
  crotchet: 'A crotchet is a filled-in note head with a stem.',
  quaver: 'A quaver is a filled-in note head with a stem and one flag.',
  semiquaver: 'A semiquaver is a filled-in note head with a stem and two flags.',
}

const REST_LOOKS: Record<NoteValueName, string> = {
  semibreve: 'A semibreve rest is a small block hanging below a line.',
  minim: 'A minim rest is a small block sitting on top of a line.',
  crotchet: 'A crotchet rest is a squiggly, zigzag shape.',
  quaver: 'A quaver rest is a slanted stroke with one hook (flag).',
  semiquaver: 'A semiquaver rest is a slanted stroke with two hooks (flags).',
}

function dotText(dots: number): string {
  if (dots === 0) return ''
  return dots === 1
    ? ' The dot after it makes it half as long again.'
    : ' The two dots make it longer: the first adds half, the second adds a quarter.'
}

/** Picks wrong answers with at least one that looks similar (same value, different dots), if there is one. */
function similarTrap(figures: Figure[], correct: Figure): string[] {
  const sameValue = figures.filter((f) => f.name === correct.name && f.dots !== correct.dots)
  return sameValue.map((f) => noteValueLabel(f.name, f.dots))
}

function generateNoteValue(ctx: QuestionContext): Question {
  const { rng } = ctx
  const figures = figuresFor(ctx.difficulty)
  const figure = rng.pick(figures)
  const clef = rhythmStaff(ctx)
  const correct = noteValueLabel(figure.name, figure.dots)
  const labels = figures.map((f) => noteValueLabel(f.name, f.dots))
  const { input } = multipleChoice(rng, correct, labels, { layout: 'grid', prefer: similarTrap(figures, figure) })
  const value = noteValue(figure.name)
  return {
    id: `note-value:${key(figure)}`,
    type: 'note-value',
    topic: 'rhythm',
    category: 'Note values',
    itemLabel: correct,
    tags: ['aqa-candidate'],
    prompt: 'What is the name of this note?',
    notation: {
      staves: [
        { clef, items: [{ kind: 'notes', pitches: [pitchAtPosition(4, clef)], duration: value.vex as Duration, dots: figure.dots }] },
      ],
    },
    audio: null,
    input,
    correct,
    answerText: `It is a ${correct}.`,
    explanation: `${NOTE_LOOKS[figure.name]}${dotText(figure.dots)} It lasts ${beatsLabel(dottedCrotchets(figure.name, figure.dots))} crotchet beat${dottedCrotchets(figure.name, figure.dots) === 1 ? '' : 's'}. (American name: ${value.american}.)`,
  }
}

export const noteValueGenerator: QuestionGenerator = {
  type: 'note-value',
  topic: 'rhythm',
  label: 'Note values',
  generate: generateNoteValue,
}

function generateRestValue(ctx: QuestionContext): Question {
  const { rng } = ctx
  // Dotted rests are rare in practice; they only appear at the hardest level.
  const figures = figuresFor(ctx.difficulty === 3 ? 2 : 1)
  const figure = rng.pick(figures)
  const clef = rhythmStaff(ctx)
  const correct = restLabel(figure.name, figure.dots)
  const labels = figures.map((f) => restLabel(f.name, f.dots))
  const trap = figures.filter((f) => f.name === figure.name && f.dots !== figure.dots).map((f) => restLabel(f.name, f.dots))
  const { input } = multipleChoice(rng, correct, labels, { layout: 'grid', prefer: trap })
  const value = noteValue(figure.name)
  return {
    id: `rest-value:${key(figure)}`,
    type: 'rest-value',
    topic: 'rhythm',
    category: 'Rest values',
    itemLabel: correct,
    tags: ['aqa-candidate'],
    prompt: 'What is the name of this rest?',
    notation: { staves: [{ clef, items: [{ kind: 'rest', duration: value.vex as Duration, dots: figure.dots }] }] },
    audio: null,
    input,
    correct,
    answerText: `It is a ${correct}.`,
    explanation: `${REST_LOOKS[figure.name]}${dotText(figure.dots)} A rest is silence for the same length as the note of the same name.`,
  }
}

export const restValueGenerator: QuestionGenerator = {
  type: 'rest-value',
  topic: 'rhythm',
  label: 'Rest values',
  generate: generateRestValue,
}

const BEAT_LABELS: Record<number, string> = {
  0.25: '¼',
  0.5: '½',
  0.75: '¾',
  1.5: '1½',
  1.75: '1¾',
  3.5: '3½',
}

/** Beats as written on a button: ½, 1, 1½, 2, 3 ... */
export function beatsLabel(beats: number): string {
  return BEAT_LABELS[beats] ?? String(beats)
}

const BEAT_ANSWERS = [0.25, 0.5, 0.75, 1, 1.5, 2, 3, 4, 6]

function generateNoteBeats(ctx: QuestionContext): Question {
  const { rng } = ctx
  const figure = rng.pick(figuresFor(ctx.difficulty))
  const clef = rhythmStaff(ctx)
  const beats = dottedCrotchets(figure.name, figure.dots)
  const correct = beatsLabel(beats)
  const pool = [...BEAT_ANSWERS, ...(ctx.difficulty === 3 ? [1.75, 3.5] : [])]
  // A good wrong answer for a dotted note is the undotted value.
  const undotted = beatsLabel(dottedCrotchets(figure.name, 0))
  const { input } = multipleChoice(rng, correct, pool.map(beatsLabel), {
    layout: 'grid',
    prefer: figure.dots > 0 ? [undotted] : [],
  })
  const plural = beats === 1 ? 'crotchet beat' : 'crotchet beats'
  const name = noteValueLabel(figure.name, figure.dots)
  const value = noteValue(figure.name)
  return {
    id: `note-beats:${key(figure)}`,
    type: 'note-beats',
    topic: 'rhythm',
    category: 'Counting beats',
    itemLabel: `${name}`,
    tags: ['aqa-candidate'],
    prompt: 'How many crotchet beats is this note worth?',
    notation: {
      staves: [
        { clef, items: [{ kind: 'notes', pitches: [pitchAtPosition(4, clef)], duration: value.vex as Duration, dots: figure.dots }] },
      ],
    },
    audio: null,
    input,
    correct,
    answerText: `It is worth ${correct} ${plural}.`,
    explanation: `This is a ${name}. A ${figure.name} is worth ${beatsLabel(dottedCrotchets(figure.name, 0))} crotchet beat${dottedCrotchets(figure.name, 0) === 1 ? '' : 's'}.${dotText(figure.dots)} ${figure.dots > 0 ? `Altogether: ${correct} ${plural}.` : ''}`.trim(),
  }
}

export const noteBeatsGenerator: QuestionGenerator = {
  type: 'note-beats',
  topic: 'rhythm',
  label: 'Counting beats',
  generate: generateNoteBeats,
}

/** Time signatures available at each level. */
function timeSignaturesFor(difficulty: 1 | 2 | 3, includeCompound: boolean): TimeSignature[] {
  const simple = ['2/4', '3/4', '4/4']
  const compound = ['6/8']
  const more = ['2/2', '3/8', '9/8', '12/8']
  const hard = ['3/2', '6/4']
  const names =
    difficulty === 1
      ? [...simple, ...(includeCompound ? compound : [])]
      : difficulty === 2
        ? [...simple, ...compound, ...more]
        : [...simple, ...compound, ...more, ...hard]
  return names.map(parseTimeSignature)
}

const UNIT_NAMES: Record<number, string> = { 2: 'minim', 4: 'crotchet', 8: 'quaver', 16: 'semiquaver' }

function generateTimeSigBeats(ctx: QuestionContext): Question {
  const { rng } = ctx
  const ts = rng.pick(timeSignaturesFor(ctx.difficulty, false))
  const clef = rhythmStaff(ctx)
  const info = timeSignatureInfo(ts)
  const name = formatTimeSignature(ts)
  const correct = String(info.pulses)
  // The top number is a tempting wrong answer in compound time.
  const trap = info.kind === 'compound' ? [String(ts.beats)] : []
  const { input } = multipleChoice(rng, correct, ['1', '2', '3', '4', '6', '9', '12'], { layout: 'grid', prefer: trap })
  const why =
    info.kind === 'simple'
      ? `The top number says how many beats are in a bar, and the bottom number says which note lasts one beat (${ts.unit} means a ${UNIT_NAMES[ts.unit]}). So ${name} has ${info.pulses} ${UNIT_NAMES[ts.unit]} beats in each bar.`
      : `${name} is compound time: the ${UNIT_NAMES[ts.unit]}s are grouped in threes, so each beat is a ${info.pulseNote}. ${ts.beats} ÷ 3 = ${info.pulses} beats in each bar.`
  return {
    id: `time-sig-beats:${name}`,
    type: 'time-sig-beats',
    topic: 'rhythm',
    category: 'Time signatures',
    itemLabel: `beats in ${name}`,
    tags: ['aqa-candidate'],
    prompt: 'How many main beats are in each bar? (The beats you would tap.)',
    notation: { staves: [{ clef, time: ts, items: [] }] },
    audio: null,
    input,
    correct,
    answerText: `There ${info.pulses === 1 ? 'is' : 'are'} ${info.pulses}.`,
    explanation: why,
  }
}

export const timeSigBeatsGenerator: QuestionGenerator = {
  type: 'time-sig-beats',
  topic: 'rhythm',
  label: 'Beats in a bar',
  generate: generateTimeSigBeats,
}

const TYPE_LABELS = ['simple duple', 'simple triple', 'simple quadruple', 'compound duple', 'compound triple', 'compound quadruple']

function generateTimeSigType(ctx: QuestionContext): Question {
  const { rng } = ctx
  const ts = rng.pick(timeSignaturesFor(ctx.difficulty, true))
  const clef = rhythmStaff(ctx)
  const info = timeSignatureInfo(ts)
  const name = formatTimeSignature(ts)
  const correct = timeSignatureTypeLabel(ts)
  const otherKind = `${info.kind === 'simple' ? 'compound' : 'simple'} ${info.grouping}`
  const sameKind = TYPE_LABELS.filter((l) => l.startsWith(info.kind) && l !== correct)
  const { input } = multipleChoice(rng, correct, TYPE_LABELS, { layout: 'grid', prefer: [otherKind, ...sameKind] })
  const why =
    info.kind === 'simple'
      ? `A top number of 2, 3 or 4 means simple time: each beat divides into two. ${info.pulses} beats in a bar is ${info.grouping}.`
      : `A top number of 6, 9 or 12 means compound time: each beat divides into three (the ${UNIT_NAMES[ts.unit]}s are grouped in threes). ${ts.beats} ÷ 3 = ${info.pulses} beats in a bar, which is ${info.grouping}.`
  return {
    id: `time-sig-type:${name}`,
    type: 'time-sig-type',
    topic: 'rhythm',
    category: 'Time signatures',
    itemLabel: `type of ${name}`,
    tags: ['aqa-candidate'],
    prompt: 'What type of time signature is this?',
    notation: { staves: [{ clef, time: ts, items: [] }] },
    audio: null,
    input,
    correct,
    answerText: `It is ${correct}.`,
    explanation: `${name}: ${why}`,
  }
}

export const timeSigTypeGenerator: QuestionGenerator = {
  type: 'time-sig-type',
  topic: 'rhythm',
  label: 'Time signature types',
  generate: generateTimeSigType,
}

