import {
  NOTE_VALUES,
  type ClefName,
  type Letter,
  clefLabel,
  describeStaffPosition,
  dottedCrotchets,
  lineNotes,
  note,
  noteValue,
  noteValueLabel,
  parsePitch,
  parseTimeSignature,
  pitchClass,
  spaceNotes,
  staffPosition,
  timeSignatureInfo,
  timeSignatureTypeLabel,
} from '../../../theory'
import { noteLabel } from '../../../questions/pitchTools'
import { accidentalCarryExample, enharmonicExample, nameAccidentalExample } from '../builders/accidentals'
import { convertClefExample, guitarSoundingExample, memoryAid, middleCInClefsExample, placeNoteExample, staffLetterRows } from '../builders/clefs'
import { h, list, notesOnStaff, p, practise, remember, staffBlock, steps, table, tip, watch, worked } from '../builders/common'
import { nameNoteExample } from '../builders/notes'
import { REST_LOOKS, beatsText, figuresOnStaff, nameNoteValueExample, nameRestExample, noteBeatsExample, sumValuesExample } from '../builders/rhythm'
import { keyNames, semitoneCountExample, semitoneTableRows, toneOrSemitoneExample } from '../builders/semitones'
import { timeSignatureExample, timeSignatureStaff } from '../builders/timeSignatures'
import type { LibraryLesson } from '../types'

const P = parsePitch
const pitches = (...names: string[]) => names.map(parsePitch)

/** The letters of the lines or spaces of a clef, bottom to top. */
const lettersOf = (clef: ClefName, kind: 'lines' | 'spaces') => (kind === 'lines' ? lineNotes(clef) : spaceNotes(clef)).map((n) => n.letter)
const spaced = (letters: readonly string[]) => letters.join(' ')
const middleCPlace = (clef: ClefName) => describeStaffPosition(staffPosition(P('C4'), clef))

