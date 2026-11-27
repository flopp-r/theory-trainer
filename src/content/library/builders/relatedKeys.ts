import type { WorkedExample, WorkedStep } from '../types'
import {
  type ClefName,
  type Key,
  type NoteName,
  closelyRelatedKeys,
  dominantKey,
  isStandardKey,
  keyScaleNotes,
  keySignature,
  parallelKey,
  relativeKey,
  subdominantKey,
} from '../../../theory'
import { keyLabel, noteLabel, notesLabel } from '../../../questions/pitchTools'
import { emptyStaff } from './common'
import { countWords, fifthsByRules, relativeKeySteps, relativeMajorOf, relativeMinorOf, signatureSteps } from './keySignatures'
import {
  Words,
  assertSameNotes,
  keyNoteStep,
  keyWalkText,
  letterNamesStep,
  lettersDown,
  lettersUp,
  noteAt,
  patternStep,
  prefersFlats,
  scaleGapSteps,
} from './working'

export type KeyRelation = 'relative' | 'parallel' | 'closely-related'

const sameKey = (a: Key, b: Key) => a.mode === b.mode && a.tonic.letter === b.tonic.letter && a.tonic.accidental === b.tonic.accidental
const keyOf = (tonic: NoteName, mode: Key['mode']): Key => ({ tonic, mode })
const otherMode = (m: Key['mode']): Key['mode'] => (m === 'major' ? 'minor' : 'major')

function assertStandard(...keys: Key[]): void {
  for (const k of keys) if (!isStandardKey(k)) throw new Error(`${keyLabel(k)} is not one of the 30 standard keys, so it is not used in a worked example`)
}

/**
 * Worked examples about related keys: the relative key (same signature), the parallel key (same key note)
 * and the closely related keys. The working uses scales built gap by gap, letter names, semitone counts and the signature rules;
 * every answer is checked against the theory engine, and this function throws if they disagree.
 */
export function relativeKeyExample(key: Key, relation: KeyRelation, clef: ClefName = 'treble'): WorkedExample {
  if (relation === 'relative') return relativeExample(key, clef)
  if (relation === 'parallel') return parallelExample(key, clef)
  return closelyRelatedExample(key)
}

function relativeExample(key: Key, clef: ClefName): WorkedExample {
  const isMajor = key.mode === 'major'
  const answerMode = otherMode(key.mode)
  const kind = isMajor ? 'major' : 'natural minor'
  const degree = isMajor ? 6 : 3
  const w = new Words()
  const name = keyLabel(key)
  const tonic = key.tonic

  const relWord = isMajor ? w.say('relativeMinor', 'relative minor') : w.say('relativeMajor', 'relative major')
  const steps: WorkedStep[] = [
    keyNoteStep(tonic, isMajor ? name : `${noteLabel(tonic)} natural minor`, w),
    letterNamesStep(tonic, degree, w, `The ${relWord} starts on note ${degree} of the ${kind} scale, so you need notes 1 to ${degree}.`),
    patternStep(kind, degree - 1, w),
  ]
  const gaps = scaleGapSteps(tonic, kind, degree - 1, w)
  assertSameNotes(`${name} scale`, gaps.notes, keyScaleNotes(key).slice(0, degree))
  steps.push(...gaps.steps)
  const fromScale = gaps.notes[degree - 1]!
  const answer = keyOf(fromScale, answerMode)
  assertStandard(key, answer)

  // Three routes must agree: the scale degree, the distance, and the theory engine. Relatives share a signature.
  const byDistance = isMajor ? relativeMinorOf(tonic) : relativeMajorOf(tonic)
  assertSameNotes(`relative ${answerMode} of ${name} (scale and distance)`, [fromScale], [byDistance])
  if (!sameKey(relativeKey(key), answer)) throw new Error(`Relative ${answerMode} of ${name} disagrees with the theory engine`)
  if (fifthsByRules(key) !== fifthsByRules(answer)) throw new Error('Relative keys must share a key signature')

  const degreeName = isMajor ? w.say('submediant', 'submediant') : w.say('mediant', 'mediant')
  steps.push({
    title: `Take note ${degree}, the ${isMajor ? 'submediant' : 'mediant'}`,
    text: `Note ${degree} of ${isMajor ? name : `${noteLabel(tonic)} natural minor`} is ${noteLabel(fromScale)}. Its name is the ${degreeName}. The ${answerMode} key on ${noteLabel(fromScale)} uses the same seven notes, so it has the same ${w.say('keySignature', 'key signature')}.`,
    result: `Relative ${answerMode}: ${keyLabel(answer)}`,
    staff: emptyStaff(clef, key),
  })

  const direction = isMajor ? 'down' : 'up'
  const letters = (isMajor ? lettersDown : lettersUp)(tonic.letter, 3)
  steps.push({
    title: `Check another way: count 3 semitones ${direction}`,
    text: `The relative ${answerMode}'s key note is always 3 letter names and 3 semitones ${isMajor ? 'below' : 'above'}. Letters ${direction} from ${tonic.letter}: ${letters.join(', ')}. Piano keys ${direction} from ${noteLabel(tonic)}, one at a time: ${keyWalkText(tonic, fromScale, 3, direction, prefersFlats(tonic, fromScale))}.`,
    result: `${noteLabel(fromScale)} again, so ${keyLabel(answer)}`,
  })
  return {
    title: `Find the relative ${answerMode} of ${name}`,
    task: `What is the relative ${answerMode} of ${name}?`,
    steps,
    terms: w.terms(),
    answer: `The relative ${answerMode} of ${name} is ${keyLabel(answer)}.`,
  }
}

