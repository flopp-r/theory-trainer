import type { Choice, ChoiceLayout } from '../../questions/types'

export function ChoiceButtons({
  choices,
  layout,
  correct,
  chosen,
  waiting = false,
  onChoose,
}: {
  choices: readonly Choice[]
  layout: ChoiceLayout
  correct: string
  chosen: string | null
  /** True while the picture is still being drawn: taps are ignored, and the buttons show it after a moment. */
  waiting?: boolean
  onChoose: (id: string) => void
}) {
  const answered = chosen !== null
  return (
    <div className={`choices ${layout}${waiting ? ' waiting' : ''}`} role="group" aria-label="Answers" aria-busy={waiting}>
      {choices.map((choice, index) => {
        const state = !answered ? '' : choice.id === correct ? 'right' : choice.id === chosen ? 'wrong' : 'dim'
        return (
          <button key={choice.id} type="button" className={`choice ${state}`} disabled={answered} onClick={() => onChoose(choice.id)}>
            {layout !== 'letters' && <span className="choice-number">{index + 1}</span>}
            <span className="choice-label">{choice.label}</span>
            {/* The colours say which is right; this says it to screen readers too. */}
            {state === 'right' && <span className="sr-only">{choice.id === chosen ? ' (your answer, correct)' : ' (the correct answer)'}</span>}
            {state === 'wrong' && <span className="sr-only"> (your answer, wrong)</span>}
          </button>
        )
      })}
      {!answered && (
        <p className="key-hint">
          Keyboard: press {layout === 'letters' ? 'A to G' : `1 to ${choices.length}`} to answer, then Enter for the next question.
        </p>
      )}
    </div>
  )
}