const NOTE_NAMES_LESSON: LibraryLesson = {
  id: 'note-names-treble-bass',
  title: 'Naming notes in treble and bass clef',
  group: 'notes',
  summary: 'Every line and space note in treble and bass clef, how ledger lines work, and a method for naming and placing any note.',
  before: ['reading-music'],
  covers: ['note-name', 'place-note'],
  build: () => [
    p('In this lesson you will learn to **name any note** on a treble or bass clef staff, including notes that sit above or below the five lines. You will also learn the reverse skill: being given a name such as **E4** and drawing the note in the right place.'),
    p('Every method here is a counting method. You will not need to memorise much, because you can always count your way to the answer.'),

    h('What you need to know first'),
    p('The **staff** is five lines with four spaces between them. We count the lines and spaces **from the bottom up**: the bottom line is the 1st line, the space just above it is the 1st space, then the 2nd line, and so on up to the 5th line at the top.'),
    p('Notes are named with seven letters, the **musical alphabet**: A B C D E F G, then back to A again. Going from a line to the space above it (or from a space to the line above it) is **one step**. One step up is the next letter. One step down is the previous letter.'),
    p('A **clef** fixes one line to one letter. You count from that line to find every other note, so it is the one line to remember for each clef.'),
    list(
      'Treble clef: the **2nd line from the bottom** is **G**.',
      'Bass clef: the **4th line from the bottom** is **F**.',
    ),
    staffBlock(notesOnStaff('treble', pitches('G4')), 'Treble clef, also called the G clef: its curl circles the 2nd line, which is G.'),
    staffBlock(notesOnStaff('bass', pitches('F3')), 'Bass clef, also called the F clef: its two dots sit either side of the 4th line, which is F.'),
    p('This lesson uses plain notes only (no sharps or flats). Those have their own lesson.'),

    h('The line notes and the space notes'),
    p('Start on the line the clef fixes, then count up and down, and you get the letter of every line and space. Here is the whole result, so you can see it all at once. It is listed from the bottom up, the way you count.'),
    table(['Place on the staff', 'Treble clef', 'Bass clef'], staffLetterRows(['treble', 'bass']), 'The letter on every line and every space.'),
    remember(
      `Treble clef: lines **${spaced(lettersOf('treble', 'lines'))}**, spaces **${spaced(lettersOf('treble', 'spaces'))}**. Bass clef: lines **${spaced(lettersOf('bass', 'lines'))}**, spaces **${spaced(lettersOf('bass', 'spaces'))}**. (Each list is from the bottom up.)`,
    ),
    staffBlock(notesOnStaff('treble', lineNotes('treble')), `Treble clef, the five line notes from the bottom: ${spaced(lettersOf('treble', 'lines'))}.`),
    staffBlock(notesOnStaff('treble', spaceNotes('treble')), `Treble clef, the four space notes from the bottom: ${spaced(lettersOf('treble', 'spaces'))}.`),
    staffBlock(notesOnStaff('bass', lineNotes('bass')), `Bass clef, the five line notes from the bottom: ${spaced(lettersOf('bass', 'lines'))}.`),
    staffBlock(notesOnStaff('bass', spaceNotes('bass')), `Bass clef, the four space notes from the bottom: ${spaced(lettersOf('bass', 'spaces'))}.`),

    h('Memory aids'),
    p('Some people like a phrase to help them remember the letters. These are only **memory aids**. They work if you read them from the **bottom** line or space upwards.'),
    list(
      `A memory aid for the treble lines: ${memoryAid('Every Good Boy Deserves Football', lettersOf('treble', 'lines').join(''))}.`,
      `A memory aid for the treble spaces: they spell the word **${lettersOf('treble', 'spaces').join('')}**, from the bottom up.`,
      `A memory aid for the bass lines: ${memoryAid('Good Boys Do Fine Always', lettersOf('bass', 'lines').join(''))}.`,
      `A memory aid for the bass spaces: ${memoryAid('All Cows Eat Grass', lettersOf('bass', 'spaces').join(''))}.`,
    ),
    tip('If you forget an aid, the counting method below always works. Many musicians remember only the lines the clefs fix and a few other notes, and count from the nearest one.'),

    h('Ledger lines'),
    p('The staff has room for nine notes: five on lines and four in spaces. Higher or lower notes need extra room. A **ledger line** is a short extra line, just wide enough for one note, drawn above or below the staff.'),
    p('Count ledger lines **outwards from the staff**. The one nearest the staff is the **1st ledger line**, the next is the **2nd ledger line**, and so on. They are spaced exactly like the staff lines, so every ledger line and every space is still **one step** in the alphabet.'),
    p('Here are the notes just **below** the treble staff, going up. A3 is on the 2nd ledger line, B3 is in the space between the two ledger lines, C4 is on the 1st ledger line, D4 is in the space just below the staff, and E4 is on the bottom line.'),
    staffBlock(notesOnStaff('treble', pitches('A3', 'B3', 'C4', 'D4', 'E4')), 'Treble clef, from below the staff: A3, B3, C4, D4, E4.'),
    p('And the notes just **above** the treble staff. F5 is on the top line, G5 is in the space above it, A5 is on the 1st ledger line above, B5 is in the space above that, and C6 is on the 2nd ledger line above.'),
    staffBlock(notesOnStaff('treble', pitches('F5', 'G5', 'A5', 'B5', 'C6')), 'Treble clef, above the staff: F5, G5, A5, B5, C6.'),
    p('Bass clef works the same way. Here are notes just above the bass staff, and just below it.'),
    staffBlock(notesOnStaff('bass', pitches('A3', 'B3', 'C4', 'D4', 'E4')), 'Bass clef, above the staff: A3 (top line), B3, C4, D4, E4.'),
    staffBlock(notesOnStaff('bass', pitches('C2', 'D2', 'E2', 'F2', 'G2')), 'Bass clef, below the staff: C2, D2, E2, F2, then G2 on the bottom line.'),
    remember('The space just above the top line (or just below the bottom line) is **not** a ledger line. It is a space. The 1st ledger line is one step further out.'),

    h('Middle C'),
    p(`**Middle C** is the C nearest the middle of a piano keyboard. It sits between the two clefs, so each clef has to reach for it with a ledger line. In treble clef it is on **${middleCPlace('treble')}**. In bass clef it is on **${middleCPlace('bass')}**.`),
    staffBlock(notesOnStaff('treble', pitches('C4')), 'Middle C in treble clef: on the 1st ledger line below the staff.'),
    staffBlock(notesOnStaff('bass', pitches('C4')), 'Middle C in bass clef: on the 1st ledger line above the staff.'),

    h('Octave numbers: C4 is middle C'),
    p('The same letter name appears many times on a piano. An **octave** is the gap from one note to the next note with the same letter name, for example from one C up to the next C. The two notes sound alike, one higher than the other.'),
    p('To tell the octaves apart we write a number after the letter: **C4**, **A3**, **E5**. **Middle C is C4.** The number goes up by one **each time you pass a C** going up:'),
    p('**G3, A3, B3, C4, D4, E4, F4, G4, A4, B4, C5, D5 ...**'),
    p('So the note just below middle C is **B3**, and the number only changes when you reach the next C. In Practice, the "place a note" questions add a reminder: "Middle C is C4".'),
    staffBlock(notesOnStaff('treble', pitches('E4', 'E5')), 'Same letter, different octave, different place: E4 is on the bottom line and E5 is in the top space.'),

    h('The method: naming any note'),
    steps(
      'Find the **clef** and remember the line it fixes: treble clef, the 2nd line is **G**. Bass clef, the 4th line is **F**.',
      'Look at where your note sits. Is it on a line or in a space? If it is outside the staff, count the ledger lines out from the staff.',
      'Count the **steps** from that line to your note. Every line and every space is one step. Count **up** if your note is higher than that line and **down** if it is lower.',
      'Say the letters as you count: **forwards** through the alphabet when you go up, **backwards** when you go down.',
      'The last letter you say is the name of the note. Check it against the tables above.',
    ),
    tip('You can also count from middle C, which is one of the best-known notes: treble clef, 1st ledger line below. Bass clef, 1st ledger line above.'),

    h('Worked examples: naming notes'),
    p('Each example shows every step. Follow one all the way through, then cover the answer and try the next.'),
    worked(nameNoteExample('treble', P('C5'))),
    worked(nameNoteExample('bass', P('D3'))),
    p('Now notes that need ledger lines. Count them in exactly the same way.'),
    worked(nameNoteExample('treble', P('A5'))),
    worked(nameNoteExample('treble', P('C4'))),
    worked(nameNoteExample('treble', P('A3'))),
    worked(nameNoteExample('bass', P('C4'))),
    worked(nameNoteExample('bass', P('E2'))),

    h('Placing a note on the staff'),
    p('Practice also asks the reverse. It gives you a name such as **E4** and you **tap where the note goes**. The skill is the same, run backwards: you count from the line the clef fixes to the letter you are given, and then walk the same number of steps up or down the staff.'),
    p('The octave number matters, because the same letter appears in many places. Counting with the octave number tells you which one.'),
    steps(
      'Read the name: the **letter** and the **octave number**.',
      'Find the line the clef fixes, with its octave number: treble clef G4 (2nd line), bass clef F3 (4th line).',
      'Count from that line to your letter, one letter at a time. Add 1 to the octave number each time you pass a **C** going up. Take 1 off each time you step down from a **C**. Stop when you have the right letter **and** the right octave number.',
      'Take the **same number of steps** on the staff, in the same direction, one line or space at a time. Where you stop is the place for your note.',
      'If the place is above or below the staff, draw the **ledger lines** you need, counting outwards from the staff.',
      'Draw the note head **centred**: the line passes through the middle of the head, or the head fills the space.',
    ),
    worked(placeNoteExample('treble', P('C4'))),
    worked(placeNoteExample('bass', P('A2'))),
    worked(placeNoteExample('treble', P('D5'))),

    h('Common mistakes'),
    watch('**Skipping spaces.** Every line **and** every space is a step. Counting only the lines gives the wrong letter.'),
    watch('**Forgetting which clef you are in.** The same place on the staff is a different note in each clef. The bottom line is E in treble clef but G in bass clef. Look at the clef first.'),
    watch('**Starting from the bottom line every time.** Start from the line the clef fixes (or from middle C). It is much shorter.'),
    watch('**Counting the space above the top line as a ledger line.** The first step above the top line is a space. The 1st ledger line is the step after that.'),
    watch('**Changing the octave number at A.** The number changes at **C**. B3 is just below C4, and A4 is just below B4.'),
    watch('**Drawing the note half-way between a line and a space.** A note on a line has the line through the middle of its head. A note in a space sits between two lines. Half-way is unreadable.'),
    watch('**Reading a memory aid from the top.** The aids give the letters from the bottom up. Read from the top and every letter is wrong.'),

    h('Try it'),
    p('Start with the treble and bass clefs on the easy level, then try the medium level when you can name most notes without counting.'),
    practise({ label: 'Practise note names (treble and bass, easy)', topics: ['notes'], level: 1, clefs: ['treble', 'bass'] }),
    practise({ label: 'Practise notes (treble and bass, medium)', topics: ['notes'], level: 2, clefs: ['treble', 'bass'] }),
    list('Next lesson: **Alto and tenor clefs**.'),
  ],
}

