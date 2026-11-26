import type { Choice, ChoiceLayout } from '../../questions/types'

export function ChoiceButtons({
  choices,
  layout,
  correct,
  chosen,
  onChoose,
}: {
  choices: readonly Choice[]
  layout: ChoiceLayout
  correct: string
  chosen: string | null
  onChoose: (id: string) => void
}) {
  const answered = chosen !== null
  return (
    <div className={`choices ${layout}`} role="group" aria-label="Answers">
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
