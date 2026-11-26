import { Suspense, lazy, useState } from 'react'
import { lessonForQuestionType } from '../../content/library'
import { type LibraryLesson } from '../../content/library/types'
import { type SessionRecord, rememberSetup } from '../../progress/history'
import { type AnswerResult, compareWithPrevious, summariseSession, verdict, weakestArea } from '../../progress/sessionSummary'
import { QUESTION_TYPES, type QuestionType, TOPICS } from '../../questions/types'
import { type PracticeConfig, practiceConfigToQuery, questionTypeLabel } from './practiceConfig'

const LessonSheet = lazy(() => import('../library/LessonSheet'))

function isQuestionType(type: string | undefined): type is QuestionType {
  return type !== undefined && (QUESTION_TYPES as readonly string[]).includes(type)
}

function timesMissed(misses: number): string {
  return misses === 1 ? '' : misses === 2 ? ' (twice)' : ` (${misses} times)`
}

interface RevisitGroup {
  readonly lesson: LibraryLesson | undefined
  readonly items: { label: string; misses: number }[]
}

/** Wrong answers grouped by the lesson that teaches them, in the order first missed. */
function revisitGroups(results: readonly AnswerResult[]): RevisitGroup[] {
  const groups = new Map<string, { lesson: LibraryLesson | undefined; items: Map<string, { label: string; misses: number }> }>()
  for (const r of results) {
    if (r.correct) continue
    const lesson = isQuestionType(r.type) ? lessonForQuestionType(r.type) : undefined
    const key = lesson?.id ?? ''
    const group = groups.get(key) ?? { lesson, items: new Map() }
    const item = group.items.get(r.itemId) ?? { label: r.itemLabel, misses: 0 }
    item.misses += 1
    group.items.set(r.itemId, item)
    groups.set(key, group)
  }
  return [...groups.values()].map((g) => ({ lesson: g.lesson, items: [...g.items.values()] }))
}

export function SessionSummaryView({
  results,
  config,
  previous,
  onAgain,
}: {
  results: readonly AnswerResult[]
  config: PracticeConfig
  /** The last round on this same setup, from before this one. */
  previous: SessionRecord | null
  onAgain: () => void
}) {
  const [openLesson, setOpenLesson] = useState<string | null>(null)
  const summary = summariseSession(results)
  const comparison = compareWithPrevious(summary, previous)
  const setup = practiceConfigToQuery(config)

  // The next round: the one question type missed most, if that is narrower than this round was.
  const weak = weakestArea(results)
  const weakTopic = weak ? TOPICS.find((t) => t.id === weak.topic)?.id : undefined
  const weakType = weak && isQuestionType(weak.type) ? weak.type : undefined
  const weakQuery = weakType && weakTopic ? practiceConfigToQuery({ ...config, topics: [weakTopic], types: [weakType] }) : null
  const offerWeak = weak !== null && weakType !== undefined && weakQuery !== null && weakQuery !== setup

  const groups = revisitGroups(results)
  const byAreaWeakestFirst = [...summary.byCategory].sort((a, b) => a.correct / a.total - b.correct / b.total)

  return (
    <main className="screen top">
      <header className="bar">
        <a className="back" href={`#/practice?${setup}`} aria-label="Back to practice setup">
          ←
        </a>
        <h1 className="bar-title">Round summary</h1>
      </header>

      <section className="panel centre">
        <p className="big-score">
          {summary.correct} / {summary.total}
        </p>
        <p className="lede">{verdict(summary)}</p>
        {comparison && <p className="hint-centre">{comparison}</p>}
      </section>

      {offerWeak && (
        <a className="btn primary wide stack" href={`#/practice/play?${weakQuery}`} onClick={() => rememberSetup(weakQuery)}>
          <span>Practise your weakest area</span>
          <span className="sub">
            {questionTypeLabel(weakType)} · {weak.missed} of {weak.total} missed
          </span>
        </a>
      )}
      <button
        type="button"
        className={`btn wide${offerWeak ? '' : ' primary'}`}
        onClick={() => {
          rememberSetup(setup)
          onAgain()
        }}
      >
        Another round
      </button>

      {groups.length > 0 && (
        <section className="panel">
          <h2>To revisit</h2>
          <ul className="revisit">
            {groups.map((g) => (
              <li key={g.lesson?.id ?? 'other'}>
                <p>{g.items.map((i) => `${i.label}${timesMissed(i.misses)}`).join(' · ')}</p>
                {g.lesson && (
                  <button type="button" className="btn small lesson-link" onClick={() => setOpenLesson(g.lesson!.id)}>
                    Read &ldquo;{g.lesson.title}&rdquo;
                  </button>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      {summary.byCategory.length > 1 && (
        <details className="panel disclosure">
          <summary>By area</summary>
          <ul className="rows">
            {byAreaWeakestFirst.map((c) => (
              <li key={c.category}>
                <span>{c.category}</span>
                <span>
                  {c.correct} / {c.total}
                </span>
              </li>
            ))}
          </ul>
        </details>
      )}

      <div className="pair">
        <a className="btn small" href={`#/practice?${setup}`}>
          Change setup
        </a>
        <a className="btn small" href="#/">
          Home
        </a>
      </div>

      {openLesson && (
        <Suspense fallback={null}>
          <LessonSheet id={openLesson} onClose={() => setOpenLesson(null)} />
        </Suspense>
      )}
    </main>
  )
}