const ALTO_TENOR_LESSON: LibraryLesson = {
  id: 'alto-tenor-clefs',
  title: 'Alto and tenor clefs',
  group: 'notes',
  summary: 'How the two C clefs point at middle C, why they exist, and how to name any note in alto and tenor clef.',
  before: ['note-names-treble-bass'],
  covers: ['note-name'],
  build: () => [
    p('Treble and bass are not the only clefs. The **alto clef** and the **tenor clef** are two more. Together they are called the **C clefs**, because each one tells you where **middle C** is.'),
    p('The **viola** reads alto clef. Cellos, bassoons and trombones usually read bass clef, but they switch to tenor clef for their higher notes. That keeps the notes on the staff and avoids a pile of ledger lines.'),
    p('You count in alto and tenor clef exactly as you do in treble and bass. Only the line the clef fixes is different.'),

    h('What you need to know first'),
    p('The **staff** has five lines and four spaces, counted **from the bottom up**. Notes are named with the letters A B C D E F G, and every line and space is one step: up the staff is forwards in the alphabet, down is backwards.'),
    p('A **ledger line** is a short extra line for a note above or below the staff. You count ledger lines outwards from the staff.'),
    p('**Middle C** is the C nearest the middle of a piano. Its full name is **C4** (the 4 is the octave number, which goes up by one each time you pass a C). A clef fixes one line to one note that you count from. The C clefs fix a line to middle C, which is why they are called C clefs.'),

    h('The facts'),
    p('The C clef sign is a pair of curves joined to a vertical bar. The two curves meet at a point in the **centre of the sign**, and that **point is aimed at a line: that line is middle C**. The sign is the same in alto and tenor clef. The only difference is which line it points at.'),
    table(
      ['Clef', 'Middle C is on', 'Used for'],
      [
        ['Alto clef', 'the middle line (the 3rd line)', 'viola'],
        ['Tenor clef', 'the 4th line from the bottom', 'high notes of cello, bassoon and trombone'],
      ],
      'Where the C clefs point.',
    ),
    staffBlock(notesOnStaff('alto', pitches('C4')), 'Alto clef. The clef points at the middle line, which is middle C (C4).'),
    staffBlock(notesOnStaff('tenor', pitches('C4')), 'Tenor clef. The clef points at the 4th line, which is middle C (C4).'),
    p('Counting from middle C gives you every line and space. Here they all are, from the bottom up:'),
    table(['Place on the staff', 'Alto clef', 'Tenor clef'], staffLetterRows(['alto', 'tenor']), 'The letter on every line and space.'),
    remember(
      `Alto clef: lines **${spaced(lettersOf('alto', 'lines'))}**, spaces **${spaced(lettersOf('alto', 'spaces'))}**. Tenor clef: lines **${spaced(lettersOf('tenor', 'lines'))}**, spaces **${spaced(lettersOf('tenor', 'spaces'))}**. (Each list is from the bottom up.)`,
    ),
    staffBlock(notesOnStaff('alto', lineNotes('alto')), `Alto clef, the line notes from the bottom: ${spaced(lettersOf('alto', 'lines'))}.`),
    staffBlock(notesOnStaff('alto', spaceNotes('alto')), `Alto clef, the space notes from the bottom: ${spaced(lettersOf('alto', 'spaces'))}.`),
    staffBlock(notesOnStaff('tenor', lineNotes('tenor')), `Tenor clef, the line notes from the bottom: ${spaced(lettersOf('tenor', 'lines'))}.`),
    staffBlock(notesOnStaff('tenor', spaceNotes('tenor')), `Tenor clef, the space notes from the bottom: ${spaced(lettersOf('tenor', 'spaces'))}.`),

    h('Middle C in all four clefs'),
    p('Middle C is the same sound in every clef. Only its place on the staff changes. Look at where each clef puts it:'),
    staffBlock(notesOnStaff('treble', pitches('C4')), `Treble clef: ${middleCPlace('treble')}.`),
    staffBlock(notesOnStaff('bass', pitches('C4')), `Bass clef: ${middleCPlace('bass')}.`),
    staffBlock(notesOnStaff('alto', pitches('C4')), `Alto clef: ${middleCPlace('alto')}.`),
    staffBlock(notesOnStaff('tenor', pitches('C4')), `Tenor clef: ${middleCPlace('tenor')}.`),

    h('How alto compares with treble and bass'),
    p('Here is the same table with all four clefs side by side. Look along a row: it is one place on the staff, and the letter in each clef.'),
    table(['Place', 'Treble', 'Alto', 'Bass', 'Tenor'], staffLetterRows(['treble', 'alto', 'bass', 'tenor']), 'The same place on the staff, read in each clef.'),
    p('Two patterns you can check in every row. Alto has the letter **one step further on** in the alphabet than treble (bottom line: treble E, alto F). Alto has the letter **one step back** from bass (bottom line: bass G, alto F).'),
    tip('This pattern is only a way to check a **letter**. It does not tell you the octave, because the notes are at different heights. For a safe answer, count from middle C.'),

    h('The method: naming a note in alto or tenor clef'),
    steps(
      'Look at the clef sign. Which line does its **centre point at**? In alto clef it is the middle line. In tenor clef it is the 4th line.',
      'That line is **middle C**. This is the line you count from.',
      'Look at where your note sits, and count the **steps** from middle C to the note. Every line and every space is one step. Count **up** if the note is higher, **down** if it is lower.',
      'Say the letters as you count: forwards through the alphabet going up, backwards going down.',
      'The last letter you say is the name of the note. Check it against the table.',
    ),

    h('Worked examples: alto clef'),
    worked(nameNoteExample('alto', P('B3'))),
    worked(nameNoteExample('alto', P('E4'))),
    worked(nameNoteExample('alto', P('F3'))),
    p('Now a note above the staff, on a ledger line:'),
    worked(nameNoteExample('alto', P('B4'))),

    h('Worked examples: tenor clef'),
    worked(nameNoteExample('tenor', P('A3'))),
    worked(nameNoteExample('tenor', P('E4'))),
    p('And one on a ledger line:'),
    worked(nameNoteExample('tenor', P('G4'))),

    h('Common mistakes'),
    watch('**Reading alto clef as if it were treble clef.** The same place on the staff is a different letter. For example, the bottom line is E in treble clef and F in alto clef.'),
    watch('**Counting from the wrong line.** In alto clef middle C is the **middle** line. In tenor clef it is the **4th** line. Check where the centre of the clef points before you count.'),
    watch('**Mixing up alto and tenor.** The sign is the same. Only the line it points at is different.'),
    watch('**Counting from the bottom line.** You can, but it is long. Start from middle C.'),

    h('Try it'),
    practise({ label: 'Practise alto clef note names (easy)', topics: ['notes'], level: 1, clefs: ['alto'] }),
    practise({ label: 'Practise tenor clef note names (easy)', topics: ['notes'], level: 1, clefs: ['tenor'] }),
    list('Next lesson: **Sharps, flats and naturals**.'),
  ],
}

