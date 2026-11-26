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
import { SEMITONES_TO_NEXT_LETTER, lettersDown, lettersUp, mod12, semitones, signWords, spellOnLetter } from './working'

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

/** A sentence for the table lookup: which sizes this number can have and which one this is. */
function lookupSentence(number: number, size: number): string {
  const base = BASE[number]!
  const quality = qualityFromSemitones(number, size)
  if (base.perfect) {
    const head = `A ${base.word} is **perfect** when it has ${base.semitones} semitones.`
    if (quality === 'perfect') return `${head} Yours has ${size}, so it is **perfect**.`
    return `${head} Yours has ${size}, which is one ${size > base.semitones ? 'more' : 'fewer'} than perfect, so it is **${quality}**.`
  }
  const head = `A ${base.word} is **minor** with ${base.semitones - 1} semitones or **major** with ${base.semitones}.`
  switch (quality) {
    case 'major':
      return `${head} Yours has ${size}, so it is **major**.`
    case 'minor':
      return `${head} Yours has ${size}, so it is **minor**.`
    case 'augmented':
      return `${head} Yours has ${size}, which is one more than major, so it is **augmented**.`
    default:
      return `${head} Yours has ${size}, which is one fewer than minor, so it is **diminished**.`
  }
}

/** The semitones from the letter name of `from` up `count` letter-name steps, written as "C to D is 2, D to E is 2". */
function walkUp(fromLetter: NoteName['letter'], count: number): { total: number; text: string } {
  const letters = lettersUp(fromLetter, count + 1)
  const parts = letters.slice(0, -1).map((l, i) => ({ from: l, to: letters[i + 1]!, size: SEMITONES_TO_NEXT_LETTER[l] }))
  return { total: parts.reduce((a, p) => a + p.size, 0), text: parts.map((p) => `${p.from} to ${p.to} is ${p.size}`).join(', ') }
}

/** The same going down: from F down to E is 1 (E to F is a semitone), E down to D is 2. */
function walkDown(fromLetter: NoteName['letter'], count: number): { total: number; text: string } {
  const letters = lettersDown(fromLetter, count + 1)
  const parts = letters.slice(0, -1).map((l, i) => ({ from: l, to: letters[i + 1]!, size: SEMITONES_TO_NEXT_LETTER[letters[i + 1]!] }))
  return { total: parts.reduce((a, p) => a + p.size, 0), text: parts.map((p) => `${p.from} down to ${p.to} is ${p.size}`).join(', ') }
}

const accidentalNote = (n: NoteName): string => (n.accidental === 0 ? '' : ` (${n.accidental > 0 ? 'higher' : 'lower'} than the plain ${n.letter} by ${semitones(Math.abs(n.accidental))})`)

/**
 * Name the interval between two notes, with the two-step method: count letter names for the number, count semitones for the quality.
 * The semitones are counted by walking up the letters with the piano's pattern (E to F and B to C are one, the rest two),
 * then adjusting for sharps and flats. The count is checked against MIDI numbers and the answer against the engine; this throws on disagreement.
 */
export function intervalNameExample(lower: Pitch, upper: Pitch, clef: ClefName = 'treble'): WorkedExample {
  const number = diatonicStep(upper) - diatonicStep(lower) + 1
  if (number < 2 || number > 8) throw new RangeError('This example covers intervals from a 2nd to an octave, with the lower note first')
  const lowerName = noteLabel(lower)
  const upperName = noteLabel(upper)
  const letters = lettersUp(lower.letter, number)
  const walk = walkUp(lower.letter, number - 1)
  const adjust = upper.accidental - lower.accidental
  const size = walk.total + adjust
  if (size !== midiNumber(upper) - midiNumber(lower)) throw new Error('Semitone count disagrees with the MIDI numbers')
  const quality = qualityFromSemitones(number, size)
  const engine = intervalBetween(lower, upper)
  if (engine.direction !== 'up' || intervalShortName(engine.interval) !== shortNameOf(number, quality) || intervalName(engine.interval) !== longNameOf(number, quality)) {
    throw new Error(`Interval ${lowerName} to ${upperName}: long-hand ${shortNameOf(number, quality)}, engine ${intervalShortName(engine.interval)}`)
  }

  const adjustments: string[] = []
  if (lower.accidental !== 0) {
    adjustments.push(
      `The lower note ${lowerName} has ${signWords(lower.accidental)}${accidentalNote(lower)}, so it starts ${semitones(Math.abs(lower.accidental))} ${lower.accidental > 0 ? 'nearer to' : 'further from'} the upper note: ${lower.accidental > 0 ? 'subtract' : 'add'} ${Math.abs(lower.accidental)}.`,
    )
  }
  if (upper.accidental !== 0) {
    adjustments.push(
      `The upper note ${upperName} has ${signWords(upper.accidental)}${accidentalNote(upper)}, so it ends ${semitones(Math.abs(upper.accidental))} ${upper.accidental > 0 ? 'further from' : 'nearer to'} the lower note: ${upper.accidental > 0 ? 'add' : 'subtract'} ${Math.abs(upper.accidental)}.`,
    )
  }
  const staff = notesOnStaff(clef, [lower, upper])
  const answerShort = shortNameOf(number, quality)
  const answerName = longNameOf(number, quality)
  const baseWord = BASE[number]!.word
  return {
    title: `Name the interval from ${lowerName} to ${upperName}`,
    task: `What is the interval from ${lowerName} up to ${upperName}?`,
    steps: [
      { text: `Look at the picture. The lower note is **${lowerName}** and the upper note is **${upperName}**.`, staff },
      {
        text: `**Step 1: the number.** Count the letter names from ${lower.letter} up to ${upper.letter}, counting **both** ends: ${letters.join(', ')}. That is ${number} letter names, so the interval is ${baseWord === 'octave' ? 'an' : 'a'} **${baseWord}**. Signs (♯ and ♭) do not change the letters, so they do not change the number.`,
      },
      {
        text: `**Step 2: count the semitones.** Walk up the plain letters, remembering that E to F and B to C are 1 semitone and every other neighbouring pair is 2: ${walk.text}. Add them up: **${walk.total}**.${adjustments.length === 0 ? ' Neither note has a sharp or flat, so there is nothing to adjust.' : ` Now adjust for the signs. ${adjustments.join(' ')} The total is ${semitones(size)}.`}`,
      },
      { text: `**Step 3: the quality.** ${lookupSentence(number, size)}` },
      {
        text: `Check by saying the answer as a recipe: a ${answerName} is ${number} letter names and ${size} semitones. The letters are ${number} (${letters.join(', ')}) and the semitones are ${size}. ✓ Here are the two notes, one after the other.`,
        listen: listenMelody(`Hear ${lowerName} then ${upperName}`, [lower, upper]),
      },
    ],
    answer: `The interval from ${lowerName} to ${upperName} is ${/^[aeiou]/.test(answerName) ? 'an' : 'a'} ${answerName} (${answerShort}).`,
  }
}

