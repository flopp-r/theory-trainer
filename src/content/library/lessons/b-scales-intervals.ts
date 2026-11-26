import {
  type ScaleType,
  circleOfFifths,
  dominantKey,
  intervalBetween,
  intervalName,
  intervalSemitones,
  invertInterval,
  isStandardKey,
  key,
  keyFifths,
  keyFromFifths,
  note,
  parallelKey,
  parseInterval,
  parseNote,
  parsePitch,
  scaleDegreeName,
  scaleNotes,
  scalePitches,
  subdominantKey,
} from '../../../theory'
import { keyLabel, noteLabel, notesLabel } from '../../../questions/pitchTools'
import { chordAudioBlock, melodyAudio } from '../builders/audio'
import { chordsOnStaff, emptyStaff, h, list, listenBlock, notesOnStaff, p, practise, remember, staffBlock, steps, table, tip, watch, worked } from '../builders/common'
import { intervalNameExample, buildIntervalExample, intervalTableRows, invertIntervalExample } from '../builders/intervals'
import { countWords, keyFromSignatureExample, keySignatureTableRows, relativeMajorOf, signatureFromKeyExample } from '../builders/keySignatures'
import { minorScaleExample } from '../builders/minorScales'
import { pentatonicExample } from '../builders/pentatonic'
import { relativeKeyExample } from '../builders/relatedKeys'
import { scaleDegreeExample } from '../builders/scaleDegrees'
import type { LibraryLesson } from '../types'

const pit = parsePitch
const staffOfScale = (tonic: string, type: ScaleType) => notesOnStaff('treble', scalePitches(pit(tonic), type))
const listenScale = (label: string, tonic: string, type: ScaleType, descending = false) =>
  listenBlock(label, melodyAudio(scalePitches(pit(tonic), type, { descending })))
const scaleLine = (tonic: string, type: ScaleType) => notesLabel(scaleNotes(parseNote(tonic), type))

// ---------------------------------------------------------------------------------------------------------------------
// 1. Minor scales
// ---------------------------------------------------------------------------------------------------------------------

const minorRelativeRows = ['A', 'E', 'D', 'C'].map((t) => {
  const tonic = parseNote(t)
  return [`${noteLabel(tonic)} minor`, `${noteLabel(relativeMajorOf(tonic))} major`, scaleLine(t, 'natural-minor')]
})