const ACCIDENTALS_LESSON: LibraryLesson = {
  id: 'accidentals',
  title: 'Sharps, flats and naturals',
  group: 'notes',
  summary: 'What sharps, flats and naturals do, how long a sign lasts in a bar, and why F♯ and G♭ are two names for one sound.',
  before: ['note-names-treble-bass'],
  covers: ['note-accidental'],
  build: () => [
    p('So far every note has had a plain letter name. But there are more sounds than seven letters. Between most of the letter names there is another note. We write those notes with a sign in front of the note, called an **accidental**.'),
    p('There are five signs: the **sharp**, the **flat**, the **natural**, the **double sharp** and the **double flat**.'),

    h('What you need to know first'),
    p('You need to be able to name a note with no sharp or flat on the staff by counting from the line the clef fixes (see **Naming notes in treble and bass clef**).'),
    p('A **semitone** is the smallest step in Western music: from one piano key to the very next key, whether black or white. A **tone** is two semitones. The plain letter names are the white keys, and the notes in between are the black keys. (The lesson **Tones and semitones** goes into this properly.)'),

    h('The five signs'),
    table(
      ['Sign', 'What it does', 'In a name'],
      [
        ['♯ sharp', 'raises the note by 1 semitone', 'F♯'],
        ['♭ flat', 'lowers the note by 1 semitone', 'B♭'],
        ['♮ natural', 'cancels a sharp or flat: back to the plain note', 'F (plain)'],
        ['double sharp (a small cross)', 'raises the note by 2 semitones (one tone)', 'F♯♯'],
        ['double flat (two flats)', 'lowers the note by 2 semitones (one tone)', 'B♭♭'],
      ],
      'The accidentals. In this app a double sharp or flat is written in a name as two signs.',
    ),
    remember('A **sharp** raises a note by one semitone. A **flat** lowers it by one semitone. A **natural** cancels a sharp or flat and gives the plain note.'),
    p('A plain note with no sign is also called a **natural** note. The natural **sign** is what you write when you need to cancel an earlier sharp or flat.'),
    staffBlock(notesOnStaff('treble', pitches('F#4', 'Bb4')), 'F♯4 and B♭4. The sign sits in front of the note head.'),
    staffBlock(notesOnStaff('treble', pitches('F#4', 'F4')), 'F♯4 followed by F4: the natural sign cancels the sharp.'),
    staffBlock(notesOnStaff('treble', pitches('F##4', 'Bbb4')), 'A double sharp (F♯♯4) and a double flat (B♭♭4).'),

    h('Where the sign goes'),
    p('The sign goes **in front of** the note head, on the **same line or in the same space** as the note. It never changes where the note sits on the staff. It only changes how the note sounds.'),
    p('In a name, the order is the other way round: you say the letter first and the sign second. A note with a sharp in front of the head is **F sharp**, written **F♯**.'),

    h('How long a sign lasts'),
    list(
      'A sign lasts until the **end of the bar** (the next bar line).',
      'It applies only to notes of the **same pitch**: the same letter **and** the same octave. A ♯ on F4 does not change F5.',
      'To go back to the plain note before the bar ends, write a **natural** sign.',
      'At the next bar line everything starts again as if no sign had been written.',
    ),
    p('This lesson has no key signatures. (A **key signature** is a set of sharps or flats at the start of the music that applies to the whole piece. It has its own lesson.)'),
    p('The example below follows one bar note by note and says whether a sign is printed, and why.'),
    worked(accidentalCarryExample(pitches('F#4', 'G4', 'F#4', 'F#5', 'F4', 'F4'))),
    worked(accidentalCarryExample(pitches('Bb4', 'D5', 'Bb4', 'B4', 'B4'))),

    h('Naming a note that has a sign'),
    steps(
      'Ignore the sign for now. Find the **letter** by counting from the line the clef fixes, as in the earlier lessons.',
      'Look at the sign in front of the note: ♯, ♭, a double sign, or ♮.',
      'Write the **letter first, then the sign**: for example F♯.',
      'Check: is the sign on the same line or space as the note head? Then the sign belongs to that note.',
    ),
    worked(nameAccidentalExample('treble', P('C#5'))),
    worked(nameAccidentalExample('bass', P('Bb2'))),
    p('Double signs work the same way. The only difference is that the note moves by two semitones.'),
    worked(nameAccidentalExample('treble', P('F##4'))),

    h('Two names for one sound'),
    p('Look at a piano. The black key between F and G is **one semitone above F**, and it is also **one semitone below G**. So it has two names: **F♯** and **G♭**. Notes that sound the same but have different names are called **enharmonic equivalents**.'),
    p('Each of the five black keys in an octave has two names:'),
    table(
      ['Sharp name', 'Flat name'],
      [1, 3, 6, 8, 10].map((n) => keyNames(n).split('/')),
      'The five black keys, each with two names.',
    ),
    p('A white key can have another name too. For example **B♯** is the same key as **C**, and **F♭** is the same key as **E**. These are less common, but they do exist.'),
    p('So which name do you write? The scale or key you are in decides. A scale uses **each letter once**, so you choose the name whose letter the scale needs.'),
    worked(enharmonicExample(P('F#4'), P('Gb4'), note('D'), note('D', -1))),
    worked(enharmonicExample(P('C#4'), P('Db4'), note('A'), note('A', -1))),

    h('Common mistakes'),
    watch('**Thinking the sign changes the place on the staff.** The note stays on its line or space. The sign only changes the sound.'),
    watch('**Writing the sign after the note.** In the picture the sign is in front of the note head. (In the name, the sign comes after the letter: F♯.)'),
    watch('**Thinking a sign lasts for the whole piece.** It lasts for the rest of the **bar**, and only for the **same octave**.'),
    watch('**Thinking a ♯ on F4 also changes F5.** F5 is a different pitch, so it needs its own sign.'),
    watch('**Thinking the natural sign is a kind of sharp.** It cancels a sharp or flat. It gives you back the plain note.'),
    watch('**Choosing F♯ or G♭ at random.** They sound the same, but a scale needs each letter once. Check which letter the scale is missing.'),

    h('Try it'),
    practise({ label: 'Practise sharps and flats (treble and bass, easy)', topics: ['notes'], level: 1, clefs: ['treble', 'bass'] }),
    practise({ label: 'Practise sharps, flats and double signs (medium)', topics: ['notes'], level: 2, clefs: ['treble', 'bass', 'alto'] }),
    list('Next lesson: **Octaves, middle C and different clefs**.'),
  ],
}

