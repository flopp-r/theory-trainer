import {
  CLEF_NAMES,
  type Pitch,
  clefLabel,
  describeStaffPosition,
  formatPitch,
  midiNumber,
  naturalPitchesInClef,
  pitchAtPosition,
  staffPosition,
} from '../theory'
import { clefAnchor, clefTags, explainNoteName } from './noteName'
import { multipleChoice } from './helpers'
import { noteLabel, pitchLabel } from './pitchTools'
import type { Question, QuestionContext, QuestionGenerator } from './types'

/** A note with a sharp or flat in front: "Which note is this?" The answer spells it correctly. */
function generateNoteAccidental(ctx: QuestionContext): Question {
  const { rng } = ctx
  const clef = rng.pick(ctx.clefs)
  const natural = rng.pick(naturalPitchesInClef(clef, Math.min(ctx.maxLedgerLines, 1)))
  // Double sharps and flats only at the hardest level.
  const options = ctx.difficulty === 3 ? [1, -1, 1, -1, 2, -2] : [1, -1]
  const accidental = rng.pick(options)
  const pitch: Pitch = { ...natural, accidental }
  const correct = noteLabel(pitch)
  const letters = ['C', 'D', 'E', 'F', 'G', 'A', 'B'] as const
  const index = letters.indexOf(pitch.letter)
  const neighbour = (offset: number) => letters[(index + offset + 7) % 7]!
  const candidates = [
    noteLabel({ letter: pitch.letter, accidental: -accidental }),
    noteLabel({ letter: pitch.letter, accidental: 0 }),
    noteLabel({ letter: neighbour(1), accidental }),
    noteLabel({ letter: neighbour(-1), accidental }),
    noteLabel({ letter: pitch.letter, accidental: accidental > 0 ? accidental + 1 : accidental - 1 }),
  ]
  // The natural and the opposite accidental are the classic mistakes, so they are always on offer.
  const { input } = multipleChoice(rng, correct, candidates, { layout: 'grid', prefer: [candidates[1]!, candidates[0]!] })
  const sign = accidental > 0 ? (accidental === 2 ? 'double sharp' : 'sharp') : accidental === -2 ? 'double flat' : 'flat'
  return {
    id: `note-accidental:${clef}:${formatPitch(pitch)}`,
    type: 'note-accidental',
    topic: 'notes',
    category: `${clefLabel(clef)}: accidentals`,
    itemLabel: `${formatPitch(pitch, 'symbol')} in ${clefLabel(clef).toLowerCase()}`,
    tags: clefTags(clef),
    prompt: 'Which note is this?',
    notation: { staves: [{ clef, items: [{ kind: 'notes', pitches: [pitch] }] }] },
    audio: null,
    input,
    correct,
    answerText: `It is ${correct}.`,
    explanation: `${explainNoteName(clef, natural).replace(/The note is ([A-G])\.$/, 'The letter name is $1.')} The ${sign} sign in front changes it, so the note is ${correct}.`,
  }
}

export const noteAccidentalGenerator: QuestionGenerator = {
  type: 'note-accidental',
  topic: 'notes',
  label: 'Sharps and flats',
  generate: generateNoteAccidental,
}

const SAME = 'Yes, the same pitch'
const HIGHER = 'No, the bottom note is higher'
const LOWER = 'No, the bottom note is lower'

