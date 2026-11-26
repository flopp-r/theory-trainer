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
  midiNumber,
  parseInterval,
  pitchClass,
  sameNote,
  transpose,
  withoutOctave,
} from '../../../theory'
import { DEFINITION } from '../../../questions/cadences'
import { cadenceAudio, chordAudio, intervalAudio } from '../../../questions/earAudio'
import { withArticle } from '../../../questions/helpers'
import { chordWords } from '../../../questions/chords'
import { keyLabel, noteLabel, notesLabel } from '../../../questions/pitchTools'
import type { ListenItem, WorkedExample } from '../types'
import { listenChord, melodyAudio } from './audio'
import { chordsOnStaff, notesOnStaff } from './common'
import { TRIAD_RECIPE, type TriadQuality, chordPicture, sharedPictures } from './chords'
import { handChordSymbol } from './inversions'

/*
 * Worked examples for ear training. Every sound is real notes worked out with the engine and played with the same
 * helpers the listening questions use. Descriptions of how things sound are labelled "often described as":
 * they are common ways of hearing, not rules.
 */

const mod = (n: number, m: number) => ((n % m) + m) % m

/** Hand-written semitone sizes of the intervals used by ear questions. */
const SEMITONES: Record<string, number> = { m2: 1, M2: 2, m3: 3, M3: 4, P4: 5, A4: 6, P5: 7, m6: 8, M6: 9, m7: 10, M7: 11, P8: 12 }

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

/** Which notes differ between two chords on the same root, in plain words. */
function differenceText(a: readonly NoteName[], b: readonly NoteName[]): string {
  const roles = ['root', '3rd', '5th']
  const diffs = a
    .map((n, i) => ({ n, m: b[i]!, role: roles[i]! }))
    .filter(({ n, m }) => !sameNote(n, m))
    .map(({ n, m, role }) => {
      const moved = mod(pitchClass(m) - pitchClass(n), 12)
      const down = moved > 6 ? 12 - moved : moved
      return `the ${role} (${noteLabel(n)} against ${noteLabel(m)}, one ${down === 1 ? 'semitone' : `${down} semitones`} apart)`
    })
  if (diffs.length !== 1) throw new Error('The two chords should differ in exactly one note')
  return `Only ${diffs[0]} is different. The other notes are the same.`
}

/**
 * Tell a triad apart from its closest neighbour by ear: listen, describe, compare, decide, then see the notes.
 * The sounds are the chord and the same-root chord it is compared with.
 */
