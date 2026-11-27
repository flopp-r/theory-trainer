import {
  type AccidentalSign,
  type CadenceType,
  type Chord,
  type ClefName,
  type Key,
  type NoteName,
  type Pitch,
  accidentalsToShow,
  cadence,
  chordNotes,
  classifyCadence,
  keySignature,
  letterAt,
  letterIndex,
} from '../../../theory'
import { DEFINITION } from '../../../questions/cadences'
import { withArticle } from '../../../questions/helpers'
import { cadenceAudio } from '../../../questions/earAudio'
import { keyLabel, noteLabel, notesLabel } from '../../../questions/pitchTools'
import type { WorkedExample, WorkedStep, WorkedTerm } from '../types'
import { chordsOnStaff } from './common'
import { Explained, TERM, andList, capital, finish, fit, sharedPictures } from './chords'
import { handChordSymbol } from './inversions'
import { numeralSteps, scaleSteps, stackSteps } from './romanNumerals'

/*
 * Worked examples for cadences.
 * Working: find each chord's Roman numeral by hand (scale, counts, scale degree, case), then match the pair to the four patterns.
 * Check: the bass line, read as scale degrees. Cross-check: the engine's `cadence` and `classifyCadence`.
 */

/** Hand-written patterns: which pair of numerals is which cadence. Returns null if the pair is not one of the four. */
export function cadenceFromNumerals(first: string, second: string, minor: boolean): CadenceType | null {
  const dominant = first === 'V' || first === 'V7'
  const tonic = minor ? 'i' : 'I'
  if (dominant && second === tonic) return 'perfect'
  if (second === 'V' && (minor ? ['i', 'ii°', 'iv'] : ['I', 'ii', 'IV']).includes(first)) return 'imperfect'
  if (first === (minor ? 'iv' : 'IV') && second === tonic) return 'plagal'
  if (dominant && second === (minor ? 'VI' : 'vi')) return 'interrupted'
  return null
}

/** Hand-written: the cadence that a bass line of two root-position chords (as scale degrees) belongs to. */
export function cadenceFromBass(first: number, second: number): CadenceType | null {
  if (first === 5 && second === 1) return 'perfect'
  if (first === 4 && second === 1) return 'plagal'
  if (first === 5 && second === 6) return 'interrupted'
  if (second === 5 && [1, 2, 4].includes(first)) return 'imperfect'
  return null
}

const BASS_TEXT: Record<CadenceType, string> = {
  perfect: 'A bass line from 5 to 1, dominant to tonic, belongs to a perfect cadence.',
  plagal: 'A bass line from 4 to 1, subdominant to tonic, belongs to a plagal cadence.',
  interrupted: 'A bass line from 5 to 6, dominant to submediant, belongs to an interrupted cadence: the bass steps up instead of falling home to 1.',
  imperfect: 'A bass line that ends on 5, the dominant, belongs to an imperfect cadence.',
}

const SIGN_WORDS: Record<AccidentalSign, string> = {
  '#': 'a sharp (♯)',
  b: 'a flat (♭)',
  n: 'a natural sign (♮)',
  '##': 'a double sharp',
  bb: 'a double flat',
}

/** Which notes need a sign written in front of them, because the key signature does not already give them. */
function signsNeeded(key: Key, groups: readonly (readonly Pitch[])[]): { text: string[]; signs: AccidentalSign[] } {
  const shown = accidentalsToShow(groups, key)
  const signature = keySignature(key)
  const out: string[] = []
  const signs: AccidentalSign[] = []
  groups.forEach((group, g) =>
    group.forEach((p, i) => {
      const sign = shown[g]![i]!
      const inSignature = signature.accidentals.find((a) => a.letter === p.letter)?.accidental ?? 0
      // Independent check: a note's first appearance needs a sign exactly when it differs from the key signature.
      const firstAppearance = !groups.slice(0, g).some((earlier) => earlier.some((q) => q.letter === p.letter && q.octave === p.octave))
      if (firstAppearance && (sign !== null) !== (p.accidental !== inSignature)) throw new Error('Accidental working disagrees with the engine')
      if (sign) {
        const cancels = sign === 'n' ? ` to cancel the ${inSignature > 0 ? 'sharp' : 'flat'} in the key signature` : ''
        out.push(`${noteLabel(p)} needs ${SIGN_WORDS[sign]}${cancels}`)
        signs.push(sign)
      }
    }),
  )
  return { text: out, signs }
}

/** The four patterns in words, for a major key and for a minor key. */
export const PATTERN: Record<'major' | 'minor', Record<CadenceType, string>> = {
  major: { perfect: 'V (or V7) then I', imperfect: 'I, ii or IV then V', plagal: 'IV then I', interrupted: 'V (or V7) then vi' },
  minor: { perfect: 'V (or V7) then i', imperfect: 'i, ii° or iv then V', plagal: 'iv then i', interrupted: 'V (or V7) then VI' },
}

