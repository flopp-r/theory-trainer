import { pitch, parsePitch } from '../../../theory'
import { nameNoteExample } from '../builders/notes'
import { emptyStaff, notesOnStaff, p, h, list, steps, table, tip, watch, remember, staffBlock, words, worked, practise } from '../builders/common'
import type { LibraryLesson } from '../types'

export const START_LESSONS: LibraryLesson[] = [
  {
    id: 'reading-music',
    title: 'Reading music: the staff, notes and clefs',
    group: 'start',
    summary: 'What the five lines mean, how notes get their names, and what a clef does.',
    covers: [],
    build: () => [
      p('A **staff** (also called a stave) is the five lines and four spaces that music is written on. Each note is drawn on a line or in a space, and its height on the staff shows its pitch, which is how high or low it sounds. Reading music starts with one skill: saying the name of a note from where it sits on the staff.'),
      p('Every other lesson in this Library needs that skill, because scales, chords and intervals all start from note names. You work a name out by counting, so you can name a note you have never seen before.'),
      words(
        { term: 'Staff (or stave)', meaning: 'The five lines and four spaces that music is written on. Lines and spaces are counted from the bottom up.' },
        { term: 'Pitch', meaning: 'How high or low a note sounds.' },
        { term: 'Musical alphabet', meaning: 'The seven letter names used for notes: A B C D E F G. After G it starts again at A.' },
        { term: 'Step', meaning: 'A move from a line to the very next space, or from a space to the very next line. One step up gives the next letter name.' },
        { term: 'Clef', meaning: 'A sign at the start of the staff that fixes one line to one letter name, so you can count to every other note.' },
        { term: 'Treble clef (G clef)', meaning: 'The clef for higher notes. Its curl circles the 2nd line up and fixes it as G, so it is also called the G clef.' },
        { term: 'Bass clef (F clef)', meaning: 'The clef for lower notes. Its two dots sit either side of the 4th line up and fix it as F, so it is also called the F clef.' },
        { term: 'Ledger line', meaning: 'A short extra line drawn above or below the staff, for a note too high or too low to fit on the five lines.' },
      ),

      h('The lines and the spaces'),
      p('Look at the empty staff below. A note sits either on a line or in a space, and you always count from the bottom up. The bottom line is the 1st line. The space just above it is the 1st space. Then come the 2nd line, the 2nd space, and so on up to the 5th line at the top.'),
      staffBlock(emptyStaff('treble'), 'A staff: five lines, four spaces. (The curly sign at the start is a clef, which comes soon.)'),
      table(
        ['What', 'Where'],
        [
          ['1st line', 'the bottom line'],
          ['1st space', 'between the 1st and 2nd lines'],
          ['2nd line', 'second from the bottom'],
          ['3rd line', 'the middle line'],
          ['4th line', 'second from the top'],
          ['5th line', 'the top line'],
        ],
        'Names for the lines. The spaces are numbered the same way, from the bottom.',
      ),

      h('The letter names'),
      p('Notes are named with seven letters: A B C D E F G. After G the letters start again at A. This is the musical alphabet, and it goes round and round:'),
      p('A B C D E F G A B C D E F G A ...'),
      p('Moving from a line to the space just above it, or from a space to the line just above it, is one step. One step up gives the next letter. One step down gives the previous letter.'),
      remember('Every line and every space counts as one step. Steps up go forwards through the alphabet (A, B, C ...). Steps down go backwards (... C, B, A).'),

      h('A clef tells you which line is which letter'),
      p('Nothing on the empty staff says which line is A or which is C. A **clef** is the sign at the start of the staff that fixes one line to one letter. Once you know that letter, you count to find all the others.'),
      p('There are four clefs in this app. The two most common are the treble clef and the bass clef.'),
      h('The treble clef'),
      p('The **treble clef** curls around the 2nd line from the bottom, and that line is G. That is why it is also called the G clef.'),
      staffBlock(notesOnStaff('treble', [parsePitch('G4')]), 'Treble clef. The note on the 2nd line is G.'),
      h('The bass clef'),
      p('The **bass clef** has two dots, one either side of the 4th line from the bottom, and that line is F. That is why it is also called the F clef.'),
      staffBlock(notesOnStaff('bass', [parsePitch('F3')]), 'Bass clef. The note on the 4th line is F.'),
      p('Treble clef is used for higher notes, such as the violin, the flute and the right hand on the piano. Bass clef is used for lower notes, such as the cello, the double bass and the left hand on the piano. Two more clefs, alto and tenor, have their own lesson. The viola reads alto clef.'),

      h('How to name any note'),
      p('Naming a note is a count from the line the clef fixes. The five steps are below, and the three examples after them follow the same steps with real notes.'),
      steps(
        '**Find the clef.** Look at the sign at the start of the staff. In treble clef the 2nd line from the bottom is G. In bass clef the 4th line from the bottom is F.',
        '**Find where your note sits.** Count the lines and spaces from the bottom up, and say which line or space the note is on.',
        '**Count from the line the clef fixes to your note.** Count up if your note is higher than that line, and down if it is lower. Every line and every space is one step. Say the letters forwards for each step up and backwards for each step down.',
        '**Read the last letter.** The letter you land on is the name of your note.',
        '**Check with the lines or the spaces of the clef.** Read the note from a list instead of counting. In treble clef the lines from the bottom are E G B D F and the spaces are F A C E. In bass clef the lines are G B D F A and the spaces are A C E G.',
      ),
      worked(nameNoteExample('treble', pitch('E', 0, 4))),
      worked(nameNoteExample('treble', pitch('B', 0, 4))),
      worked(nameNoteExample('bass', pitch('A', 0, 2))),
      tip('A note above the staff or below it sits on a ledger line, a short extra line. You count ledger lines the same way: one step for each line and each space. They have their own lesson.'),

      h('Common mistakes'),
      watch('**Counting only the lines.** The note on the middle line of the treble clef: counting only lines from G gives A (G, then the next line). Every space is a step too: G, A (2nd space), B (middle line). The note is B.'),
      watch('**Counting the wrong way.** The note on the bottom line of the treble clef is lower than G. Counting forwards gives G, A, B, which is wrong. Counting backwards gives G, F, E. The note is E.'),
      watch('**Forgetting which clef you are in.** The note on the bottom line. Reading it as E is wrong in bass clef, because E is its name in treble clef. In bass clef, count down from F on the 4th line: F, E, D, C, B, A, G. The note is G.'),

      h('Try it'),
      p('Practice will ask you to name notes. Start with the treble clef and no ledger lines.'),
      practise({ label: 'Practise note names (treble clef, easy)', topics: ['notes'], level: 1, clefs: ['treble'] }),
      list('Next lesson: Naming notes in treble and bass clef (more practice, ledger lines, memory aids).'),
    ],
  },
]
