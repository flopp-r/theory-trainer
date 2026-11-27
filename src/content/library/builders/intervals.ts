import type { WorkedExample, WorkedStep } from '../types'
import {
  type ClefName,
  type Direction,
  type Interval,
  type NoteName,
  type Pitch,
  diatonicStep,
  intervalBetween,
  intervalName,
  intervalSemitones,
  intervalShortName,
  invertInterval,
  midiNumber,
  parseInterval,
  pitchClass,
  shiftOctaves,
  transpose,
} from '../../../theory'
import { noteLabel } from '../../../questions/pitchTools'
import { listenMelody } from './audio'
import { notesOnStaff } from './common'
import {
  SEMITONES_TO_NEXT_LETTER,
  type TermId,
  Words,
  article,
  blackKeyReason,
  keyWalkText,
  lettersDown,
  lettersUp,
  mod12,
  prefersFlats,
  semitones,
  signPhrase,
  spellOnLetter,
} from './working'

/** What an interval of each size is called when it has its smallest "natural" form. Written out by hand. */
const BASE: Record<number, { perfect: boolean; semitones: number; word: string }> = {
  2: { perfect: false, semitones: 2, word: '2nd' },
  3: { perfect: false, semitones: 4, word: '3rd' },
  4: { perfect: true, semitones: 5, word: '4th' },
  5: { perfect: true, semitones: 7, word: '5th' },
  6: { perfect: false, semitones: 9, word: '6th' },
  7: { perfect: false, semitones: 11, word: '7th' },
  8: { perfect: true, semitones: 12, word: 'octave' },
}

type QualityName = 'diminished' | 'minor' | 'perfect' | 'major' | 'augmented'
const SHORT: Record<QualityName, string> = { diminished: 'd', minor: 'm', perfect: 'P', major: 'M', augmented: 'A' }

/** Quality from the number and the semitones, by the table: perfect or major is the base size, minor is one less, and so on. */
export function qualityFromSemitones(number: number, size: number): QualityName {
  const base = BASE[number]
  if (!base) throw new RangeError(`This lesson covers intervals from a 2nd to an octave, not a ${number}`)
  const diff = size - base.semitones
  if (base.perfect) {
    if (diff === 0) return 'perfect'
    if (diff === 1) return 'augmented'
    if (diff === -1) return 'diminished'
  } else {
    if (diff === 0) return 'major'
    if (diff === -1) return 'minor'
    if (diff === 1) return 'augmented'
    if (diff === -2) return 'diminished'
  }
  throw new RangeError(`A ${size}-semitone interval of ${number} letter names is more than one step outside the table`)
}

export const shortNameOf = (number: number, quality: QualityName): string => `${SHORT[quality]}${number}`
/** Semitones in an interval, by the table: the base size plus or minus the quality's adjustment. */
export function semitonesOf(number: number, quality: QualityName): number {
  const base = BASE[number]
  if (!base) throw new RangeError(`This lesson covers intervals from a 2nd to an octave, not a ${number}`)
  const adjustments: Partial<Record<QualityName, number>> = base.perfect
    ? { diminished: -1, perfect: 0, augmented: 1 }
    : { diminished: -2, minor: -1, major: 0, augmented: 1 }
  const adjustment = adjustments[quality]
  if (adjustment === undefined) throw new RangeError(`There is no ${quality} ${base.word}`)
  return base.semitones + adjustment
}

export const longNameOf = (number: number, quality: QualityName): string => `${quality} ${BASE[number]!.word}`

/** The rows of the table of intervals to learn (number, names and semitones), built from the engine. */
export function intervalTableRows(): string[][] {
  const names = ['m2', 'M2', 'm3', 'M3', 'P4', 'A4', 'd5', 'P5', 'm6', 'M6', 'm7', 'M7', 'P8']
  return names.map((short) => {
    const i = parseInterval(short)
    return [intervalName(i), short, String(intervalSemitones(i))]
  })
}


const QUALITY_TERM: Record<QualityName, TermId> = { major: 'major', minor: 'minor', perfect: 'perfect', augmented: 'augmented', diminished: 'diminished' }
const capital = (s: string): string => s.charAt(0).toUpperCase() + s.slice(1)
const numberWord = (number: number): string => (number === 8 ? 'an octave (8th)' : `${article(BASE[number]!.word)} ${BASE[number]!.word}`)

