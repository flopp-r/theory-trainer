import { GENERATORS, type Question, type QuestionContext, type QuestionType, type Topic, generateQuestion } from '../questions'
import { type AreaRecord, type ItemRecord, dueItems, weakAreas, weakness } from './mastery'

/** Share of questions in a normal round that go to a due item or a weak area, when there is one. */
export const NUDGE_SHARE = 0.5
/** How many fresh questions to try when looking for one exact due item. */
const CANDIDATES = 60

/** What spaced repetition knows right now: items due for review and weak areas. */
export interface Focus {
  readonly due: readonly ItemRecord[]
  readonly weak: readonly AreaRecord[]
}

export function currentFocus(now = Date.now()): Focus {
  return { due: dueItems(now), weak: weakAreas() }
}

const isType = (type: string): type is QuestionType => GENERATORS.some((g) => g.type === type)

/** The question types a round may ask. */
function allowedTypes(topics: readonly Topic[], types: readonly QuestionType[] | undefined): QuestionType[] {
  return GENERATORS.filter((g) => topics.includes(g.topic) && (!types || types.length === 0 || types.includes(g.type))).map((g) => g.type)
}

/**
 * Questions are made up fresh each time, so an exact item cannot be asked for directly. Instead, make up
 * questions of the item's type until one is the item. If it does not come up, ask the same type anyway:
 * that is still practice on the weak area.
 */
function askItem(context: QuestionContext, item: ItemRecord & { type: QuestionType }): Question {
  const topic = GENERATORS.find((g) => g.type === item.type)!.topic
  let first: Question | null = null
  for (let i = 0; i < CANDIDATES; i++) {
    const q = generateQuestion(context, [topic], [item.type])
    if (q.id === item.id) return q
    first ??= q
  }
  return first!
}

/** Pick an area, more often the weaker it is. */
function pickWeighted(areas: readonly AreaRecord[], random: number): AreaRecord {
  const total = areas.reduce((sum, a) => sum + (weakness(a) ?? 0), 0)
  let target = random * total
  for (const a of areas) {
    target -= weakness(a) ?? 0
    if (target <= 0) return a
  }
  return areas[areas.length - 1]!
}

/**
 * The next question. With chance `share`, it goes to a due item in this round's topics (the longest overdue
 * first), or failing that to a weak area (weaker areas more often). Otherwise it is an ordinary random question.
 * A review round uses share 1; a normal round uses NUDGE_SHARE.
 */
export function pickQuestion(
  context: QuestionContext,
  topics: readonly Topic[],
  types: readonly QuestionType[] | undefined,
  focus: Focus,
  share: number,
): Question {
  if (context.rng.next() >= share) return generateQuestion(context, topics, types)
  const allowed = allowedTypes(topics, types)
  const due = focus.due.filter((i): i is ItemRecord & { type: QuestionType } => isType(i.type) && allowed.includes(i.type) && i.id !== context.avoidItemId)
  if (due.length > 0) {
    // Mostly the longest overdue, with a little variety among the first few.
    const item = due[Math.floor(context.rng.next() * Math.min(3, due.length))]!
    return askItem(context, item)
  }
  const weak = focus.weak.filter((a) => isType(a.type) && allowed.includes(a.type as QuestionType))
  if (weak.length > 0) {
    const area = pickWeighted(weak, context.rng.next())
    const topic = GENERATORS.find((g) => g.type === area.type)!.topic
    return generateQuestion(context, [topic], [area.type as QuestionType])
  }
  return generateQuestion(context, topics, types)
}

/** Topics and question types a review round should cover: those of the due items and weak areas. */
export function reviewScope(focus: Focus): { topics: Topic[]; types: QuestionType[] } {
  const types = [...new Set([...focus.due.map((i) => i.type), ...focus.weak.map((a) => a.type)])].filter(isType)
  const topics = [...new Set(types.map((t) => GENERATORS.find((g) => g.type === t)!.topic))]
  return { topics, types }
}
