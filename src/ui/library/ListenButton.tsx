import { useEffect, useRef, useState } from 'react'
import { getAudioEngine } from '../../audio'
import type { ListenItem } from '../../content/library/types'

/** A button that plays a short sound. Playing another one (or leaving the page) stops it. */
export function ListenButton({ item }: { item: ListenItem }) {
  const [playing, setPlaying] = useState(false)
  const alive = useRef(true)

  useEffect(() => {
    alive.current = true
    return () => {
      alive.current = false
      getAudioEngine().stop()
    }
  }, [])

  async function play() {
    const engine = getAudioEngine()
    if (!engine.available) return
    setPlaying(true)
    await engine.play(item.audio)
    if (alive.current) setPlaying(false)
  }

  if (!getAudioEngine().available) return null
  return (
    <button type="button" className="btn listen" onClick={() => void play()} disabled={playing}>
      {playing ? 'Playing…' : `▶ ${item.label}`}
    </button>
  )
}
