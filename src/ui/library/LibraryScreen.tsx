import { useState } from 'react'
import { LESSONS, LIBRARY_GROUPS } from '../../content/library'
import { plainText } from '../../content/library/inline'

/** The list of all lessons, grouped, with a search box. */
export default function LibraryScreen() {
  const [search, setSearch] = useState('')
  const needle = search.trim().toLowerCase()
  const matches = (title: string, summary: string) => needle === '' || `${title} ${summary}`.toLowerCase().includes(needle)
  const shown = LESSONS.filter((l) => matches(l.title, plainText(l.summary)))

  return (
    <main className="screen top library">
      <header className="bar">
        <a className="back" href="#/" aria-label="Back to home">
          ←
        </a>
        <h1 className="bar-title">Library</h1>
      </header>
      <p className="lede left">Lessons for everything in the app, written for beginners, with every step of the working shown.</p>
      <input
        type="search"
        className="search"
        placeholder="Search lessons"
        aria-label="Search lessons"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
      {shown.length === 0 && <p className="hint">No lesson matches “{search}”.</p>}
      {LIBRARY_GROUPS.map((group) => {
        const lessons = shown.filter((l) => l.group === group.id)
        if (lessons.length === 0) return null
        return (
          <section key={group.id} className="lib-group">
            <h2>{group.title}</h2>
            <p className="hint">{group.blurb}</p>
            <ul className="lib-cards">
              {lessons.map((lesson) => (
                <li key={lesson.id}>
                  <a className="lib-card" href={`#/library/${lesson.id}`}>
                    <strong>{lesson.title}</strong>
                    <span>{lesson.summary}</span>
                  </a>
                </li>
              ))}
            </ul>
          </section>
        )
      })}
    </main>
  )
}