/** Steps that find the key signature of any key: through the relative major for a minor key, then by the rules. */
function signatureOfKeySteps(key: Key, w: Words, which: 'First' | 'Next'): { fifths: number; steps: WorkedStep[] } {
  const steps: WorkedStep[] = []
  let major = key.tonic
  if (key.mode === 'minor') {
    const rel = relativeKeySteps(
      key,
      `${which}, the ${w.say('keySignature', 'key signature')} of ${keyLabel(key)}. A minor key shares it with its ${w.say('relativeMajor', 'relative major')}.`,
      'Relative major',
    )
    steps.push(...rel.steps)
    major = rel.key.tonic
  }
  const found = signatureSteps(major, w)
  steps.push(...found.steps)
  if (found.fifths !== fifthsByRules(key)) throw new Error('The signature worked out by the steps disagrees with the rules')
  return { fifths: found.fifths, steps }
}

/** "loses 3 sharps: 3 places towards the flats", from the signs (+ sharps, - flats) before and after. */
function changeWords(from: number, to: number): string {
  const d = to - from
  const places = `${Math.abs(d)} place${Math.abs(d) === 1 ? '' : 's'} towards the ${d < 0 ? 'flats' : 'sharps'}`
  const parts: string[] = []
  const sharpsLost = Math.max(from, 0) - Math.max(to, 0)
  const flatsLost = Math.max(-from, 0) - Math.max(-to, 0)
  if (sharpsLost > 0) parts.push(`loses ${countWords(sharpsLost)}`)
  if (flatsLost > 0) parts.push(`loses ${countWords(-flatsLost)}`)
  if (sharpsLost < 0) parts.push(`gains ${countWords(-sharpsLost)}`)
  if (flatsLost < 0) parts.push(`gains ${countWords(flatsLost)}`)
  return `${parts.join(' and ')}: ${places}`
}

