import { useCallback, useEffect, useRef, useState } from 'react'
import { type AnswerResult } from '../../progress/sessionSummary'
import { type Question, type QuestionContext, createRng, generateQuestion, randomSeed } from '../../questions'
import { StaffStack } from '../staff/StaffStack'
import { ChoiceButtons } from './ChoiceButtons'
import { EarPlayer, SoundSwitch } from './EarPlayer'
import { type PracticeConfig, practiceConfigToQuery } from './practiceConfig'
import { SessionSummaryView } from './SessionSummaryView'
import { TapStaff } from './TapStaff'

/** Restarting swaps the key, which gives a fresh random sequence. */
export function PracticeSession({ config }: { config: PracticeConfig }) {
  const [run, setRun] = useState(0)
  return <PracticeRun key={run} config={config} onRestart={() => setRun((n) => n + 1)} />
}

function PracticeRun({ config, onRestart }: { config: PracticeConfig; onRestart: () => void }) {
  const [start] = useState(() => {
    const rng = createRng(randomSeed())
    const context = (avoidItemId?: string): QuestionContext => ({
      rng,
      clefs: config.clefs,
      difficulty: config.difficulty,
      maxLedgerLines: config.maxLedgerLines,
      vocabCategories: config.vocabCategories,
      avoidItemId,
    })
    return { context, first: generateQuestion(context(), config.topics) }
  })
  const [question, setQuestion] = useState<Question>(start.first)
  const [chosen, setChosen] = useState<string | null>(null)
  const [results, setResults] = useState<AnswerResult[]>([])
  const [finished, setFinished] = useState(false)
  // Each question gets brand-new staves, so they are always drawn and the old ones never linger.
  const [questionNumber, setQuestionNumber] = useState(0)
  const shownAt = useRef<number | null>(null)
  const nextButton = useRef<HTMLButtonElement>(null)

  const answered = chosen !== null
  const correctCount = results.filter((r) => r.correct).length

  const choose = useCallback(
    (id: string) => {
      // Staff questions wait until the staff is drawn. Listening questions can be answered at any time.
      if (chosen !== null || (shownAt.current === null && !question.audio)) return
      const ms = shownAt.current === null ? 0 : Math.round(performance.now() - shownAt.current)
      setChosen(id)
      setResults((r) => [
        ...r,
        { itemId: question.id, itemLabel: question.itemLabel, category: question.category, correct: id === question.correct, ms },
      ])
    },
    [chosen, question],
  )

  const markShown = useCallback(() => {
    if (shownAt.current === null) shownAt.current = performance.now()
  }, [])

  const next = useCallback(() => {
    shownAt.current = null // restarted when the new question has been drawn
    setQuestion((q) => generateQuestion(start.context(q.id), config.topics))
    setChosen(null)
    setQuestionNumber((n) => n + 1)
  }, [config.topics, start])

  // After answering, move focus to "Next" so Enter carries on.
  useEffect(() => {
    if (answered) nextButton.current?.focus()
  }, [answered])

  // Keyboard: A-G (note-name questions) or 1-9 (other multiple choice) to answer.
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.ctrlKey || event.metaKey || event.altKey || answered || question.input.kind !== 'multiple-choice') return
      const { choices, layout } = question.input
      const key = event.key.toUpperCase()
      if (layout === 'letters' && /^[A-G]$/.test(key)) {
        event.preventDefault()
        choose(key)
      } else if (layout !== 'letters' && /^[1-9]$/.test(key)) {
        const choice = choices[Number(key) - 1]
        if (choice) {
          event.preventDefault()
          choose(choice.id)
        }
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [answered, choose, question])

  if (finished) {
    return <SessionSummaryView results={results} setupQuery={practiceConfigToQuery(config)} onAgain={onRestart} />
  }

  const correct = chosen === question.correct
  const input = question.input

  return (
    <main className="screen top session">
      <header className="bar">
        <a className="back" href={`#/practice?${practiceConfigToQuery(config)}`} aria-label="Back to practice setup">
          ←
        </a>
        <p className="score" aria-live="off">
          {results.length} answered · {correctCount} correct
        </p>
        {config.topics.includes('ear') && <SoundSwitch />}
        <button className="btn small" type="button" onClick={() => (results.length > 0 ? setFinished(true) : (window.location.hash = '#/practice'))}>
          Finish
        </button>
      </header>

      <p className="category">{question.category}</p>
      <h1 className="prompt">{question.prompt}</h1>

      {input.kind === 'tap-staff' ? (
        <TapStaff
          key={questionNumber}
          question={question}
          onSubmit={(position) => choose(String(position))}
          onDrawn={markShown}
          submitted={chosen === null ? null : Number(chosen)}
        />
      ) : (
        <>
          {question.notation && (
            <StaffStack key={questionNumber} notation={question.notation} ledgerLines={config.maxLedgerLines} onDrawn={markShown} />
          )}
          {question.audio && <EarPlayer key={questionNumber} spec={question.audio} onFirstFinished={markShown} />}
          {!question.notation && !question.audio && <NoStaff onShown={markShown} key={questionNumber} />}
          <ChoiceButtons choices={input.choices} layout={input.layout} correct={question.correct} chosen={chosen} onChoose={choose} />
        </>
      )}

      <div className="feedback-area" role="status" aria-live="polite">
        {answered && (
          <div className={`feedback ${correct ? 'ok' : 'bad'}`}>
            <strong>{correct ? '✓ Correct' : `✗ Not quite. ${question.answerText}`}</strong>
            <p>{question.explanation}</p>
            {question.reveal && (
              <div className="reveal">
                <p className="reveal-title">What you heard, written down:</p>
                <StaffStack notation={question.reveal} ledgerLines={1} />
              </div>
            )}
          </div>
        )}
      </div>

      <button ref={nextButton} type="button" className="btn primary wide" disabled={!answered} onClick={next}>
        Next
      </button>
    </main>
  )
}

/** Questions without a staff (such as vocabulary) are ready as soon as they appear. */
function NoStaff({ onShown }: { onShown: () => void }) {
  useEffect(onShown, [onShown])
  return null
}
