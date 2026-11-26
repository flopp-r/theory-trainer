import type { WorkedExample, WorkedStep } from '../types'
import { type ClefName, type Key, type NoteName, closelyRelatedKeys, isStandardKey, keySignature, parallelKey, relativeKey } from '../../../theory'
import { keyLabel, noteLabel, notesLabel } from '../../../questions/pitchTools'
import { emptyStaff } from './common'
import { countWords, fifthsByRules, relativeMajorOf, relativeMinorOf, signatureSentence } from './keySignatures'
import { MAJOR_PATTERN, NATURAL_MINOR_PATTERN, assertSameNotes, lettersDown, lettersUp, noteAt, patternInOneLine } from './working'

export type KeyRelation = 'relative' | 'parallel' | 'closely-related'

const sameKey = (a: Key, b: Key) => a.mode === b.mode && a.tonic.letter === b.tonic.letter && a.tonic.accidental === b.tonic.accidental
const keyOf = (tonic: NoteName, mode: Key['mode']): Key => ({ tonic, mode })
const otherMode = (m: Key['mode']): Key['mode'] => (m === 'major' ? 'minor' : 'major')

function assertStandard(...keys: Key[]): void {
  for (const k of keys) if (!isStandardKey(k)) throw new Error(`${keyLabel(k)} is not one of the 30 standard keys, so it is not used in a worked example`)
}

/**
 * Worked examples about related keys: the relative key (same signature), the parallel key (same key note)
 * and the closely related keys. The working uses scales, letter names and semitone counts and the signature rules;
 * every answer is checked against the theory engine, and this function throws if they disagree.
 */
export function relativeKeyExample(key: Key, relation: KeyRelation, clef: ClefName = 'treble'): WorkedExample {
  if (relation === 'relative') return relativeExample(key, clef)
  if (relation === 'parallel') return parallelExample(key, clef)
  return closelyRelatedExample(key, clef)
}

function relativeExample(key: Key, clef: ClefName): WorkedExample {
  const isMajor = key.mode === 'major'
  const answerMode = otherMode(key.mode)
  const scaleName = isMajor ? 'major' : 'natural minor'
  const scale = patternInOneLine(key.tonic, isMajor ? MAJOR_PATTERN : NATURAL_MINOR_PATTERN)
  const degree = isMajor ? 6 : 3
  const fromScale = scale.notes[degree - 1]!
  const answer = keyOf(fromScale, answerMode)
  const byDistance = isMajor ? relativeMinorOf(key.tonic) : relativeMajorOf(key.tonic)
  assertStandard(key, answer)

  // Three routes must agree: the scale degree, the distance, and the theory engine.
  assertSameNotes(`relative ${answerMode} of ${keyLabel(key)} (scale and distance)`, [fromScale], [byDistance])
  const engine = relativeKey(key)
  if (!sameKey(engine, answer)) throw new Error(`Relative ${answerMode} of ${keyLabel(key)} disagrees with the theory engine`)
  const fifthsKey = fifthsByRules(key)
  const fifthsAnswer = fifthsByRules(answer)
  if (fifthsKey !== fifthsAnswer) throw new Error('Relative keys must share a key signature')

  const numbered = scale.notes.map((n, i) => `${i + 1} ${noteLabel(n)}`).join(', ')
  const steps: WorkedStep[] = [
    { text: `${keyLabel(key)} is a ${key.mode} key. We want the relative ${answerMode} key: the ${answerMode} key that has the **same key signature**.` },
    { text: `Write the ${scaleName} scale from ${noteLabel(key.tonic)}, using its pattern (${isMajor ? 'tone, tone, semitone, tone, tone, tone, semitone' : 'tone, semitone, tone, tone, semitone, tone, tone'}). Working note by note: ${scale.text}. So the scale is **${notesLabel(scale.notes)}**.` },
    { text: `Number the notes: ${numbered}.` },
    {
      text: isMajor
        ? `The relative minor starts on the **6th note** of the major scale. The 6th note is **${noteLabel(fromScale)}**. So the relative minor of ${keyLabel(key)} is **${keyLabel(answer)}**.`
        : `The relative major starts on the **3rd note** of the minor scale. The 3rd note is **${noteLabel(fromScale)}**. So the relative major of ${keyLabel(key)} is **${keyLabel(answer)}**.`,
    },
    {
      text: `Check by distance. Count 3 letter names ${isMajor ? 'down' : 'up'} from ${key.tonic.letter}: ${(isMajor ? lettersDown : lettersUp)(key.tonic.letter, 3).join(', ')}. The letter is ${answer.tonic.letter}, and ${noteLabel(answer.tonic)} is 3 semitones ${isMajor ? 'below' : 'above'} ${noteLabel(key.tonic)}. It is the same answer. ✓`,
    },
    {
      text: `Check the signatures. ${signatureSentence(isMajor ? key : answer)} ${keyLabel(isMajor ? answer : key)} shares that signature (${countWords(fifthsAnswer)}), which is why they are relatives. Here is the signature they share.`,
      staff: emptyStaff(clef, key),
    },
  ]
  return {
    title: `Find the relative ${answerMode} of ${keyLabel(key)}`,
    task: `What is the relative ${answerMode} of ${keyLabel(key)}?`,
    steps,
    answer: `The relative ${answerMode} of ${keyLabel(key)} is ${keyLabel(answer)}.`,
  }
}

