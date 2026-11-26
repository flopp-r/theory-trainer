import { melodyAudio } from '../builders/audio'
import { majorScaleExample } from '../builders/scales'
import { h, list, listenBlock, p, practise, remember, steps, table, tip, watch, worked } from '../builders/common'
import { note, parsePitch, scalePitches } from '../../../theory'
import type { LibraryLesson } from '../types'

export const MAJOR_SCALES_LESSON: LibraryLesson = {
  id: 'major-scales',
  title: 'Major scales: how to build any one',
  group: 'scales-keys',
  summary: 'The tone and semitone pattern, and a step-by-step method to write any major scale.',
  before: ['reading-music'],
  covers: ['scale-spelling'],
  build: () => [
    p('A **scale** is a set of notes in order, going up (or down) by step. The **major scale** is the most important one: it is the sound of "do re mi fa sol la ti do". Once you can build a major scale you can work out key signatures, chords and most of the rest of this Library.'),

    h('What you need to know first'),
    p('A **semitone** is the smallest step in Western music: from one piano key to the very next key, whether black or white. A **tone** is **two semitones**.'),
    p('On the piano, most white keys have a black key between them, so most neighbouring letter names are a **tone** apart. But there is **no** black key between **E and F**, and **none between B and C**. So those two pairs are only a **semitone** apart.'),
    table(
      ['Neighbouring letters', 'Distance'],
      [
        ['A to B', '1 tone (2 semitones)'],
        ['B to C', '**1 semitone**'],
        ['C to D', '1 tone (2 semitones)'],
        ['D to E', '1 tone (2 semitones)'],
        ['E to F', '**1 semitone**'],
        ['F to G', '1 tone (2 semitones)'],
        ['G to A', '1 tone (2 semitones)'],
      ],
      'The distance between neighbouring plain letter names. Learn the two semitones: B–C and E–F.',
    ),
    p('A **sharp** (♯) raises a note by one semitone. A **flat** (♭) lowers it by one semitone.'),

    h('The pattern'),
    remember('Every major scale goes **tone, tone, semitone, tone, tone, tone, semitone**.'),
    p('Count it on your fingers: 1 to 2 is a tone, 2 to 3 a tone, 3 to 4 a semitone, 4 to 5 a tone, 5 to 6 a tone, 6 to 7 a tone, and 7 to 8 (the same note as 1, one octave higher) a semitone. The scale has **7 different notes**; the 8th note is the first one again.'),
    p('C major uses only the plain letters, because the pattern happens to match the plain notes exactly. Listen to it:'),
    listenBlock('Hear the C major scale', melodyAudio(scalePitches(parsePitch('C4'), 'major'))),

    h('The method'),
    steps(
      'Write the **key note** (the note the scale is named after) as note 1.',
      'Write the **letter names** in order, starting on that letter, for eight notes (the last is the key note again). Example for D: D E F G A B C D. This gives every letter **exactly once**.',
      'Write the pattern **tone, tone, semitone, tone, tone, tone, semitone** over the gaps.',
      'Go **one step at a time**. For each next letter, work out how many semitones it is from the note before. If the pattern wants a different distance, add a **sharp** (if the step needs to be bigger) or a **flat** (if it needs to be smaller).',
      'Check the last step lands back on the key note with a semitone. Then read the scale out loud, letter by letter.',
    ),

    h('Worked examples'),
    p('Each example shows every decision. Follow one all the way through, then try the next on your own before reading it.'),
    worked(majorScaleExample(note('D'))),
    worked(majorScaleExample(note('B', -1))),
    worked(majorScaleExample(note('F', 1))),
    tip('You do not need to remember every scale. You only need the **pattern** and the **method**: you can build any scale in under a minute.'),

    h('Common mistakes'),
    watch('**Writing F♯ as G♭ (or the other way round).** A scale uses each letter once, in order. If the 4th note must be a G-sound, it is written as G-something. D major has **F♯** because the letters go D E **F** G A B **C**: there is no second G.'),
    watch('**Forgetting the two natural semitones.** E to F and B to C are already a semitone apart. If the pattern wants a *tone* there, you must add a sharp. If it wants a *semitone* there, add nothing.'),
    watch('**Counting the key note twice.** The eighth note is the same note as the first; the scale only has seven different notes.'),

    h('Try it'),
    practise({ label: 'Practise scale spelling (easy)', topics: ['scales'], level: 1 }),
    list('Next lesson: **Minor scales**.'),
  ],
}
