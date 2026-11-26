import {
  CADENCE_LABELS,
  CADENCE_TYPES,
  type Chord,
  type ChordQuality,
  type ClefName,
  type Pitch,
  cadence,
  chordNotes,
  chordPitches,
  formatPitch,
  inversionFigure,
  inversionName,
  intervalName,
  intervalSemitones,
  midiNumber,
  naturalPitchesInClef,
  parseInterval,
  transpose,
} from '../theory'
import { at } from '../theory/util'
import type { Rng } from './rng'
import { DEFINITION, cadenceKey, pickVariant } from './cadences'
import { RECIPE, SEVENTH_LABEL, SEVENTHS, TRIADS, chordWords, randomChord } from './chords'
import { capitalise, multipleChoice, withArticle } from './helpers'
import { type ChordStyle, cadenceAudio, chordAudio, intervalAudio } from './earAudio'
import { fitsOnStaff, keyLabel, noteLabel, notesLabel } from './pitchTools'
import type { Difficulty, Question, QuestionContext, QuestionGenerator } from './types'

/**
 * Lowest and highest notes used for listening. The tone has strong upper harmonics, so even the lowest notes here
 * are easy to hear on a phone speaker, which cannot play their lowest frequency on its own.
 */
const EAR_LOW = 40 // E2
const EAR_HIGH = 88 // E6

/** Octaves in which a chord sits on the staff and is comfortably audible. Falls back to any that fit the staff. */
function listeningOctaves(clef: ClefName, build: (octave: number) => readonly Pitch[]): number[] {
  const fitting: { octave: number; low: number; high: number }[] = []
  for (let octave = 0; octave <= 7; octave++) {
    const pitches = build(octave)
    if (!fitsOnStaff(pitches, clef, 1)) continue
    const midis = pitches.map(midiNumber)
    fitting.push({ octave, low: Math.min(...midis), high: Math.max(...midis) })
  }
  if (fitting.length === 0) throw new Error('No octave fits this chord on the staff')
  const audible = fitting.filter((f) => f.low >= EAR_LOW && f.high <= EAR_HIGH)
  if (audible.length > 0) return audible.map((f) => f.octave)
  // Nothing is in the ideal range: take the one whose lowest note is highest, so it is as easy to hear as possible.
  const best = fitting.reduce((a, b) => (b.low > a.low ? b : a))
  return [best.octave]
}

/** A random octave for the chord, so the register changes from question to question. */
function placeChord(rng: Rng, clef: ClefName, chord: Chord, inversion: number): Pitch[] {
  const octave = rng.pick(listeningOctaves(clef, (o) => chordPitches(chord, { inversion, bassOctave: o })))
  return chordPitches(chord, { inversion, bassOctave: octave })
}

const QUALITY_SOUND: Record<ChordQuality, string> = {
  major: 'A major chord is often described as bright and settled.',
  minor: 'A minor chord is often described as darker or sadder.',
  diminished: 'A diminished chord is often described as tense and unstable.',
  augmented: 'An augmented chord is often described as strange, floating and unresolved.',
  dominant7: 'A dominant 7th is often described as strong and unfinished: it wants to move on.',
  major7: 'A major 7th is often described as smooth and dreamy.',
  minor7: 'A minor 7th is often described as mellow and soft.',
  'half-diminished7': 'A half-diminished 7th is often described as dark and unsettled.',
  diminished7: 'A diminished 7th is often described as very tense and unstable.',
}

function qualityLabel(q: ChordQuality): string {
  return SEVENTH_LABEL[q] ?? q
}

function chordQualitiesFor(difficulty: Difficulty): ChordQuality[] {
  if (difficulty === 1) return ['major', 'minor']
  if (difficulty === 2) return TRIADS
  return [...TRIADS, 'dominant7', 'major7', 'minor7']
}

function generateEarChordQuality(ctx: QuestionContext): Question {
  const { rng } = ctx
  const clef = rng.pick(ctx.clefs)
  const qualities = chordQualitiesFor(ctx.difficulty)
  const chord = randomChord(rng, ctx.difficulty, qualities)
  const size = chordNotes(chord).length
  // Inversions make it harder because the lowest note is no longer the root.
  const inversion = ctx.difficulty === 3 ? rng.int(0, size - 1) : 0
  const pitches = placeChord(rng, clef, chord, inversion)
  const style: ChordStyle = ctx.difficulty === 1 ? 'block' : rng.pick(['block', 'broken'] as const)
  const labels = qualities.map(qualityLabel)
  const correct = qualityLabel(chord.quality)
  const { input } = multipleChoice(rng, correct, labels, { count: Math.min(4, labels.length), layout: 'grid', fixedOrder: true })
  return {
    id: `ear-chord-quality:${chord.quality}`,
    type: 'ear-chord-quality',
    topic: 'ear',
    category: 'Ear training: chords',
    itemLabel: `${correct} chord`,
    tags: ['aqa-candidate'],
    prompt: 'What type of chord do you hear?',
    notation: null,
    audio: chordAudio(pitches, style),
    reveal: { staves: [{ clef, items: [{ kind: 'notes', pitches }] }] },
    input,
    correct,
    answerText: `It was ${withArticle(correct)} chord.`,
    explanation: `${QUALITY_SOUND[chord.quality]} What you heard was ${chordWords(chord)} (${notesLabel(chordNotes(chord))}): ${RECIPE[chord.quality]}.${inversion > 0 ? ` It was played in ${inversionName(inversion)}.` : ''}`,
  }
}

