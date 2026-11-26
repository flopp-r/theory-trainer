export interface InlinePart {
  readonly text: string
  readonly bold: boolean
  readonly italic: boolean
}

/**
 * Splits lesson text into plain, **bold** and *italic* parts.
 * Only these two marks exist, so lesson text can never inject anything else into the page.
 * Throws if a mark is left open, so a typo is caught by the tests and not by the learner.
 */
export function parseInline(text: string): InlinePart[] {
  const parts: InlinePart[] = []
  let bold = false
  const boldSegments = text.split('**')
  if (boldSegments.length % 2 === 0) throw new SyntaxError(`Unbalanced ** in: ${text}`)
  boldSegments.forEach((segment, i) => {
    bold = i % 2 === 1
    const italicSegments = segment.split('*')
    if (italicSegments.length % 2 === 0) throw new SyntaxError(`Unbalanced * in: ${text}`)
    italicSegments.forEach((piece, j) => {
      if (piece.length > 0) parts.push({ text: piece, bold, italic: j % 2 === 1 })
    })
  })
  return parts
}

/** The text with the marks removed. */
export function plainText(text: string): string {
  return parseInline(text)
    .map((p) => p.text)
    .join('')
}
