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
import { chordsOnStaff, h, list, listenBlock, p, practise, remember, staffBlock, steps, table, tip, watch, worked } from '../builders/common'
import type { Block, LibraryLesson } from '../types'

/*
 * Chords, cadences, vocabulary and ear training.
 * Every spelling, count and sound in these lessons comes from the theory engine (directly, or through the builders).
 * Only the plain explanations are written by hand.
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
      p('A **chord** is three or more notes played at the same time. A **triad** is the simplest kind of chord: three notes stacked in **thirds**. Every chord in this lesson is a triad, and the chords in the next lesson are triads with one more note on top.'),
      p('By the end you will be able to build any of the four main triads from a starting note, and to name a triad you see on a staff. Here is the best known one, C major. Press the button to hear it.'),
      staffBlock(chordsOnStaff('treble', [pictures[0]!]), 'A C major triad: three notes on neighbouring lines.'),
      listenBlock('Hear a C major triad', chordAudio(pictures[0]!, 'block')),

      h('What you need to know first'),
      p('**Semitones.** A **semitone** is the smallest step on a piano: from one key to the very next key, black or white. A **tone** is two semitones.'),
      p('Most neighbouring white keys are a tone apart. The two exceptions are **E to F** and **B to C**: there is no black key between them, so they are only **one semitone** apart.'),
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
      p('A **sharp** (♯) raises a note by one semitone. A **flat** (♭) lowers it by one semitone.'),
      p('**Intervals.** An **interval** is the distance between two notes. Its **number** counts letter names, including the first and the last: C up to E is a **3rd** (C, D, E is 3 letters) and C up to G is a **5th** (C, D, E, F, G is 5 letters). Its **quality** (major, minor, perfect and so on) comes from the number of semitones. These are the five sizes this lesson uses:'),
      table(['Interval', 'Semitones'], intervalRows, 'If you have not read the Intervals lesson yet, this table is all you need for now.'),

      h('The facts'),
      p('**Stacking in thirds.** To stack notes in thirds you **skip one letter each time**. Start on C: skip D and take E; skip F and take G. The letters are **C, E, G**. On the staff a triad in this basic form is either three notes on neighbouring lines, or three notes in neighbouring spaces.'),
      p('The lowest note is the **root**: the note the chord is named after. The middle note is the **3rd** (a 3rd above the root). The top note is the **5th** (a 5th above the root). In C, E, G the root is C, the 3rd is E and the 5th is G.'),
      p('The **type** of a triad depends on the sizes of its two thirds: the lower third goes from the root to the 3rd, and the upper third goes from the 3rd to the 5th.'),
      table(['Type', 'Two thirds (in semitones)', 'Root to 5th', 'On C'], typeRows, 'The four triads. Read each row left to right.'),
      remember('**Major**: 4 then 3 semitones. **Minor**: 3 then 4. **Diminished**: 3 then 3. **Augmented**: 4 then 4.'),
      p('Here are all four on C. Listen to each one and look at how the notes change.'),
      staffBlock(chordsOnStaff('treble', pictures), 'C major, C minor, C diminished and C augmented, left to right.'),
      listenBlock('Hear C major', chordAudio(pictures[0]!, 'block')),
      listenBlock('Hear C minor', chordAudio(pictures[1]!, 'block')),
      listenBlock('Hear C diminished', chordAudio(pictures[2]!, 'block')),
      listenBlock('Hear C augmented', chordAudio(pictures[3]!, 'block')),
      tip(
        `A way to remember how the four are related. A minor triad is a major triad with its 3rd lowered by a semitone (${notesLabel(cMajorNotes)} becomes ${notesLabel(cMinorNotes)}). A diminished triad is a minor triad with its 5th lowered by a semitone (${notesLabel(cMinorNotes)} becomes ${notesLabel(cDimNotes)}). An augmented triad is a major triad with its 5th raised by a semitone (${notesLabel(cMajorNotes)} becomes ${notesLabel(cAugNotes)}).`,
      ),

      h('Method 1: build a triad'),
      p('Use this when you are given a root and a type, such as "build E♭ major".'),
      steps(
        'Write the **root**: the note the chord is named after.',
        'Write the **letters**. From the root letter, skip one letter and write the next; then do the same again. Example from E: skip F, write G; skip A, write B. The letters are E, G, B.',
        'Look up the **recipe** in the table: how many semitones the 3rd and the 5th must be above the root (major 4 and 7, minor 3 and 7, diminished 3 and 6, augmented 4 and 8).',
        'Count the semitones from the root up to the **plain** 3rd letter (no sign yet). Use the white-key table. A sharp on the lower note takes one away; a flat on the lower note adds one.',
        'Compare with the recipe. If your count is **too small**, raise the letter with sharps. If it is **too big**, lower it with flats. One sign for each semitone. If it is exactly right, add nothing.',
        'Do the same for the 5th letter.',
        'Check: count the two thirds in the notes you have written, root to 3rd and then 3rd to 5th. They must match the type (for example 4 then 3 for major).',
      ),
      h('Worked examples: building triads'),
      p('Follow each one all the way through. Then cover the steps and try the next one on your own.'),
      worked(buildTriadExample(note('E', -1), 'major')),
      worked(buildTriadExample(note('F', 1), 'minor')),
      worked(buildTriadExample(note('B'), 'diminished')),
      worked(buildTriadExample(note('C'), 'augmented')),

      h('Method 2: name a triad on the staff'),
      p('Use this when you are shown a triad and asked what type it is.'),
      steps(
        'Name the three notes from the bottom up. Use the clef, any key signature, and any sharp or flat written in front of a note.',
        'Check that the letters skip one letter each time (like C, E, G). If they do, the lowest note is the **root**. If they do not, the chord is turned upside down: see the lesson on inversions.',
        'Count the semitones from the lowest note to the middle note.',
        'Count the semitones from the middle note to the top note.',
        'Match your two numbers: 4 then 3 is major; 3 then 4 is minor; 3 then 3 is diminished; 4 then 4 is augmented.',
        'Name the chord with its root and type, for example "E♭ major". As a check, the root to the top note should be 7 semitones for major and minor, 6 for diminished, and 8 for augmented.',
      ),
      h('Worked examples: naming triads'),
      worked(identifyTriadExample(chordPicture(chord('D', 'minor'), 'treble'))),
      worked(identifyTriadExample(chordPicture(chord('G#', 'diminished'), 'treble'))),
      worked(identifyTriadExample(chordPicture(chord('A', 'augmented'), 'treble'))),
      p('In the last example the top note is **E♯**, not F. It sounds the same as F, but the letters must skip one letter each time (A, C, E), so the spelling E♯ is the right one for this chord.'),

      h('Common mistakes'),
      watch('**Using the wrong letter.** The letters of a triad skip one letter each time, so the 3rd above D is some kind of F, never G. F♯ and G♭ sound the same, but D F♯ A is a D major triad and D G♭ A is not a triad built in thirds.'),
      watch('**Forgetting the sign on the root.** E to G is 3 semitones, but E♭ to G is 4, because the flat on the lower note makes the gap one bigger. Count from the root exactly as it is written.'),
      watch('**Mixing up minor and diminished.** They share the same 3rd. Only the 5th is different: a perfect 5th (7 semitones) in a minor triad, a diminished 5th (6 semitones) in a diminished triad.'),
      watch('**Forgetting the key signature when you read a staff.** If the staff starts with sharps or flats, they apply to every note with that letter, in every octave, unless a sign in front of a note changes it.'),
      watch('**Naming the chord after the wrong note.** The root is the note the others are stacked on in thirds. If the notes do not stack in thirds from the bottom, the chord is inverted; the next lessons show you how to deal with that.'),

      h('Try it'),
      p('Start with Easy, which uses major and minor triads. Move on when you are getting most of them right.'),
      practise({ label: 'Practise triads and chord building (easy)', topics: ['chords'], level: 1, clefs: ['treble'] }),
      practise({ label: 'Practise triads and chord building (medium)', topics: ['chords'], level: 2, clefs: ['treble'] }),
      list('Next lesson: **Seventh chords** (a triad with one more note).'),
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
      p('A **7th chord** is a triad with one more note on top: the note a **7th** above the root. It has **four** notes, still stacked in thirds. The notes are the root, the 3rd, the 5th and the 7th: for example G, B, D, F.'),
      p('Here is a very common one, the dominant 7th chord on G, which is called G7 (G, B, D, F). Press the button to hear it.'),
      staffBlock(chordsOnStaff('treble', [g7Pitches]), 'G7: four notes stacked in thirds. Each note is on the next line, or the next space.'),
      listenBlock('Hear G7', listenChord('G7', g7Pitches).audio),

      h('What you need to know first'),
      p('**Triads.** A triad is three notes stacked in thirds (root, 3rd, 5th). There are four types, set by the sizes of the two thirds: **major** 4 then 3 semitones, **minor** 3 then 4, **diminished** 3 then 3, **augmented** 4 then 4. (A **semitone** is the smallest step on a piano: from one key to the very next.)'),
      p('**A 7th.** A 7th counts letter names including the first and last: C up to B is a 7th (C, D, E, F, G, A, B is 7 letters). The size is set by the semitones from the root:'),
      table(
        ['Interval from the root', 'Semitones'],
        ['m7', 'M7', 'd7'].map((s) => [intervalName(parseInterval(s)), String(intervalSemitones(parseInterval(s)))]),
        'A major 7th is one semitone below the octave. A minor 7th is two semitones below the octave.',
      ),

      h('The facts'),
      p('A 7th chord is named by two things: the type of **triad** at the bottom (its first three notes) and the type of **7th** on top. This app uses five types:'),
      table(['Type', 'Built from', 'Semitones above the root: 3rd, 5th, 7th', 'On C'], rows, 'The five 7th chords, on the root C.'),
      remember('**Dominant 7th**: major triad + minor 7th. **Major 7th**: major triad + major 7th. **Minor 7th**: minor triad + minor 7th. **Half-diminished 7th**: diminished triad + minor 7th. **Diminished 7th**: diminished triad + diminished 7th.'),
      p('Here are the five on C, then the sound of each.'),
      staffBlock(chordsOnStaff('treble', pictures), 'From the left: C7 (dominant 7th), Cmaj7 (major 7th), Cm7 (minor 7th), Cm7b5 (half-diminished 7th) and Cdim7 (diminished 7th).'),
      ...SEVENTH_QUALITIES.map((q, i) => listenBlock(`Hear C ${SEVENTH_NAME[q as keyof typeof SEVENTH_NAME]}`, chordAudio(pictures[i]!, 'block'))),
      tip(
        `Look at the diminished 7th on C: ${notesLabel(dim7)}. Every note is a minor 3rd (3 semitones) above the one before. Its 7th is a **diminished 7th**: 9 semitones above the root. That is the same distance as a major 6th, but it is *written* as a 7th because the letter is B. That is why the top note needs a double flat: B♭♭.`,
      ),
      tip('A memory aid for the name "half-diminished": the triad is diminished but the 7th is only a minor 7th, so only "half" of the chord is diminished. The full diminished 7th has a diminished triad and a diminished 7th.'),

      h('Method 1: build a 7th chord'),
      steps(
        'Write the **root**.',
        'Write the **letters**: skip a letter each time, three times. From G: G, B, D, F.',
        'Look up the **recipe**: the semitones from the root to the 3rd, 5th and 7th in the table.',
        'For the 3rd, count the semitones from the root up to the **plain** letter. Compare with the recipe. Add a sharp if the count is too small; add a flat if it is too big (one sign for each semitone).',
        'Do the same for the 5th, then for the 7th. Always count from the **root**, not from the note before, so that one slip cannot spoil the rest.',
        'Check: the lower three notes must make the right **triad**, and the top note must be the right 7th above the root.',
      ),
      h('Worked examples: building 7th chords'),
      worked(buildSeventhExample(note('G'), 'dominant7')),
      worked(buildSeventhExample(note('D'), 'minor7')),
      worked(buildSeventhExample(note('C'), 'major7')),
      worked(buildSeventhExample(note('B'), 'half-diminished7')),
      worked(buildSeventhExample(note('C'), 'diminished7')),

      h('Method 2: name a 7th chord on the staff'),
      steps(
        'Name the four notes from the bottom up, using the clef, the key signature and any signs.',
        'Check the letters skip one letter each time. The lowest note is the **root**.',
        'Count the semitones from the root to the 3rd, then from the root to the 5th, then from the root to the 7th. That gives three numbers.',
        'Match the three numbers to the table: 4, 7, 10 is dominant; 4, 7, 11 is major; 3, 7, 10 is minor; 3, 6, 10 is half-diminished; 3, 6, 9 is diminished.',
        'Name the chord with its root and type. Check that the lower three notes are the triad the recipe says.',
      ),
      h('Worked examples: naming 7th chords'),
      worked(identifySeventhExample(chordPicture(chord('E', 'minor7'), 'treble'))),
      worked(identifySeventhExample(chordPicture(chord('Ab', 'dominant7'), 'treble'))),
      p('In the second example the top note is **G♭**, not F♯. The letters must skip one letter each time (A, C, E, G), so G♭ is the correct spelling.'),

      h('Common mistakes'),
      watch('**Dominant 7th or major 7th?** They share the same triad (major). The 7th is one semitone different: 10 for the dominant 7th, 11 for the major 7th. C7 has B♭; Cmaj7 has B.'),
      watch('**Counting from the note before.** If the 3rd is wrong, every count after it is wrong too. Count each note from the root.'),
      watch('**Half-diminished or diminished?** Both have a diminished triad. Only the 7th differs: 10 semitones (half-diminished) or 9 (diminished).'),
      watch('**Writing A instead of B♭♭.** B♭♭ and A are the same sound, but the 7th above C must use the letter B. In a diminished 7th on C the double flat is correct.'),
      watch('**What "dominant" means in "dominant 7th".** "Dominant 7th" names a **type** of chord: a major triad with a minor 7th. It is called that because this is the type of chord that sits on the 5th note (the dominant) of a major key, but the same type can be built on any note.'),

      h('Try it'),
      p('Easy uses the dominant, major and minor 7th chords. Medium adds the half-diminished 7th, and Hard adds the diminished 7th.'),
      practise({ label: 'Practise 7th chords (easy)', topics: ['chords'], level: 1, clefs: ['treble'] }),
      practise({ label: 'Practise 7th chords (hard)', topics: ['chords'], level: 3, clefs: ['treble'] }),
      list('Next lesson: **Inversions and chord symbols**.'),
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
      p('A chord does not have to have its **root** at the bottom. You can put another chord note at the bottom and keep the same notes: the chord is then **inverted**. An **inversion** is the same chord with a different note as the lowest note. The name of the chord does not change; only the lowest note does.'),
      p('A **chord symbol** is a short way of writing a chord with letters and numbers, such as Am7 or C/E. Song books often show chords this way. Here is C major three ways: the same three notes, with a different one at the bottom each time.'),
      staffBlock(chordsOnStaff('treble', positions), 'C major: C E G, then E G C, then G C E. The same notes, three different lowest notes.'),
      listenBlock('Hear C E G', chordAudio(positions[0]!, 'block')),
      listenBlock('Hear E G C', chordAudio(positions[1]!, 'block')),
      listenBlock('Hear G C E', chordAudio(positions[2]!, 'block')),

      h('What you need to know first'),
      p('**Triads and 7th chords.** A triad is three notes stacked in thirds (root, 3rd, 5th). A 7th chord adds a 7th above the root. A **third** is two letters up (skip one letter): C to E. The **root** is the note the others are stacked above in thirds.'),
      p('To name a chord you count semitones from the root. For a triad: major is 4 and 7 (3rd and 5th), minor is 3 and 7, diminished is 3 and 6, augmented is 4 and 8. For a 7th chord add the 7th: dominant 7th is 4, 7, 10; major 7th is 4, 7, 11; minor 7th is 3, 7, 10; half-diminished 7th is 3, 6, 10; diminished 7th is 3, 6, 9.'),

      h('The facts: inversions'),
      p('The name of the inversion depends only on **which note of the chord is the lowest**.'),
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
      remember('Look at the **lowest** note and ask which note of the chord it is. Root: root position. 3rd: first inversion. 5th: second inversion. 7th: third inversion.'),
      p('The last two columns are **figured bass** labels. They are extra information: a way some musicians write the inversion with numbers. The numbers say which intervals sit above the bass note (in first inversion C major, E G C, the C is a 6th above the bass E, so the label is 6). You will see these labels in the explanations in Practice. The names in the first two columns are what questions ask for.'),
      p('Here is G7 in all four positions.'),
      staffBlock(chordsOnStaff('treble', g7Positions), 'G7 from the left: root position (G B D F), first inversion (B D F G), second inversion (D F G B), third inversion (F G B D).'),

      h('The facts: chord symbols'),
      table(['Symbol on C', 'Ending', 'Chord'], symbolRows, 'The same nine chords as in the last two lessons. A plain letter means a major triad.'),
      remember('A chord symbol is the **root**, then an **ending** for the type. A **slash** and a note at the end, as in C/E, says which note is at the **bottom**.'),
      p('In Cm7b5 the "b" is a flat sign: the 5th is flattened, which is what makes the triad diminished. Other books may write the same chords slightly differently (for example Cmin for Cm, C+ for Caug, C° for Cdim, CM7 or CΔ7 for Cmaj7, Cø for Cm7b5). In this app, use the forms in the table.'),
      p('A **slash chord** such as **C/E** means "the chord C, with E in the bass". E is the 3rd of C major, so C/E is C major in first inversion: the notes E G C, lowest first. In this app the note after the slash is always one of the chord\'s own notes, so a slash chord is always an inversion.'),

      h('Method 1: find the inversion'),
      steps(
        'Name the notes from the bottom up (clef, key signature and signs).',
        'Find the **root**. Test each note in turn: count letters up from it. The right one has the other notes a 3rd and a 5th above it (and a 7th, for a 7th chord).',
        'Name the chord by counting semitones from the root (this is only needed if the question asks for the name or the symbol).',
        'Look at the **lowest** note on the staff. Which chord note is it: the root, the 3rd, the 5th or the 7th?',
        'Name the inversion from the table: root, first, second or third.',
        'Check: start from the notes stacked in thirds from the root, and move the bottom note to the top once for each inversion. You should arrive at the notes as written.',
      ),
      h('Worked examples: finding the inversion'),
      worked(inversionExample(c, 1)),
      worked(inversionExample(chord('F#', 'minor'), 2)),
      worked(inversionExample(g7, 3)),

      h('Method 2: write the chord symbol'),
      steps(
        'Name the notes, find the **root**, and name the **type** by counting semitones (as in Method 1).',
        'Write the root, then the **ending** for the type (nothing for major, m for minor, dim, aug, 7, maj7, m7, m7b5, dim7).',
        'Look at the lowest note. If it is the root, you have finished. If it is not, add a **slash** and the name of the lowest note.',
        'Check: read the symbol back. It must give the same notes, with the slash note at the bottom.',
      ),
      h('Worked examples: writing the symbol'),
      worked(chordSymbolExample(chord('B', 'half-diminished7'), 0)),
      worked(chordSymbolExample(chord('A', 'minor'), 1)),

      h('Method 3: read a symbol and write the chord'),
      steps(
        'Split the symbol into the **root**, the **ending**, and the note after the **slash** (if there is one).',
        'Use the ending to decide the type. Spell the chord in root position: write the letters, count the semitones and add signs (see the triads and 7th chords lessons).',
        'If there is a slash, move the bottom note to the top until the slash note is at the bottom.',
        'Write the notes on the staff, lowest first, and check that the bottom note is the slash note.',
      ),
      h('Worked examples: reading a symbol'),
      worked(readChordSymbolExample(chord('Bb', 'minor'), 0)),
      worked(readChordSymbolExample(c, 1)),
      worked(readChordSymbolExample(g7, 1)),

      h('Common mistakes'),
      watch('**Naming the chord after the lowest note.** E G C is not an "E chord". The root is C, because E and G are stacked above C in thirds (C E G). E G C is C major in first inversion.'),
      watch('**Mixing up the position and the number.** First inversion means the **3rd** is lowest, not the 1st note. Root position means the root is lowest. Third inversion needs a 7th, so triads only go as far as second inversion.'),
      watch('**Reading C/E as "an E chord".** The note after the slash is only the **bass**. C/E is still a C chord. The root is the first letter.'),
      watch('**Leaving off the slash.** A chord in first inversion written as just C tells the player to put the root at the bottom. If the 3rd is lowest, the symbol needs the slash: C/E.'),
      watch('**Reading figured bass as a count.** The figure 6 does not mean "sixth inversion". It is a label for an interval above the bass note. For triads, 6 is first inversion and 6/4 is second inversion.'),

      h('Try it'),
      p('Practice asks inversions at every level. Chord symbols with slashes appear at Hard.'),
      practise({ label: 'Practise chords and inversions (easy)', topics: ['chords'], level: 1, clefs: ['treble'] }),
      practise({ label: 'Practise chords, inversions and symbols (hard)', topics: ['chords'], level: 3, clefs: ['treble'] }),
      list('Next lesson: **Roman numerals and primary chords**.'),
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
      p('A **Roman numeral** names a chord by its **job in a key**. Instead of saying "G major", you say "chord V in C major" (the chord built on the 5th note of the scale). The big advantage is that the numerals stay the same in every key: **I, IV, V** are C, F, G in C major, and G, C, D in G major. Musicians use them to talk about how a piece of music is built, whatever key it is in.'),
      p('By the end you will be able to find the numeral of a chord in a key, and write the chord for a numeral. You will also know which chords are the **primary chords**.'),

      h('What you need to know first'),
      p('**Scales and notes of a key.** A major scale has seven notes: 1 to 7, then 1 again an octave higher. In C major they are C D E F G A B. A **minor** key is built on the natural minor scale: in A minor, A B C D E F G. (If you need the method, see the Major scales and Minor scales lessons.)'),
      p('**Triads.** A triad is three notes stacked in thirds, and it is major, minor or diminished depending on the semitones: major 4 and 7 from the root, minor 3 and 7, diminished 3 and 6.'),
      p('**Key signature.** The sharps or flats at the start of a staff tell you which notes of the key are sharp or flat. When a question shows a chord on a staff, use the key signature to read the notes correctly.'),

      h('The facts: the chords of a major key'),
      p('Take the notes of a major scale. Build a chord on **each** of the seven notes by stacking thirds, using **only notes of the key**: start on the note, skip one note, take the next, skip one, take the next. Here is C major:'),
      table(['Note number', 'Numeral', 'Chord', 'Notes'], keyChordRows(C_MAJOR), 'The seven chords of C major.'),
      staffBlock(chordsOnStaff('treble', cPictures.slice(0, 4), C_MAJOR), 'The first four chords of C major: I, ii, iii, IV. (C major has no sharps or flats, so the key signature is empty.)'),
      staffBlock(chordsOnStaff('treble', cPictures.slice(4), C_MAJOR), 'The last three chords of C major: V, vi, vii°.'),
      listenBlock('Hear the seven chords of C major', chordSequenceAudio(cPictures, 1.1, 1)),
      p('The numeral letters are the note number: **I** is 1, **II** is 2, **III** is 3, **IV** is 4, **V** is 5, **VI** is 6, **VII** is 7. The **case** and the **°** tell you the type:'),
      list('**Capital letters**: a major chord (I, IV, V).', '**Small letters**: a minor chord (ii, iii, vi).', '**Small letters with ° (a little circle)**: a diminished chord (vii°).'),
      remember('In every major key the pattern is **I ii iii IV V vi vii°**: major, minor, minor, major, major, minor, diminished.'),
      p('The pattern is the same in every major key, because every major scale has the same pattern of tones and semitones. Here is G major, to prove it:'),
      table(['Note number', 'Numeral', 'Chord', 'Notes'], keyChordRows(gMajor), 'The seven chords of G major.'),

      h('The facts: primary chords'),
      p(`The three most important chords of a key are built on notes **1, 4 and 5**: **I, IV and V**. This app calls them the **primary chords**. In a major key all three are major chords. In C major they are ${primaryC.join(', ')}. Between them they use every note of the scale, which is part of why they work so well together.`),

      h('The facts: minor keys'),
      p('In a minor key the numerals are measured against the **natural minor** scale. Building chords on A natural minor (A B C D E F G) gives:'),
      table(['Note number', 'Numeral', 'Chord', 'Notes'], keyChordRows(aMinor), 'The seven chords of A minor, from the natural minor scale.'),
      remember('In a natural minor key the pattern is **i ii° III iv v VI VII**: minor, diminished, major, minor, minor, major, major.'),
      p(`In this app the chord on note 5 in a minor key is usually the **major** V (${chordWords(aHarmonic[4]!.chord)}: ${notesOf(aHarmonic[4]!.chord)}), and the chord on note 7 is the diminished **vii°** (${chordWords(aHarmonic[6]!.chord)}: ${notesOf(aHarmonic[6]!.chord)}). Both use note 7 **raised by a semitone** (G becomes G♯ in A minor). That raised note is the leading note, and it comes from the **harmonic minor** scale (the natural minor scale with its 7th note raised by a semitone). Because V is major, the primary chords in a minor key are **i, iv and V**.`),
      p(`You may also meet the minor **v** (${symbolOf(diatonicChords(aMinor)[4]!.chord)}) and the major **VII** (${symbolOf(diatonicChords(aMinor)[6]!.chord)}), which use the plain natural minor notes. The capital or small letter tells you which one it is.`),
      p('Adding a **7** to a numeral makes it a 7th chord: V7 is a dominant 7th (in C major, G7). Hard questions use 7th chords such as V7.'),

      h('Method 1: find the numeral of a chord'),
      steps(
        'Name the chord and its type (major, minor or diminished) from its notes. The lowest note of a root-position chord is the root.',
        'Write out the scale of the key and **number the notes** 1 to 7.',
        'Find the chord\'s **root** in the scale. Its number gives the numeral letters (3 is III, 5 is V and so on).',
        'Choose capital or small letters from the type: major is capitals; minor is small letters; diminished is small letters with °.',
        'Write the numeral. Add a 7 if it is a dominant 7th chord.',
        'Check that every note of the chord is in the scale (in a minor key, the raised 7th is the one exception).',
      ),
      h('Worked examples: finding the numeral'),
      worked(romanNumeralExample(gMajor, chord('D', 'major'))),
      worked(romanNumeralExample(C_MAJOR, chord('A', 'minor'))),
      worked(romanNumeralExample(aMinor, chord('E', 'major'))),
      worked(romanNumeralExample(aMinor, chord('G#', 'diminished'))),

      h('Method 2: find the chord for a numeral'),
      steps(
        'Read the numeral. The letters give a **note number**. The case (and ° or 7) gives the type.',
        'Write out the scale of the key and number the notes.',
        'Find that note number in the scale. It is the **root** of the chord.',
        'Stack thirds **using only notes of the scale**: take the root, skip a note, take the next, skip a note, take the next. (In a minor key, V and vii° use the 7th note raised by a semitone.)',
        'Check the type by counting semitones from the root, and make sure it matches the case of the numeral.',
        'Write the chord with its symbol and its notes.',
      ),
      h('Worked examples: finding the chord'),
      worked(chordFromNumeralExample(parseKey('F major'), 'ii')),
      worked(chordFromNumeralExample(parseKey('D major'), 'vi')),
      worked(chordFromNumeralExample(parseKey('C minor'), 'iv')),
      worked(chordFromNumeralExample(gMajor, 'V7')),

      h('Worked example: the primary chords of a key'),
      worked(primaryChordsExample(parseKey('Bb major'))),
      worked(primaryChordsExample(aMinor)),

      h('Common mistakes'),
      watch('**Mixing up capitals and small letters.** The case is the type: capitals mean major, small letters mean minor. The chord on note 2 of C major is Dm, a minor chord, so the numeral is **ii**, not II.'),
      watch('**Forgetting that the numeral depends on the key.** D major is chord I in D major, chord V in G major and chord IV in A major. Always start by writing out the scale of the key you are given.'),
      watch('**Leaving off the circle.** A diminished chord is written with small letters **and** °: vii°. Without the circle, vii would be a minor chord.'),
      watch('**Using the natural minor notes for V in a minor key.** E G B in A minor is a minor chord, which is v. The major V needs the raised 7th: E G♯ B.'),
      watch('**Counting from the wrong note.** The numeral counts from the **key note** (note 1 of the scale), not from the lowest note on the staff or the first note of the chord. In D major, A is note 5 because D is note 1: D, E, F♯, G, A.'),

      h('Try it'),
      p('Practice asks both ways: from a chord on the staff to a numeral, and from a numeral to a chord.'),
      practise({ label: 'Practise Roman numerals (easy)', topics: ['chords'], level: 1, clefs: ['treble'] }),
      practise({ label: 'Practise Roman numerals (medium)', topics: ['chords'], level: 2, clefs: ['treble'] }),
      list('Next lesson: **Cadences**, which use the primary chords.'),
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
      p('A **phrase** is a musical sentence. A **cadence** is the pair of chords at the end of a phrase, a bit like the punctuation at the end of a sentence. Different pairs of chords end the music in different ways: some sound finished, some sound as if there is more to come.'),
      p('This lesson uses the Roman numerals from the last lesson, so you can recognise a cadence in any key. It covers the four cadences this app asks about: **perfect, imperfect, plagal and interrupted**.'),

      h('What you need to know first'),
      p('**Roman numerals.** A Roman numeral gives a chord its number in the key: I is the chord on note 1 of the scale, IV on note 4, V on note 5 and vi on note 6. Capital letters mean a major chord; small letters mean a minor chord. In C major I is C, ii is Dm, IV is F, V is G and vi is Am.'),
      p('**The tonic.** The chord on note 1 (chord I, or i in a minor key) is the **home chord** of the key. Music often feels as if it has arrived when it lands there.'),

      h('The facts'),
      table(['Cadence', 'Chords', 'In C major'], rows, 'The four cadences in a major key. In a perfect or interrupted cadence, V7 can stand in for V.'),
      remember('**Perfect**: V (or V7) then I. **Imperfect**: I, ii or IV then V. **Plagal**: IV then I. **Interrupted**: V (or V7) then vi.'),
      p('The **order** matters. V then I is a perfect cadence, but I then V is an imperfect cadence. IV then I is plagal, but I then IV is not a cadence in this app.'),
      p('How each cadence sounds is a matter of ear, but there are common ways of describing them. These are descriptions to help you listen, not rules for answering questions:'),
      list(...sounds.map(([t, s]) => `**${capital(t)}**: ${s}.`)),
      p('Listen to the four in C major. Each sound starts with the key chord (C), a pause, and then the two chords of the cadence.'),
      ...CADENCE_TYPES.flatMap((t) => cadencePicture(C_MAJOR, t).blocks),

      h('The facts: cadences in minor keys'),
      p('In a minor key the chords are i, ii°, iv, V and VI (small letters for minor and diminished, capitals for major). The V chord is **major**, because it uses the raised 7th note (the leading note). In A minor that note is G♯, which is not in the key signature, so it is written as an **accidental**: a sign written in front of the note.'),
      table(['Cadence', 'Chords', 'In A minor'], minorRows, 'The four cadences in a minor key.'),
      ...cadencePicture(aMinor, 'perfect').blocks,
      p('Look for the G♯ in the first chord: the key signature of A minor has no sharps, so the sharp sign is written in front of the G.'),
      watch('**What this app does not cover.** It uses only these four cadences. It does not cover other kinds, such as a perfect cadence in a minor key that ends on a *major* chord (a "Picardy third"). It also does not list pairs such as vi then V. If a pair of chords is not one of the patterns above, it is not one of the answers.'),

      h('Method 1: identify a cadence on the staff'),
      steps(
        'Look at the **key**. The question tells you, and the key signature agrees.',
        'Write out the scale of the key and number the notes.',
        'Name the **first chord**: its notes, its root, and its type. Find the root in the scale to get its numeral.',
        'Name the **second chord** in the same way.',
        'Write the two numerals as a pair, for example V then I.',
        'Match the pair to the patterns in the table. That gives the name of the cadence.',
        'Check against the definition of the cadence.',
      ),
      h('Worked examples: identify the cadence'),
      worked(cadenceExample(C_MAJOR, 'perfect', 'identify')),
      worked(cadenceExample(parseKey('G major'), 'imperfect', 'identify', 1)),
      worked(cadenceExample(parseKey('F major'), 'plagal', 'identify')),
      worked(cadenceExample(parseKey('D major'), 'interrupted', 'identify')),
      worked(cadenceExample(parseKey('E minor'), 'perfect', 'identify')),
      worked(cadenceExample(aMinor, 'imperfect', 'identify', 2)),

      h('Method 2: write a cadence'),
      steps(
        'Look up the pattern for the cadence in the table, as numerals (for example IV then I).',
        'Write out the scale of the key and number the notes.',
        'Build each chord from its numeral by stacking thirds on that note, using the notes of the key. (In a minor key V uses the raised 7th.)',
        'Write the key signature on the staff, then the two chords one after the other, each as a stack of three notes. Add a sign in front of any note that the key signature does not give.',
        'Check that the two chords really are the pair of numerals you started with.',
      ),
      h('Worked examples: write the cadence'),
      worked(cadenceExample(parseKey('D major'), 'plagal', 'write')),
      worked(cadenceExample(parseKey('G major'), 'perfect', 'write', 1)),
      worked(cadenceExample(parseKey('C minor'), 'perfect', 'write')),

      h('Common mistakes'),
      watch('**Confusing perfect and plagal.** Both end on chord I. The chord before decides: V gives a perfect cadence, IV gives a plagal cadence.'),
      watch('**Getting the order wrong.** V then I is perfect; I then V is imperfect. Always read the two chords in the order they are written.'),
      watch('**Calling an interrupted cadence perfect.** It starts the same way (V), but it ends on vi, not on I.'),
      watch('**Forgetting the leading note in a minor key.** The V chord is major, so its 3rd is the raised 7th note. If it is not in the key signature, it needs an accidental. In C minor, whose key signature has B♭, the V chord G B D needs a natural sign on the B.'),
      watch('**Trusting the sound words more than the notes.** "Finished" and "unfinished" help you when listening, but on the staff the only way to be sure is to work out the two numerals.'),

      h('Try it'),
      p('Practice asks two kinds of questions: a cadence written on the staff (name it) and a cadence by name (find the chords).'),
      practise({ label: 'Practise cadences (easy)', topics: ['cadences'], level: 1, clefs: ['treble'] }),
      practise({ label: 'Practise cadences (medium)', topics: ['cadences'], level: 2, clefs: ['treble'] }),
      list('Next: **Music vocabulary**, then **Ear training**, where you will hear these cadences.'),
    ]
  },
}

/** What each vocabulary category is for, in plain words, with word roots where they are certain. */
const CATEGORY_INTRO: Record<string, Block[]> = {
  tempo: [
    p('**Tempo** is the speed of the music. Most tempo words are **Italian**, and musicians all over the world still use them. The first part of the table goes roughly from slow to fast. The words after that are mostly about changes of speed.'),
    p('A few English roots, so that the words stick: **allegro** is Italian for "cheerful", **andante** comes from an Italian verb meaning "to go" (the app\'s meaning is "at a walking pace"), **largo** means "broad", **lento** means "slow", **presto** means "quick", **vivace** means "lively", and **rubato** means "robbed".'),
  ],
  dynamics: [
    p('**Dynamics** say how loud or quiet to play. These are Italian words too. **Piano** means "soft" and **forte** means "strong" (so, loud). **Mezzo** means "half". Adding **-issimo** means "very", which is why pianissimo is very quiet and fortissimo is very loud.'),
    p('The keyboard instrument called the piano is short for *pianoforte*, which means "soft-loud": it can play both softly and loudly, depending on how you touch the keys.'),
  ],
  articulation: [
    p('**Articulation** is how single notes are started, joined or ended: short and detached, smooth, plucked, with a mute. The words in this group describe the **way** notes are played.'),
    p('Some word roots: **staccato** means "detached", **legato** means "tied together" (smooth), **tenuto** means "held", **marcato** means "marked", **pizzicato** comes from an Italian verb meaning "to pluck", **tremolo** means "trembling" and **sordino** means "mute".'),
  ],
  ornaments: [
    p('**Ornaments** are decorations added to a note to make it more interesting. They are small and quick, and the symbols for them are written above or beside the main note.'),
    p('Two word roots: **acciaccatura** comes from an Italian verb meaning "to crush" (the note is squeezed in and very short), and **appoggiatura** comes from an Italian verb meaning "to lean" (the note leans on the main note).'),
  ],
  texture: [
    p('**Texture** is how the layers of sound in a piece fit together: how many parts there are, and how they relate to each other. The words come from Greek: **mono** is "one", **homo** is "same", **poly** is "many" and **hetero** is "different". **Phonic** means "sound".'),
    p('So **monophonic** is one sound (a single line), **homophonic** is the "same" sound (parts moving together), **polyphonic** is "many sounds" (independent lines) and **heterophonic** is "different" versions of one tune.'),
  ],
  form: [
    p('**Form** is the plan of a piece: how its sections are ordered and repeated. Letters are used for the sections: **A** is the first section, **B** a contrasting one, and so on.'),
    p('Some roots: **binary** is two-part and **ternary** is three-part. A **strophe** is a verse of a song, so **strophic** is verse by verse. **Ostinato** is Italian for "obstinate": it stubbornly repeats. **Coda** is Italian for "tail": a piece added at the end.'),
  ],
  instruments: [
    p('Instruments are sorted into **families** by the way they make their sound. **Woodwind** instruments make sound by sending breath across an edge or against a thin reed (flute, clarinet). **Brass** instruments are blown with the lips buzzing into a mouthpiece. **String** instruments make sound from vibrating strings, which are bowed or plucked. **Percussion** instruments are struck, shaken or scraped.'),
  ],
  tonality: [
    p('**Tonality** is about the key of the music: its home note, and whether it sounds major, minor or something else. Many of these words are used in other lessons too: you have met **major**, **minor**, **tonic** and **dominant** already.'),
    p('Some word roots: **penta** is Greek for "five" (a pentatonic scale has five notes), **a-** means "without" (so *atonal* is "without a key"), and **chromatic** comes from a Greek word for "colour".'),
  ],
}

