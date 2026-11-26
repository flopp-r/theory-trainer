import { lessonById } from '../../content/library'
import type { LibraryLesson } from '../../content/library/types'
import { BlockView } from './BlockView'

/** The content of one lesson: title, summary, what to read first, and the blocks. */
export function LessonView({ lesson }: { lesson: LibraryLesson }) {
  const before = (lesson.before ?? []).map(lessonById).filter((l): l is LibraryLesson => l !== undefined)
  const blocks = lesson.build()
  return (
    <article className="lesson">
      <h1 className="lesson-title">{lesson.title}</h1>
      <p className="lesson-summary">{lesson.summary}</p>
      {before.length > 0 && (
        <p className="lesson-before">
          Read first:{' '}
          {before.map((b, i) => (
            <span key={b.id}>
              {i > 0 && ', '}
              <a href={`#/library/${b.id}`}>{b.title}</a>
            </span>
          ))}
        </p>
      )}
      {blocks.map((block, i) => (
        <BlockView key={i} block={block} />
      ))}
    </article>
  )
}
