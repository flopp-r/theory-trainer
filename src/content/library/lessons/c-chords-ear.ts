import {
  CADENCE_TYPES,
  type CadenceType,
  type Chord,
  type ChordQuality,
  type ClefName,
  type Key,
  SEVENTH_QUALITIES,
  TRIAD_QUALITIES,
  cadence,
  chord,
  chordNotes,
  chordPitches,
  chordSymbol,
  diatonicChords,
  intervalName,
  intervalSemitones,
  note,
  type Pitch,
  parseInterval,
  parseKey,
  parsePitch,
  primaryChords,
  transpose,
} from '../../../theory'
import { cadenceAudio, chordAudio, intervalAudio } from '../../../questions/earAudio'
import { chordWords } from '../../../questions/chords'
import { fitsOnStaff, keyLabel, notesLabel } from '../../../questions/pitchTools'
import { VOCABULARY, type VocabCategory } from '../../vocabulary'
import { listenChord } from '../builders/audio'
import { chordPicture, chordSequenceAudio, identifySeventhExample, identifyTriadExample, buildSeventhExample, buildTriadExample, sharedPictures, SEVENTH_NAME, SEVENTH_RECIPE, TRIAD_RECIPE } from '../builders/chords'
import { cadenceExample, PATTERN } from '../builders/cadences'
import { earCadenceExample, earChordExample, earIntervalExample, earInversionExample } from '../builders/ear'
import { chordSymbolExample, inversionExample, readChordSymbolExample, SYMBOL_CODE } from '../builders/inversions'
import { chordFromNumeralExample, primaryChordsExample, romanNumeralExample } from '../builders/romanNumerals'
import { chordsOnStaff, h, list, listenBlock, p, practise, remember, staffBlock, steps, table, tip, watch, words, worked } from '../builders/common'
import type { Block, LibraryLesson } from '../types'

/*
 * Chords, cadences, vocabulary and ear training.
 * Every spelling, count and sound in these lessons comes from the theory engine (directly, or through the builders).
 * Only the explanations are written by hand.
 */

const capital = (text: string) => text.charAt(0).toUpperCase() + text.slice(1)
const symbolOf = (c: Chord, inversion = 0) => chordSymbol(c, { inversion, style: 'symbol' })
const notesOf = (c: Chord) => notesLabel(chordNotes(c))
const C_MAJOR = parseKey('C major')

/** A chord in each of its positions, all with the lowest note in octave 4 so that the pictures and sounds line up. */
function positionsOf(c: Chord): Pitch[][] {
  const count = chordNotes(c).length
  return Array.from({ length: count }, (_, inversion) => {
    const pitches = chordPitches(c, { inversion, bassOctave: 4 })
    if (!fitsOnStaff(pitches, 'treble', 1)) throw new Error('A chord position does not fit the treble staff')
    return pitches
  })
}

const TRIADS_LESSON: LibraryLesson = {
  id: 'triads',
  title: 'Triads: major, minor, diminished and augmented',
  group: 'chords',
  summary: 'What a triad is, the four types, and how to build and name each one.',
  before: ['intervals'],
  covers: ['triad-on-staff', 'chord-notes'],
  build: () => {
    const onC = TRIAD_QUALITIES.map((q) => chord('C', q))
    const pictures = sharedPictures(onC, 'treble')
    const typeRows = TRIAD_QUALITIES.map((q) => {
      const r = TRIAD_RECIPE[q as keyof typeof TRIAD_RECIPE]
      return [capital(q), `${r.lower} (${r.lowerSemis}), then ${r.upper} (${r.upperSemis})`, `${r.fifthName} (${r.fifth})`, notesOf(chord('C', q))]
    })
    const intervalRows = ['m3', 'M3', 'd5', 'P5', 'A5'].map((s) => [intervalName(parseInterval(s)), String(intervalSemitones(parseInterval(s)))])
    const cMajorNotes = chordNotes(chord('C', 'major'))
    const cMinorNotes = chordNotes(chord('C', 'minor'))
    const cDimNotes = chordNotes(chord('C', 'diminished'))
    const cAugNotes = chordNotes(chord('C', 'augmented'))
    return [
      p('A **chord** is three or more notes sounded together. A **triad** is the simplest chord: three notes stacked in 3rds, which means each note is a 3rd above the one below it. Triads are the building blocks of harmony, the chords that sit under a tune, so building and naming them is the first step to seeing how a piece of music is put together.'),
      p('There are four kinds of triad: major, minor, diminished and augmented. They differ by only a semitone or two, yet they sound very different. Here is the best known, C major. Press the button to hear it.'),
      staffBlock(chordsOnStaff('treble', [pictures[0]!]), 'A C major triad: three notes on neighbouring lines.'),
      listenBlock('Hear a C major triad', chordAudio(pictures[0]!, 'block')),
      words(
        { term: 'Chord', meaning: 'Three or more notes sounded together.' },
        { term: 'Triad', meaning: 'A chord of three notes stacked in 3rds: the root, the 3rd and the 5th.' },
        { term: 'Root', meaning: 'The note a chord is built on and named after. When the chord is stacked in 3rds, it is the lowest note.' },
        { term: 'Stacked in 3rds', meaning: 'Each note is a 3rd above the one below: skip one letter name and take the next, as in C, E, G.' },
        { term: 'Interval', meaning: 'The distance between two notes. Its number counts letter names (a 3rd, a 5th); its exact size is counted in semitones.' },
        { term: '3rd', meaning: 'The chord note 3 letter names above the root, counting the root as 1. From C (C, D, E) the 3rd is a kind of E.' },
        { term: '5th', meaning: 'The chord note 5 letter names above the root, counting the root as 1. From C the 5th is a kind of G.' },
        { term: 'Semitone', meaning: 'The smallest step in Western music: from one piano key to the very next key, black or white.' },
        { term: 'Major 3rd', meaning: 'A 3rd that spans 4 semitones, such as C up to E.' },
        { term: 'Minor 3rd', meaning: 'A 3rd that spans 3 semitones, such as A up to C.' },
        { term: 'Perfect 5th', meaning: 'A 5th that spans 7 semitones, such as C up to G.' },
        { term: 'Natural', meaning: 'A note with no sharp or flat, such as G or B.' },
        { term: 'Sharp (♯)', meaning: 'A sign that raises a note by 1 semitone. F♯ is 1 semitone higher than F.' },
        { term: 'Flat (♭)', meaning: 'A sign that lowers a note by 1 semitone. B♭ is 1 semitone lower than B.' },
        { term: 'Key signature', meaning: 'The sharps or flats at the start of each line of music. They apply to every note with that letter name.' },
        { term: 'Root position', meaning: 'A chord with its root as the lowest note.' },
      ),

      h('Counting semitones on the piano'),
      p('Triads are built by counting semitones, the steps between piano keys. Most white keys have a black key between them, so most neighbouring letter names are 2 semitones apart. The two exceptions are E to F and B to C: there is no black key between them, so each of those is only 1 semitone.'),
      table(
        ['Neighbouring letters', 'Semitones'],
        [
          ['C to D', '2'],
          ['D to E', '2'],
          ['E to F', '**1**'],
          ['F to G', '2'],
          ['G to A', '2'],
          ['A to B', '2'],
          ['B to C', '**1**'],
        ],
        'Learn the two ones: E to F and B to C.',
      ),
      p('A sharp or a flat changes the gap it touches. Raise the top note or lower the bottom note and the gap becomes 1 bigger. Lower the top note or raise the bottom note and it becomes 1 smaller. For example E to G is 3 semitones (E to F is 1, F to G is 2), but E♭ to G is 4, because the flat lowers the bottom note.'),

      h('The sizes of 3rds and 5ths'),
      p('The number of an interval counts letter names, with the first one counted as 1. C up to E is a 3rd: C, D, E is 3 letter names. C up to G is a 5th: C, D, E, F, G is 5 letter names. The semitones then give the interval its kind. These are the five sizes that triads use:'),
      table(['Interval', 'Semitones'], intervalRows, 'A diminished 5th is 1 semitone smaller than a perfect 5th. An augmented 5th is 1 semitone bigger.'),

      h('Stacking in 3rds'),
      p('To stack notes in 3rds you skip one letter name each time. Start on C: skip D and take E; skip F and take G. The letters are C, E, G. On the staff, a triad in this basic form is three notes on neighbouring lines, or three notes in neighbouring spaces.'),
      p('The lowest note is the root, and it gives the chord its name. The middle note is the 3rd and the top note is the 5th. In C, E, G the root is C, the 3rd is E and the 5th is G. A chord with its root at the bottom is in root position.'),

      h('The four triads'),
      p('What makes a triad major, minor, diminished or augmented is the size of its two 3rds. The lower 3rd goes from the root up to the 3rd. The upper 3rd goes from the 3rd up to the 5th. A major 3rd is 4 semitones and a minor 3rd is 3 semitones.'),
      table(['Type', 'Two thirds (in semitones)', 'Root to 5th', 'On C'], typeRows, 'The four triads. Read each row left to right.'),
      remember('Major: 4 then 3 semitones. Minor: 3 then 4. Diminished: 3 then 3. Augmented: 4 then 4.'),
      p('Here are all four on C. Listen to each one and see how the notes change.'),
      staffBlock(chordsOnStaff('treble', pictures), 'C major, C minor, C diminished and C augmented, left to right.'),
      listenBlock('Hear C major', chordAudio(pictures[0]!, 'block')),
      listenBlock('Hear C minor', chordAudio(pictures[1]!, 'block')),
      listenBlock('Hear C diminished', chordAudio(pictures[2]!, 'block')),
      listenBlock('Hear C augmented', chordAudio(pictures[3]!, 'block')),
      tip(
        `A memory aid for how the four are related. A minor triad is a major triad with its 3rd lowered by a semitone (${notesLabel(cMajorNotes)} becomes ${notesLabel(cMinorNotes)}). A diminished triad is a minor triad with its 5th lowered by a semitone (${notesLabel(cMinorNotes)} becomes ${notesLabel(cDimNotes)}). An augmented triad is a major triad with its 5th raised by a semitone (${notesLabel(cMajorNotes)} becomes ${notesLabel(cAugNotes)}).`,
      ),

      h('Method 1: build a triad'),
      p('Use this when you are given a root and a type, such as "build E♭ major". Each step has the same title as the matching step in the worked examples, so you can see it done.'),
      steps(
        '**Write the root.** Write the note the chord is named after, with any sharp or flat it has. For E♭ major the root is E♭.',
        '**Write the letter names.** Skip one letter name and take the next, then do it again. From E: skip F and take G; skip A and take B. The letters are E, G, B. Sharps and flats come later.',
        '**Look up the recipe.** Find the type in the table and read off how many semitones the 3rd and the 5th are above the root: major 4 and 7, minor 3 and 7, diminished 3 and 6, augmented 4 and 8.',
        '**Count from the root up to the 3rd.** Add up the semitones one letter at a time, using the white-key table: from E to G is E to F (1) plus F to G (2), which is 3. Then allow for any sharp or flat on the root: for E♭ the flat makes the gap 1 bigger, so 3 becomes 4.',
        '**Make the 3rd a major or minor 3rd.** Compare your count with the recipe. If it is too small, raise the letter with a sharp. If it is too big, lower it with a flat. Use one sign for each semitone. If it matches, the note stays natural, with no sign.',
        '**Count from the root up to the 5th.** Count from the root again, not from the 3rd: E to F (1), F to G (2), G to A (2), A to B (2) is 7. The flat on E♭ makes it 8.',
        '**Make the 5th a perfect, diminished or augmented 5th.** Compare with the recipe in the same way. A count of 8 against a recipe of 7 is 1 too many, so lower B to B♭.',
        '**Write the triad out.** Read your notes from the root up. On the staff they sit on three neighbouring lines or in three neighbouring spaces, because each note skips one letter name. For E♭ major: E♭ G B♭.',
        '**Check another way: count the 3rds by piano keys.** Count up one piano key at a time, from the root to the 3rd and then from the 3rd to the 5th. The two counts must match the type, for example 4 then 3 for major.',
      ),
      h('Worked examples: building triads'),
      p('Follow each one all the way through. Then cover the steps and try the next one on your own.'),
      worked(buildTriadExample(note('E', -1), 'major')),
      worked(buildTriadExample(note('F', 1), 'minor')),
      worked(buildTriadExample(note('B'), 'diminished')),
      worked(buildTriadExample(note('C'), 'augmented')),

      h('Method 2: name a triad on the staff'),
      p('Use this when you are shown a triad and asked what type it is. You work out the two 3rds and match them to the table.'),
      steps(
        '**Name the notes from the bottom up.** Use the clef to name each note. Keep any sharp or flat written in front of a note, or given by the key signature.',
        '**Check the notes are stacked in 3rds.** Each letter must skip one: C, E, G skips D and then F. If it does, the lowest note is the root and the chord is in root position. If it does not, the chord is turned upside down: see the Inversions lesson.',
        '**Count from the root up to the 3rd.** Count the semitones from the lowest note to the middle note, one letter at a time, and allow for any sharp or flat. 4 is a major 3rd and 3 is a minor 3rd.',
        '**Count from the 3rd up to the 5th.** Count the semitones from the middle note to the top note in the same way. This is the upper 3rd.',
        '**Match the two 3rds to a triad type.** 4 then 3 is major. 3 then 4 is minor. 3 then 3 is diminished. 4 then 4 is augmented. Name the chord with its root and type, for example "E♭ major".',
        '**Check another way: count from the root to the 5th.** Count one piano key at a time from the root to the top note. It must be 7 for major and minor, 6 for diminished and 8 for augmented, which is the sum of your two 3rds.',
      ),
      h('Worked examples: naming triads'),
      worked(identifyTriadExample(chordPicture(chord('D', 'minor'), 'treble'))),
      worked(identifyTriadExample(chordPicture(chord('G#', 'diminished'), 'treble'))),
      worked(identifyTriadExample(chordPicture(chord('A', 'augmented'), 'treble'))),
      p('Look at the top note of the last example: E♯, not F. They are the same piano key, but the letters must skip one letter name each time (A, C, E), so the 5th above A has to be some kind of E.'),

      h('Common mistakes'),
      watch('**Using the wrong letter.** For D major, the wrong answer is D G♭ A. G♭ is the same piano key as F♯, but D up to G is a 4th, not a 3rd. The right answer is D F♯ A, because D, F, A skips one letter each time.'),
      watch('**Counting from the wrong root.** To find the 3rd of E♭ major, the wrong way counts from E: E to G is 3 semitones, so G is lowered to G♭. The right way counts from E♭: E♭ to G is 4 semitones, so G stays natural and the triad is E♭ G B♭.'),
      watch('**Mixing up minor and diminished.** Take the notes B D F♯ and B D F. They share the root B and the 3rd D. Only the 5th differs: F♯ is 7 semitones up, a perfect 5th, so B D F♯ is B minor. F is 6 semitones up, a diminished 5th, so B D F is B diminished.'),
      watch('**Forgetting the key signature.** On a staff with one sharp, the key signature of G major, the notes D, F, A are really D, F♯, A. The wrong reading is D F A, which is D minor. The right reading is D F♯ A, which is D major.'),

      h('Try it'),
      p('Start with Easy, which uses major and minor triads. Move on when you are getting most of them right.'),
      practise({ label: 'Practise triads and chord building (easy)', topics: ['chords'], level: 1, clefs: ['treble'] }),
      practise({ label: 'Practise triads and chord building (medium)', topics: ['chords'], level: 2, clefs: ['treble'] }),
      list('Next lesson: Seventh chords, which are triads with one more note on top.'),
    ]
  },
}

