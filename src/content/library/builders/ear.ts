import type { AudioSpec } from '../../../audio/types'
import {
  type CadenceType,
  type Chord,
  type ClefName,
  type Key,
  type NoteName,
  type Pitch,
  cadence,
  chordNotes,
  chordPitches,
  classifyCadence,
  comparePitches,
  intervalName,
  intervalSemitones,
  letterAt,
  letterIndex,
  midiNumber,
  parseInterval,
  sameNote,
  transpose,
  withoutOctave,
} from '../../../theory'
import { cadenceAudio, chordAudio, intervalAudio } from '../../../questions/earAudio'
import { withArticle } from '../../../questions/helpers'
import { chordWords } from '../../../questions/chords'
import { keyLabel, noteLabel, notesLabel } from '../../../questions/pitchTools'
import type { ListenItem, WorkedExample, WorkedStep, WorkedTerm } from '../types'
import { listenChord, melodyAudio } from './audio'
import { chordsOnStaff, notesOnStaff } from './common'
import {
  Explained,
  TERM,
  TRIAD_RECIPE,
  article,
  type TriadQuality,
  TRIAD_TABLE_TEXT,
  capital,
  chordPicture,
  chordTypeTerm,
  countStep,
  finish,
  intervalTerm,
  letterNumber,
  neighbourWalks,
  ordinal,
  pianoWalk,
  qualityFromSemitones,
  sharedPictures,
  signTerms,
} from './chords'
import { bassLineCheck, rootStep } from './cadences'
import { numeralSteps, scaleSteps } from './romanNumerals'

/*
 * Worked examples for ear training. Every sound is real notes worked out with the engine and played with the same
 * helpers the listening questions use. Descriptions of how things sound are labelled "often described as":
 * they are common ways of hearing, not rules. After the listening, each example shows the notes and the counts
 * that prove what was heard, and checks itself by a different route.
 */

const mod = (n: number, m: number) => ((n % m) + m) % m

/** Hand-written semitone sizes of the intervals used by ear questions. */
const SEMITONES: Record<string, number> = { m2: 1, M2: 2, m3: 3, M3: 4, P4: 5, A4: 6, P5: 7, m6: 8, M6: 9, m7: 10, M7: 11 }

/** How each triad is often described. These match the explanations in the listening questions. */
export const OFTEN_DESCRIBED: Record<TriadQuality, string> = {
  major: 'bright and settled',
  minor: 'darker or sadder',
  diminished: 'tense and unstable',
  augmented: 'strange, floating and unresolved',
}

/** The chord to compare with: the same root, one note different. */
const COMPARE_WITH: Record<TriadQuality, TriadQuality> = { major: 'minor', minor: 'major', diminished: 'minor', augmented: 'major' }

const FOR_LISTEN = (label: string, audio: AudioSpec): ListenItem => ({ label, audio })

/** Which notes differ between two chords on the same root, in words. */
function differenceText(a: readonly NoteName[], b: readonly NoteName[]): { role: string; text: string } {
  const roles = ['root', '3rd', '5th']
  const diffs = a
    .map((n, i) => ({ n, m: b[i]!, role: roles[i]! }))
    .filter(({ n, m }) => !sameNote(n, m))
  if (diffs.length !== 1) throw new Error('The two chords should differ in exactly one note')
  const { n, m, role } = diffs[0]!
  const moved = Math.abs(mod(midiNumber({ ...m, octave: 4 }) - midiNumber({ ...n, octave: 4 }) + 6, 12) - 6)
  return { role, text: `Only the ${role} is different (${noteLabel(n)} against ${noteLabel(m)}, ${moved === 1 ? 'one semitone' : `${moved} semitones`} apart). The other two notes are the same.` }
}