const OCTAVES_LESSON: LibraryLesson = {
  id: 'octaves-and-instruments',
  title: 'Octaves, middle C and different clefs',
  group: 'notes',
  summary: 'Octave numbers, how to write the same pitch in another clef, and what written and sounding pitch mean for guitar and viola.',
  before: ['alto-tenor-clefs'],
  covers: ['clef-compare'],
  build: () => [
    p('The same note can be written in different clefs, and the same letter name can be found at different heights. This lesson joins those two ideas. By the end you will be able to take a note in one clef and write the **same pitch** in another clef.'),
    p('You will also see why the pitch you read is not always the pitch you hear, using the guitar as an example.'),

    h('What you need to know first'),
    list(
      'Every clef fixes one line you count from: treble clef, the 2nd line is **G**. Bass clef, the 4th line is **F**. Alto clef, the middle line is **middle C**. Tenor clef, the 4th line is **middle C**.',
      'Every line and every space is one step. Count up through the alphabet A B C D E F G for higher notes and down for lower notes.',
      'A **ledger line** is a short extra line for a note above or below the staff.',
    ),
    p('**Pitch** means how high or low a note sounds.'),

    h('Octaves and octave numbers'),
    p('An **octave** is the gap from one note to the next note with the same letter name, such as from one C up to the next C. The two notes sound alike, one higher than the other. An octave is **12 semitones** (a **semitone** is the step from one piano key to the very next key).'),
    p('To say exactly which C (or which A, which F) you mean, we put a number after the letter. These are called **octave numbers**. **Middle C is C4.** The number goes up by one **each time you pass a C**, going up:'),
    p('**C4  D4  E4  F4  G4  A4  B4  then C5 ...**'),
    staffBlock(notesOnStaff('treble', pitches('C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5')), 'From middle C (C4) up to C5. The octave number changes at C, and only at C.'),
    remember('The octave number changes at **C**, not at A. The note just below C4 is **B3**. The note just above B4 is **C5**.'),
    p('A pitch is fixed by its **letter and its octave number together**. E4 and E5 have the same letter but they are different pitches, one octave apart.'),
    p('The viola\'s lowest string is the open C string, which is **C3**, the C one octave below middle C. The app\'s own viola range runs from C3 up to **A5**. The bottom, C3, is a fact about the instrument. The top, A5, is a limit **chosen for this app** to keep questions easy to read. It is **not** the highest note a viola can play.'),

    h('Where middle C sits in each clef'),
    table(
      ['Clef', 'Middle C (C4) is on'],
      (['treble', 'bass', 'alto', 'tenor'] as const).map((clef) => [clefLabel(clef), middleCPlace(clef)]),
      'The same pitch, four different places.',
    ),
    worked(middleCInClefsExample()),

    h('The same place is a different note in a different clef'),
    remember('The **same place** on the staff is a **different pitch** in a different clef. To write the same pitch in another clef, keep the **letter and the octave number** and move the note to wherever that pitch lives in the new clef.'),
    p('Practice shows this as two staves, one above the other, and asks whether the two notes are the same pitch. Sometimes they sit in the same place on the staff but are different notes. Sometimes they are in different places and are the same note. The method below always gives the right answer.'),

    h('The method: writing a note in another clef'),
    steps(
      'Name the note in the first clef, with its **octave number**. Count from the line that clef fixes, adding 1 to the octave number each time you pass a C going up (or taking 1 off each time you step down from a C).',
      'Keep that name. It is the pitch, and it does not change.',
      'Go to the new clef. Find the line it fixes and that note\'s octave number.',
      'Count from that line to your note, again changing the octave number at each C. Stop at the right letter **and** the right octave number.',
      'Take the same number of steps on the staff. Draw ledger lines if the place is outside the staff.',
      'Check: name your new note with the naming method. You should get the same letter and the same octave number.',
    ),
    worked(convertClefExample(P('E4'), 'alto', 'treble')),
    worked(convertClefExample(P('A3'), 'bass', 'treble')),
    worked(convertClefExample(P('A4'), 'treble', 'alto')),

    h('Written pitch and sounding pitch'),
    p('Usually the note you read is the note you hear. Some instruments are different: the music is written at one height and the instrument sounds at another. The **written pitch** is what is on the page. The **sounding pitch** is what you hear.'),
    p('The **guitar** sounds **one octave lower** than it is written. Guitar music is written in treble clef. A written E4 sounds as E3: same letter, one octave number lower.'),
    worked(guitarSoundingExample(P('E4'))),
    worked(guitarSoundingExample(P('C5'))),
    p('The **viola** reads alto clef, and what you read is what you hear. Its four open strings are C3, G3, D4 and A4. This is how they look in alto clef. The lowest, C3, sits below the staff.'),
    staffBlock(notesOnStaff('alto', pitches('C3', 'G3', 'D4', 'A4')), 'The four open strings of a viola in alto clef: C3, G3, D4, A4.'),

    h('Common mistakes'),
    watch('**Copying the place on the staff.** A note on the middle line is C in alto clef but B in treble clef. Always name the note first, then place it again.'),
    watch('**Changing the letter when you change clef.** The letter and the octave number stay the same. Only the place on the staff changes.'),
    watch('**Forgetting the octave number changes at C.** Counting down from G4 to B3 crosses C, so the number drops from 4 to 3 on the way.'),
    watch('**Getting the guitar direction wrong.** The guitar sounds **lower** than written, not higher.'),

    h('Try it'),
    p('The "Are these two notes the same pitch?" questions use two staves in different clefs. Choose two or more clefs to get them.'),
    practise({ label: 'Practise comparing clefs (all clefs, medium)', topics: ['notes'], level: 2, clefs: ['treble', 'bass', 'alto', 'tenor'] }),
    list('Next lesson: **Note and rest values**.'),
  ],
}

const NAME_FOR_BEATS = ['semibreve', 'minim', 'crotchet', 'quaver'] as const

