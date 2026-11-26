import { getLastSetup, lastSession, loadRound, rememberSetup } from '../progress/history'
import {
  DEFAULT_PRACTICE_CONFIG,
  ROUND_LENGTH,
  describeSetup,
  parsePracticeConfig,
  practiceConfigToQuery,
  presetFor,
} from './practice/practiceConfig'

const builtAt = new Date(__BUILD_TIME__).toLocaleString('en-GB', {
  dateStyle: 'medium',
  timeStyle: 'short',
})

/** The preset's name if the setup is one, otherwise a short description. */
function setupName(query: string): string {
  const config = parsePracticeConfig(new URLSearchParams(query))
  return presetFor(config)?.label ?? describeSetup(config)
}

export function HomeScreen() {
  const round = loadRound()
  const last = getLastSetup()
  const previous = lastSession()
  const setup = round?.setup ?? last ?? practiceConfigToQuery(DEFAULT_PRACTICE_CONFIG)

  const primary = round
    ? { title: 'Resume your round', sub: `${round.results.length} of ${ROUND_LENGTH} answered · ${setupName(round.setup)}` }
    : last
      ? { title: 'Continue practising', sub: setupName(last) }
      : { title: `Try ${ROUND_LENGTH} questions`, sub: describeSetup(DEFAULT_PRACTICE_CONFIG) }

  return (
    <main className="screen">
      <header className="title-page">
        <h1>Music Theory Trainer</h1>
        <div className="staff-rule" aria-hidden="true" />
        <p className="lede">
          Practise notation, rhythm, keys, scales, intervals, chords, cadences and ear training, in short rounds of {ROUND_LENGTH} questions.
        </p>
      </header>

      <a className="btn primary wide stack" href={`#/practice/play?${setup}`} onClick={() => rememberSetup(setup)}>
        <span>{primary.title}</span>
        <span className="sub">{primary.sub}</span>
      </a>
      {previous && (
        <p className="hint-centre">
          Last round: {previous.correct} / {previous.total}, {setupName(previous.setup)}
        </p>
      )}
      <a className="btn wide" href={last ? `#/practice?${last}` : '#/practice'}>
        {last ? 'Change what to practise' : 'Choose what to practise'}
      </a>
      <a className="btn wide" href="#/library">
        Library: lessons and worked examples
      </a>
      {!last && (
        <p className="hint-centre">
          New to reading music?{' '}
          <a className="text-link" href="#/library/reading-music">
            Start with the first lesson
          </a>
        </p>
      )}
      <p className="build">Version: {builtAt}</p>
    </main>
  )
}