function parallelExample(key: Key, clef: ClefName): WorkedExample {
  const answerMode = otherMode(key.mode)
  const answer = keyOf(key.tonic, answerMode)
  assertStandard(key, answer)
  const engine = parallelKey(key)
  if (!sameKey(engine, answer)) throw new Error(`Parallel key of ${keyLabel(key)} disagrees with the theory engine`)
  const fifthsKey = fifthsByRules(key)
  const fifthsAnswer = fifthsByRules(answer)
  const major = key.mode === 'major' ? key : answer
  const fMajor = key.mode === 'major' ? fifthsKey : fifthsAnswer
  const fMinor = key.mode === 'major' ? fifthsAnswer : fifthsKey
  if (fMinor !== fMajor - 3) throw new Error('A minor key must have 3 fewer sharps (or 3 more flats) than its parallel major')
  const relative = relativeKey(key)
  const relativeFifths = fifthsByRules(relative)
  if (relativeFifths !== fifthsKey) throw new Error('Relative key signature mismatch')
  const difference = Math.abs(fifthsAnswer - fifthsKey)
  const towards = fifthsAnswer < fifthsKey ? 'flats' : 'sharps'
  const change = `${difference} places round the circle of fifths towards the ${towards} (each place ${towards === 'flats' ? 'adds a flat or takes away a sharp' : 'adds a sharp or takes away a flat'})`
  return {
    title: `Find the parallel ${answerMode} of ${keyLabel(key)}`,
    task: `What is the parallel ${answerMode} of ${keyLabel(key)}? How does the key signature change?`,
    steps: [
      { text: `**Parallel** keys share the **same key note** but are in the other mode. The key note here is ${noteLabel(key.tonic)}, so the parallel ${answerMode} is **${keyLabel(answer)}**.` },
      { text: `Find the signature of ${keyLabel(key)}. ${signatureSentence(key)}`, staff: emptyStaff(clef, key) },
      { text: `Find the signature of ${keyLabel(answer)}. ${signatureSentence(answer)}`, staff: emptyStaff(clef, answer) },
      {
        text: `Compare. ${keyLabel(key)} has ${countWords(fifthsKey)}; ${keyLabel(answer)} has ${countWords(fifthsAnswer)}. Going from ${keyLabel(key)} to ${keyLabel(answer)} moves ${change}. The signatures are **different**.`,
      },
      {
        text: `Check against the relative key. The *relative* ${answerMode} of ${keyLabel(key)} would be ${keyLabel(relative)}, which has the same ${countWords(relativeFifths)} as ${keyLabel(key)}. ${keyLabel(answer)} does not, so it is the parallel key, not the relative one. ✓ (A pair of parallel keys always differs by 3 places: the minor key is 3 places nearer the flats than the major key on the same note. Here the major key is ${keyLabel(major)}.)`,
      },
    ],
    answer: `The parallel ${answerMode} of ${keyLabel(key)} is ${keyLabel(answer)}. ${keyLabel(key)} has ${countWords(fifthsKey)} and ${keyLabel(answer)} has ${countWords(fifthsAnswer)}.`,
  }
}

