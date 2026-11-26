import { clefCompareGenerator, noteAccidentalGenerator, placeNoteGenerator } from './notes'
import { cadenceByNameGenerator, cadenceOnStaffGenerator } from './cadences'
import { chordNotesGenerator, chordSymbolGenerator, inversionGenerator, romanNumeralGenerator, seventhOnStaffGenerator, triadOnStaffGenerator } from './chords'
import { earCadenceGenerator, earChordQualityGenerator, earIntervalGenerator, earInversionGenerator } from './ear'
import { intervalAboveGenerator, intervalOnStaffGenerator } from './intervals'
import { keyFromSignatureGenerator, relativeKeyGenerator, signatureFromKeyGenerator } from './keys'
import { noteNameGenerator } from './noteName'
import { vocabMeaningGenerator, vocabTermGenerator } from './vocabulary'
import { scaleDegreeGenerator, scaleSpellingGenerator } from './scales'
import { noteBeatsGenerator, noteValueGenerator, restValueGenerator, timeSigBeatsGenerator, timeSigTypeGenerator } from './rhythm'
import type { Question, QuestionContext, QuestionGenerator, QuestionType, Topic } from './types'

/** Every question type the app can ask. Each generator lives in its own file. */
export const GENERATORS: readonly QuestionGenerator[] = [
  noteNameGenerator,
  noteAccidentalGenerator,
  clefCompareGenerator,
  placeNoteGenerator,
  noteValueGenerator,
  restValueGenerator,
  noteBeatsGenerator,
  timeSigBeatsGenerator,
  timeSigTypeGenerator,
  keyFromSignatureGenerator,
  signatureFromKeyGenerator,
  relativeKeyGenerator,
  scaleSpellingGenerator,
  scaleDegreeGenerator,
  intervalOnStaffGenerator,
  intervalAboveGenerator,
  triadOnStaffGenerator,
  seventhOnStaffGenerator,
  chordNotesGenerator,
  chordSymbolGenerator,
  inversionGenerator,
  romanNumeralGenerator,
  cadenceOnStaffGenerator,
  cadenceByNameGenerator,
  vocabTermGenerator,
  vocabMeaningGenerator,
  earChordQualityGenerator,
  earIntervalGenerator,
  earCadenceGenerator,
  earInversionGenerator,
]

export function generatorsForTopics(topics: readonly Topic[]): QuestionGenerator[] {
  return GENERATORS.filter((g) => topics.includes(g.topic))
}

export function generatorFor(type: QuestionType): QuestionGenerator | undefined {
  return GENERATORS.find((g) => g.type === type)
}

/**
 * One random question from the chosen topics. Each topic is equally likely, then each question type
 * within it. Tries a few times not to repeat the previous item.
 * `types`, when given and not empty, narrows it to those question types (used to practise one weak area).
 */
export function generateQuestion(context: QuestionContext, topics: readonly Topic[], types?: readonly QuestionType[]): Question {
  const allowed = (g: QuestionGenerator) => topics.includes(g.topic) && (!types || types.length === 0 || types.includes(g.type))
  const available = topics.filter((t) => GENERATORS.some((g) => g.topic === t && allowed(g)))
  if (available.length === 0) throw new RangeError('Choose at least one topic that has questions')
  let question: Question | null = null
  for (let attempt = 0; attempt < 10; attempt++) {
    const topic = context.rng.pick(available)
    const generator = context.rng.pick(GENERATORS.filter((g) => g.topic === topic && allowed(g)))
    question = generator.generate(context)
    if (question.id !== context.avoidItemId) return question
  }
  if (!question) throw new Error('No question was generated')
  return question
}
