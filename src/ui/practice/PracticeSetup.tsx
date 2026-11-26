import { useState } from 'react'
import { VOCABULARY } from '../../content/vocabulary'
import { DIFFICULTY_LABELS, type Difficulty, type Topic, TOPICS } from '../../questions/types'
import { CLEF_NAMES, type ClefName } from '../../theory'
import { setSoundEnabled, useSoundEnabled } from '../../progress/settings'
import { type PracticeConfig, TOPICS_USING_CLEFS, practiceConfigToQuery } from './practiceConfig'

const CLEF_TITLES: Record<ClefName, string> = { treble: 'Treble', bass: 'Bass', alto: 'Alto', tenor: 'Tenor' }
const LEDGER_OPTIONS = [
  { value: 0, label: 'None' },
  { value: 1, label: 'Up to 1' },
  { value: 2, label: 'Up to 2' },
  { value: 3, label: 'Up to 3' },
]
const LEVELS: Difficulty[] = [1, 2, 3]
const ALL_TOPICS: Topic[] = TOPICS.map((t) => t.id)

export function PracticeSetup({ initial }: { initial: PracticeConfig }) {
  const [topics, setTopics] = useState<readonly Topic[]>(initial.topics)
  const [clefs, setClefs] = useState<readonly ClefName[]>(initial.clefs)
  const [ledger, setLedger] = useState(initial.maxLedgerLines)
  const [level, setLevel] = useState<Difficulty>(initial.difficulty)
  const [vocab, setVocab] = useState<readonly string[]>(initial.vocabCategories)

  function toggleTopic(topic: Topic) {
    setTopics((current) => {
      if (!current.includes(topic)) return ALL_TOPICS.filter((t) => t === topic || current.includes(t))
      // Always keep at least one topic selected.
      return current.length > 1 ? current.filter((t) => t !== topic) : current
    })
  }

  function toggleClef(clef: ClefName) {
    setClefs((current) => {
      if (!current.includes(clef)) return CLEF_NAMES.filter((c) => c === clef || current.includes(c))
      // Always keep at least one clef selected.
      return current.length > 1 ? current.filter((c) => c !== clef) : current
    })
  }

  function toggleVocab(category: string) {
    // None selected means all categories.
    setVocab((current) => (current.includes(category) ? current.filter((c) => c !== category) : VOCABULARY.map((v) => v.category).filter((c) => c === category || current.includes(c))))
  }

  const soundOn = useSoundEnabled()
  const allSelected = topics.length === ALL_TOPICS.length
  const showClefs = topics.some((t) => TOPICS_USING_CLEFS.includes(t))
  const showLedger = topics.includes('notes')
  const start = `#/practice/play?${practiceConfigToQuery({ topics, clefs, maxLedgerLines: ledger, difficulty: level, vocabCategories: vocab })}`

  return (
    <main className="screen top">
      <header className="bar">
        <a className="back" href="#/" aria-label="Back to home">
          ←
        </a>
        <h1 className="bar-title">Practice</h1>
      </header>

      <section className="panel">
        <h2>Topics</h2>
        <div className="chips">
          <button type="button" className={`chip-button${allSelected ? ' on' : ''}`} onClick={() => setTopics(allSelected ? [topics[0] ?? 'notes'] : ALL_TOPICS)}>
            {allSelected ? 'Everything ✓' : 'Everything'}
          </button>
          {TOPICS.map((topic) => (
            <label key={topic.id} className="chip">
              <input type="checkbox" checked={topics.includes(topic.id)} onChange={() => toggleTopic(topic.id)} />
              <span>{topic.label}</span>
            </label>
          ))}
        </div>
        <p className="hint">{topics.map((t) => TOPICS.find((x) => x.id === t)?.summary).join(' · ')}</p>
      </section>

      <section className="panel">
        <h2>Level</h2>
        <div className="chips">
          {LEVELS.map((l) => (
            <label key={l} className="chip">
              <input type="radio" name="level" checked={level === l} onChange={() => setLevel(l)} />
              <span>{DIFFICULTY_LABELS[l]}</span>
            </label>
          ))}
        </div>
      </section>

      {(showClefs || showLedger) && (
        <section className="panel">
          {showClefs && (
            <fieldset>
              <legend>Clefs</legend>
              <div className="chips">
                {CLEF_NAMES.map((clef) => (
                  <label key={clef} className="chip">
                    <input type="checkbox" checked={clefs.includes(clef)} onChange={() => toggleClef(clef)} />
                    <span>{CLEF_TITLES[clef]}</span>
                  </label>
                ))}
              </div>
              <p className="hint">Pick one or more. Questions are mixed between the clefs you choose.</p>
            </fieldset>
          )}
          {showLedger && (
            <fieldset>
              <legend>Ledger lines (note questions)</legend>
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
          )}
        </section>
      )}

      {topics.includes('ear') && (
        <section className="panel">
          <fieldset>
            <legend>Ear training</legend>
            <div className="chips">
              <label className="chip">
                <input type="checkbox" checked={soundOn} onChange={() => setSoundEnabled(!soundOn)} />
                <span>Sound on</span>
              </label>
            </div>
            <p className="hint">Turn your volume up. Headphones help. You can replay each sound as often as you like.</p>
          </fieldset>
        </section>
      )}

      {topics.includes('vocabulary') && (
        <section className="panel">
          <fieldset>
            <legend>Vocabulary categories</legend>
            <div className="chips">
              {VOCABULARY.map((c) => (
                <label key={c.category} className="chip">
                  <input type="checkbox" checked={vocab.includes(c.category)} onChange={() => toggleVocab(c.category)} />
                  <span>{c.label.replace(/ \(.*\)$/, '')}</span>
                </label>
              ))}
            </div>
            <p className="hint">Leave all unticked to use every category.</p>
          </fieldset>
        </section>
      )}

      <a className="btn primary wide" href={start}>
        Start
      </a>
    </main>
  )
}