const SEVENTH_LESSON: LibraryLesson = {
  id: 'seventh-chords',
  title: 'Seventh chords',
  group: 'chords',
  summary: 'A triad with a 7th added: the five types, how to build each one and how to name one on a staff.',
  before: ['triads'],
  covers: ['seventh-on-staff'],
  build: () => {
    const g7 = chord('G', 'dominant7')
    const g7Pitches = chordPicture(g7, 'treble')
    const onC = SEVENTH_QUALITIES.map((q) => chord('C', q))
    const pictures = sharedPictures(onC, 'treble')
    const rows = SEVENTH_QUALITIES.map((q) => {
      const r = SEVENTH_RECIPE[q as keyof typeof SEVENTH_RECIPE]
      return [capital(SEVENTH_NAME[q as keyof typeof SEVENTH_NAME]), `a ${r.triad} triad + a ${r.seventhName}`, `${r.third}, ${r.fifth}, ${r.seventh}`, notesOf(chord('C', q))]
    })
    const dim7 = chordNotes(chord('C', 'diminished7'))
    return [
      p('A **7th chord** is a triad with one more note on top: a 7th above the root. That makes four notes, each a 3rd above the one below: the root, the 3rd, the 5th and the 7th. The extra note makes the sound richer and less settled, which is why 7th chords are common in jazz, blues and pop as well as in classical music.'),
      p('The best known is the dominant 7th chord on G, written G7: G, B, D, F. Press the button to hear it.'),
      staffBlock(chordsOnStaff('treble', [g7Pitches]), 'G7: four notes stacked in thirds. Each note is on the next line, or the next space.'),
      listenBlock('Hear G7', listenChord('G7', g7Pitches).audio),
      words(
        { term: '7th chord', meaning: 'A triad with one more note on top, a 7th above the root: four notes stacked in 3rds.' },
        { term: 'Triad', meaning: 'A chord of three notes stacked in 3rds: the root, the 3rd and the 5th.' },
        { term: 'Root', meaning: 'The note a chord is built on and named after. When the chord is stacked in 3rds, it is the lowest note.' },
        { term: '3rd', meaning: 'The chord note 3 letter names above the root, counting the root as 1. From C (C, D, E) the 3rd is a kind of E.' },
        { term: '5th', meaning: 'The chord note 5 letter names above the root, counting the root as 1. From C the 5th is a kind of G.' },
        { term: '7th', meaning: 'The chord note 7 letter names above the root, counting the root as 1. From C the 7th is a kind of B.' },
        { term: 'Semitone', meaning: 'The smallest step in Western music: from one piano key to the very next key, black or white.' },
        { term: 'Octave', meaning: 'From a note to the next note up with the same letter name: 8 letter names, or 12 semitones.' },
        { term: 'Natural', meaning: 'A note with no sharp or flat, such as G or B.' },
        { term: 'Double flat (♭♭)', meaning: 'Lowers a note by 2 semitones. B♭♭ is the same piano key as A.' },
        { term: 'Minor 7th', meaning: 'A 7th that spans 10 semitones, 2 fewer than an octave, such as C up to B♭.' },
        { term: 'Major 7th', meaning: 'A 7th that spans 11 semitones, 1 fewer than an octave, such as C up to B.' },
        { term: 'Diminished 7th', meaning: 'A 7th that spans 9 semitones, 3 fewer than an octave, such as C up to B♭♭.' },
        { term: 'Dominant 7th chord', meaning: 'A major triad with a minor 7th on top. It is the 7th chord found on the dominant (scale degree 5) of a major key.' },
        { term: 'Half-diminished 7th chord', meaning: 'A diminished triad with a minor 7th on top.' },
        { term: 'Diminished 7th chord', meaning: 'A diminished triad with a diminished 7th on top: every note is a minor 3rd above the one below.' },
      ),

      h('The sizes of a 7th'),
      p('A 7th counts letter names with the first one as 1: C up to B is a 7th (C, D, E, F, G, A, B is 7 letter names). Its kind comes from how far it falls below the octave. An octave is 12 semitones, so a major 7th is 1 semitone below the octave (11 semitones), a minor 7th is 2 below (10) and a diminished 7th is 3 below (9).'),
      table(
        ['Interval from the root', 'Semitones'],
        ['m7', 'M7', 'd7'].map((s) => [intervalName(parseInterval(s)), String(intervalSemitones(parseInterval(s)))]),
        'A major 7th is one semitone below the octave. A minor 7th is two semitones below it. A diminished 7th is three semitones below it.',
      ),

      h('The five 7th chords'),
      p('A 7th chord is named by two things: the type of triad at the bottom (its first three notes) and the type of 7th on top. This app uses five types:'),
      table(['Type', 'Built from', 'Semitones above the root: 3rd, 5th, 7th', 'On C'], rows, 'The five 7th chords, on the root C.'),
      remember('Dominant 7th: major triad + minor 7th. Major 7th: major triad + major 7th. Minor 7th: minor triad + minor 7th. Half-diminished 7th: diminished triad + minor 7th. Diminished 7th: diminished triad + diminished 7th.'),
      p('Here are the five on C, then the sound of each.'),
      staffBlock(chordsOnStaff('treble', pictures), 'From the left: C7 (dominant 7th), Cmaj7 (major 7th), Cm7 (minor 7th), Cm7b5 (half-diminished 7th) and Cdim7 (diminished 7th).'),
      ...SEVENTH_QUALITIES.map((q, i) => listenBlock(`Hear C ${SEVENTH_NAME[q as keyof typeof SEVENTH_NAME]}`, chordAudio(pictures[i]!, 'block'))),
      tip(
        `Look at the diminished 7th on C: ${notesLabel(dim7)}. Every note is a minor 3rd (3 semitones) above the one before. The top note is 9 semitones above the root, which is the same piano key as A. It is written as a 7th, not as an A, because the 7th above C must use the letter B. That is why the top note needs a double flat: B♭♭.`,
      ),
      tip('A memory aid for the name "half-diminished": the triad is diminished but the 7th is only a minor 7th, so only half of the chord is diminished. The full diminished 7th has a diminished triad and a diminished 7th.'),

      h('Method 1: build a 7th chord'),
      p('Use this when you are given a root and a type, such as "build G dominant 7th". The steps are the same as for a triad, with one more note to count.'),
      steps(
        '**Write the root.** Write the note the chord is named after, with any sharp or flat it has. For G dominant 7th the root is G.',
        '**Write the letter names.** Skip one letter name and take the next, three times. From G: skip A and take B; skip C and take D; skip E and take F. The letters are G, B, D, F. Sharps and flats come later.',
        '**Look up the recipe.** Find the type in the table and read off how many semitones the 3rd, the 5th and the 7th are above the root. A dominant 7th chord is 4, 7 and 10.',
        '**Count from the root up to the 3rd.** Add up the semitones one letter at a time: 2 for each step between neighbouring natural letters, except E to F and B to C, which are 1. From G to B is G to A (2) plus A to B (2), which is 4. If the root or the note you count to has a sharp or flat, allow for it: raising the top note or lowering the bottom note makes the gap 1 bigger, and the reverse makes it 1 smaller.',
        '**Make the 3rd a major or minor 3rd.** Compare your count with the recipe. If it is too small, raise the letter with a sharp (♯ raises a note by 1 semitone). If it is too big, lower it with a flat (♭ lowers a note by 1 semitone). Use one sign for each semitone. If it matches, the note stays natural.',
        '**Count from the root up to the 5th.** Always count from the root, not from the note before, so that one slip cannot spoil the rest. From G to D is 2, 2, 1, 2, which is 7.',
        '**Make the 5th a perfect or diminished 5th.** Compare with the recipe in the same way. 7 matches a perfect 5th, so D stays natural.',
        '**Count from the root up to the 7th.** From G to F is 2, 2, 1, 2, 2, 1, which is 10.',
        '**Make the 7th a minor, major or diminished 7th.** Compare with the recipe. 10 matches a minor 7th, so F stays natural.',
        '**Write the chord out.** Read your notes from the root up. On the staff they sit on four neighbouring lines or in four neighbouring spaces, because each note skips one letter name. Here: G B D F.',
        '**Check another way: the triad at the bottom.** Count up one piano key at a time between the lower three notes. They must make the triad the recipe names: for G dominant 7th, G to B is 4 and B to D is 3, which is a major triad.',
        '**Check another way: count down from the octave.** The octave above the root is 12 semitones up. Count down one piano key at a time from it to your 7th: 1 step for a major 7th, 2 for a minor 7th, 3 for a diminished 7th.',
      ),
      h('Worked examples: building 7th chords'),
      worked(buildSeventhExample(note('G'), 'dominant7')),
      worked(buildSeventhExample(note('D'), 'minor7')),
      worked(buildSeventhExample(note('C'), 'major7')),
      worked(buildSeventhExample(note('B'), 'half-diminished7')),
      worked(buildSeventhExample(note('C'), 'diminished7')),

      h('Method 2: name a 7th chord on the staff'),
      p('Use this when you are shown a 7th chord and asked what type it is. You count three distances from the root and match them to the table.'),
      steps(
        '**Name the notes from the bottom up.** Use the clef to name each note. Keep any sharp or flat written in front of a note, or given by a key signature (the sharps or flats at the start of the staff).',
        '**Check the notes are stacked in 3rds.** Each letter must skip one. If it does, the lowest note is the root and the chord is in root position.',
        '**Count from the root up to the 3rd.** Count the semitones one letter at a time, and allow for any sharp or flat.',
        '**Count from the root up to the 5th.** Count from the root again, not from the 3rd.',
        '**Count from the root up to the 7th.** Count from the root once more. You now have three numbers.',
        '**Match the three counts to a 7th chord type.** 4, 7, 10 is a dominant 7th. 4, 7, 11 is a major 7th. 3, 7, 10 is a minor 7th. 3, 6, 10 is a half-diminished 7th. 3, 6, 9 is a diminished 7th. Name the chord with its root and type.',
        '**Check another way: count the 3rds between neighbours.** Count up one piano key at a time from note to note: root to 3rd, 3rd to 5th, 5th to 7th. Add the three counts. The total must equal your count from the root to the 7th.',
      ),
      h('Worked examples: naming 7th chords'),
      worked(identifySeventhExample(chordPicture(chord('E', 'minor7'), 'treble'))),
      worked(identifySeventhExample(chordPicture(chord('Ab', 'dominant7'), 'treble'))),
      p('In the second example the top note is G♭, not F♯. They are the same piano key, but the letters must skip one letter name each time (A, C, E, G), so the 7th above A♭ has to be some kind of G.'),

      h('Common mistakes'),
      watch('**Mixing up dominant and major 7ths.** Asked for Cmaj7, the wrong answer is C E G B♭, which is C7, the dominant 7th (10 semitones to the top note). The right answer is C E G B: the 7th is 11 semitones above C.'),
      watch('**Mixing up half-diminished and diminished.** Both start with the diminished triad C E♭ G♭. Asked for Cdim7, the wrong answer is C E♭ G♭ B♭, which is half-diminished (10 semitones to the top note). The right answer is C E♭ G♭ B♭♭ (9 semitones).'),
      watch('**Writing A instead of B♭♭.** In Cdim7 the top note is 9 semitones above C, which is the same piano key as A. The wrong answer is C E♭ G♭ A: A is a 6th above C. The right answer is C E♭ G♭ B♭♭, because a 7th above C must use the letter B.'),
      watch('**Thinking a dominant 7th only exists on note 5.** The wrong idea is "C7 is not a dominant 7th, because C is note 1 of C major". The right idea is that "dominant 7th" names a type: a major triad with a minor 7th. It is found on note 5 of a major key, but you can build it on any note.'),

      h('Try it'),
      p('Easy uses the dominant, major and minor 7th chords. Medium adds the half-diminished 7th, and Hard adds the diminished 7th.'),
      practise({ label: 'Practise 7th chords (easy)', topics: ['chords'], level: 1, clefs: ['treble'] }),
      practise({ label: 'Practise 7th chords (hard)', topics: ['chords'], level: 3, clefs: ['treble'] }),
      list('Next lesson: Inversions and chord symbols.'),
    ]
  },
}