function patternsText(minor: boolean): string {
  const p = PATTERN[minor ? 'minor' : 'major']
  return `Perfect: ${p.perfect}. Imperfect: ${p.imperfect}. Plagal: ${p.plagal}. Interrupted: ${p.interrupted}.`
}

const CADENCE_TERM: Record<CadenceType, WorkedTerm> = {
  perfect: TERM.perfectCadence,
  imperfect: TERM.imperfectCadence,
  plagal: TERM.plagalCadence,
  interrupted: TERM.interruptedCadence,
}

/** The tonic chord, for the key chord at the start of the sound. */
function tonicOf(key: Key): Chord {
  return cadence(key, 'perfect').chords[1]
}

/** Degree (1 to 7) of a chord's root in a key, by letters, for the bass-line check. */
const degreeOf = (key: Key, n: NoteName) => ((letterIndex(n.letter) - letterIndex(key.tonic.letter) + 7) % 7) + 1

/** The bass-line check, shared with the ear training examples. */
export function bassLineCheck(key: Key, first: Chord, second: Chord, type: CadenceType): WorkedStep {
  const d1 = degreeOf(key, first.root)
  const d2 = degreeOf(key, second.root)
  if (cadenceFromBass(d1, d2) !== type) throw new Error(`The bass line ${d1} to ${d2} does not give a ${type} cadence`)
  return {
    title: 'Check another way: follow the bass line',
    text: `Both chords are in root position, so the bass notes are the roots: ${noteLabel(first.root)} then ${noteLabel(second.root)}, scale degrees ${d1} then ${d2}. ${BASS_TEXT[type]}`,
    result: `Bass ${d1} to ${d2}: ${withArticle(type)} cadence, as found`,
  }
}

/** "Read the first chord's notes" step: letters skip one each time, so the lowest note is the root. */
export function rootStep(chord: Chord, which: string, ex: Explained): WorkedStep {
  const notes = chordNotes(chord)
  const skips = notes.slice(1).map((n, i) => `${notes[i]!.letter} to ${n.letter} skips ${letterAt(letterIndex(notes[i]!.letter) + 1)}`)
  return {
    title: `Read the ${which} chord from the bottom up`,
    text: `${capital(skips.join('; '))}. The notes are stacked in 3rds, so the chord is in root position${ex.once('root-position', ' (root at the bottom)')}: the lowest note is the root${ex.once('root', ' (the note the chord is built on and named after)')}.`,
    result: `${notesLabel(notes)}: root ${noteLabel(chord.root)}`,
  }
}

const KEY_TERMS = [TERM.key, TERM.scale, TERM.keySignature, TERM.tonic, TERM.degree, TERM.roman, TERM.naturalMinor, TERM.root, TERM.rootPosition, TERM.semitone]

/**
 * A cadence in a key, worked two ways:
 * `identify` starts from the two chords on the staff and finds the type;
 * `write` starts from the type and writes the two chords.
 * Check: the bass line as scale degrees. Cross-check: the engine's `cadence` and `classifyCadence`.
 */
