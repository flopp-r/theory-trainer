import { useOnline } from './useOnline'

const standalone =
  window.matchMedia('(display-mode: standalone)').matches ||
  (navigator as Navigator & { standalone?: boolean }).standalone === true

const builtAt = new Date(__BUILD_TIME__).toLocaleString('en-GB', {
  dateStyle: 'medium',
  timeStyle: 'short',
})

export function HelloScreen() {
  const online = useOnline()
  return (
    <main className="screen">
      <h1>Hello</h1>
      <p className="lede">Music Theory Trainer</p>
      <ul className="status" aria-label="App status">
        <li data-ok={online}>{online ? 'Online' : 'Offline'}</li>
        <li data-ok={standalone}>{standalone ? 'Running as installed app' : 'Running in browser'}</li>
      </ul>
      <p className="build">Build: {builtAt}</p>
    </main>
  )
}