export const earChordQualityGenerator: QuestionGenerator = {
  type: 'ear-chord-quality',
  topic: 'ear',
  label: 'Chord quality by ear',
  generate: generateEarChordQuality,
}

/** The intervals heard at each level, smallest first. "Tritone" is the one label for an augmented 4th or diminished 5th, which sound the same. */
function earIntervalsFor(difficulty: Difficulty): string[] {
  if (difficulty === 1) return ['m3', 'M3', 'P4', 'P5', 'P8']
  const all = ['m2', 'M2', 'm3', 'M3', 'P4', 'P5', 'm6', 'M6', 'm7', 'M7', 'P8']
  return difficulty === 2 ? all : [...all.slice(0, 5), 'A4', ...all.slice(5)]
}

function earIntervalLabel(short: string): string {
  return short === 'A4' ? 'tritone' : intervalName(parseInterval(short))
}

function generateEarInterval(ctx: QuestionContext): Question {
  const { rng } = ctx
  const clef = rng.pick(ctx.clefs)
  const modes = ctx.difficulty === 1 ? (['up', 'together'] as const) : (['up', 'down', 'together'] as const)
  const mode = rng.pick(modes)
  const shorts = earIntervalsFor(ctx.difficulty)
  const short = rng.pick(shorts)
  const interval = parseInterval(short)

  let lower: Pitch
  let upper: Pitch
  for (let attempt = 0; ; attempt++) {
    if (attempt > 500) throw new Error('Could not build an interval that fits the staff and the listening range')
    lower = rng.pick(naturalPitchesInClef(clef, 1))
    upper = transpose(lower, interval)
    const low = midiNumber(lower)
    const high = midiNumber(upper)
    if (Math.abs(upper.accidental) > 1 || !fitsOnStaff([lower, upper], clef, 1)) continue
    if (low < EAR_LOW || high > EAR_HIGH) continue
    break
  }

  const labels = shorts.map(earIntervalLabel)
  const correct = earIntervalLabel(short)
  const semis = intervalSemitones(interval)
  // Intervals a semitone or two away sound alike, so they are the tempting wrong answers.
  const near = shorts.filter((s) => s !== short && Math.abs(intervalSemitones(parseInterval(s)) - semis) <= 2).map(earIntervalLabel)
  const { input } = multipleChoice(rng, correct, labels, { layout: 'grid', prefer: near, fixedOrder: true })
  const how = mode === 'up' ? 'one after the other, going up' : mode === 'down' ? 'one after the other, going down' : 'together'
  const items = [{ kind: 'notes' as const, pitches: [lower] }, { kind: 'notes' as const, pitches: [upper] }]
  const written =
    mode === 'together'
      ? [{ kind: 'notes' as const, pitches: [lower, upper] }]
      : mode === 'up'
        ? items
        : [items[1]!, items[0]!]
  const first = mode === 'down' ? upper : lower
  const second = mode === 'down' ? lower : upper
  return {
    id: `ear-interval:${mode}:${short}`,
    type: 'ear-interval',
    topic: 'ear',
    category: `Ear training: intervals (${mode === 'together' ? 'together' : mode})`,
    itemLabel: `${correct} (${mode})`,
    tags: ['aqa-candidate'],
    prompt: `What is the interval? (Two notes ${how}.)`,
    notation: null,
    audio: intervalAudio(lower, upper, mode),
    reveal: { staves: [{ clef, items: written }] },
    input,
    correct,
    answerText: `It was ${withArticle(correct)}.`,
    explanation: `You heard ${formatPitch(first, 'symbol')} and ${formatPitch(second, 'symbol')}${mode === 'together' ? ' together' : ''}: ${withArticle(short === 'A4' ? 'tritone (augmented 4th or diminished 5th)' : intervalName(interval))}, which is ${semis} semitone${semis === 1 ? '' : 's'} wide.`,
  }
}

export const earIntervalGenerator: QuestionGenerator = {
  type: 'ear-interval',
  topic: 'ear',
  label: 'Intervals by ear',
  generate: generateEarInterval,
}

const CADENCE_SOUND: Record<string, string> = {
  perfect: 'It sounds finished, like a full stop.',
  imperfect: 'It sounds unfinished, like a comma or a question: it stops on V.',
  plagal: 'It sounds gentle and settled, like the “Amen” at the end of a hymn.',
  interrupted: 'It sounds like a surprise: it seems to be heading home to I, but goes somewhere else.',
}