/** What the listener decides at each stage, for each chord type. */
const SETTLED: Record<TriadQuality, boolean> = { major: true, minor: true, diminished: false, augmented: false }
const COMPARE_RESULT: Record<TriadQuality, string> = {
  major: 'The mystery chord is the brighter one: major',
  minor: 'The mystery chord is the darker one: minor',
  diminished: 'The mystery chord is the more tense one: diminished',
  augmented: 'The mystery chord is the stranger, floating one: augmented',
}

/**
 * Tell a triad apart from its closest neighbour by ear: listen, describe, compare, decide, then see and count the notes.
 * The sounds are the chord and the same-root chord it is compared with.
 * Check: the two 3rds by piano keys.
 */
export function earChordExample(root: NoteName, quality: TriadQuality, clef: ClefName = 'treble'): WorkedExample {
  const ex = new Explained()
  const chord: Chord = { root, quality }
  const otherQuality = COMPARE_WITH[quality]
  const other: Chord = { root, quality: otherQuality }
  const [pitches, otherPitches] = sharedPictures([chord, other], clef) as [Pitch[], Pitch[]]
  const notes = chordNotes(chord)
  const otherNotes = chordNotes(other)
  const diff = differenceText(notes, otherNotes)
  const label = chordWords(chord)
  const otherLabel = chordWords(other)
  const recipe = TRIAD_RECIPE[quality]
  const otherRecipe = TRIAD_RECIPE[otherQuality]
  // Hand check that the two recipes really differ in one note only.
  const changes = [recipe.third !== otherRecipe.third, recipe.fifth !== otherRecipe.fifth].filter(Boolean).length
  if (changes !== 1) throw new Error('The compared chords should differ in one note')
  const third = countStep(root, notes[1]!, ex, `Count from the root up to the 3rd, ${noteLabel(notes[1]!)}`)
  const fifth = countStep(root, notes[2]!, ex, `Count from the root up to the 5th, ${noteLabel(notes[2]!)}`)
  if (qualityFromSemitones([third.total, fifth.total]) !== quality) throw new Error('The counts do not give the chord type')
  const walks = neighbourWalks(notes, ex)
  if (walks.sizes[0] !== recipe.lowerSemis || walks.sizes[1] !== recipe.upperSemis) throw new Error('The piano-key check does not match the recipe')
  const settled = SETTLED[quality]
  const pairWords = settled ? 'major or minor' : 'diminished or augmented'
  const compareWords =
    quality === 'major' || quality === 'minor'
      ? 'Major chords are often described as bright, minor chords as darker or sadder.'
      : `${capital(quality)} chords are often described as ${OFTEN_DESCRIBED[quality]}; ${otherQuality} chords as ${otherQuality === 'major' ? 'bright and settled' : 'darker but settled'}.`

  return finish({
    title: `Hear ${label}: ${settled ? 'deciding major or minor' : `telling ${quality} from ${otherQuality}`}`,
    task: `You hear a chord. Is it ${settled ? 'major or minor' : `${quality} or ${otherQuality}`}?`,
    terms: [TERM.chord, TERM.triad, TERM.root, TERM.third, TERM.fifth, TERM.semitone, chordTypeTerm(quality), chordTypeTerm(otherQuality), intervalTerm(third.name), intervalTerm(fifth.name)],
    steps: [
      {
        title: 'Play the chord',
        text: 'Listen to the whole sound, not to single notes. Play it two or three times and make a first guess before you read on.',
        result: 'One chord: three notes played together',
        listen: FOR_LISTEN('Play the mystery chord', chordAudio(pitches, 'block')),
      },
      {
        title: 'Decide: settled or tense',
        text: 'Major and minor chords are often described as settled. Diminished and augmented chords are often described as tense or unsettled. These are common descriptions, not rules, but they are a good first sort.',
        result: SETTLED[otherQuality] === settled ? `${settled ? 'Settled' : 'Tense'}: so ${pairWords}` : `${settled ? 'Settled' : 'Tense'}: this points to ${quality}, not ${otherQuality}`,
      },
      {
        title: 'Play a chord on the same root to compare',
        text: `This is ${otherLabel}. It has the same root${ex.once('root', ' (the note the chord is built on)')}, ${noteLabel(root)}, and only one note is different. Play the mystery chord again, then this one.`,
        result: `Comparison: ${otherLabel}`,
        listen: FOR_LISTEN(`Play the comparison (${otherLabel})`, chordAudio(otherPitches, 'block')),
      },
      {
        title: 'Decide which description fits the mystery chord',
        text: `${compareWords} Trust the difference you hear between the two chords more than any single word.`,
        result: COMPARE_RESULT[quality],
      },
      {
        title: 'See the notes you heard',
        text: `The mystery chord is ${notesLabel(notes)} and the comparison is ${notesLabel(otherNotes)}. ${diff.text}`,
        result: `${notesLabel(notes)} against ${notesLabel(otherNotes)}`,
        staff: chordsOnStaff(clef, [pitches, otherPitches]),
      },
      ...third.steps,
      ...fifth.steps,
      {
        title: 'Match the counts to a triad type',
        text: `Each triad type has its own counts from the root. ${TRIAD_TABLE_TEXT} Yours are ${third.total} and ${fifth.total}.`,
        result: `${article(quality)} triad: ${label}, as you heard`,
      },
      {
        title: 'Check another way: count the 3rds by piano keys',
        text: `Count up one piano key at a time between neighbouring notes. ${walks.text} ${article(quality)} triad is ${recipe.lowerSemis} then ${recipe.upperSemis}.`,
        result: `${walks.sizes[0]} then ${walks.sizes[1]}: ${label}, as it should be`,
        listen: listenChord(`Play ${label} again`, pitches),
      },
    ],
    answer: `The chord was ${label} (${notesLabel(notes)}).`,
  })
}