const INVERSIONS_LESSON: LibraryLesson = {
  id: 'inversions-chord-symbols',
  title: 'Inversions and chord symbols',
  group: 'chords',
  summary: 'Which note is at the bottom of a chord, and the shorthand symbols such as Am7 and C/E.',
  before: ['seventh-chords'],
  covers: ['inversion', 'chord-symbol'],
  build: () => {
    const c = chord('C', 'major')
    const positions = positionsOf(c)
    const g7 = chord('G', 'dominant7')
    const g7Positions = positionsOf(g7)
    const symbolRows = [...TRIAD_QUALITIES, ...SEVENTH_QUALITIES].map((q) => {
      const ch = chord('C', q as ChordQuality)
      return [symbolOf(ch), SYMBOL_CODE[q as ChordQuality] === '' ? 'nothing' : SYMBOL_CODE[q as ChordQuality], chordWords(ch)]
    })
    return [
      p('A chord does not have to have its root at the bottom. An **inversion** is the same chord with a different note as its lowest note. The notes and the name of the chord stay the same: only the lowest note changes. Composers use inversions to make the bass line, the lowest notes one after another, move smoothly from chord to chord.'),
      p('A **chord symbol** is a short way of writing a chord with letters and numbers, such as Am7 or C/E. Song books often show chords this way.'),
      words(
        { term: 'Inversion', meaning: 'A chord with a note other than the root as its lowest note. The notes and the chord name stay the same.' },
        { term: 'Root', meaning: 'The note a chord is built on and named after. When the chord is stacked in 3rds, it is the lowest note.' },
        { term: 'Root position', meaning: 'A chord with its root as the lowest note.' },
        { term: 'First inversion', meaning: 'A chord with its 3rd as the lowest note.' },
        { term: 'Second inversion', meaning: 'A chord with its 5th as the lowest note.' },
        { term: 'Third inversion', meaning: 'A 7th chord with its 7th as the lowest note. Only 7th chords have a third inversion.' },
        { term: 'Bass note', meaning: 'The lowest note of a chord as it is written or played.' },
        { term: 'Stacked in 3rds', meaning: 'Each note is a 3rd above the one below: skip one letter name and take the next, as in C, E, G.' },
        { term: '3rd', meaning: 'The chord note 3 letter names above the root, counting the root as 1. From C (C, D, E) the 3rd is a kind of E.' },
        { term: '5th', meaning: 'The chord note 5 letter names above the root, counting the root as 1. From C the 5th is a kind of G.' },
        { term: '7th', meaning: 'The chord note 7 letter names above the root, counting the root as 1. From C the 7th is a kind of B.' },
        { term: 'Triad', meaning: 'A chord of three notes stacked in 3rds: the root, the 3rd and the 5th.' },
        { term: '7th chord', meaning: 'A triad with one more note on top, a 7th above the root: four notes stacked in 3rds.' },
        { term: 'Figured bass', meaning: 'Numbers that show the intervals above the bass note, counted in letter names. They show which inversion a chord is in.' },
        { term: 'Chord symbol', meaning: 'A short name for a chord in letters and numbers, such as Am7: the root, then an ending for the type.' },
        { term: 'Slash chord', meaning: 'A chord symbol with a slash, such as C/E. The note after the slash is the bass note.' },
      ),
      p('Here is C major three ways: the same three notes, with a different one at the bottom each time.'),
      staffBlock(chordsOnStaff('treble', positions), 'C major: C E G, then E G C, then G C E. The same notes, three different lowest notes.'),
      listenBlock('Hear C E G', chordAudio(positions[0]!, 'block')),
      listenBlock('Hear E G C', chordAudio(positions[1]!, 'block')),
      listenBlock('Hear G C E', chordAudio(positions[2]!, 'block')),
      h('Naming the inversion'),
      p('The name of an inversion depends only on which note of the chord is the lowest.'),
      table(
        ['Lowest note', 'Name', 'Triad figure', '7th chord figure'],
        [
          ['the root', 'root position', '5/3', '7'],
          ['the 3rd', 'first inversion', '6', '6/5'],
          ['the 5th', 'second inversion', '6/4', '4/3'],
          ['the 7th', 'third inversion', '(none: triads have no 7th)', '4/2'],
        ],
        'Third inversion exists only for 7th chords.',
      ),
      remember('Look at the lowest note and ask which note of the chord it is. Root: root position. 3rd: first inversion. 5th: second inversion. 7th: third inversion.'),
      p('The last two columns are figured bass: numbers that say which intervals sit above the bass note. In first inversion C major (E G C) the G is a 3rd above the bass E and the C is a 6th above it, so the figure is 6/3, shortened to 6. You will see these figures in the explanations in Practice. The names in the first two columns are what the questions ask for.'),
      p('Here is G7 in all four positions.'),
      staffBlock(chordsOnStaff('treble', g7Positions), 'G7 from the left: root position (G B D F), first inversion (B D F G), second inversion (D F G B), third inversion (F G B D).'),

      h('Chord symbols'),
      p('A chord symbol is the root, then an ending that names the type. The ending for each type is in the table, with the chord on C as the example.'),
      table(['Symbol on C', 'Ending', 'Chord'], symbolRows, 'The same nine chords as in the last two lessons. A letter on its own means a major triad.'),
      remember('A chord symbol is the root, then an ending for the type. A slash and a note at the end, as in C/E, says which note is at the bottom.'),
      p('In Cm7b5 the "b" is a flat sign: the 5th is flattened, which is what makes the triad diminished. Other books may write the same chords slightly differently (for example Cmin for Cm, C+ for Caug, C° for Cdim, CM7 or CΔ7 for Cmaj7, Cø for Cm7b5). In this app, use the forms in the table.'),
      p('A slash chord such as C/E means "the chord C, with E in the bass". E is the 3rd of C major, so C/E is C major in first inversion: the notes E G C, lowest first. In this app the note after the slash is always one of the chord\'s own notes, so a slash chord is always an inversion.'),

      h('Method 1: find the inversion'),
      p('Use this when you are shown a chord on a staff and asked which inversion it is in. You find the root first, because the inversion is named by which chord note is lowest.'),
      steps(
        '**Name the notes from the bottom up.** Use the clef to name each note. Keep any sharp or flat written in front of a note, or given by the key signature.',
        '**Try each note as the root.** Count letter names up from the note, counting it as 1. The root has the other notes a 3rd and a 5th above it (and a 7th, for a 7th chord). From E in E G C, the C is a 6th, so E is not the root. The note that works is the root.',
        '**Stack the notes in 3rds from the root.** Write the notes again starting from the root, each one a 3rd above the one before. This is the chord in root position.',
        '**Count from the root up to the 3rd.** Count the semitones one letter at a time (2 each, except E to F and B to C, which are 1), and allow for any sharp or flat on the root or the note.',
        '**Count from the root up to the 5th.** Count from the root again. For a 7th chord, count the 7th from the root too.',
        '**Match the counts to a chord type.** Triads, 3rd and 5th: major 4 and 7, minor 3 and 7, diminished 3 and 6, augmented 4 and 8. 7th chords, 3rd, 5th and 7th: dominant 7th 4, 7, 10; major 7th 4, 7, 11; minor 7th 3, 7, 10; half-diminished 7th 3, 6, 10; diminished 7th 3, 6, 9.',
        '**Find the bass note.** The bass note is the lowest note on the staff. Say which chord note it is: the root, the 3rd, the 5th or the 7th.',
        '**Name the inversion from the bass note.** Root in the bass is root position. 3rd is first inversion. 5th is second inversion. 7th is third inversion, for 7th chords only.',
        '**Write the figured bass.** Count letter names up from the bass note, counting it as 1, and write the numbers from the largest down. Then shorten: 6/3 becomes 6.',
        '**Check another way: turn the chord over.** Start from root position and move the bottom note to the top once for each inversion. You should arrive at the notes as written.',
      ),
      h('Worked examples: finding the inversion'),
      worked(inversionExample(c, 1)),
      worked(inversionExample(chord('F#', 'minor'), 2)),
      worked(inversionExample(g7, 3)),

      h('Method 2: write the chord symbol'),
      p('Use this when you are shown a chord on a staff and asked for its symbol. You find the root and the type as in Method 1, then write the symbol.'),
      steps(
        '**Name the notes from the bottom up.** Use the clef, the key signature and any signs in front of notes.',
        '**Try each note as the root.** The root has the other notes a 3rd and a 5th above it (and a 7th, for a 7th chord).',
        '**Stack the notes in 3rds from the root.** Write the chord again in root position, so the counts are easy to make.',
        '**Count from the root up to the 3rd.** Count the semitones one letter at a time, and allow for any sharp or flat.',
        '**Count from the root up to the 5th.** Count from the root again. For a 7th chord, count the 7th from the root as well.',
        '**Match the counts to a chord type.** Use the same counts as in Method 1 to name the type.',
        '**Write the root, then the ending.** Write the root exactly as it is spelt, then the ending for the type: nothing for major, m for minor, dim, aug, 7, maj7, m7, m7b5 or dim7.',
        '**Look at the bass note.** If the lowest note is the root, you have finished. If it is not, add a slash and the name of the lowest note.',
        '**Check another way: count the 3rds by piano keys.** Count one piano key at a time from note to note. Added up from the root, the counts must match the ending you wrote.',
      ),
      h('Worked examples: writing the symbol'),
      worked(chordSymbolExample(chord('B', 'half-diminished7'), 0)),
      worked(chordSymbolExample(chord('A', 'minor'), 1)),

      h('Method 3: read a symbol and write the chord'),
      p('Use this when you are given a symbol such as B♭m or G7/B and asked to write the notes. You spell the chord in root position, then move the notes if there is a slash.'),
      steps(
        '**Split the symbol into its parts.** The root comes first, then the ending, then a slash and the bass note if there is one. G7/B splits into G, 7 and /B.',
        '**Read the ending.** The ending gives the type, and the type gives the semitones above the root. For B♭m, the ending m means a minor triad: the 3rd is 3 and the 5th is 7 semitones up.',
        '**Write the letter names.** Skip one letter name and take the next. From B: skip C and take D; skip E and take F. The letters are B, D, F.',
        '**Count from the root up to the 3rd.** Count the semitones one letter at a time, and allow for the sign on the root. B♭ to D is 1, 2 and then 1 more for the flat: 4.',
        '**Make the 3rd a major or minor 3rd.** The ending m asks for 3 and you counted 4. That is 1 too many, so lower D to D♭. Where the count matches, the note stays natural.',
        '**Count from the root up to the 5th.** Count from the root again: B♭ to F is 7. For a 7th chord, count and fix the 7th in the same way.',
        '**Make the 5th a perfect, diminished or augmented 5th.** Compare with the ending. Here 7 matches, so F stays natural.',
        '**Write the chord in root position.** Put the notes in order from the root, each a 3rd above the one before: B♭ D♭ F.',
        '**Move the bottom note to the top.** Do this only if there is a slash. The slash note must be at the bottom, so move the bottom note up an octave (to the next note with the same letter name) until it is.',
        '**Write it on the staff.** Write the notes lowest first, and check that the bottom note is the slash note.',
        '**Check another way: count the 3rds by piano keys.** Count one piano key at a time from note to note. Added up from the root, the counts must match the ending.',
      ),
      h('Worked examples: reading a symbol'),
      worked(readChordSymbolExample(chord('Bb', 'minor'), 0)),
      worked(readChordSymbolExample(c, 1)),
      worked(readChordSymbolExample(g7, 1)),

      h('Common mistakes'),
      watch('**Naming the chord after the lowest note.** The notes E G C are not "an E chord". The right answer is C major in first inversion: E and G are stacked above C in 3rds (C E G), so C is the root and E is only the lowest note.'),
      watch('**Mixing up the number and the position.** The wrong idea is that first inversion has the 1st note at the bottom. The right idea is that first inversion has the 3rd at the bottom (E G C). The root at the bottom is root position.'),
      watch('**Leaving off the slash.** For the notes E G C, the wrong symbol is C, which tells the player to put the root at the bottom. The right symbol is C/E, with a slash and the bass note.'),
      watch('**Reading the figures as a count.** The wrong idea is that 6 means "sixth inversion". The right idea is that, for a triad, 6 means first inversion and 6/4 means second inversion. The numbers are intervals above the bass note.'),

      h('Try it'),
      p('Practice asks inversions at every level. Chord symbols with slashes appear at Hard.'),
      practise({ label: 'Practise chords and inversions (easy)', topics: ['chords'], level: 1, clefs: ['treble'] }),
      practise({ label: 'Practise chords, inversions and symbols (hard)', topics: ['chords'], level: 3, clefs: ['treble'] }),
      list('Next lesson: Roman numerals and primary chords.'),
    ]
  },
}

