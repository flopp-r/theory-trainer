import type { WorkedExample, WorkedStep } from '../types'
import {
  type ClefName,
  type NoteName,
  type Pitch,
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
  Words,
  assertSameNotes,
  gapUp,
  gapsBetween,
  keyNoteStep,
  keyWalkText,
  letterNamesStep,
  mod12,
  patternStep,
  prefersFlats,
  scaleGapSteps,
  semitoneChangeText,
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

const sizeWord = (n: number): string => (n === 1 ? 'semitone' : n === 2 ? 'tone' : semitones(n))

/** Step: write the scale out, with the picture and the sound. */
function writeOutStep(notes: readonly NoteName[], tonic: NoteName, what: string, clef: ClefName, up: readonly Pitch[], w: Words, lead: string): WorkedStep {
  return {
    title: 'Write the scale out',
    text: `${lead} The last note is the key note again, ${w.say('octave', 'one octave')} higher.`,
    result: `${notesLabel(notes)} ${noteLabel(tonic)}`,
    staff: notesOnStaff(clef, up),
    listen: listenMelody(`Hear the ${what} scale`, up),
  }
}

/** Step, when a raised 7th needs a double sharp: why it keeps its letter. */
function keepLetterStep(raised: NoteName, tonic: NoteName, w: Words): WorkedStep {
  const sameKey = spellOnLetter(letterAt(letterIndex(raised.letter) + 1), pitchClass(raised))
  return {
    title: `Keep the letter ${raised.letter}`,
    text: `${noteLabel(raised)} is the same piano key as ${noteLabel(sameKey)}: the two names are ${w.say('enharmonic', 'enharmonic')}. But a scale uses each letter once, ${noteLabel(tonic)} is already note 1, and note 7 must use the letter ${raised.letter}. So write **${noteLabel(raised)}**.`,
    result: `Note 7: ${noteLabel(raised)}, not ${noteLabel(sameKey)}`,
  }
}

/**
 * Build a minor scale step by step: natural (by the pattern, or by lowering a major scale), harmonic or melodic.
 * The scale is worked out one gap at a time, then checked against the theory engine
 * (`scaleNotes` and `keyScaleNotes`, up and down); this function throws if they disagree.
 */
export function minorScaleExample(tonic: NoteName, form: MinorForm, options: MinorScaleOptions = {}): WorkedExample {
  const clef = options.clef ?? 'treble'
  const method = options.method ?? 'pattern'
  const name = noteLabel(tonic)
  const startPitch = pitch(tonic.letter, tonic.accidental, octaveFor(clef))

  // ---- Long-hand: the natural minor scale, two ways -----------------------------------------------------
  const natural = spellByPattern(tonic, NATURAL_MINOR_PATTERN).notes
  const majorSameKeyNote = spellByPattern(tonic, MAJOR_PATTERN).notes
  const lowered = majorSameKeyNote.map((n, i) => (i === 2 || i === 5 || i === 6 ? { letter: n.letter, accidental: n.accidental - 1 } : n))
  assertSameNotes(`${name} natural minor (pattern against lowered major)`, natural, lowered)

  // ---- Long-hand: the other two forms -------------------------------------------------------------------
  const harmonic = natural.map((n, i) => (i === 6 ? { letter: n.letter, accidental: n.accidental + 1 } : n))
  const melodicUp = natural.map((n, i) => (i === 5 || i === 6 ? { letter: n.letter, accidental: n.accidental + 1 } : n))
  const melodicDown = [tonic, ...natural.slice(1).reverse(), tonic]

  // ---- Cross-check against the engine -------------------------------------------------------------------
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
  assertSameNotes(`${name} melodic minor going down`, melodicDown, engineDown.map((p) => ({ letter: p.letter, accidental: p.accidental })))
  const relMajor = relativeMajorTonic(tonic)
  const engineRelative = relativeKey(keyOfTonic)
  if (engineRelative.tonic.letter !== relMajor.letter || engineRelative.tonic.accidental !== relMajor.accidental) {
    throw new Error(`Relative major of ${name} minor disagrees with the theory engine`)
  }

  const up = scalePitches(startPitch, form === 'natural' ? 'natural-minor' : form === 'harmonic' ? 'harmonic-minor' : 'melodic-minor')
  const down = scalePitches(startPitch, 'melodic-minor', { descending: true })
  const w = new Words()
  const flats = prefersFlats(tonic, ...natural)

  // ---- Natural minor by the pattern ---------------------------------------------------------------------
  if (form === 'natural' && method === 'pattern') {
    const intro = keyNoteStep(tonic, `${name} natural minor`, w)
    const letters = letterNamesStep(tonic, 8, w)
    const pattern = patternStep('natural minor', 7, w)
    const gaps = scaleGapSteps(tonic, 'natural minor', 7, w)
    assertSameNotes(`${name} natural minor (gap steps)`, gaps.notes.slice(0, 7), natural)
    const write = writeOutStep(natural, tonic, `${name} natural minor`, clef, up, w, 'Read your notes from the bottom up.')
    const third = natural[2]!
    const third3 = gapUp(tonic, third)
    if (third3 !== 3) throw new Error('Note 3 of a minor scale must be 3 semitones above the key note')
    return {
      title: `Build the ${name} natural minor scale`,
      task: `Write the notes of the ${name} natural minor scale, going up.`,
      steps: [
        intro,
        letters,
        pattern,
        ...gaps.steps,
        write,
        {
          title: 'Check another way: count up to note 3',
          text: `Note 3 is what makes a scale minor: in every minor scale it is 3 semitones above the key note (in a major scale, 4). Count up one piano key at a time from ${name}. Count the steps, not the key you start on: ${keyWalkText(tonic, third, 3, 'up', flats)}.`,
          result: `${noteLabel(third)} is 3 semitones above ${name}, as it should be`,
        },
      ],
      terms: w.terms(),
      answer: `The ${name} natural minor scale is ${notesLabel(natural)} ${name}.`,
    }
  }

  // ---- Natural minor from the major scale ----------------------------------------------------------------
  if (form === 'natural') {
    const choose: WorkedStep = {
      title: 'Choose the major scale to start from',
      text: `A quick way to the ${w.say('naturalMinor', 'natural minor scale')} starts from the major scale with the same key note: here ${name} major. Build it, then lower notes 3, 6 and 7 by a semitone.`,
      result: `Start from ${name} major`,
    }
    const intro = keyNoteStep(tonic, `${name} major`, w)
    const letters = letterNamesStep(tonic, 8, w)
    const pattern = patternStep('major', 7, w)
    const gaps = scaleGapSteps(tonic, 'major', 7, w)
    assertSameNotes(`${name} major (gap steps)`, gaps.notes.slice(0, 7), majorSameKeyNote)
    const lowerSteps: WorkedStep[] = [3, 6, 7].map((degree) => {
      const before = majorSameKeyNote[degree - 1]!
      const change = semitoneChangeText(before, -1, w)
      assertSameNotes(`note ${degree} of ${name} natural minor`, [change.note], [natural[degree - 1]!])
      return {
        title: `Lower note ${degree} by a semitone`,
        text: `Note ${degree} of ${name} major is ${noteLabel(before)}. ${change.text}`,
        result: `Note ${degree}: ${noteLabel(change.note)}`,
      }
    })
    const write = writeOutStep(natural, tonic, `${name} natural minor`, clef, up, w, `Keep notes 1, 2, 4 and 5 as they were in ${name} major, and put in your three lowered notes. Read from the bottom up.`)
    const withTop = [...natural, tonic]
    const sizes = gapsBetween(withTop)
    if (sizes.join(',') !== NATURAL_MINOR_PATTERN.map((s) => (s === 'tone' ? 2 : 1)).join(',')) throw new Error('The lowered major scale does not have the natural minor pattern')
    const measured = sizes.map((g, i) => `${noteLabel(withTop[i]!)} to ${noteLabel(withTop[i + 1]!)} is ${g}`)
    return {
      title: `Build the ${name} natural minor scale from the major scale`,
      task: `Write the notes of the ${name} natural minor scale by starting from the ${name} major scale.`,
      steps: [
        choose,
        intro,
        letters,
        pattern,
        ...gaps.steps,
        ...lowerSteps,
        write,
        {
          title: 'Check another way: measure each gap',
          text: `Measure the gaps of your answer in semitones, counting piano keys: ${measured.join(', ')}. Compare them with the natural minor pattern.`,
          result: `${sizes.map(sizeWord).join(', ')}: the natural minor pattern`,
        },
      ],
      terms: w.terms(),
      answer: `The ${name} natural minor scale is ${notesLabel(natural)} ${name}.`,
    }
  }

  // ---- Harmonic and melodic minor: build the natural minor first -------------------------------------------
  const formTerm = form === 'harmonic' ? w.say('harmonicMinor', 'harmonic minor scale') : w.say('melodicMinor', 'melodic minor scale')
  const start: WorkedStep = {
    title: 'Start from the natural minor scale',
    text: `The ${formTerm} is made from the ${w.say('naturalMinor', 'natural minor scale')}. So build ${name} natural minor first, one gap at a time.`,
    result: `Build ${name} natural minor first`,
  }
  const naturalSteps = [
    keyNoteStep(tonic, `${name} natural minor`, w),
    letterNamesStep(tonic, 8, w),
    patternStep('natural minor', 7, w),
    ...(() => {
      const gaps = scaleGapSteps(tonic, 'natural minor', 7, w)
      assertSameNotes(`${name} natural minor (gap steps)`, gaps.notes.slice(0, 7), natural)
      return gaps.steps
    })(),
  ]
  const sixth = natural[5]!
  const seventh = natural[6]!

  if (form === 'harmonic') {
    const raise = semitoneChangeText(seventh, 1, w)
    const raised = raise.note
    if (gapUp(seventh, tonic) !== 2) throw new Error('Note 7 of the natural minor scale must be a tone below the key note')
    const raiseStep: WorkedStep = {
      title: 'Raise note 7 by a semitone',
      text: `Note 7 is ${noteLabel(seventh)}, a tone below the key note. Raise it by a semitone to make a ${w.say('leadingNote', 'leading note')}. ${raise.text}`,
      result: `Note 7: ${noteLabel(raised)}`,
    }
    const sixToSeven = gapUp(sixth, raised)
    const sevenToTop = gapUp(raised, tonic)
    if (sixToSeven !== 3 || sevenToTop !== 1) throw new Error('Harmonic minor must have 3 semitones between notes 6 and 7, and 1 from 7 to the key note')
    const walkFlats = prefersFlats(sixth, raised, tonic)
    return {
      title: `Build the ${name} harmonic minor scale`,
      task: `Write the notes of the ${name} harmonic minor scale, going up.`,
      steps: [
        start,
        ...naturalSteps,
        raiseStep,
        ...(raised.accidental === 2 ? [keepLetterStep(raised, tonic, w)] : []),
        writeOutStep(harmonic, tonic, `${name} harmonic minor`, clef, up, w, 'Read your natural minor notes from the bottom up, with the raised note 7 in place.'),
        {
          title: 'Check another way: count the top two gaps',
          text: `A harmonic minor scale always ends with a gap of 3 semitones, then 1. Count piano keys one at a time. Note 6 up to note 7: ${keyWalkText(sixth, raised, 3, 'up', walkFlats)}. Note 7 up to the key note: ${keyWalkText(raised, tonic, 1, 'up', walkFlats)}.`,
          result: '3 semitones, then 1 semitone, as it should be',
        },
      ],
      terms: w.terms(),
      answer: `The ${name} harmonic minor scale is ${notesLabel(harmonic)} ${name}.`,
    }
  }

  // ---- Melodic minor -----------------------------------------------------------------------------------------
  const raise6 = semitoneChangeText(sixth, 1, w)
  const raise6Step: WorkedStep = {
    title: 'Going up, raise note 6 by a semitone',
    text: `Going up, the melodic minor raises notes 6 and 7. Note 6 is ${noteLabel(sixth)}. ${raise6.text}`,
    result: `Note 6 going up: ${noteLabel(raise6.note)}`,
  }
  const raise7 = semitoneChangeText(seventh, 1, w)
  const raise7Step: WorkedStep = {
    title: 'Going up, raise note 7 by a semitone',
    text: `Note 7 is ${noteLabel(seventh)}. Raising it makes it a ${w.say('leadingNote', 'leading note')}. ${raise7.text}`,
    result: `Note 7 going up: ${noteLabel(raise7.note)}`,
  }
  assertSameNotes(`${name} melodic minor (raised notes)`, [raise6.note, raise7.note], [melodicUp[5]!, melodicUp[6]!])
  const writeUp = writeOutStep(melodicUp, tonic, `${name} melodic minor going up`, clef, up, w, 'Going up, read your natural minor notes from the bottom up, with the raised notes 6 and 7 in place.')
  const writeDown: WorkedStep = {
    title: 'Write the scale coming down',
    text: `Coming down, the melodic minor raises nothing. Use your natural minor notes from the gap steps, from the top down, starting and ending on ${name}.`,
    result: notesLabel(melodicDown),
    staff: notesOnStaff(clef, down),
    listen: listenMelody(`Hear the ${name} melodic minor scale coming down`, down),
  }
  const r6 = raise6.note
  const r7 = raise7.note
  if (gapUp(r6, r7) !== 2 || gapUp(r7, tonic) !== 1) throw new Error('Melodic minor going up must end tone, semitone')
  const walkFlats = prefersFlats(r6, r7, tonic)
  return {
    title: `Build the ${name} melodic minor scale, up and down`,
    task: `Write the notes of the ${name} melodic minor scale, going up and coming down.`,
    steps: [
      start,
      ...naturalSteps,
      raise6Step,
      raise7Step,
      ...(r7.accidental === 2 ? [keepLetterStep(r7, tonic, w)] : []),
      { ...writeUp, title: 'Write the scale going up' },
      writeDown,
      {
        title: 'Check another way: count the top two gaps',
        text: `Going up, a melodic minor scale ends like a major scale: a tone, then a semitone. Count piano keys one at a time. Note 6 up to note 7: ${keyWalkText(r6, r7, 2, 'up', walkFlats)}. Note 7 up to the key note: ${keyWalkText(r7, tonic, 1, 'up', walkFlats)}.`,
        result: '2 semitones, then 1 semitone, as it should be',
      },
    ],
    terms: w.terms(),
    answer: `Going up, the ${name} melodic minor scale is ${notesLabel(melodicUp)} ${name}. Coming down it is ${notesLabel(melodicDown)}.`,
  }
}