const NOTE_REST_VALUES_LESSON: LibraryLesson = {
  id: 'note-rest-values',
  title: 'Note and rest values',
  group: 'rhythm',
  summary: 'The names and shapes of notes and rests, how long each lasts in beats, and how dots make a note longer.',
  before: ['reading-music'],
  covers: ['note-value', 'rest-value', 'note-beats'],
  build: () => [
    p('The **position** of a note on the staff tells you its pitch (how high or low it is). Its **shape** tells you its length: how long to hold it. A **rest** tells you how long to stay silent.'),
    p('This lesson is about shapes, names and lengths. You will learn to name any note or rest, and to work out how many beats it lasts.'),

    h('What you need to know first'),
    p('A **beat** is the steady pulse in music, like the ticking of a clock or the tapping of a foot. Beats are not a fixed number of seconds: in fast music they are quick and in slow music they are slow. Note lengths are measured **in beats**.'),
    p('In this lesson one **crotchet** lasts one beat. We call that a **crotchet beat**, and measure every other note against it.'),

    h('The five note values'),
    p('Each note value has a name. These are the British names, which this app uses. (The American names are in brackets once, here.)'),
    table(
      ['Name', 'American name', 'Crotchet beats'],
      NOTE_VALUES.map((v) => [v.name, v.american, beatsText(v.crotchets)]),
      'The five note values and how long each lasts.',
    ),
    staffBlock(figuresOnStaff(NOTE_VALUES.map((v) => ({ name: v.name }))), 'From the left: semibreve, minim, crotchet, quaver, semiquaver.'),

    h('The parts of a note'),
    list(
      'The **head** is the oval part. It is either **hollow** (white) or **filled in** (black).',
      'The **stem** is the straight line that rises from the head or hangs down from it. Which way it points makes no difference to the length.',
      'A **flag** is a little tail on the end of the stem. Each flag makes the note shorter.',
    ),
    p('When several quavers or semiquavers stand next to each other, their flags are often joined into a thick line called a **beam**. A beam does the same job as flags: one beam means quavers, two beams mean semiquavers. The pictures in this app draw flags.'),
    table(
      ['Note', 'How to recognise it'],
      [
        ['semibreve', 'a hollow head with no stem'],
        ['minim', 'a hollow head with a stem'],
        ['crotchet', 'a filled-in head with a stem'],
        ['quaver', 'a filled-in head with a stem and one flag'],
        ['semiquaver', 'a filled-in head with a stem and two flags'],
      ],
      'Head, stem and flags.',
    ),

    h('The family tree: each is half the one before'),
    p('Start with the **semibreve**, the longest. Each note after it lasts **half as long** as the one before.'),
    table(
      ['Note', 'Crotchet beats', 'How many fit in a semibreve'],
      NOTE_VALUES.map((v) => [v.name, beatsText(v.crotchets), String(16 / v.semiquavers)]),
      'Halving each time: 4, 2, 1, ½, ¼.',
    ),
    remember('Each note is **half** the one before it: semibreve **4** beats, minim **2**, crotchet **1**, quaver **½**, semiquaver **¼**. More flags means a **shorter** note.'),

    h('Rests'),
    p('A **rest** is a sign for **silence**. You do not play, but you keep counting. Every note value has a rest of the **same length**: a minim rest lasts as long as a minim.'),
    table(
      ['Rest', 'How to recognise it', 'Beats'],
      NOTE_VALUES.map((v) => [`${v.name} rest`, REST_LOOKS[v.name], beatsText(v.crotchets)]),
      'The five rests.',
    ),
    staffBlock(figuresOnStaff(NOTE_VALUES.map((v) => ({ name: v.name, rest: true }))), 'From the left: semibreve rest, minim rest, crotchet rest, quaver rest, semiquaver rest.'),

    h('Dots make a note longer'),
    p('A **dot** written just after a note head makes the note **half as long again**. It adds **half of the note\'s own length**.'),
    table(
      ['Dotted note', 'Plain length', 'The dot adds', 'Total beats'],
      NAME_FOR_BEATS.map((name) => {
        const plain = noteValue(name).crotchets
        return [noteValueLabel(name, 1), beatsText(plain), beatsText(plain / 2), beatsText(dottedCrotchets(name, 1))]
      }),
      'One dot: add half.',
    ),
    staffBlock(figuresOnStaff([{ name: 'minim', dots: 1 }, { name: 'crotchet', dots: 1 }, { name: 'quaver', dots: 1 }]), 'A dotted minim, a dotted crotchet and a dotted quaver.'),
    p('A **double dot** is two dots. The second dot adds **half of what the first dot added**.'),
    list(
      ...(['semibreve', 'minim', 'crotchet'] as const).map((name) => {
        const plain = noteValue(name).crotchets
        return `A double-dotted ${name} = ${beatsText(plain)} + ${beatsText(plain / 2)} + ${beatsText(plain / 4)} = ${beatsText(dottedCrotchets(name, 2))} beats.`
      }),
    ),
    staffBlock(figuresOnStaff([{ name: 'minim', dots: 2 }, { name: 'crotchet', dots: 2 }]), 'A double-dotted minim and a double-dotted crotchet.'),
    p('Dots work the same way after a rest. A dotted crotchet rest lasts 1½ beats.'),

    h('The method: how many beats is this note worth?'),
    steps(
      'Name the note by its **head, stem and flags**.',
      'Write its **plain length**: semibreve 4, minim 2, crotchet 1, quaver ½, semiquaver ¼.',
      'Look just after the head for **dots**. No dot: you are done.',
      'The **first dot** adds half of the plain length. The **second dot** adds half of what the first dot added.',
      '**Add** the plain length and the dot amounts.',
      'Check a different way. A dotted note lasts as long as the note **plus the next shorter note** (dotted minim = minim + crotchet).',
    ),
    tip('To add up a run of notes, find the beats of each one with this method and then add them from left to right. A rest counts the same as the note with the same name.'),

    h('Worked examples: naming'),
    worked(nameNoteValueExample('quaver')),
    worked(nameNoteValueExample('minim', 1)),
    worked(nameRestExample('crotchet')),
    p('These two rests are the ones people mix up most. Look at where the block sits.'),
    worked(nameRestExample('semibreve')),
    worked(nameRestExample('minim')),

    h('Worked examples: counting beats'),
    worked(noteBeatsExample('minim', 0)),
    worked(noteBeatsExample('crotchet', 1)),
    worked(noteBeatsExample('minim', 2)),
    worked(noteBeatsExample('quaver', 1)),

    h('Worked examples: adding a run of values'),
    worked(sumValuesExample([{ name: 'minim' }, { name: 'crotchet', dots: 1 }, { name: 'quaver' }])),
    worked(sumValuesExample([{ name: 'crotchet' }, { name: 'minim', rest: true }, { name: 'crotchet' }])),

    h('Common mistakes'),
    watch('**Thinking a dot adds one beat.** A dot adds **half of the note**. A dotted crotchet is 1½ beats, not 2. A dotted minim is 3 beats (2 + 1), not 4.'),
    watch('**Forgetting to look for the dot.** A dot is small and sits just after the head. Always check before you answer.'),
    watch('**Thinking more flags means longer.** More flags means **shorter**. A quaver is ½ a beat, and a semiquaver is ¼.'),
    watch('**Mixing up the minim rest and the semibreve rest.** The semibreve rest is a small block **hanging below** a line. The minim rest is a small block **sitting on top of** a line.'),
    watch('**Thinking the place on the staff changes the length.** It does not. A crotchet is one beat on any line or space.'),
    watch('**Not counting rests.** A rest is silence, but it still takes time. You keep counting through it.'),

    h('Try it'),
    practise({ label: 'Practise note values and rests (easy)', topics: ['rhythm'], level: 1 }),
    practise({ label: 'Practise dotted notes and beats (medium)', topics: ['rhythm'], level: 2 }),
    list('Next lesson: **Time signatures: counting the beat**.'),
  ],
}

const TIME_SIGNATURES = ['2/4', '2/2', '3/4', '3/8', '3/2', '4/4', '6/8', '6/4', '9/8', '12/8'].map(parseTimeSignature)
const TYPE_ORDER = ['simple duple', 'simple triple', 'simple quadruple', 'compound duple', 'compound triple', 'compound quadruple']
const tsText = (beats: number, unit: number) => `${beats}/${unit}`

