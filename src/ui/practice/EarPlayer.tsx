import { useCallback, useEffect, useRef, useState } from 'react'
import { type AudioSpec, getAudioEngine } from '../../audio'
import { setSoundEnabled, useSoundEnabled } from '../../progress/settings'

type Status = 'idle' | 'playing' | 'unavailable'

/**
 * The Play button for a listening question. It tries to play once when the question appears
 * (browsers only allow that after you have tapped something in the app, which you have by now).
 * If sound is off, tapping the button turns it on and plays.
 */
export function EarPlayer({ spec, onFirstFinished }: { spec: AudioSpec; onFirstFinished: () => void }) {
  const soundOn = useSoundEnabled()
  const [status, setStatus] = useState<Status>('idle')
  const [played, setPlayed] = useState(false)
  const finishedOnce = useRef(false)
  const alive = useRef(true)

  const play = useCallback(async () => {
    const engine = getAudioEngine()
    if (!engine.available) {
      setStatus('unavailable')
      if (!finishedOnce.current) {
        finishedOnce.current = true
        onFirstFinished()
      }
      return
    }
    setStatus('playing')
    const ok = await engine.unlock()
    if (!alive.current) return
    if (!ok) {
      setStatus('idle')
      return
    }
    await engine.play(spec)
    if (!alive.current) return
    setStatus('idle')
    setPlayed(true)
    // The answer timer starts when the sound has finished the first time, so listening time does not count.
    if (!finishedOnce.current) {
      finishedOnce.current = true
      onFirstFinished()
    }
  }, [spec, onFirstFinished])

  // Try to play as soon as the question appears; stop when it goes away.
  useEffect(() => {
    alive.current = true
    if (getAudioEngine().available && soundOn) void play()
    else if (!getAudioEngine().available) void play()
    return () => {
      alive.current = false
      getAudioEngine().stop()
    }
    // Only when the question (spec) changes.
  }, [spec]) // eslint-disable-line

  if (status === 'unavailable') {
    return (
      <p className="ear-message" role="alert">
        This device cannot play sound, so listening questions cannot be answered here.
      </p>
    )
  }

  const label = status === 'playing' ? 'Playing…' : !soundOn ? 'Sound is off. Tap to turn it on and play' : played ? '▶ Play again' : '▶ Play'
  return (
    <div className="ear-player">
      <button
        type="button"
        className="btn play"
        disabled={status === 'playing'}
        onClick={() => {
          if (!soundOn) setSoundEnabled(true)
          void play()
        }}
      >
        {label}
      </button>
    </div>
  )
}

/** A small speaker switch for the session bar. */
export function SoundSwitch() {
  const soundOn = useSoundEnabled()
  return (
    <button
      type="button"
      className="btn small icon"
      aria-pressed={soundOn}
      aria-label={soundOn ? 'Sound is on. Tap to turn it off.' : 'Sound is off. Tap to turn it on.'}
      onClick={() => {
        if (soundOn) getAudioEngine().stop()
        setSoundEnabled(!soundOn)
      }}
    >
      {soundOn ? '🔊' : '🔇'}
    </button>
  )
}