const MINOR_SCALES: LibraryLesson = {
  id: 'minor-scales',
  title: 'Minor scales: natural, harmonic and melodic',
  group: 'scales-keys',
  summary: 'The three kinds of minor scale, two ways to build the natural minor, and how a minor key is linked to a major key.',
  before: ['major-scales'],
  covers: ['scale-spelling'],
  build: () => [
    p('A **minor scale** is the second great family of scales, after the major scale. Many people hear minor as darker or sadder than major. It is still a set of seven notes in order, going up from a **key note** (the note the scale is named after, also called the **tonic**).'),
    p('The twist is that minor comes in **three forms**: **natural**, **harmonic** and **melodic**. They share most of their notes and differ in only one or two. This lesson shows you exactly which ones, and why.'),

    h('What you need to know first'),
    p('Three small things from the Major scales lesson:'),
    list(
      'A **semitone** is the smallest step: from one piano key to the very next, black or white. A **tone** is two semitones. E to F and B to C are only a semitone apart. Every other pair of neighbouring letter names is a tone apart.',
      'A **sharp** (♯) raises a note by a semitone. A **flat** (♭) lowers it by a semitone. A **double sharp** (written ♯♯) raises a plain note by two semitones.',
      'A seven-note scale uses **every letter name once**, in order, and then comes back to the key note. A scale that starts on A uses the letters A B C D E F G.',
    ),
    p('The major scale goes tone, tone, semitone, tone, tone, tone, semitone. Keep that pattern in mind, because the minor scales are built by changing it a little.'),

    h('The facts: three forms of minor'),
    table(
      ['Form', 'How to get it', 'Steps between the notes'],
      [
        ['Natural minor', 'The basic pattern', 'tone, semitone, tone, tone, semitone, tone, tone'],
        ['Harmonic minor', 'Natural minor with the **7th note raised** by a semitone', 'tone, semitone, tone, tone, semitone, **one and a half tones**, semitone'],
        ['Melodic minor', '**Going up:** natural minor with the **6th and 7th notes raised** by a semitone. **Coming down:** the natural minor again.', 'Going up: tone, semitone, tone, tone, tone, tone, semitone'],
      ],
      'The three forms of the minor scale.',
    ),
    remember('**Natural minor:** tone, semitone, tone, tone, semitone, tone, tone. **Harmonic minor:** raise the 7th. **Melodic minor:** raise the 6th and 7th going up, and use the natural minor coming down.'),
    p('A memory aid: **H**armonic has **H**igh 7th (one raised note). **M**elodic has **M**ore raised notes (two: the 6th and 7th), and only on the way up.'),
    p('Here are all three forms on A, with the sound. A natural minor uses only the plain notes A B C D E F G, so the pictures show exactly where the raised notes come in.'),
    staffBlock(staffOfScale('A4', 'natural-minor'), 'A natural minor: A B C D E F G A.'),
    listenScale('Hear A natural minor', 'A4', 'natural-minor'),
    staffBlock(staffOfScale('A4', 'harmonic-minor'), `A harmonic minor: ${scaleLine('A', 'harmonic-minor')} A. Only the 7th (G) is raised, so it becomes G♯.`),
    listenScale('Hear A harmonic minor', 'A4', 'harmonic-minor'),
    staffBlock(staffOfScale('A4', 'melodic-minor'), `A melodic minor going up: ${scaleLine('A', 'melodic-minor')} A. The 6th and 7th (F and G) are raised.`),
    listenScale('Hear A melodic minor going up', 'A4', 'melodic-minor'),
    staffBlock(notesOnStaff('treble', scalePitches(pit('A4'), 'melodic-minor', { descending: true })), 'A melodic minor coming down: A G F E D C B A. Nothing is raised: it is the natural minor.'),
    listenScale('Hear A melodic minor coming down', 'A4', 'melodic-minor', true),

    h('Why are there three forms?'),
    p('In the natural minor scale the 7th note is a **tone** below the key note. Many people feel that a note a **semitone** below the key note "leads" up to it very strongly, which is why such a note is called a **leading note**. The natural minor has no leading note.'),
    p('So **harmonic minor** raises the 7th by a semitone to make one. The name comes from harmony, because that raised 7th is the note used in the chords (groups of notes played together) of a minor key. But now there is a big gap, **three semitones** (one and a half tones), between the 6th note and the raised 7th. That gap is hard to sing and sounds awkward in a tune. (Its interval name is an *augmented 2nd*: the Intervals lesson explains names like that.)'),
    p('**Melodic minor** fixes the gap for tunes going **up**: it raises the 6th as well, so the 6th and 7th are each a tone above the note before. Coming **down**, the 7th does not need to lead anywhere, so the melody goes back to the plain natural minor notes.'),

    h('The relative major'),
    p('Every minor key has a **relative major**: a major scale that uses the same seven notes as the natural minor. Its key note is **3 semitones above** the minor key note (and 3 letter names above, counting both). A natural minor and its relative major also share a **key signature**, the sharps and flats written at the start of a piece. The Key signatures lesson covers that; for now, you just need to know that the notes are the same.'),
    table(['Minor key', 'Relative major', 'Notes of the natural minor'], minorRelativeRows, 'Four minor keys and their relative majors. The seven notes are the same; only the starting note differs.'),
    p('The raised notes of harmonic and melodic minor are **not** part of the key signature. Composers write them as separate sharps or naturals next to the notes when they are needed.'),

    h('The method'),
    p('**Natural minor, method 1: use the pattern.** This always works.'),
    steps(
      'Write the **key note** as note 1.',
      'Write the **letter names** in order for eight notes, starting on that letter, ending on the key note again. For D: D E F G A B C D.',
      'Write the natural minor pattern over the gaps: **tone, semitone, tone, tone, semitone, tone, tone**.',
      'Go one note at a time. For each next letter, count the semitones from the note before to the plain letter. If the pattern wants a different distance, add a **sharp** (step needs to be bigger) or a **flat** (step needs to be smaller).',
      'Check that the last step lands back on the key note, with a tone.',
    ),
    p('**Natural minor, method 2: lower the major scale.** Quick when you already know the major scale.'),
    steps(
      'Write the **major scale that starts on the same key note**. (For E minor, use E major, **not** the relative major.)',
      'Number the notes 1 to 7.',
      'Lower the **3rd, 6th and 7th** notes by a semitone. A sharp becomes plain; a plain note gets a flat; a flat becomes a double flat.',
      'Leave notes 1, 2, 4 and 5 alone.',
      'Check the gaps against the pattern.',
    ),
    p('**Harmonic minor.**'),
    steps(
      'Write the **natural minor** scale.',
      'Find the **7th note** and raise it by a semitone. A flat becomes plain; a plain note gets a sharp; a sharp becomes a **double sharp**.',
      'Check: the gap from the 6th to the 7th is **3 semitones**, and the gap from the 7th up to the key note is 1 semitone.',
    ),
    p('**Melodic minor.**'),
    steps(
      'Write the **natural minor** scale.',
      '**Going up:** raise the **6th and 7th** notes by a semitone.',
      '**Coming down:** play the natural minor scale backwards. Nothing is raised.',
    ),

    h('Worked examples'),
    p('Each example shows every decision. Follow one all the way through, then try the next on your own before reading it. First the natural minor: one by the pattern, one by lowering the major scale, and one in a flat key.'),
    worked(minorScaleExample(note('A'), 'natural')),
    worked(minorScaleExample(note('E'), 'natural', { method: 'from-major' })),
    worked(minorScaleExample(note('F'), 'natural')),
    p('Now the harmonic minor. The first is an easy one. The second is the tricky case: the raised 7th needs a **double sharp**.'),
    worked(minorScaleExample(note('D'), 'harmonic')),
    worked(minorScaleExample(note('G', 1), 'harmonic')),
    tip('A double sharp looks odd but it is not a mistake. G♯ harmonic minor needs a note that sounds like G but must be *written* as an F, because the scale uses every letter once and the 7th note is the F. That is why its name is F♯♯ and not G.'),
    p('Finally the melodic minor, up and down.'),
    worked(minorScaleExample(note('C'), 'melodic')),

    h('Common mistakes'),
    watch('**Raising the wrong notes.** Harmonic minor raises **only the 7th**. Melodic minor raises the **6th and 7th**, and **only going up**. If you raise the 6th and 7th for a harmonic minor, you have written the ascending melodic minor.'),
    watch('**Forgetting to go back to natural minor coming down.** The descending melodic minor has no raised notes at all: A melodic minor coming down is A G F E D C B A.'),
    watch('**Writing F♯♯ as G.** G♯ harmonic minor has the letters G A B C D E F. If you write the 7th as a G, you have two Gs and no F. A scale uses each letter once, so the 7th must be an F with two sharps.'),
    watch('**Starting from the wrong major scale.** Method 2 starts from the major scale on the **same key note** (E major for E minor). The *relative* major (G major for E minor) already has the same notes as natural minor, so lowering its 3rd, 6th and 7th would give the wrong answer.'),
    watch('**Lowering the wrong notes.** Natural minor is the major scale with the **3rd, 6th and 7th** lowered. The 2nd, 4th and 5th stay the same.'),

    h('Try it'),
    p('Practice asks you to pick the right notes for a scale. The natural minor appears at the medium level, and all three forms appear at the hard level.'),
    practise({ label: 'Practise natural minor and other scales (medium)', topics: ['scales'], level: 2 }),
    practise({ label: 'Practise all three minor scales (hard)', topics: ['scales'], level: 3 }),
    list('Next lessons: **Pentatonic and blues scales**, then **Key signatures**.'),
  ],
}

// ---------------------------------------------------------------------------------------------------------------------
// 2. Pentatonic and blues
// ---------------------------------------------------------------------------------------------------------------------

