import {
  CADENCE_LABELS,
  CADENCE_TYPES,
  type CadenceType,
  type ClefName,
  type Key,
  cadence,
  cadenceOptions,
  classifyCadence,
  keyName,
  chordNotes,
  chordSymbol,
} from '../theory'
import { clefTags } from './noteName'
import { chordOnStaff } from './chords'
import { capitalise, multipleChoice, withArticle } from './helpers'
import { keyLabel, keysForDifficulty, notesLabel } from './pitchTools'
import type { Question, QuestionContext, QuestionGenerator } from './types'

/** Plain-words definition of each cadence, as used in this app (see docs/theory-engine.md). */
export const DEFINITION: Record<CadenceType, string> = {
  perfect: 'A perfect cadence is chord V (or V7) followed by chord I.',
  imperfect: 'An imperfect cadence ends on chord V, usually after I, ii or IV.',
  plagal: 'A plagal cadence is chord IV followed by chord I.',
  interrupted: 'An interrupted cadence is chord V followed by chord vi (VI in a minor key), instead of the expected I.',
}

/** Keys used for cadences at each level: major keys first, minor keys from level 2. */
export function cadenceKey(ctx: QuestionContext): Key {
  const mode = ctx.difficulty === 1 ? 'major' : ctx.rng.pick(['major', 'minor'] as const)
  return ctx.rng.pick(keysForDifficulty(mode, ctx.difficulty))
}

/** Level 3 also uses the V7 versions; earlier levels use the plain ones. */
export function pickVariant(ctx: QuestionContext, type: CadenceType, key: Key): number {
  const count = cadenceOptions(key, type).length
  return ctx.difficulty === 3 ? ctx.rng.int(0, count - 1) : 0
}

function pairLabel(key: Key, type: CadenceType, variant: number): string {
  const c = cadence(key, type, variant)
  return c.chords.map((x) => chordSymbol(x, { style: 'symbol' })).join(' → ')
}

function generateCadenceOnStaff(ctx: QuestionContext): Question {
  const { rng } = ctx
  const clef: ClefName = rng.pick(ctx.clefs)
  const key = cadenceKey(ctx)
  const type = rng.pick(CADENCE_TYPES)
  const variant = pickVariant(ctx, type, key)
  const c = cadence(key, type, variant)
  // The app's own check: the two chords it draws must classify as the cadence it says they are.
  if (classifyCadence(key, c.chords[0], c.chords[1]) !== type) throw new Error('Cadence did not classify as itself')
  const [first, second] = c.chords
  const items = [first, second].map((chord) => ({ kind: 'notes' as const, pitches: chordOnStaff(chord, clef) }))
  const correct = CADENCE_LABELS[type]
  const { input } = multipleChoice(rng, correct, [...CADENCE_TYPES].map((t) => CADENCE_LABELS[t]), { count: 4, layout: 'grid', fixedOrder: true })
  const symbols = c.chords.map((x) => chordSymbol(x, { style: 'symbol' })).join(' then ')
  return {
    id: `cadence-on-staff:${keyName(key)}:${type}:${variant}:${clef}`,
    type: 'cadence-on-staff',
    topic: 'cadences',
    category: 'Cadences on the staff',
    itemLabel: `${correct} cadence in ${keyLabel(key)}`,
    tags: clefTags(clef),
    prompt: `The key is ${keyLabel(key)}. What type of cadence is this?`,
    notation: { staves: [{ clef, key, items }] },
    audio: null,
    input,
    correct,
    answerText: `It is ${withArticle(correct)} cadence.`,
    explanation: `The chords are ${symbols}, which are ${c.numerals.join(' then ')} in ${keyLabel(key)} (${notesLabel(chordNotes(first))} then ${notesLabel(chordNotes(second))}). ${DEFINITION[type]}`,
  }
}

export const cadenceOnStaffGenerator: QuestionGenerator = {
  type: 'cadence-on-staff',
  topic: 'cadences',
  label: 'Cadences on the staff',
  generate: generateCadenceOnStaff,
}

function generateCadenceByName(ctx: QuestionContext): Question {
  const { rng } = ctx
  const key = cadenceKey(ctx)
  const type = rng.pick(CADENCE_TYPES)
  const variant = pickVariant(ctx, type, key)
  const correct = pairLabel(key, type, variant)
  // Every valid way of writing the asked cadence in this key must never appear as a wrong answer.
  const valid = new Set(cadenceOptions(key, type).map((_, v) => pairLabel(key, type, v)))
  const wrong: string[] = []
  for (const other of CADENCE_TYPES.filter((t) => t !== type)) {
    const options = cadenceOptions(key, other)
    wrong.push(pairLabel(key, other, rng.int(0, options.length - 1)))
  }
  // A pair of chords that is not a cadence at all: the plagal cadence played backwards (I then IV).
  const plagal = cadence(key, 'plagal')
  const backwards = [plagal.chords[1], plagal.chords[0]] as const
  if (classifyCadence(key, backwards[0], backwards[1]) === null) {
    wrong.push(backwards.map((x) => chordSymbol(x, { style: 'symbol' })).join(' → '))
  }
  const filtered = wrong.filter((w) => !valid.has(w))
  const { input } = multipleChoice(rng, correct, filtered, { layout: 'grid', prefer: filtered.slice(0, 2) })
  const c = cadence(key, type, variant)
  return {
    id: `cadence-by-name:${keyName(key)}:${type}:${variant}`,
    type: 'cadence-by-name',
    topic: 'cadences',
    category: 'Cadences by name',
    itemLabel: `${type} cadence in ${keyLabel(key)}`,
    tags: ['aqa-candidate'],
    prompt: `In ${keyLabel(key)}, which pair of chords makes ${withArticle(CADENCE_LABELS[type])} cadence?`,
    notation: null,
    audio: null,
    input,
    correct,
    answerText: `${capitalise(withArticle(CADENCE_LABELS[type]))} cadence in ${keyLabel(key)} is ${correct}.`,
    explanation: `${DEFINITION[type]} In ${keyLabel(key)} that is ${c.numerals.join(' then ')}: ${correct}.`,
  }
}

export const cadenceByNameGenerator: QuestionGenerator = {
  type: 'cadence-by-name',
  topic: 'cadences',
  label: 'Cadences by name',
  generate: generateCadenceByName,
}
