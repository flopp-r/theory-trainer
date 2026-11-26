import { Suspense, lazy } from 'react'
import { HomeScreen } from './HomeScreen'
import { PracticeSession } from './practice/PracticeSession'
import { PracticeSetup } from './practice/PracticeSetup'
import { parsePracticeConfig } from './practice/practiceConfig'
import { parseHash, parseHashQuery } from './route'
import { useHash } from './useHashRoute'

// The Library is loaded only when opened, so the first screen stays light. It is still saved for offline use.
const LibraryScreen = lazy(() => import('./library/LibraryScreen'))
const LessonScreen = lazy(() => import('./library/LessonScreen'))

function Loading() {
  return (
    <main className="screen">
      <p className="lede">Loading…</p>
    </main>
  )
}

export function App() {
  const hash = useHash()
  const path = parseHash(hash)
  const query = parseHashQuery(hash)
  switch (path) {
    case '/':
      return <HomeScreen />
    case '/practice':
      return <PracticeSetup key={query.toString()} initial={parsePracticeConfig(query)} />
    case '/practice/play':
      return <PracticeSession key={query.toString()} config={parsePracticeConfig(query)} />
    case '/library':
      return (
        <Suspense fallback={<Loading />}>
          <LibraryScreen />
        </Suspense>
      )
    default:
      if (path.startsWith('/library/')) {
        return (
          <Suspense fallback={<Loading />}>
            <LessonScreen id={path.slice('/library/'.length)} />
          </Suspense>
        )
      }
      return (
        <main className="screen">
          <h1>Not found</h1>
          <p className="lede">
            <a href="#/">Back to start</a>
          </p>
        </main>
      )
  }
}