const PENTATONIC_BLUES: LibraryLesson = {
  id: 'pentatonic-blues',
  title: 'Pentatonic and blues scales',
  group: 'scales-keys',
  summary: 'Five-note and six-note scales, picked out of the major and minor scales, with the blue note spelled correctly.',
  before: ['minor-scales'],
  covers: ['scale-spelling'],
  build: () => [
    p('A **pentatonic scale** is a scale of **five** notes ("penta" means five). You make one by taking a seven-note scale and leaving two notes out. Pentatonic scales turn up in folk music, rock and blues.'),
    p('There are two main ones: the **major pentatonic** and the **minor pentatonic**. The **blues scale** in this app is the minor pentatonic with one extra note, called the **blue note**, so it has six notes.'),

    h('What you need to know first'),
    list(
      'The notes of a scale are numbered from the **key note** (the note the scale is named after): **1, 2, 3 ...** The "3rd note" is the third one up.',
      'The **major scale** goes tone, tone, semitone, tone, tone, tone, semitone (see Major scales). The **natural minor scale** goes tone, semitone, tone, tone, semitone, tone, tone (see Minor scales).',
      'A **tone** is two semitones, and a **semitone** is the step from one piano key to the very next.',
      'A **♭3** (say "flat three") is a shorthand: it means "the 3rd note of the *major* scale, lowered by a semitone". ♭5 and ♭7 mean the same for the 5th and 7th notes.',
    ),

    h('The facts'),
    table(
      ['Scale', 'Which notes', 'Taken from', 'Left out'],
      [
        ['Major pentatonic', '1 2 3 5 6', 'the major scale', 'the 4th and 7th'],
        ['Minor pentatonic', '1 ♭3 4 5 ♭7 (these are the 1st, 3rd, 4th, 5th and 7th notes of the natural minor scale)', 'the natural minor scale', 'the 2nd and 6th'],
        ['Blues', '1 ♭3 4 ♭5 5 ♭7 (six notes)', 'the minor pentatonic plus the flattened 5th between the 4th and 5th notes', 'the 2nd and 6th of the natural minor (the ♭5 is added)'],
      ],
      'The three scales.',
    ),
    p('Here they are on the key note **C**:'),
    table(
      ['Scale on C', 'Notes'],
      [
        ['C major', scaleLine('C', 'major')],
        ['C major pentatonic', scaleLine('C', 'major-pentatonic')],
        ['C natural minor', scaleLine('C', 'natural-minor')],
        ['C minor pentatonic', scaleLine('C', 'minor-pentatonic')],
        ['C blues', scaleLine('C', 'blues')],
      ],
      'Each pentatonic scale is the seven-note scale above it with notes left out.',
    ),
    staffBlock(staffOfScale('C4', 'major-pentatonic'), 'C major pentatonic: C D E G A C.'),
    listenScale('Hear C major pentatonic', 'C4', 'major-pentatonic'),
    staffBlock(staffOfScale('C4', 'minor-pentatonic'), 'C minor pentatonic: C E♭ F G B♭ C.'),
    listenScale('Hear C minor pentatonic', 'C4', 'minor-pentatonic'),
    staffBlock(staffOfScale('C4', 'blues'), 'C blues: C E♭ F G♭ G B♭ C. The blue note is the G♭.'),
    listenScale('Hear C blues', 'C4', 'blues'),
    remember('Major pentatonic = notes **1 2 3 5 6** of the major scale. Minor pentatonic = notes **1 3 4 5 7** of the natural minor scale. Blues = minor pentatonic plus the **flattened 5th** between the 4th and 5th notes.'),
    p(`Look at the step sizes: ${scaleLine('C', 'major-pentatonic')} C goes tone, tone, one and a half tones, tone, one and a half tones. Neither pentatonic scale has a semitone step. That is because the two notes left out are exactly the ones that sit next to the semitone steps of the parent scale.`),
    tip(`The **relative** idea works here too: C major pentatonic (${scaleLine('C', 'major-pentatonic')}) and A minor pentatonic (${scaleLine('A', 'minor-pentatonic')}) use exactly the same five notes. A is the 6th note of C major.`),

    h('Spelling the blue note'),
    p('The blue note is the **flattened 5th**: take the 5th note and lower it by a semitone. In C that gives **G♭**.'),
    p('On a piano, G♭ is the same key as F♯. So why not write F♯? Because spelling follows the letter. The 5th note of C is a **G** (count C, D, E, F, G), so lowering it gives a G-something: G♭. An F♯ would be a *sharpened 4th*, a different job in the scale. In this app the blues scale is spelled with the flattened 5th, so the blues scale on C is **C E♭ F G♭ G B♭**.'),
    p('Notice that the letter G now appears twice (G♭ and G). That is normal for the blues scale, and it is different from the seven-note scales, where every letter appears once.'),

    h('The method'),
    steps(
      'Write the **key note**.',
      'Write the seven-note parent scale on it. For **major pentatonic**, use the **major** scale (tone, tone, semitone, tone, tone, tone, semitone). For **minor pentatonic** and **blues**, use the **natural minor** scale (tone, semitone, tone, tone, semitone, tone, tone).',
      'Number the notes 1 to 7.',
      'Keep the right numbers. **Major pentatonic: 1 2 3 5 6.** **Minor pentatonic or blues: 1 3 4 5 7.**',
      '**Blues only:** find the 5th note, lower it by a semitone (it keeps its letter) and put it between the 4th and 5th notes.',
      'Write the notes in order and finish on the key note. Check the count: five notes (six for blues), and for the pentatonic scales no step smaller than a tone.',
    ),

    h('Worked examples'),
    p('Start with the easiest: C major pentatonic, where every note is a plain letter.'),
    worked(pentatonicExample(note('C'), 'major-pentatonic')),
    p('Now a minor pentatonic, and two major pentatonics that need sharps and flats.'),
    worked(pentatonicExample(note('A'), 'minor-pentatonic')),
    worked(pentatonicExample(note('B', -1), 'major-pentatonic')),
    worked(pentatonicExample(note('F', 1), 'major-pentatonic')),
    tip('F♯ major has seven notes: F♯ G♯ A♯ B C♯ D♯ E♯. The pentatonic leaves out the 4th (B) and the 7th (E♯), so the awkward E♯ never appears: F♯ G♯ A♯ C♯ D♯.'),
    p('And two blues scales. The first one shows why the spelling of the blue note matters.'),
    worked(pentatonicExample(note('C'), 'blues')),
    worked(pentatonicExample(note('E'), 'blues')),

    h('Common mistakes'),
    watch('**Spelling the blue note as F♯ in C blues.** The blue note is a flattened **5th**, so it takes the 5th note\'s letter: G♭. A question about C blues expects C E♭ F G♭ G B♭.'),
    watch('**Taking notes 1 3 4 5 7 from the major scale.** The minor pentatonic comes from the **natural minor** scale. The 3rd and 7th of C *major* are E and B; the minor pentatonic needs E♭ and B♭.'),
    watch('**Forgetting the blue note is extra.** The blues scale is the minor pentatonic *plus* one note, so it has six different notes, not five. And the blue note goes between the 4th and 5th notes, not at the end.'),
    watch('**Counting the top key note.** When you write C major pentatonic as C D E G A C, the last C is the key note again, one octave up. The scale itself has five different notes.'),

    h('Try it'),
    p('Pentatonic scales appear at the medium level in Practice, and the blues scale at the hard level.'),
    practise({ label: 'Practise pentatonic scales (medium)', topics: ['scales'], level: 2 }),
    practise({ label: 'Practise blues and other scales (hard)', topics: ['scales'], level: 3 }),
  ],
}

// ---------------------------------------------------------------------------------------------------------------------
// 3. Key signatures
// ---------------------------------------------------------------------------------------------------------------------

const D_MAJOR = key('D', 'major')
const D_SCALE = scalePitches(pit('D4'), 'major')
const SEVEN_SHARPS = key('C#', 'major')
const SEVEN_FLATS = key('Cb', 'major')

/** "C major (none) → G major (1) → ..." from the engine, so the circle in the text is the engine's circle. */
function circleLine(direction: 'sharps' | 'flats'): string {
  const parts: string[] = [`${keyLabel(key('C', 'major'))} (none)`]
  let current = key('C', 'major')
  for (let i = 1; i <= 7; i++) {
    current = direction === 'sharps' ? dominantKey(current) : subdominantKey(current)
    parts.push(`${keyLabel(current)} (${i})`)
  }
  return parts.join(' → ')
}

