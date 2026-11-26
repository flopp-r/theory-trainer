import {
  type Interval,
  type IntervalQuality,
  type Pitch,
  enharmonicSpellings,
  formatNote,
  formatPitch,
  intervalBetween,
  intervalName,
  intervalSemitones,
  intervalShortName,
  letterAt,
  letterIndex,
  naturalPitchesInClef,
  parseInterval,
  transpose,
} from '../theory'
import { clefTags } from './noteName'
import { capitalise, multipleChoice, withArticle } from './helpers'
import { fitsOnStaff, lettersFrom, noteLabel } from './pitchTools'
import type { Difficulty, Question, QuestionContext, QuestionGenerator } from './types'

const ORDINALS: Record<number, string> = { 2: '2nd', 3: '3rd', 4: '4th', 5: '5th', 6: '6th', 7: '7th', 8: 'octave' }

/** Intervals asked about with their quality, by level. */
function qualifiedIntervals(difficulty: Difficulty): Interval[] {
  const base = ['m2', 'M2', 'm3', 'M3', 'P4', 'P5', 'm6', 'M6', 'm7', 'M7', 'P8']
  return (difficulty === 3 ? [...base, 'A4', 'd5'] : base).map(parseInterval)
}

/** Opposite quality at the same number: major <-> minor, perfect <-> augmented/diminished. */
function otherQualities(i: Interval): Interval[] {
  const all: IntervalQuality[] = ['diminished', 'minor', 'perfect', 'major', 'augmented']
  const result: Interval[] = []
  for (const quality of all) {
    if (quality === i.quality) continue
    try {
      intervalSemitones({ number: i.number, quality })
      result.push({ number: i.number, quality })
    } catch {
      // that quality does not exist for this number
    }
  }
  return result
}

/** "A major 3rd is 4 semitones; a minor 3rd is 3." for the intervals that come in pairs. */
function semitoneFact(i: Interval): string {
  const semis = intervalSemitones(i)
  const own = `${withArticle(intervalName(i))} is ${semis} semitone${semis === 1 ? '' : 's'}`
  if (i.quality === 'major' || i.quality === 'minor') {
    const twin = otherQualities(i).find((o) => o.quality === (i.quality === 'major' ? 'minor' : 'major'))!
    return `${own}; ${withArticle(intervalName(twin))} is ${intervalSemitones(twin)}.`
  }
  return `${own}.`
}

function generateIntervalOnStaff(ctx: QuestionContext): Question {
  const { rng } = ctx
  const clef = rng.pick(ctx.clefs)
  const harmonic = rng.next() < 0.5
  const level = ctx.difficulty
  const lowers = naturalPitchesInClef(clef, 1)

  let lower!: Pitch
  let upper!: Pitch
  let interval!: Interval
  for (let attempt = 0; ; attempt++) {
    if (attempt > 500) throw new Error('Could not build an interval that fits the staff')
    const start = rng.pick(lowers)
    if (level === 1) {
      // Natural notes only; the question is about the number, so any natural note above will do.
      const number = rng.int(2, 8)
      const candidate = transposeByLetters(start, number)
      const found = intervalBetween(start, candidate).interval
      if (!fitsOnStaff([start, candidate], clef, 1)) continue
      lower = start
      upper = candidate
      interval = found
      break
    }
    const wanted = rng.pick(qualifiedIntervals(level))
    // Level 3 also starts on sharps and flats.
    const lowerPitch: Pitch = level === 3 && rng.next() < 0.5 ? { ...start, accidental: rng.pick([1, -1]) } : start
    const top = transpose(lowerPitch, wanted)
    if (Math.abs(top.accidental) > 1 || !fitsOnStaff([lowerPitch, top], clef, 1)) continue
    // Level 2 uses natural notes only, so every interval is one that white-note pairs make.
    if (level === 2 && (lowerPitch.accidental !== 0 || top.accidental !== 0)) continue
    lower = lowerPitch
    upper = top
    interval = wanted
    break
  }

  const number = interval.number
  const items = harmonic
    ? [{ kind: 'notes' as const, pitches: [lower, upper] }]
    : [
        { kind: 'notes' as const, pitches: [lower] },
        { kind: 'notes' as const, pitches: [upper] },
      ]
  const letters = lettersFrom(lower.letter, number).join(', ')
  let correct: string
  let wrongPool: string[]
  let prefer: string[]
  let explanation: string
  if (level === 1) {
    correct = ORDINALS[number]!
    wrongPool = Object.values(ORDINALS)
    prefer = [ORDINALS[number - 1], ORDINALS[number + 1]].filter((x): x is string => x !== undefined)
    explanation = `The notes are ${noteLabel(lower)} and ${noteLabel(upper)}. Count the letter names from ${lower.letter} up to ${upper.letter}, counting both: ${letters}. That is a ${number === 8 ? 'octave (8 letter names)' : ORDINALS[number]}.`
  } else {
    correct = intervalName(interval)
    wrongPool = qualifiedIntervals(level).map(intervalName)
    const sameNumber = otherQualities(interval).map(intervalName)
    const neighbours = qualifiedIntervals(level)
      .filter((i) => Math.abs(i.number - number) === 1 && i.quality === interval.quality)
      .map(intervalName)
    prefer = [...sameNumber.filter((n) => wrongPool.includes(n)), ...neighbours]
    explanation = `The notes are ${noteLabel(lower)} and ${noteLabel(upper)}. Count the letter names from ${lower.letter} up to ${upper.letter}, counting both: ${letters}. That is a ${ORDINALS[number]}. The notes are ${intervalSemitones(interval)} semitones apart; ${semitoneFact(interval)} So it is ${withArticle(correct)}.`
  }
  const { input } = multipleChoice(rng, correct, wrongPool, { layout: 'grid', prefer })
  const kind = harmonic ? 'harmonic' : 'melodic'
  return {
    // The answer is a bare number at level 1 and number plus quality after that, so they are different items.
    id: `interval-on-staff:${level === 1 ? 'number' : 'quality'}:${kind}:${clef}:${formatPitch(lower)}-${formatPitch(upper)}`,
    type: 'interval-on-staff',
    topic: 'intervals',
    category: 'Intervals on the staff',
    itemLabel: `${formatPitch(lower, 'symbol')} to ${formatPitch(upper, 'symbol')} (${clef} clef)`,
    tags: clefTags(clef),
    prompt: harmonic ? 'What is the interval between these two notes? (They sound together.)' : 'What is the interval between these two notes? (One after the other.)',
    notation: { staves: [{ clef, items }] },
    audio: null,
    input,
    correct,
    answerText: `It is ${withArticle(correct)}.`,
    explanation,
  }
}

