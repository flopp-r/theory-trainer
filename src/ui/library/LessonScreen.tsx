import { useEffect } from 'react'
import { lessonById, neighbours } from '../../content/library'
import { LessonView } from './LessonView'
import { Icon } from '../Icon'

/** A lesson as its own page, with links to the lessons either side. */
export default function LessonScreen({ id }: { id: string }) {
  const lesson = lessonById(id)
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [id])

  if (!lesson) {
    return (
      <main className="screen">
        <h1>Lesson not found</h1>
        <p className="lede">That lesson is not in the Library. The link may be mistyped or out of date.</p>
        <a className="btn primary wide" href="#/library">
          Go to the Library
        </a>
      </main>
    )
  }
  const { previous, next } = neighbours(lesson.id)
  return (
    <main className="screen top library">
      <header className="bar">
        <a className="back" href="#/library" aria-label="Back to the Library">
          <Icon name="arrow-left" size={22} />
        </a>
        <p className="bar-title small">Library</p>
      </header>
      <LessonView lesson={lesson} />
      <nav className="lesson-nav" aria-label="Other lessons">
        {previous ? (
          <a className="btn" href={`#/library/${previous.id}`}>
            <Icon name="arrow-left" />
            <span>{previous.title}</span>
          </a>
        ) : (
          <span />
        )}
        {next && (
          <a className="btn primary" href={`#/library/${next.id}`}>
            <span>{next.title}</span>
            <Icon name="arrow-right" />
          </a>
        )}
      </nav>
    </main>
  )
}