/** The seven chords of a key as a table, from the engine. */
function keyChordRows(k: Key, form: 'natural' | 'harmonic' = 'natural'): string[][] {
  return diatonicChords(k, { form }).map((d) => [String(d.degree), d.numeral, symbolOf(d.chord), notesOf(d.chord)])
}

const ROMAN_LESSON: LibraryLesson = {
  id: 'roman-numerals',
  title: 'Roman numerals and primary chords',
  group: 'chords',
  summary: 'A way to name a chord by its job in a key, so the same pattern works in every key.',
  before: ['inversions-chord-symbols', 'key-signatures'],
  covers: ['roman-numeral'],
  build: () => {
    const cChords = diatonicChords(C_MAJOR)
    const cPictures = sharedPictures(cChords.map((d) => d.chord), 'treble')
    const gMajor = parseKey('G major')
    const aMinor = parseKey('A minor')
    const aHarmonic = diatonicChords(aMinor, { form: 'harmonic' })
    const primaryC = primaryChords(C_MAJOR).map((d) => `${d.numeral} = ${symbolOf(d.chord)}`)
    return [
      p('A **Roman numeral** names a chord by where its root sits in the key, not by its letter. Instead of "G major" you say "chord V in C major": the chord built on the 5th note of the scale. The numerals stay the same in every key: I, IV and V are C, F and G in C major, and G, C and D in G major. That is why musicians use them to talk about how a piece is built, whatever key it is in.'),
      p('The three most important chords of a key are I, IV and V. They are called the **primary chords**, and they are the chords that cadences, the endings of phrases, are made from.'),
      words(
        { term: 'Roman numeral', meaning: "A chord's name by the scale degree of its root: I, II, III, IV, V, VI, VII. Capitals mean major, small letters minor." },
        { term: 'Key', meaning: 'The set of notes a piece mainly uses, named after its home note, such as G major.' },
        { term: 'Scale', meaning: 'The notes of a key in order of pitch, using each letter name once.' },
        { term: 'Scale degree', meaning: "A note's number in the scale, counting the tonic as 1." },
        { term: 'Tonic', meaning: 'Scale degree 1: the key note. The chord built on it is the home chord of the key.' },
        { term: 'Supertonic', meaning: 'Scale degree 2, one step above the tonic.' },
        { term: 'Mediant', meaning: 'Scale degree 3, halfway from the tonic to the dominant.' },
        { term: 'Subdominant', meaning: 'Scale degree 4, and the chord built on it (IV, or iv in a minor key).' },
        { term: 'Dominant', meaning: 'Scale degree 5, and the chord built on it (V). After the tonic it is the most important note of the key.' },
        { term: 'Submediant', meaning: 'Scale degree 6, and the chord built on it (vi in a major key, VI in a minor key).' },
        { term: 'Leading note', meaning: 'Scale degree 7 when it is 1 semitone below the tonic. A minor key raises its 7th note by a semitone to make one.' },
        { term: 'Primary chords', meaning: 'Chords I, IV and V (i, iv and V in a minor key): the chords on the tonic, subdominant and dominant.' },
        { term: 'Key signature', meaning: 'The sharps or flats at the start of each line of music. They apply to every note with that letter name.' },
        { term: 'Natural minor scale', meaning: 'The minor scale that uses only the notes of the key signature, such as A B C D E F G in A minor.' },
        { term: 'Triad', meaning: 'A chord of three notes stacked in 3rds: the root, the 3rd and the 5th.' },
        { term: 'Root', meaning: 'The note a chord is built on and named after. When the chord is stacked in 3rds, it is the lowest note.' },
      ),

      h('The chords of a major key'),
      p('Take the notes of a major scale, such as C D E F G A B in C major, and number them 1 to 7. Each number is a scale degree. Build a triad on each of the seven notes by stacking 3rds, using only notes of the key: start on the note, skip one note of the scale, take the next, skip one, take the next. Here is C major:'),
      table(['Note number', 'Numeral', 'Chord', 'Notes'], keyChordRows(C_MAJOR), 'The seven chords of C major.'),
      staffBlock(chordsOnStaff('treble', cPictures.slice(0, 4), C_MAJOR), 'The first four chords of C major: I, ii, iii, IV. (C major has no sharps or flats, so the key signature is empty.)'),
      staffBlock(chordsOnStaff('treble', cPictures.slice(4), C_MAJOR), 'The last three chords of C major: V, vi, vii°.'),
      listenBlock('Hear the seven chords of C major', chordSequenceAudio(cPictures, 1.1, 1)),
      p('The numeral letters give the scale degree: I is 1, II is 2, III is 3, IV is 4, V is 5, VI is 6 and VII is 7. The case of the letters, and the ° sign, give the type of triad:'),
      list('Capital letters: a major triad (I, IV, V).', 'Small letters: a minor triad (ii, iii, vi).', 'Small letters with ° (a little circle): a diminished triad (vii°).'),
      remember('In every major key the pattern is I ii iii IV V vi vii°: major, minor, minor, major, major, minor, diminished.'),
      p('The pattern is the same in every major key, because every major scale is built with the same pattern of steps. Here is G major, to show it:'),
      table(['Note number', 'Numeral', 'Chord', 'Notes'], keyChordRows(gMajor), 'The seven chords of G major.'),
      p('Some of the degrees have names that you will meet in this Library. Degree 1 is the tonic, 2 the supertonic, 3 the mediant, 4 the subdominant, 5 the dominant, 6 the submediant and 7 the leading note, when it is 1 semitone below the tonic.'),

      h('The primary chords'),
      p(`The primary chords are built on the tonic (degree 1), the subdominant (degree 4) and the dominant (degree 5): I, IV and V. In a major key all three are major triads. In C major they are ${primaryC.join(', ')}. Between them they use every note of the scale, which is part of why they work so well together.`),

      h('The chords of a minor key'),
      p('In a minor key the numerals are measured against the natural minor scale, which uses only the notes of the key signature. In A minor that is A B C D E F G. Building triads on those notes gives:'),
      table(['Note number', 'Numeral', 'Chord', 'Notes'], keyChordRows(aMinor), 'The seven chords of A minor, from the natural minor scale.'),
      remember('In a natural minor key the pattern is i ii° III iv v VI VII: minor, diminished, major, minor, minor, major, major.'),
      p(`In this app the chord on note 5 in a minor key is usually the major V (${chordWords(aHarmonic[4]!.chord)}: ${notesOf(aHarmonic[4]!.chord)}), and the chord on note 7 is the diminished vii° (${chordWords(aHarmonic[6]!.chord)}: ${notesOf(aHarmonic[6]!.chord)}). Both use note 7 raised by a semitone (G becomes G♯ in A minor). That raised note is the leading note. It comes from the harmonic minor scale, which is the natural minor scale with its 7th note raised by a semitone. Because V is major, the primary chords in a minor key are i, iv and V.`),
      p(`You may also meet the minor v (${symbolOf(diatonicChords(aMinor)[4]!.chord)}) and the major VII (${symbolOf(diatonicChords(aMinor)[6]!.chord)}), which use the notes of the natural minor scale as they are. The case of the letters tells you which one it is.`),
      p('Adding a 7 to a numeral makes it a 7th chord: V7 is a dominant 7th (in C major, G7). Hard questions use 7th chords such as V7.'),

      h('Method 1: find the numeral of a chord'),
      p('Use this when you are shown a chord and a key and asked for its Roman numeral. You name the chord, find its root in the scale, then choose the numeral.'),
      steps(
        '**Name the notes from the bottom up.** Use the clef to name each note. Keep any sharp or flat written in front of a note, or given by the key signature.',
        '**Check the notes are stacked in 3rds.** Each letter must skip one. If they do, the lowest note is the root.',
        '**Count from the root up to the 3rd.** Count the semitones one letter at a time (2 each, except E to F and B to C, which are 1), and allow for any sharp or flat.',
        '**Count from the root up to the 5th.** Count from the root again.',
        '**Name the chord from its counts.** Major is 4 and 7. Minor is 3 and 7. Diminished is 3 and 6. Augmented is 4 and 8.',
        '**Write out the scale of the key.** Write seven letter names from the key note, then apply the key signature. For G major: G, A, B, C, D, E, F, and the key signature has 1 sharp, F♯, so the scale is G A B C D E F♯. In a minor key, use the natural minor scale.',
        '**Number the notes as scale degrees.** Count from the key note, which is 1: 1 G, 2 A, 3 B, 4 C, 5 D, 6 E, 7 F♯.',
        '**Find the root in the scale.** Look for the chord\'s root and read off its number. In G major, D is degree 5.',
        '**Look at the note that is not in the scale.** Do this only in a minor key. A root such as G♯ in A minor is not in the natural minor scale. It is degree 7 raised by a semitone, which makes it the leading note.',
        '**Write the degree as a Roman numeral.** I is 1, II is 2, III is 3, IV is 4, V is 5, VI is 6 and VII is 7. Degree 5 is V.',
        '**Choose capital or small letters.** Major is capitals. Minor is small letters. Diminished is small letters with °. A capital with 7 after it is a dominant 7th chord. D major is a major chord, so the numeral is V.',
        '**Check another way: build the chord from the numeral.** Start on the degree and stack 3rds using only notes of the scale: take a note, skip one, take the next. For V, that is degrees 5, 7, 2. The notes must be the chord you were given. In a minor key, V and vii° use the raised 7th.',
      ),
      h('Worked examples: finding the numeral'),
      worked(romanNumeralExample(gMajor, chord('D', 'major'))),
      worked(romanNumeralExample(C_MAJOR, chord('A', 'minor'))),
      worked(romanNumeralExample(aMinor, chord('E', 'major'))),
      worked(romanNumeralExample(aMinor, chord('G#', 'diminished'))),

      h('Method 2: find the chord for a numeral'),
      p('Use this when you are given a numeral and a key and asked to write the chord. You read the numeral, find its root in the scale and build the triad on it.'),
      steps(
        '**Read the letters of the numeral.** The letters give the scale degree of the root. ii is 2, so the root is degree 2.',
        '**Read the case of the numeral.** Capitals mean a major triad. Small letters mean a minor triad. Small letters with ° mean a diminished triad. A capital with 7 after it means a dominant 7th chord.',
        '**Write out the scale of the key.** Write seven letter names from the key note, then apply the key signature. For F major: F, G, A, B, C, D, E, and the key signature has 1 flat, B♭, so the scale is F G A B♭ C D E.',
        '**Number the notes as scale degrees.** Count from the key note, which is 1: 1 F, 2 G, 3 A, 4 B♭, 5 C, 6 D, 7 E.',
        '**Find the root of the numeral.** Read the note that has the degree from step 1. Degree 2 of F major is G.',
        '**Build the chord: stack 3rds on the root.** Take the root, skip one scale note, take the next, and do it once more (twice more for a 7th chord). From degree 2 that is degrees 2, 4, 6: G B♭ D. In a minor key, V and vii° use the raised 7th.',
        '**Count from the root up to the 3rd.** Count the semitones one letter at a time, and allow for any sharp or flat. G up to B♭ is 3.',
        '**Count from the root up to the 5th.** Count from the root again. G up to D is 7. For V7, count the 7th as well.',
        '**Check the counts match the numeral.** Minor is 3 and 7, so small letters were right: ii is G minor, G B♭ D. A dominant 7th chord is 4, 7 and 10.',
        '**Check another way: count the 3rds by piano keys.** Count one piano key at a time from note to note. The counts, added up from the root, must give the same total as before.',
      ),
      h('Worked examples: finding the chord'),
      worked(chordFromNumeralExample(parseKey('F major'), 'ii')),
      worked(chordFromNumeralExample(parseKey('D major'), 'vi')),
      worked(chordFromNumeralExample(parseKey('C minor'), 'iv')),
      worked(chordFromNumeralExample(gMajor, 'V7')),

      h('Method 3: find the primary chords of a key'),
      p('Use this when you are asked for the primary chords of a key. You find degrees 1, 4 and 5 and build a triad on each.'),
      steps(
        '**Write out the scale of the key.** Write seven letter names from the key note, then apply the key signature. For B♭ major the key signature has 2 flats, B♭ and E♭, so the scale is B♭ C D E♭ F G A.',
        '**Number the notes as scale degrees.** Count from the key note, which is 1.',
        '**Find the tonic, subdominant and dominant.** These are degrees 1, 4 and 5. In B♭ major they are B♭, E♭ and F.',
        '**Build the chord: stack 3rds on the root.** For each of the three roots, take the root, skip one scale note, take the next, and do it once more.',
        '**Count from the root up to the 3rd and the 5th.** Count each from the root, one letter at a time, allowing for signs. A major triad is 4 and 7.',
        '**Check the counts match the numeral.** In a major key, I, IV and V are all major triads. In a minor key, i and iv are minor and V is major.',
        '**Write the three chords on the staff.** Write the key signature, then the three chords one after another.',
        '**Check another way: look for every scale degree.** List the notes of all three chords. Between them they should use all seven letter names of the scale.',
      ),
      h('Worked examples: the primary chords of a key'),
      worked(primaryChordsExample(parseKey('Bb major'))),
      worked(primaryChordsExample(aMinor)),

      h('Common mistakes'),
      watch('**Mixing up capitals and small letters.** The chord on note 2 of C major is D minor. The wrong numeral is II, which would be a major chord. The right numeral is ii, in small letters, because the chord is minor.'),
      watch('**Counting from the wrong note.** In D major, what is the numeral of A major? The wrong answer is I, counting from A itself. The right answer is V, counting from the key note D: D, E, F♯, G, A is 5 notes.'),
      watch('**Leaving off the circle.** The diminished chord on note 7 of C major is B D F. The wrong numeral is vii, which means a minor chord. The right numeral is vii°, with the little circle.'),
      watch('**Using the natural minor notes for V.** In A minor, the chord on note 5 is E G♯ B, the major V. The wrong answer uses E G B, which is the minor v. The major V needs the raised 7th note, G♯.'),

      h('Try it'),
      p('Practice asks both ways: from a chord on the staff to a numeral, and from a numeral to a chord.'),
      practise({ label: 'Practise Roman numerals (easy)', topics: ['chords'], level: 1, clefs: ['treble'] }),
      practise({ label: 'Practise Roman numerals (medium)', topics: ['chords'], level: 2, clefs: ['treble'] }),
      list('Next lesson: Cadences, which use the primary chords.'),
    ]
  },
}