export function cadenceExample(key: Key, type: CadenceType, task: 'identify' | 'write' = 'identify', variant = 0, clef: ClefName = 'treble'): WorkedExample {
  const ex = new Explained()
  const c = cadence(key, type, variant)
  const [first, second] = c.chords
  const minor = key.mode === 'minor'
  if (classifyCadence(key, first, second) !== type) throw new Error('The engine does not classify its own cadence as the right type')
  if (cadenceFromNumerals(c.numerals[0], c.numerals[1], minor) !== type) throw new Error('The numeral patterns disagree with the engine')
  const [keyChordPitches, firstPitches, secondPitches] = sharedPictures([tonicOf(key), first, second], clef) as [Pitch[], Pitch[], Pitch[]]
  const kName = keyLabel(key)
  const staff = chordsOnStaff(clef, [firstPitches, secondPitches], key)
  const listen = { label: `Hear the ${type} cadence in ${kName}`, audio: cadenceAudio(keyChordPitches, firstPitches, secondPitches) }
  const symbols = `${handChordSymbol(first, 0)} then ${handChordSymbol(second, 0)}`
  const pair = `${c.numerals[0]} then ${c.numerals[1]}`
  const { steps: scaleWork } = scaleSteps(key, ex)
  const cadenceWords = `a cadence${ex.once('cadence', ' (the two chords at the end of a phrase, a musical sentence)')}`
  const homeNote = minor ? ' (In a minor key the tonic chord is minor, so it is i.)' : ''

  if (task === 'identify') {
    const n1 = numeralSteps(key, first, ex, 'first')
    const n2 = numeralSteps(key, second, ex, 'second')
    if (n1.analysis.numeral !== c.numerals[0] || n2.analysis.numeral !== c.numerals[1]) throw new Error('Numerals found by hand disagree with the engine')
    if (cadenceFromNumerals(n1.analysis.numeral, n2.analysis.numeral, minor) !== type) throw new Error('The pair found by hand is not the expected cadence')
    return finish({
      title: `Identify ${withArticle(type)} cadence in ${kName}`,
      task: `The key is ${kName}. What type of cadence is on the staff?`,
      terms: [TERM.cadence, TERM.phrase, CADENCE_TERM[type], ...KEY_TERMS, ...n1.terms, ...n2.terms, TERM.bassLine],
      steps: [
        {
          title: 'Read the key and look at the two chords',
          text: `The key is ${kName}. The staff shows ${cadenceWords}. The sound plays the tonic chord first, so you hear where home is, then the two chords of the cadence.`,
          result: `Key: ${kName}. Chords: ${notesLabel(chordNotes(first))}, then ${notesLabel(chordNotes(second))}`,
          staff,
          listen,
        },
        ...scaleWork,
        rootStep(first, 'first', ex),
        ...n1.steps,
        rootStep(second, 'second', ex),
        ...n2.steps,
        {
          title: 'Match the pair to a cadence',
          text: `Compare ${pair}, in that order, with the four cadences. ${patternsText(minor)}${homeNote}`,
          result: `${pair}: ${withArticle(type)} cadence`,
        },
        bassLineCheck(key, first, second, type),
      ],
      answer: `It is ${withArticle(type)} cadence (${pair}, ${symbols}).`,
    })
  }

  const s1 = stackSteps(key, c.numerals[0], ex, 'first')
  const s2 = stackSteps(key, c.numerals[1], ex, 'second')
  if (classifyCadence(key, s1.build.chord, s2.build.chord) !== type) throw new Error('The chords built by hand are not this cadence')
  const signature = keySignature(key)
  const sigNames = signature.accidentals.map(noteLabel)
  const sigText = sigNames.length === 0 ? 'no sharps or flats, so nothing is written there' : `${sigNames.length} ${signature.kind === 'sharps' ? 'sharp' : 'flat'}${sigNames.length === 1 ? '' : 's'} (${andList(sigNames)})`
  const needed = signsNeeded(key, [firstPitches, secondPitches])
  const signText =
    needed.text.length === 0
      ? 'Every note is already given by the key signature, so no sign is needed in front of any note.'
      : `The key signature does not give ${needed.text.length === 1 ? 'this note, so it needs' : 'these notes, so each needs'} an accidental${ex.once('accidental', ' (a sign written in front of the note)')}: ${needed.text.join('; ')}.`
  const usesNatural = needed.signs.includes('n')

  return finish({
    title: `Write ${withArticle(type)} cadence in ${kName}`,
    task: `Write ${withArticle(type)} cadence in ${kName} on the staff.`,
    terms: [
      TERM.cadence,
      TERM.phrase,
      CADENCE_TERM[type],
      ...KEY_TERMS,
      TERM.stacked,
      ...s1.terms,
      ...s2.terms,
      ...(needed.text.length > 0 ? [TERM.accidental] : []),
      ...(usesNatural ? [TERM.naturalSign] : []),
      TERM.bassLine,
    ],
    steps: [
      {
        title: 'Look up the pattern',
        text: fit(`You are writing ${cadenceWords}. ${DEFINITION[type]} In ${kName} that is ${pair}.${homeNote}`, `You are writing ${cadenceWords}. ${DEFINITION[type]} In ${kName} that is ${pair}.${minor ? ' (The minor tonic chord is i.)' : ''}`),
        result: pair,
      },
      ...scaleWork,
      ...s1.steps,
      ...s2.steps,
      {
        title: 'Write the key signature',
        text: `Start the staff with the key signature of ${kName}: ${sigText}.`,
        result: sigNames.length === 0 ? 'No sharps or flats' : andList(sigNames),
      },
      {
        title: 'Write the two chords and any accidentals',
        text: `Write each chord as three notes stacked on neighbouring lines or spaces, first chord on the left. ${signText}`,
        result: needed.text.length === 0 ? 'No accidentals needed' : capital(needed.text.join('; ')),
        staff,
      },
      {
        title: 'Listen to your cadence',
        text: `The sound starts with the tonic chord, ${handChordSymbol(tonicOf(key), 0)}, so you hear where home is. Then it plays your two chords, ${symbols}.`,
        result: `${handChordSymbol(tonicOf(key), 0)}, then ${symbols.replace(' then ', ', then ')}`,
        listen,
      },
      bassLineCheck(key, s1.build.chord, s2.build.chord, type),
    ],
    answer: `The ${type} cadence in ${kName} is ${symbols} (${pair}).`,
  })
}
