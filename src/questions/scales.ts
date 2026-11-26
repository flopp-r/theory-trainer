import {
  type Key,
  type NoteName,
  SCALE_LABELS,
  type ScaleType,
  enharmonicSpellings,
  isStandardKey,
  formatNote,
  keyFromFifths,
  keyFifths,
  pitch,
  scaleDegreeName,
  scaleNotes,
  withoutOctave,
} from '../theory'
import { at } from '../theory/util'
import { multipleChoice } from './helpers'
import { keysForDifficulty, noteLabel, notesLabel } from './pitchTools'
import type { Difficulty, Question, QuestionContext, QuestionGenerator } from './types'

function scaleTypesFor(difficulty: Difficulty): ScaleType[] {
  if (difficulty === 1) return ['major']
  if (difficulty === 2) return ['major', 'natural-minor', 'major-pentatonic', 'minor-pentatonic']
  return ['major', 'natural-minor', 'harmonic-minor', 'melodic-minor', 'major-pentatonic', 'minor-pentatonic', 'blues']
}

const MAJOR_BASED: readonly ScaleType[] = ['major', 'major-pentatonic']

const HOW_BUILT: Record<ScaleType, string> = {
  major: 'A major scale goes tone, tone, semitone, tone, tone, tone, semitone.',
  'natural-minor': 'A natural minor scale goes tone, semitone, tone, tone, semitone, tone, tone.',
  'harmonic-minor': 'A harmonic minor scale is the natural minor with the 7th note raised by a semitone.',
  'melodic-minor': 'Going up, a melodic minor scale is the natural minor with the 6th and 7th notes raised by a semitone.',
  'major-pentatonic': 'A major pentatonic scale uses the 1st, 2nd, 3rd, 5th and 6th notes of the major scale.',
  'minor-pentatonic': 'A minor pentatonic scale uses the 1st, 3rd, 4th, 5th and 7th notes of the natural minor scale.',
  blues: 'A blues scale is the minor pentatonic with an extra “blue note”, the flattened 5th, between the 4th and 5th notes.',
}

const SEVEN_NOTE: readonly ScaleType[] = ['major', 'natural-minor', 'harmonic-minor', 'melodic-minor']

/** The same scale with one note respelled as its enharmonic twin: right sound, wrong spelling. */
function respelled(notes: readonly NoteName[], index: number): NoteName[] | null {
  const original = notes[index]!
  const twins = enharmonicSpellings(pitch(original.letter, original.accidental, 4), 1)
  const twin = twins[0]
  if (!twin) return null
  const copy = [...notes]
  copy[index] = withoutOctave(twin)
  return copy
}

/** The scale with one note moved a semitone: right spelling style, wrong note. */
function nudged(notes: readonly NoteName[], index: number, by: 1 | -1): NoteName[] {
  const copy = [...notes]
  const n = copy[index]!
  copy[index] = { letter: n.letter, accidental: n.accidental + by }
  return copy
}

function generateScaleSpelling(ctx: QuestionContext): Question {
  const { rng } = ctx
  const type = rng.pick(scaleTypesFor(ctx.difficulty))
  const key: Key = rng.pick(keysForDifficulty(MAJOR_BASED.includes(type) ? 'major' : 'minor', ctx.difficulty))
  const tonic = key.tonic
  const notes = scaleNotes(tonic, type)
  const correct = notesLabel(notes)

  const traps: string[] = []
  // 1. Right sound, wrong spelling (the classic slip).
  const spellable = rng.shuffle(notes.map((_, i) => i).filter((i) => i > 0))
  for (const i of spellable) {
    const alt = respelled(notes, i)
    if (alt) {
      traps.push(notesLabel(alt))
      break
    }
  }
  // 2. A scale of the same family from the same note (natural vs harmonic minor, major vs minor).
  const sibling: Partial<Record<ScaleType, ScaleType>> = {
    major: 'natural-minor',
    'natural-minor': 'major',
    'harmonic-minor': 'natural-minor',
    'melodic-minor': 'harmonic-minor',
    'major-pentatonic': 'minor-pentatonic',
    'minor-pentatonic': 'major-pentatonic',
    blues: 'minor-pentatonic',
  }
  traps.push(notesLabel(scaleNotes(tonic, sibling[type]!)))
  // 3. Another note raised or lowered by a semitone.
  const interior = rng.shuffle(notes.map((_, i) => i).filter((i) => i > 0))
  for (const i of interior.slice(0, 2)) traps.push(notesLabel(nudged(notes, i, rng.pick([1, -1] as const))))
  // 4. The scale from the next key round the circle of fifths.
  const neighbours = [1, -1].map((d) => keyFromFifths(keyFifths(key) + d, key.mode)).filter(isStandardKey)
  if (neighbours.length > 0) traps.push(notesLabel(scaleNotes(rng.pick(neighbours).tonic, type)))

  const { input } = multipleChoice(rng, correct, traps, { layout: 'list', prefer: traps.slice(0, 2) })
  const name = `${noteLabel(tonic)} ${SCALE_LABELS[type]}`
  const spelled = SEVEN_NOTE.includes(type) ? ' Each letter name is used once.' : ''
  const idKey = formatNote(tonic)
  return {
    id: `scale-spelling:${type}:${idKey}`,
    type: 'scale-spelling',
    topic: 'scales',
    category: 'Scale spelling',
    itemLabel: `${name} scale`,
    tags: ['aqa-candidate'],
    prompt: `Which notes make up the ${name} scale${type === 'melodic-minor' ? ' (going up)' : ''}?`,
    notation: null,
    audio: null,
    input,
    correct,
    answerText: `${name}: ${correct}.`,
    explanation: `${HOW_BUILT[type]} From ${noteLabel(tonic)}: ${correct}.${spelled}`,
  }
}