/** The quality step: which sizes this number can have, and which one these semitones give. */
function qualityText(number: number, size: number, w: Words): string {
  const base = BASE[number]!
  const quality = qualityFromSemitones(number, size)
  const say = (q: QualityName) => w.say(QUALITY_TERM[q], q)
  const lead = `The ${w.say('quality', 'quality')} comes from the semitones.`
  if (base.perfect) {
    const head = `${lead} ${capital(numberWord(number))} is ${say('perfect')} with ${semitones(base.semitones)}.`
    if (quality === 'perfect') return `${head} Yours has ${size}, so it is perfect.`
    return `${head} Yours has ${size}, one ${size > base.semitones ? 'more' : 'fewer'}, so it is ${say(quality)}.`
  }
  const head = `${lead} ${capital(numberWord(number))} is ${say('minor')} with ${semitones(base.semitones - 1)} or ${say('major')} with ${base.semitones}.`
  switch (quality) {
    case 'major':
    case 'minor':
      return `${head} Yours has ${size}, so it is ${quality}.`
    case 'augmented':
      return `${head} Yours has ${size}, one more than major, so it is ${say('augmented')}.`
    default:
      return `${head} Yours has ${size}, one fewer than minor, so it is ${say('diminished')}.`
  }
}

/**
 * One step per pair of neighbouring natural letters, with a running total: "From C up to D is 2 semitones (...). 2 + 2 = 4."
 * Going down, the size of each pair is the size of the pair going up from the lower letter.
 */
function letterGapSteps(from: NoteName['letter'], count: number, direction: 'up' | 'down', intro: string): { total: number; steps: WorkedStep[] } {
  const letters = direction === 'up' ? lettersUp(from, count + 1) : lettersDown(from, count + 1)
  let total = 0
  const steps = letters.slice(0, -1).map((a, i): WorkedStep => {
    const b = letters[i + 1]!
    const size = SEMITONES_TO_NEXT_LETTER[direction === 'up' ? a : b]
    const before = total
    total += size
    const sentence = `From ${a} ${direction} to ${b} is ${semitones(size)} (${blackKeyReason(size)}).`
    return {
      title: `Count ${a} ${direction} to ${b}`,
      text: i === 0 ? `${intro} ${sentence}` : `${sentence} Add it on: ${before} + ${size} = ${total}.`,
      result: `Total so far: ${semitones(total)}`,
    }
  })
  return { total, steps }
}

/** "B♭ has a flat (...), so it is 1 semitone lower than B." */
const signSentence = (n: NoteName, w: Words): string =>
  `${noteLabel(n)} has ${signPhrase(n.accidental, w)}, so it is ${semitones(Math.abs(n.accidental))} ${n.accidental > 0 ? 'higher' : 'lower'} than ${n.letter}.`

/**
 * Name the interval between two notes, with the two-part method: count letter names for the number, count semitones for the quality.
 * The semitones are counted one pair of natural letters at a time (E to F and B to C are one, the rest two),
 * then adjusted for sharps and flats. The count is checked against MIDI numbers and the answer against the engine; this throws on disagreement.
 */