/** A staff picture and a sound for a cadence in a key, in one octave. */
function cadencePicture(k: Key, type: CadenceType, variant = 0, clef: ClefName = 'treble'): { blocks: Block[] } {
  const c = cadence(k, type, variant)
  const tonic = cadence(k, 'perfect').chords[1]
  const [keyChord, first, second] = sharedPictures([tonic, c.chords[0], c.chords[1]], clef)
  const pair = `${symbolOf(c.chords[0])} then ${symbolOf(c.chords[1])}`
  return {
    blocks: [
      staffBlock(chordsOnStaff(clef, [first!, second!], k), `${capital(type)} cadence in ${keyLabel(k)}: ${c.numerals.join(' then ')} (${pair}).`),
      listenBlock(`Hear the ${type} cadence in ${keyLabel(k)}`, cadenceAudio(keyChord!, first!, second!)),
    ],
  }
}

const CADENCES_LESSON: LibraryLesson = {
  id: 'cadences',
  title: 'Cadences: how phrases end',
  group: 'cadences',
  summary: 'The pairs of chords that end a phrase: perfect, imperfect, plagal and interrupted.',
  before: ['roman-numerals'],
  covers: ['cadence-on-staff', 'cadence-by-name'],
  build: () => {
    const rows = CADENCE_TYPES.map((t) => {
      const c = cadence(C_MAJOR, t)
      return [capital(t), PATTERN.major[t], c.chords.map((x) => symbolOf(x)).join(' then ')]
    })
    const minorRows = CADENCE_TYPES.map((t) => {
      const a = parseKey('A minor')
      const c = cadence(a, t)
      return [capital(t), PATTERN.minor[t], c.chords.map((x) => symbolOf(x)).join(' then ')]
    })
    const sounds: [CadenceType, string][] = [
      ['perfect', 'often described as sounding finished, like a full stop'],
      ['imperfect', 'often described as sounding unfinished, like a comma or a question: it stops on V'],
      ['plagal', 'often described as the "Amen" sound at the end of a hymn'],
      ['interrupted', 'often described as a surprise: it seems to be heading home to I, but goes somewhere else'],
    ]
    const aMinor = parseKey('A minor')
    return [
      p('A **phrase** is a musical sentence, and a **cadence** is the pair of chords that ends it, a bit like the punctuation at the end of a sentence. Different pairs of chords end the music in different ways: some sound finished and some sound as if there is more to come.'),
      p('You name a cadence by the Roman numerals of its two chords, so the same cadence can be found in any key. This app asks about four: perfect, imperfect, plagal and interrupted. Learning to hear and spot them tells you where a phrase stops and how.'),
      words(
        { term: 'Phrase', meaning: 'A musical sentence: a short passage that ends with a cadence.' },
        { term: 'Cadence', meaning: 'The two chords at the end of a phrase, like the punctuation at the end of a sentence.' },
        { term: 'Perfect cadence', meaning: 'Chord V (or V7) then chord I. It sounds finished, like a full stop.' },
        { term: 'Imperfect cadence', meaning: 'A cadence that ends on chord V, usually after I, ii or IV. It sounds unfinished, like a comma.' },
        { term: 'Plagal cadence', meaning: 'Chord IV then chord I. It sounds gentle, like the "Amen" at the end of a hymn.' },
        { term: 'Interrupted cadence', meaning: 'Chord V (or V7) then chord vi (VI in a minor key) instead of the expected I. It sounds like a surprise.' },
        { term: 'Roman numeral', meaning: "A chord's name by the scale degree of its root: I, II, III, IV, V, VI, VII. Capitals mean major, small letters minor." },
        { term: 'Tonic', meaning: 'Scale degree 1: the key note. The chord built on it is the home chord of the key.' },
        { term: 'Subdominant', meaning: 'Scale degree 4, and the chord built on it (IV, or iv in a minor key).' },
        { term: 'Dominant', meaning: 'Scale degree 5, and the chord built on it (V). After the tonic it is the most important note of the key.' },
        { term: 'Submediant', meaning: 'Scale degree 6, and the chord built on it (vi in a major key, VI in a minor key).' },
        { term: 'Leading note', meaning: 'Scale degree 7 when it is 1 semitone below the tonic. A minor key raises its 7th note by a semitone to make one.' },
        { term: 'Accidental', meaning: 'A sharp, flat or natural sign written in front of a note, for a note the key signature does not give.' },
        { term: 'Natural sign (♮)', meaning: 'A sign that cancels a sharp or flat for that note, so it is played as a natural.' },
        { term: 'Key signature', meaning: 'The sharps or flats at the start of each line of music. They apply to every note with that letter name.' },
        { term: 'Bass line', meaning: 'The lowest notes of the music, one after another.' },
      ),

      h('The four cadences'),
      p('Each cadence is two chords, named by their Roman numerals: the number of the chord\'s root in the key, with capital letters for major chords and small letters for minor ones. In C major, I is C, ii is Dm, IV is F, V is G and vi is Am. Chord I, the chord on the tonic, is the home chord of the key. Music often feels as if it has arrived when it lands there.'),
      table(['Cadence', 'Chords', 'In C major'], rows, 'The four cadences in a major key. In a perfect or interrupted cadence, V7 can stand in for V.'),
      remember('Perfect: V (or V7) then I. Imperfect: I, ii or IV then V. Plagal: IV then I. Interrupted: V (or V7) then vi.'),
      p('The order matters. V then I is a perfect cadence, but I then V is an imperfect cadence. IV then I is plagal, but I then IV is not a cadence in this app.'),
      p('How each cadence sounds is a matter of ear, but there are common ways of describing them. They are there to help you listen, not to give you the answer:'),
      list(...sounds.map(([t, s]) => `${capital(t)}: ${s}.`)),
      p('Listen to the four in C major. Each sound starts with the key chord (C), then a pause, and then the two chords of the cadence.'),
      ...CADENCE_TYPES.flatMap((t) => cadencePicture(C_MAJOR, t).blocks),
      p('Both chords of a cadence are written here in root position, with the root as the lowest note. So the bass line, the lowest notes one after another, is the two roots. Perfect: scale degrees 5 then 1, dominant to tonic. Plagal: 4 then 1, subdominant to tonic. Interrupted: 5 then 6, dominant to submediant. Imperfect: 1, 2 or 4, then 5.'),

      h('Cadences in minor keys'),
      p('In a minor key the chords are i, ii°, iv, V and VI (small letters for minor and diminished, capitals for major). The V chord is major, because it uses the raised 7th note, the leading note. In A minor that note is G♯, which is not in the key signature, so it is written as an accidental: a sign in front of the note.'),
      table(['Cadence', 'Chords', 'In A minor'], minorRows, 'The four cadences in a minor key.'),
      ...cadencePicture(aMinor, 'perfect').blocks,
      p('Look for the G♯ in the first chord. The key signature of A minor has no sharps, so the sharp sign is written in front of the G.'),
      tip('The app uses only these four cadences. It does not cover other kinds, such as a perfect cadence in a minor key that ends on a major chord (a "Picardy third"). It also does not list pairs such as vi then V. If a pair of chords is not one of the patterns above, it is not one of the answers.'),

      h('Method 1: identify a cadence on the staff'),
      p('Use this when you are shown two chords in a key and asked which cadence they make. You turn each chord into a numeral, then match the pair to the table.'),
      steps(
        '**Read the key and look at the two chords.** The question tells you the key, and the key signature agrees. The sound plays the tonic chord first, so you hear where home is.',
        '**Write out the scale of the key.** Write seven letter names from the key note, then apply the key signature. In a minor key, use the natural minor scale.',
        '**Number the notes as scale degrees.** Count from the key note, which is 1.',
        '**Read the first chord from the bottom up.** Check the notes skip one letter each time. If they do, the chord is in root position and the lowest note is the root.',
        '**Count from the root up to the 3rd.** Count the semitones one letter at a time (2 each, except E to F and B to C, which are 1), and allow for any sharp or flat.',
        '**Count from the root up to the 5th.** Count from the root again.',
        '**Name the first chord from its counts.** Major is 4 and 7. Minor is 3 and 7. Diminished is 3 and 6.',
        '**Find the root in the scale.** Read off its degree. In C major, G is degree 5, the dominant.',
        '**Look at the note that is not in the scale.** Do this only in a minor key. A note such as G♯ in A minor is degree 7 raised by a semitone, the leading note. It makes the chord V.',
        '**Write the degree as a Roman numeral.** Degree 5 is V, degree 1 is I, degree 4 is IV, degree 6 is VI.',
        '**Choose capital or small letters.** A major chord takes capitals and a minor chord takes small letters. G major is a major chord, so it is V.',
        '**Read the second chord from the bottom up.** Do the same steps for the second chord: count its 3rd and 5th, name it, find its root in the scale, write the numeral and choose the letters.',
        '**Match the pair to a cadence.** Write the two numerals as a pair, in order, and look them up in the table. V then I is a perfect cadence.',
        '**Check another way: follow the bass line.** Both chords are in root position, so the bass notes are the roots. Check that their scale degrees fit the cadence: 5 then 1 is perfect, 4 then 1 is plagal, 5 then 6 is interrupted, and ending on 5 is imperfect.',
      ),
      h('Worked examples: identify the cadence'),
      worked(cadenceExample(C_MAJOR, 'perfect', 'identify')),
      worked(cadenceExample(parseKey('G major'), 'imperfect', 'identify', 1)),
      worked(cadenceExample(parseKey('F major'), 'plagal', 'identify')),
      worked(cadenceExample(parseKey('D major'), 'interrupted', 'identify')),
      worked(cadenceExample(parseKey('E minor'), 'perfect', 'identify')),
      worked(cadenceExample(aMinor, 'imperfect', 'identify', 2)),

      h('Method 2: write a cadence'),
      p('Use this when you are given a cadence and a key and asked to write the two chords. You look up the numerals, build each chord, then write them on the staff.'),
      steps(
        '**Look up the pattern.** Find the cadence in the table and write its numerals. A plagal cadence is IV then I.',
        '**Write out the scale of the key.** Write seven letter names from the key note, then apply the key signature. In a minor key, use the natural minor scale.',
        '**Number the notes as scale degrees.** Count from the key note, which is 1.',
        '**Find the root of the first chord.** Read the degree from the numeral and find that note in the scale. IV is degree 4, so in D major the root is G.',
        '**Build the chord: stack 3rds on the root.** Take the root, skip one scale note, take the next, and do it once more. In a minor key, V uses the raised 7th. From G in D major that is G B D.',
        '**Count from the root up to the 3rd.** Count the semitones one letter at a time, and allow for any sharp or flat.',
        '**Count from the root up to the 5th.** Count from the root again.',
        '**Check the counts match the numeral.** Capitals mean a major triad (4 and 7). Small letters mean a minor triad (3 and 7).',
        '**Find the root of the second chord.** Do the same steps for the second chord: find its root, build it, count it and check the counts.',
        '**Write the key signature.** Start the staff with the sharps or flats of the key.',
        '**Write the two chords and any accidentals.** Write each chord as three notes on neighbouring lines or spaces, the first chord on the left. If a note is not the one the key signature gives, put a sign in front of it. In a minor key the raised 7th in V needs one.',
        '**Listen to your cadence.** The sound starts with the tonic chord so you hear where home is, then it plays your two chords.',
        '**Check another way: follow the bass line.** Both chords are in root position, so the bass notes are the roots. Their scale degrees must fit the cadence, for example 4 then 1 for plagal.',
      ),
      h('Worked examples: write the cadence'),
      worked(cadenceExample(parseKey('D major'), 'plagal', 'write')),
      worked(cadenceExample(parseKey('G major'), 'perfect', 'write', 1)),
      worked(cadenceExample(parseKey('C minor'), 'perfect', 'write')),

      h('Common mistakes'),
      watch('**Confusing perfect and plagal.** Both end on chord I, so the chord before it decides. In C major, F then C is plagal, because F is IV. Calling it perfect is wrong. G then C is perfect, because G is V.'),
      watch('**Getting the order wrong.** C then G is I then V, which is an imperfect cadence. The wrong answer is perfect, because the chords V and I are both there. The right answer reads the order: I then V ends on V, so it is imperfect.'),
      watch('**Calling an interrupted cadence perfect.** In C major, G then Am starts the same way as a perfect cadence, with V. The wrong answer is perfect. The right answer is interrupted, because the second chord is vi (A C E), not I (C E G).'),
      watch('**Forgetting the leading note in a minor key.** In C minor, the key signature has B♭. The wrong V chord is G B♭ D, which is minor. The right V chord is G B♮ D, with a natural sign in front of the B, because V needs the raised 7th.'),

      h('Try it'),
      p('Practice asks two kinds of questions: a cadence written on the staff (name it) and a cadence by name (find the chords).'),
      practise({ label: 'Practise cadences (easy)', topics: ['cadences'], level: 1, clefs: ['treble'] }),
      practise({ label: 'Practise cadences (medium)', topics: ['cadences'], level: 2, clefs: ['treble'] }),
      list('Next: Music vocabulary, then Ear training, where you will hear these cadences.'),
    ]
  },
}

