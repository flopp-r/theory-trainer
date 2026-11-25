import { useCallback, useEffect, useRef, useState } from 'react'
import { type Question, createRng, generateNoteNameQuestion, randomSeed } from '../../questions'
import { type AnswerResult } from '../../progress/sessionSummary'
import { StaffView } from '../staff/StaffView'
import { type PracticeConfig, practiceConfigToQuery } from './practiceConfig'
import { SessionSummaryView } from './SessionSummaryView'

/** Restarting swaps the key, which gives a fresh random sequence. */
export function PracticeSession({ config }: { config: PracticeConfig }) {
  const [run, setRun] = useState(0)
  return <PracticeRun key={run} config={config} onRestart={() => setRun((n) => n + 1)} />
}

function PracticeRun({ config, onRestart }: { config: PracticeConfig; onRestart: () => void }) {
  const [start] = useState(() => {
    const rng = createRng(randomSeed())
    return { rng, first: generateNoteNameQuestion(rng, config) }
  })
  const [question, setQuestion] = useState<Question>(start.first)
  const [chosen, setChosen] = useState<string | null>(null)
  const [results, setResults] = useState<AnswerResult[]>([])
  const [finished, setFinished] = useState(false)
  // Each question gets a brand-new staff, so it is always drawn and the old one never lingers.
  const [questionNumber, setQuestionNumber] = useState(0)
  const shownAt = useRef<number | null>(null)
  const nextButton = useRef<HTMLButtonElement>(null)

  const answered = chosen !== null
  const correctCount = results.filter((r) => r.correct).length

  const choose = useCallback(
    (id: string) => {
      if (chosen !== null || shownAt.current === null) return
      const ms = Math.round(performance.now() - shownAt.current)
      setChosen(id)
      setResults((r) => [
        ...r,
        { itemId: question.id, itemLabel: question.itemLabel, category: question.category, correct: id === question.correct, ms },
      ])
    },
    [chosen, question],
  )

  const next = useCallback(() => {
    shownAt.current = null // restarted when the new staff has been drawn
    setQuestion((q) => generateNoteNameQuestion(start.rng, { ...config, avoidItemId: q.id }))
    setChosen(null)
    setQuestionNumber((n) => n + 1)
  }, [config, start.rng])

  // After answering, move focus to "Next" so Enter carries on.
  useEffect(() => {
    if (answered) nextButton.current?.focus()
  }, [answered])

  // Keyboard: A-G to answer, Enter to continue.
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.ctrlKey || event.metaKey || event.altKey) return
      const key = event.key.toUpperCase()
      if (!answered && /^[A-G]$/.test(key)) {
        event.preventDefault()
        choose(key)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [answered, choose])

  if (finished) {
    return <SessionSummaryView results={results} setupQuery={practiceConfigToQuery(config)} onAgain={onRestart} />
  }

  const notation = question.notation
  const correct = chosen === question.correct

  return (
    <main className="screen top session">
      <header className="bar">
        <a className="back" href={`#/practice?${practiceConfigToQuery(config)}`} aria-label="Back to practice setup">
          ←
        </a>
        <p className="score" aria-live="off">
          {results.length} answered · {correctCount} correct
        </p>
        <button className="btn small" type="button" onClick={() => (results.length > 0 ? setFinished(true) : (window.location.hash = '#/practice'))}>
          Finish
        </button>
      </header>

      <p className="category">{question.category}</p>
      <h1 className="prompt">{question.prompt}</h1>

      {notation && (
        <StaffView
          key={questionNumber}
          clef={notation.clef}
          notes={notation.notes}
          ledgerLines={config.maxLedgerLines}
          onDrawn={() => {
            if (shownAt.current === null) shownAt.current = performance.now()
          }}
        />
      )}

      <div className="choices" role="group" aria-label="Choose the note name">
        {question.input.choices.map((choice) => {
          const state = !answered ? '' : choice.id === question.correct ? 'right' : choice.id === chosen ? 'wrong' : 'dim'
          return (
            <button key={choice.id} type="button" className={`choice ${state}`} disabled={answered} onClick={() => choose(choice.id)}>
              {choice.label}
            </button>
          )
        })}
      </div>

      <div className="feedback-area" role="status" aria-live="polite">
        {answered && (
          <div className={`feedback ${correct ? 'ok' : 'bad'}`}>
            <strong>{correct ? '✓ Correct' : `✗ Not quite. It is ${question.correct}.`}</strong>
            <p>{question.explanation}</p>
          </div>
        )}
      </div>

      <button ref={nextButton} type="button" className="btn primary wide" disabled={!answered} onClick={next}>
        Next
      </button>
    </main>
  )
}
