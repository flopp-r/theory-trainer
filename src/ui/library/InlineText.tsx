import { parseInline } from '../../content/library/inline'

/** Lesson text with **bold** and *italic*. Anything else is shown exactly as written. */
export function InlineText({ text }: { text: string }) {
  return (
    <>
      {parseInline(text).map((part, i) => {
        let node: React.ReactNode = part.text
        if (part.italic) node = <em>{node}</em>
        if (part.bold) node = <strong>{node}</strong>
        return <span key={i}>{node}</span>
      })}
    </>
  )
}
