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
          </button>
        )
      })}
    </div>
  )
}