/** What each vocabulary category is for, in everyday words, with word roots where they are certain. */
const CATEGORY_INTRO: Record<string, Block[]> = {
  tempo: [
    p('**Tempo** is the speed of the music. Most tempo words are Italian. The first part of the table goes roughly from slow to fast. The words after that are mostly about changes of speed.'),
    p('A few roots help the words stick. Allegro is Italian for "cheerful". Andante comes from an Italian verb meaning "to go" (the app\'s meaning is "at a walking pace"). Largo means "broad", lento means "slow", presto means "quick", vivace means "lively" and rubato means "robbed".'),
  ],
  dynamics: [
    p('**Dynamics** say how loud or quiet to play. These are Italian words too. Piano means "soft" and forte means "strong", which here means loud. Mezzo means "half". Adding -issimo means "very", which is why pianissimo is very quiet and fortissimo is very loud.'),
    p('The keyboard instrument called the piano is short for pianoforte, which means "soft-loud": it can play both softly and loudly, depending on how you touch the keys.'),
  ],
  articulation: [
    p('**Articulation** is how single notes are started, joined or ended: short and detached, smooth, plucked, or with a mute. The words in this group describe the way notes are played.'),
    p('Some word roots. Staccato means "detached", legato means "tied together" (smooth), tenuto means "held", marcato means "marked", pizzicato comes from an Italian verb meaning "to pluck", tremolo means "trembling" and sordino means "mute".'),
  ],
  ornaments: [
    p('**Ornaments** are decorations added to a note to make it more interesting. They are small and quick, and their signs are written above or beside the main note.'),
    p('Two word roots. Acciaccatura comes from an Italian verb meaning "to crush" (the note is squeezed in and very short). Appoggiatura comes from an Italian verb meaning "to lean" (the note leans on the main note).'),
  ],
  texture: [
    p('**Texture** is how the layers of sound in a piece fit together: how many parts there are, and how they relate to each other. The words come from Greek. Mono is "one", homo is "same", poly is "many" and hetero is "different". Phonic means "sound".'),
    p('So monophonic is one sound (a single line), homophonic is the "same" sound (parts moving together), polyphonic is "many sounds" (independent lines) and heterophonic is "different" versions of one tune.'),
  ],
  form: [
    p('**Form** is the plan of a piece: how its sections are ordered and repeated. Letters are used for the sections: A is the first section, B is a contrasting one, and so on.'),
    p('Some roots. Binary is two-part and ternary is three-part. A strophe is a verse of a song, so strophic is verse by verse. Ostinato is Italian for "obstinate": it stubbornly repeats. Coda is Italian for "tail": a piece added at the end.'),
  ],
  instruments: [
    p('Each instrument belongs to an **instrument family**, a group made by the way the sound is produced. Woodwind instruments make sound by sending breath across an edge or against a thin reed (flute, clarinet). Brass instruments are blown with the lips buzzing into a mouthpiece. String instruments make sound from vibrating strings, which are bowed or plucked. Percussion instruments are struck, shaken or scraped.'),
  ],
  tonality: [
    p('**Tonality** is about the key of the music: its home note, and whether it sounds major, minor or something else. Many of these words are used in the chords and cadences lessons too: you have met major, minor, tonic and dominant already.'),
    p('Some word roots. Penta is Greek for "five" (a pentatonic scale has five notes), a- means "without" (so atonal is "without a key") and chromatic comes from a Greek word for "colour".'),
  ],
}

/** Memory tips and the commonest confusion for each category. */
const CATEGORY_NOTES: Record<string, Block[]> = {
  tempo: [
    tip('A memory aid: words ending in -ando (accelerando, rallentando) are "-ing" words in Italian. They describe a change in speed that goes on gradually. Allegro and presto are a speed, not a change.'),
    watch('**Mixing up "a tempo" with going faster.** The wrong meaning is "play faster". The right meaning is "go back to the original speed". Rallentando and ritardando both mean gradually getting slower in this app.'),
  ],
  dynamics: [
    tip('A memory aid: mezzo means "half", so mp is only a little louder than p, and mf is only a little quieter than f. From quietest to loudest: pp, p, mp, mf, f, ff. Words ending in -endo (crescendo, diminuendo) describe a gradual change.'),
    watch('**Mixing up crescendo and sforzando.** The wrong meaning for sforzando (sfz) is "gradually louder". The right meaning is a sudden, strong accent on one note. Crescendo is the gradual one. Diminuendo and decrescendo both mean gradually getting quieter here.'),
  ],
  articulation: [
    tip('A memory aid: staccato is short and spiky; legato is smooth, like gliding. Pizzicato is plucked; arco is the opposite, played with the bow.'),
    watch('**Mixing up a slur and a tie.** A curved line over notes of different pitches is a slur: play them smoothly, as separate notes. A curved line joining two notes of the same pitch is a tie. Playing a tied pair as two notes is wrong: it makes one longer note.'),
  ],
  ornaments: [
    tip('A memory aid: a trill goes back and forth many times; a mordent is a single quick "nip"; a turn circles round the main note (above, the note, below, the note).'),
    watch('**Mixing up acciaccatura and appoggiatura.** Both are small extra notes before the main note, called grace notes. The wrong idea is that the acciaccatura leans on the main note. That is the appoggiatura, which takes some of its length. The acciaccatura is very short, with a slash through its stem.'),
  ],
  texture: [
    tip('A memory aid: mono is one line; homo means the parts move together (a tune with chords under it); poly is many lines, each one doing its own thing.'),
    watch('**Mixing up homophonic and polyphonic.** The wrong idea is that any music with several parts is polyphonic. In homophonic music one part is the tune and the others support it, moving together. In polyphonic music every part is a melody of its own. In a canon every part plays the same tune, starting at different times.'),
  ],
  form: [
    tip('A memory aid: binary is two sections (A B), ternary is three (A B A), and a rondo keeps coming round to A again and again (A B A C A).'),
    watch('**Mixing up ostinato, ground bass and riff.** All three are patterns repeated over and over. The wrong idea is that an ostinato must be in the bass. An ostinato can be in any part. A ground bass is the one in the bass. A riff is a short repeated pattern used in rock and jazz.'),
  ],
  instruments: [
    tip('Instruments that play tunes can still be percussion. The xylophone, the glockenspiel and the timpani are all in the percussion family, because they are played by hitting them.'),
    watch('**Sorting by material.** The saxophone is made of metal, so the wrong answer is brass. The right answer is woodwind, because families are decided by how the sound is made. The saxophone makes its sound with a reed, like the clarinet.'),
  ],
  tonality: [
    tip('A memory aid: tonic is "home", dominant is the 5th note (the chord V), diatonic is "in the key" and chromatic is "with notes from outside the key".'),
    watch('**Using "dominant" in only one way.** The wrong idea is that a dominant 7th chord can only be built on note 5. The right idea is that the dominant is note 5 of the scale, but a dominant 7th is a type of chord (a major triad with a minor 7th) that you can build on any note.'),
  ],
}

