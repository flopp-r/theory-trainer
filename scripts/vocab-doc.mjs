// Writes docs/vocabulary-review.md from the data files in src/content/vocabulary/.
// Run with: node scripts/vocab-doc.mjs
import { readFileSync, readdirSync, writeFileSync } from 'node:fs'

const dir = new URL('../src/content/vocabulary/', import.meta.url)
const order = ['tempo', 'dynamics', 'articulation', 'ornaments', 'texture', 'form', 'instruments', 'tonality']
const categories = readdirSync(dir)
  .filter((f) => f.endsWith('.json'))
  .map((f) => JSON.parse(readFileSync(new URL(f, dir), 'utf8')))
  .sort((a, b) => order.indexOf(a.category) - order.indexOf(b.category))

const lines = [
  '# Vocabulary for review',
  '',
  'This list was drafted by me, not taken from the AQA specification. **Please check every term and meaning**,',
  'and tell me what to change, add or remove. Nothing here is confirmed as being on the specification.',
  '',
  'How to read it:',
  '- **Level** says when the term appears: 1 = Easy, Medium and Hard; 2 = Medium and Hard; 3 = Hard only.',
  '- **Group** keeps near-synonyms apart. Two terms with the same group are never offered as wrong answers for each other',
  '  (for example rallentando and ritardando).',
  '- The editable data is in `src/content/vocabulary/*.json`. This page is generated from it by `node scripts/vocab-doc.mjs`.',
  '',
]
for (const c of categories) {
  lines.push(`## ${c.label}`, '', `Question wording: “${c.askTerm}” and “${c.askMeaning}”`, '', '| Term | Meaning | Level | Group |', '| --- | --- | --- | --- |')
  for (const e of c.entries) lines.push(`| ${e.term} | ${e.meaning} | ${e.level} | ${e.group} |`)
  lines.push('')
}
lines.push(
  '## Left out on purpose',
  '',
  '- Keyboard instruments (piano, organ, harpsichord): how they are classed varies, so a "which family?" question could have more than one defensible answer.',
  '',
)
writeFileSync(new URL('../docs/vocabulary-review.md', import.meta.url), lines.join('\n'))
console.log(`Wrote docs/vocabulary-review.md (${categories.reduce((n, c) => n + c.entries.length, 0)} terms)`)
