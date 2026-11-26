import { Suspense, lazy, useCallback, useEffect, useRef, useState } from 'react'
import { lessonForQuestionType } from '../../content/library'
import { type SessionRecord, previousSession, recordSession } from '../../progress/history'
import { type AnswerResult } from '../../progress/sessionSummary'
import { type Question, type QuestionContext, createRng, generateQuestion, randomSeed } from '../../questions'
import { StaffStack } from '../staff/StaffStack'
import { ChoiceButtons } from './ChoiceButtons'
import { EarPlayer, SoundSwitch } from './EarPlayer'
import { type PracticeConfig, ROUND_LENGTH, practiceConfigToQuery } from './practiceConfig'
import { SessionSummaryView } from './SessionSummaryView'
import { TapStaff } from './TapStaff'

const LessonSheet = lazy(() => import('../library/LessonSheet'))

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
    return { context, first: generateQuestion(context(), config.topics, config.types) }
  })
  const [question, setQuestion] = useState<Question>(start.first)
  const [chosen, setChosen] = useState<string | null>(null)
  const [results, setResults] = useState<AnswerResult[]>([])
  const [finished, setFinished] = useState(false)
  const [previous, setPrevious] = useState<SessionRecord | null>(null)
  const [confirmLeave, setConfirmLeave] = useState(false)
  // True once the staff for this question has been drawn. Listening questions can be answered at any time.
  const [drawn, setDrawn] = useState(false)
  const [lessonOpen, setLessonOpen] = useState(false)
  // Each question gets brand-new staves, so they are always drawn and the old ones never linger.
  const [questionNumber, setQuestionNumber] = useState(0)
  const shownAt = useRef<number | null>(null)
  const nextButton = useRef<HTMLButtonElement>(null)
  const keepGoingButton = useRef<HTMLButtonElement>(null)

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
        { itemId: question.id, itemLabel: question.itemLabel, category: question.category, correct: id === question.correct, ms, topic: question.topic, type: question.type },
      ])
    },
    [chosen, question],
  )

  const markShown = useCallback(() => {
    if (shownAt.current === null) shownAt.current = performance.now()
    setDrawn(true)
  }, [])

  const next = useCallback(() => {
    shownAt.current = null // restarted when the new question has been drawn
    setDrawn(false)
    setQuestion((q) => generateQuestion(start.context(q.id), config.topics, config.types))
    setChosen(null)
    setQuestionNumber((n) => n + 1)
  }, [config.topics, config.types, start])

  const setupQuery = practiceConfigToQuery(config)
  const roundDone = results.length >= ROUND_LENGTH

  /** Saves the round, so the next one can be compared with it, and shows the summary. */
  const finishRound = useCallback(() => {
    setPrevious(previousSession(setupQuery))
    recordSession({ at: Date.now(), setup: setupQuery, total: results.length, correct: correctCount })
    setFinished(true)
  }, [correctCount, results.length, setupQuery])

  // Leaving with answers given asks first. Focus goes to the safe choice, and Escape means "keep going".
  useEffect(() => {
    if (!confirmLeave) return
    keepGoingButton.current?.focus()
    function onEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') setConfirmLeave(false)
    }
    window.addEventListener('keydown', onEscape)
    return () => window.removeEventListener('keydown', onEscape)
  }, [confirmLeave])

  // After answering, move focus to "Next" so Enter carries on.
  useEffect(() => {
    if (answered) nextButton.current?.focus()
  }, [answered])

  // Keyboard: A-G (note-name questions) or 1-9 (other multiple choice) to answer.
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.ctrlKey || event.metaKey || event.altKey || answered || confirmLeave || question.input.kind !== 'multiple-choice') return
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
  }, [answered, choose, confirmLeave, question])

  if (finished) {
    return <SessionSummaryView results={results} config={config} previous={previous} onAgain={onRestart} />
  }

  const correct = chosen === question.correct
  const input = question.input
  const lesson = lessonForQuestionType(question.type)

  return (
    <main className="screen top session">
      <header className="bar">
        <a
          className="back"
          href={`#/practice?${setupQuery}`}
          aria-label="Back to practice setup"
          onClick={(event) => {
            if (results.length > 0) {
              event.preventDefault()
              setConfirmLeave(true)
            }
          }}
        >
          ←
        </a>
        <p className="score" aria-live="off">
          <span className="score-word">Question </span>
          {Math.min(answered ? results.length : results.length + 1, ROUND_LENGTH)} of {ROUND_LENGTH}
        </p>
        {config.topics.includes('ear') && <SoundSwitch />}
        <button className="btn small" type="button" onClick={() => (results.length > 0 ? finishRound() : (window.location.hash = `#/practice?${setupQuery}`))}>
          End round
        </button>
      </header>
      <div
        className="progress"
        role="progressbar"
        aria-label="Round progress"
        aria-valuemin={0}
        aria-valuemax={ROUND_LENGTH}
        aria-valuenow={Math.min(results.length, ROUND_LENGTH)}
      >
        <div className="progress-fill" style={{ width: `${(Math.min(results.length, ROUND_LENGTH) / ROUND_LENGTH) * 100}%` }} />
      </div>

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
          <ChoiceButtons
            choices={input.choices}
            layout={input.layout}
            correct={question.correct}
            chosen={chosen}
            waiting={!drawn && !question.audio}
            onChoose={choose}
          />
        </>
      )}

      <div className="feedback-area" role="status" aria-live="polite">
        {answered && (
          <div className={`feedback ${correct ? 'ok' : 'bad'}`}>
            <strong>{correct ? '✓ Correct' : `✗ Not quite. ${question.answerText}`}</strong>
            <p>{question.explanation}</p>
            {lesson && (
              // After a miss the lesson is the next step, so it looks like a button; after a right answer it is only a pointer.
              <button type="button" className={correct ? 'text-button' : 'btn small lesson-link'} onClick={() => setLessonOpen(true)}>
                Read the lesson &ldquo;{lesson.title}&rdquo;
              </button>
            )}
            {question.reveal && (
              <div className="reveal">
                <p className="reveal-title">What you heard, written down:</p>
                <StaffStack notation={question.reveal} ledgerLines={1} />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Kept at the bottom of the screen, so Next never ends up below the fold after a long explanation. */}
      <div className="next-bar">
        {confirmLeave ? (
          <section className="confirm" role="group" aria-label="End this round?">
            <p>
              <strong>End this round?</strong> Your {results.length} {results.length === 1 ? 'answer is' : 'answers are'} saved and you&rsquo;ll see
              how you did.
            </p>
            <div className="confirm-actions">
              <button ref={keepGoingButton} type="button" className="btn primary" onClick={() => setConfirmLeave(false)}>
                Keep going
              </button>
              <button type="button" className="btn" onClick={finishRound}>
                See results
              </button>
            </div>
          </section>
        ) : (
          <button ref={nextButton} type="button" className="btn primary wide" disabled={!answered} onClick={roundDone ? finishRound : next}>
            {roundDone ? 'See results' : 'Next'}
          </button>
        )}
      </div>
      {lessonOpen && lesson && (
        <Suspense fallback={null}>
          <LessonSheet id={lesson.id} onClose={() => setLessonOpen(false)} />
        </Suspense>
      )}
    </main>
  )
}

/** Questions without a staff (such as vocabulary) are ready as soon as they appear. */
function NoStaff({ onShown }: { onShown: () => void }) {
  useEffect(onShown, [onShown])
  return null
}
