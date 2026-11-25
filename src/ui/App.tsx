import { HelloScreen } from './HelloScreen'
import { useHashRoute } from './useHashRoute'

export function App() {
  const route = useHashRoute()
  switch (route) {
    case '/':
      return <HelloScreen />
    default:
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
