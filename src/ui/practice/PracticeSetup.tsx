import { useState } from 'react'
import { VOCABULARY } from '../../content/vocabulary'
import { rememberSetup } from '../../progress/history'
import { setSoundEnabled, useSoundEnabled } from '../../progress/settings'
import { DIFFICULTY_LABELS, type Difficulty, type Topic, TOPICS } from '../../questions/types'
import { CLEF_NAMES, type ClefName } from '../../theory'
import { PRESETS, type PracticeConfig, TOPICS_USING_CLEFS, TOPIC_GROUPS, describeSetup, practiceConfigToQuery, presetFor } from './practiceConfig'
import { Icon } from '../Icon'

const CLEF_TITLES: Record<ClefName, string> = { treble: 'Treble', bass: 'Bass', alto: 'Alto', tenor: 'Tenor' }
const LEDGER_OPTIONS = [
  { value: 0, label: 'None' },
  { value: 1, label: 'Up to 1' },
  { value: 2, label: 'Up to 2' },
  { value: 3, label: 'Up to 3' },
]
const LEVELS: Difficulty[] = [1, 2, 3]
const ALL_TOPICS: Topic[] = TOPICS.map((t) => t.id)

export function PracticeSetup({ initial, customise }: { initial: PracticeConfig; customise: boolean }) {
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
    // None picked means every category.
    setVocab((current) => (current.includes(category) ? current.filter((c) => c !== category) : VOCABULARY.map((v) => v.category).filter((c) => c === category || current.includes(c))))
  }

  const soundOn = useSoundEnabled()
  const allSelected = topics.length === ALL_TOPICS.length
  const showClefs = topics.some((t) => TOPICS_USING_CLEFS.includes(t))
  const showLedger = topics.includes('notes')
  const current: PracticeConfig = { topics, clefs, maxLedgerLines: ledger, difficulty: level, vocabCategories: vocab }
  const setup = practiceConfigToQuery(current)
  const onlyTopic = topics.length === 1 ? TOPICS.find((t) => t.id === topics[0]) : undefined
  const preset = presetFor(current)

  function choosePreset(config: PracticeConfig) {
    setTopics(config.topics)
    setClefs(config.clefs)
    setLedger(config.maxLedgerLines)
    setLevel(config.difficulty)
    setVocab(config.vocabCategories)
  }

  return (
    <main className="screen top has-start">
      <header className="bar">
        <a className="back" href="#/" aria-label="Back to home">
          <Icon name="arrow-left" size={22} />
        </a>
        <h1 className="bar-title">Practice</h1>
      </header>

      <fieldset className="panel presets">
        <legend className="panel-title">What to practise</legend>
        {PRESETS.map((p) => (
          <label key={p.id} className="preset">
            <input type="radio" name="preset" checked={preset?.id === p.id} onChange={() => choosePreset(p.config)} />
            <span>
              <strong>{p.label}</strong>
              <small>{p.blurb}</small>
            </span>
          </label>
        ))}
      </fieldset>

      <details className="panel disclosure" open={customise}>
        <summary>{preset ? 'Customise' : 'Customise (your own mix)'}</summary>

        <h2>Topics</h2>
        <div className="chips">
          <button type="button" className={`chip-button${allSelected ? ' on' : ''}`} aria-pressed={allSelected} onClick={() => setTopics(allSelected ? [topics[0] ?? 'notes'] : ALL_TOPICS)}>
            Everything
          </button>
        </div>
        {TOPIC_GROUPS.map((group) => (
          <fieldset key={group.label} className="topic-group">
            <legend>{group.label}</legend>
            <div className="chips">
              {group.topics.map((id) => (
                <label key={id} className="chip">
                  <input type="checkbox" checked={topics.includes(id)} onChange={() => toggleTopic(id)} />
                  <span>{TOPICS.find((t) => t.id === id)?.label ?? id}</span>
                </label>
              ))}
            </div>
          </fieldset>
        ))}
        <p className="hint">{onlyTopic ? onlyTopic.summary : `${topics.length} topics selected`}</p>

        <h2>Level</h2>
        <div className="chips">
          {LEVELS.map((l) => (
            <label key={l} className="chip">
              <input type="radio" name="level" checked={level === l} onChange={() => setLevel(l)} />
              <span>{DIFFICULTY_LABELS[l]}</span>
            </label>
          ))}
        </div>

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

        {topics.includes('ear') && (
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
        )}

        {topics.includes('vocabulary') && (
          <fieldset>
            <legend>Vocabulary categories</legend>
            <div className="chips">
              <button type="button" className={`chip-button${vocab.length === 0 ? ' on' : ''}`} aria-pressed={vocab.length === 0} onClick={() => setVocab([])}>
                All categories
              </button>
              {VOCABULARY.map((c) => (
                <label key={c.category} className="chip">
                  <input type="checkbox" checked={vocab.includes(c.category)} onChange={() => toggleVocab(c.category)} />
                  <span>{c.label.replace(/ \(.*\)$/, '')}</span>
                </label>
              ))}
            </div>
            <p className="hint">Pick specific categories to narrow it down.</p>
          </fieldset>
        )}
      </details>

      <div className="start-bar">
        <a className="btn primary wide stack" href={`#/practice/play?${setup}`} onClick={() => rememberSetup(setup)}>
          <span>Start</span>
          <span className="sub">{preset ? preset.label : describeSetup(current)}</span>
        </a>
      </div>
    </main>
  )
}
