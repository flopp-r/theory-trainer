import {
  type Key,
  keyFifths,
  isStandardKey,
  keyFromFifths,
  keyName,
  keyScaleNotes,
  keySignature,
  parallelKey,
  relativeKey,
  subdominantKey,
  dominantKey,
} from '../theory'
import { clefTags } from './noteName'
import { multipleChoice } from './helpers'
import { keyLabel, keysForDifficulty, MAX_ACCIDENTALS, notesLabel } from './pitchTools'
import type { Question, QuestionContext, QuestionGenerator } from './types'

function signatureCountLabel(fifths: number): string {
  if (fifths === 0) return 'No sharps or flats'
  const n = Math.abs(fifths)
  return `${n} ${fifths > 0 ? 'sharp' : 'flat'}${n === 1 ? '' : 's'}`
}

function signatureListLabel(fifths: number): string {
  if (fifths === 0) return 'None'
  return notesLabel(keySignature(keyFromFifths(fifths, 'major')).accidentals)
}

/** The rule of thumb for finding the major key from a key signature, in words. */
function majorKeyRule(fifths: number): string {
  const major = keyFromFifths(fifths, 'major')
  const accidentals = keySignature(major).accidentals
  if (fifths === 0) return 'There are no sharps or flats, so the major key is C.'
  if (fifths > 0) {
    const last = accidentals[accidentals.length - 1]!
    return `The last sharp (${notesLabel([last])}) is the 7th note of the major scale, so the key is a semitone above it: ${keyLabel(major)}.`
  }
  if (fifths === -1) return 'With one flat (B♭) the major key is F. This one has to be learned.'
  const secondLast = accidentals[accidentals.length - 2]!
  return `The second-to-last flat (${notesLabel([secondLast])}) names the major key: ${keyLabel(major)}.`
}

function generateKeyFromSignature(ctx: QuestionContext): Question {
  const { rng } = ctx
  const mode = rng.pick(['major', 'minor'] as const)
  const clef = rng.pick(ctx.clefs)
  const key = rng.pick(keysForDifficulty(mode, ctx.difficulty))
  const fifths = keyFifths(key)
  const correct = keyLabel(key)
  const near = [fifths - 2, fifths - 1, fifths + 1, fifths + 2, -fifths].filter((f) => f !== fifths && Math.abs(f) <= 7)
  const labels = near.map((f) => keyLabel(keyFromFifths(f, mode)))
  // Same number of accidentals but the other kind (D major vs B♭ major), and one step either side.
  const prefer = [-fifths, fifths + 1, fifths - 1]
    .filter((f) => f !== fifths && Math.abs(f) <= 7)
    .map((f) => keyLabel(keyFromFifths(f, mode)))
  const { input } = multipleChoice(rng, correct, labels, { layout: 'grid', prefer })
  const relative = relativeKey(key)
  const why = `${majorKeyRule(fifths)} ${
    mode === 'major'
      ? `Its relative minor, ${keyLabel(relative)}, has the same key signature.`
      : `The minor key with the same signature is the relative minor of ${keyLabel(relative)}: it starts a minor 3rd (3 semitones) below, so it is ${correct}.`
  }`
  return {
    id: `key-from-signature:${clef}:${keyName(key)}`,
    type: 'key-from-signature',
    topic: 'keys',
    category: 'Key signatures',
    itemLabel: `${correct} signature (${clef} clef)`,
    tags: clefTags(clef),
    prompt: `Which ${mode} key has this key signature?`,
    notation: { staves: [{ clef, key, items: [] }] },
    audio: null,
    input,
    correct,
    answerText: `It is ${correct}.`,
    explanation: `${signatureCountLabel(fifths)}${fifths === 0 ? '.' : `: ${signatureListLabel(fifths)}.`} ${why}`,
  }
}

export const keyFromSignatureGenerator: QuestionGenerator = {
  type: 'key-from-signature',
  topic: 'keys',
  label: 'Key from key signature',
  generate: generateKeyFromSignature,
}

const ORDER_HINT = 'Sharps are added in the order F C G D A E B, and flats in the order B E A D G C F.'

