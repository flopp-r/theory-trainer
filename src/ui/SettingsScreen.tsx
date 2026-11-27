import { useEffect, useRef, useState } from 'react'
import { resetHistory } from '../progress/history'
import { resetMastery } from '../progress/mastery'
import { type Theme, setSoundEnabled, setTheme, useSoundEnabled, useTheme } from '../progress/settings'
import { Icon } from './Icon'

const THEME_LABELS: Record<Theme, string> = { auto: 'Automatic', light: 'Light', dark: 'Dark' }

const builtAt = new Date(__BUILD_TIME__).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' })

export function SettingsScreen() {
  const theme = useTheme()
  const soundOn = useSoundEnabled()
  const [confirming, setConfirming] = useState(false)
  const [cleared, setCleared] = useState(false)
  const cancelButton = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (confirming) cancelButton.current?.focus()
  }, [confirming])

  return (
    <main className="screen top">
      <header className="bar">
        <a className="back" href="#/" aria-label="Back to home">
          <Icon name="arrow-left" size={22} />
        </a>
        <h1 className="bar-title">Settings</h1>
      </header>

      <section className="panel">
        <fieldset>
          <legend>Theme</legend>
          <div className="chips">
            {(['auto', 'light', 'dark'] as const).map((t) => (
              <label key={t} className="chip">
                <input type="radio" name="theme" checked={theme === t} onChange={() => setTheme(t)} />
                <span>{THEME_LABELS[t]}</span>
              </label>
            ))}
          </div>
          <p className="hint">Automatic matches your device&rsquo;s light or dark mode.</p>
        </fieldset>
      </section>

      <section className="panel">
        <fieldset>
          <legend>Sound</legend>
          <div className="chips">
            <label className="chip">
              <input type="checkbox" checked={soundOn} onChange={() => setSoundEnabled(!soundOn)} />
              <span>Sound on</span>
            </label>
          </div>
          <p className="hint">Used for ear training and the Listen buttons in the Library.</p>
        </fieldset>
      </section>

      <section className="panel">
        <h2>Your progress</h2>
        <p className="settings-text">
          Your scores, weak spots and any unfinished round are kept on this device only, in this browser. Nothing is sent anywhere.
        </p>
        {cleared ? (
          <p className="settings-text" role="status">
            Progress deleted. The app will start learning your weak spots again from your next answer.
          </p>
        ) : confirming ? (
          <div className="confirm" role="group" aria-label="Delete your progress?">
            <p>
              <strong>Delete your progress?</strong> This removes your scores, weak spots and any unfinished round from this device. It
              cannot be undone.
            </p>
            <div className="confirm-actions">
              <button ref={cancelButton} type="button" className="btn primary" onClick={() => setConfirming(false)}>
                Keep it
              </button>
              <button
                type="button"
                className="btn"
                onClick={() => {
                  resetMastery()
                  resetHistory()
                  setConfirming(false)
                  setCleared(true)
                }}
              >
                Delete progress
              </button>
            </div>
          </div>
        ) : (
          <button type="button" className="btn wide" onClick={() => setConfirming(true)}>
            Reset my progress
          </button>
        )}
      </section>

      <p className="build">Version: {builtAt}</p>
    </main>
  )
}