/** Well-known tunes whose first jump is the interval, offered as memory aids. */
export const TUNE_AIDS: Record<string, string> = {
  P4: '"Here Comes the Bride": the jump up from "Here" to "comes"',
  P5: '"Twinkle, Twinkle, Little Star": the jump up at the start, from the first "Twinkle" to the second one',
  m3: '"Greensleeves": the first jump up',
  M3: '"When the Saints Go Marching In": the first jump up',
}

/**
 * Tell two intervals apart by ear (for example a perfect 5th and a perfect 4th above the same note).
 * Working: hear both, compare the width, then count letter names and semitones from the written notes.
 * Check: the piano keys between the two top notes. Cross-check: hand-written semitone sizes against the engine.
 */
export function earIntervalExample(lower: Pitch, first: string, second: string, clef: ClefName = 'treble'): WorkedExample {
  const ex = new Explained()
  const bottom = withoutOctave(lower)
  const make = (short: string, index: number) => {
    const interval = parseInterval(short)
    const upper = transpose(lower, interval)
    const semis = SEMITONES[short]
    if (semis === undefined) throw new Error(`No hand-written size for ${short}`)
    if (semis !== intervalSemitones(interval) || semis !== midiNumber(upper) - midiNumber(lower)) {
      throw new Error(`Semitone size of ${short} disagrees with the engine`)
    }
    const top = withoutOctave(upper)
    const number = letterNumber(bottom, top)
    const letters = Array.from({ length: number }, (_, i) => letterAt(letterIndex(bottom.letter) + i))
    const count = countStep(bottom, top, ex, `Count the semitones of interval ${index}`)
    const name = intervalName(interval)
    if (count.total !== semis || count.name !== name) throw new Error(`Counting ${short} by letters disagrees with the engine`)
    return { short, upper, top, semis, name, number, letters, count, index }
  }
  const a = make(first, 1)
  const b = make(second, 2)
  if (a.semis === b.semis) throw new Error('The two intervals must have different sizes')
  const wider = a.semis > b.semis ? a : b
  const narrower = a.semis > b.semis ? b : a
  const aid = TUNE_AIDS[first] && TUNE_AIDS[second]
  const walk = pianoWalk(narrower.top, wider.top, ex)
  if (narrower.semis + walk.steps !== wider.semis) throw new Error('The difference between the two intervals does not add up')

  const intervalSteps = (x: typeof a): WorkedStep[] => [
    {
      title: `Count the letter names of interval ${x.index}`,
      text: `Interval ${x.index} goes from ${noteLabel(bottom)} up to ${noteLabel(x.top)}. Count the letter names, counting ${bottom.letter} as 1: ${x.letters.join(', ')}. That is ${x.number} letter names, so it is a ${ordinal(x.number)}.`,
      result: `A ${ordinal(x.number)}`,
      staff: notesOnStaff(clef, [lower, x.upper]),
    },
    ...x.count.steps,
  ]

  return finish({
    title: `Hear the difference: ${a.name} and ${b.name}`,
    task: `You hear two notes, one after the other. Is the interval a ${a.name} or a ${b.name}?`,
    terms: [TERM.interval, TERM.semitone, intervalTerm(a.name), intervalTerm(b.name), ...signTerms([a.top, b.top]).filter((t) => t !== TERM.natural)],
    steps: [
      {
        title: 'Play interval 1',
        text: 'You hear two notes, one after the other, going up. Play it a few times and hum both notes.',
        result: `Interval 1: a jump up from ${noteLabel(bottom)}`,
        listen: FOR_LISTEN(`Play interval 1: ${a.name}`, intervalAudio(lower, a.upper, 'up')),
      },
      {
        title: 'Play interval 2',
        text: `This one starts on the same note, ${noteLabel(bottom)}. Play it a few times and hum it too.`,
        result: `Interval 2: a jump up from ${noteLabel(bottom)}`,
        listen: FOR_LISTEN(`Play interval 2: ${b.name}`, intervalAudio(lower, b.upper, 'up')),
      },
      {
        title: 'Decide which jump is wider',
        text: 'Hum each pair of notes. For the wider jump your voice has to travel further. You can also hear the wider interval with both notes at once: the button plays it.',
        result: `Interval ${wider.index} is wider`,
        listen: FOR_LISTEN(`Play interval ${wider.index} with both notes at once`, intervalAudio(lower, wider.upper, 'together')),
      },
      ...(aid
        ? [
            {
              title: 'Try a memory aid',
              text: `For the ${a.name}, think of ${TUNE_AIDS[first]}. For the ${b.name}, think of ${TUNE_AIDS[second]}.`,
              result: 'Hum each tune and see which interval it matches',
            },
          ]
        : []),
      ...intervalSteps(a),
      ...intervalSteps(b),
      {
        title: 'Check another way: count between the two top notes',
        text: `The two intervals share the bottom note, so the difference is between the top notes. Count up one piano key at a time from ${noteLabel(narrower.top)} to ${noteLabel(wider.top)}: ${walk.text}.${walk.note} So ${narrower.semis} + ${walk.steps} = ${wider.semis}.`,
        result: `The ${wider.name} is ${walk.steps} semitone${walk.steps === 1 ? '' : 's'} wider, as you heard`,
      },
    ],
    answer: `The ${a.name} is ${a.semis} semitones wide and the ${b.name} is ${b.semis}. Listen for the wider jump.`,
  })
}