function parallelExample(key: Key, clef: ClefName): WorkedExample {
  const answerMode = otherMode(key.mode)
  const answer = keyOf(key.tonic, answerMode)
  assertStandard(key, answer)
  if (!sameKey(parallelKey(key), answer)) throw new Error(`Parallel key of ${keyLabel(key)} disagrees with the theory engine`)
  const w = new Words()
  const name = keyLabel(key)
  const answerName = keyLabel(answer)
  const steps: WorkedStep[] = [
    {
      title: `Keep the key note, change ${key.mode} to ${answerMode}`,
      text: `${w.named('parallel', 'Parallel keys')} are a major key and a minor key with the same ${w.say('tonic', 'key note')}. The key note of ${name} is ${noteLabel(key.tonic)}, so keep ${noteLabel(key.tonic)} and change ${key.mode} to ${answerMode}.`,
      result: `Parallel ${answerMode}: ${answerName}`,
    },
  ]
  const first = signatureOfKeySteps(key, w, 'First')
  steps.push(...first.steps)
  steps.push({ ...steps.pop()!, staff: emptyStaff(clef, key) })
  const second = signatureOfKeySteps(answer, w, 'Next')
  steps.push(...second.steps)
  steps.push({ ...steps.pop()!, staff: emptyStaff(clef, answer) })

  const fKey = first.fifths
  const fAnswer = second.fifths
  const fMajor = key.mode === 'major' ? fKey : fAnswer
  const fMinor = key.mode === 'major' ? fAnswer : fKey
  if (fMinor !== fMajor - 3) throw new Error('A minor key must have 3 fewer sharps (or 3 more flats) than its parallel major')
  const change = changeWords(fKey, fAnswer)
  steps.push({
    title: 'Compare the two key signatures',
    text: `${name} has ${countWords(fKey)} and ${answerName} has ${countWords(fAnswer)}. So going from ${name} to ${answerName}, the key signature ${change}.`,
    result: `${countWords(fKey)}, then ${countWords(fAnswer)}`,
  })

  // The check: the natural minor is the major scale with notes 3, 6 and 7 lowered; each lowered note is one place towards the flats.
  const majorKey = key.mode === 'major' ? key : answer
  const minorKey = key.mode === 'major' ? answer : key
  const majorNotes = keyScaleNotes(majorKey)
  const minorNotes = keyScaleNotes(minorKey)
  const changed = [3, 6, 7]
  majorNotes.forEach((n, i) => {
    const expected = changed.includes(i + 1) ? n.accidental - 1 : n.accidental
    if (minorNotes[i]!.letter !== n.letter || minorNotes[i]!.accidental !== expected) throw new Error('The natural minor must be the major scale with notes 3, 6 and 7 lowered')
  })
  const fromNotes = (key.mode === 'major' ? majorNotes : minorNotes).filter((_, i) => changed.includes(i + 1))
  const toNotes = (key.mode === 'major' ? minorNotes : majorNotes).filter((_, i) => changed.includes(i + 1))
  const lowering = key.mode === 'major'
  steps.push({
    title: 'Check another way: compare notes 3, 6 and 7',
    text: `${keyLabel(minorKey)} (natural minor) is ${keyLabel(majorKey)} with notes 3, 6 and 7 lowered by a semitone. Going from ${name} to ${answerName}, notes 3, 6 and 7 change from ${notesLabel(fromNotes)} to ${notesLabel(toNotes)}. Each ${lowering ? 'lowered note takes away a sharp or adds a flat' : 'raised note adds a sharp or takes away a flat'}.`,
    result: `3 places towards the ${lowering ? 'flats' : 'sharps'}, as found`,
  })
  return {
    title: `Find the parallel ${answerMode} of ${name}`,
    task: `What is the parallel ${answerMode} of ${name}? How does the key signature change?`,
    steps,
    terms: w.terms(),
    answer: `The parallel ${answerMode} of ${name} is ${answerName}. ${name} has ${countWords(fKey)} and ${answerName} has ${countWords(fAnswer)}.`,
  }
}

