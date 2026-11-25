import { clefCompareGenerator, noteAccidentalGenerator, placeNoteGenerator } from './notes'
import { noteNameGenerator } from './noteName'
import { noteBeatsGenerator, noteValueGenerator, restValueGenerator, timeSigBeatsGenerator, timeSigTypeGenerator } from './rhythm'
import type { Question, QuestionContext, QuestionGenerator, Topic } from './types'

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
]

export function generatorsForTopics(topics: readonly Topic[]): QuestionGenerator[] {
  return GENERATORS.filter((g) => topics.includes(g.topic))
}

/**
 * One random question from the chosen topics. Each topic is equally likely, then each question type
 * within it. Tries a few times not to repeat the previous item.
 */
export function generateQuestion(context: QuestionContext, topics: readonly Topic[]): Question {
  const available = topics.filter((t) => GENERATORS.some((g) => g.topic === t))
  if (available.length === 0) throw new RangeError('Choose at least one topic that has questions')
  let question: Question | null = null
  for (let attempt = 0; attempt < 10; attempt++) {
    const topic = context.rng.pick(available)
    const generator = context.rng.pick(GENERATORS.filter((g) => g.topic === topic))
    question = generator.generate(context)
    if (question.id !== context.avoidItemId) return question
  }
  if (!question) throw new Error('No question was generated')
  return question
}