const TIME_SIGNATURES_LESSON: LibraryLesson = {
  id: 'time-signatures',
  title: 'Time signatures: counting the beat',
  group: 'rhythm',
  summary: 'What the two numbers of a time signature mean, how simple and compound time are counted, and how to name a type and fill a bar.',
  before: ['note-rest-values'],
  covers: ['time-sig-beats', 'time-sig-type'],
  build: () => [
    p('Music is cut into equal pieces called **bars** (American English: measures). A **bar line** is the thin vertical line that marks the end of a bar. The **time signature** is the pair of numbers at the start of the music. It tells you how many beats there are in each bar, and which note value is one beat.'),
    staffBlock(timeSignatureStaff(parseTimeSignature('3/4'), []), 'A time signature: here, 3/4. It is two numbers one above the other. It is not a fraction.'),

    h('What you need to know first'),
    p('A **beat** is the steady pulse of the music, the thing you tap your foot to. Note lengths are measured in beats:'),
    list(
      'A **crotchet** is **1** beat. A **minim** is **2**. A **semibreve** is **4**.',
      'A **quaver** is **½** a beat. A **semiquaver** is **¼**.',
      'A **dot** after a note adds half of the note\'s own length: a dotted crotchet is 1½ beats.',
    ),

    h('The two numbers'),
    p('The **top number** is about how many beats are in a bar. The **bottom number** says which note value is one beat. The bottom number is **not** a count. It is a note value:'),
    table(
      ['Bottom number', 'Note that is one unit', 'Why'],
      [
        ['2', 'minim', '2 minims fit in a semibreve'],
        ['4', 'crotchet', '4 crotchets fit in a semibreve'],
        ['8', 'quaver', '8 quavers fit in a semibreve'],
        ['16', 'semiquaver', '16 semiquavers fit in a semibreve'],
      ],
      'What the bottom number means.',
    ),
    remember('**Top number**: how many units in a bar (simple time: the beats). **Bottom number**: which note value is one unit: 2 minim, 4 crotchet, 8 quaver, 16 semiquaver.'),

    h('Simple time'),
    p('In **simple time** the top number is **2, 3 or 4**. The top number is the number of beats in the bar, and **each beat splits into two**. A crotchet beat splits into two quavers, for example.'),
    p('Count the beats aloud, with "&" (say "and") for the half-way point of each beat:'),
    list(
      '2/4: **1** & **2** &',
      '3/4: **1** & **2** & **3** &',
      '4/4: **1** & **2** & **3** & **4** &',
    ),
    p('4/4 is also written as a letter **C**, which is called **common time**.'),
    staffBlock(timeSignatureStaff(parseTimeSignature('3/4'), [{ name: 'crotchet' }, { name: 'crotchet' }, { name: 'crotchet' }]), 'A bar of 3/4: three crotchet beats. Count 1 2 3.'),

    h('Compound time'),
    p('In **compound time** the top number is **6, 9 or 12**. Here **each beat splits into three**, so the notes are counted in **groups of three**. The main beat is a **dotted note**.'),
    p('Take **6/8**. The bottom number 8 means quavers, so a bar has six quavers. They are grouped in threes: 3 + 3. Three quavers last as long as a **dotted crotchet**, so a bar of 6/8 has **two main beats**, each a dotted crotchet.'),
    table(
      ['Time signature', 'Quavers in the bar', 'Main beats', 'One beat is a'],
      ['6/8', '9/8', '12/8'].map((t) => {
        const ts = parseTimeSignature(t)
        const info = timeSignatureInfo(ts)
        return [t, String(ts.beats), String(info.pulses), info.pulseNote]
      }),
      'Compound time with quavers. Divide the top number by 3 to get the main beats.',
    ),
    remember('In compound time **divide the top number by 3** to get the number of main beats: 6/8 has 2, 9/8 has 3, 12/8 has 4.'),
    staffBlock(
      timeSignatureStaff(parseTimeSignature('6/8'), [{ name: 'crotchet', dots: 1 }, { name: 'crotchet', dots: 1 }]),
      'A bar of 6/8: two dotted crotchets, so two main beats.',
    ),
    p('Some people count all six quavers in 6/8 as **1** 2 3 **4** 5 6, with a stress on 1 and 4. That is a good way to feel it. But the questions in this app ask for the **main beats**, which are "the beats you would tap". In 6/8 that is **2**, not 6.'),

    h('Naming the type: duple, triple, quadruple'),
    p('We name a time signature with two words. The first word says **simple** or **compound**. The second says how many main beats there are in a bar: **2** is **duple**, **3** is **triple**, **4** is **quadruple**.'),
    table(
      ['Type', 'Main beats', 'Examples'],
      TYPE_ORDER.map((label) => {
        const matching = TIME_SIGNATURES.filter((ts) => timeSignatureTypeLabel(ts) === label)
        return [label, String(timeSignatureInfo(matching[0]!).pulses), matching.map((ts) => tsText(ts.beats, ts.unit)).join(', ')]
      }),
      'The six types, with examples.',
    ),
    steps(
      'Look at the **top number**. If it is **2, 3 or 4**, the time is **simple**. If it is **6, 9 or 12**, the time is **compound**.',
      'Find the **number of main beats**. Simple time: it is the top number. Compound time: divide the top number by 3.',
      'Name the number of beats: **2** is duple, **3** is triple, **4** is quadruple.',
      'Put the two words together: for example **compound duple**.',
    ),

    h('Other time signatures'),
    p('The same recipe works for other bottom numbers. Only the beat note changes. The last column says how long a whole bar is, in crotchet beats.'),
    table(
      ['Time signature', 'Type', 'One beat is a', 'A bar lasts'],
      ['2/2', '3/8', '3/2', '6/4'].map((t) => {
        const ts = parseTimeSignature(t)
        const info = timeSignatureInfo(ts)
        return [t, timeSignatureTypeLabel(ts), info.pulseNote, `${beatsText(info.barSemiquavers / 4)} crotchet beats`]
      }),
      'Four more time signatures.',
    ),
    p('Look at the bar lengths of **3/4** and **6/8**: both last 3 crotchet beats. They are the same length but feel different. 3/4 has three beats that each split into two. 6/8 has two beats that each split into three.'),

    h('Filling a bar'),
    p('A bar must add up **exactly** to the length the time signature gives. The easiest way to check is to measure everything in **semiquavers**, the shortest note in this lesson. Then every sum is whole numbers.'),
    table(
      ['Note', 'Semiquavers'],
      NOTE_VALUES.map((v) => [v.name, String(v.semiquavers)]),
      'Each note in semiquavers. A dot adds half.',
    ),
    remember('**Length of a bar in semiquavers = top number × (16 ÷ bottom number).** 3/4: 3 × 4 = 12. 6/8: 6 × 2 = 12. 4/4: 4 × 4 = 16.'),
    steps(
      'Work out the **length of the bar** in semiquavers.',
      'Write the **length of each note** you want to use in semiquavers (a dot adds half).',
      'Choose notes that **add up exactly** to the bar length.',
      'Check the total equals the bar length. In compound time, also check that the notes fit the groups of three.',
    ),

    h('Worked examples: beats in a bar'),
    worked(timeSignatureExample(parseTimeSignature('3/4'), 'beats')),
    worked(timeSignatureExample(parseTimeSignature('2/2'), 'beats')),
    worked(timeSignatureExample(parseTimeSignature('12/8'), 'beats')),

    h('Worked examples: naming the type'),
    worked(timeSignatureExample(parseTimeSignature('6/8'), 'classify')),
    worked(timeSignatureExample(parseTimeSignature('4/4'), 'classify')),
    worked(timeSignatureExample(parseTimeSignature('9/8'), 'classify')),

    h('Worked examples: filling a bar'),
    worked(timeSignatureExample(parseTimeSignature('3/4'), 'fill', [{ name: 'minim' }, { name: 'crotchet' }])),
    worked(timeSignatureExample(parseTimeSignature('6/8'), 'fill', [{ name: 'crotchet', dots: 1 }, { name: 'quaver' }, { name: 'quaver' }, { name: 'quaver' }])),

    h('Common mistakes'),
    watch('**Answering 6 for the beats in 6/8.** The top number counts **quavers** here. The main beats are the groups of three: 6 ÷ 3 = 2.'),
    watch('**Dividing by 3 in simple time.** Only compound time (6, 9, 12) divides by 3. In 3/4 there are 3 beats, not 1.'),
    watch('**Reading the bottom number as a count.** It is a note value: 4 means crotchet, 8 means quaver.'),
    watch('**Calling 3/8 compound.** Its top number is 3, so it is simple (triple). Compound time needs 6, 9 or 12.'),
    watch('**Forgetting what a dot adds when filling a bar.** A dotted crotchet is 4 + 2 = 6 semiquavers, not 4.'),

    h('Try it'),
    practise({ label: 'Practise time signatures (easy)', topics: ['rhythm'], level: 1 }),
    practise({ label: 'Practise time signatures, including compound time (medium)', topics: ['rhythm'], level: 2 }),
    list('Next lesson: **Tones and semitones**.'),
  ],
}