const ARRIVES_HOME: Record<CadenceType, boolean> = { perfect: true, plagal: true, imperfect: false, interrupted: false }

const SECOND_QUESTION: Record<CadenceType, { title: string; text: string; result: string }> = {
  perfect: {
    title: 'Ask: is the arrival strong or gentle?',
    text: 'A perfect cadence is often described as a strong arrival, like a full stop. A plagal cadence is often described as gentle, like the "Amen" at the end of a hymn.',
    result: 'A strong pull into the last chord',
  },
  plagal: {
    title: 'Ask: is the arrival strong or gentle?',
    text: 'A perfect cadence is often described as a strong arrival, like a full stop. A plagal cadence is often described as gentle, like the "Amen" at the end of a hymn.',
    result: 'A gentle, "Amen" arrival',
  },
  imperfect: {
    title: 'Ask: does it just stop, or surprise you?',
    text: 'An imperfect cadence is often described as stopping in mid-air, like a comma or a question. An interrupted cadence is often described as a surprise: it seems to head home, then goes somewhere else.',
    result: 'It stops, as if there is more to come',
  },
  interrupted: {
    title: 'Ask: does it just stop, or surprise you?',
    text: 'An imperfect cadence is often described as stopping in mid-air, like a comma or a question. An interrupted cadence is often described as a surprise: it seems to head home, then goes somewhere else.',
    result: 'A surprise: it seems to head home, but does not',
  },
}

