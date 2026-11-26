import { type SessionRecord } from '../../progress/history'
import { type AnswerResult, compareWithPrevious, missedTopics, summariseSession, verdict } from '../../progress/sessionSummary'
import { TOPICS } from '../../questions/types'
import { type PracticeConfig, practiceConfigToQuery } from './practiceConfig'

function percent(value: number | null): string {
  return value === null ? '–' : `${Math.round(value * 100)}%`
}

function seconds(ms: number | null): string {
  return ms === null ? '–' : `${(ms / 1000).toFixed(1)} s`
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
  const summary = summariseSession(results)
  const comparison = compareWithPrevious(summary, previous)

  // Questions are made up fresh each time, so "what you missed" means the topics you got wrong, not the exact questions.
  const missedIds = missedTopics(results)
  const weakTopics = TOPICS.filter((t) => missedIds.includes(t.id))
  const weakConfig = { ...config, topics: weakTopics.map((t) => t.id) }
  const offerWeak = weakTopics.length > 0 && practiceConfigToQuery(weakConfig) !== practiceConfigToQuery(config)

  const again = (
    <button type="button" className={`btn wide${offerWeak ? '' : ' primary'}`} onClick={onAgain}>
      Another round
    </button>
  )

  return (
    <main className="screen top">
      <header className="bar">
        <h1 className="bar-title">Round summary</h1>
      </header>

      <section className="panel centre">
        <p className="big-score">
          {summary.correct} / {summary.total}
        </p>
        <p className="lede">{verdict(summary)}</p>
        {comparison && <p className="hint-centre">{comparison}</p>}
        <p className="hint-centre">
          {percent(summary.accuracy)} correct · {seconds(summary.averageMs)} per question
        </p>
      </section>

      {offerWeak && (
        <a className="btn primary wide stack" href={`#/practice/play?${practiceConfigToQuery(weakConfig)}`}>
          <span>Practise what you missed</span>
          <span className="sub">{weakTopics.map((t) => t.label).join(', ')}</span>
        </a>
      )}
      {again}

      {summary.byCategory.length > 1 && (
        <section className="panel">
          <h2>By area</h2>
          <ul className="rows">
            {summary.byCategory.map((c) => (
              <li key={c.category}>
                <span>{c.category}</span>
                <span>
                  {c.correct} / {c.total}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {summary.missed.length > 0 && (
        <section className="panel">
          <h2>To revisit</h2>
          <ul className="rows">
            {summary.missed.map((m) => (
              <li key={m.itemId}>
                <span>{m.itemLabel}</span>
                <span>{m.misses === 1 ? 'missed once' : `missed ${m.misses} times`}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="pair">
        <a className="btn small" href={`#/practice?${practiceConfigToQuery(config)}`}>
          Change setup
        </a>
        <a className="btn small" href="#/">
          Home
        </a>
      </div>
    </main>
  )
}
