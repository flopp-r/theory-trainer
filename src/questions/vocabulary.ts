import { VOCABULARY, type VocabCategory, type VocabEntry } from '../content/vocabulary'
import { multipleChoice } from './helpers'
import type { Question, QuestionContext, QuestionGenerator, QuestionType } from './types'

/** "Allegro" -> "allegro", "French horn" -> "french-horn". Used in item ids. */
export function slug(term: string): string {
  return term
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/** The categories to draw from: the learner's choice, or all of them if none (or none that exist) were chosen. */
function chosenCategories(ctx: QuestionContext): readonly VocabCategory[] {
  const wanted = ctx.vocabCategories ?? []
  const matching = VOCABULARY.filter((c) => wanted.includes(c.category))
  return matching.length > 0 ? matching : VOCABULARY
}

/** Entries available at a level: Easy uses level 1 only, Medium levels 1-2, Hard everything. */
function poolFor(category: VocabCategory, difficulty: 1 | 2 | 3): VocabEntry[] {
  return category.entries.filter((e) => e.level <= difficulty)
}

function generate(ctx: QuestionContext, direction: 'term' | 'meaning'): Question {
  const { rng } = ctx
  const category = rng.pick(chosenCategories(ctx))
  const pool = poolFor(category, ctx.difficulty)
  const entry = rng.pick(pool)
  // Wrong answers come from other groups, so a near-synonym can never be offered as a wrong answer.
  const others = pool.filter((e) => e.group !== entry.group)
  const isFamily = category.category === 'instruments'
  const type: QuestionType = direction === 'term' ? 'vocab-term' : 'vocab-meaning'

  const correct = direction === 'term' ? entry.meaning : entry.term
  const candidates = others.map((e) => (direction === 'term' ? e.meaning : e.term))
  const longest = Math.max(correct.length, ...candidates.map((c) => c.length))
  const { input } = multipleChoice(rng, correct, candidates, { layout: longest > 28 ? 'list' : 'grid' })

  const prompt =
    direction === 'term'
      ? category.askTerm.replace('{term}', entry.term)
      : category.askMeaning.replace('{meaning}', entry.meaning)
  const mates = category.entries.filter((e) => e.group === entry.group && e.term !== entry.term && e.level <= ctx.difficulty)
  const alsoSee = mates.length > 0 ? ` Similar: ${mates.map((m) => `${m.term} (${m.meaning})`).join('; ')}.` : ''
  const fact = isFamily ? `The ${entry.term} is a ${entry.meaning} instrument.` : `“${entry.term}” means ${entry.meaning}.`

  return {
    id: `${type}:${category.category}:${slug(entry.term)}`,
    type,
    topic: 'vocabulary',
    category: `Vocabulary: ${category.label}`,
    itemLabel: entry.term,
    tags: ['aqa-candidate'],
    prompt,
    notation: null,
    audio: null,
    input,
    correct,
    answerText: direction === 'term' ? (isFamily ? `It is a ${entry.meaning} instrument.` : `It means ${entry.meaning}.`) : `It is “${entry.term}”.`,
    explanation: `${fact}${alsoSee}`,
  }
}

export const vocabTermGenerator: QuestionGenerator = {
  type: 'vocab-term',
  topic: 'vocabulary',
  label: 'What does it mean?',
  generate: (ctx) => generate(ctx, 'term'),
}

export const vocabMeaningGenerator: QuestionGenerator = {
  type: 'vocab-meaning',
  topic: 'vocabulary',
  label: 'Which term?',
  generate: (ctx) => generate(ctx, 'meaning'),
}
