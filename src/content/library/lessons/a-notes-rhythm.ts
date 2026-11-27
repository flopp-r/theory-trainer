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
import { h, list, notesOnStaff, p, practise, remember, staffBlock, steps, table, tip, watch, words, worked } from '../builders/common'
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
/** A memory aid with the first letters in italics (checked: the letters must spell the note names). */
const aid = (phrase: string, letters: string) => memoryAid(phrase, letters).replace(/\*\*/g, '*')

const NOTE_NAMES_LESSON: LibraryLesson = {
  id: 'note-names-treble-bass',
  title: 'Naming notes in treble and bass clef',
  group: 'notes',
  summary: 'Every line and space note in treble and bass clef, how ledger lines work, and a method for naming and placing any note.',
  before: ['reading-music'],
  covers: ['note-name', 'place-note'],
  build: () => [
    p('A **note name** is one of the seven letters A to G. Every line and every space on the staff has one, and the clef decides which letter goes where. Learn the letters of the lines and spaces in treble and bass clef and you can name any note by sight.'),
    p('The same skill works backwards: given a name such as E4, you can draw the note in the right place. Both are counting methods, so there is little to memorise. You count to the answer from the one line the clef fixes.'),
    words(
      { term: 'Staff (or stave)', meaning: 'The five lines and four spaces that music is written on. Lines and spaces are counted from the bottom up.' },
      { term: 'Clef', meaning: 'A sign at the start of the staff that fixes one line to one letter name, so you can count to every other note.' },
      { term: 'Treble clef (G clef)', meaning: 'The clef for higher notes. Its curl circles the 2nd line up and fixes it as G, so it is also called the G clef.' },
      { term: 'Bass clef (F clef)', meaning: 'The clef for lower notes. Its two dots sit either side of the 4th line up and fix it as F, so it is also called the F clef.' },
      { term: 'Step', meaning: 'A move from a line to the very next space, or from a space to the very next line. One step up gives the next letter name.' },
      { term: 'Musical alphabet', meaning: 'The seven letter names used for notes: A B C D E F G. After G it starts again at A.' },
      { term: 'Natural', meaning: 'A note with no sharp or flat, such as E or B.' },
      { term: 'Ledger line', meaning: 'A short extra line drawn above or below the staff, for a note too high or too low to fit on the five lines.' },
      { term: 'Octave', meaning: 'The distance from a note to the next note with the same letter name, such as C up to the next C. The two notes sound alike.' },
      { term: 'Octave number', meaning: 'The number after a letter name, as in E4. It goes up by 1 each time you pass a C going up. Middle C is C4.' },
      { term: 'Middle C', meaning: 'The C nearest the middle of a piano keyboard. With its octave number it is written C4.' },
      { term: 'Memory aid', meaning: 'A phrase or picture that helps you remember a fact. It is not a rule of music.' },
    ),

    h('The line each clef fixes'),
    p('A clef fixes one line to one letter, and you count from that line to find every other note. So there is one fact to remember for each clef. Every note on these pages is a natural: it has no sharp or flat sign in front of it. Notes with a sign have their own lesson.'),
    list(
      'Treble clef: the 2nd line from the bottom is G.',
      'Bass clef: the 4th line from the bottom is F.',
    ),
    staffBlock(notesOnStaff('treble', pitches('G4')), 'Treble clef, also called the G clef: its curl circles the 2nd line, which is G.'),
    staffBlock(notesOnStaff('bass', pitches('F3')), 'Bass clef, also called the F clef: its two dots sit either side of the 4th line, which is F.'),

    h('The line notes and the space notes'),
    p('Start on the line the clef fixes and count up and down, one step for every line and every space. A step up gives the next letter and a step down gives the previous letter. The table shows the result for the whole staff, from the bottom up, the way you count.'),
    table(['Place on the staff', 'Treble clef', 'Bass clef'], staffLetterRows(['treble', 'bass']), 'The letter on every line and every space.'),
    remember(
      `Treble clef: lines ${spaced(lettersOf('treble', 'lines'))}, spaces ${spaced(lettersOf('treble', 'spaces'))}. Bass clef: lines ${spaced(lettersOf('bass', 'lines'))}, spaces ${spaced(lettersOf('bass', 'spaces'))}. (Each list is from the bottom up.)`,
    ),
    staffBlock(notesOnStaff('treble', lineNotes('treble')), `Treble clef, the five line notes from the bottom: ${spaced(lettersOf('treble', 'lines'))}.`),
    staffBlock(notesOnStaff('treble', spaceNotes('treble')), `Treble clef, the four space notes from the bottom: ${spaced(lettersOf('treble', 'spaces'))}.`),
    staffBlock(notesOnStaff('bass', lineNotes('bass')), `Bass clef, the five line notes from the bottom: ${spaced(lettersOf('bass', 'lines'))}.`),
    staffBlock(notesOnStaff('bass', spaceNotes('bass')), `Bass clef, the four space notes from the bottom: ${spaced(lettersOf('bass', 'spaces'))}.`),

    h('Memory aids'),
    p('A memory aid is a phrase whose first letters are the note names. Each one lists the letters from the bottom up, so start at the bottom line or the bottom space and read upwards.'),
    list(
      `Treble lines: ${aid('Every Good Boy Deserves Football', lettersOf('treble', 'lines').join(''))}.`,
      `Treble spaces: the letters spell the word ${lettersOf('treble', 'spaces').join('')}, from the bottom up.`,
      `Bass lines: ${aid('Good Boys Do Fine Always', lettersOf('bass', 'lines').join(''))}.`,
      `Bass spaces: ${aid('All Cows Eat Grass', lettersOf('bass', 'spaces').join(''))}.`,
    ),
    tip('If you forget an aid, the counting method below always works. Many musicians remember only the lines the clefs fix and a few other notes, and count from the nearest one.'),

    h('Octaves and octave numbers'),
    p('The same letter name appears many times on a piano. An **octave** is the distance from a note to the next note with the same letter name, for example from one C up to the next C. The two notes sound alike, one higher than the other.'),
    p('To tell the octaves apart, we write a number after the letter: C4, A3, E5. This is the octave number. Middle C, the C nearest the middle of a piano keyboard, is C4. The number goes up by one each time you pass a C going up:'),
    p('G3, A3, B3, C4, D4, E4, F4, G4, A4, B4, C5, D5 ...'),
    p('So the note just below middle C is B3. The number changes at C and nowhere else. In Practice, the questions that ask you to place a note add a reminder: "Middle C is C4".'),
    staffBlock(notesOnStaff('treble', pitches('E4', 'E5')), 'Same letter, different octave, different place: E4 is on the bottom line and E5 is in the top space.'),

    h('Ledger lines'),
    p('The staff has room for nine notes: five on lines and four in spaces. Higher or lower notes need extra room. A **ledger line** is a short extra line, just wide enough for one note, drawn above or below the staff.'),
    p('Count ledger lines outwards from the staff. The one nearest the staff is the 1st ledger line, the next is the 2nd ledger line, and so on. They are spaced exactly like the staff lines, so every ledger line and every space is still one step in the musical alphabet.'),
    p('Here are the notes just below the treble staff, going up. A3 is on the 2nd ledger line, B3 is in the space between the two ledger lines, C4 is on the 1st ledger line, D4 is in the space just below the staff, and E4 is on the bottom line.'),
    staffBlock(notesOnStaff('treble', pitches('A3', 'B3', 'C4', 'D4', 'E4')), 'Treble clef, from below the staff: A3, B3, C4, D4, E4.'),
    p('And the notes just above the treble staff. F5 is on the top line, G5 is in the space above it, A5 is on the 1st ledger line above, B5 is in the space above that, and C6 is on the 2nd ledger line above.'),
    staffBlock(notesOnStaff('treble', pitches('F5', 'G5', 'A5', 'B5', 'C6')), 'Treble clef, above the staff: F5, G5, A5, B5, C6.'),
    p('Bass clef works the same way. Here are notes just above the bass staff, and just below it.'),
    staffBlock(notesOnStaff('bass', pitches('A3', 'B3', 'C4', 'D4', 'E4')), 'Bass clef, above the staff: A3 (top line), B3, C4, D4, E4.'),
    staffBlock(notesOnStaff('bass', pitches('C2', 'D2', 'E2', 'F2', 'G2')), 'Bass clef, below the staff: C2, D2, E2, F2, then G2 on the bottom line.'),
    remember('The space just above the top line (or just below the bottom line) is not a ledger line. It is a space. The 1st ledger line is one step further out.'),

    h('Middle C'),
    p(`Middle C sits between the two staves, so each clef has to reach for it with a ledger line. In treble clef it is on ${middleCPlace('treble')}. In bass clef it is on ${middleCPlace('bass')}.`),
    staffBlock(notesOnStaff('treble', pitches('C4')), 'Middle C in treble clef: on the 1st ledger line below the staff.'),
    staffBlock(notesOnStaff('bass', pitches('C4')), 'Middle C in bass clef: on the 1st ledger line above the staff.'),

    h('The method: naming any note'),
    steps(
      '**Find the clef.** Remember the line it fixes: in treble clef the 2nd line from the bottom is G, and in bass clef the 4th line from the bottom is F.',
      '**Find where your note sits.** Count the lines and spaces from the bottom up. If the note is outside the staff, count the ledger lines outwards from the staff.',
      '**Count from the line the clef fixes to your note.** Count up if your note is higher and down if it is lower. Every line and every space is one step. Say the letters forwards for each step up and backwards for each step down. If your note is outside the staff, stop at the top line or the bottom line.',
      '**Carry on above or below the staff.** Only for a note outside the staff: keep counting step by step, over the ledger lines and the spaces between them, until you reach your note.',
      '**Read the last letter.** The last letter you said is the name of the note.',
      '**Check with the lines or the spaces.** Read the note from the lists above instead of counting from the clef. Outside the staff, count every other letter from the last line, because the next line is two steps away.',
    ),
    tip('You can also count from middle C, a note you will soon know well: treble clef, 1st ledger line below. Bass clef, 1st ledger line above.'),

    h('Worked examples: naming notes'),
    p('Each example follows the steps above. Read one all the way through, then cover the answer and try the next.'),
    worked(nameNoteExample('treble', P('C5'))),
    worked(nameNoteExample('bass', P('D3'))),
    p('Now notes that need ledger lines. The steps are the same, with the extra step of carrying on outside the staff.'),
    worked(nameNoteExample('treble', P('A5'))),
    worked(nameNoteExample('treble', P('C4'))),
    worked(nameNoteExample('treble', P('A3'))),
    worked(nameNoteExample('bass', P('C4'))),
    worked(nameNoteExample('bass', P('E2'))),

    h('Placing a note on the staff'),
    p('Practice also asks the reverse. It gives you a name such as E4 and you tap where the note goes. The skill is the same, run backwards: you count from the line the clef fixes to the letter you are given, and each step of the count is one step on the staff.'),
    p('The octave number matters, because the same letter appears in many places. Counting with the octave number tells you which one.'),
    steps(
      '**Read the letter and the octave number.** The letter is the note name. The number says which octave.',
      '**Find the line the clef fixes.** Give it its octave number too: G4 on the 2nd line in treble clef, F3 on the 4th line in bass clef.',
      '**Count from the line the clef fixes to your letter.** Count one letter at a time, up or down. Add 1 to the octave number each time you pass a C going up. Take 1 off each time you step down from a C. Stop when you have the right letter and the right octave number.',
      '**Carry on above or below the staff.** Only if your note is outside the staff: keep counting past the top line or the bottom line, one step at a time.',
      '**Draw any ledger lines you need.** Count them outwards from the staff, and draw only as many as you need.',
      '**Draw the note head.** The line passes through the middle of the head, or the head fills the space.',
      '**Check with the lines or the spaces.** Read the note from the lists above instead of counting from the clef.',
    ),
    worked(placeNoteExample('treble', P('C4'))),
    worked(placeNoteExample('bass', P('A2'))),
    worked(placeNoteExample('treble', P('D5'))),

    h('Common mistakes'),
    watch('**Counting only the lines.** The note on the middle line of bass clef, counting down from F on the 4th line. Counting only lines gives E. Every space is a step too: F, E (3rd space), D (middle line). The note is D.'),
    watch('**Forgetting which clef you are in.** A note on the bottom line. Reading it as E is the treble clef answer, and is wrong in bass clef. In bass clef the bottom line is G.'),
    watch('**Calling the space above the top line a ledger line.** The note just above the top line of the treble staff. Calling it A is wrong: a space comes first, so it is G. A is on the 1st ledger line above.'),
    watch('**Changing the octave number at A.** One step up from G4. Writing A5 is wrong, because the number only changes at C. The note is A4. The next change comes from B4 to C5.'),

    h('Try it'),
    p('Start with the treble and bass clefs on the easy level, then try the medium level when you can name most notes without counting.'),
    practise({ label: 'Practise note names (treble and bass, easy)', topics: ['notes'], level: 1, clefs: ['treble', 'bass'] }),
    practise({ label: 'Practise notes (treble and bass, medium)', topics: ['notes'], level: 2, clefs: ['treble', 'bass'] }),
    list('Next lesson: Alto and tenor clefs.'),
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
    p('A **C clef** is a clef that points straight at middle C, the C nearest the middle of a piano. The alto clef and the tenor clef are the two C clefs. They look the same and differ only in which line they point at.'),
    p('The viola reads alto clef. Cellos, bassoons and trombones usually read bass clef, but they switch to tenor clef for their higher notes. That keeps the notes on the staff and avoids a pile of ledger lines.'),
    p('You count in alto and tenor clef just as you do in treble and bass. Only the line the clef fixes is different.'),
    words(
      { term: 'Staff (or stave)', meaning: 'The five lines and four spaces that music is written on. Lines and spaces are counted from the bottom up.' },
      { term: 'Step', meaning: 'A move from a line to the very next space, or from a space to the very next line. One step up gives the next letter name.' },
      { term: 'Musical alphabet', meaning: 'The seven letter names used for notes: A B C D E F G. After G it starts again at A.' },
      { term: 'Ledger line', meaning: 'A short extra line drawn above or below the staff, for a note too high or too low to fit on the five lines.' },
      { term: 'Middle C', meaning: 'The C nearest the middle of a piano keyboard. With its octave number it is written C4.' },
      { term: 'Octave number', meaning: 'The number after a letter name, as in E4. It goes up by 1 each time you pass a C going up. Middle C is C4.' },
      { term: 'C clef', meaning: 'A clef that points straight at middle C. The alto clef and the tenor clef are both C clefs.' },
      { term: 'Alto clef', meaning: 'A C clef: its centre points at the middle line, which makes that line middle C. The viola reads alto clef.' },
      { term: 'Tenor clef', meaning: 'A C clef: its centre points at the 4th line up, which makes that line middle C. Cellos, bassoons and trombones use it for high notes.' },
    ),

    h('Where each C clef points'),
    p('The C clef sign is a pair of curves joined to a vertical bar. The two curves meet at a point in the centre of the sign, and that point is aimed at a line. That line is middle C. The sign is the same in alto and tenor clef. Only the line it points at changes.'),
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
    p('Middle C is C4. The 4 is the octave number, and it goes up by one each time you pass a C going up. Counting from middle C gives you every line and space. Here they all are, from the bottom up:'),
    table(['Place on the staff', 'Alto clef', 'Tenor clef'], staffLetterRows(['alto', 'tenor']), 'The letter on every line and space.'),
    remember(
      `Alto clef: lines ${spaced(lettersOf('alto', 'lines'))}, spaces ${spaced(lettersOf('alto', 'spaces'))}. Tenor clef: lines ${spaced(lettersOf('tenor', 'lines'))}, spaces ${spaced(lettersOf('tenor', 'spaces'))}. (Each list is from the bottom up.)`,
    ),
    staffBlock(notesOnStaff('alto', lineNotes('alto')), `Alto clef, the line notes from the bottom: ${spaced(lettersOf('alto', 'lines'))}.`),
    staffBlock(notesOnStaff('alto', spaceNotes('alto')), `Alto clef, the space notes from the bottom: ${spaced(lettersOf('alto', 'spaces'))}.`),
    staffBlock(notesOnStaff('tenor', lineNotes('tenor')), `Tenor clef, the line notes from the bottom: ${spaced(lettersOf('tenor', 'lines'))}.`),
    staffBlock(notesOnStaff('tenor', spaceNotes('tenor')), `Tenor clef, the space notes from the bottom: ${spaced(lettersOf('tenor', 'spaces'))}.`),

    h('Middle C in all four clefs'),
    p('Middle C is the same sound in every clef. Only its place on the staff changes. Here is where each clef puts it:'),
    staffBlock(notesOnStaff('treble', pitches('C4')), `Treble clef: ${middleCPlace('treble')}.`),
    staffBlock(notesOnStaff('bass', pitches('C4')), `Bass clef: ${middleCPlace('bass')}.`),
    staffBlock(notesOnStaff('alto', pitches('C4')), `Alto clef: ${middleCPlace('alto')}.`),
    staffBlock(notesOnStaff('tenor', pitches('C4')), `Tenor clef: ${middleCPlace('tenor')}.`),

    h('How alto compares with treble and bass'),
    p('The table has all four clefs side by side. Read along a row: it is one place on the staff, with the letter it has in each clef.'),
    table(['Place', 'Treble', 'Alto', 'Bass', 'Tenor'], staffLetterRows(['treble', 'alto', 'bass', 'tenor']), 'The same place on the staff, read in each clef.'),
    p('Two patterns you can check in every row. Alto has the letter one step further on in the alphabet than treble (bottom line: treble E, alto F). Alto has the letter one step back from bass (bottom line: bass G, alto F).'),
    tip('This pattern only checks a letter. It does not give the octave, because the notes are at different heights. For a safe answer, count from middle C.'),

    h('The method: naming a note in alto or tenor clef'),
    steps(
      '**Find the clef.** Look at the clef sign and find the line its centre points at: the middle line in alto clef, the 4th line in tenor clef. That line is middle C.',
      '**Find where your note sits.** Count the lines and spaces from the bottom up. If the note is outside the staff, count the ledger lines outwards from the staff.',
      '**Count from middle C to your note.** Count up if your note is higher and down if it is lower. Every line and every space is one step. Say the letters forwards for each step up and backwards for each step down. If your note is outside the staff, stop at the top line.',
      '**Carry on above the staff.** Only for a note on a ledger line: keep counting over the ledger lines and the spaces between them until you reach your note.',
      '**Read the last letter.** The last letter you said is the name of the note.',
      '**Check with the lines or the spaces.** Read the note from the table above instead of counting from middle C. Outside the staff, count every other letter from the last line.',
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
    watch('**Reading alto clef as if it were treble clef.** The note on the bottom line of the alto staff. Reading it as E is the treble clef answer, and is wrong here. In alto clef the bottom line is F.'),
    watch('**Counting from the wrong line.** The note on the middle line of tenor clef. Calling it C is wrong: only in alto clef is the middle line middle C. In tenor clef, middle C is the 4th line, so count down: C, B (3rd space), A (middle line). The note is A.'),
    watch('**Using the pattern to find the octave.** The bottom line of alto clef is F. Moving up from treble clef E4 suggests F4, which is wrong. Count down from middle C4: B3, A3, G3, F3. The note is F3.'),

    h('Try it'),
    practise({ label: 'Practise alto clef note names (easy)', topics: ['notes'], level: 1, clefs: ['alto'] }),
    practise({ label: 'Practise tenor clef note names (easy)', topics: ['notes'], level: 1, clefs: ['tenor'] }),
    list('Next lesson: Sharps, flats and naturals.'),
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
    p('An **accidental** is a sign written in front of a note to raise or lower it. There are more sounds in music than seven letter names, because between most neighbouring letters there is another note. Accidentals are how those notes are written.'),
    p('There are five signs: the sharp, the flat, the natural, the double sharp and the double flat. Each one moves a note by a set number of semitones, and each one lasts until the end of the bar.'),
    words(
      { term: 'Accidental', meaning: 'A sign written in front of a note to raise or lower it: a sharp, a flat, a natural, a double sharp or a double flat.' },
      { term: 'Semitone', meaning: 'The smallest step in Western music: from one piano key to the very next key, black or white.' },
      { term: 'Tone', meaning: 'A step of two semitones, such as C up to D. There is one piano key between the two notes.' },
      { term: 'Sharp (♯)', meaning: 'A sign that raises a note by 1 semitone. C♯ is the piano key just above C.' },
      { term: 'Flat (♭)', meaning: 'A sign that lowers a note by 1 semitone. B♭ is the piano key just below B.' },
      { term: 'Natural (♮)', meaning: 'A note with no sharp or flat, such as F. The natural sign ♮ cancels an earlier sharp or flat.' },
      { term: 'Double sharp (♯♯)', meaning: 'A sign that raises a note by 2 semitones (one tone). It is printed as a small cross; this app writes it as ♯♯.' },
      { term: 'Double flat (♭♭)', meaning: 'A sign that lowers a note by 2 semitones (one tone). It is printed as two flats; this app writes it as ♭♭.' },
      { term: 'Pitch', meaning: 'How high or low a note sounds. F4 and F5 are different pitches: same letter, different octave number.' },
      { term: 'Bar', meaning: 'A short section of music. Bars are separated by bar lines, thin upright lines across the staff.' },
      { term: 'Key signature', meaning: 'A set of sharps or flats at the start of the music that applies to the whole piece.' },
      { term: 'Enharmonic equivalents', meaning: 'Two names for the same sound, such as F♯ and G♭. They are the same piano key.' },
      { term: 'Scale', meaning: 'A set of notes in order of pitch, using each letter name once.' },
      { term: 'Key note', meaning: 'The note a scale starts on and is named after. D major starts on D.' },
    ),

    h('The five signs'),
    table(
      ['Sign', 'What it does', 'In a name'],
      [
        ['♯ sharp', 'raises the note by 1 semitone', 'F♯'],
        ['♭ flat', 'lowers the note by 1 semitone', 'B♭'],
        ['♮ natural', 'cancels a sharp or flat: back to the natural note', 'F (no sign)'],
        ['double sharp (a small cross)', 'raises the note by 2 semitones (one tone)', 'F♯♯'],
        ['double flat (two flats)', 'lowers the note by 2 semitones (one tone)', 'B♭♭'],
      ],
      'The accidentals. In this app a double sharp or flat is written in a name as two signs.',
    ),
    remember('A sharp raises a note by one semitone. A flat lowers it by one semitone. A natural cancels a sharp or flat and gives back the note with no sign.'),
    p('A note with no sharp or flat is called a natural note. The natural sign ♮ is what you write when you need to cancel an earlier sharp or flat.'),
    staffBlock(notesOnStaff('treble', pitches('F#4', 'Bb4')), 'F♯4 and B♭4. The sign sits in front of the note head.'),
    staffBlock(notesOnStaff('treble', pitches('F#4', 'F4')), 'F♯4 followed by F4: the natural sign cancels the sharp.'),
    staffBlock(notesOnStaff('treble', pitches('F##4', 'Bbb4')), 'A double sharp (F♯♯4) and a double flat (B♭♭4).'),

    h('Where the sign goes'),
    p('The sign goes in front of the note head, on the same line or in the same space as the note. It never changes where the note sits on the staff. It only changes how the note sounds.'),
    p('In a name, the order is the other way round: you say the letter first and the sign second. A note with a sharp in front of the head is F sharp, written F♯.'),

    h('How long a sign lasts'),
    list(
      'A sign lasts until the end of the bar (the next bar line).',
      'It applies only to notes of the same pitch: the same letter and the same octave. A ♯ on F4 does not change F5.',
      'To go back to the natural note before the bar ends, write a natural sign.',
      'At the next bar line everything starts again, as if no sign had been written.',
    ),
    p('The examples here have no key signature, which is a set of sharps or flats at the start of the music. It has its own lesson.'),
    p('To find which notes in a bar need a sign, follow these steps. The examples after them go through one bar note by note.'),
    steps(
      '**Number the notes.** Number the notes of the bar from the left: 1, 2, 3 and so on.',
      '**Remember the rule for accidentals.** A sign lasts until the bar line, but only for the same pitch: the same letter and the same octave number. After the bar line every note starts again with no sign.',
      '**Work out each note, one at a time.** Ask what the note would be with no sign, given what has already happened in the bar. If that is not the sound you want, print a sign. If it is, print nothing.',
      '**Check pitch by pitch.** Go through each pitch instead of each note. A sign is needed only where a pitch changes from the sign already in force (at the start, no sign).',
    ),
    worked(accidentalCarryExample(pitches('F#4', 'G4', 'F#4', 'F#5', 'F4', 'F4'))),
    worked(accidentalCarryExample(pitches('Bb4', 'D5', 'Bb4', 'B4', 'B4'))),

    h('Naming a note that has a sign'),
    steps(
      '**Find where the note head sits.** Say which line or space the note head is on. Look at the sign in front of it: ♯, ♭, a double sign or ♮. A sign on the same line or space as the head belongs to that note.',
      '**Find the letter first.** A sign never changes the place on the staff, so ignore it and name the note as if it were not there.',
      '**Count from the line the clef fixes to your note.** Count up or down one step at a time, as in the earlier lessons, and read the last letter you say.',
      '**Add the sign to the letter.** Say the letter first and the sign second: for example C♯.',
      '**Check with the lines or the spaces.** Read the letter from the list for that clef, then put the sign back on.',
    ),
    worked(nameAccidentalExample('treble', P('C#5'))),
    worked(nameAccidentalExample('bass', P('Bb2'))),
    p('Double signs work the same way. The only difference is that the note moves by two semitones.'),
    worked(nameAccidentalExample('treble', P('F##4'))),

    h('Two names for one sound'),
    p('Look at a piano. The black key between F and G is one semitone above F, and it is also one semitone below G. So it has two names: F♯ and G♭. Notes that sound the same but have different names are called enharmonic equivalents.'),
    p('Each of the five black keys in an octave has two names:'),
    table(
      ['Sharp name', 'Flat name'],
      [1, 3, 6, 8, 10].map((n) => keyNames(n).split('/')),
      'The five black keys, each with two names.',
    ),
    p('A white key can have another name too. For example B♯ is the same key as C, and F♭ is the same key as E. These are less common, but they do exist.'),
    p('So which name do you write? The scale or key you are in decides. A scale uses each letter once, so you choose the name whose letter the scale needs. The Major scales lesson shows how to write a scale out.'),
    steps(
      '**Listen to the two notes.** Play both. They sound exactly the same.',
      '**Find each note on the piano.** A sharp raises a note by one semitone, and a flat lowers it by one semitone. Find the black key each name points to.',
      '**See that they are the same key.** If one key sits between two white keys a tone apart, both names belong to it.',
      '**Compare the letters.** One name uses one letter and the other uses the next letter. The scale uses each letter once, so the letter it needs decides the name.',
      '**Write out the scale.** Start on the key note and write its notes, using each letter once.',
      '**Choose the name in that scale.** The black key is a numbered note of the scale, such as note 3 of D major. Count that many letters from the key note: D, E, F. The last letter is the one the name must use.',
      '**Check by trying the other name.** Swap the names and see what goes wrong: one letter appears twice and another is missing.',
    ),
    worked(enharmonicExample(P('F#4'), P('Gb4'), note('D'), note('D', -1))),
    worked(enharmonicExample(P('C#4'), P('Db4'), note('A'), note('A', -1))),

    h('Common mistakes'),
    watch('**Thinking the sign changes the place on the staff.** C♯5 in treble clef. Moving the note up one step, to the 4th line, gives D, which is wrong. C5 is in the 3rd space, and the note stays there. The ♯ goes in front of it.'),
    watch('**Carrying a sign past the bar line.** F♯4 at the end of one bar, then F4 at the start of the next. Reading the second note as F♯ is wrong. The bar line cancels the sign, so it is F.'),
    watch('**Carrying a sign to another octave.** F♯4, then F5 in the same bar. Reading F5 as F♯ is wrong, because the sharp is on F4 only. F5 is F natural, and needs its own ♯ to become F♯5.'),
    watch('**Choosing F♯ or G♭ at random.** The 3rd note of D major. Writing G♭ gives D E G♭ G, with two Gs and no F. The scale needs the letter F, so the note is F♯.'),

    h('Try it'),
    practise({ label: 'Practise sharps and flats (treble and bass, easy)', topics: ['notes'], level: 1, clefs: ['treble', 'bass'] }),
    practise({ label: 'Practise sharps, flats and double signs (medium)', topics: ['notes'], level: 2, clefs: ['treble', 'bass', 'alto'] }),
    list('Next lesson: Octaves, middle C and different clefs.'),
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
    p('A **pitch** is how high or low a note sounds. It is fixed by two things together: the letter name and the octave number. The same pitch can be written in any clef, but it sits in a different place on the staff in each one.'),
    p('Writing the same pitch in another clef tests whether you read pitches and not just positions. A few instruments add one more twist: the pitch you read is not always the pitch you hear. The guitar is the example here.'),
    words(
      { term: 'Pitch', meaning: 'How high or low a note sounds. It is fixed by the letter name and the octave number together.' },
      { term: 'Octave', meaning: 'The distance from a note to the next note with the same letter name: 8 letter names, or 12 semitones.' },
      { term: 'Semitone', meaning: 'The smallest step in Western music: from one piano key to the very next key, black or white.' },
      { term: 'Octave number', meaning: 'The number after a letter name, as in E4. It goes up by 1 each time you pass a C going up. Middle C is C4.' },
      { term: 'Middle C', meaning: 'The C nearest the middle of a piano keyboard. With its octave number it is written C4.' },
      { term: 'Step', meaning: 'A move from a line to the very next space, or from a space to the very next line. One step up gives the next letter name.' },
      { term: 'Ledger line', meaning: 'A short extra line drawn above or below the staff, for a note too high or too low to fit on the five lines.' },
      { term: 'Treble clef (G clef)', meaning: 'The clef for higher notes. Its curl circles the 2nd line up and fixes it as G, so it is also called the G clef.' },
      { term: 'Bass clef (F clef)', meaning: 'The clef for lower notes. Its two dots sit either side of the 4th line up and fix it as F, so it is also called the F clef.' },
      { term: 'C clef', meaning: 'A clef that points straight at middle C. The alto clef and the tenor clef are both C clefs.' },
      { term: 'Alto clef', meaning: 'A C clef: its centre points at the middle line, which makes that line middle C. The viola reads alto clef.' },
      { term: 'Tenor clef', meaning: 'A C clef: its centre points at the 4th line up, which makes that line middle C. Cellos, bassoons and trombones use it for high notes.' },
      { term: 'Written pitch', meaning: 'The note as it is printed on the page.' },
      { term: 'Sounding pitch', meaning: 'The note you actually hear when the instrument plays.' },
    ),

    h('Octaves and octave numbers'),
    p('An octave is the distance from a note to the next note with the same letter name, such as from one C up to the next C. The two notes sound alike, one higher than the other. An octave is 12 semitones (a semitone is the step from one piano key to the very next key).'),
    p('To say exactly which C (or which A, which F) you mean, we write a number after the letter. This is the octave number. Middle C is C4. The number goes up by one each time you pass a C, going up:'),
    p('C4  D4  E4  F4  G4  A4  B4  then C5 ...'),
    staffBlock(notesOnStaff('treble', pitches('C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5')), 'From middle C (C4) up to C5. The octave number changes at C, and only at C.'),
    remember('The octave number changes at C, not at A. The note just below C4 is B3. The note just above B4 is C5.'),
    p('A pitch is fixed by its letter and its octave number together. E4 and E5 have the same letter but they are different pitches, one octave apart.'),
    p('The viola\'s lowest string is the open C string, which is C3, the C one octave below middle C. The app\'s own viola range runs from C3 up to A5. The bottom, C3, is a fact about the instrument. The top, A5, is a limit chosen for this app to keep questions easy to read. It is not the highest note a viola can play.'),

    h('Where middle C sits in each clef'),
    p('Middle C is the same pitch in every clef. Each clef draws it in a different place.'),
    table(
      ['Clef', 'Middle C (C4) is on'],
      (['treble', 'bass', 'alto', 'tenor'] as const).map((clef) => [clefLabel(clef), middleCPlace(clef)]),
      'The same pitch, four different places.',
    ),
    worked(middleCInClefsExample()),

    h('The same place is a different note in a different clef'),
    remember('The same place on the staff is a different pitch in a different clef. To write the same pitch in another clef, keep the letter and the octave number and move the note to wherever that pitch lives in the new clef.'),
    p('Practice shows this as two staves, one above the other, and asks whether the two notes are the same pitch. Sometimes they sit in the same place on the staff but are different notes. Sometimes they are in different places and are the same note. The method below always gives the right answer.'),

    h('The method: writing a note in another clef'),
    steps(
      '**Find where the note sits in the first clef.** Count the lines and spaces from the bottom up, and say which line or space the note is on.',
      '**Find the line the first clef fixes.** Give it its octave number: G4 in treble clef, F3 in bass clef, C4 in alto and tenor clef.',
      '**Count from that line to the note.** Say the letters one step at a time, up or down. Add 1 to the octave number each time you pass a C going up, and take 1 off each time you step down from a C. Carry on past the staff if the note has ledger lines.',
      '**Keep the same letter and octave number.** That name is the pitch, and it does not change. Only its place on the staff changes.',
      '**Find the line the new clef fixes.** Give it its octave number too.',
      '**Count from that line to the note.** Count one step at a time again, changing the octave number at each C, and stop at the right letter and the right octave number. Carry on past the staff if you need to.',
      '**Draw any ledger lines you need.** Count them outwards from the staff.',
      '**Write the note.** Draw the note head on the place you found.',
      '**Do not copy the place on the staff.** Try it: put the note in the same place in the new clef and name that note. It is a different pitch, which is why you must count again.',
      '**Check with the lines or the spaces.** Name your new note from the list for the new clef. You should get the same letter and the same octave number.',
    ),
    worked(convertClefExample(P('E4'), 'alto', 'treble')),
    worked(convertClefExample(P('A3'), 'bass', 'treble')),
    worked(convertClefExample(P('A4'), 'treble', 'alto')),

    h('Written pitch and sounding pitch'),
    p('Usually the note you read is the note you hear. Some instruments are different: the music is written at one height and the instrument sounds at another. The written pitch is what is on the page. The sounding pitch is what you hear.'),
    p('The guitar sounds one octave lower than it is written. Guitar music is written in treble clef. A written E4 sounds as E3: same letter, one octave number lower.'),
    steps(
      '**Find where the written note sits.** Count the lines and spaces from the bottom up, and say which line or space the note is on.',
      '**Find the line the treble clef fixes.** It is G4, the 2nd line.',
      '**Count from that line to the note.** Say the letters one step at a time, up or down, to find the written pitch.',
      '**Move it down one octave.** Keep the letter and take 1 off the octave number. That is the sounding pitch.',
      '**Listen to the two notes.** Play the written note and the sounding note. They share a letter name, but the sounding note is lower.',
      '**Check by counting 8 letter names down.** Count down from the written note, letter by letter, counting both ends. Eight letter names is one octave.',
    ),
    worked(guitarSoundingExample(P('E4'))),
    worked(guitarSoundingExample(P('C5'))),
    p('The viola reads alto clef, and what you read is what you hear. Its four open strings are C3, G3, D4 and A4. This is how they look in alto clef. The lowest, C3, sits below the staff.'),
    staffBlock(notesOnStaff('alto', pitches('C3', 'G3', 'D4', 'A4')), 'The four open strings of a viola in alto clef: C3, G3, D4, A4.'),

    h('Common mistakes'),
    watch('**Copying the place on the staff.** The note on the middle line of alto clef is C4. Drawing it on the middle line of treble clef is wrong: that is B4. C4 in treble clef is on the 1st ledger line below the staff.'),
    watch('**Forgetting the octave number changes at C.** One step down from C4. Writing B4 is wrong, because the number drops when you step down from a C. The note is B3.'),
    watch('**Getting the guitar direction wrong.** A guitar note written as E4. Hearing E5 is wrong, because the guitar sounds lower than written. It sounds E3, one octave lower.'),

    h('Try it'),
    p('The "Are these two notes the same pitch?" questions use two staves in different clefs. Choose two or more clefs to get them.'),
    practise({ label: 'Practise comparing clefs (all clefs, medium)', topics: ['notes'], level: 2, clefs: ['treble', 'bass', 'alto', 'tenor'] }),
    list('Next lesson: Note and rest values.'),
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
    p('A **note value** is how long a note lasts, and the shape of the note shows it. The position of a note on the staff gives its pitch, which is how high or low it sounds. Its shape gives its length, which is how long to hold it. A **rest** is the matching sign for silence.'),
    p('With the shapes you can name any note or rest and work out how many beats it lasts. You need both for time signatures, the next lesson.'),
    words(
      { term: 'Note value', meaning: 'How long a note lasts, shown by its shape. A rest has note values too.' },
      { term: 'Beat', meaning: 'The steady pulse of the music, the one you would tap your foot to.' },
      { term: 'Crotchet beat', meaning: 'The beat that note lengths are measured in here: a crotchet lasts 1 beat. A beat is the steady pulse you tap your foot to.' },
      { term: 'Semibreve', meaning: 'The longest note used here: a hollow head with no stem. It lasts 4 crotchet beats.' },
      { term: 'Minim', meaning: 'A hollow head with a stem. It lasts 2 crotchet beats.' },
      { term: 'Crotchet', meaning: 'A filled-in head with a stem. It lasts 1 crotchet beat.' },
      { term: 'Quaver', meaning: 'A filled-in head with a stem and one flag. It lasts ½ a crotchet beat.' },
      { term: 'Semiquaver', meaning: 'The shortest note used here, ¼ of a crotchet beat. 4 semiquavers last 1 beat and 16 fill a semibreve.' },
      { term: 'Note head', meaning: 'The oval part of a note. It is either hollow (white inside) or filled in (black).' },
      { term: 'Stem', meaning: 'The straight line going up or down from a note head. Which way it points makes no difference.' },
      { term: 'Flag', meaning: 'A small tail on the end of a stem. Each flag halves the length of the note.' },
      { term: 'Beam', meaning: 'A thick line that joins the flags of several quavers or semiquavers. One beam means quavers, two beams mean semiquavers.' },
      { term: 'Rest', meaning: 'A sign for silence. You play nothing but keep counting, for as long as the note with the same name lasts.' },
      { term: 'Dot', meaning: 'A dot just after a note head. It adds half of the note\'s own length.' },
      { term: 'Double dot', meaning: 'Two dots after a note head. The second dot adds half of what the first dot added.' },
      { term: 'Memory aid', meaning: 'A phrase or picture that helps you remember a fact. It is not a rule of music.' },
    ),

    h('Counting in beats'),
    p('Note lengths are measured in beats. Beats are not a fixed number of seconds: in fast music they are quick and in slow music they are slow. We measure every note against the crotchet. One crotchet lasts one beat, so we call it a crotchet beat.'),

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
      'The note head is the oval part. It is either hollow (white inside) or filled in (black).',
      'The stem is the straight line going up or down from the note head. Which way it points makes no difference to the length.',
      'A flag is a small tail on the end of the stem. Each flag halves the length of the note.',
    ),
    p('When several quavers or semiquavers stand next to each other, their flags are often joined into a thick line called a beam. A beam does the same job as flags: one beam means quavers, two beams mean semiquavers. The pictures in this app draw flags.'),
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
    p('Start with the semibreve, the longest. Each note after it lasts half as long as the one before.'),
    table(
      ['Note', 'Crotchet beats', 'How many fit in a semibreve'],
      NOTE_VALUES.map((v) => [v.name, beatsText(v.crotchets), String(16 / v.semiquavers)]),
      'Halving each time: 4, 2, 1, ½, ¼.',
    ),
    remember('Each note is half the one before it: semibreve 4 beats, minim 2, crotchet 1, quaver ½, semiquaver ¼. More flags means a shorter note.'),

    h('Rests'),
    p('A rest is a sign for silence. You do not play, but you keep counting. Every note value has a rest of the same length: a minim rest lasts as long as a minim.'),
    table(
      ['Rest', 'How to recognise it', 'Beats'],
      NOTE_VALUES.map((v) => [`${v.name} rest`, REST_LOOKS[v.name], beatsText(v.crotchets)]),
      'The five rests.',
    ),
    staffBlock(figuresOnStaff(NOTE_VALUES.map((v) => ({ name: v.name, rest: true }))), 'From the left: semibreve rest, minim rest, crotchet rest, quaver rest, semiquaver rest.'),

    h('Dots make a note longer'),
    p('A dot written just after a note head makes the note half as long again. It adds half of the note\'s own length.'),
    table(
      ['Dotted note', 'Length without the dot', 'The dot adds', 'Total beats'],
      NAME_FOR_BEATS.map((name) => {
        const plain = noteValue(name).crotchets
        return [noteValueLabel(name, 1), beatsText(plain), beatsText(plain / 2), beatsText(dottedCrotchets(name, 1))]
      }),
      'One dot: add half.',
    ),
    staffBlock(figuresOnStaff([{ name: 'minim', dots: 1 }, { name: 'crotchet', dots: 1 }, { name: 'quaver', dots: 1 }]), 'A dotted minim, a dotted crotchet and a dotted quaver.'),
    p('A double dot is two dots. The second dot adds half of what the first dot added.'),
    list(
      ...(['semibreve', 'minim', 'crotchet'] as const).map((name) => {
        const plain = noteValue(name).crotchets
        return `A double-dotted ${name} = ${beatsText(plain)} + ${beatsText(plain / 2)} + ${beatsText(plain / 4)} = ${beatsText(dottedCrotchets(name, 2))} beats.`
      }),
    ),
    staffBlock(figuresOnStaff([{ name: 'minim', dots: 2 }, { name: 'crotchet', dots: 2 }]), 'A double-dotted minim and a double-dotted crotchet.'),
    p('Dots work the same way after a rest. A dotted crotchet rest lasts 1½ beats.'),

    h('The method: naming a note from its shape'),
    steps(
      '**Look at the note head.** Say whether it is hollow or filled in.',
      '**Look for a stem.** A stem is the straight line going up or down from the head.',
      '**Count the flags.** Only for a filled-in head with a stem: count the small tails on the end of the stem.',
      '**Name the shape.** Hollow head, no stem: semibreve. Hollow head with a stem: minim. Filled-in head with a stem: crotchet with no flag, quaver with 1 flag, semiquaver with 2 flags.',
      '**Look for a dot.** A dot sits just after the head. If there is one, say "dotted" before the name.',
      '**Check by building up from the semibreve.** Change one thing at a time: add a stem for a minim, fill in the head for a crotchet, add a flag for a quaver, add a second flag for a semiquaver.',
    ),
    worked(nameNoteValueExample('quaver')),
    worked(nameNoteValueExample('minim', 1)),

    h('The method: naming a rest from its shape'),
    steps(
      '**Look at the shape.** A rest is written where a note would be. Say what the shape looks like: a block, a zigzag or a slanted stroke.',
      '**Look for hooks, or see where the block sits.** A slanted stroke has hooks (one for a quaver rest, two for a semiquaver rest). A block either hangs below a line or sits on top of a line.',
      '**Name the rest.** A block hanging below a line is a semibreve rest. A block sitting on a line is a minim rest. A zigzag is a crotchet rest.',
      '**Look for a dot.** A dot sits just after the rest and makes it half as long again.',
      '**Find how long it lasts.** A rest lasts as long as the note with the same name. Use the table of beats above.',
      '**Check by ruling out the other rests, or with a memory aid.** Find a reason why it cannot be any of the others. For the two blocks, the semibreve rest is the longer one, so think of it as heavier and hanging down. The lighter minim rest sits on top, like a hat.',
    ),
    worked(nameRestExample('crotchet')),
    p('These two rests are the ones people mix up most. Look at where the block sits.'),
    worked(nameRestExample('semibreve')),
    worked(nameRestExample('minim')),

    h('The method: how many beats is this note worth?'),
    steps(
      '**Name the note.** Name it by its head, stem and flags, and say whether it has dots.',
      '**Find its length without dots.** Start from the semibreve at 4 beats. Each note is half the one before: semibreve 4, minim 2, crotchet 1, quaver ½, semiquaver ¼.',
      '**Add half for the dot.** Look just after the head. No dot: nothing to add. One dot: it adds half of the length from step 2.',
      '**Add half again for the second dot.** Only if there is a second dot: it adds half of what the first dot added.',
      '**Add the parts.** Add the length without dots and what each dot added.',
      '**Check by counting in semiquavers.** Measure in semiquavers instead (4 make a beat, 16 make a semibreve), then divide by 4 to get beats. A dotted note also lasts as long as the note plus the next shorter note: a dotted minim is a minim and a crotchet.',
    ),
    worked(noteBeatsExample('minim', 0)),
    worked(noteBeatsExample('crotchet', 1)),
    worked(noteBeatsExample('minim', 2)),
    worked(noteBeatsExample('quaver', 1)),

    h('The method: adding a run of notes and rests'),
    steps(
      '**Name each note and rest.** Go from left to right, and say whether each one has dots.',
      '**Work out each length, one at a time.** Use the method above for each one. A rest counts the same as the note with the same name.',
      '**Add the beats from left to right.** Add one at a time, keeping a running total.',
      '**Check by counting in semiquavers.** Measure each one in semiquavers, add them, and divide the total by 4.',
    ),
    worked(sumValuesExample([{ name: 'minim' }, { name: 'crotchet', dots: 1 }, { name: 'quaver' }])),
    worked(sumValuesExample([{ name: 'crotchet' }, { name: 'minim', rest: true }, { name: 'crotchet' }])),

    h('Common mistakes'),
    watch('**Thinking a dot adds one beat.** A dotted crotchet. Adding one whole beat gives 2, which is wrong. The dot adds half of the crotchet: 1 + ½ = 1½ beats.'),
    watch('**Thinking more flags means longer.** A note with 2 flags next to a note with 1 flag. Calling the 2-flag note the longer one is wrong. 2 flags is a semiquaver, ¼ of a beat. 1 flag is a quaver, ½ a beat.'),
    watch('**Mixing up the minim rest and the semibreve rest.** A small block hanging below a line. Calling it a minim rest is wrong. It hangs down, so it is the semibreve rest, 4 beats. The block sitting on top of a line is the minim rest, 2 beats.'),
    watch('**Not counting rests.** A crotchet, a minim rest, then a crotchet. Counting 2 beats is wrong, because a rest is silence that still takes time. 1 + 2 + 1 = 4 beats.'),

    h('Try it'),
    practise({ label: 'Practise note values and rests (easy)', topics: ['rhythm'], level: 1 }),
    practise({ label: 'Practise dotted notes and beats (medium)', topics: ['rhythm'], level: 2 }),
    list('Next lesson: Time signatures: counting the beat.'),
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
    p('A **time signature** is the pair of numbers at the start of the music. The bottom number names a note value and the top number says how many of those notes fill each bar. It tells you how to count the music.'),
    p('Music is cut into equal pieces called bars (American English: measures). A bar line is the thin vertical line that marks the end of a bar. Every bar has the same length, and the time signature says what that length is.'),
    staffBlock(timeSignatureStaff(parseTimeSignature('3/4'), []), 'A time signature: here, 3/4. It is two numbers one above the other. It is not a fraction.'),
    words(
      { term: 'Time signature', meaning: 'The two numbers at the start of the music. The bottom number names a note value; the top number says how many of them fill a bar.' },
      { term: 'Bar', meaning: 'A short section of music between two bar lines (thin upright lines). Every bar in a piece has the same length.' },
      { term: 'Beat', meaning: 'The steady pulse of the music, the one you would tap your foot to. The main beats are the beats you tap.' },
      { term: 'Semibreve', meaning: 'A note that lasts 4 crotchet beats. The bottom number of a time signature counts how many of a note fill one semibreve.' },
      { term: 'Semiquaver', meaning: 'The shortest note used here, ¼ of a crotchet beat. 16 semiquavers fill a semibreve.' },
      { term: 'Simple time', meaning: 'Time in which each beat splits into two equal halves. The top number is 2, 3 or 4.' },
      { term: 'Compound time', meaning: 'Time in which each beat splits into three equal parts. The top number is 6, 9 or 12, and each beat is a dotted note.' },
      { term: 'Dotted', meaning: 'A dot after a note adds half of the note\'s own length. A dotted crotchet lasts as long as 3 quavers.' },
      { term: 'Duple', meaning: 'Two main beats in each bar. Triple means three, and quadruple means four.' },
      { term: 'Triple', meaning: 'Three main beats in each bar. Duple means two, and quadruple means four.' },
      { term: 'Quadruple', meaning: 'Four main beats in each bar. Duple means two, and triple means three.' },
      { term: 'Common time', meaning: 'Another name for 4/4, written as a letter C instead of two numbers.' },
    ),

    h('The two numbers'),
    p('The top number is about how many notes fill a bar. The bottom number says which note, and it is not a count. It is a note value, named by how many of that note fit into a semibreve, which lasts 4 beats.'),
    p('From the last lesson: a crotchet is 1 beat, a minim is 2, a semibreve is 4, a quaver is ½ and a semiquaver is ¼. A dot after a note adds half of the note\'s own length, so a dotted crotchet is 1½ beats.'),
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
    remember('Top number: how many units in a bar (simple time: the beats). Bottom number: which note value is one unit: 2 minim, 4 crotchet, 8 quaver, 16 semiquaver.'),

    h('Simple time'),
    p('In simple time the top number is 2, 3 or 4. The top number is the number of beats in the bar, and each beat splits into two. A crotchet beat splits into two quavers, for example.'),
    p('Count the beats aloud, with "&" (say "and") for the half-way point of each beat:'),
    list(
      '2/4: 1 & 2 &',
      '3/4: 1 & 2 & 3 &',
      '4/4: 1 & 2 & 3 & 4 &',
    ),
    p('4/4 is also written as a letter C, which is called common time.'),
    staffBlock(timeSignatureStaff(parseTimeSignature('3/4'), [{ name: 'crotchet' }, { name: 'crotchet' }, { name: 'crotchet' }]), 'A bar of 3/4: three crotchet beats. Count 1 2 3.'),

    h('Compound time'),
    p('In compound time the top number is 6, 9 or 12. Here each beat splits into three, so the notes are counted in groups of three. The main beat is a dotted note.'),
    p('Take 6/8. The bottom number 8 means quavers, so a bar has six quavers. They are grouped in threes: 3 + 3. Three quavers last as long as a dotted crotchet, so a bar of 6/8 has two main beats, each a dotted crotchet.'),
    table(
      ['Time signature', 'Quavers in the bar', 'Main beats', 'One beat is a'],
      ['6/8', '9/8', '12/8'].map((t) => {
        const ts = parseTimeSignature(t)
        const info = timeSignatureInfo(ts)
        return [t, String(ts.beats), String(info.pulses), info.pulseNote]
      }),
      'Compound time with quavers. Divide the top number by 3 to get the main beats.',
    ),
    remember('In compound time divide the top number by 3 to get the number of main beats: 6/8 has 2, 9/8 has 3, 12/8 has 4.'),
    staffBlock(
      timeSignatureStaff(parseTimeSignature('6/8'), [{ name: 'crotchet', dots: 1 }, { name: 'crotchet', dots: 1 }]),
      'A bar of 6/8: two dotted crotchets, so two main beats.',
    ),
    p('Some people count all six quavers in 6/8 as 1 2 3 4 5 6, with a stress on 1 and 4. That is a good way to feel it. But the questions in this app ask for the main beats, which are "the beats you would tap". In 6/8 that is 2, not 6.'),

    h('Naming the type: duple, triple, quadruple'),
    p('We name a time signature with two words. The first word says simple or compound. The second says how many main beats there are in a bar: 2 is duple, 3 is triple, 4 is quadruple.'),
    table(
      ['Type', 'Main beats', 'Examples'],
      TYPE_ORDER.map((label) => {
        const matching = TIME_SIGNATURES.filter((ts) => timeSignatureTypeLabel(ts) === label)
        return [label, String(timeSignatureInfo(matching[0]!).pulses), matching.map((ts) => tsText(ts.beats, ts.unit)).join(', ')]
      }),
      'The six types, with examples.',
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
    p('Look at the bar lengths of 3/4 and 6/8: both last 3 crotchet beats. They are the same length but feel different. 3/4 has three beats that each split into two. 6/8 has two beats that each split into three.'),

    h('Filling a bar'),
    p('A bar must add up exactly to the length the time signature gives. The easiest way to check is to measure everything in semiquavers, the shortest note used here. Then every sum is whole numbers.'),
    table(
      ['Note', 'Semiquavers'],
      NOTE_VALUES.map((v) => [v.name, String(v.semiquavers)]),
      'Each note in semiquavers. A dot adds half.',
    ),
    remember('Length of a bar in semiquavers = top number × (16 ÷ bottom number). 3/4: 3 × 4 = 12. 6/8: 6 × 2 = 12. 4/4: 4 × 4 = 16.'),

    h('The method: how many beats in a bar?'),
    steps(
      '**Read the two numbers.** The top number is above the bottom number at the start of the music.',
      '**Turn the bottom number into a note.** The bottom number says how many of that note fill a semibreve: 4 is a crotchet, 8 is a quaver.',
      '**Decide: simple or compound time.** A top number of 2, 3 or 4 is simple time. A top number of 6, 9 or 12 is compound time.',
      '**Read the beats from the top number.** Simple time only: the top number is the number of beats in the bar, and each beat is the note from the last step.',
      '**Group the quavers in threes.** Compound time only: the top number counts quavers. Divide it by 3 to get the number of main beats. (If the bottom number is not 8, group that note in threes instead: in 6/4 the groups are three crotchets.)',
      '**Name the beat note.** Compound time only: three quavers last as long as a dotted crotchet, so each beat is a dotted crotchet. (For another bottom number use the matching dotted note: in 6/4 each beat is a dotted minim.)',
      '**Check by counting the bar aloud, or by measuring in semiquavers.** In simple time count the bar in half-beats ("1 & 2 &") and divide by 2. In compound time divide the bar length in semiquavers by the length of one beat.',
    ),

    h('Worked examples: beats in a bar'),
    worked(timeSignatureExample(parseTimeSignature('3/4'), 'beats')),
    worked(timeSignatureExample(parseTimeSignature('2/2'), 'beats')),
    worked(timeSignatureExample(parseTimeSignature('12/8'), 'beats')),

    h('The method: naming the type'),
    steps(
      '**Read the top number.** It is the upper number of the time signature.',
      '**Decide: simple or compound time.** If it is 2, 3 or 4, the time is simple. If it is 6, 9 or 12, the time is compound.',
      '**Find the number of main beats.** Simple time: it is the top number. Compound time: divide the top number by 3.',
      '**Name the number of beats.** 2 is duple, 3 is triple, 4 is quadruple.',
      '**Put the two words together.** Say the kind of time first and the number of beats second: for example compound duple.',
      '**Check by measuring in semiquavers, or by counting the bar aloud.** Divide the bar length by the length of one beat. You should get the same number of beats.',
    ),

    h('Worked examples: naming the type'),
    worked(timeSignatureExample(parseTimeSignature('6/8'), 'classify')),
    worked(timeSignatureExample(parseTimeSignature('4/4'), 'classify')),
    worked(timeSignatureExample(parseTimeSignature('9/8'), 'classify')),

    h('The method: filling a bar'),
    steps(
      '**Read the time signature.** The bottom number names the note, and the top number says how many of that note fill the bar.',
      '**Work out the bar length in semiquavers.** Use the rule above: top number × (16 ÷ bottom number).',
      '**Work out each note\'s length, one at a time.** Write the length of each note you want to use in semiquavers, using the table above. A dot adds half.',
      '**Add the lengths with a running total.** Add one note at a time. Stop when the total equals the bar length. Less than the bar is not full, and more than the bar spills over.',
      '**Write the notes in the bar.** Write the notes in order after the time signature.',
      '**Check beat by beat.** Check against the beats instead of the total: every beat should be filled. In compound time, also check that the notes fit the groups of three.',
    ),

    h('Worked examples: filling a bar'),
    worked(timeSignatureExample(parseTimeSignature('3/4'), 'fill', [{ name: 'minim' }, { name: 'crotchet' }])),
    worked(timeSignatureExample(parseTimeSignature('6/8'), 'fill', [{ name: 'crotchet', dots: 1 }, { name: 'quaver' }, { name: 'quaver' }, { name: 'quaver' }])),

    h('Common mistakes'),
    watch('**Answering 6 for the beats in 6/8.** The top number counts quavers here. The main beats are the groups of three: 6 ÷ 3 = 2.'),
    watch('**Dividing by 3 in simple time.** 3/4 divided by 3 gives 1 beat, which is wrong. Only compound time (6, 9, 12) divides by 3. In 3/4 there are 3 beats.'),
    watch('**Calling 3/8 compound.** The top number is 3, so it is simple time with three main beats: simple triple. Compound time needs a top number of 6, 9 or 12.'),
    watch('**Forgetting what a dot adds when filling a bar.** A dotted crotchet counted as 4 semiquavers is wrong. The dot adds 2, so it is 4 + 2 = 6 semiquavers.'),

    h('Try it'),
    practise({ label: 'Practise time signatures (easy)', topics: ['rhythm'], level: 1 }),
    practise({ label: 'Practise time signatures, including compound time (medium)', topics: ['rhythm'], level: 2 }),
    list('Next lesson: Tones and semitones.'),
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
    p('A **semitone** is the smallest step in Western music: from one piano key to the very next key, black or white. A **tone** is two semitones, so one key lies between the two notes. Scales, key signatures and intervals are all built from these two steps, so once you can count them, much of music theory is counting.'),
    words(
      { term: 'Semitone', meaning: 'The smallest step in Western music: from one piano key to the very next key, black or white.' },
      { term: 'Tone', meaning: 'A step of two semitones, such as C up to D. There is one key between the two notes.' },
      { term: 'Natural semitone', meaning: 'A semitone between two neighbouring white keys, with no black key between them. There are two: E to F and B to C.' },
      { term: 'Octave', meaning: 'The distance from a note to the next note with the same letter name, such as C up to the next C. It is 12 semitones.' },
      { term: 'Sharp (♯)', meaning: 'A sign that raises a note by 1 semitone. C♯ is the key just above C.' },
      { term: 'Flat (♭)', meaning: 'A sign that lowers a note by 1 semitone. D♭ is the key just below D.' },
    ),

    h('Semitones and tones'),
    p('Look at a piano keyboard. The white keys carry the letter names A B C D E F G, and the pattern repeats along the keyboard. The black keys sit in alternating groups of two and three. Moving from one key to the very next, whatever its colour, is a semitone. Skipping one key is a tone.'),
    p('Most pairs of neighbouring white keys have a black key between them, so they are a tone apart. But there is no black key between E and F, and none between B and C. Those two pairs are only a semitone apart. They are called the natural semitones.'),
    table(
      ['Neighbouring letters', 'Distance'],
      'ABCDEFG'.split('').map((letter, i) => {
        const next = 'ABCDEFG'.charAt((i + 1) % 7)
        const gap = (pitchClass(note(next as Letter)) - pitchClass(note(letter as Letter)) + 12) % 12
        return [`${letter} to ${next}`, gap === 1 ? '**1 semitone**' : '1 tone (2 semitones)']
      }),
      'The two natural semitones are B to C and E to F.',
    ),
    remember('The two natural semitones are E to F and B to C. Every other pair of neighbouring letters is a tone.'),

    h('The twelve notes of an octave'),
    p('An octave is the distance from a note to the next note with the same name (C up to the next C). There are 12 different keys in an octave, counting white and black. Give each one a number, starting at C = 0.'),
    p('Each black key has two names. It is the sharp of the white key below it and the flat of the white key above it. A sharp ♯ raises a note by a semitone and a flat ♭ lowers it by a semitone. So the key numbered 1 is C♯ and also D♭.'),
    table(['Number', 'Name(s)', 'Key colour'], semitoneTableRows(), 'The twelve notes, numbered from C. The next C would be number 12.'),
    p('Each number is the number of semitones above C. After B (11) the next note is C again, one octave higher. That C is number 12.'),

    h('The method: counting semitones between two notes'),
    p('This method counts upwards, from the first note to the next note with the second name above it.'),
    steps(
      '**Number the piano keys from C.** Use the table above: C is 0 and each key up from C adds 1.',
      '**Find the number of the first note.** Look it up in the table.',
      '**Find the number of the second note.** Look it up in the table.',
      '**Add 12 to the number of the second note.** Only if the second number is smaller than the first. Going up you have passed the next C, which is number 12, so the second note counts as its number plus 12.',
      '**Subtract the first number from the second.** Each number is one key, so the difference is the number of semitones.',
      '**Say it in tones and semitones.** 2 semitones make 1 tone. An odd number leaves one extra semitone.',
      '**Check by counting key by key.** Start on the first note and do not count it. Count each key you move to, black or white, and stop on the second note.',
    ),

    h('Worked examples: counting semitones'),
    worked(semitoneCountExample(note('C'), note('G'))),
    worked(semitoneCountExample(note('E'), note('G'))),
    p('When the second note has a smaller number than the first, you have crossed from B to C. This is the tricky case:'),
    worked(semitoneCountExample(note('B'), note('D', -1))),

    h('Worked examples: a tone or a semitone?'),
    p('To decide whether one step is a tone or a semitone, use the same method and look at the difference. 1 is a semitone and 2 is a tone.'),
    worked(toneOrSemitoneExample(note('E'), note('F'))),
    worked(toneOrSemitoneExample(note('F'), note('G'))),
    worked(toneOrSemitoneExample(note('C', 1), note('D'))),
    p(`Remember that a black key has two names. For example, the key numbered 1 is ${noteLabel(note('C', 1))} or ${noteLabel(note('D', -1))}. Either name gives the same number, and so the same count.`),

    h('Common mistakes'),
    watch('**Counting the key you start on.** C to G. Counting C as 1 gives 8, which is wrong. Count the keys you move to, not the one you leave: G is number 7, so it is 7 semitones.'),
    watch('**Forgetting the natural semitones.** E to F. Calling it a tone is wrong, because there is no black key between E and F. It is 1 semitone.'),
    watch('**Forgetting to add 12.** B (11) to D♭ (1). Subtracting 1 − 11 gives a negative number, which cannot be a count going up. D♭ has passed the next C, so use 1 + 12 = 13. Then 13 − 11 = 2 semitones.'),
    watch('**Mixing up letter names and semitones.** C to G. Counting C, D, E, F, G gives 5 letter names, but the answer is 7 semitones. They are different counts.'),

    h('Try it'),
    p('Building a scale is a way of using tones and semitones. Try spelling scales:'),
    practise({ label: 'Practise scale spelling (easy)', topics: ['scales'], level: 1 }),
    list('Next lesson: Major scales: how to build any one.'),
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
