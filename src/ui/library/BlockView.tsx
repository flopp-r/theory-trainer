import type { Block } from '../../content/library/types'
import { practiceConfigToQuery } from '../practice/practiceConfig'
import { StaffStack } from '../staff/StaffStack'
import { InlineText } from './InlineText'
import { ListenButton } from './ListenButton'
import { WorkedExampleView } from './WorkedExampleView'

const NOTE_TITLES = { tip: 'Tip', watch: 'Watch out', remember: 'Remember' } as const

/** Shows one block of a lesson. */
export function BlockView({ block }: { block: Block }) {
  switch (block.type) {
    case 'p':
      return (
        <p className="lib-p">
          <InlineText text={block.text} />
        </p>
      )
    case 'h':
      return (
        <h3 className="lib-h">
          <InlineText text={block.text} />
        </h3>
      )
    case 'list':
      return (
        <ul className="lib-list">
          {block.items.map((item, i) => (
            <li key={i}>
              <InlineText text={item} />
            </li>
          ))}
        </ul>
      )
    case 'steps':
      return (
        <ol className="lib-steps">
          {block.items.map((item, i) => (
            <li key={i}>
              <InlineText text={item} />
            </li>
          ))}
        </ol>
      )
    case 'note':
      return (
        <aside className={`lib-note ${block.kind}`}>
          <strong className="note-label">{NOTE_TITLES[block.kind]}: </strong>
          <InlineText text={block.text} />
        </aside>
      )
    case 'table':
      return (
        <figure className="lib-table">
          <div className="lib-table-wrap">
            <table>
              <thead>
                <tr>
                  {block.head.map((cell, i) => (
                    <th key={i}>
                      <InlineText text={cell} />
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {block.rows.map((row, r) => (
                  <tr key={r}>
                    {row.map((cell, c) => (
                      <td key={c}>
                        <InlineText text={cell} />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {block.caption && (
            <figcaption>
              <InlineText text={block.caption} />
            </figcaption>
          )}
        </figure>
      )
    case 'staff':
      return (
        <figure className="lib-figure">
          <StaffStack notation={{ staves: [block.staff] }} ledgerLines={0} scroll />
          <figcaption>
            <InlineText text={block.caption} />
          </figcaption>
        </figure>
      )
    case 'listen':
      return <ListenButton item={block.item} />
    case 'worked':
      return <WorkedExampleView example={block.example} />
    case 'practise': {
      const link = block.link
      const query = practiceConfigToQuery({
        topics: link.topics,
        clefs: link.clefs ?? ['alto'],
        maxLedgerLines: 1,
        difficulty: link.level ?? 2,
        vocabCategories: [],
      })
      return (
        <a className="btn primary wide" href={`#/practice/play?${query}`}>
          {link.label}
        </a>
      )
    }
  }
}
