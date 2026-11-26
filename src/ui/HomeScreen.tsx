import { getLastSetup, rememberSetup } from '../progress/history'
import { DEFAULT_PRACTICE_CONFIG, ROUND_LENGTH, describeSetup, parsePracticeConfig, practiceConfigToQuery } from './practice/practiceConfig'

const builtAt = new Date(__BUILD_TIME__).toLocaleString('en-GB', {
  dateStyle: 'medium',
  timeStyle: 'short',
})

export function HomeScreen() {
  const last = getLastSetup()
  const setup = last ?? practiceConfigToQuery(DEFAULT_PRACTICE_CONFIG)
  const config = last ? parsePracticeConfig(new URLSearchParams(last)) : DEFAULT_PRACTICE_CONFIG
  return (
    <main className="screen">
      <h1>Music Theory Trainer</h1>
      <p className="lede">
        Practise notation, rhythm, keys, scales, intervals, chords, cadences and ear training, in short rounds of {ROUND_LENGTH} questions.
      </p>
      <a className="btn primary wide stack" href={`#/practice/play?${setup}`} onClick={() => rememberSetup(setup)}>
        <span>{last ? 'Continue practising' : `Try ${ROUND_LENGTH} questions`}</span>
        <span className="sub">{describeSetup(config)}</span>
      </a>
      <a className="btn wide" href="#/practice">
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
      <p className="build">Built {builtAt}</p>
    </main>
  )
}
