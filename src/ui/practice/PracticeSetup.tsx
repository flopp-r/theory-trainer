import { useState } from 'react'
import { CLEF_NAMES, type ClefName } from '../../theory'
import { type PracticeConfig, practiceConfigToQuery } from './practiceConfig'

const CLEF_TITLES: Record<ClefName, string> = { treble: 'Treble', bass: 'Bass', alto: 'Alto', tenor: 'Tenor' }
const LEDGER_OPTIONS = [
  { value: 0, label: 'None' },
  { value: 1, label: 'Up to 1' },
  { value: 2, label: 'Up to 2' },
  { value: 3, label: 'Up to 3' },
]

export function PracticeSetup({ initial }: { initial: PracticeConfig }) {
  const [clefs, setClefs] = useState<readonly ClefName[]>(initial.clefs)
  const [ledger, setLedger] = useState(initial.maxLedgerLines)

  function toggle(clef: ClefName) {
    setClefs((current) => {
      if (!current.includes(clef)) return CLEF_NAMES.filter((c) => c === clef || current.includes(c))
      // Always keep at least one clef selected.
      return current.length > 1 ? current.filter((c) => c !== clef) : current
    })
  }

  const start = `#/practice/play?${practiceConfigToQuery({ clefs, maxLedgerLines: ledger })}`

  return (
    <main className="screen top">
      <header className="bar">
        <a className="back" href="#/" aria-label="Back to home">
          ←
        </a>
        <h1 className="bar-title">Practice</h1>
      </header>

      <section className="panel">
        <h2>Note names</h2>

        <fieldset>
          <legend>Clefs</legend>
          <div className="chips">
            {CLEF_NAMES.map((clef) => (
              <label key={clef} className="chip">
                <input type="checkbox" checked={clefs.includes(clef)} onChange={() => toggle(clef)} />
                <span>{CLEF_TITLES[clef]}</span>
              </label>
            ))}
          </div>
          <p className="hint">Pick one or more. Questions are mixed between the clefs you choose.</p>
        </fieldset>

        <fieldset>
          <legend>Ledger lines</legend>
          <div className="chips">
            {LEDGER_OPTIONS.map((option) => (
              <label key={option.value} className="chip">
                <input type="radio" name="ledger" checked={ledger === option.value} onChange={() => setLedger(option.value)} />
                <span>{option.label}</span>
              </label>
            ))}
          </div>
          <p className="hint">Ledger lines are the short extra lines used for notes above or below the staff.</p>
        </fieldset>
      </section>

      <a className="btn primary wide" href={start}>
        Start
      </a>
    </main>
  )
}