/** The natural note `number - 1` letter names above (so a 3rd above C is E). */
function transposeByLetters(start: Pitch, number: number): Pitch {
  const index = letterIndex(start.letter) + (number - 1)
  return { letter: letterAt(index), accidental: 0, octave: start.octave + Math.floor(index / 7) }
}

export const intervalOnStaffGenerator: QuestionGenerator = {
  type: 'interval-on-staff',
  topic: 'intervals',
  label: 'Intervals on the staff',
  generate: generateIntervalOnStaff,
}

function intervalsAbove(difficulty: Difficulty): Interval[] {
  const names =
    difficulty === 1
      ? ['M2', 'M3', 'P4', 'P5']
      : difficulty === 2
        ? ['m2', 'M2', 'm3', 'M3', 'P4', 'P5', 'm6', 'M6', 'm7', 'M7', 'P8']
        : ['m2', 'M2', 'm3', 'M3', 'P4', 'A4', 'd5', 'P5', 'm6', 'M6', 'm7', 'M7', 'P8']
  return names.map(parseInterval)
}

function generateIntervalAbove(ctx: QuestionContext): Question {
  const { rng } = ctx
  const level = ctx.difficulty
  const letters = ['C', 'D', 'E', 'F', 'G', 'A', 'B'] as const
  let start!: Pitch
  let answer!: Pitch
  let interval!: Interval
  let direction: 'up' | 'down' = 'up'
  for (let attempt = 0; ; attempt++) {
    if (attempt > 500) throw new Error('Could not build an interval question')
    start = { letter: rng.pick(letters), accidental: level === 1 ? 0 : rng.pick([0, 0, 1, -1]), octave: 4 }
    interval = rng.pick(intervalsAbove(level))
    direction = level === 3 && rng.next() < 0.4 ? 'down' : 'up'
    answer = transpose(start, interval, direction)
    if (Math.abs(answer.accidental) <= 1) break
  }
  const name = intervalName(interval)
  const correct = noteLabel(answer)
  const wrong: string[] = []
  // 1. The same sound spelled differently (right pitch, wrong letter): the classic mistake.
  const twin = enharmonicSpellings(answer, 1)[0]
  if (twin) wrong.push(noteLabel(twin))
  // 2. The note a different quality of the same interval would give (e.g. minor 3rd instead of major 3rd).
  for (const other of otherQualities(interval)) {
    const t = transpose(start, other, direction)
    if (Math.abs(t.accidental) <= 1) wrong.push(noteLabel(t))
  }
  // 3. The same quality, one letter name away.
  for (const delta of [-1, 1]) {
    try {
      const near = { number: interval.number + delta, quality: interval.quality }
      intervalSemitones(near)
      const t = transpose(start, near, direction)
      if (Math.abs(t.accidental) <= 1) wrong.push(noteLabel(t))
    } catch {
      // not a real interval
    }
  }
  // Fallbacks so there are always enough wrong answers: the same letter with another sign, and nearby letters.
  const preferred = wrong.slice(0, 2)
  for (const accidental of [answer.accidental + 1, answer.accidental - 1, 0]) {
    if (Math.abs(accidental) <= 1) wrong.push(noteLabel({ letter: answer.letter, accidental }))
  }
  for (const d of [-2, -1, 1, 2]) wrong.push(noteLabel({ letter: letterAt(letterIndex(answer.letter) + d), accidental: answer.accidental }))
  const { input } = multipleChoice(rng, correct, wrong, { layout: 'grid', prefer: preferred })
  const countLetters = lettersFrom(start.letter, interval.number, direction).join(', ')
  const semis = intervalSemitones(interval)
  const startName = noteLabel(start)
  const sentenceStart = capitalise(withArticle(name))
  return {
    id: `interval-above:${direction}:${formatNote(start)}:${intervalShortName(interval)}`,
    type: 'interval-above',
    topic: 'intervals',
    category: 'Building intervals',
    itemLabel: `${name} ${direction === 'up' ? 'above' : 'below'} ${startName}`,
    tags: ['aqa-candidate'],
    prompt: `What note is ${withArticle(name)} ${direction === 'up' ? 'above' : 'below'} ${startName}?`,
    notation: null,
    audio: null,
    input,
    correct,
    answerText: `It is ${correct}.`,
    explanation: `Count ${interval.number} letter names ${direction === 'up' ? 'up' : 'down'} from ${start.letter}, counting both: ${countLetters}. That gives ${answer.letter}. ${sentenceStart} is ${semis} semitone${semis === 1 ? '' : 's'}, so the note is ${correct}.`,
  }
}

export const intervalAboveGenerator: QuestionGenerator = {
  type: 'interval-above',
  topic: 'intervals',
  label: 'Building intervals',
  generate: generateIntervalAbove,
}

