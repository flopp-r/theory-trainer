import type { WorkedExample, WorkedStep } from '../types'
import type { StaffSpec } from '../../../questions/types'
import { type ClefName, type Key, keyScaleNotes, pitch, scaleDegreeName, scalePitches } from '../../../theory'
import { keyLabel, noteLabel } from '../../../questions/pitchTools'
import { listenMelody } from './audio'
import {
  MAJOR_PATTERN,
  NATURAL_MINOR_PATTERN,
  type TermId,
  Words,
  assertSameNotes,
  gapUp,
  keyNoteStep,
  keyWalkText,
  letterNamesStep,
  noteAt,
  ordinal,
  patternStep,
  prefersFlats,
  scaleGapSteps,
  semitones,
  spellByPattern,
} from './working'

/** The traditional names of the first six degrees, written out by hand. The 7th depends on the scale. */
export const DEGREE_TERMS = ['tonic', 'supertonic', 'mediant', 'subdominant', 'dominant', 'submediant'] as const

const DEGREE_TERM_IDS: Record<string, TermId> = {
  tonic: 'tonic',
  supertonic: 'supertonic',
  mediant: 'mediant',
  subdominant: 'subdominant',
  dominant: 'dominant',
  submediant: 'submediant',
  'leading note': 'leadingNote',
  subtonic: 'subtonic',
}

/** Semitones above the key note of each degree, for the major scale and for the natural minor scale. Written out by hand. */
const DEGREE_SEMITONES = {
  major: [0, 2, 4, 5, 7, 9, 11],
  minor: [0, 2, 3, 5, 7, 8, 10],
} as const

// A theme colour for the staff card (see styles.css); the fallback is the light-theme value.
const HIGHLIGHT = 'var(--staff-good, #0f766e)'

export type DegreeQuestion = 'note' | 'name'

/**
 * Worked examples about scale degrees. `ask: 'note'` gives the name ("the dominant of D major") and asks for the note;
 * `ask: 'name'` gives the number ("the 4th degree") and asks for the name and the note.
 * Minor keys use the natural minor scale. The scale is built gap by gap as far as the degree; the degree's name comes from
 * a hand-written list (and, for the 7th, from the gap to the key note); everything is checked against the engine.
 */
