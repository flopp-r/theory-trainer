import { useCallback, useEffect, useRef, useState } from 'react'
import { type AudioSpec, getAudioEngine } from '../../audio'
import { setSoundEnabled, useSoundEnabled } from '../../progress/settings'
import { Icon } from '../Icon'

type Status = 'idle' | 'playing' | 'unavailable'

/**
 * Browsers only let a page start sound after the person has tapped or clicked something on it.
 * Opening a listening question straight from a link or a reload has had no tap yet, so it waits for Play.
 * Where the browser cannot say, it tries anyway (the old behaviour).
 */
function mayStartSound(): boolean {
  const activation = (navigator as Navigator & { userActivation?: { hasBeenActive: boolean } }).userActivation
  return activation ? activation.hasBeenActive : true
}

/**
 * The Play button for a listening question. It plays once by itself when the question appears,
 * if the browser allows that yet (see mayStartSound). If sound is off, tapping the button turns it on and plays.
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
    if (!getAudioEngine().available) void play()
    else if (soundOn && mayStartSound()) void play()
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

  const label = status === 'playing' ? 'Playing…' : !soundOn ? 'Sound is off. Tap to turn it on and play' : played ? 'Play again' : 'Play'
  const showIcon = status !== 'playing' && soundOn
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
        {showIcon && <Icon name="play" className="play-icon" />}
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
      <Icon name={soundOn ? 'speaker-on' : 'speaker-off'} size={22} />
    </button>
  )
}