const KEY_SIGNATURES: LibraryLesson = {
  id: 'key-signatures',
  title: 'Key signatures',
  group: 'scales-keys',
  summary: 'What a key signature is, how to read one to find the key, and how to write the signature for any key.',
  before: ['minor-scales'],
  covers: ['key-from-signature', 'signature-from-key'],
  build: () => [
    p('A **key signature** is a group of sharps or flats written at the start of every line of music, straight after the clef. It means: "every note with this letter name is sharp (or flat) all the way through, unless a sign says otherwise."'),
    p('Why do we need it? Most pieces stay in one **key** (a key is a home note plus the scale built on it: "D major" means home note D, major scale). The scale of D major has two sharps, F♯ and C♯. Instead of printing a ♯ in front of every F and every C, we print the two sharps **once**, at the start. It saves a lot of clutter. Compare these:'),
    staffBlock(notesOnStaff('treble', D_SCALE), 'The D major scale with no key signature: every F♯ and C♯ needs its own sign.'),
    staffBlock(notesOnStaff('treble', D_SCALE, D_MAJOR), 'The same scale with the key signature of D major (two sharps) at the start: the notes need no signs.'),

    h('What you need to know first'),
    list(
      'A **sharp** (♯) raises a note by a semitone and a **flat** (♭) lowers it by a semitone. A **semitone** is the step from one piano key to the very next.',
      'The **major scale** goes tone, tone, semitone, tone, tone, tone, semitone. Building major scales is in the Major scales lesson.',
      'Each major key has a **relative minor**: the minor key with the same notes, which starts on the 6th note of the major scale, 3 semitones below. For example C major and A minor. The Minor scales lesson explains this.',
      'A key signature applies in **every octave**: a F♯ in the signature makes every F on the staff a F♯, high or low.',
    ),

    h('The facts'),
    h('1. The order of the sharps and flats'),
    p('Sharps and flats are always added to a key signature in the same fixed order. So if a key has three sharps, they are always F♯, C♯ and G♯, never any other three.'),
    table(
      ['Kind', 'Order'],
      [
        ['Sharps', 'F  C  G  D  A  E  B'],
        ['Flats', 'B  E  A  D  G  C  F (the sharps backwards)'],
      ],
      'The order of sharps and flats.',
    ),
    p('A memory aid for the sharps: **F**ather **C**harles **G**oes **D**own **A**nd **E**nds **B**attle. For the flats, say it backwards: **B**attle **E**nds **A**nd **D**own **G**oes **C**harles\'s **F**ather. Another aid for the flats: they spell **BEAD** and then **GCF**.'),
    p('This means you only ever need to know **how many** sharps or flats a key has. The order tells you which ones.'),

    h('2. Where the signs sit'),
    p('Each sharp or flat is drawn on its own line or space, in a zigzag pattern that keeps the signs on the staff. The pattern is different in each clef. You do **not** need to learn where they go in order to read a key signature: you only have to **count** them. The app draws them for you. Here are the biggest signatures, seven sharps (C♯ major) and seven flats (C♭ major):'),
    staffBlock(emptyStaff('treble', SEVEN_SHARPS), 'Seven sharps in the treble clef: F♯ C♯ G♯ D♯ A♯ E♯ B♯.'),
    staffBlock(emptyStaff('bass', SEVEN_SHARPS), 'Seven sharps in the bass clef. The same seven sharps, drawn in a different pattern.'),
    staffBlock(emptyStaff('treble', SEVEN_FLATS), 'Seven flats in the treble clef: B♭ E♭ A♭ D♭ G♭ C♭ F♭.'),
    staffBlock(emptyStaff('bass', SEVEN_FLATS), 'Seven flats in the bass clef.'),

    h('3. All the keys at a glance'),
    p('Every key signature belongs to **two** keys: a major key and its relative minor. This table lists all 15 key signatures from seven flats to seven sharps. These 30 keys, with up to seven sharps or flats, are the standard ones.'),
    table(['Number of signs', 'Major key', 'Relative minor', 'The signs'], keySignatureTableRows(), 'All 15 key signatures. Going down the table, each row has one more sharp (or one fewer flat) than the row above.'),
    p(`Look at the order of the major keys, going down the table: ${circleOfFifths().map((e) => noteLabel(e.major.tonic)).join(', ')}. Each step down is a **perfect 5th** higher (a perfect 5th is 7 semitones: C up to G is one). Each step down adds **one sharp** (or takes away one flat). This is called the **circle of fifths**, because if you draw the keys round a clock face with C at the top, the sharp keys go clockwise and the flat keys go anticlockwise.`),

    h('4. Reading a key signature: which key is it?'),
    remember('**Sharps:** the major key is a **semitone above the last sharp**. **Flats:** the major key is the **second-to-last flat**. **One flat:** F major (learn this one). **No signs:** C major. For the **minor** key, go **3 semitones below** the major key.'),
    list(
      '**Sharps.** The last sharp is the **7th note** of the major scale, so the key note is a semitone above it. Example: the last sharp is C♯, a semitone above is D, so the key is D major.',
      '**Flats.** Each flat in the order is a perfect 4th (5 semitones) above the one before, so the flat before the last one is a 4th below it, and the last flat is the 4th note of the key. That makes the key note the **second-to-last flat**. Example: the flats are B♭ and E♭; the second-to-last is B♭, so the key is B♭ major.',
      '**One flat.** There is no second-to-last flat, so this has to be learned: B♭ means **F major**.',
      '**No signs.** C major.',
      '**Minor key.** The relative minor starts **3 semitones below** the major key note (count 3 letter names down, counting both). Example: D major has the relative minor B minor (D, C, B).',
    ),
    tip('**One signature, two keys.** The same signature belongs to a major key *and* its relative minor. Two sharps is D major **and** B minor. So the question always says which one it wants: look for the word "major" or "minor".'),

    h('5. Writing a key signature: which signs?'),
    p('Writing a signature is the same idea backwards. First, **how many** signs, then the order tells you **which**.'),
    list(
      '**Minor keys:** find the relative **major** first (3 semitones above). The signature is the same.',
      '**Sharp keys** are the major keys **G, D, A, E, B, F♯ and C♯**. **Flat keys** are the major keys **F, B♭, E♭, A♭, D♭, G♭ and C♭**. C major has no signs.',
      '**Sharp key:** the last sharp is a **semitone below** the key note. Find that letter in F C G D A E B. How many places along it is, is the number of sharps. Example: D major, the last sharp is C♯, and C is 2nd in F C G D A E B, so **2 sharps**.',
      '**Flat key:** find the key note\'s letter in B E A D G C F. The last flat is the **next one along**. Example: A♭ major, A is 3rd in B E A D G C F, the next is D (4th), so **4 flats**. F major is the exception: it has **1 flat** (B♭).',
    ),
    p('The **circle of fifths** gives a way to check. Start on C major, which has no signs. Each key a perfect 5th **higher** adds one sharp:'),
    p(circleLine('sharps')),
    p('Each key a perfect 5th **lower** adds one flat:'),
    p(circleLine('flats')),
    p('The number in brackets is the number of sharps or flats.'),

    h('The method'),
    p('**To read a key signature:**'),
    steps(
      'Look at the picture and **count** the signs. All sharps or all flats, never a mixture.',
      'Name them in order. Sharps: F♯, C♯, G♯ ... Flats: B♭, E♭, A♭ ... Use the first as many as you counted.',
      '**Sharps:** go a **semitone up** from the last sharp (use the next letter name). **Flats:** take the **second-to-last** flat. One flat: F. None: C.',
      'You now have the **major** key. If the question asks for the **minor** key, go **3 semitones down** (3 letter names down, counting both).',
      'Check: write the scale of your answer. The sharps or flats in the scale should be the signs you counted.',
    ),
    p('**To write a key signature:**'),
    steps(
      'If the key is minor, find its relative **major** (3 semitones up).',
      'Decide: sharp key or flat key (use the lists above).',
      'Find the **number** of signs. Sharp key: the last sharp is a semitone below the key note, and its place in F C G D A E B is the number. Flat key: the key note\'s place in B E A D G C F, plus one. F major: 1 flat. C major: none.',
      'Write that many signs in the usual order.',
      'Check by counting round the circle of fifths from C.',
    ),

    h('Worked examples: reading signatures'),
    p('Each example starts with a picture of a signature. Follow the working with the picture in front of you.'),
    worked(keyFromSignatureExample(key('D', 'major'), 'treble')),
    worked(keyFromSignatureExample(key('Eb', 'major'), 'bass')),
    worked(keyFromSignatureExample(key('F', 'major'), 'treble')),
    p('Now minor keys. Alto clef is the clef violas read, and the C-clef shape looks different, but the method is exactly the same: count the signs.'),
    worked(keyFromSignatureExample(key('F#', 'minor'), 'alto')),
    worked(keyFromSignatureExample(key('Bb', 'minor'), 'treble')),

    h('Worked examples: writing signatures'),
    worked(signatureFromKeyExample(key('D', 'major'))),
    worked(signatureFromKeyExample(key('Ab', 'major'))),
    worked(signatureFromKeyExample(key('F', 'major'))),
    worked(signatureFromKeyExample(key('F#', 'minor'))),

    h('Common mistakes'),
    watch('**Choosing between major and minor by guessing.** The signature cannot tell you. The same signature is a major key *and* a minor key. Look at the question: it says which one.'),
    watch('**Using the last flat instead of the second-to-last.** With flats B♭ E♭ A♭, the key is **E♭**, the second-to-last, not A♭. (With sharps, you go a semitone up from the **last** sharp; with flats you name the **second-to-last**.)'),
    watch('**Writing the signs in the wrong order.** Three sharps are F♯, C♯, G♯. They are not "any three sharps". Learn the order F C G D A E B.'),
    watch('**Going up from the last sharp by a tone.** It is a **semitone** above the last sharp. A tone above C♯ would be D♯, which is wrong for D major.'),
    watch('**Forgetting the minor key is 3 semitones below, not above.** B minor is 3 semitones below D, not above.'),
    watch('**Adding the raised 7th of harmonic minor to the signature.** The signature of A minor is empty, even though A harmonic minor contains G♯. Raised notes are written next to the notes, not in the signature.'),

    h('Try it'),
    p('Start at the easy level (up to two sharps or flats), then move up.'),
    practise({ label: 'Practise key signatures (easy)', topics: ['keys'], level: 1 }),
    practise({ label: 'Practise key signatures (medium)', topics: ['keys'], level: 2 }),
    list('Next lesson: **Relative and parallel keys**.'),
  ],
}

