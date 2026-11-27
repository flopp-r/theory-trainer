# Library authoring guide

The Library is the set of lessons inside the app (Home, then Library). This guide is for anyone writing or changing a lesson.
Code lives in `src/content/library/`. Model lessons to copy: `lessons/start.ts` and `lessons/scales-keys-model.ts`.

## Who the reader is
A complete beginner with **no prior knowledge**. They are on a phone. They want to **follow** the working and **copy** the method.
Everything must be clear enough that they could do the same working for a different question on their own.

## The shape of every lesson
In this order (use `h()` headings; short headings in plain words). The model to copy is `lessons/scales-keys-model.ts` (Major scales).
1. **Opening.** One or two paragraphs that say something about music straight away: what the thing is and why it is useful.
   Never "In this lesson you will learn…". Define the lesson's main word in the first sentence.
2. **Words in this lesson** (`words({ term, meaning }, …)`). Every musical word the lesson uses that a beginner might not know, each in one
   plain sentence (at most 30 words). It replaces the old "What you need to know first" block: do not re-teach earlier lessons here,
   list them in `before` (they show as "Read first") and explain each word where it is used. Use the same wording as the "Words you need"
   in the worked examples, so a word never has two definitions.
3. **The facts.** The small number of things to learn, as a `table` or `list`, with a `remember` box for the key rule. Facts and tables are checked
   by hand and by tests: change the wording around them, not the facts.
4. **The method.** A numbered `steps()` list the reader can follow for any question of this kind. One action per step. Each step starts with a
   bold lead phrase that is the same as the title of the matching step in the worked examples ("**Write the letter names.**"), so the method
   and the examples line up.
5. **Worked examples.** See "Worked examples: the format" below. Two or more, covering the easy case, a harder case and a tricky case.
6. **Common mistakes.** Two to four `watch()` boxes. Each starts with a bold name for the mistake, then shows **the wrong answer and the right
   answer for the same question** ("Writing G♭ instead of F♯ in D major. The wrong scale is D E G♭ G…, the right one is D E F♯ G…").
7. **Try it.** A `practise()` link to the right Practice topic and level.

## Writing rules
- **Bold is for the word being defined, and the lead of a method step or a mistake.** Not for emphasis: at most one bold phrase per 30 words.
- Start from the music, not from the lesson: no "In this lesson", "you will learn", "by the end".
- Say "natural" (and explain it once) for a note with no sharp or flat. Never "plain". Never "anchor": say "the line the clef fixes".
- `npx vitest run src/content/library/lessonStyle.test.ts -t "<lesson id>"` checks these rules for one lesson.
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

## Worked examples: the format
Every worked example has the same parts, shown in this order. `builders/scales.ts` (`majorScaleExample`) is the model to copy.

1. **Question** (`task`): one sentence.
2. **Words you need** (`terms`): every musical word the working uses that a beginner might not know, each with a meaning
   in one plain sentence (at most 30 words). Use real musical terms (tonic, natural, root, 3rd, interval, simple time...),
   never made-up ones ("anchor note", "plain E"). Each example lists its own words, because readers jump straight to it.
   Lists of more than 8 words start folded (one tap opens them); the brackets in the steps still explain each word.
3. **Steps**. Each step has:
   - `title`: what to do, as a short instruction (at most 10 words, no full stop): "Write the letter names".
   - `text`: how, with every count shown (at most about 50 words). The **first time** a term from Words you need appears
     in the steps, add a short reminder in brackets: "raise F with a sharp (♯ raises a note by 1 semitone)".
   - `result`: what the step gives you, with no full stop (at most 20 words): "Note 3: F♯". Results line up down the
     page, so a reader can follow the answer by reading the results alone.
4. **Check another way**: the last step, titled "Check …", reaches the answer by a **different route** (for a scale, count up
   one piano key at a time from the key note to note 3). Never just restate the rule or the answer.
5. **Answer**: one sentence.

Rules:
- **One action per step. Do not skip anything.** When the same working repeats (each gap of a scale, each note of a chord),
  write one short step for each, in words. No tables inside worked examples.
- Show every count: list the letters or piano keys you count ("D, D♯, E, F, F♯: 4 steps, so 4 semitones").
- Explain *why* a count is what it is the first time (E to F is 1 semitone because there is no black key between them).
- No "Step 1:" inside a numbered step, no tick marks, no exclamation marks, no filler ("Look at the picture").
- `npx vitest run src/content/library/workedStyle.test.ts -t "<lesson id>"` checks these rules for one lesson.

## Worked examples are built by the theory engine
Do not type spellings, counts or semitone numbers by hand. Write a **builder** in `builders/<area>.ts` that returns a `WorkedExample`
(see `builders/notes.ts` and `builders/scales.ts`). Rules for builders:
- Compute every spelling, count and number with the functions in `src/theory/` (or by simple arithmetic on pitch classes).
- Where you can, do the long-hand working by one method (for example counting semitones) and then **cross-check against the engine
  by a different route, and throw an Error if they disagree** (see `majorScaleExample`). A wrong example then cannot be shown.
- Each step is one `WorkedStep { title, text, result, staff?, listen? }`. Add a `staff` (notation picture) where it helps; use `listen` for sound
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