export const scaleSpellingGenerator: QuestionGenerator = {
  type: 'scale-spelling',
  topic: 'scales',
  label: 'Spelling scales',
  generate: generateScaleSpelling,
}

const ORDINALS = ['1st', '2nd', '3rd', '4th', '5th', '6th', '7th']
const DEGREE_TERMS = ['tonic', 'supertonic', 'mediant', 'subdominant', 'dominant', 'submediant']

function generateScaleDegree(ctx: QuestionContext): Question {
  const { rng } = ctx
  const asName = rng.next() < 0.5
  const hard = ctx.difficulty === 3 && rng.next() < 0.5
  const scaleType: ScaleType = hard ? 'natural-minor' : 'major'
  const key = rng.pick(keysForDifficulty(hard ? 'minor' : 'major', ctx.difficulty))
  const degree = rng.int(1, 7)
  const term = scaleDegreeName(scaleType, degree)
  const notes = scaleNotes(key.tonic, scaleType)
  const note = at(notes, degree - 1)
  const scaleName = hard ? 'natural minor' : 'major'

  if (!asName) {
    const correct = noteLabel(note)
    const { input } = multipleChoice(rng, correct, notes.map(noteLabel), { layout: 'grid' })
    const keyText = `${noteLabel(key.tonic)} ${hard ? 'minor' : 'major'}`
    return {
      id: `scale-degree:note:${scaleType}:${formatNote(key.tonic)}:${degree}`,
      type: 'scale-degree',
      topic: 'scales',
      category: 'Scale degrees',
      itemLabel: `${term} of ${keyText}`,
      tags: ['aqa-candidate'],
      prompt: `In ${keyText}, which note is the ${term}?`,
      notation: null,
      audio: null,
      input,
      correct,
      answerText: `It is ${correct}.`,
      explanation: `The ${term} is the ${ORDINALS[degree - 1]} note of the scale. ${keyText} scale: ${notesLabel(notes)}, so the ${term} is ${correct}.`,
    }
  }

  const names = [...DEGREE_TERMS, ...(hard ? ['subtonic'] : ['leading note'])]
  const correct = term
  const { input } = multipleChoice(rng, correct, names, { layout: 'grid', fixedOrder: true })
  return {
    id: `scale-degree:name:${scaleType}:${degree}`,
    type: 'scale-degree',
    topic: 'scales',
    category: 'Scale degrees',
    itemLabel: `${ORDINALS[degree - 1]} degree of a ${scaleName} scale`,
    tags: ['aqa-candidate'],
    prompt: `What is the ${ORDINALS[degree - 1]} note of a ${scaleName} scale called?`,
    notation: null,
    audio: null,
    input,
    correct,
    answerText: `It is the ${correct}.`,
    explanation: `The degrees are named: 1st tonic, 2nd supertonic, 3rd mediant, 4th subdominant, 5th dominant, 6th submediant, 7th ${hard ? 'subtonic (a tone below the tonic) in the natural minor, but leading note (a semitone below) in the major and harmonic minor' : 'leading note (a semitone below the tonic)'}. So the ${ORDINALS[degree - 1]} is the ${correct}.`,
  }
}

export const scaleDegreeGenerator: QuestionGenerator = {
  type: 'scale-degree',
  topic: 'scales',
  label: 'Scale degree names',
  generate: generateScaleDegree,
}