export function intervalNameExample(lower: Pitch, upper: Pitch, clef: ClefName = 'treble'): WorkedExample {
  const number = diatonicStep(upper) - diatonicStep(lower) + 1
  if (number < 2 || number > 8) throw new RangeError('This example covers intervals from a 2nd to an octave, with the lower note first')
  const lowerName = noteLabel(lower)
  const upperName = noteLabel(upper)
  const letters = lettersUp(lower.letter, number)
  const w = new Words()
  const hasSigns = lower.accidental !== 0 || upper.accidental !== 0

  const steps: WorkedStep[] = [
    {
      title: 'Find the lower and upper notes',
      text: `An ${w.say('interval', 'interval')} is measured from the lower note up. Here the lower note is ${lowerName} and the upper note is ${upperName}.`,
      result: `${lowerName} up to ${upperName}`,
      staff: notesOnStaff(clef, [lower, upper]),
    },
    {
      title: 'Count the letter names',
      text: `Count the letter names from ${lower.letter} up to ${upper.letter}, counting both notes: ${letters.join(', ')}. That is ${number} letter names, so the ${w.named('number', 'number')} of the interval is ${numberWord(number)}. A ♯ or ♭ never changes the letter, so it never changes the number.`,
      result: `Number: ${number === 8 ? 'octave' : BASE[number]!.word}`,
    },
  ]
  const intro = hasSigns
    ? `Now count the ${w.say('semitone', 'semitones')} between the ${w.say('natural', 'natural')} letters ${lower.letter} and ${upper.letter}, leaving the signs until later.`
    : `Now count the ${w.say('semitone', 'semitones')}, one pair of neighbouring letters at a time.`
  const walk = letterGapSteps(lower.letter, number - 1, 'up', intro)
  steps.push(...walk.steps)

  let size = walk.total
  if (lower.accidental !== 0) {
    const change = -lower.accidental // a sharp on the lower note brings it nearer the upper note
    const after = size + change
    steps.push({
      title: `Adjust for the ${lower.accidental > 0 ? 'sharp' : 'flat'} on ${lowerName}`,
      text: `${signSentence(lower, w)} Moving the bottom note ${lower.accidental > 0 ? 'up makes the interval narrower' : 'down makes the interval wider'}, so ${change > 0 ? 'add' : 'subtract'} ${Math.abs(change)}: ${size} ${change > 0 ? '+' : '−'} ${Math.abs(change)} = ${after}.`,
      result: `Total: ${semitones(after)}`,
    })
    size = after
  }
  if (upper.accidental !== 0) {
    const change = upper.accidental // a sharp on the upper note takes it further away
    const after = size + change
    steps.push({
      title: `Adjust for the ${upper.accidental > 0 ? 'sharp' : 'flat'} on ${upperName}`,
      text: `${signSentence(upper, w)} Moving the top note ${upper.accidental > 0 ? 'up makes the interval wider' : 'down makes the interval narrower'}, so ${change > 0 ? 'add' : 'subtract'} ${Math.abs(change)}: ${size} ${change > 0 ? '+' : '−'} ${Math.abs(change)} = ${after}.`,
      result: `Total: ${semitones(after)}`,
    })
    size = after
  }
  if (size !== midiNumber(upper) - midiNumber(lower)) throw new Error('Semitone count disagrees with the MIDI numbers')

  const quality = qualityFromSemitones(number, size)
  const engine = intervalBetween(lower, upper)
  if (engine.direction !== 'up' || intervalShortName(engine.interval) !== shortNameOf(number, quality) || intervalName(engine.interval) !== longNameOf(number, quality)) {
    throw new Error(`Interval ${lowerName} to ${upperName}: long-hand ${shortNameOf(number, quality)}, engine ${intervalShortName(engine.interval)}`)
  }
  const answerShort = shortNameOf(number, quality)
  const answerName = longNameOf(number, quality)
  steps.push({ title: 'Look up the quality', text: qualityText(number, size, w), result: `${capital(answerName)} (${answerShort})` })
  steps.push({
    title: 'Check another way: count piano keys',
    text: `Count up one piano key at a time from ${lowerName} to ${upperName}, without using the letter pairs. Count the steps, not the key you start on: ${keyWalkText(lower, upper, size, 'up', prefersFlats(lower, upper))}.`,
    result: `${semitones(size)} again, so ${article(answerName)} ${answerName}`,
    listen: listenMelody(`Hear ${lowerName} then ${upperName}`, [lower, upper]),
  })
  return {
    title: `Name the interval from ${lowerName} to ${upperName}`,
    task: `What is the interval from ${lowerName} up to ${upperName}?`,
    steps,
    terms: w.terms(),
    answer: `The interval from ${lowerName} to ${upperName} is ${article(answerName)} ${answerName} (${answerShort}).`,
  }
}

/**
 * Build the note a given interval above (or below) a starting note.
 * The working counts letter names for the note's letter, counts semitones to the natural letter one pair at a time,
 * adjusts for the start's own sign, then fixes the new note's sign. Checked against the engine's `transpose`
 * and `intervalBetween`; this throws on disagreement.
 */
