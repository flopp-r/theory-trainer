import { type AnswerResult, summariseSession } from '../../progress/sessionSummary'

function percent(value: number | null): string {
  return value === null ? '–' : `${Math.round(value * 100)}%`
}

function seconds(ms: number | null): string {
  return ms === null ? '–' : `${(ms / 1000).toFixed(1)} s`
}

export function SessionSummaryView({
  results,
  setupQuery,
  onAgain,
}: {
  results: readonly AnswerResult[]
  setupQuery: string
  onAgain: () => void
}) {
  const summary = summariseSession(results)
  return (
    <main className="screen top">
      <header className="bar">
        <h1 className="bar-title">Session summary</h1>
      </header>

      <section className="panel centre">
        <p className="big-score">
          {summary.correct} / {summary.total}
        </p>
        <p className="lede">
          {percent(summary.accuracy)} correct · {seconds(summary.averageMs)} per question
        </p>
      </section>

      {summary.byCategory.length > 1 && (
        <section className="panel">
          <h2>By clef</h2>
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
          <h2>Notes to revisit</h2>
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

      <button type="button" className="btn primary wide" onClick={onAgain}>
        Practise again
      </button>
      <a className="btn wide" href={`#/practice?${setupQuery}`}>
        Change setup
      </a>
      <a className="btn wide" href="#/">
        Home
      </a>
    </main>
  )
}
