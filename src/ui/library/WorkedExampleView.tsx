import { useState } from 'react'
import { type WorkedExample, workedToText } from '../../content/library/types'
import { StaffStack } from '../staff/StaffStack'
import { InlineText } from './InlineText'
import { ListenButton } from './ListenButton'

/** One complete piece of working: question, numbered steps, answer, and a way to copy it. */
export function WorkedExampleView({ example }: { example: WorkedExample }) {
  const [copied, setCopied] = useState<'no' | 'yes' | 'failed'>('no')
  const text = workedToText(example)

  async function copy() {
    try {
      await navigator.clipboard.writeText(text)
      setCopied('yes')
    } catch {
      setCopied('failed')
    }
  }

  return (
    <section className="worked" aria-label={`Worked example: ${example.title}`}>
      <p className="worked-label">Worked example</p>
      <h4 className="worked-title">{example.title}</h4>
      <p className="worked-task">
        <strong>Question: </strong>
        <InlineText text={example.task} />
      </p>
      <ol className="worked-steps">
        {example.steps.map((step, i) => (
          <li key={i}>
            <p>
              <InlineText text={step.text} />
            </p>
            {step.staff && <StaffStack notation={{ staves: [step.staff] }} ledgerLines={0} scroll />}
            {step.listen && <ListenButton item={step.listen} />}
          </li>
        ))}
      </ol>
      <p className="worked-answer">
        <strong>Answer: </strong>
        <InlineText text={example.answer} />
      </p>
      <div className="worked-actions">
        <button type="button" className="btn small" onClick={() => void copy()}>
          {copied === 'yes' ? 'Copied ✓' : 'Copy this working'}
        </button>
        {copied === 'failed' && <span className="hint">Your browser would not copy. Open the plain text below and copy it by hand.</span>}
      </div>
      <details className="worked-plain">
        <summary>Plain text version</summary>
        <pre>{text}</pre>
      </details>
    </section>
  )
}
