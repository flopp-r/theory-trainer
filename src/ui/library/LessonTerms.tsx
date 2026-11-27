import type { WorkedTerm } from '../../content/library/types'
import { InlineText } from './InlineText'

/** Lists of up to this many words are shown open; longer ones start folded. */
const TERMS_SHOWN_OPEN = 8

/** "Words in this lesson": the musical words the lesson uses, each explained once. */
export function LessonTerms({ terms }: { terms: readonly WorkedTerm[] }) {
  return (
    <details className="worked-terms lesson-terms" open={terms.length <= TERMS_SHOWN_OPEN}>
      <summary className="worked-terms-title">Words in this lesson{terms.length > TERMS_SHOWN_OPEN ? ` (${terms.length})` : ''}</summary>
      <dl>
        {terms.map((t) => (
          <div key={t.term}>
            <dt>
              <InlineText text={t.term} />
            </dt>
            <dd>
              <InlineText text={t.meaning} />
            </dd>
          </div>
        ))}
      </dl>
    </details>
  )
}
