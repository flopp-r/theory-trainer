import { useSyncExternalStore } from 'react'
import { getLastSetup, getSessions } from '../progress/history'
import { type AreaRecord, MIN_AREA_ANSWERS, getAreas, recentAccuracy, subscribeMastery } from '../progress/mastery'
import { currentFocus } from '../progress/selection'
import { GENERATORS, type QuestionType, TOPICS } from '../questions'
import { Icon } from './Icon'
import {
  DEFAULT_PRACTICE_CONFIG,
  describeSetup,
  parsePracticeConfig,
  practiceConfigToQuery,
  presetFor,
  questionTypeLabel,
  reviewConfig,
} from './practice/practiceConfig'

/** A word for how an area is going, from its recent answers. */
export function areaStatus(area: AreaRecord): string {
  const accuracy = recentAccuracy(area)
  if (accuracy === null || area.recent.length < MIN_AREA_ANSWERS) return 'Too early to tell'
  if (accuracy >= 0.85) return 'Strong'
  if (accuracy >= 0.6) return 'Getting there'
  return 'Needs work'
}

const isType = (type: string): type is QuestionType => GENERATORS.some((g) => g.type === type)
const dateFormat = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short' })

function setupName(query: string): string {
  const config = parsePracticeConfig(new URLSearchParams(query))
  return presetFor(config)?.label ?? describeSetup(config)
}

/** Re-render when what the app has learned changes (for example after a reset). */
function useMasteryVersion(): number {
  const version = () => getAreas().length + getSessions().length
  return useSyncExternalStore(subscribeMastery, version, version)
}

export function ProgressScreen() {
  useMasteryVersion()
  const areas = getAreas().filter((a) => isType(a.type))
  const sessions = getSessions()
  const focus = currentFocus()
  const last = getLastSetup()
  const base = last ? parsePracticeConfig(new URLSearchParams(last)) : DEFAULT_PRACTICE_CONFIG
  const review = reviewConfig(focus, base)
  const answered = areas.reduce((n, a) => n + a.answered, 0)
  const right = areas.reduce((n, a) => n + a.correct, 0)

  /** Practise one area, in the clefs and at the level last used. */
  const practiseHref = (area: AreaRecord) => {
    const topic = GENERATORS.find((g) => g.type === area.type)!.topic
    return `#/practice/play?${practiceConfigToQuery({ ...base, topics: [topic], types: [area.type as QuestionType], review: false })}`
  }

  return (
    <main className="screen top">
      <header className="bar">
        <a className="back" href="#/" aria-label="Back to home">
          <Icon name="arrow-left" size={22} />
        </a>
        <h1 className="bar-title">Your progress</h1>
      </header>

      {areas.length === 0 ? (
        <section className="panel">
          <p className="settings-text">
            Nothing yet. Answer some questions and this page shows how each kind of question is going, and what is due for review.
          </p>
          <a className="btn primary wide" href="#/practice">
            Choose what to practise
          </a>
        </section>
      ) : (
        <>
          <section className="panel progress-summary">
            <div>
              <p className="stat">{focus.due.length}</p>
              <p className="stat-label">due for review</p>
            </div>
            <div>
              <p className="stat">{answered}</p>
              <p className="stat-label">questions answered</p>
            </div>
            <div>
              <p className="stat">{answered === 0 ? '–' : `${Math.round((right / answered) * 100)}%`}</p>
              <p className="stat-label">right overall</p>
            </div>
          </section>

          {review && (
            <a className="btn primary wide stack" href={`#/practice/play?${practiceConfigToQuery(review)}`}>
              <span>Revise your weak spots</span>
              <span className="sub">{focus.due.length > 0 ? `${focus.due.length} due for review` : 'Your weakest areas'}</span>
            </a>
          )}

          {focus.due.length > 0 && (
            <section className="panel">
              <h2>Due for review</h2>
              <p className="settings-text">
                Questions you have missed come back after a growing gap: straight away, then after 1, 3, 7 and 14 days. A right answer moves
                one on to the next gap; a miss starts it again.
              </p>
              <ul className="rows">
                {focus.due.slice(0, 8).map((item) => (
                  <li key={item.id}>
                    <span>{item.label}</span>
                    <span>{isType(item.type) ? questionTypeLabel(item.type) : ''}</span>
                  </li>
                ))}
              </ul>
              {focus.due.length > 8 && <p className="hint">and {focus.due.length - 8} more</p>}
            </section>
          )}

          {TOPICS.map((topic) => {
            const inTopic = areas
              .filter((a) => a.topic === topic.id)
              .sort((a, b) => (recentAccuracy(a) ?? 1) - (recentAccuracy(b) ?? 1))
            if (inTopic.length === 0) return null
            return (
              <section key={topic.id} className="panel">
                <h2>{topic.label}</h2>
                <ul className="areas">
                  {inTopic.map((area) => {
                    const accuracy = recentAccuracy(area) ?? 0
                    return (
                      <li key={area.type}>
                        <a className="area" href={practiseHref(area)}>
                          <span className="area-name">{questionTypeLabel(area.type as QuestionType)}</span>
                          <span className="area-detail">
                            {area.recent.filter(Boolean).length} of the last {area.recent.length} right · {areaStatus(area)}
                          </span>
                          <span className="area-bar" aria-hidden="true">
                            <span style={{ transform: `scaleX(${accuracy})` }} />
                          </span>
                        </a>
                      </li>
                    )
                  })}
                </ul>
                <p className="hint">Tap an area to practise just that.</p>
              </section>
            )
          })}

          {sessions.length > 0 && (
            <section className="panel">
              <h2>Recent rounds</h2>
              <ul className="rows">
                {[...sessions]
                  .reverse()
                  .slice(0, 5)
                  .map((s) => (
                    <li key={s.at}>
                      <span>
                        {dateFormat.format(s.at)} · {setupName(s.setup)}
                      </span>
                      <span>
                        {s.correct} / {s.total}
                      </span>
                    </li>
                  ))}
              </ul>
            </section>
          )}
        </>
      )}
    </main>
  )
}
