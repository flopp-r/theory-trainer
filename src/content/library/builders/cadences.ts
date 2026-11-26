import {
  type AccidentalSign,
  type CadenceType,
  type Chord,
  type ClefName,
  type Key,
  type Pitch,
  accidentalsToShow,
  cadence,
  chordNotes,
  classifyCadence,
  keySignature,
} from '../../../theory'
import { DEFINITION } from '../../../questions/cadences'
import { withArticle } from '../../../questions/helpers'
import { cadenceAudio } from '../../../questions/earAudio'
import { chordWords } from '../../../questions/chords'
import { keyLabel, noteLabel, notesLabel } from '../../../questions/pitchTools'
import type { WorkedExample } from '../types'
import { chordsOnStaff } from './common'
import { qualityFromSemitones, semitoneWorking, sharedPictures } from './chords'
import { handChordSymbol } from './inversions'
import { buildFromNumeral, numberedScale, numeralLongHand } from './romanNumerals'

/*
 * Worked examples for cadences.
 * Working: find each chord's Roman numeral by hand (scale, position, type), then match the pair to the four patterns.
 * Cross-check: the engine's `cadence` and `classifyCadence`.
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

const SIGN_WORDS: Record<AccidentalSign, string> = {
  '#': 'a sharp (♯)',
  b: 'a flat (♭)',
  n: 'a natural (♮)',
  '##': 'a double sharp',
  bb: 'a double flat',
}

/** Which notes need a sign written in front of them, because the key signature does not already give them. */
function signsNeeded(key: Key, groups: readonly (readonly Pitch[])[]): string[] {
  const shown = accidentalsToShow(groups, key)
  const signature = keySignature(key)
  const out: string[] = []
  groups.forEach((group, g) =>
    group.forEach((p, i) => {
      const sign = shown[g]![i]!
      const inSignature = signature.accidentals.find((a) => a.letter === p.letter)?.accidental ?? 0
      // Independent check: a note's first appearance needs a sign exactly when it differs from the key signature.
      const firstAppearance = !groups.slice(0, g).some((earlier) => earlier.some((q) => q.letter === p.letter && q.octave === p.octave))
      if (firstAppearance && (sign !== null) !== (p.accidental !== inSignature)) throw new Error('Accidental working disagrees with the engine')
      if (sign) out.push(`${noteLabel(p)} needs ${SIGN_WORDS[sign]}`)
    }),
  )
  return out
}

function chordDescription(key: Key, chord: Chord): { numeral: string; text: string } {
  const a = numeralLongHand(key, chord)
  const notes = chordNotes(chord)
  const counts = notes.slice(1).map((n) => semitoneWorking(chord.root, n).total)
  if (qualityFromSemitones(counts) !== chord.quality) throw new Error('Chord type working disagrees')
  const symbol = handChordSymbol(chord, 0)
  const raised = a.outside.length > 0 ? ` ${noteLabel(a.outside[0]!)} is not in the natural minor scale: it is the 7th note raised by a semitone (the leading note), which minor keys use on purpose.` : ''
  return {
    numeral: a.numeral,
    text: `**${notesLabel(notes)}**. The root is ${noteLabel(chord.root)}, which is note ${a.degree} of the scale. From the root, ${notes
      .slice(1)
      .map((n, i) => `${noteLabel(n)} is ${counts[i]}`)
      .join(' and ')} semitones: **${chordWords(chord)}** (chord symbol ${symbol}).${raised} In Roman numerals that is **${a.numeral}**.`,
  }
}

/** The four patterns in plain words, for a major key and for a minor key. */
export const PATTERN: Record<'major' | 'minor', Record<CadenceType, string>> = {
  major: { perfect: 'V (or V7) then I', imperfect: 'I, ii or IV then V', plagal: 'IV then I', interrupted: 'V (or V7) then vi' },
  minor: { perfect: 'V (or V7) then i', imperfect: 'i, ii° or iv then V', plagal: 'iv then i', interrupted: 'V (or V7) then VI' },
}

function patternsText(minor: boolean): string {
  const p = PATTERN[minor ? 'minor' : 'major']
  return `a **perfect** cadence is ${p.perfect}; an **imperfect** cadence is ${p.imperfect}; a **plagal** cadence is ${p.plagal}; an **interrupted** cadence is ${p.interrupted}.`
}

/** The tonic chord, for the key chord at the start of the sound. */
function tonicOf(key: Key): Chord {
  return cadence(key, 'perfect').chords[1]
}

/**
 * A cadence in a key, worked two ways:
 * `identify` starts from the two chords on the staff and finds the type;
 * `write` starts from the type and writes the two chords.
 * Cross-check: the engine's `cadence` and `classifyCadence`.
 */