function vocabularyTable(category: VocabCategory): Block {
  const head = category.category === 'instruments' ? ['Instrument', 'Family'] : ['Term', 'Meaning']
  const rows = category.entries.map((e) => [`${e.term}${e.level === 3 ? ' *(extra)*' : ''}`, e.meaning])
  return table(head, rows, `${category.label}. Terms marked "extra" only come up at Hard level.`)
}

const VOCABULARY_LESSON: LibraryLesson = {
  id: 'vocabulary',
  title: 'Music vocabulary',
  group: 'vocabulary',
  summary: 'The words used in the vocabulary questions, grouped by topic, with tips for remembering them.',
  covers: ['vocab-term', 'vocab-meaning'],
  build: () => [
    p('Music has its own vocabulary: words for speed, loudness, how to play a note, how a piece is planned and more. Many of these terms are Italian, and musicians all over the world still use these Italian terms in their scores. The vocabulary questions ask about the words in the tables below.'),
    words(
      { term: 'Term', meaning: 'A word or short sign used in music, such as allegro or mf, that has a meaning you need to know.' },
      { term: 'Italian terms', meaning: 'Musical words taken from Italian, such as allegro and forte, which musicians use in every country.' },
      { term: 'Tempo', meaning: 'The speed of the music.' },
      { term: 'Dynamics', meaning: 'How loud or quiet the music is.' },
      { term: 'Articulation', meaning: 'How single notes are started, joined or ended: short, smooth, plucked or muted.' },
      { term: 'Ornament', meaning: 'A small, quick decoration added to a main note, such as a trill.' },
      { term: 'Texture', meaning: 'How the layers of sound in a piece fit together: how many parts there are and how they relate.' },
      { term: 'Form', meaning: 'The plan of a piece: how its sections are ordered and repeated.' },
      { term: 'Tonality', meaning: 'The key of the music: its home note, and whether it sounds major, minor or something else.' },
      { term: 'Instrument family', meaning: 'A group of instruments that make their sound in the same way: woodwind, brass, strings or percussion.' },
    ),
    p('**This is the app\'s own list.** It was drafted for this app and is still being checked, so do not treat it as an official list. If your teacher or your course gives you a list, learn that one too.'),
    h('How the questions work'),
    p('There are two kinds of question. One gives you a term and asks what it means. The other gives you a meaning and asks which term it is. Learn every word in both directions: from the term to the meaning, and from the meaning back to the term.'),
    p('Easy questions use the core words. Medium adds more, and Hard adds everything, including the words marked *(extra)* in the tables below.'),
    ...VOCABULARY.flatMap((category): Block[] => [
      h(category.label),
      ...(CATEGORY_INTRO[category.category] ?? [p(`These are the words in the group "${category.label}".`)]),
      vocabularyTable(category),
      ...(CATEGORY_NOTES[category.category] ?? []),
    ]),
    h('How to revise vocabulary'),
    steps(
      '**Pick one group.** Choose one group of words from this lesson, for example tempo.',
      '**Test yourself.** Read the table once. Then cover the meaning column and try to say each meaning aloud. Look only at the ones you got wrong.',
      '**Practise the group.** Go to Practice. Choose Vocabulary and start on Easy. Choose a single group first, if the settings let you.',
      '**Read every explanation.** After each answer, read the explanation. It also lists similar words from the same group, which is a quick way to learn them in pairs.',
      '**Come back the next day.** Write down the words you get wrong and try them again the next day. Short, regular sessions work better than one long one.',
      '**Move up a level.** When Easy feels comfortable, move to Medium and then Hard. Hard includes the *(extra)* words.',
    ),
    practise({ label: 'Practise vocabulary (easy)', topics: ['vocabulary'], level: 1 }),
    practise({ label: 'Practise vocabulary (hard)', topics: ['vocabulary'], level: 3 }),
    list('Next lesson: Ear training.'),
  ],
}

/** A listen button for an interval, played from C4. */
function intervalListen(short: string, mode: 'up' | 'down' | 'together', label: string): Block {
  const lower = parsePitch('C4')
  return listenBlock(label, intervalAudio(lower, transpose(lower, parseInterval(short)), mode))
}