function generateEarCadence(ctx: QuestionContext): Question {
  const { rng } = ctx
  const clef = rng.pick(ctx.clefs)
  const key = cadenceKey(ctx)
  const type = rng.pick(CADENCE_TYPES)
  const variant = pickVariant(ctx, type, key)
  const c = cadence(key, type, variant)
  const tonic = cadence(key, 'perfect').chords[1]
  // One octave for all three chords so they sound like they belong together; if they cannot share one
  // (it can happen with wide chords in bass clef), each chord gets its own.
  const chords = [tonic, c.chords[0], c.chords[1]] as const
  let shared: number[] = []
  try {
    shared = listeningOctaves(clef, (o) => chords.flatMap((x) => chordPitches(x, { bassOctave: o })))
  } catch {
    shared = []
  }
  let sharedOctave = shared.length > 0 ? rng.pick(shared) : null
  if (sharedOctave !== null) {
    const midis = chords.flatMap((x) => chordPitches(x, { bassOctave: sharedOctave! }).map(midiNumber))
    // A shared octave that is not in the ideal listening range is no use: give each chord its own instead.
    if (Math.min(...midis) < EAR_LOW || Math.max(...midis) > EAR_HIGH) sharedOctave = null
  }
  const [keyPitches, firstPitches, secondPitches] = chords.map((x) =>
    sharedOctave !== null ? chordPitches(x, { bassOctave: sharedOctave }) : placeChord(rng, clef, x, 0),
  ) as [Pitch[], Pitch[], Pitch[]]
  const correct = CADENCE_LABELS[type]
  const { input } = multipleChoice(rng, correct, CADENCE_TYPES.map((t) => CADENCE_LABELS[t]), { count: 4, layout: 'grid', fixedOrder: true })
  return {
    id: `ear-cadence:${type}`,
    type: 'ear-cadence',
    topic: 'ear',
    category: 'Ear training: cadences',
    itemLabel: `${correct} cadence`,
    tags: ['aqa-candidate'],
    prompt: 'Which cadence do you hear? (First the key chord, then the two chords of the cadence.)',
    notation: null,
    audio: cadenceAudio(keyPitches, firstPitches, secondPitches),
    reveal: { staves: [{ clef, key, items: [{ kind: 'notes', pitches: firstPitches }, { kind: 'notes', pitches: secondPitches }] }] },
    input,
    correct,
    answerText: `It was ${withArticle(correct)} cadence.`,
    explanation: `${capitalise(CADENCE_SOUND[type]!)} ${DEFINITION[type]} In ${keyLabel(key)} you heard ${c.numerals.join(' then ')}.`,
  }
}

export const earCadenceGenerator: QuestionGenerator = {
  type: 'ear-cadence',
  topic: 'ear',
  label: 'Cadences by ear',
  generate: generateEarCadence,
}

function generateEarInversion(ctx: QuestionContext): Question {
  const { rng } = ctx
  const clef = rng.pick(ctx.clefs)
  const sevenths = ctx.difficulty === 3
  const qualities = sevenths ? SEVENTHS : ctx.difficulty === 1 ? (['major', 'minor'] as ChordQuality[]) : TRIADS.slice(0, 3)
  const chord = randomChord(rng, ctx.difficulty, qualities)
  const size = chordNotes(chord).length
  const inversion = rng.int(0, size - 1)
  const pitches = placeChord(rng, clef, chord, inversion)
  const names = Array.from({ length: size }, (_, i) => inversionName(i))
  const correct = inversionName(inversion)
  const { input } = multipleChoice(rng, correct, names, { count: size, layout: 'grid', fixedOrder: true })
  const bass = at(chordNotes(chord), inversion)
  const role = ['root', '3rd', '5th', '7th'][inversion]!
  return {
    id: `ear-inversion:${sevenths ? 'seventh' : 'triad'}:${inversion}`,
    type: 'ear-inversion',
    topic: 'ear',
    category: 'Ear training: inversions',
    itemLabel: `${correct}${sevenths ? ' (7th chord)' : ''}`,
    tags: ['aqa-candidate'],
    prompt: 'Which inversion do you hear? (Listen to the lowest note.)',
    notation: null,
    audio: chordAudio(pitches, 'block'),
    reveal: { staves: [{ clef, items: [{ kind: 'notes', pitches }] }] },
    input,
    correct,
    answerText: `It was in ${correct}.`,
    explanation: `The chord was ${chordWords(chord)} (${notesLabel(chordNotes(chord))}). The lowest note was ${noteLabel(bass)} (${formatPitch(at(pitches, 0), 'symbol')}), the ${role} of the chord, so it was in ${correct}. (Figured bass: ${inversionFigure(chord.quality, inversion)}.)`,
  }
}

export const earInversionGenerator: QuestionGenerator = {
  type: 'ear-inversion',
  topic: 'ear',
  label: 'Inversions by ear',
  generate: generateEarInversion,
}