/** How each cadence's sound leads to its name. {I}, {IV} and {vi} are filled in for the key. */
const SOUND_MATCH: Record<CadenceType, string> = {
  perfect: 'It arrives home with a strong pull. That fits a perfect cadence: V then {I}.',
  plagal: 'It arrives home gently. That fits a plagal cadence: {IV} then {I}.',
  imperfect: 'It stops away from home, as if waiting. That fits an imperfect cadence, which ends on V.',
  interrupted: 'It heads for home but lands somewhere else. That fits an interrupted cadence: V then {vi} instead of {I}.',
}

const CADENCE_TERM: Record<CadenceType, WorkedTerm> = {
  perfect: TERM.perfectCadence,
  imperfect: TERM.imperfectCadence,
  plagal: TERM.plagalCadence,
  interrupted: TERM.interruptedCadence,
}

/**
 * Identify a cadence by ear: the key chord, then the two chords of the cadence.
 * Working: the two listening questions, then the notes and numerals of the two chords.
 * Check: the bass line. Cross-check: the engine's `cadence` and `classifyCadence`.
 */
export function earCadenceExample(key: Key, type: CadenceType, clef: ClefName = 'treble'): WorkedExample {
  const ex = new Explained()
  const c = cadence(key, type)
  if (classifyCadence(key, c.chords[0], c.chords[1]) !== type) throw new Error('The engine does not classify its own cadence')
  const tonic = cadence(key, 'perfect').chords[1]
  const [keyChord, first, second] = sharedPictures([tonic, c.chords[0], c.chords[1]], clef) as [Pitch[], Pitch[], Pitch[]]
  const kName = keyLabel(key)
  const pair = `${c.numerals[0]} then ${c.numerals[1]}`
  const home = ARRIVES_HOME[type]
  const { steps: scaleWork } = scaleSteps(key, ex)
  const n1 = numeralSteps(key, c.chords[0], ex, 'first')
  const n2 = numeralSteps(key, c.chords[1], ex, 'second')
  if (`${n1.analysis.numeral} then ${n2.analysis.numeral}` !== pair) throw new Error('Numerals found by hand disagree with the engine')
  const q = SECOND_QUESTION[type]
  const tonicNumeral = key.mode === 'minor' ? 'i' : 'I'

  return finish({
    title: `Hear ${withArticle(type)} cadence`,
    task: 'You hear the key chord and then two more chords. Which cadence is it?',
    terms: [TERM.cadence, TERM.phrase, TERM.tonic, CADENCE_TERM[type], TERM.key, TERM.scale, TERM.degree, TERM.roman, TERM.rootPosition, TERM.semitone, ...n1.terms, ...n2.terms, TERM.bassLine],
    steps: [
      {
        title: 'Play the sound',
        text: `First you hear the tonic chord${ex.once('tonic', ' (the home chord of the key)')}, then a pause, then the two chords of the cadence${ex.once('cadence', ' (the end of a phrase, a musical sentence)')}. Play it two or three times. Do not try to name the chords yet.`,
        result: 'Home chord, pause, then two chords',
        listen: FOR_LISTEN('Play the key chord and the cadence', cadenceAudio(keyChord, first, second)),
      },
      {
        title: 'Ask: does the last chord sound like home?',
        text: 'Compare the very last chord with the first chord you heard, the home chord. Does the music feel as if it has arrived, or as if it is still waiting to go on?',
        result: home ? 'Yes: it ends on home' : 'No: it does not end on home',
      },
      { title: q.title, text: q.text, result: q.result },
      {
        title: 'Match the sound to a cadence',
        text: `${SOUND_MATCH[type].replace('{I}', tonicNumeral).replace('{vi}', key.mode === 'minor' ? 'VI' : 'vi').replace('{IV}', key.mode === 'minor' ? 'iv' : 'IV')} These descriptions are often used, but they are aids, not rules: the notes below prove it.`,
        result: `${capital(withArticle(type))} cadence`,
      },
      {
        title: 'See the chords you heard',
        text: `The key is ${kName}. Here are the two chords of the cadence on the staff, with the key signature.`,
        result: `${notesLabel(chordNotes(c.chords[0]))}, then ${notesLabel(chordNotes(c.chords[1]))}`,
        staff: chordsOnStaff(clef, [first, second], key),
      },
      ...scaleWork,
      rootStep(c.chords[0], 'first', ex),
      ...n1.steps,
      rootStep(c.chords[1], 'second', ex),
      ...n2.steps,
      {
        title: 'Match the numerals to a cadence',
        text: `The pair is ${pair}. ${type === 'perfect' ? `V then ${tonicNumeral} is a perfect cadence.` : type === 'plagal' ? `${key.mode === 'minor' ? 'iv' : 'IV'} then ${tonicNumeral} is a plagal cadence.` : type === 'imperfect' ? 'A cadence that ends on V is an imperfect cadence.' : `V then ${key.mode === 'minor' ? 'VI' : 'vi'}, instead of ${tonicNumeral}, is an interrupted cadence.`}`,
        result: `${pair}: ${withArticle(type)} cadence, as you heard`,
      },
      bassLineCheck(key, c.chords[0], c.chords[1], type),
    ],
    answer: `It was ${withArticle(type)} cadence in ${kName} (${pair}).`,
  })
}

