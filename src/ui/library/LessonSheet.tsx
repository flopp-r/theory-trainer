import { useEffect, useRef } from 'react'
import { lessonById } from '../../content/library'
import { LessonView } from './LessonView'
import { Icon } from '../Icon'

/**
 * A lesson shown over whatever you are doing, so you can read it and come straight back.
 * Closing it returns you to exactly where you were (your practice session is untouched).
 */
export default function LessonSheet({ id, onClose }: { id: string; onClose: () => void }) {
  const lesson = lessonById(id)
  const closeButton = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    closeButton.current?.focus()
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    // Stop the page behind from scrolling while the sheet is open.
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = previous
    }
  }, [onClose])

  if (!lesson) return null
  return (
    <div className="sheet" role="dialog" aria-modal="true" aria-label={`Lesson: ${lesson.title}`}>
      <header className="sheet-bar">
        <p className="bar-title small">Lesson</p>
        <button ref={closeButton} type="button" className="btn small" onClick={onClose}>
          Close
          <Icon name="close" size={18} />
        </button>
      </header>
      <div className="sheet-body">
        <LessonView lesson={lesson} />
        <button type="button" className="btn primary wide" onClick={onClose}>
          Back to practice
        </button>
      </div>
    </div>
  )
}
