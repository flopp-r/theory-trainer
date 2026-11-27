import { melodyAudio } from '../builders/audio'
import { majorScaleExample } from '../builders/scales'
import { h, list, listenBlock, p, practise, remember, steps, table, tip, watch, words, worked } from '../builders/common'
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
    p('A **scale** is a ladder of notes, going up or down one step at a time. The **major scale** is the most useful one: it is the sound of "do re mi fa sol la ti do". If you can build a major scale you can work out key signatures, chords and most of what comes later in this Library.'),
    words(
      { term: 'Scale', meaning: 'A set of notes in order of pitch, going up or down by step and using each letter name once.' },
      { term: 'Major scale', meaning: 'The scale built with the pattern tone, tone, semitone, tone, tone, tone, semitone.' },
      { term: 'Key note (tonic)', meaning: 'The note a scale starts and ends on, and is named after. In D major it is D.' },
      { term: 'Semitone', meaning: 'The smallest step in Western music: from one piano key to the very next key, black or white.' },
      { term: 'Tone', meaning: 'A step of two semitones, such as C up to D.' },
      { term: 'Sharp (♯)', meaning: 'A sign that raises a note by one semitone. F♯ is one semitone higher than F.' },
      { term: 'Flat (♭)', meaning: 'A sign that lowers a note by one semitone. B♭ is one semitone lower than B.' },
      { term: 'Natural', meaning: 'A note with no sharp or flat, such as E or B.' },
      { term: 'Octave', meaning: 'The distance from a note to the next note with the same letter name: 8 letter names, or 12 semitones.' },
    ),

    h('Tones and semitones on the piano'),
    p('Look at a piano. Most white keys have a black key between them, so two neighbouring letter names are usually a tone apart. The exceptions are E to F and B to C: there is no black key between them, so each of those pairs is only a semitone apart. Learn those two pairs and every other gap follows.'),
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
      'The distance between neighbouring natural letter names. Learn the two semitones: B–C and E–F.',
    ),

    h('The major scale pattern'),
    remember('Every major scale goes **tone, tone, semitone, tone, tone, tone, semitone**.'),
    p('A scale has seven different notes, and the eighth is the key note again, one octave higher. That makes seven gaps, one for each step of the pattern: from note 1 to 2 is a tone, 2 to 3 a tone, 3 to 4 a semitone, 4 to 5 a tone, 5 to 6 a tone, 6 to 7 a tone, and 7 to 8 a semitone.'),
    p('C major uses only natural notes, because its letters fall on exactly that pattern. Listen to it:'),
    listenBlock('Hear the C major scale', melodyAudio(scalePitches(parsePitch('C4'), 'major'))),

    h('The method'),
    steps(
      '**Write the key note.** This is note 1.',
      '**Write the letter names.** Write eight letter names in alphabetical order, starting on the key note, and finish on it again. A scale uses every letter once, so the letters are now fixed. Only the sharps and flats are left to work out. For D: D E F G A B C D.',
      '**Write the major scale pattern.** Write tone, tone, semitone, tone, tone, tone, semitone over the seven gaps.',
      '**Work out each gap, one at a time.** For each gap, count the semitones from the note you have to the next letter. If the pattern wants a bigger gap, raise the new note with a sharp. If it wants a smaller gap, lower it with a flat. If the gap is right, leave the note natural.',
      '**Write the scale out.** Read the notes from the bottom up, ending on the key note again.',
      '**Check another way.** In every major scale, note 3 is 4 semitones above the key note. Count up one piano key at a time to prove it.',
    ),

    h('Worked examples'),
    p('Each example shows every decision. Follow one all the way through, then try the next on your own before reading it.'),
    worked(majorScaleExample(note('D'))),
    worked(majorScaleExample(note('B', -1))),
    worked(majorScaleExample(note('F', 1))),
    tip('You do not need to remember every scale. You only need the pattern and the method, and then you can build any major scale in under a minute.'),

    h('Common mistakes'),
    watch('**Writing G♭ instead of F♯ in D major.** The wrong scale is D E G♭ G A B D♭ D: it has two G letters and no F. The right scale is D E F♯ G A B C♯ D. Every letter appears once, so the third note must be an F-sound.'),
    watch('**Forgetting the two natural semitones.** In D major, E up to F is only 1 semitone, but the pattern wants a tone. Leaving F natural gives D E F G, which is too narrow. Raise it to F♯ to make the tone.'),
    watch('**Counting the key note twice.** The scale has seven different notes: D E F♯ G A B C♯. The eighth note, D, is the first one again, one octave higher, so do not count it as a new note.'),

    h('Try it'),
    practise({ label: 'Practise scale spelling (easy)', topics: ['scales'], level: 1 }),
    list('Next lesson: Minor scales.'),
  ],
}