function closelyRelatedExample(key: Key, clef: ClefName): WorkedExample {
  const mode = key.mode
  const sharpSide = keyOf(noteAt(key.tonic, 5, 7, 'up'), mode) // a perfect 5th above: one more sharp (or one fewer flat)
  const flatSide = keyOf(noteAt(key.tonic, 5, 7, 'down'), mode) // a perfect 5th below: one more flat (or one fewer sharp)
  const relative = keyOf(mode === 'major' ? relativeMinorOf(key.tonic) : relativeMajorOf(key.tonic), otherMode(mode))
  const sharpRelative = keyOf(sharpSide.mode === 'major' ? relativeMinorOf(sharpSide.tonic) : relativeMajorOf(sharpSide.tonic), otherMode(mode))
  const flatRelative = keyOf(flatSide.mode === 'major' ? relativeMinorOf(flatSide.tonic) : relativeMajorOf(flatSide.tonic), otherMode(mode))
  const found = [relative, sharpSide, sharpRelative, flatSide, flatRelative]
  assertStandard(key, ...found)

  const base = fifthsByRules(key)
  const expected: [Key, number][] = [
    [relative, 0],
    [sharpSide, 1],
    [sharpRelative, 1],
    [flatSide, -1],
    [flatRelative, -1],
  ]
  for (const [k, delta] of expected) {
    if (fifthsByRules(k) !== base + delta) throw new Error(`${keyLabel(k)} should differ from ${keyLabel(key)} by ${delta}`)
  }
  const engine = closelyRelatedKeys(key)
  const a = found.map(keyLabel).sort().join(', ')
  const b = engine.map(keyLabel).sort().join(', ')
  if (a !== b) throw new Error(`Closely related keys of ${keyLabel(key)}: long-hand ${a}, engine ${b}`)

  const name = keyLabel(key)
  const sharpWord = (k: Key) => countWords(fifthsByRules(k))
  return {
    title: `List the closely related keys of ${name}`,
    task: `List the keys that are closely related to ${name}.`,
    steps: [
      { text: `Find the signature of ${name}. ${signatureSentence(key)}`, staff: emptyStaff(clef, key) },
      {
        text: `Remember the idea: **closely related keys** have signatures that differ from ${name}'s by **at most one sharp or flat**. There are five of them: the relative key (the same signature), and the two keys next to it on the circle of fifths (one more sharp and one more flat), each with its own relative key.`,
      },
      {
        text: `**The same signature.** The relative ${otherMode(mode)} of ${name} is **${keyLabel(relative)}** (${sharpWord(relative)}).`,
      },
      {
        text: `**One more sharp** (or one fewer flat). Go up a perfect 5th from ${noteLabel(key.tonic)}: count 5 letter names up (${lettersUp(key.tonic.letter, 5).join(', ')}) to get the letter ${sharpSide.tonic.letter}, which is 7 semitones up: **${keyLabel(sharpSide)}** (${sharpWord(sharpSide)}). Its relative ${otherMode(mode)} is **${keyLabel(sharpRelative)}** (also ${sharpWord(sharpRelative)}).`,
      },
      {
        text: `**One more flat** (or one fewer sharp). Go down a perfect 5th from ${noteLabel(key.tonic)}: count 5 letter names down (${lettersDown(key.tonic.letter, 5).join(', ')}) to get the letter ${flatSide.tonic.letter}, which is 7 semitones down: **${keyLabel(flatSide)}** (${sharpWord(flatSide)}). Its relative ${otherMode(mode)} is **${keyLabel(flatRelative)}** (also ${sharpWord(flatRelative)}).`,
      },
      {
        text: `Check. ${name} has ${countWords(base)}. The five keys are ${found.map((k) => `${keyLabel(k)} (${countWords(fifthsByRules(k))})`).join(', ')}. None differs from ${name} by more than one sign. ✓`,
      },
    ],
    answer: `The keys closely related to ${name} are ${found.map(keyLabel).join(', ')}.`,
  }
}

/** The signature of a key as drawn by the engine, for tests and tables. */
export const signatureCount = (key: Key): number => keySignature(key).fifths