const EAR_LESSON: LibraryLesson = {
  id: 'ear-training',
  title: 'Ear training: how to listen',
  group: 'ear',
  summary: 'How the listening questions work, and a way of listening for chords, intervals, cadences and inversions.',
  before: ['cadences', 'inversions-chord-symbols'],
  covers: ['ear-chord-quality', 'ear-interval', 'ear-cadence', 'ear-inversion'],
  build: () => {
    const qualities: ChordQuality[] = [...TRIAD_QUALITIES, 'dominant7', 'major7', 'minor7']
    const pictures = sharedPictures(qualities.map((q) => chord('C', q)), 'treble')
    const described: Record<string, string> = {
      major: 'bright and settled',
      minor: 'darker or sadder',
      diminished: 'tense and unstable',
      augmented: 'strange, floating and unresolved',
      dominant7: 'strong and unfinished: it wants to move on',
      major7: 'smooth and dreamy',
      minor7: 'mellow and soft',
    }
    const chordRows = qualities.map((q) => [capital(SEVENTH_NAME[q as keyof typeof SEVENTH_NAME] ?? q), described[q]!, notesOf(chord('C', q))])
    const cMajor = chord('C', 'major')
    const triadPositions = positionsOf(cMajor)
    const g7 = chord('G', 'dominant7')
    const seventhPositions = positionsOf(g7)
    const intervalRows: [string, string][] = [
      ['m3', 'the first jump of "Greensleeves"'],
      ['M3', 'the first jump of "When the Saints Go Marching In"'],
      ['P4', 'the first jump of "Here Comes the Bride"'],
      ['P5', 'the first jump of "Twinkle, Twinkle, Little Star" (the first two notes are the same, so the jump comes after them)'],
      ['P8', 'the first jump of "Somewhere Over the Rainbow"'],
    ]
    const tuneRows = intervalRows.map(([s, tune]) => [capital(intervalName(parseInterval(s))), String(intervalSemitones(parseInterval(s))), tune])
    const cadenceListens = CADENCE_TYPES.map((t) => cadencePicture(C_MAJOR, t).blocks[1]!)
    return [
      p('**Ear training** means learning to recognise what you hear: the type of a chord, the size of an interval, how a cadence ends, or which note is at the bottom of a chord. It is a skill, and like any skill it improves with a little regular practice. You do not need to read music to start, but you will connect what you hear to the notes written on the staff.'),
      words(
        { term: 'Chord', meaning: 'Three or more notes sounded together.' },
        { term: 'Triad', meaning: 'A chord of three notes stacked in 3rds: the root, the 3rd and the 5th.' },
        { term: 'Root', meaning: 'The note a chord is built on and named after. When the chord is stacked in 3rds, it is the lowest note.' },
        { term: 'Chord quality', meaning: 'The type of a chord: major, minor, diminished or augmented for triads, with a few 7th chord types at Hard level.' },
        { term: 'Broken chord', meaning: 'A chord whose notes are played one at a time, usually from the bottom up, instead of together.' },
        { term: 'Interval', meaning: 'The distance between two notes. Its number counts letter names (a 3rd, a 5th); its exact size is counted in semitones.' },
        { term: 'Semitone', meaning: 'The smallest step in Western music: from one piano key to the very next key, black or white.' },
        { term: 'Octave', meaning: 'From a note to the next note up with the same letter name: 8 letter names, or 12 semitones.' },
        { term: 'Tritone', meaning: 'An interval of 6 semitones, which is an augmented 4th or a diminished 5th.' },
        { term: 'Phrase', meaning: 'A musical sentence: a short passage that ends with a cadence.' },
        { term: 'Cadence', meaning: 'The two chords at the end of a phrase, like the punctuation at the end of a sentence.' },
        { term: 'Tonic', meaning: 'Scale degree 1: the key note. The chord built on it is the home chord of the key.' },
        { term: 'Roman numeral', meaning: "A chord's name by the scale degree of its root: I, II, III, IV, V, VI, VII. Capitals mean major, small letters minor." },
        { term: 'Inversion', meaning: 'A chord with a note other than the root as its lowest note. The notes and the chord name stay the same.' },
        { term: 'Bass note', meaning: 'The lowest note of a chord as it is written or played.' },
        { term: 'Root position', meaning: 'A chord with its root as the lowest note.' },
      ),

      h('How the listening questions work'),
      steps(
        'You press Play and the app plays a short sound, made from real notes.',
        'You can replay it as many times as you like.',
        'You choose an answer.',
        'The app then shows what you heard written on a staff, with a short explanation. Read this every time, even when you were right: it connects the sound to the notes.',
      ),
      p('You need sound for these questions. If you hear nothing, check your device volume, and check that your phone is not set to silent.'),

      h('Advice for listening'),
      list(
        'Listen to the whole sound first. Decide on the overall character before you try to pick out single notes.',
        'Sing or hum. If you can hum the lowest note, or the top note, you are really hearing it. Humming is the quickest way to get the size of an interval.',
        'Compare. Judging two sounds next to each other is much easier than judging one alone. The buttons below let you play two sounds one after the other.',
        'Replay and listen again. Listen for a different thing each time: first the mood, then the bottom note, then the top.',
        'Do not judge by high or low. The same type of chord can be played higher or lower. What you are listening for is the character, not the pitch.',
        'Little and often. A few minutes every day works better than a long session once a week.',
      ),

      h('Chord quality'),
      p('Chord quality is the type of chord: major, minor, diminished or augmented (and, at Hard level, three of the 7th chords). A good first step is to decide between major and minor, then to notice the odd ones out.'),
      p('People often describe the types in the words below. These are common descriptions, not rules, and you will hear them slightly differently. Use them as a first guide, and trust the differences you hear between chords.'),
      table(['Chord', 'Often described as', 'On C'], chordRows, 'Common descriptions of each chord. They are aids, not rules.'),
      p('Listen to each one on C, one at a time, and notice how the character changes:'),
      ...qualities.map((q, i) => listenBlock(`Hear C ${SEVENTH_NAME[q as keyof typeof SEVENTH_NAME] ?? q}`, chordAudio(pictures[i]!, 'block'))),
      p('Sometimes the notes are played one at a time from the bottom (a broken chord), and then all together. Listen for the whole chord at the end.'),
      listenBlock('Hear C major as a broken chord, then together', chordAudio(pictures[0]!, 'broken')),
      p('To hear the difference between major and minor on the same root, here are C major and C minor side by side. Only the middle note has changed, by one semitone.'),
      staffBlock(chordsOnStaff('treble', [pictures[0]!, pictures[1]!]), 'C major (C E G) and C minor (C E♭ G): only the middle note differs.'),
      listenBlock('Hear C major', chordAudio(pictures[0]!, 'block')),
      listenBlock('Hear C minor', chordAudio(pictures[1]!, 'block')),
      h('Method: listening for chord quality'),
      p('The first four steps are listening. The last five show you the notes you heard, count them and prove the answer.'),
      steps(
        '**Play the chord.** Listen to the whole sound, not to single notes. Play it two or three times and make a first guess before you read on.',
        '**Decide: settled or tense.** Major and minor chords are often described as settled. Diminished and augmented chords are often described as tense or unsettled.',
        '**Play a chord on the same root to compare.** Choose the chord you think it might be and hear it next to its neighbour: major with minor, or minor with diminished. Only one note is different.',
        '**Decide which description fits the mystery chord.** Major is often brighter and minor darker or sadder. Diminished is tense and unstable. If 7th chords are in the answers, a dominant 7th often sounds as if it wants to move on, a major 7th smooth and dreamy, a minor 7th mellow.',
        '**See the notes you heard.** Choose your answer, then read the staff the app shows. Compare the two chords: only one note differs, by one semitone.',
        '**Count from the root up to the 3rd.** Count the semitones one letter at a time. 4 is a major 3rd and 3 is a minor 3rd.',
        '**Count from the root up to the 5th.** 7 is a perfect 5th, 6 is a diminished 5th and 8 is an augmented 5th.',
        '**Match the counts to a triad type.** Major is 4 and 7. Minor is 3 and 7. Diminished is 3 and 6. Augmented is 4 and 8.',
        '**Check another way: count the 3rds by piano keys.** Count one piano key at a time from the root to the 3rd, then from the 3rd to the 5th. Major is 4 then 3, minor is 3 then 4.',
      ),
      worked(earChordExample(note('C'), 'major')),
      worked(earChordExample(note('B'), 'diminished')),

      h('Intervals'),
      p('An interval is the distance between two notes. In the app you hear two notes, either one after the other (going up or going down) or both together, and you choose the interval. Every interval has a size in semitones, and a bigger interval sounds like a bigger jump.'),
      p('Start with the five that Easy questions use: minor 3rd, major 3rd, perfect 4th, perfect 5th and the octave. Here are the first notes of some well-known tunes, as memory aids. Each starts with the interval going up.'),
      table(['Interval', 'Semitones', 'A memory aid'], tuneRows, 'Memory aids: hum the first two notes of the tune and see which interval matches.'),
      p('Press each button to hear the interval, going up from C.'),
      intervalListen('m3', 'up', 'Minor 3rd (going up)'),
      intervalListen('M3', 'up', 'Major 3rd (going up)'),
      intervalListen('P4', 'up', 'Perfect 4th (going up)'),
      intervalListen('P5', 'up', 'Perfect 5th (going up)'),
      intervalListen('P8', 'up', 'Octave (going up)'),
      p('The same interval can be played in three ways. Here is the perfect 5th going down, and with the two notes together.'),
      intervalListen('P5', 'down', 'Perfect 5th (going down)'),
      intervalListen('P5', 'together', 'Perfect 5th (both notes together)'),
      p('When the two notes sound together, 2nds and 7ths often sound rough and clashing, while 3rds, 5ths and octaves often sound smoother. At Hard level you will also hear the tritone: 6 semitones, which is an augmented 4th or a diminished 5th (the app calls it a tritone).'),
      h('Method: listening for an interval'),
      p('The first four steps are listening. The last five count letter names and semitones to prove the answer.'),
      steps(
        '**Play interval 1.** Listen to the two notes, one after the other. Play them again, and hum both notes.',
        '**Play interval 2.** In the worked examples you can play a second interval from the same note, so you can compare. In a question, hum the other answer you are choosing between.',
        '**Decide which jump is wider.** Hum each pair of notes. For the wider jump your voice has to travel further. Small is a 2nd or 3rd, medium is a 4th or 5th, and large is a 6th, a 7th or an octave.',
        '**Try a memory aid.** Compare with the start of a well-known tune from the table: does it match?',
        '**Count the letter names of interval 1.** Count the letter names from the lower note, counting it as 1. C up to G is C, D, E, F, G: 5 letter names, so a 5th.',
        '**Count the semitones of interval 1.** Count one letter at a time: C to D is 2, D to E is 2, E to F is 1, F to G is 2. The total is 7, so a perfect 5th.',
        '**Count the letter names of interval 2.** Do the same for the other interval. C up to F is 4 letter names, so a 4th.',
        '**Count the semitones of interval 2.** C to D is 2, D to E is 2, E to F is 1. The total is 5, so a perfect 4th.',
        '**Check another way: count between the two top notes.** The two intervals share the bottom note, so count one piano key at a time from one top note to the other: F to G is 2 steps. The sizes must differ by that amount: 5 + 2 = 7.',
      ),
      worked(earIntervalExample(parsePitch('C4'), 'P5', 'P4')),
      worked(earIntervalExample(parsePitch('C4'), 'M3', 'm3')),

      h('Cadences'),
      p('In a cadence question you hear the key chord first (the tonic, the home chord), then a short pause, and then the two chords of the cadence. You decide which of the four cadences it was. Here are the four, in C major:'),
      ...CADENCE_TYPES.map((t, i) => {
        const block = cadenceListens[i]!
        return block.type === 'listen' ? listenBlock(`Hear the ${t} cadence in C major`, block.item.audio) : block
      }),
      p('Ask yourself two questions about the last chord:'),
      list(
        'Does it sound like home, the chord you heard first? If yes, it is a perfect cadence (the arrival feels strong, like a full stop) or a plagal cadence (the arrival feels gentle, like the "Amen" at the end of a hymn).',
        'If it does not sound like home: does it simply stop, as if there is more to come? That is an imperfect cadence, which ends on V. Or does it seem to be going home and then surprise you? That is an interrupted cadence, which goes from V to vi.',
      ),
      p('These descriptions are often used, but they are aids and not rules. They help you decide between the four choices.'),
      h('Method: listening for a cadence'),
      p('The first four steps are listening. The rest write the two chords as Roman numerals to prove the answer, exactly as in the Cadences lesson.'),
      steps(
        '**Play the sound.** First you hear the tonic chord, then a pause, then the two chords of the cadence. Play it two or three times. Do not try to name the chords yet.',
        '**Ask: does the last chord sound like home?** Compare the very last chord with the first chord you heard. Does the music feel as if it has arrived, or as if it is still waiting to go on?',
        '**Ask: is the arrival strong or gentle?** Do this if it sounds like home. A perfect cadence is often a strong arrival, a plagal cadence a gentle one. If it does not sound like home, ask instead: does it just stop, or surprise you? A stop is imperfect and a surprise is interrupted.',
        '**Match the sound to a cadence.** Choose the cadence that fits what you heard. These descriptions are aids, not rules: the notes prove it.',
        '**See the chords you heard.** Choose your answer, then read the two chords on the staff the app shows, with the key signature.',
        '**Write out the scale of the key.** Write seven letter names from the key note, then apply the key signature. Number the notes as scale degrees.',
        '**Read the first chord from the bottom up.** Check that the notes skip one letter each time, so the lowest note is the root. Count its 3rd and 5th in semitones and name the chord: major is 4 and 7, minor is 3 and 7.',
        '**Find the root in the scale.** Read off its scale degree. Write it as a Roman numeral, with capitals for major and small letters for minor. G major in C major is V.',
        '**Read the second chord from the bottom up.** Do the same for the second chord: count, name it, find its root in the scale and write its numeral.',
        '**Match the numerals to a cadence.** V then I is perfect. IV then I is plagal. I, ii or IV then V is imperfect. V then vi is interrupted.',
        '**Check another way: follow the bass line.** Both chords are in root position, so the bass notes are the roots. 5 then 1 is perfect, 4 then 1 is plagal, 5 then 6 is interrupted, and ending on 5 is imperfect.',
      ),
      worked(earCadenceExample(C_MAJOR, 'perfect')),
      worked(earCadenceExample(parseKey('G major'), 'interrupted')),

      h('Inversions'),
      p('An inversion question plays a chord and asks which note is at the bottom. The key is to listen to the lowest note, the bass note. In root position the lowest note is the root of the chord. In first inversion it is the 3rd, and in second inversion it is the 5th. 7th chords have one more: third inversion, with the 7th at the bottom.'),
      p('Here is C major in its three positions.'),
      listenBlock('Hear root position (C E G)', chordAudio(triadPositions[0]!, 'block')),
      listenBlock('Hear first inversion (E G C)', chordAudio(triadPositions[1]!, 'block')),
      listenBlock('Hear second inversion (G C E)', chordAudio(triadPositions[2]!, 'block')),
      p('And G7, which has four.'),
      ...seventhPositions.map((pitches, i) => listenBlock(`Hear G7 in ${['root position', 'first inversion', 'second inversion', 'third inversion'][i]}`, chordAudio(pitches, 'block'))),
      p('A helpful aid for major and minor triads is to listen for where the wider gap is. In root position the notes are evenly spaced in 3rds. In first inversion the wider gap, a perfect 4th, is at the top. In second inversion it is at the bottom. (This works for major and minor triads, but not for diminished or augmented triads.)'),
      h('Method: listening for an inversion'),
      p('The first four steps are listening. The rest show you the notes and prove the answer.'),
      steps(
        '**Play the chord.** Listen to the whole chord a few times. Then listen again, paying attention only to the lowest note.',
        '**Listen to the bass note on its own.** The bass note decides the inversion. Hum it. Ask: does it sound like the root, the note the chord seems to rest on?',
        '**Compare with the chord in root position.** Hear the same chord with the root at the bottom. Compare its lowest note with the lowest note of the chord you heard.',
        '**Listen for where the wider gap is.** At the top suggests first inversion. At the bottom suggests second inversion. For a 7th chord, remember there is one more position, third inversion, with the 7th at the bottom.',
        '**See the notes you heard.** Choose your answer, then read the chord from the bottom up on the staff the app shows. C major in first inversion is E G C.',
        '**Count the lower gap.** Count the semitones from the lowest note to the middle note, one letter at a time. E to G is 3.',
        '**Count the upper gap.** Count the semitones from the middle note to the top note. G to C is 5, a perfect 4th, so the wider gap is at the top.',
        '**Find which chord note is in the bass.** Root in the bass is root position, 3rd is first inversion and 5th is second inversion. In C major (C E G), E is the 3rd.',
        '**Check another way: turn the chord over.** Start from root position and move the bottom note to the top once for each inversion. C E G moved once is E G C, the order you heard.',
      ),
      worked(earInversionExample(cMajor, 1)),
      worked(earInversionExample(chord('A', 'minor'), 2)),

      h('Common mistakes'),
      watch('**Trusting the mood words too much.** B diminished can sound dark, so the wrong answer is minor. The right answer comes from comparing it with B minor on the same root: the diminished chord is the more tense one. Trust the difference between two chords more than any one word.'),
      watch('**Judging by high or low.** A C minor chord played high can sound light, so the wrong answer is major. The right answer comes from the character: the darker, sadder sound is still minor, however high it is played. The same chord can be played higher or lower.'),
      watch('**Mixing up perfect and plagal.** Both end on home. Hearing F then C, the wrong answer is perfect. The right answer is plagal, because the arrival is gentle (IV into I). G then C (V into I) is the strong pull of a perfect cadence.'),
      watch('**Listening to the top note in an inversion question.** In E G C the top note is C, the root, so the wrong answer is root position. The right answer listens to the lowest note: E is the 3rd, so it is first inversion.'),

      h('Try it'),
      p('Practice has listening questions for all four skills. Start with Easy, and replay each sound until you are sure.'),
      practise({ label: 'Practise ear training (easy)', topics: ['ear'], level: 1, clefs: ['treble'] }),
      practise({ label: 'Practise ear training (medium)', topics: ['ear'], level: 2, clefs: ['treble'] }),
    ]
  },
}

export const CHORDS_EAR_LESSONS: LibraryLesson[] = [TRIADS_LESSON, SEVENTH_LESSON, INVERSIONS_LESSON, ROMAN_LESSON, CADENCES_LESSON, VOCABULARY_LESSON, EAR_LESSON]
