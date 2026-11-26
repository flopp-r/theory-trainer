# Music Theory Trainer

A mobile-first music theory trainer (notation, clefs, intervals, chords, cadences and ear training).
Installable as a PWA and works offline. Static site: no backend.

## Develop

```bash
npm install
npm run dev      # local dev server
npm test         # unit tests
npm run lint
npm run build    # production build into dist/
```

## Layout

| Folder | Purpose |
| --- | --- |
| `src/theory/` | Pure TypeScript music theory, no UI |
| `src/questions/` | One generator per question type |
| `src/progress/` | Stats, spaced repetition, storage |
| `src/ui/` | Screens and components (staff drawing uses VexFlow) |
| `src/content/` | Vocabulary as editable JSON, and the Library lessons (`library/`) |
| `src/platform/` | Platform services (notifications) |
| `src/audio/` | `AudioEngine` interface and the Web Audio synth |
| `docs/` | Notes: `library.md` (how to write lessons), `theory-engine.md`, `questions.md`, `aqa-coverage.md`, `vocabulary-review.md`, `key-signature-layouts.md`, `backlog.md` |

## Deployment

Pushing to the default branch runs `.github/workflows/deploy.yml`, which lints, tests, builds and
publishes `dist/` to GitHub Pages. Other branches are built and tested but not published.
Routing is hash-based and asset paths are relative, so the site works from the Pages sub-path.