export function cadenceExample(key: Key, type: CadenceType, task: 'identify' | 'write' = 'identify', variant = 0, clef: ClefName = 'treble'): WorkedExample {
  const c = cadence(key, type, variant)
  const [first, second] = c.chords
  const minor = key.mode === 'minor'
  if (classifyCadence(key, first, second) !== type) throw new Error('The engine does not classify its own cadence as the right type')
  if (cadenceFromNumerals(c.numerals[0], c.numerals[1], minor) !== type) throw new Error('The numeral patterns disagree with the engine')
  const [keyChordPitches, firstPitches, secondPitches] = sharedPictures([tonicOf(key), first, second], clef) as [Pitch[], Pitch[], Pitch[]]
  const kName = keyLabel(key)
  const staff = chordsOnStaff(clef, [firstPitches, secondPitches], key)
  const listen = { label: `Hear the ${type} cadence in ${kName}`, audio: cadenceAudio(keyChordPitches, firstPitches, secondPitches) }
  const signs = signsNeeded(key, [firstPitches, secondPitches])
  const signText = signs.length === 0 ? 'Every note is already given by the key signature, so no sign is needed in front of any note.' : `The key signature does not give these, so each needs a sign written in front of it: ${signs.join('; ')}.`
  const symbols = `${handChordSymbol(first, 0)} then ${handChordSymbol(second, 0)}`
  const pair = `${c.numerals[0]} then ${c.numerals[1]}`

  if (task === 'identify') {
    const d1 = chordDescription(key, first)
    const d2 = chordDescription(key, second)
    if (d1.numeral !== c.numerals[0] || d2.numeral !== c.numerals[1]) throw new Error('Numerals found by hand disagree with the engine')
    const found = cadenceFromNumerals(d1.numeral, d2.numeral, minor)
    if (found !== type) throw new Error('The pair found by hand is not the expected cadence')
    return {
      title: `Identify ${withArticle(type)} cadence in ${kName}`,
      task: `The key is ${kName}. What type of cadence is on the staff?`,
      steps: [
        {
          text: `Look at the key (${kName}) and the two chords. A **cadence** is the pair of chords at the end of a phrase. The sound plays the key chord first, then the two cadence chords.`,
          staff,
          listen,
        },
        { text: `Write out the scale of ${kName} and number the notes: **${numberedScale(numeralLongHand(key, first).scale)}**.` },
        { text: `Name the **first chord**. Its notes are ${d1.text}` },
        { text: `Name the **second chord**. Its notes are ${d2.text}` },
        { text: `Write the two numerals as a pair: **${pair}**.` },
        {
          text: `Match the pair to the patterns: ${patternsText(minor)} Your pair, ${pair}, is ${withArticle(type).split(' ')[0]} **${type}** cadence.`,
        },
        { text: `Check with the definition: ${DEFINITION[type]}${minor ? ' (In a minor key the home chord is written in small letters, i, and the chord on note 6 is VI.)' : ''} Your chords, ${symbols}, fit it. ✓` },
      ],
      answer: `It is ${withArticle(type)} cadence (${pair}, ${symbols}).`,
    }
  }

  const b1 = buildFromNumeral(key, c.numerals[0])
  const b2 = buildFromNumeral(key, c.numerals[1])
  if (classifyCadence(key, b1.chord, b2.chord) !== type) throw new Error('The chords built by hand are not this cadence')
  return {
    title: `Write ${withArticle(type)} cadence in ${kName}`,
    task: `Write ${withArticle(type)} cadence in ${kName} on the staff.`,
    steps: [
      { text: `Start with the pattern. ${DEFINITION[type]} In ${kName} that is **${pair}**.${minor ? ' (In a minor key the home chord is written i, in small letters.)' : ''}` },
      { text: `Write out the scale of ${kName} and number the notes: **${numberedScale(b1.scale)}**.` },
      {
        text: `Build the **first chord, ${c.numerals[0]}**. It is built on note ${b1.degree}. Stack thirds from there using only the notes of the key (note numbers ${b1.numbers.join(', ')}). ${
          b1.usedRaised ? 'In a minor key, V uses the raised 7th. ' : ''
        }The notes are **${notesLabel(b1.notes)}** (${handChordSymbol(b1.chord, 0)}).`,
      },
      {
        text: `Build the **second chord, ${c.numerals[1]}**. It is built on note ${b2.degree}, with note numbers ${b2.numbers.join(', ')}. The notes are **${notesLabel(b2.notes)}** (${handChordSymbol(b2.chord, 0)}).`,
      },
      {
        text: `Write the key signature of ${kName} first. Then write each chord as notes stacked on neighbouring lines or spaces. ${signText}`,
        staff,
      },
      { text: `Press the button to hear it. The sound begins with the key chord (${handChordSymbol(tonicOf(key), 0)}) so you know where home is, then plays your two chords.`, listen },
      {
        text: `Check: the two chords ${symbols} are ${pair}, and ${withArticle(type)} cadence is ${PATTERN[minor ? 'minor' : 'major'][type]}. ✓`,
      },
    ],
    answer: `The ${type} cadence in ${kName} is ${symbols} (${pair}).`,
  }
}