export function earChordExample(root: NoteName, quality: TriadQuality, clef: ClefName = 'treble'): WorkedExample {
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

  const ask = quality === 'major' || quality === 'minor' ? 'Does it sound **brighter** and settled, or **darker** and sadder?' : 'Does it sound settled, or **tense and unsettled**?'
  return {
    title: `Hear ${label}: ${quality === 'major' || quality === 'minor' ? 'deciding major or minor' : `telling ${quality} from ${otherQuality}`}`,
    task: `You hear a chord. Is it ${quality === 'major' || quality === 'minor' ? 'major or minor' : `${quality} or ${otherQuality}`}?`,
    steps: [
      {
        text: `Press play and listen to the whole sound, not to each note. Play it two or three times. Try to decide before you read on.`,
        listen: FOR_LISTEN('Play the mystery chord', chordAudio(pitches, 'block')),
      },
      { text: `Ask yourself one question. ${ask} Hold on to your answer.` },
      {
        text: `Now **compare**. Here is a second chord on the same root, ${noteLabel(root)}, played so that you can hear the difference. Listen to the first chord again, then this one.`,
        listen: FOR_LISTEN(`Play the comparison (${otherLabel})`, chordAudio(otherPitches, 'block')),
      },
      {
        text: `Decide which chord fits which description. ${quality[0]!.toUpperCase()}${quality.slice(1)} chords are often described as ${OFTEN_DESCRIBED[quality]}. ${otherQuality[0]!.toUpperCase()}${otherQuality.slice(1)} chords are often described as ${OFTEN_DESCRIBED[otherQuality]}. These are common descriptions, not rules, so trust the *difference* you hear between the two chords more than any word. Here the first chord fits "${OFTEN_DESCRIBED[quality]}", so it is **${label}**.`,
      },
      {
        text: `Now see what you heard. The first chord is **${notesLabel(notes)}** and the comparison is **${notesLabel(otherNotes)}**. ${diff}`,
        staff: chordsOnStaff(clef, [pitches, otherPitches]),
      },
      {
        text: `Check by the recipe: a ${quality} triad is a ${recipe.lower} then a ${recipe.upper}; a ${otherQuality} triad is a ${otherRecipe.lower} then a ${otherRecipe.upper}. One small change in one note is all that separates the two sounds. ✓`,
        listen: listenChord(`Play ${label} again`, pitches),
      },
    ],
    answer: `The chord was ${label} (${notesLabel(notes)}).`,
  }
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
 * Working: hear both, compare the width, count the semitones from the written notes.
 * Cross-check: hand-written semitone sizes against the engine.
 */
export function earIntervalExample(lower: Pitch, first: string, second: string, clef: ClefName = 'treble'): WorkedExample {
  const make = (short: string) => {
    const interval = parseInterval(short)
    const upper = transpose(lower, interval)
    const semis = SEMITONES[short]
    if (semis === undefined) throw new Error(`No hand-written size for ${short}`)
    if (semis !== intervalSemitones(interval) || semis !== midiNumber(upper) - midiNumber(lower)) {
      throw new Error(`Semitone size of ${short} disagrees with the engine`)
    }
    return { short, upper, semis, name: intervalName(interval) }
  }
  const a = make(first)
  const b = make(second)
  if (a.semis === b.semis) throw new Error('The two intervals must have different sizes')
  const wider = a.semis > b.semis ? a : b
  const narrower = a.semis > b.semis ? b : a
  const aid = TUNE_AIDS[first] && TUNE_AIDS[second]
  return {
    title: `Hear the difference: ${a.name} and ${b.name}`,
    task: `You hear two notes, one after the other. Is the interval a ${a.name} or a ${b.name}?`,
    steps: [
      {
        text: `Listen to this interval (two notes, going up). Play it a few times. Then listen to the next one and compare.`,
        listen: FOR_LISTEN(`Play interval 1: ${a.name}`, intervalAudio(lower, a.upper, 'up')),
      },
      {
        text: `Here is the other interval, starting from the same note.`,
        listen: FOR_LISTEN(`Play interval 2: ${b.name}`, intervalAudio(lower, b.upper, 'up')),
      },
      {
        text: `Decide which one has the **wider** jump. The wider one has more semitones in it. Here, the ${wider.name} is wider (${wider.semis} semitones) and the ${narrower.name} is narrower (${narrower.semis} semitones). Sing or hum the two notes and feel your voice travel further for the wider one. You can also hear the wider interval with both notes at once.`,
        listen: FOR_LISTEN(`Play the ${wider.name} with both notes at once`, intervalAudio(lower, wider.upper, 'together')),
      },
      ...(aid
        ? [
            {
              text: `A memory aid: for the ${a.name}, think of ${TUNE_AIDS[first]}. For the ${b.name}, think of ${TUNE_AIDS[second]}. Hum the start of the tune and see which one the two notes match.`,
            },
          ]
        : []),
      {
        text: `Now see them written, bottom note ${noteLabel(withoutOctave(lower))}. The ${a.name} goes up to **${noteLabel(withoutOctave(a.upper))}**: ${a.semis} semitones.`,
        staff: notesOnStaff(clef, [lower, a.upper]),
      },
      {
        text: `The ${b.name} goes up to **${noteLabel(withoutOctave(b.upper))}**: ${b.semis} semitones.`,
        staff: notesOnStaff(clef, [lower, b.upper]),
      },
      {
        text: `Check: ${a.name} is ${a.semis} semitones and ${b.name} is ${b.semis} semitones, so they differ by ${Math.abs(a.semis - b.semis)}. A difference that small is what your ear is learning to notice. ✓`,
      },
    ],
    answer: `The ${a.name} is ${a.semis} semitones wide and the ${b.name} is ${b.semis}. Listen for the wider jump.`,
  }
}

const CADENCE_EAR: Record<CadenceType, { question: string; sound: string }> = {
  perfect: {
    question: 'The last chord sounds like home: the chord you heard first.',
    sound: 'It sounds finished, like a full stop, with a strong pull into the last chord.',
  },
  imperfect: {
    question: 'The last chord does not sound like home. It stops, like a comma or a question.',
    sound: 'It sounds unfinished, like a comma or a question, because it stops on chord V.',
  },
  plagal: {
    question: 'The last chord sounds like home, but the way it arrives is gentle.',
    sound: 'It sounds gentle and settled, like the "Amen" at the end of a hymn.',
  },
  interrupted: {
    question: 'It seems to be heading home but does not arrive. The last chord is a surprise.',
    sound: 'It sounds like a surprise: it seems to be heading home to I, but goes somewhere else.',
  },
}

const EAR_QUESTIONS = 'Does the last chord sound like home, the chord you heard first? If it does, was the arrival strong (perfect) or gentle (plagal)? If it does not, does it simply stop (imperfect) or does it surprise you (interrupted)?'

/**
 * Identify a cadence by ear: the key chord, then the two chords of the cadence.
 * Working: ask the three listening questions, then see the numerals.
 * Cross-check: the engine's `cadence` and `classifyCadence`.
 */
export function earCadenceExample(key: Key, type: CadenceType, clef: ClefName = 'treble'): WorkedExample {
  const c = cadence(key, type)
  if (classifyCadence(key, c.chords[0], c.chords[1]) !== type) throw new Error('The engine does not classify its own cadence')
  const tonic = cadence(key, 'perfect').chords[1]
  const [keyChord, first, second] = sharedPictures([tonic, c.chords[0], c.chords[1]], clef) as [Pitch[], Pitch[], Pitch[]]
  const kName = keyLabel(key)
  const symbols = `${handChordSymbol(c.chords[0], 0)} then ${handChordSymbol(c.chords[1], 0)}`
  const pair = `${c.numerals[0]} then ${c.numerals[1]}`
  return {
    title: `Hear ${withArticle(type)} cadence`,
    task: 'You hear the key chord and then two more chords. Which cadence is it?',
    steps: [
      {
        text: `Press play. You hear the **key chord** first (the home chord), a pause, and then the **two chords of the cadence**. Play it two or three times. Do not worry about naming the chords yet.`,
        listen: FOR_LISTEN('Play the key chord and the cadence', cadenceAudio(keyChord, first, second)),
      },
      { text: `Ask three questions about the very last chord. ${EAR_QUESTIONS}` },
      { text: `Listen again with those questions in mind. For this cadence the answer is: ${CADENCE_EAR[type].question}` },
      { text: `Match it to the sounds. ${CADENCE_EAR[type].sound} That is how ${withArticle(type)} cadence is often described. It is a common description, not a rule.` },
      {
        text: `Now see what you heard. The key is ${kName}. The two chords were ${symbols}, which are **${pair}**.`,
        staff: chordsOnStaff(clef, [first, second], key),
      },
      { text: `Check with the definition: ${DEFINITION[type]} ✓` },
    ],
    answer: `It was ${withArticle(type)} cadence in ${kName} (${pair}).`,
  }
}

const GAP_WORDS: Record<number, string> = { 3: 'a minor 3rd', 4: 'a major 3rd', 5: 'a perfect 4th' }

/**
 * Hear which inversion a major or minor triad is in, by listening to the bass and to where the wider gap is.
 * Working: the gaps between neighbouring notes, counted in semitones.
 * Cross-check: the engine's `chordPitches` for the gaps, and the inversion name from hand.
 */
export function earInversionExample(chord: Chord, inversion: number, clef: ClefName = 'treble'): WorkedExample {
  if (chord.quality !== 'major' && chord.quality !== 'minor') throw new Error('The gap method is only used for major and minor triads')
  const pitches = chordPicture(chord, clef, inversion).sort(comparePitches)
  // The root-position chord that overlaps the one heard: the inversion is made by lifting its lower notes an octave.
  const rootInChord = pitches.find((p) => sameNote(withoutOctave(p), chord.root))!
  const rootPosition = chordPitches(chord, { bassOctave: rootInChord.octave - (inversion > 0 ? 1 : 0) })
  const gaps = [midiNumber(pitches[1]!) - midiNumber(pitches[0]!), midiNumber(pitches[2]!) - midiNumber(pitches[1]!)]
  // Hand-written expectation: first inversion has a 4th (5 semitones) on top; second inversion has a 4th at the bottom.
  const expected = inversion === 0 ? gaps.every((g) => g === 3 || g === 4) : inversion === 1 ? gaps[1] === 5 && gaps[0] !== 5 : gaps[0] === 5 && gaps[1] !== 5
  if (!expected) throw new Error('The gaps do not look like this inversion')
  const names = ['root position', 'first inversion', 'second inversion']
  const bass = pitches[0]!
  const notes = chordNotes(chord)
  if (!sameNote(withoutOctave(bass), notes[inversion]!)) throw new Error('The bass note is not the note this inversion needs')
  const roles = ['root', '3rd', '5th']
  const label = chordWords(chord)
  const where = inversion === 0 ? 'in this chord the two gaps are both thirds, so the notes are evenly spaced' : inversion === 1 ? 'in this chord the wider gap is at the **top**: a 3rd at the bottom and a 4th above it' : 'in this chord the wider gap is at the **bottom**: a 4th at the bottom and a 3rd above it'
  const gapText = gaps.map((g) => GAP_WORDS[g] ?? `${g} semitones`).join(' then ')
  return {
    title: `Hear the inversion: ${names[inversion]}`,
    task: 'You hear a major or minor triad. Which inversion is it in?',
    steps: [
      { text: `Press play and listen to the chord a few times.`, listen: listenChord('Play the chord', pitches) },
      {
        text: `Listen to the **lowest note** on its own. This is the bass. Ask: does it sound like the note the chord is "named after", the home note of the chord? If it does, the chord is probably in root position.`,
        listen: { label: 'Play the lowest note only', audio: melodyAudio([bass]) },
      },
      {
        text: `For comparison, here is the same chord in **root position** (the root at the bottom). Compare its bottom note with the bottom note of the chord you heard.`,
        listen: listenChord('Play the same chord in root position', rootPosition),
      },
      {
        text: `Listen for **where the wide gap is** (an aid that works for major and minor triads). In root position the notes are evenly spaced in thirds. In first inversion the wider gap, a perfect 4th, is at the top. In second inversion it is at the bottom. So ${where}.`,
      },
      {
        text: `Now see what you heard: **${notes.map(noteLabel).join(' ')}** is ${label}. The lowest note is **${noteLabel(withoutOctave(bass))}**, the ${roles[inversion]} of the chord. The gaps from the bottom are ${gapText}.`,
        staff: chordsOnStaff(clef, [pitches]),
      },
      {
        text: `Check with the rule: the ${roles[inversion]} is lowest, so the chord is in **${names[inversion]}**. ✓`,
      },
    ],
    answer: `It was ${label} in ${names[inversion]}.`,
  }
}