/** Two staves in different clefs: are the two notes the same pitch? */
function generateClefCompare(ctx: QuestionContext): Question {
  const { rng } = ctx
  const first = rng.pick(ctx.clefs)
  const others = ctx.clefs.filter((c) => c !== first)
  const second = rng.pick(others.length > 0 ? others : CLEF_NAMES.filter((c) => c !== first))
  const sameAnswer = rng.next() < 0.5

  let top: Pitch
  let bottom: Pitch
  for (let attempt = 0; ; attempt++) {
    top = rng.pick(naturalPitchesInClef(first, 1))
    if (sameAnswer) {
      // The same sound in the other clef, if it fits there.
      const position = staffPosition(top, second)
      if (position < -3 || position > 11) {
        if (attempt > 200) throw new Error('Could not find a pitch that fits both clefs')
        continue
      }
      bottom = pitchAtPosition(position, second)
      // pitchAtPosition gives the natural pitch at that position; for the same letter+octave it is the same pitch.
      if (midiNumber(bottom) !== midiNumber(top)) throw new Error('Clef conversion produced a different pitch')
    } else {
      // The classic trap: the same place on the staff, which is a different pitch in a different clef.
      bottom = pitchAtPosition(staffPosition(top, first), second)
    }
    break
  }
  const same = midiNumber(top) === midiNumber(bottom)
  const correct = same ? SAME : midiNumber(bottom) > midiNumber(top) ? HIGHER : LOWER
  const { input } = multipleChoice(rng, correct, [SAME, HIGHER, LOWER], { count: 3, layout: 'list', fixedOrder: true })
  const topName = pitchLabel(top)
  const bottomName = pitchLabel(bottom)
  const verdict = same
    ? `They are the same pitch, ${topName}, written for two different clefs.`
    : `They are different pitches: ${topName} on top and ${bottomName} below, so the bottom note is ${midiNumber(bottom) > midiNumber(top) ? 'higher' : 'lower'}.`
  return {
    id: `clef-compare:${first}:${formatPitch(top)}:${second}:${formatPitch(bottom)}`,
    type: 'clef-compare',
    topic: 'notes',
    category: 'Comparing clefs',
    itemLabel: `${formatPitch(top)} in ${first} clef vs ${formatPitch(bottom)} in ${second} clef`,
    tags: ['extra'],
    prompt: 'Are these two notes the same pitch?',
    notation: {
      staves: [
        { clef: first, items: [{ kind: 'notes', pitches: [top] }] },
        { clef: second, items: [{ kind: 'notes', pitches: [bottom] }] },
      ],
    },
    audio: null,
    input,
    correct,
    answerText: same ? 'They are the same pitch.' : `They are different: the bottom note is ${midiNumber(bottom) > midiNumber(top) ? 'higher' : 'lower'}.`,
    explanation: `Top staff (${first} clef): ${topName}. Bottom staff (${second} clef): ${bottomName}. ${verdict}`,
  }
}

export const clefCompareGenerator: QuestionGenerator = {
  type: 'clef-compare',
  topic: 'notes',
  label: 'Comparing clefs',
  generate: generateClefCompare,
}

/** Tap the staff where a named note goes. */
function generatePlaceNote(ctx: QuestionContext): Question {
  const { rng } = ctx
  const clef = rng.pick(ctx.clefs)
  const pitch = rng.pick(naturalPitchesInClef(clef, ctx.maxLedgerLines))
  const position = staffPosition(pitch, clef)
  const name = pitchLabel(pitch)
  const where = describeStaffPosition(position)
  const anchor = clefAnchor(clef)
  const steps = position - anchor.position
  const counting =
    steps === 0
      ? `${anchor.description}, so ${name} goes there.`
      : `${anchor.description}. Count ${Math.abs(steps)} ${Math.abs(steps) === 1 ? 'step' : 'steps'} ${steps > 0 ? 'up' : 'down'} from there (every line and every space is a step) to reach ${name}.`
  return {
    id: `place-note:${clef}:${formatPitch(pitch)}`,
    type: 'place-note',
    topic: 'notes',
    category: `${clefLabel(clef)}: placing notes`,
    itemLabel: `${formatPitch(pitch, 'symbol')} in ${clefLabel(clef).toLowerCase()}`,
    tags: ['extra'],
    prompt: name === pitchLabel({ letter: 'C', accidental: 0, octave: 4 }) ? `Tap where ${name} goes.` : `Tap where ${name} goes. (Middle C is C4.)`,
    notation: { staves: [{ clef, items: [] }] },
    audio: null,
    input: { kind: 'tap-staff', clef, ledgerLines: ctx.maxLedgerLines },
    correct: String(position),
    answerText: `${name} goes on ${where}.`,
    explanation: `${counting} It goes on ${where}.`,
  }
}

export const placeNoteGenerator: QuestionGenerator = {
  type: 'place-note',
  topic: 'notes',
  label: 'Placing notes',
  generate: generatePlaceNote,
}