// ---------------------------------------------------------------------------------------------------------------------
// 4. Related keys
// ---------------------------------------------------------------------------------------------------------------------

/** Major keys whose parallel minor is one of the 30 standard keys, and those where it is not. */
const PARALLEL_ROWS: string[][] = []
const NO_PARALLEL: string[] = []
for (let f = -7; f <= 7; f++) {
  const major = keyFromFifths(f, 'major')
  const minor = parallelKey(major)
  if (isStandardKey(minor)) PARALLEL_ROWS.push([keyLabel(major), keyLabel(minor), countWords(f), countWords(keyFifths(minor))])
  else NO_PARALLEL.push(keyLabel(major))
}
const joinOr = (items: readonly string[]): string => (items.length < 2 ? (items[0] ?? '') : `${items.slice(0, -1).join(', ')} or ${items.at(-1)}`)
const NO_PARALLEL_MINOR: string[] = []
for (let f = -7; f <= 7; f++) {
  const minor = keyFromFifths(f, 'minor')
  if (!isStandardKey(parallelKey(minor))) NO_PARALLEL_MINOR.push(keyLabel(minor))
}

const RELATED_KEYS: LibraryLesson = {
  id: 'related-keys',
  title: 'Relative and parallel keys',
  group: 'scales-keys',
  summary: 'Relative keys share a key signature, parallel keys share a key note, and closely related keys are neighbours on the circle of fifths.',
  before: ['key-signatures'],
  covers: ['relative-key'],
  build: () => [
    p('Keys are related to each other in different ways. This lesson covers three kinds of relationship, and they are easy to mix up, so we take them one at a time: **relative keys**, **parallel keys** and **closely related keys**.'),

    h('What you need to know first'),
    list(
      'A **key** is a home note (the **key note** or **tonic**) plus a scale. "G major" means home note G with the major scale; "E minor" means home note E with the minor scale.',
      'A **key signature** is the set of sharps or flats written at the start. G major has one sharp (F♯); C major has none. The Key signatures lesson shows how to find it.',
      'A **semitone** is the smallest step (one piano key to the very next). A **perfect 5th** is 5 letter names and **7 semitones**, for example C up to G. A **minor 3rd** is 3 letter names and **3 semitones**, for example A up to C.',
    ),

    h('The facts'),
    table(
      ['Relationship', 'What they share', 'What differs', 'Example'],
      [
        ['Relative keys', 'the **same key signature** (the same seven notes)', 'the key note (3 semitones apart)', 'C major and A minor'],
        ['Parallel keys', 'the **same key note**', 'the key signature', 'C major and C minor'],
        ['Closely related keys', 'signatures that differ by **at most one** sharp or flat', 'the key note', 'C major and G major'],
      ],
      'Three ways keys are related.',
    ),
    h('Relative keys'),
    remember('The **relative minor** of a major key is the **6th note** of its major scale. The **relative major** of a minor key is the **3rd note** of its natural minor scale. The two key notes are **3 semitones** apart, with the minor one lower.'),
    p('Example: the G major scale is G A B C D E F♯. The 6th note is E, so the relative minor of G major is **E minor**. Check: E minor\'s natural scale is E F♯ G A B C D, the same seven notes, and both keys have one sharp. Going down from G by 3 semitones (G, F, E: 3 letter names) lands on E too.'),
    p('Because relative keys share the same notes, they share the same key signature. That is why one signature belongs to two keys.'),

    h('Parallel keys'),
    p('**Parallel keys** have the **same key note** but are in different **modes** (one major, one minor): C major and C minor, A major and A minor. They start on the same note but use different notes, so their key signatures **differ**.'),
    p('Going from a major key to its parallel minor always moves the signature **3 places towards the flats**: three more flats, or three fewer sharps. For example, A major has 3 sharps and A minor has none.'),
    table(['Major key', 'Parallel minor', 'Major signature', 'Minor signature'], PARALLEL_ROWS, 'Parallel pairs where both keys exist in practice.'),
    watch(`**Some parallel keys do not exist in practice.** The parallel minor of ${joinOr([...NO_PARALLEL].reverse())} would need eight or more flats. The parallel major of ${joinOr(NO_PARALLEL_MINOR)} would need eight or more sharps. Keys like these are called theoretical keys, and the app does not ask about them.`),

    h('The circle of fifths and closely related keys'),
    p('List the keys from seven flats to seven sharps and each step down the list is a perfect 5th higher, with one more sharp (the same table as in the Key signatures lesson). Drawn round a clock face, with C major at the top, this is the **circle of fifths**.'),
    table(
      ['Number of signs', 'Major key', 'Relative minor'],
      keySignatureTableRows().map((row) => [row[0]!, row[1]!, row[2]!]),
      'The circle of fifths as a list. Neighbouring rows are closely related.',
    ),
    p('**Closely related keys** are keys whose signatures differ from yours by **at most one sharp or flat**. They share almost all their notes (all seven, or six of the seven), which is why pieces so often move from one of them to another. For any key there are **five**:'),
    list(
      'its **relative** key (the same signature),',
      'the key a perfect 5th **above** (one more sharp), in the same mode, and **its** relative,',
      'the key a perfect 5th **below** (one more flat), in the same mode, and **its** relative.',
    ),
    tip('Some pairs of keys sound the same but are written differently, for example F♯ major (6 sharps) and G♭ major (6 flats). They sit near each other at the bottom of the circle.'),

    h('The method'),
    p('**Relative key**'),
    steps(
      'Write the scale of the key you are given (major scale for a major key, natural minor for a minor key).',
      'Number the notes.',
      'Major key: the **6th note** is the key note of the relative minor. Minor key: the **3rd note** is the key note of the relative major.',
      'Check by distance: 3 letter names and 3 semitones away (down for the minor, up for the major).',
    ),
    p('**Parallel key**'),
    steps(
      'Keep the **same key note** and change the mode.',
      'Find the signature of each key (Key signatures lesson) and compare. Major to minor is 3 places towards the flats.',
    ),
    p('**Closely related keys**'),
    steps(
      'Find the relative key.',
      'Go up a perfect 5th (5 letter names, 7 semitones) from the key note for the sharp-side key, in the same mode. Add its relative.',
      'Go down a perfect 5th for the flat-side key, in the same mode. Add its relative.',
      'Check that each of the five differs from the start by no more than one sharp or flat.',
    ),

    h('Worked examples'),
    p('First the relative keys: one from major to minor, one from minor to major, and one in a flat key.'),
    worked(relativeKeyExample(key('G', 'major'), 'relative')),
    worked(relativeKeyExample(key('E', 'minor'), 'relative')),
    worked(relativeKeyExample(key('Eb', 'major'), 'relative')),
    p('Now parallel keys, where the signature changes. The example from major to minor, then one from minor to major.'),
    worked(relativeKeyExample(key('A', 'major'), 'parallel')),
    worked(relativeKeyExample(key('E', 'minor'), 'parallel')),
    p('And closely related keys: one with no signs and one in a flat key.'),
    worked(relativeKeyExample(key('C', 'major'), 'closely-related')),
    worked(relativeKeyExample(key('Eb', 'major'), 'closely-related')),

    h('Common mistakes'),
    watch('**Mixing up relative and parallel.** *Relative*: different key note, **same signature** (C major, A minor). *Parallel*: **same key note**, different signature (C major, C minor). If a question says "relative", the answer shares the signature.'),
    watch('**Counting the 6th note from the wrong place.** The relative minor is the 6th note of the **major** scale, counting the key note as 1. For G major that is G A B C D **E**.'),
    watch('**Going the wrong way.** The relative minor is 3 semitones **below** the major key note, and the relative major is 3 semitones **above** the minor key note. E minor to G major is up; G major to E minor is down.'),
    watch('**Forgetting the relative keys when listing closely related keys.** The five include the relatives of the two neighbours. For C major, the neighbours G and F come with E minor and D minor.'),
    watch('**Using a key that does not exist.** D♭ minor would have eight flats, so it is not used. If your working gives more than seven sharps or flats, check the question again.'),

    h('Try it'),
    p('Relative keys appear at every level. Parallel keys appear from the medium level.'),
    practise({ label: 'Practise relative and parallel keys (medium)', topics: ['keys'], level: 2 }),
    practise({ label: 'Practise key signatures and related keys (hard)', topics: ['keys'], level: 3 }),
  ],
}