/**
 * Build the note a given interval above (or below) a starting note.
 * The working counts letter names for the note's letter, then fixes the sign so the semitones match, then checks by counting back.
 * The result is checked against the engine's `transpose` and `intervalBetween`; this throws on disagreement.
 */
export function buildIntervalExample(start: Pitch, shortName: string, direction: Direction, clef: ClefName = 'treble'): WorkedExample {
  const interval: Interval = parseInterval(shortName)
  const number = interval.number
  const base = BASE[number]
  if (!base) throw new RangeError('This example covers intervals from a 2nd to an octave')
  const quality = interval.quality as QualityName
  const wantedSemitones = semitonesOf(number, quality)
  if (wantedSemitones !== intervalSemitones(interval)) throw new Error('The table and the engine disagree about the size of the interval')
  const startName = noteLabel(start)
  const name = longNameOf(number, quality)
  const article = /^[aeiou]/.test(name) ? 'an' : 'a'
  const dirWord = direction === 'up' ? 'above' : 'below'

  // Letter: count letter names, counting the start as 1.
  const letterList = direction === 'up' ? lettersUp(start.letter, number) : lettersDown(start.letter, number)
  const letter = letterList[number - 1]!
  // Distance from the start to the plain letter, by the piano's pattern, adjusted for the start's own sign.
  const walk = direction === 'up' ? walkUp(start.letter, number - 1) : walkDown(start.letter, number - 1)
  const adjust = direction === 'up' ? -start.accidental : start.accidental
  const plainDistance = walk.total + adjust
  const fix = direction === 'up' ? wantedSemitones - plainDistance : plainDistance - wantedSemitones
  const target: NoteName = spellOnLetter(letter, mod12(pitchClass(start) + (direction === 'up' ? 1 : -1) * wantedSemitones))
  if (target.accidental !== fix) throw new Error('The sign worked out by counting disagrees with the sign worked out from pitch classes')

  const result = transpose(start, interval, direction)
  if (result.letter !== target.letter || result.accidental !== target.accidental) {
    throw new Error(`Build ${shortName} ${direction} from ${startName}: long-hand ${noteLabel(target)}, engine ${noteLabel(result)}`)
  }
  const [low, high] = direction === 'up' ? [start, result] : [result, start]
  const back = intervalBetween(low, high)
  if (intervalShortName(back.interval) !== shortName) throw new Error('Counting back does not give the interval we started with')

  const startAdjust =
    start.accidental === 0
      ? ''
      : ` ${startName} has ${signWords(start.accidental)}, so the distance to the plain ${letter} is ${adjust > 0 ? 'longer' : 'shorter'} by ${Math.abs(adjust)}: ${walk.total} ${adjust > 0 ? '+' : '−'} ${Math.abs(adjust)} = ${plainDistance} semitones in all.`
  const lowName = noteLabel(low)
  const highName = noteLabel(high)
  const checkLetters = lettersUp(low.letter, number)
  const directionFix =
    fix === 0
      ? `The plain ${letter} is ${semitones(plainDistance)} ${dirWord} ${startName}, and we need ${wantedSemitones}. They match, so ${letter} needs **no sign**. The note is **${noteLabel(target)}**.`
      : direction === 'up'
        ? `The plain ${letter} is ${semitones(plainDistance)} above ${startName}, and we need ${wantedSemitones}. That is ${semitones(Math.abs(fix))} ${fix > 0 ? 'too few' : 'too many'}, so ${fix > 0 ? 'raise' : 'lower'} ${letter} by ${semitones(Math.abs(fix))}: it needs **${signWords(fix)}**. The note is **${noteLabel(target)}**.`
        : `The plain ${letter} is ${semitones(plainDistance)} below ${startName}, and we need ${wantedSemitones}. That is ${semitones(Math.abs(fix))} ${fix > 0 ? 'too far down' : 'not far enough down'}, so ${fix > 0 ? 'raise' : 'lower'} ${letter} by ${semitones(Math.abs(fix))}: it needs **${signWords(fix)}**. The note is **${noteLabel(target)}**.`

  const steps: WorkedStep[] = [
    {
      text: `Look up the interval. From the table, ${article} ${name} is **${number} letter names** and **${wantedSemitones} semitones**. We start on **${startName}** and go **${direction}**.`,
      staff: notesOnStaff(clef, [start]),
    },
    {
      text: `**Step 1: the letter.** Count ${number} letter names ${direction}, counting ${startName}'s letter as 1: ${letterList.join(', ')}. The letter of the new note is **${letter}**.`,
    },
    {
      text: `**Step 2: the semitones.** Walk ${direction} along the plain letters (E to F and B to C are 1 semitone, every other neighbouring pair is 2): ${walk.text}. That is ${walk.total}.${startAdjust}`,
    },
    { text: `**Step 3: fix the sign.** ${directionFix}` },
    {
      text: `Write the answer: ${article} ${name} ${dirWord} ${startName} is **${noteLabel(target)}**. Here are the two notes on the staff, with the sound.`,
      staff: notesOnStaff(clef, [start, result]),
      listen: listenMelody(`Hear ${startName} then ${noteLabel(target)}`, [start, result]),
    },
    {
      text: `Check by counting back. From ${lowName} up to ${highName} the letters are ${checkLetters.join(', ')}: ${number} letter names ✓. The semitones are ${midiNumber(high) - midiNumber(low)} ✓. That is ${article} ${name}, as asked.`,
    },
  ]
  return {
    title: `Build ${article} ${name} ${dirWord} ${startName}`,
    task: `What note is ${article} ${name} ${dirWord} ${startName}?`,
    steps,
    answer: `${article === 'an' ? 'An' : 'A'} ${name} ${dirWord} ${startName} is ${noteLabel(target)}.`,
  }
}