/** Two steps: a perfect 5th up or down from a key note, by letter names and then by piano keys. */
function fifthStep(key: Key, direction: 'up' | 'down', w: Words): { key: Key; step: WorkedStep } {
  const target = noteAt(key.tonic, 5, 7, direction)
  const found = keyOf(target, key.mode)
  const engine = direction === 'up' ? dominantKey(key) : subdominantKey(key)
  if (!sameKey(engine, found)) throw new Error(`The key a 5th ${direction} from ${keyLabel(key)} disagrees with the theory engine`)
  const letters = (direction === 'up' ? lettersUp : lettersDown)(key.tonic.letter, 5)
  return {
    key: found,
    step: {
      title: `Go ${direction} a perfect 5th from ${noteLabel(key.tonic)}`,
      text: `A ${w.say('perfectFifth', 'perfect 5th')} ${direction === 'up' ? 'up' : 'down'}: count 5 letter names, ${letters.join(', ')}, then 7 piano keys, ${keyWalkText(key.tonic, target, 7, direction, prefersFlats(key.tonic, target))}. This key has one more ${direction === 'up' ? 'sharp (or one fewer flat)' : 'flat (or one fewer sharp)'}.`,
      result: `${keyLabel(found)} (${countWords(fifthsByRules(found))})`,
    },
  }
}

function closelyRelatedExample(key: Key): WorkedExample {
  const mode = key.mode
  const other = otherMode(mode)
  const name = keyLabel(key)
  const w = new Words()
  const relWord = (m: Key['mode']) => (m === 'major' ? 'relative minor' : 'relative major')
  const steps: WorkedStep[] = [
    {
      title: 'List the five keys to find',
      text: `${w.say('closelyRelated', 'Closely related keys')} are: the relative key, the key a perfect 5th above, the key a perfect 5th below, and the relative keys of those two. That makes five.`,
      result: 'Relative; 5th above and its relative; 5th below and its relative',
    },
  ]
  const relative = relativeKeySteps(
    key,
    `The ${mode === 'major' ? w.say('relativeMinor', 'relative minor') : w.say('relativeMajor', 'relative major')} of ${name} has the same key signature.`,
    relWord(mode).replace(/^r/, 'R'),
  )
  steps.push(...relative.steps)

  const up = fifthStep(key, 'up', w)
  steps.push(up.step)
  const upRelative = relativeKeySteps(up.key, `Now the ${relWord(mode)} of ${keyLabel(up.key)}.`, relWord(mode).replace(/^r/, 'R'))
  steps.push(...upRelative.steps)

  const down = fifthStep(key, 'down', w)
  steps.push(down.step)
  const downRelative = relativeKeySteps(down.key, `Now the ${relWord(mode)} of ${keyLabel(down.key)}.`, relWord(mode).replace(/^r/, 'R'))
  steps.push(...downRelative.steps)

  const found = [relative.key, up.key, upRelative.key, down.key, downRelative.key]
  assertStandard(key, ...found)
  if (found.some((k, i) => i % 2 === 0 && k.mode !== other)) throw new Error('Relative keys must be in the other mode')

  const base = fifthsByRules(key)
  const expected: [Key, number][] = [
    [relative.key, 0],
    [up.key, 1],
    [upRelative.key, 1],
    [down.key, -1],
    [downRelative.key, -1],
  ]
  for (const [k, delta] of expected) {
    if (fifthsByRules(k) !== base + delta) throw new Error(`${keyLabel(k)} should differ from ${name} by ${delta}`)
  }
  const a = found.map(keyLabel).sort().join(', ')
  const b = closelyRelatedKeys(key).map(keyLabel).sort().join(', ')
  if (a !== b) throw new Error(`Closely related keys of ${name}: long-hand ${a}, engine ${b}`)

  const signs = (k: Key) => countWords(keySignature(k).fifths)
  steps.push({
    title: 'Check another way: compare the key signatures',
    text: `Look up each key signature in the Key signatures lesson. ${name}: ${signs(key)}. ${found.map((k) => `${keyLabel(k)}: ${signs(k)}`).join('. ')}. Each differs from ${name} by one sharp or flat at most.`,
    result: `All five are within one sign of ${name}`,
  })
  return {
    title: `List the closely related keys of ${name}`,
    task: `List the keys that are closely related to ${name}.`,
    steps,
    terms: w.terms(),
    answer: `The keys closely related to ${name} are ${found.map(keyLabel).join(', ')}.`,
  }
}

/** The signature of a key as drawn by the engine, for tests and tables. */
export const signatureCount = (key: Key): number => keySignature(key).fifths