const INVERSION_NAMES = ['root position', 'first inversion', 'second inversion']
const INVERSION_TERM = [TERM.rootPosition, TERM.firstInversion, TERM.secondInversion]
const GAP_RESULT = [
  'Two even gaps: root position',
  'The wider gap is at the top: first inversion',
  'The wider gap is at the bottom: second inversion',
]

/**
 * Hear which inversion a major or minor triad is in, by listening to the bass and to where the wider gap is.
 * Working: the gaps between neighbouring notes, counted by letters.
 * Check: turn the root-position chord over. Cross-check: the engine's `chordPitches`.
 */
export function earInversionExample(chord: Chord, inversion: number, clef: ClefName = 'treble'): WorkedExample {
  if (chord.quality !== 'major' && chord.quality !== 'minor') throw new Error('The gap method is only used for major and minor triads')
  const ex = new Explained()
  const pitches = chordPicture(chord, clef, inversion).sort(comparePitches)
  // The root-position chord that overlaps the one heard: the inversion is made by lifting its lower notes an octave.
  const rootInChord = pitches.find((p) => sameNote(withoutOctave(p), chord.root))!
  const rootPosition = chordPitches(chord, { bassOctave: rootInChord.octave - (inversion > 0 ? 1 : 0) })
  const written = pitches.map(withoutOctave)
  const gaps = [midiNumber(pitches[1]!) - midiNumber(pitches[0]!), midiNumber(pitches[2]!) - midiNumber(pitches[1]!)]
  // Hand-written expectation: first inversion has a 4th (5 semitones) on top; second inversion has a 4th at the bottom.
  const expected = inversion === 0 ? gaps.every((g) => g === 3 || g === 4) : inversion === 1 ? gaps[1] === 5 && gaps[0] !== 5 : gaps[0] === 5 && gaps[1] !== 5
  if (!expected) throw new Error('The gaps do not look like this inversion')
  const bass = written[0]!
  const notes = chordNotes(chord)
  if (!sameNote(bass, notes[inversion]!)) throw new Error('The bass note is not the note this inversion needs')
  const roles = ['root', '3rd', '5th']
  const label = chordWords(chord)
  const lower = countStep(written[0]!, written[1]!, ex, 'Count the lower gap')
  const upper = countStep(written[1]!, written[2]!, ex, 'Count the upper gap')
  if (lower.total !== gaps[0] || upper.total !== gaps[1]) throw new Error('Counting the gaps by letters disagrees with the sound')
  const name = INVERSION_NAMES[inversion]!
  let current = [...notes]
  const turns: string[] = []
  for (let k = 0; k < inversion; k++) {
    current = [...current.slice(1), current[0]!]
    turns.push(notesLabel(current))
  }
  if (notesLabel(current) !== notesLabel(written)) throw new Error('Turning the chord over does not give the notes heard')

  return finish({
    title: `Hear the inversion: ${name}`,
    task: 'You hear a major or minor triad. Which inversion is it in?',
    terms: [TERM.triad, TERM.root, TERM.bass, TERM.rootPosition, TERM.inversion, INVERSION_TERM[inversion]!, TERM.semitone, intervalTerm(lower.name), intervalTerm(upper.name), ...signTerms(written).filter((t) => t !== TERM.natural)],
    steps: [
      {
        title: 'Play the chord',
        text: 'Listen to the whole chord a few times. Then listen again, paying attention only to the lowest note.',
        result: 'One triad: three notes played together',
        listen: listenChord('Play the chord', pitches),
      },
      {
        title: 'Listen to the bass note on its own',
        text: `The bass note${ex.once('bass', ' (the lowest note)')} decides the inversion. Hum it. Ask: is it the root${ex.once('root', ' (the note the chord is named after)')}, the note the chord seems to rest on?`,
        result: 'The bass note, heard on its own',
        listen: { label: 'Play the lowest note only', audio: melodyAudio([pitches[0]!]) },
      },
      {
        title: 'Compare with the chord in root position',
        text: `Here is the same chord in root position, with the root at the bottom. Compare its lowest note with the lowest note of the chord you heard.`,
        result: inversion === 0 ? 'The same bass note: the root is at the bottom' : 'A different bass note: the root is not at the bottom',
        listen: listenChord('Play the same chord in root position', rootPosition),
      },
      {
        title: 'Listen for where the wider gap is',
        text: 'This aid works for major and minor triads. In root position the two gaps are both 3rds, so they sound even. In first inversion the wider gap, a perfect 4th, is at the top. In second inversion it is at the bottom.',
        result: GAP_RESULT[inversion]!,
      },
      {
        title: 'See the notes you heard',
        text: `Read the chord from the bottom up. ${label} is ${notesLabel(notes)} when stacked in 3rds from the root.`,
        result: written.map(noteLabel).join(', '),
        staff: chordsOnStaff(clef, [pitches]),
      },
      ...lower.steps,
      ...upper.steps,
      {
        title: 'Find which chord note is in the bass',
        text: `In ${label} (${notesLabel(notes)}) the bass note, ${noteLabel(bass)}, is the ${roles[inversion]}. Root in the bass is root position; 3rd in the bass is first inversion; 5th in the bass is second inversion.`,
        result: `${noteLabel(bass)} is the ${roles[inversion]}: ${name}, as you heard`,
      },
      {
        title: 'Check another way: turn the chord over',
        text:
          inversion === 0
            ? `Root position needs no turns: ${notesLabel(notes)} is already the order you heard, lowest first.`
            : `Start from root position, ${notesLabel(notes)}. Move the bottom note up to the top ${inversion === 1 ? 'once' : 'twice'}: ${turns.join(', then ')}. That is the order you heard, lowest first.`,
        result: `${capital(name)}, as found`,
      },
    ],
    answer: `It was ${label} in ${name}.`,
  })
}
