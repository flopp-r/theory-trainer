import { pitch, parsePitch } from '../../../theory'
import { nameNoteExample } from '../builders/notes'
import { emptyStaff, notesOnStaff, p, h, list, steps, table, tip, watch, remember, staffBlock, worked, practise } from '../builders/common'
import type { LibraryLesson } from '../types'

export const START_LESSONS: LibraryLesson[] = [
  {
    id: 'reading-music',
    title: 'Reading music: the staff, notes and clefs',
    group: 'start',
    summary: 'What the five lines mean, how notes get their names, and what a clef does.',
    covers: [],
    build: () => [
      p('This lesson assumes you know **nothing** about reading music. By the end you will be able to name any note on a treble or bass clef staff, and you will know how every other lesson in this Library works.'),

      h('1. The staff'),
      p('Music is written on a **staff** (some people say **stave**). It is **five horizontal lines** with **four spaces** between them. Notes are drawn either **on a line** or **in a space**.'),
      staffBlock(emptyStaff('treble'), 'A staff: five lines, four spaces. (The curly sign at the start is a clef; more on that soon.)'),
      p('We always count lines and spaces **from the bottom up**. The bottom line is the **1st line**. The space just above it is the **1st space**. Then the 2nd line, the 2nd space, and so on up to the **5th line** at the top.'),
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

      h('2. Notes have letter names'),
      p('Notes are named with just **seven letters**: **A B C D E F G**. After G the letters start again at A. This is called the **musical alphabet**:'),
      p('**A B C D E F G A B C D E F G A ...**'),
      p('Moving from a line to the space above it (or from a space to the line above it) is **one step**, and one step up means the **next letter**. Going down a step means the **previous letter**.'),
      remember('Every line and every space counts as one step. Steps up go **forwards** through the alphabet (A, B, C ...). Steps down go **backwards** (... C, B, A).'),

      h('3. A clef tells you which line is which letter'),
      p('Look at the empty staff above: nothing on it says which line is A or which is C. The **clef** at the start of the staff fixes **one** line to **one** letter. Once you know that letter you can **count** to find all the others.'),
      p('There are four clefs in this app. This lesson covers the two most common.'),
      h('The treble clef'),
      p('The **treble clef** curls around the **2nd line from the bottom**, and that line is the note **G**. (That is why it is also called the **G clef**.)'),
      staffBlock(notesOnStaff('treble', [parsePitch('G4')]), 'Treble clef. The note on the 2nd line is G.'),
      h('The bass clef'),
      p('The **bass clef** has two dots that sit either side of the **4th line from the bottom**, and that line is the note **F**. (That is why it is also called the **F clef**.)'),
      staffBlock(notesOnStaff('bass', [parsePitch('F3')]), 'Bass clef. The note on the 4th line is F.'),
      p('Treble clef is used for higher notes (violin, flute, the right hand on the piano). Bass clef is used for lower notes (cello, double bass, the left hand on the piano). Two more clefs, **alto** and **tenor**, are covered in their own lesson: the viola reads alto clef.'),

      h('4. How to name any note: a method you can copy'),
      steps(
        'Find the **clef** at the start of the staff.',
        'Remember the line it fixes: treble clef, the 2nd line is **G**. Bass clef, the 4th line is **F**.',
        'Look at where your note sits: on which line or space?',
        'Starting from that line, **count steps** to your note: every line and every space is one step. Count **up** if your note is higher, **down** if it is lower.',
        'As you count, say the letters of the musical alphabet **forwards** for up and **backwards** for down. The letter you land on is the name of your note.',
      ),
      worked(nameNoteExample('treble', pitch('E', 0, 4))),
      worked(nameNoteExample('treble', pitch('B', 0, 4))),
      worked(nameNoteExample('bass', pitch('A', 0, 2))),
      watch('Do not start counting from the bottom line every time: start from the line the clef fixes. And do not skip spaces. A common slip is to count only the lines.'),
      tip('Notes **above** the staff or **below** it sit on short extra lines called **ledger lines**. You count them in exactly the same way: one step per line or space. They have their own lesson.'),

      h('5. Try it'),
      p('Practice will ask you to name notes. Start with the treble clef and no ledger lines.'),
      practise({ label: 'Practise note names (treble clef, easy)', topics: ['notes'], level: 1, clefs: ['treble'] }),
      list('Next lesson: **Naming notes in treble and bass clef** (more practice, ledger lines, memory tricks).'),
    ],
  },
]
