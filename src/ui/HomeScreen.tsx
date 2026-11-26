import { useOnline } from './useOnline'

const standalone =
  window.matchMedia('(display-mode: standalone)').matches ||
  (navigator as Navigator & { standalone?: boolean }).standalone === true

const builtAt = new Date(__BUILD_TIME__).toLocaleString('en-GB', {
  dateStyle: 'medium',
  timeStyle: 'short',
})

export function HomeScreen() {
  const online = useOnline()
  return (
    <main className="screen">
      <h1>Music Theory Trainer</h1>
      <p className="lede">Read notes in treble, bass, alto and tenor clef.</p>
      <a className="btn primary wide" href="#/practice">
        Practice
      </a>
      <a className="btn wide" href="#/library">
        Library: lessons and worked examples
      </a>
      <ul className="status" aria-label="App status">
        <li data-ok={online}>{online ? 'Online' : 'Offline'}</li>
        <li data-ok={standalone}>{standalone ? 'Running as installed app' : 'Running in browser'}</li>
      </ul>
      <p className="build">Build: {builtAt}</p>
    </main>
  )
}