export function buildIntervalExample(start: Pitch, shortName: string, direction: Direction, clef: ClefName = 'treble'): WorkedExample {
  const interval: Interval = parseInterval(shortName)
  const number = interval.number
  const base = BASE[number]
  if (!base) throw new RangeError('This example covers intervals from a 2nd to an octave')
  const quality = interval.quality as QualityName
  const wanted = semitonesOf(number, quality)
  if (wanted !== intervalSemitones(interval)) throw new Error('The table and the engine disagree about the size of the interval')
  const startName = noteLabel(start)
  const name = longNameOf(number, quality)
  const art = article(name)
  const dirWord = direction === 'up' ? 'above' : 'below'
  const w = new Words()

  const letterList = direction === 'up' ? lettersUp(start.letter, number) : lettersDown(start.letter, number)
  const letter = letterList[number - 1]!
  const target: NoteName = spellOnLetter(letter, mod12(pitchClass(start) + (direction === 'up' ? 1 : -1) * wanted))
  const result = transpose(start, interval, direction)
  if (result.letter !== target.letter || result.accidental !== target.accidental) {
    throw new Error(`Build ${shortName} ${direction} from ${startName}: long-hand ${noteLabel(target)}, engine ${noteLabel(result)}`)
  }
  const [low, high] = direction === 'up' ? [start, result] : [result, start]
  if (intervalShortName(intervalBetween(low, high).interval) !== shortName) throw new Error('Counting back does not give the interval we started with')

  const steps: WorkedStep[] = [
    {
      title: 'Look up the interval',
      text: `${capital(art)} ${name} is an ${w.say('interval', 'interval')} of ${number} letter names, counting both notes. Its quality, ${w.say(QUALITY_TERM[quality], quality)}, sets its size: ${w.say('semitone', semitones(wanted))}. You start on ${startName} and go ${direction}.`,
      result: `${number} letter names, ${semitones(wanted)}`,
      staff: notesOnStaff(clef, [start]),
    },
    {
      title: `Count ${number} letter names ${direction}`,
      text: `Count ${direction} from ${start.letter}, counting ${start.letter} as 1: ${letterList.join(', ')}. The new note must use the letter ${letter}, whatever sign it needs.`,
      result: `Letter: ${letter}`,
    },
  ]
  const walk = letterGapSteps(
    start.letter,
    number - 1,
    direction,
    `Now count the semitones from ${start.letter} ${direction} to ${letter}, using the ${w.say('natural', 'natural')} letters first.`,
  )
  steps.push(...walk.steps)

  // How far the start note is from the natural letter, once the start's own sign is counted.
  let have = walk.total
  if (start.accidental !== 0) {
    const change = direction === 'up' ? -start.accidental : start.accidental
    const after = have + change
    steps.push({
      title: `Adjust for the ${start.accidental > 0 ? 'sharp' : 'flat'} on ${startName}`,
      text: `${signSentence(start, w)} That makes the distance ${direction} to ${letter} ${semitones(Math.abs(change))} ${change > 0 ? 'bigger' : 'smaller'}: ${have} ${change > 0 ? '+' : '−'} ${Math.abs(change)} = ${after}.`,
      result: `${startName} ${direction} to ${letter}: ${semitones(after)}`,
    })
    have = after
  }
  // up: too few semitones means the letter is too low, so raise it. down: too few means not far enough down, so lower it.
  const fix = direction === 'up' ? wanted - have : have - wanted
  if (fix !== target.accidental) throw new Error('The sign worked out by counting disagrees with the sign worked out from pitch classes')
  const fixText =
    fix === 0
      ? `They match, so ${letter} stays a natural: **${noteLabel(target)}**.`
      : `${letter} is ${semitones(Math.abs(have - wanted))} ${have < wanted ? 'too close' : 'too far'}, so ${fix > 0 ? 'raise' : 'lower'} it with ${signPhrase(fix, w)}: **${noteLabel(target)}**.`
  steps.push({
    title: `Fix the sign on ${letter}`,
    text: `You need ${semitones(wanted)}, and ${startName} ${direction} to ${letter} is ${have}. ${fixText}`,
    result: `The note is ${noteLabel(target)}`,
    staff: notesOnStaff(clef, [start, result]),
    listen: listenMelody(`Hear ${startName} then ${noteLabel(target)}`, [start, result]),
  })
  steps.push({
    title: 'Check another way: count piano keys',
    text: `Count ${direction} one piano key at a time from ${startName} to ${noteLabel(target)}, without using the letter pairs. Count the steps, not the key you start on: ${keyWalkText(start, target, wanted, direction, prefersFlats(start, target))}.`,
    result: `${semitones(wanted)}, as ${art} ${name} needs`,
  })
  return {
    title: `Build ${art} ${name} ${dirWord} ${startName}`,
    task: `What note is ${art} ${name} ${dirWord} ${startName}?`,
    steps,
    terms: w.terms(),
    answer: `${capital(art)} ${name} ${dirWord} ${startName} is ${noteLabel(target)}.`,
  }
}

