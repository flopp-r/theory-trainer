# Library authoring guide

The Library is the set of lessons inside the app (Home, then Library). This guide is for anyone writing or changing a lesson.
Code lives in `src/content/library/`. Model lessons to copy: `lessons/start.ts` and `lessons/scales-keys-model.ts`.

## Who the reader is
A complete beginner with **no prior knowledge**. They are on a phone. They want to **follow** the working and **copy** the method.
Everything must be clear enough that they could do the same working for a different question on their own.

## The shape of every lesson
In this order (use `h()` headings; short headings in plain words):
1. **What it is.** One or two paragraphs in plain words. No unexplained jargon.
2. **What you need to know first.** Only what this lesson uses. Re-explain tiny prerequisites in one or two sentences (do not just say "see lesson X"); also list lessons in `before`.
3. **The facts.** The small number of things to learn, as a `table` or `list`, with a `remember` box for the key rule.
4. **The method.** A numbered `steps()` list the reader can follow for any question of this kind. One action per step.
5. **Worked examples.** Complete working from the question to the answer, built with the theory engine (see below). Two or more, covering the easy case, a harder case and a tricky case.
6. **Common mistakes.** `watch()` boxes: the real slips beginners make and how to avoid them.
7. **Try it.** A `practise()` link to the right Practice topic and level.

## Writing rules
- **Define every term the first time you use it**, in bold, in plain words: "A **semitone** is the smallest step on a piano: from one key to the very next."
- Short sentences. Say "you". One idea per paragraph. No long lists of rules without an example.
- **Show the numbers.** Do not say "count the notes": say "count: C, D, E, F, G is 5 letter names".
- **Every step has an action and a result.** "Count 4 letters up from D: D, E, F, G. The note is G."
- **Always include a check** at the end of a worked example.
- UK English (colour, practise as a verb, practice as a noun, crotchet not quarter note). Use ♯ ♭ symbols, never "sharp sign" typed as # in prose (use the helpers `noteLabel` and `notesLabel` from `src/questions/pitchTools.ts`).
- Use the same names the app uses in questions: "semibreve, minim, crotchet, quaver, semiquaver"; "major 3rd, perfect 5th"; "root position, first inversion".
- **Do not state facts about the AQA specification.** The Library teaches music theory. If you are not sure a statement is true, leave it out and tell the person reviewing (see "Reporting").
- Memory aids (mnemonics) are welcome but label them as aids: "A memory aid: ...".
- Never put personal information anywhere. The repository is public.

## Worked examples are built by the theory engine
Do not type spellings, counts or semitone numbers by hand. Write a **builder** in `builders/<area>.ts` that returns a `WorkedExample`
(see `builders/notes.ts` and `builders/scales.ts`). Rules for builders:
- Compute every spelling, count and number with the functions in `src/theory/` (or by simple arithmetic on pitch classes).
- Where you can, do the long-hand working by one method (for example counting semitones) and then **cross-check against the engine
  by a different route, and throw an Error if they disagree** (see `majorScaleExample`). A wrong example then cannot be shown.
- Each step is one `WorkedStep { text, staff?, listen? }`. Add a `staff` (notation picture) where it helps; use `listen` for sound
  (`builders/audio.ts`) where hearing it helps.
- Write the text so it reads well when the same builder is used with different inputs.
- Every builder needs a test in `builders/<area>.test.ts` that compares its answers with **hand-written tables**
  (`src/questions/handTables.ts` has some; add more if needed), not with the engine it is built on.

## Writing a lesson
A lesson is an object in a file under `lessons/`:
```ts
{ id: 'major-scales', title: '…', group: 'scales-keys', summary: 'One sentence.', before: ['reading-music'],
  covers: ['scale-spelling'], build: () => [ p('…'), h('…'), steps('…', '…'), worked(example), practise({…}) ] }
```
- `id` must be in `LESSON_ORDER` in `src/content/library/index.ts` (the ids are already listed).
- `before` may only name lessons earlier in `LESSON_ORDER`.
- `covers` lists the question types the lesson helps with. The "Read the lesson" button in Practice uses it.
- Block helpers (`p`, `h`, `list`, `steps`, `tip`, `watch`, `remember`, `table`, `staffBlock`, `listenBlock`, `worked`, `practise`) are in `builders/common.ts`.
- Inline text allows only `**bold**` and `*italic*` (checked by tests).

## Checking your work
```bash
npx tsc -b          # types
npm run lint
npx vitest run src/content   # lesson structure tests and builder tests
```
Two tests in the "whole library" group fail until every lesson exists; ignore those while you work.
Every other test must pass.

## Reporting
When you finish, say: which lessons and builders you wrote, anything you were unsure was true (so it can be checked),
and anything in the framework that got in your way. Do not edit files outside your own lesson and builder files.