function generateSignatureFromKey(ctx: QuestionContext): Question {
  const { rng } = ctx
  const mode = rng.pick(['major', 'minor'] as const)
  const wantList = ctx.difficulty >= 2 && rng.next() < 0.5
  let key = rng.pick(keysForDifficulty(mode, ctx.difficulty))
  // Asking for a list of accidentals makes no sense for a key with none.
  for (let i = 0; wantList && keyFifths(key) === 0 && i < 50; i++) key = rng.pick(keysForDifficulty(mode, ctx.difficulty))
  const fifths = keyFifths(key)
  const list = wantList && fifths !== 0
  const label = list ? signatureListLabel : signatureCountLabel
  const correct = label(fifths)
  const max = MAX_ACCIDENTALS[ctx.difficulty]
  const near = [fifths - 2, fifths - 1, fifths + 1, fifths + 2, -fifths, -fifths + 1, -fifths - 1].filter(
    (f) => f !== fifths && Math.abs(f) <= Math.max(max, 3),
  )
  const prefer = [-fifths, fifths + 1, fifths - 1].filter((f) => f !== fifths && Math.abs(f) <= 7).map(label)
  const { input } = multipleChoice(rng, correct, near.map(label), { layout: list ? 'list' : 'grid', prefer })
  const name = keyLabel(key)
  return {
    id: `signature-from-key:${list ? 'list' : 'count'}:${keyName(key)}`,
    type: 'signature-from-key',
    topic: 'keys',
    category: 'Key signatures',
    itemLabel: `${name} signature`,
    tags: ['aqa-candidate'],
    prompt: list ? `Which sharps or flats are in the key signature of ${name}?` : `How many sharps or flats does ${name} have?`,
    notation: null,
    audio: null,
    input,
    correct,
    answerText: list ? `${name} has ${signatureCountLabel(fifths).toLowerCase()}: ${correct}.` : `${name} has ${correct.toLowerCase()}.`,
    explanation: `${name} has ${fifths === 0 ? 'no sharps or flats' : `${signatureCountLabel(fifths)}: ${signatureListLabel(fifths)}`}. ${ORDER_HINT}`,
  }
}

export const signatureFromKeyGenerator: QuestionGenerator = {
  type: 'signature-from-key',
  topic: 'keys',
  label: 'Key signature from key',
  generate: generateSignatureFromKey,
}

function scaleLine(key: Key): string {
  return notesLabel(keyScaleNotes(key))
}

function generateRelativeKey(ctx: QuestionContext): Question {
  const { rng } = ctx
  const parallel = ctx.difficulty >= 2 && rng.next() < 0.4
  const mode = rng.pick(['major', 'minor'] as const)
  const other = mode === 'major' ? 'minor' : 'major'
  // Every key in the question, including the wrong answers, must be one of the 30 that exist in practice.
  // (The parallel minor of D♭ major would have eight flats, for example.)
  let key = rng.pick(keysForDifficulty(mode, ctx.difficulty))
  for (let i = 0; i < 100 && !(isStandardKey(parallelKey(key)) && isStandardKey(relativeKey(key))); i++) {
    key = rng.pick(keysForDifficulty(mode, ctx.difficulty))
  }
  const fifths = keyFifths(key)
  const answerKey = parallel ? parallelKey(key) : relativeKey(key)
  const trapKey = parallel ? relativeKey(key) : parallelKey(key)
  const correct = keyLabel(answerKey)
  const candidates = (
    parallel
      ? [trapKey, parallelKey(dominantKey(key)), parallelKey(subdominantKey(key)), keyFromFifths(fifths + 2, other), keyFromFifths(fifths - 2, other)]
      : [trapKey, keyFromFifths(fifths + 1, other), keyFromFifths(fifths - 1, other), keyFromFifths(fifths + 2, other), keyFromFifths(fifths - 2, other)]
  ).filter(isStandardKey)
  const { input } = multipleChoice(rng, correct, candidates.map(keyLabel), { layout: 'grid', prefer: [keyLabel(trapKey)] })
  const name = keyLabel(key)
  let why: string
  if (parallel) {
    const a = signatureCountLabel(keyFifths(key)).toLowerCase()
    const b = signatureCountLabel(keyFifths(answerKey)).toLowerCase()
    why = `Parallel keys share a tonic (the starting note) but not a key signature. ${name} has ${a}; ${correct} has ${b}.`
  } else if (mode === 'major') {
    why = `Relative keys share a key signature. The relative minor starts on the 6th note of the major scale: ${scaleLine(key)}, so it is ${correct}.`
  } else {
    why = `Relative keys share a key signature. The relative major starts on the 3rd note of the minor scale: ${scaleLine(key)}, so it is ${correct}.`
  }
  return {
    id: `relative-key:${parallel ? 'parallel' : 'relative'}:${keyName(key)}`,
    type: 'relative-key',
    topic: 'keys',
    category: 'Related keys',
    itemLabel: `${parallel ? 'parallel' : 'relative'} ${other} of ${name}`,
    tags: ['aqa-candidate'],
    prompt: `What is the ${parallel ? 'parallel' : 'relative'} ${other} of ${name}?`,
    notation: null,
    audio: null,
    input,
    correct,
    answerText: `It is ${correct}.`,
    explanation: why,
  }
}

export const relativeKeyGenerator: QuestionGenerator = {
  type: 'relative-key',
  topic: 'keys',
  label: 'Relative and parallel keys',
  generate: generateRelativeKey,
}