/** Invert an interval: the lower note goes up an octave. The number and the size are worked out by the rules, checked by counting, and against the engine. */
export function invertIntervalExample(lower: Pitch, shortName: string, clef: ClefName = 'treble'): WorkedExample {
  const interval = parseInterval(shortName)
  const number = interval.number
  if (number < 2 || number > 7) throw new RangeError('Inversion examples use intervals from a 2nd to a 7th')
  const size = intervalSemitones(interval)
  const quality = interval.quality as QualityName
  const upper = transpose(lower, interval)
  const moved = shiftOctaves(lower, 1)
  const newNumber = 9 - number
  const newSize = 12 - size
  const newQuality = qualityFromSemitones(newNumber, newSize)
  const flip: Record<QualityName, QualityName> = { major: 'minor', minor: 'major', perfect: 'perfect', augmented: 'diminished', diminished: 'augmented' }
  if (newQuality !== flip[quality]) throw new Error('The quality flipped by the rules disagrees with the table')
  const engine = invertInterval(interval)
  const between = intervalBetween(upper, moved).interval
  if (intervalShortName(engine) !== shortNameOf(newNumber, newQuality) || intervalShortName(between) !== shortNameOf(newNumber, newQuality)) {
    throw new Error('Inversion disagrees with the theory engine')
  }
  const lowerName = noteLabel(lower)
  const upperName = noteLabel(upper)
  const name = longNameOf(number, quality)
  const newName = longNameOf(newNumber, newQuality)
  const letters = lettersUp(upper.letter, newNumber)
  if (letters[newNumber - 1] !== lower.letter) throw new Error('Counting letters up from the upper note must reach the moved note')
  if (midiNumber(moved) - midiNumber(upper) !== newSize) throw new Error('Counting the inverted interval does not give 12 minus the original')
  const w = new Words()
  const rule =
    quality === 'major' || quality === 'minor' ? 'major and minor swap' : quality === 'perfect' ? 'perfect stays perfect' : 'augmented and diminished swap'
  return {
    title: `Invert ${article(name)} ${name}`,
    task: `Invert the ${name} from ${lowerName} up to ${upperName}. What interval do you get?`,
    steps: [
      {
        title: 'Write the interval you start with',
        text: `${lowerName} up to ${upperName} is an ${w.say('interval', 'interval')} of ${number} letter names and ${w.say('semitone', semitones(size))}: ${article(name)} ${name}.`,
        result: `${lowerName} up to ${upperName}: ${name}, ${semitones(size)}`,
        staff: notesOnStaff(clef, [lower, upper]),
      },
      {
        title: 'Move the lower note up an octave',
        text: `To make the ${w.say('inversion', 'inversion')}, move the lower note ${lowerName} up ${w.say('octave', 'an octave')} to the next ${lowerName}. ${upperName} stays where it is. Now ${upperName} is the lower note and ${lowerName} is the upper note.`,
        result: `${upperName} up to ${lowerName}`,
        staff: notesOnStaff(clef, [upper, moved]),
      },
      {
        title: 'Find the new number',
        text: `An interval and its inversion always have ${w.say('number', 'numbers')} that add up to 9. Together they span an octave, 8 letter names, and ${upperName} is counted in both, so 8 + 1 = 9. Here 9 − ${number} = ${newNumber}.`,
        result: `Number: ${BASE[newNumber]!.word}`,
      },
      {
        title: 'Find the new number of semitones',
        text: `Together the two intervals fill one octave, which is 12 semitones. So the inversion has 12 − ${size} = **${semitones(newSize)}**.`,
        result: semitones(newSize),
      },
      {
        title: 'Look up the quality',
        text: `${qualityText(newNumber, newSize, w)} This fits the rule for inversions: ${rule}.`,
        result: `${capital(newName)} (${shortNameOf(newNumber, newQuality)})`,
      },
      {
        title: 'Check another way: count the new interval',
        text: `Count the letter names from ${upper.letter} up to ${lower.letter}, counting both: ${letters.join(', ')}. That is ${newNumber}. Count piano keys up from ${upperName}: ${keyWalkText(upper, moved, newSize, 'up', prefersFlats(upper, moved))}.`,
        result: `${newNumber} letter names and ${semitones(newSize)}: ${article(newName)} ${newName}`,
        listen: listenMelody(`Hear ${upperName} then ${noteLabel(moved)}`, [upper, moved]),
      },
    ],
    terms: w.terms(),
    answer: `The inversion of ${article(name)} ${name} is ${article(newName)} ${newName} (${shortNameOf(newNumber, newQuality)}).`,
  }
}