export function scaleDegreeExample(key: Key, degree: number, ask: DegreeQuestion = 'note', clef: ClefName = 'treble'): WorkedExample {
  if (!Number.isInteger(degree) || degree < 1 || degree > 7) throw new RangeError('Degree must be 1 to 7')
  const isMajor = key.mode === 'major'
  const kind = isMajor ? 'major' : 'natural minor'
  const keyName = keyLabel(key)
  const tonic = key.tonic
  const scaleNotes = spellByPattern(tonic, isMajor ? MAJOR_PATTERN : NATURAL_MINOR_PATTERN).notes
  assertSameNotes(`${keyName} scale`, scaleNotes, keyScaleNotes(key))
  const wanted = scaleNotes[degree - 1]!

  // The second route: the degree is a known number of letter names and semitones above the key note.
  const semis = DEGREE_SEMITONES[key.mode][degree - 1]!
  assertSameNotes(`the ${ordinal(degree)} degree of ${keyName}`, [noteAt(tonic, degree, semis, 'up')], [wanted])

  // The name.
  const gapToTonic = gapUp(scaleNotes[6]!, tonic)
  const term = degree === 7 ? (gapToTonic === 1 ? 'leading note' : gapToTonic === 2 ? 'subtonic' : 'unnamed') : DEGREE_TERMS[degree - 1]!
  const engineTerm = scaleDegreeName(isMajor ? 'major' : 'natural-minor', degree)
  if (term !== engineTerm) throw new Error(`The name of degree ${degree} in ${keyName} is "${term}" by hand but "${engineTerm}" in the engine`)

  const start = pitch(tonic.letter, tonic.accidental, clef === 'treble' ? 4 : 3)
  const pitches = scalePitches(start, isMajor ? 'major' : 'natural-minor')
  const staff: StaffSpec = {
    clef,
    items: pitches.map((p, i) => ({ kind: 'notes' as const, pitches: [p], ...(i === degree - 1 ? { color: HIGHLIGHT } : {}) })),
  }
  const inKey = `${keyName}${isMajor ? '' : ' (natural minor)'}`
  const scaleName = isMajor ? keyName : `${noteLabel(tonic)} natural minor`

  const w = new Words()
  const list = '1 tonic, 2 supertonic, 3 mediant, 4 subdominant, 5 dominant, 6 submediant, 7 leading note or subtonic'
  const steps: WorkedStep[] = []
  if (ask === 'note') {
    steps.push({
      title: 'Turn the name into a number',
      text: `Each ${w.say('scaleDegree', 'scale degree')} has a name. In order: ${list}. The ${term} is number ${degree}.`,
      result: `The ${term} is degree ${degree}`,
    })
  } else {
    steps.push({
      title: `Look up the name of degree ${degree}`,
      text: `Each ${w.say('scaleDegree', 'scale degree')} has a name. In order: ${list}. ${
        degree === 7
          ? 'Degree 7 has two names: leading note if it is a semitone below the key note, subtonic if a tone below.'
          : `Number ${degree} is the ${term}.`
      }`,
      result: degree === 7 ? 'Degree 7: leading note or subtonic' : `Degree ${degree}: the ${term}`,
    })
  }
  w.add(DEGREE_TERM_IDS[term]!)

  if (degree === 1) {
    w.add('tonic')
    steps.push({
      title: 'Take the key note',
      text: `The tonic is the key note: the note ${keyName} is named after. There is nothing to count.`,
      result: `The tonic: ${noteLabel(tonic)}`,
      staff,
      listen: listenMelody(`Hear the ${keyName} scale`, pitches),
    })
  } else {
    steps.push(keyNoteStep(tonic, scaleName, w))
    steps.push(letterNamesStep(tonic, degree, w, `You need notes 1 to ${degree} of the ${kind} scale.`))
    steps.push(patternStep(kind, degree - 1, w))
    const gaps = scaleGapSteps(tonic, kind, degree - 1, w)
    assertSameNotes(`${keyName} (gap steps)`, gaps.notes, scaleNotes.slice(0, degree))
    steps.push(...gaps.steps)
    steps.push({
      title: `Take note ${degree}`,
      text: `Note ${degree} of ${scaleName} is ${noteLabel(wanted)}. Here is the whole scale, with that note in colour.`,
      result: `The ${degree === 7 && ask === 'name' ? `${ordinal(7)} degree` : term}: ${noteLabel(wanted)}`,
      staff,
      listen: listenMelody(`Hear the ${keyName} scale`, pitches),
    })
  }

  const flats = prefersFlats(tonic, wanted)
  if (degree === 7 && ask === 'name') {
    // Name the 7th from its gap to the key note, then check by counting up from the key note.
    steps.push({
      title: 'Measure the gap from note 7 to the key note',
      text: `Count up one piano key at a time from ${noteLabel(wanted)} to ${noteLabel(tonic)}: ${keyWalkText(wanted, tonic, gapToTonic, 'up', flats)}. A 7th that is a semitone below the key note is a leading note. A 7th a tone below is a subtonic.`,
      result: `Degree 7 here: the ${term}`,
    })
    steps.push({
      title: 'Check another way: count up from the key note',
      text: `In every ${kind} scale, note 7 is ${semitones(semis)} above the key note. Count up one piano key at a time from ${noteLabel(tonic)}. Count the steps, not the key you start on: ${keyWalkText(tonic, wanted, semis, 'up', flats)}.`,
      result: `${noteLabel(wanted)} is ${semitones(semis)} above ${noteLabel(tonic)}, as it should be`,
    })
  } else if (degree === 7) {
    steps.push({
      title: 'Check another way: measure the gap to the key note',
      text: `A ${term} is ${gapToTonic === 1 ? 'a semitone' : 'a tone'} below the key note. Count up one piano key at a time from ${noteLabel(wanted)} to ${noteLabel(tonic)}: ${keyWalkText(wanted, tonic, gapToTonic, 'up', flats)}.`,
      result: `${noteLabel(wanted)} is ${gapToTonic === 1 ? 'a semitone' : 'a tone'} below ${noteLabel(tonic)}, as it should be`,
    })
  } else if (degree === 1) {
    const top = scaleNotes[0]!
    steps.push({
      title: 'Check another way: read the key name',
      text: `A key is always named after its tonic, and the scale starts on it. ${keyName} starts on ${noteLabel(top)}.`,
      result: `${noteLabel(top)}, as it should be`,
    })
  } else {
    steps.push({
      title: 'Check another way: count up from the key note',
      text: `In every ${kind} scale, note ${degree} is ${semitones(semis)} above the key note. Count up one piano key at a time from ${noteLabel(tonic)}, without using your gaps. Count the steps, not the key you start on: ${keyWalkText(tonic, wanted, semis, 'up', flats)}.`,
      result: `${noteLabel(wanted)} is ${semitones(semis)} above ${noteLabel(tonic)}, as it should be`,
    })
  }

  return {
    title: ask === 'note' ? `Find the ${term} of ${keyName}` : `Name the ${ordinal(degree)} degree of ${keyName}`,
    task: ask === 'note' ? `In ${inKey}, which note is the ${term}?` : `In ${inKey}, what is the ${ordinal(degree)} note of the scale called, and which note is it?`,
    steps,
    terms: w.terms(),
    answer:
      ask === 'note'
        ? `The ${term} of ${inKey} is ${noteLabel(wanted)}.`
        : `The ${ordinal(degree)} degree of ${inKey} is the ${term}, and in this key it is ${noteLabel(wanted)}.`,
  }
}