// ---------------------------------------------------------------------------------------------------------------------
// 5. Scale degrees
// ---------------------------------------------------------------------------------------------------------------------

const degreeRows = [1, 2, 3, 4, 5, 6, 7].map((d) => [
  String(d),
  d === 7 ? 'leading note (major); subtonic (natural minor)' : scaleDegreeName('major', d),
  noteLabel(scaleNotes(parseNote('D'), 'major')[d - 1]!),
  noteLabel(scaleNotes(parseNote('A'), 'natural-minor')[d - 1]!),
])

const SCALE_DEGREES: LibraryLesson = {
  id: 'scale-degrees',
  title: 'Scale degrees: tonic, dominant and the rest',
  group: 'scales-keys',
  summary: 'The names of the seven notes of a scale, what each name means, and how to find the note for any degree.',
  before: ['major-scales'],
  covers: ['scale-degree'],
  build: () => [
    p('Every note of a scale has a number, from 1 to 7, and a traditional **name**. Musicians use both. The 5th note of a scale is also called the **dominant**; the first note is the **tonic**. These names are used in harmony and when analysing music, so it pays to know them well.'),
    p('A **scale degree** is the position of a note in the scale: the 1st degree, the 2nd degree and so on. The names tell you what job each note does.'),

    h('What you need to know first'),
    list(
      'A **scale** is a set of notes in order. The **major scale** goes tone, tone, semitone, tone, tone, tone, semitone. You can build any major scale with the Major scales lesson.',
      'The **natural minor scale** goes tone, semitone, tone, tone, semitone, tone, tone (Minor scales lesson). We need it for the subtonic.',
      'The **key note** is the first note of the scale, the note the scale is named after.',
      'A **semitone** is the step from one piano key to the very next. A **tone** is two semitones.',
      'A **perfect 5th** is the distance from one note up to the 5th letter name, 7 semitones, for example D up to A. A **3rd** is the distance up three letter names, for example C up to E.',
    ),

    h('The facts'),
    p('The names, in order, with an example in D major and in A natural minor:'),
    table(['Degree', 'Name', 'In D major', 'In A natural minor'], degreeRows, 'Degree names. Only the 7th has two names.'),
    remember('**1 tonic, 2 supertonic, 3 mediant, 4 subdominant, 5 dominant, 6 submediant, 7 leading note** (or **subtonic** in natural minor).'),
    p('A memory aid for the order: **T**en **S**mall **M**ice **S**at **D**own **S**inging **L**oudly. The first letters are T, S, M, S, D, S, L. Be careful: three of the names start with S, so also learn which is which: the 2nd is *super*, the 4th and 6th are *sub*.'),
    h('What the names mean'),
    p('The names are in pairs. Some are **above** the tonic and some **below** it:'),
    table(
      ['Above the key note', 'Below the key note', 'Why'],
      [
        ['**dominant** (5th): a perfect 5th above', '**subdominant** (4th): a perfect 5th below', 'The 4th note is a perfect 5th **below** the upper key note: a dominant counted downwards. "Sub" means under.'],
        ['**mediant** (3rd): a 3rd above', '**submediant** (6th): a 3rd below', 'The 6th note is a 3rd below the upper key note. "Mediant" comes from "middle" (halfway between tonic and dominant).'],
        ['**supertonic** (2nd): a step above', '**leading note** or **subtonic** (7th): a step below', '"Super" means above and "sub" means below the tonic.'],
      ],
      'The degree names in pairs.',
    ),
    h('The 7th degree has two names'),
    p('The 7th note of a major scale is a **semitone** below the key note, and it is called the **leading note**, because many people feel it "leads" up to the key note. The 7th note of the **natural minor** scale is a **tone** below the key note, and it is called the **subtonic**. In **harmonic minor** the 7th is raised by a semitone, so it is a leading note again.'),
    p('So the rule is about the gap: **semitone below the key note = leading note; tone below = subtonic.**'),

    h('The method'),
    p('**To find the note for a degree name** (for example, "the dominant of D major"):'),
    steps(
      'Turn the **name into a number** with the list: tonic 1, supertonic 2, mediant 3, subdominant 4, dominant 5, submediant 6, leading note or subtonic 7.',
      'Write the **scale** of the key. Major key: the major pattern. Minor key: the natural minor pattern.',
      '**Number** the notes 1 to 7.',
      'Pick the note with your number.',
      'Check: the 5th degree is a perfect 5th above the key note, for example.',
    ),
    p('**To name a degree** (for example, "what is the 4th note called?"):'),
    steps(
      'Look up the name for the number in the list.',
      'For the 7th, look at the gap to the key note: a semitone is a leading note, a tone is a subtonic.',
      'If you are asked for the note too, write the scale and pick the note.',
    ),

    h('Worked examples'),
    worked(scaleDegreeExample(key('D', 'major'), 5)),
    worked(scaleDegreeExample(key('Bb', 'major'), 6)),
    worked(scaleDegreeExample(key('G', 'major'), 4, 'name')),
    p('The 7th degree has two names. Here it is as a leading note (major) and as a subtonic (natural minor).'),
    worked(scaleDegreeExample(key('Eb', 'major'), 7)),
    worked(scaleDegreeExample(key('A', 'minor'), 7)),
    p('And a minor key, where the notes are different from the major scale on the same key note.'),
    worked(scaleDegreeExample(key('C', 'minor'), 3)),

    h('Common mistakes'),
    watch('**Counting the key note as 0.** The key note is degree **1**. The dominant is the 5th note counting the key note as 1: in D major, D E F♯ G **A**.'),
    watch('**Mixing up subdominant and submediant.** The **subdominant** is the 4th note. The **submediant** is the 6th note. Think: dominant = 5th, so the subdominant is the one next below it (4th).'),
    watch('**Using the major scale for a minor key.** The mediant of C minor is E♭, not E. For a minor key, write the natural minor scale first.'),
    watch('**Calling the 7th a leading note in natural minor.** In natural minor the 7th is a **tone** below the key note, so it is a **subtonic**. A leading note is a **semitone** below.'),
    watch('**Forgetting the sharps and flats of the key.** In D major the dominant is A, but the mediant is F♯, not F. Write the whole scale with its signs before you pick a note.'),

    h('Try it'),
    p('Degree questions come in two kinds: find the note for a name, and name the degree.'),
    practise({ label: 'Practise scale degrees (easy)', topics: ['scales'], level: 1 }),
    practise({ label: 'Practise scale degrees including minor keys (hard)', topics: ['scales'], level: 3 }),
  ],
}

