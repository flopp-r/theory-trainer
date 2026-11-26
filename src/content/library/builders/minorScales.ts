import type { WorkedExample, WorkedStep } from '../types'
import {
  type ClefName,
  type NoteName,
  keyScaleNotes,
  letterAt,
  letterIndex,
  pitch,
  pitchClass,
  relativeKey,
  scaleNotes,
  scalePitches,
} from '../../../theory'
import { noteLabel, notesLabel } from '../../../questions/pitchTools'
import { listenMelody } from './audio'
import { notesOnStaff } from './common'
import {
  MAJOR_PATTERN,
  NATURAL_MINOR_PATTERN,
  assertSameNotes,
  gapsAsWords,
  gapsBetween,
  lowerSentence,
  mod12,
  patternInOneLine,
  patternStepText,
  raiseSentence,
  semitones,
  spellByPattern,
  spellOnLetter,
} from './working'

export type MinorForm = 'natural' | 'harmonic' | 'melodic'

export interface MinorScaleOptions {
  /** How to build the natural minor scale: from the tone and semitone pattern (the default), or from the major scale. */
  readonly method?: 'pattern' | 'from-major'
  readonly clef?: ClefName
}

const FORM_NAMES: Record<MinorForm, string> = { natural: 'natural minor', harmonic: 'harmonic minor', melodic: 'melodic minor' }

/** The note three letter names and three semitones above: the key note of the relative major. */
export function relativeMajorTonic(minorTonic: NoteName): NoteName {
  return spellOnLetter(letterAt(letterIndex(minorTonic.letter) + 2), mod12(pitchClass(minorTonic) + 3))
}

function octaveFor(clef: ClefName): number {
  return clef === 'bass' || clef === 'alto' || clef === 'tenor' ? 3 : 4
}

/**
 * Build a minor scale step by step: natural (by the pattern, or by lowering a major scale), harmonic or melodic.
 * The working uses letter names and semitone counts. At the end it is checked against the theory engine
 * (`scaleNotes` and `keyScaleNotes`, up and down) and this function throws if they disagree.
 */