/** Memory tips and the commonest confusion for each category. */
const CATEGORY_NOTES: Record<string, Block[]> = {
  tempo: [
    tip('A memory aid: words ending in **-ando** (accelerando, rallentando) are "-ing" words in Italian: they describe a **change** in speed, going on gradually. Allegro and presto are a **speed**, not a change.'),
    watch('**Rallentando and ritardando** both mean gradually getting slower in this app, so the app does not offer one as a wrong answer for the other. And **a tempo** means "go back to the original speed", which is different from simply going faster.'),
  ],
  dynamics: [
    tip('A memory aid: **mezzo** means "half", so mp is only a little louder than p, and mf is only a little quieter than f. From quietest to loudest: pp, p, mp, mf, f, ff. Words ending in **-endo** (crescendo, diminuendo) describe a gradual change.'),
    watch('**Diminuendo and decrescendo** mean the same thing here: gradually getting quieter. Do not confuse crescendo (gradually louder) with **sforzando** (sfz), which is a sudden, strong accent on one note, not a gradual change.'),
  ],
  articulation: [
    tip('A memory aid: **stac**cato is short and spiky; **leg**ato is smooth, like gliding. **Pizz**icato is plucked; **arco** is the opposite, played with the bow.'),
    watch('**A slur and a tie look alike.** A slur is a curved line over notes of different pitches: play them smoothly. A curved line joining two notes of the **same** pitch is a tie, a different thing: it joins them into one longer note. Marcato, accent and sforzando all mean some kind of emphasis but are different words, so learn what the app says each one means.'),
  ],
  ornaments: [
    tip('A memory aid: a **trill** goes back and forth many times; a **mordent** is a single quick "nip"; a **turn** circles round the main note (above, the note, below, the note).'),
    watch('**Acciaccatura or appoggiatura?** Both are grace notes. The acciaccatura is very short, squeezed in just before the main note, with a slash through its stem. The appoggiatura is a leaning note that takes some of the length of the main note.'),
  ],
  texture: [
    tip('A memory aid: **mono** = one line; **homo** = the parts move **together** (a tune with chords under it); **poly** = many lines, each one doing its own thing.'),
    watch('**Homophonic or polyphonic?** In homophonic music one part is the tune and the others support it, moving together. In polyphonic music every part is a melody of its own. A **canon** is the strictest form of imitation: every part plays the same tune, starting at different times.'),
  ],
  form: [
    tip('A memory aid: binary is **two** sections (A B), ternary is **three** (A B A), and a rondo keeps coming **round** to A again and again (A B A C A).'),
    watch('**Ostinato, ground bass or riff?** All three are patterns repeated over and over. A ground bass is in the **bass**. An ostinato can be in any part. A riff is a short repeated pattern used in rock and jazz.'),
  ],
  instruments: [
    tip('Instruments that play tunes can still be percussion. The xylophone, the glockenspiel and the timpani are all in the percussion family, because they are played by hitting them.'),
    watch('**The saxophone is made of metal, but it is a woodwind.** Families are decided by how the sound is made, not by the material. The saxophone makes its sound with a reed, like the clarinet. In the same way, the piccolo is a small flute, and the cor anglais is a woodwind instrument, even though its name means "English horn".'),
  ],
  tonality: [
    tip('A memory aid: **tonic** is "home", **dominant** is the 5th note (the chord V), **diatonic** is "in the key" and **chromatic** is "with notes from outside the key".'),
    watch('**"Dominant" in two places.** In a key, the **dominant** is the 5th note of the scale, or the chord built on it. A **dominant 7th** chord (from the chords lessons) is a particular type of chord: a major triad with a minor 7th. It has the name because that is the type of chord found on the dominant of a major key, but you can build a dominant 7th chord on any note.'),
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
    p('Music has its own vocabulary: words for speed, loudness, how to play a note, how a piece is planned, and more. Many of them are **Italian**, and musicians all over the world still use them. This lesson goes through the words that the vocabulary questions ask about.'),
    p('**This is the app\'s own list.** It was drafted for this app and is still being checked, so do not treat it as an official list. If your teacher or your course gives you a list, learn that one too.'),
    h('How the questions work'),
    p('There are two kinds of question. One gives you a **term** and asks what it **means**. The other gives you a **meaning** and asks which **term** it is. Learn each word in both directions.'),
    p('Easy questions use the core words. Medium adds more, and Hard adds everything, including the words marked *(extra)* in the tables below.'),
    ...VOCABULARY.flatMap((category): Block[] => [
      h(category.label),
      ...(CATEGORY_INTRO[category.category] ?? [p(`These are the words in the group "${category.label}".`)]),
      vocabularyTable(category),
      ...(CATEGORY_NOTES[category.category] ?? []),
    ]),
    h('How to revise vocabulary'),
    steps(
      'Pick **one** group of words from this lesson, for example tempo.',
      'Read the table once. Then cover the meaning column and try to say each meaning aloud. Look only at the ones you got wrong.',
      'Go to Practice. Choose Vocabulary and start on Easy. Choose a single group first, if the settings let you.',
      'After each answer, read the explanation. It also lists similar words from the same group, which is a quick way to learn them in pairs.',
      'Write down the words you get wrong, and try them again the next day. Short, regular sessions work better than one long one.',
      'When Easy feels comfortable, move to Medium and then Hard. Hard includes the *(extra)* words.',
    ),
    practise({ label: 'Practise vocabulary (easy)', topics: ['vocabulary'], level: 1 }),
    practise({ label: 'Practise vocabulary (hard)', topics: ['vocabulary'], level: 3 }),
    list('Next lesson: **Ear training**.'),
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
      p('**Ear training** means learning to recognise what you hear: the type of a chord, the size of an interval, how a cadence ends, or which note is at the bottom of a chord. It is a skill, and like any skill it improves with a little practice. You do not need to read music to start, but you will connect what you hear to the notes written on the staff.'),

      h('How the listening questions work'),
      steps(
        'You press **Play** and the app plays a short sound, made from real notes.',
        'You can **replay** it as many times as you like.',
        'You choose an answer.',
        'The app then shows **what you heard written on a staff**, with a short explanation. Read this every time, even when you were right: it connects the sound to the notes.',
      ),
      p('You need sound for these questions. If you hear nothing, check your device volume, and check that your phone is not set to silent.'),

      h('General advice for beginners'),
      list(
        '**Listen to the whole sound first.** Decide on the overall character before you try to pick out single notes.',
        '**Sing or hum.** If you can hum the lowest note, or the top note, you are really hearing it. Humming is the quickest way to get the size of an interval.',
        '**Compare.** Judging two sounds next to each other is much easier than judging one alone. In this lesson you can play two sounds one after the other.',
        '**Replay and listen again.** Listen for a different thing each time: first the mood, then the bottom note, then the top.',
        '**Do not judge by high or low.** The same type of chord can be played higher or lower. What you are listening for is the **character**, not the pitch.',
        '**Little and often.** A few minutes every day works better than a long session once a week.',
      ),

      h('Chord quality'),
      p('**Chord quality** means the type of chord: major, minor, diminished or augmented (and, at Hard level, three of the 7th chords). A good first step is to decide between **major** and **minor**, then to notice the odd ones out.'),
      p('People often describe the types in the words below. These are common descriptions, not rules, and you will hear them slightly differently. Use them as a first guide, and trust the **differences** you hear between chords.'),
      table(['Chord', 'Often described as', 'On C'], chordRows, 'Common descriptions of each chord. They are aids, not rules.'),
      p('Listen to each one on C, one at a time, and notice how the character changes:'),
      ...qualities.map((q, i) => listenBlock(`Hear C ${SEVENTH_NAME[q as keyof typeof SEVENTH_NAME] ?? q}`, chordAudio(pictures[i]!, 'block'))),
      p('Sometimes the notes are played one at a time from the bottom (a **broken chord**), and then all together. Listen for the whole chord at the end.'),
      listenBlock('Hear C major as a broken chord, then together', chordAudio(pictures[0]!, 'broken')),
      p('To hear the difference between major and minor on the same root, here are C major and C minor side by side. Only the middle note has changed, by one semitone.'),
      staffBlock(chordsOnStaff('treble', [pictures[0]!, pictures[1]!]), 'C major (C E G) and C minor (C E♭ G): only the middle note differs.'),
      listenBlock('Hear C major', chordAudio(pictures[0]!, 'block')),
      listenBlock('Hear C minor', chordAudio(pictures[1]!, 'block')),
      h('Method: listening for chord quality'),
      steps(
        'Play the chord two or three times. Listen to the whole sound.',
        'Decide first: does it sound **settled** (major or minor), or **tense and unusual** (diminished or augmented)?',
        'If settled: is it **brighter** (major) or **darker** (minor)?',
        'If tense: a diminished chord is often described as tense and unstable; an augmented chord as strange and floating. Compare them on the same root if you can.',
        'If 7th chords are in the answers, listen for an **extra note** that changes the mood: a dominant 7th often sounds as if it wants to move on; a major 7th is often smooth and dreamy; a minor 7th is often mellow.',
        'Choose, then read the explanation and look at the staff.',
      ),
      worked(earChordExample(note('C'), 'major')),
      worked(earChordExample(note('B'), 'diminished')),

      h('Intervals'),
      p('An **interval** is the distance between two notes. In the app you hear two notes, either one after the other (going up or going down) or both together, and you choose the interval. Every interval has a size in **semitones** (the smallest step on a piano), and a bigger interval sounds like a bigger jump.'),
      p('Start with the five that Easy questions use: minor 3rd, major 3rd, perfect 4th, perfect 5th and the octave. Here are the first notes of some well-known tunes, as memory aids. Each starts with the interval going **up**.'),
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
      p('When the two notes sound together, 2nds and 7ths often sound rough and clashing, while 3rds, 5ths and octaves often sound smoother. At Hard level you will also hear the **tritone**: 6 semitones, which is an augmented 4th or a diminished 5th (the app calls it a tritone).'),
      h('Method: listening for an interval'),
      steps(
        'Listen to the two notes. Play them again.',
        'Decide whether the jump is **small** (a 2nd or 3rd), **medium** (a 4th or 5th) or **large** (a 6th, a 7th or an octave).',
        'Hum the first note, then hum the second. Feel how far your voice travels.',
        'Compare with a memory aid: does it match the start of one of the tunes?',
        'Choose, then read the number of semitones in the explanation and look at the notes on the staff.',
      ),
      worked(earIntervalExample(parsePitch('C4'), 'P5', 'P4')),
      worked(earIntervalExample(parsePitch('C4'), 'M3', 'm3')),

      h('Cadences'),
      p('In a cadence question you hear the **key chord** first (the home chord), then a short pause, and then the **two chords of the cadence**. You decide which of the four cadences it was. Here are the four, in C major:'),
      ...CADENCE_TYPES.map((t, i) => {
        const block = cadenceListens[i]!
        return block.type === 'listen' ? listenBlock(`Hear the ${t} cadence in C major`, block.item.audio) : block
      }),
      p('Ask yourself two questions about the **last** chord:'),
      list(
        'Does it sound like **home**, the chord you heard first? If yes, it is a **perfect** cadence (the arrival feels strong, like a full stop) or a **plagal** cadence (the arrival feels gentle, like the "Amen" at the end of a hymn).',
        'If it does **not** sound like home: does it simply **stop**, as if there is more to come? That is an **imperfect** cadence, which ends on V. Or does it seem to be going home and then **surprise** you? That is an **interrupted** cadence, which goes from V to vi.',
      ),
      p('These descriptions are often used, but they are aids and not rules. They help you decide between the four choices.'),
      h('Method: listening for a cadence'),
      steps(
        'Listen to the key chord. This is home.',
        'Listen to the last chord. Does it sound like home?',
        'If it does, decide between a strong arrival (perfect) and a gentle one (plagal).',
        'If it does not, decide between a stop (imperfect) and a surprise (interrupted).',
        'Choose, then read the explanation, which names the two chords as Roman numerals.',
      ),
      worked(earCadenceExample(C_MAJOR, 'perfect')),
      worked(earCadenceExample(parseKey('G major'), 'interrupted')),

      h('Inversions'),
      p('An inversion question plays a chord and asks which note is at the **bottom**. The key is to listen to the **lowest note**, the bass. In **root position** the lowest note is the root of the chord. In **first inversion** it is the 3rd, and in **second inversion** it is the 5th. 7th chords have one more: **third inversion**, with the 7th at the bottom.'),
      p('Here is C major in its three positions.'),
      listenBlock('Hear root position (C E G)', chordAudio(triadPositions[0]!, 'block')),
      listenBlock('Hear first inversion (E G C)', chordAudio(triadPositions[1]!, 'block')),
      listenBlock('Hear second inversion (G C E)', chordAudio(triadPositions[2]!, 'block')),
      p('And G7, which has four.'),
      ...seventhPositions.map((pitches, i) => listenBlock(`Hear G7 in ${['root position', 'first inversion', 'second inversion', 'third inversion'][i]}`, chordAudio(pitches, 'block'))),
      p('A helpful aid for **major and minor triads** is to listen for where the **wider gap** is. In root position the notes are evenly spaced in thirds. In first inversion the wider gap, a perfect 4th, is at the top. In second inversion it is at the bottom. (This works for major and minor triads, but not for diminished or augmented triads.)'),
      h('Method: listening for an inversion'),
      steps(
        'Play the chord. Listen only to the **lowest note**.',
        'Hum the lowest note. Ask: does it sound like the note the chord is "named after", the home note of the chord? If so, it is probably root position.',
        'If not, listen for the wide gap: at the top suggests first inversion, at the bottom suggests second inversion.',
        'For a 7th chord, remember there is one more position, third inversion, with the 7th at the bottom.',
        'Choose, then read the explanation: it tells you which note was lowest, and what it was in the chord.',
      ),
      worked(earInversionExample(cMajor, 1)),
      worked(earInversionExample(chord('A', 'minor'), 2)),

      h('Common mistakes'),
      watch('**Trusting the mood words too much.** "Bright" and "dark" are common descriptions, not rules. Use them as a first guide, then compare two chords on the same root: the difference is what matters.'),
      watch('**Judging by high or low.** The same chord can be played higher or lower, so a high sound is not a clue to the type. Listen for the **character**, not the pitch.'),
      watch('**Mixing up perfect and plagal.** Both end on home. The perfect cadence has the strong pull of V into I; the plagal cadence moves gently from IV to I.'),
      watch('**Listening to the top note in an inversion question.** The top note is often the tune and does not tell you the inversion. Listen to the **lowest** note.'),
      watch('**Giving up after one play.** You can replay as often as you like. Listen for a different thing each time.'),

      h('Try it'),
      p('Practice has listening questions for all four skills. Start with Easy, and replay each sound until you are sure.'),
      practise({ label: 'Practise ear training (easy)', topics: ['ear'], level: 1, clefs: ['treble'] }),
      practise({ label: 'Practise ear training (medium)', topics: ['ear'], level: 2, clefs: ['treble'] }),
    ]
  },
}

export const CHORDS_EAR_LESSONS: LibraryLesson[] = [TRIADS_LESSON, SEVENTH_LESSON, INVERSIONS_LESSON, ROMAN_LESSON, CADENCES_LESSON, VOCABULARY_LESSON, EAR_LESSON]