// ---------------------------------------------------------------------------------------------------------------------
// 6. Intervals
// ---------------------------------------------------------------------------------------------------------------------

const intervalRowsFromC = (['D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5'] as const).map((upper) => {
  const { interval } = intervalBetween(pit('C4'), pit(upper))
  return [upper === 'C5' ? 'C to the next C up' : `C to ${upper.charAt(0)}`, String(interval.number), String(intervalSemitones(interval)), intervalName(interval)]
})
const intervalRowsFromD = (['E4', 'F4', 'G4', 'A4', 'B4', 'C5', 'D5'] as const).map((upper) => {
  const { interval } = intervalBetween(pit('D4'), pit(upper))
  return [upper === 'D5' ? 'D to the next D up' : `D to ${upper.charAt(0)}`, String(interval.number), String(intervalSemitones(interval)), intervalName(interval)]
})

const INVERSION_ROWS = ['m2', 'M2', 'm3', 'M3', 'P4', 'A4'].map((short) => {
  const i = parseInterval(short)
  const inverted = invertInterval(i)
  return [`${intervalName(i)} (${intervalSemitones(i)})`, `${intervalName(inverted)} (${intervalSemitones(inverted)})`]
})

const INTERVALS: LibraryLesson = {
  id: 'intervals',
  title: 'Intervals: the distance between two notes',
  group: 'intervals',
  summary: 'How to name the distance between two notes and how to build a note a given interval above or below another.',
  before: ['accidentals', 'major-scales'],
  covers: ['interval-on-staff', 'interval-above'],
  build: () => [
    p('An **interval** is the distance between two notes. Every interval has a **number** (a 2nd, a 3rd, a 5th) and a **quality** (major, minor, perfect, augmented or diminished). Together they make a name like "major 3rd" or "perfect 5th".'),
    p('If the two notes are played **one after the other** the interval is **melodic**. If they are played **at the same time** it is **harmonic**. The name is the same either way.'),
    staffBlock(notesOnStaff('treble', [pit('C4'), pit('E4')]), 'A melodic interval: C then E, one after the other. It is a major 3rd.'),
    listenBlock('Hear C then E', melodyAudio([pit('C4'), pit('E4')])),
    staffBlock(chordsOnStaff('treble', [[pit('C4'), pit('E4')]]), 'A harmonic interval: C and E together. The same major 3rd.'),
    listenBlock('Hear C and E together', chordAudioBlock([pit('C4'), pit('E4')])),

    h('What you need to know first'),
    list(
      'The notes are named with seven letters, **A B C D E F G**, and then they repeat. Going up means going forward through the letters.',
      'A **semitone** is the smallest step: from one piano key to the very next, black or white. A **tone** is two semitones. **E to F** and **B to C** are semitones (no black key between them). Every other pair of neighbouring plain letters is a tone.',
      'A **sharp** (♯) raises a note by a semitone. A **flat** (♭) lowers it by a semitone. Signs change the sound but **not the letter**.',
      'An **octave** is the distance from one note up to the next note with the same name, for example C up to the next C. It is 8 letter names and 12 semitones.',
    ),

    h('The facts: a two-step method'),
    remember('**Step 1, the number:** count the **letter names** from the lower note to the upper note, counting **both** ends. **Step 2, the quality:** count the **semitones** and look it up in the table.'),
    p('Step 1 is about **letters**. C to E: C, D, E is three letter names, so it is a **3rd**. Sharps and flats do not change this: C to E♭ is still a 3rd.'),
    p('Step 2 is about **semitones**. The number alone does not say which 3rd you have. There are two kinds of 3rd, a **minor 3rd** (3 semitones) and a **major 3rd** (4 semitones). The semitone count tells you which.'),
    table(['Interval', 'Short name', 'Semitones'], intervalTableRows(), 'The intervals to know, from a semitone to an octave.'),
    p('Learn the table by its pattern:'),
    list(
      '**2nds, 3rds, 6ths and 7ths** come in **major** and **minor**. A minor interval is **one semitone smaller** than the major one.',
      '**4ths, 5ths and the octave** are **perfect**. They have one normal size.',
      '**Augmented** means one semitone **bigger** than major or perfect. **Diminished** means one semitone **smaller** than perfect or minor. The ones in the table (augmented 4th and diminished 5th) are the common ones. Others are rare.',
      'Two notes with the same name and pitch make a **unison** (P1, 0 semitones). Practice starts at the 2nd.',
    ),
    p('Here are the intervals on white notes only, to show how the same number can have different qualities, because of where the semitones fall:'),
    table(['Notes', 'Number', 'Semitones', 'Interval'], intervalRowsFromC, 'White-note intervals above C.'),
    table(['Notes', 'Number', 'Semitones', 'Interval'], intervalRowsFromD, 'White-note intervals above D. Compare the 3rd above C (major) with the 3rd above D (minor).'),

    h('Why the spelling matters'),
    p('C to F♯ and C to G♭ are the **same two piano keys**, six semitones apart. But they are different intervals, because the **letters** are different.'),
    staffBlock(notesOnStaff('treble', [pit('C4'), pit('F#4')]), 'C to F♯: letters C D E F, so a 4th. Six semitones makes it an augmented 4th (A4).'),
    staffBlock(notesOnStaff('treble', [pit('C4'), pit('Gb4')]), 'C to G♭: letters C D E F G, so a 5th. Six semitones makes it a diminished 5th (d5).'),
    p('A perfect 4th is 5 semitones, so 6 is one bigger: **augmented**. A perfect 5th is 7 semitones, so 6 is one smaller: **diminished**. Same sound, different spelling, different name.'),

    h('Inversion'),
    p('To **invert** an interval, take the lower note and move it up an **octave**, so that it becomes the upper note. Two things always happen: the numbers add up to **9** (a 3rd becomes a 6th) and the semitones add up to **12** (4 and 8). The quality flips as well:'),
    table(['Interval (semitones)', 'Inverts to (semitones)'], INVERSION_ROWS, 'Inversions of common intervals.'),
    remember('**Inversion:** the numbers add up to 9. **Major ↔ minor. Perfect stays perfect. Augmented ↔ diminished.** The semitones add up to 12.'),

    h('The method: naming an interval'),
    steps(
      'Write down the **lower** and the **upper** note.',
      '**Number:** count the letter names from the lower to the upper, counting both ends.',
      '**Semitones:** walk up the plain letters, using the piano pattern (E to F and B to C are 1, every other pair is 2). Then adjust for the signs: a sign on the lower note moves the notes closer (♯) or further (♭), a sign on the upper note moves them further (♯) or closer (♭).',
      '**Quality:** look up the number and the semitones in the table.',
      '**Check:** say the answer as a recipe ("a major 3rd is 3 letters and 4 semitones") and see that it matches.',
    ),
    h('The method: building an interval'),
    steps(
      'Look up the interval: how many letter names and how many semitones.',
      '**Letter:** count that many letter names **up** (or **down**), counting the start as 1. That gives the letter of the new note.',
      '**Semitones:** work out how far the **plain** letter is from your start note, by the same walk.',
      '**Fix the sign:** if the plain letter is too close, raise it with a sharp. If it is too far, lower it with a flat. If it is right, add nothing.',
      '**Check** by counting back from the lower note to the upper: the right number of letters and the right number of semitones.',
    ),

    h('Worked examples: naming intervals'),
    p('Start with two natural-note intervals. The same method gives a major 3rd and a minor 6th.'),
    worked(intervalNameExample(pit('C4'), pit('E4'))),
    worked(intervalNameExample(pit('E4'), pit('C5'))),
    p('Now with sharps and flats.'),
    worked(intervalNameExample(pit('D4'), pit('F#4'))),
    worked(intervalNameExample(pit('Bb3'), pit('F4'))),
    p('And the pair from above: the same six semitones, two different names.'),
    worked(intervalNameExample(pit('C4'), pit('F#4'))),
    worked(intervalNameExample(pit('C4'), pit('Gb4'))),

    h('Worked examples: building intervals'),
    worked(buildIntervalExample(pit('Bb4'), 'M3', 'up')),
    worked(buildIntervalExample(pit('F#4'), 'P5', 'up')),
    worked(buildIntervalExample(pit('F4'), 'm3', 'down')),
    worked(buildIntervalExample(pit('G4'), 'm6', 'up')),

    h('Worked example: inversion'),
    worked(invertIntervalExample(pit('C4'), 'M3')),

    h('Common mistakes'),
    watch('**Not counting both ends.** C to E is a **3rd** (C, D, E), not a 2nd. Count the lower note as 1.'),
    watch('**Using semitones to find the number.** The number comes from **letters**, the quality from **semitones**. C to G♭ is a 5th (five letters) even though it sounds like C to F♯.'),
    watch('**Using the wrong letter when building.** A perfect 5th above F♯ is C♯. D♭ is the same piano key, but it is a 6th above F♯, not a 5th. Count the letters first (F, G, A, B, C), then fix the sign. If you only count semitones you can land on the right sound with the wrong name.'),
    watch('**Forgetting the two natural semitones.** E to F and B to C are a semitone, so the 3rd from E to G is minor (3 semitones) and the 3rd from C to E is major (4).'),
    watch('**Going the wrong way for "below".** A minor 3rd *below* F is D (count F, E, D). Going up would give A♭.'),
    watch('**Ignoring a note\'s own sharp or flat.** C to E♭ is 3 semitones (a minor 3rd), not the 4 of plain C to E. Put the sign into your count.'),

    h('Try it'),
    p('When you name an interval on the staff, the easy level asks only for the **number** and the medium and hard levels add the **quality**. Questions that ask you to build a note above or below another appear at every level.'),
    practise({ label: 'Practise intervals (easy)', topics: ['intervals'], level: 1 }),
    practise({ label: 'Practise intervals with quality (medium)', topics: ['intervals'], level: 2 }),
    practise({ label: 'Practise intervals including augmented and diminished (hard)', topics: ['intervals'], level: 3 }),
  ],
}

export const SCALES_INTERVALS_LESSONS: LibraryLesson[] = [MINOR_SCALES, PENTATONIC_BLUES, KEY_SIGNATURES, RELATED_KEYS, SCALE_DEGREES, INTERVALS]