const TONES_SEMITONES_LESSON: LibraryLesson = {
  id: 'tones-semitones',
  title: 'Tones and semitones',
  group: 'scales-keys',
  summary: 'What tones and semitones are, the twelve notes of an octave numbered from C, and a method to count the semitones between two notes.',
  before: ['accidentals'],
  covers: [],
  build: () => [
    p('The distance between two notes is measured in **semitones** and **tones**. Scales, key signatures and intervals are all built from these small steps. If you know how to count them, much of the rest of music theory becomes counting.'),

    h('What you need to know first'),
    p('A piano keyboard has **white keys** and **black keys**. The white keys are the plain letter names A B C D E F G, which repeat along the keyboard. The black keys are in alternating groups of two and three.'),
    p('A black key has two names. It is the **sharp** of the white key below it and the **flat** of the white key above it. (A **sharp** ♯ raises a note by a semitone. A **flat** ♭ lowers it by a semitone.)'),

    h('Semitones and tones'),
    p('A **semitone** is the distance from one key to the very next key, whatever its colour. It is the smallest step on a piano. A **tone** is **two semitones**: you skip one key.'),
    p('Most pairs of neighbouring white keys have a black key between them, so they are a **tone** apart. But there is **no** black key between **E and F**, and **none between B and C**. Those two pairs are only a **semitone** apart. They are called the **natural semitones**.'),
    table(
      ['Neighbouring letters', 'Distance'],
      'ABCDEFG'.split('').map((letter, i) => {
        const next = 'ABCDEFG'.charAt((i + 1) % 7)
        const gap = (pitchClass(note(next as Letter)) - pitchClass(note(letter as Letter)) + 12) % 12
        return [`${letter} to ${next}`, gap === 1 ? '**1 semitone**' : '1 tone (2 semitones)']
      }),
      'The two natural semitones are B to C and E to F.',
    ),
    remember('The two **natural semitones** are **E to F** and **B to C**. Every other pair of neighbouring letters is a **tone**.'),

    h('The twelve notes of an octave'),
    p('An **octave** is the gap from one note to the next note with the same name (C up to the next C). There are **12 different keys** in an octave, counting white and black. Give each one a number, starting at **C = 0**:'),
    table(['Number', 'Name(s)', 'Key colour'], semitoneTableRows(), 'The twelve notes, numbered from C. The next C would be number 12.'),
    p('Each number is the number of semitones **above C**. After B (11) the next note is C again, one octave higher. That C is number 12.'),

    h('The method: counting semitones between two notes'),
    p('This lesson counts **upwards**, from the first note to the next note with the second name above it.'),
    steps(
      'Look up the **number** of the first note in the table.',
      'Look up the **number** of the second note.',
      'If the second number is **bigger**, subtract: second number − first number.',
      'If the second number is **smaller**, you have passed the next C (number 12). **Add 12** to the second number first, then subtract.',
      'Check by **counting key by key** from the first note. Do **not** count the key you start on. Stop on the second note.',
      'To say it in tones: **2 semitones = 1 tone**. An odd number leaves one extra semitone.',
    ),

    h('Worked examples: counting semitones'),
    worked(semitoneCountExample(note('C'), note('G'))),
    worked(semitoneCountExample(note('E'), note('G'))),
    p('When the second note has a **smaller number** than the first, you have crossed from B to C. This is the tricky case:'),
    worked(semitoneCountExample(note('B'), note('D', -1))),

    h('Worked examples: a tone or a semitone?'),
    worked(toneOrSemitoneExample(note('E'), note('F'))),
    worked(toneOrSemitoneExample(note('F'), note('G'))),
    worked(toneOrSemitoneExample(note('C', 1), note('D'))),
    p(`Remember that a black key has two names. For example, the key numbered 1 is ${noteLabel(note('C', 1))} or ${noteLabel(note('D', -1))}. Either name gives the same number, and so the same count.`),

    h('Common mistakes'),
    watch('**Counting the key you start on.** C to G is **7** semitones, not 8. Count the keys you move **to**, not the one you leave.'),
    watch('**Forgetting the natural semitones.** E to F and B to C are a **semitone**, not a tone. There is no black key between them.'),
    watch('**Treating a sharp or a flat as a tone.** A sharp or a flat is **one semitone**.'),
    watch('**Forgetting to add 12.** From B (11) to D♭ (1) the numbers go **down**. You have crossed the next C, so use 1 + 12 = 13, and 13 − 11 = 2.'),
    watch('**Mixing up letter names and semitones.** C to G is five letter names (C, D, E, F, G) but **seven semitones**. They are different counts.'),

    h('Try it'),
    p('Building a scale is a way of using tones and semitones. Try spelling scales:'),
    practise({ label: 'Practise scale spelling (easy)', topics: ['scales'], level: 1 }),
    list('Next lesson: **Major scales: how to build any one**.'),
  ],
}

export const NOTES_RHYTHM_LESSONS: LibraryLesson[] = [
  NOTE_NAMES_LESSON,
  ALTO_TENOR_LESSON,
  ACCIDENTALS_LESSON,
  OCTAVES_LESSON,
  NOTE_REST_VALUES_LESSON,
  TIME_SIGNATURES_LESSON,
  TONES_SEMITONES_LESSON,
]