/** Invert an interval: the lower note goes up an octave. The number and the size are worked out by the rules, and checked against the engine. */
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
  const art = (s: string) => (/^[aeiou]/.test(s) ? 'an' : 'a')
  const letters = lettersUp(upper.letter, newNumber)
  const walk = walkUp(upper.letter, newNumber - 1)
  if (lower.accidental === 0 && upper.accidental === 0 && walk.total !== newSize) throw new Error('Counting the inverted interval does not give 12 minus the original')
  return {
    title: `Invert ${art(name)} ${name}`,
    task: `Invert the ${name} from ${lowerName} up to ${upperName}. What interval do you get?`,
    steps: [
      { text: `Start with the interval: ${lowerName} up to ${upperName} is ${art(name)} **${name}** (${number} letter names, ${size} semitones).`, staff: notesOnStaff(clef, [lower, upper]) },
      {
        text: `To **invert** it, take the lower note and move it up an **octave**, so that it becomes the upper note. ${lowerName} moves up to the next ${lowerName} above. Now the notes are ${upperName} (lower) and ${lowerName} (upper).`,
        staff: notesOnStaff(clef, [upper, moved]),
      },
      {
        text: `**The number.** Count the letters from ${upper.letter} up to ${moved.letter}: ${letters.join(', ')}. That is **${newNumber}**. (Check: ${number} + ${newNumber} = ${number + newNumber}. The two numbers of an interval and its inversion always add up to 9.)`,
      },
      {
        text: `**The semitones.** An interval and its inversion fill one octave, which is 12 semitones. So the inversion has 12 − ${size} = **${newSize} semitones**.${
          lower.accidental === 0 && upper.accidental === 0
            ? ` (Check by counting up the plain letters: ${walk.text}. That is ${walk.total}.)`
            : ''
        }`,
      },
      { text: `**The quality.** ${lookupSentence(newNumber, newSize)}` },
      {
        text: `Check against the rule: ${quality === 'major' || quality === 'minor' ? 'major and minor swap' : quality === 'perfect' ? 'perfect stays perfect' : 'augmented and diminished swap'}. ${art(name) === 'an' ? 'An' : 'A'} ${name} turns into ${art(newName)} ${newName}. ✓ Here are the inverted notes, with the sound.`,
        listen: listenMelody(`Hear ${upperName} then ${noteLabel(moved)}`, [upper, moved]),
      },
    ],
    answer: `The inversion of ${art(name)} ${name} is ${art(newName)} ${newName} (${shortNameOf(newNumber, newQuality)}).`,
  }
}