export function minorScaleExample(tonic: NoteName, form: MinorForm, options: MinorScaleOptions = {}): WorkedExample {
  const clef = options.clef ?? 'treble'
  const method = options.method ?? 'pattern'
  const name = noteLabel(tonic)
  const startPitch = pitch(tonic.letter, tonic.accidental, octaveFor(clef))

  // ---- Long-hand: the natural minor scale -------------------------------------------------------------
  const byPattern = spellByPattern(tonic, NATURAL_MINOR_PATTERN)
  const natural = byPattern.notes
  const majorSameKeyNote = spellByPattern(tonic, MAJOR_PATTERN)
  const lowered = majorSameKeyNote.notes.map((n, i) => (i === 2 || i === 5 || i === 6 ? { letter: n.letter, accidental: n.accidental - 1 } : n))
  // Two different routes to the natural minor scale must give the same notes.
  assertSameNotes(`${name} natural minor (pattern against lowered major)`, natural, lowered)

  // ---- Long-hand: the other two forms -----------------------------------------------------------------
  const harmonic = natural.map((n, i) => (i === 6 ? { letter: n.letter, accidental: n.accidental + 1 } : n))
  const melodicUp = natural.map((n, i) => (i === 5 || i === 6 ? { letter: n.letter, accidental: n.accidental + 1 } : n))
  const melodicDown = natural.slice(1).reverse() // from the 7th down to the 2nd; the key note is added at both ends in the text

  // ---- Cross-check against the engine ----------------------------------------------------------------
  const keyOfTonic = { tonic, mode: 'minor' } as const
  const checks: [MinorForm, NoteName[], 'natural-minor' | 'harmonic-minor' | 'melodic-minor'][] = [
    ['natural', natural, 'natural-minor'],
    ['harmonic', harmonic, 'harmonic-minor'],
    ['melodic', melodicUp, 'melodic-minor'],
  ]
  for (const [f, notes, type] of checks) {
    assertSameNotes(`${name} ${FORM_NAMES[f]}`, notes, scaleNotes(tonic, type))
    assertSameNotes(`${name} ${FORM_NAMES[f]} (key)`, notes, keyScaleNotes(keyOfTonic, f))
  }
  const engineDown = scalePitches(startPitch, 'melodic-minor', { descending: true })
  assertSameNotes(
    `${name} melodic minor going down`,
    [tonic, ...melodicDown, tonic],
    engineDown.map((p) => ({ letter: p.letter, accidental: p.accidental })),
  )
  const relMajor = relativeMajorTonic(tonic)
  const engineRelative = relativeKey(keyOfTonic)
  if (engineRelative.tonic.letter !== relMajor.letter || engineRelative.tonic.accidental !== relMajor.accidental) {
    throw new Error(`Relative major of ${name} minor disagrees with the theory engine`)
  }

  const up = scalePitches(startPitch, form === 'natural' ? 'natural-minor' : form === 'harmonic' ? 'harmonic-minor' : 'melodic-minor')
  const down = scalePitches(startPitch, 'melodic-minor', { descending: true })
  const startStep: WorkedStep = {
    text: `Start on the key note, **${name}**. This is note 1. We are building the **${FORM_NAMES[form]}** scale that starts on ${name}.`,
  }

  // ---- The text ---------------------------------------------------------------------------------------
  if (form === 'natural' && method === 'pattern') {
    const relativeScale = spellByPattern(relMajor, MAJOR_PATTERN).notes
    const sameSeven = [...relativeScale].map((n) => noteLabel(n)).sort().join(' ') === [...natural].map((n) => noteLabel(n)).sort().join(' ')
    if (!sameSeven) throw new Error(`${name} natural minor does not use the same notes as its relative major`)
    const letters = Array.from({ length: 8 }, (_, i) => letterAt(letterIndex(tonic.letter) + i))
    const last = natural[6]!
    const back = mod12(pitchClass(tonic) - pitchClass(last))
    return {
      title: `Build the ${name} natural minor scale`,
      task: `Write the notes of the ${name} natural minor scale.`,
      steps: [
        startStep,
        {
          text: `Write the letter names in order, starting on ${tonic.letter}, and finish on ${tonic.letter} again: **${letters.join(' ')}**. This fixes the *letters*. The pattern below fixes the *signs* (sharps and flats).`,
        },
        { text: `Write the natural minor pattern over the gaps: **tone, semitone, tone, tone, semitone, tone, tone**. (Compare the major pattern: tone, tone, semitone, tone, tone, tone, semitone. In the minor pattern the semitones fall between notes 2 and 3, and between notes 5 and 6.)` },
        ...byPattern.steps.map((s) => ({ text: patternStepText(s) })),
        { text: `Check the last step: from ${noteLabel(last)} up to ${noteLabel(tonic)} is ${semitones(back)}${back === 2 ? ', which is the tone the pattern ends with' : ''}.` },
        {
          text: `Write it out: **${notesLabel(natural)} ${noteLabel(tonic)}**. Here it is on the staff, with the sound.`,
          staff: notesOnStaff(clef, up),
          listen: listenMelody(`Hear the ${name} natural minor scale`, up),
        },
        {
          text: `Check with the relative major. Go up **3 letter names** from ${tonic.letter}: ${letters.slice(0, 3).join(', ')}. The letter is ${relMajor.letter}. The distance from ${name} up to ${noteLabel(relMajor)} is ${semitones(mod12(pitchClass(relMajor) - pitchClass(tonic)))}. So the relative major is ${noteLabel(relMajor)} major, whose notes are **${notesLabel(relativeScale)}**: the same seven notes as ${name} natural minor, just starting from a different one. ✓`,
        },
      ],
      answer: `The ${name} natural minor scale is ${notesLabel(natural)} ${noteLabel(tonic)}.`,
    }
  }

  if (form === 'natural') {
    const majorLine = notesLabel(majorSameKeyNote.notes)
    const numbered = majorSameKeyNote.notes.map((n, i) => `${i + 1} ${noteLabel(n)}`).join(', ')
    const gaps = gapsBetween([...natural, tonic])
    return {
      title: `Build the ${name} natural minor scale from the major scale`,
      task: `Write the notes of the ${name} natural minor scale by starting from the ${name} major scale.`,
      steps: [
        startStep,
        {
          text: `Write the **major scale with the same key note**, using the method from the Major scales lesson: ${name} major is **${majorLine}**.`,
        },
        { text: `Number the notes: ${numbered}.` },
        { text: `Lower the **3rd, 6th and 7th** notes by a semitone. The 3rd is ${noteLabel(majorSameKeyNote.notes[2]!)}: ${lowerSentence(majorSameKeyNote.notes[2]!)}` },
        { text: `The 6th is ${noteLabel(majorSameKeyNote.notes[5]!)}: ${lowerSentence(majorSameKeyNote.notes[5]!)}` },
        { text: `The 7th is ${noteLabel(majorSameKeyNote.notes[6]!)}: ${lowerSentence(majorSameKeyNote.notes[6]!)}` },
        { text: `Leave the 1st, 2nd, 4th and 5th notes exactly as they were. Write it out: **${notesLabel(natural)} ${noteLabel(tonic)}**. Here it is on the staff, with the sound.`, staff: notesOnStaff(clef, up), listen: listenMelody(`Hear the ${name} natural minor scale`, up) },
        {
          text: `Check with the pattern. Count the semitones between neighbouring notes: ${gaps.join(', ')}. That is **${gapsAsWords(gaps)}**: exactly the natural minor pattern. ✓`,
        },
      ],
      answer: `The ${name} natural minor scale is ${notesLabel(natural)} ${noteLabel(tonic)}.`,
    }
  }

  const natStart = patternInOneLine(tonic, NATURAL_MINOR_PATTERN)
  const naturalStep: WorkedStep = {
    text: `Write the **natural minor** scale first, using its pattern (tone, semitone, tone, tone, semitone, tone, tone). Working note by note: ${natStart.text}. So ${name} natural minor is **${notesLabel(natural)}**.`,
  }

  if (form === 'harmonic') {
    const sixth = natural[5]!
    const seventhNatural = natural[6]!
    const seventhRaised = harmonic[6]!
    const gapSixthSeventh = gapsBetween([sixth, seventhRaised])[0]!
    const gapSeventhTop = gapsBetween([seventhRaised, tonic])[0]!
    if (gapSixthSeventh !== 3 || gapSeventhTop !== 1) throw new Error('Harmonic minor must have 3 semitones between notes 6 and 7, and 1 from 7 to the key note')
    const doubleSharpExtra =
      seventhRaised.accidental === 2
        ? ` Notice that ${noteLabel(seventhRaised)} sounds the same as ${spellOnLetter(letterAt(letterIndex(seventhRaised.letter) + 1), pitchClass(seventhRaised)).letter}, but it has to be written as ${seventhRaised.letter}: a scale uses each letter once, and the 7th note is the ${seventhRaised.letter}.`
        : ''
    return {
      title: `Build the ${name} harmonic minor scale`,
      task: `Write the notes of the ${name} harmonic minor scale.`,
      steps: [
        startStep,
        naturalStep,
        {
          text: `Find the **7th note** of the natural minor scale: it is ${noteLabel(seventhNatural)}. Raise it by a semitone. ${raiseSentence(seventhNatural)}${doubleSharpExtra}`,
        },
        {
          text: `Leave every other note alone. The ${name} harmonic minor scale is **${notesLabel(harmonic)} ${noteLabel(tonic)}**. Here it is on the staff, with the sound.`,
          staff: notesOnStaff(clef, up),
          listen: listenMelody(`Hear the ${name} harmonic minor scale`, up),
        },
        {
          text: `Check the two gaps at the top. From the 6th note ${noteLabel(sixth)} up to the 7th note ${noteLabel(seventhRaised)} is **${semitones(gapSixthSeventh)}** (one and a half tones: this is the unusual big step of the harmonic minor). From the 7th note ${noteLabel(seventhRaised)} up to ${noteLabel(tonic)} is **${semitones(gapSeventhTop)}**: the 7th is now a semitone below the key note. ✓`,
        },
      ],
      answer: `The ${name} harmonic minor scale is ${notesLabel(harmonic)} ${noteLabel(tonic)}.`,
    }
  }

  // melodic
  const sixthNatural = natural[5]!
  const seventhNatural = natural[6]!
  const upGaps = gapsBetween([...melodicUp, tonic])
  const downList = [tonic, ...melodicDown, tonic]
  return {
    title: `Build the ${name} melodic minor scale, up and down`,
    task: `Write the notes of the ${name} melodic minor scale, going up and going down.`,
    steps: [
      startStep,
      naturalStep,
      {
        text: `**Going up:** raise the **6th and 7th** notes by a semitone. The 6th is ${noteLabel(sixthNatural)}: ${raiseSentence(sixthNatural)}`,
      },
      { text: `The 7th is ${noteLabel(seventhNatural)}: ${raiseSentence(seventhNatural)}` },
      {
        text: `Going up, the ${name} melodic minor scale is **${notesLabel(melodicUp)} ${noteLabel(tonic)}**. Here it is on the staff, with the sound.`,
        staff: notesOnStaff(clef, up),
        listen: listenMelody(`Hear ${name} melodic minor going up`, up),
      },
      {
        text: `**Coming down:** do not raise anything. Coming down, the melodic minor scale is just the natural minor scale written backwards: **${notesLabel(downList)}**. Here it is on the staff, with the sound.`,
        staff: notesOnStaff(clef, down),
        listen: listenMelody(`Hear ${name} melodic minor coming down`, down),
      },
      {
        text: `Check the way up. The gaps between neighbouring notes going up are ${upGaps.join(', ')} semitones, which is **${gapsAsWords(upGaps)}**. The last gap is ${semitones(upGaps[6]!)}, so the 7th note is a semitone below the key note. Check the way down: it is the natural minor, so the natural 6th and 7th (${notesLabel([sixthNatural, seventhNatural])}) are back. ✓`,
      },
    ],
    answer: `Going up, the ${name} melodic minor scale is ${notesLabel(melodicUp)} ${noteLabel(tonic)}. Coming down it is ${notesLabel(downList)}.`,
  }
}

