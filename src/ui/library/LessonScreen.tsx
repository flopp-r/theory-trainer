import { useEffect } from 'react'
import { lessonById, neighbours } from '../../content/library'
import { LessonView } from './LessonView'

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
        <p className="lede">
          <a href="#/library">Back to the Library</a>
        </p>
      </main>
    )
  }
  const { previous, next } = neighbours(lesson.id)
  return (
    <main className="screen top library">
      <header className="bar">
        <a className="back" href="#/library" aria-label="Back to the Library">
          ←
        </a>
        <p className="bar-title small">Library</p>
      </header>
      <LessonView lesson={lesson} />
      <nav className="lesson-nav" aria-label="Other lessons">
        {previous ? (
          <a className="btn" href={`#/library/${previous.id}`}>
            ← {previous.title}
          </a>
        ) : (
          <span />
        )}
        {next && (
          <a className="btn primary" href={`#/library/${next.id}`}>
            {next.title} →
          </a>
        )}
      </nav>
    </main>
  )
}
