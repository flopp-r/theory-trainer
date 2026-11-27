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
import { chordsOnStaff, emptyStaff, h, list, listenBlock, notesOnStaff, p, practise, remember, staffBlock, steps, table, tip, watch, words, worked } from '../builders/common'
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
  summary: 'The three forms of minor scale, two ways to build the natural minor, and how a minor key is linked to a major key.',
  before: ['major-scales'],
  covers: ['scale-spelling'],
  build: () => [
    p('A **minor scale** is a scale that is often described as sounding darker or sadder than a major scale. The difference you can measure is note 3: it is 3 semitones above the key note in a minor scale, and 4 in a major scale. Minor keys are everywhere in music, so you need their scales for key signatures, chords and melodies.'),
    p('Minor scales come in three forms: natural, harmonic and melodic. They share most of their notes and differ in only one or two. This lesson shows which notes change in each form, and why.'),
    words(
      { term: 'Scale', meaning: 'A set of notes in order of pitch, going up or down by step and using each letter name once.' },
      { term: 'Key note (tonic)', meaning: 'The note a scale or key starts on and is named after. It is note 1 of the scale.' },
      { term: 'Semitone', meaning: 'The smallest step in Western music: from one piano key to the very next key, black or white.' },
      { term: 'Tone', meaning: 'A step of two semitones, such as C up to D.' },
      { term: 'Sharp (♯)', meaning: 'A sign that raises a note by one semitone. F♯ is one semitone higher than F.' },
      { term: 'Flat (♭)', meaning: 'A sign that lowers a note by one semitone. B♭ is one semitone lower than B.' },
      { term: 'Natural', meaning: 'A note with no sharp or flat, such as E or B.' },
      { term: 'Double sharp', meaning: 'A sign that raises a note by two semitones. It is usually printed as a small x; this app writes it ♯♯.' },
      { term: 'Major scale', meaning: 'The scale whose steps go tone, tone, semitone, tone, tone, tone, semitone.' },
      { term: 'Natural minor scale', meaning: 'The basic minor scale. Its steps go tone, semitone, tone, tone, semitone, tone, tone.' },
      { term: 'Harmonic minor scale', meaning: 'The natural minor scale with its 7th note raised by a semitone, so that the 7th leads up to the key note.' },
      { term: 'Melodic minor scale', meaning: 'Going up: the natural minor scale with its 6th and 7th notes raised by a semitone. Coming down: the natural minor scale unchanged.' },
      { term: 'Leading note', meaning: 'A 7th note that is a semitone below the key note. It sounds as if it wants to rise, or "lead", to the key note.' },
      { term: 'Relative major', meaning: 'The major key that has the same notes and key signature as a minor key. Its key note is 3 semitones higher.' },
      { term: 'Key signature', meaning: 'The sharps or flats written straight after the clef. Each one applies to every note with that letter name, in every octave.' },
    ),

    h('The facts: three forms of minor'),
    p('Start with the natural minor scale, the basic form. Set its steps beside the major scale. Major goes tone, tone, semitone, tone, tone, tone, semitone. Natural minor goes tone, semitone, tone, tone, semitone, tone, tone.'),
    p('The two patterns are linked: the natural minor scale is the major scale with its 3rd, 6th and 7th notes lowered by a semitone. Take C major: C D E F G A B. Lower E, A and B to E♭, A♭ and B♭ and you have C natural minor: C D E♭ F G A♭ B♭. Here "natural" means the basic form of the minor scale. It has nothing to do with natural notes, the notes with no sharp or flat.'),
    p('The other two forms start from the natural minor and raise one or two notes.'),
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
    p('A memory aid: *H*armonic raises one note, the 7th. *M*elodic raises *m*ore notes, the 6th and the 7th, and only on the way up.'),
    p('Here are all three forms on A, with the sound. A natural minor uses only natural notes, A B C D E F G, so the pictures show exactly where the raised notes come in.'),
    staffBlock(staffOfScale('A4', 'natural-minor'), 'A natural minor: A B C D E F G A.'),
    listenScale('Hear A natural minor', 'A4', 'natural-minor'),
    staffBlock(staffOfScale('A4', 'harmonic-minor'), `A harmonic minor: ${scaleLine('A', 'harmonic-minor')} A. Only the 7th (G) is raised, so it becomes G♯.`),
    listenScale('Hear A harmonic minor', 'A4', 'harmonic-minor'),
    staffBlock(staffOfScale('A4', 'melodic-minor'), `A melodic minor going up: ${scaleLine('A', 'melodic-minor')} A. The 6th and 7th (F and G) are raised.`),
    listenScale('Hear A melodic minor going up', 'A4', 'melodic-minor'),
    staffBlock(notesOnStaff('treble', scalePitches(pit('A4'), 'melodic-minor', { descending: true })), 'A melodic minor coming down: A G F E D C B A. Nothing is raised: it is the natural minor.'),
    listenScale('Hear A melodic minor coming down', 'A4', 'melodic-minor', true),

    h('Why are there three forms?'),
    p('In the natural minor scale, note 7 is a tone below the key note. Many people feel that a note a semitone below the key note pulls up towards it very strongly, which is why such a note is called the leading note. The natural minor has no leading note, so its 7th does not pull up to the key note.'),
    p('Harmonic minor fixes this by raising note 7 by a semitone. The name comes from harmony, because the chords (groups of notes played together) of a minor key use this raised note. The fix creates a new problem. The gap from note 6 up to the raised note 7 is now 3 semitones (one and a half tones), which is awkward to sing in a tune. Its interval name is an augmented 2nd: the Intervals lesson explains names like that.'),
    p('Melodic minor fixes the gap for tunes going up. It raises note 6 as well, so that notes 6 and 7 are each a tone above the note before. Coming down, note 7 does not need to lead anywhere, so the melody goes back to the natural minor notes.'),

    h('The relative major'),
    p('Every minor key has a relative major: a major scale that uses the same seven notes as the natural minor scale. Its key note is 3 semitones above the minor key note. Check with A and C: A, A♯, B, C is 3 semitones, and A, B, C is 3 letter names, counting both ends.'),
    p('A natural minor and its relative major also share a key signature, the sharps and flats written at the start of a piece. The Key signatures lesson covers that. For now, notice that the notes are the same.'),
    table(['Minor key', 'Relative major', 'Notes of the natural minor'], minorRelativeRows, 'Four minor keys and their relative majors. The seven notes are the same; only the starting note differs.'),
    p('The raised notes of harmonic and melodic minor are **not** part of the key signature. Composers write them as separate sharps or naturals next to the notes when they are needed.'),

    h('The method: natural minor, using the pattern'),
    p('This method always works. It is the same method as for the major scale, with a different pattern.'),
    steps(
      '**Write the key note.** This is note 1. For D natural minor, write D.',
      '**Write the letter names.** Write 8 letter names in alphabetical order, starting on the key note and ending on it again. A scale uses every letter name once, so the letters are now fixed. Only the sharps and flats are left to work out. For D: D E F G A B C D.',
      '**Write the natural minor pattern.** Write tone, semitone, tone, tone, semitone, tone, tone over the seven gaps between your eight letters.',
      '**Work out each gap, one at a time.** For each gap, count the semitones from the note you have to the next letter, with no sign on it yet. If the pattern asks for a bigger gap, raise the new note with a sharp. If it asks for a smaller gap, lower it with a flat. If the gap is right, leave the note natural. In D natural minor, gap 5 is A up to B: 2 semitones, but the pattern asks for a semitone. The gap is 1 too big, so lower B to B♭.',
      '**Write the scale out.** Read the notes from the bottom up, ending on the key note again. D natural minor is D E F G A B♭ C D.',
      '**Check another way.** In every natural minor scale, note 3 is 3 semitones above the key note. Count up one piano key at a time: D, D♯, E, F is 3 steps. F is note 3, so the check works.',
    ),

    h('The method: natural minor, from the major scale'),
    p('This is quick when you already know the major scale. Use the major scale on the same key note.'),
    steps(
      '**Choose the major scale to start from.** Use the major scale with the same key note as your minor key. For E minor, start from E major. Do not use the relative major (G major).',
      '**Write the key note.** This is note 1: E.',
      '**Write the letter names.** E F G A B C D E.',
      '**Write the major pattern.** Write tone, tone, semitone, tone, tone, tone, semitone over the seven gaps.',
      '**Work out each gap, one at a time.** Add sharps or flats until every gap matches the major pattern. E major is E F♯ G♯ A B C♯ D♯ E.',
      '**Lower note 3, note 6 and note 7 by a semitone.** Do them one at a time. A sharp is cancelled, so G♯ becomes natural G. A natural note gets a flat. A flat becomes a double flat.',
      '**Write the scale out.** Keep notes 1, 2, 4 and 5 as they were in the major scale, and put in your three lowered notes: E F♯ G A B C D E.',
      '**Check another way.** Measure each gap of your answer in semitones and compare it with the natural minor pattern. E F♯ G A B C D E gives 2, 1, 2, 2, 1, 2, 2: tone, semitone, tone, tone, semitone, tone, tone.',
    ),

    h('The method: harmonic minor'),
    steps(
      '**Start from the natural minor scale.** Build it with the first method: the key note, the letter names, the pattern, then each gap.',
      '**Raise note 7 by a semitone.** Note 7 is a tone below the key note. Raise it by a semitone to make a leading note. A flat becomes natural, a natural note gets a sharp, and a sharp becomes a double sharp. In D natural minor, note 7 is C, so it becomes C♯.',
      '**Keep the letter.** This step is only for a note that has become a double sharp. A double sharp is the same piano key as another letter, but you write it with its own letter, because a scale uses each letter once. In G♯ harmonic minor, note 7 is F♯♯, not G.',
      '**Write the scale out.** Read the natural minor notes from the bottom up, with the raised note 7 in place. D harmonic minor is D E F G A B♭ C♯ D.',
      '**Check another way.** Count the top two gaps. From note 6 to the raised note 7 is 3 semitones. From note 7 up to the key note is 1 semitone. In D: B♭, B, C, C♯ is 3 steps, and C♯, D is 1 step.',
    ),

    h('The method: melodic minor'),
    steps(
      '**Start from the natural minor scale.** Build it with the first method.',
      '**Going up, raise note 6 by a semitone.** A flat becomes natural, a natural note gets a sharp.',
      '**Going up, raise note 7 by a semitone.** Do the same to note 7.',
      '**Write the scale going up.** Read the notes from the bottom up, with notes 6 and 7 raised. C melodic minor going up is C D E♭ F G A B C.',
      '**Write the scale coming down.** Coming down, nothing is raised: use the natural minor notes from the top down. C melodic minor coming down is C B♭ A♭ G F E♭ D C.',
      '**Check another way.** Going up, melodic minor ends like a major scale: a tone from note 6 to note 7, then a semitone to the key note. In C: A, A♯, B is 2 steps, and B, C is 1 step.',
    ),

    h('Worked examples'),
    p('Each example shows every decision. Follow one all the way through, then try the next on your own before reading it. First the natural minor: one by the pattern, one by lowering the major scale, and one in a flat key.'),
    worked(minorScaleExample(note('A'), 'natural')),
    worked(minorScaleExample(note('E'), 'natural', { method: 'from-major' })),
    worked(minorScaleExample(note('F'), 'natural')),
    p('Now the harmonic minor. The first is an easy one. The second is the tricky case: the raised 7th needs a double sharp.'),
    worked(minorScaleExample(note('D'), 'harmonic')),
    worked(minorScaleExample(note('G', 1), 'harmonic')),
    tip('A double sharp looks odd, but it is not a mistake. In G♯ harmonic minor, note 7 is F♯. Raise it by a semitone and it becomes F♯♯, which is the same piano key as G. You still write F♯♯, because the scale uses every letter once and G♯ is already note 1.'),
    p('Finally the melodic minor, up and down.'),
    worked(minorScaleExample(note('C'), 'melodic')),

    h('Common mistakes'),
    watch('**Raising the wrong notes.** In A harmonic minor, raise only the 7th: A B C D E F G♯ A. If you raise the 6th and the 7th, A B C D E F♯ G♯ A, you have written the melodic minor going up.'),
    watch('**Keeping the raised notes coming down.** The wrong way down is A G♯ F♯ E D C B A. The right way is A G F E D C B A, the natural minor, with nothing raised.'),
    watch('**Writing F♯♯ as G.** G♯ harmonic minor is G♯ A♯ B C♯ D♯ E F♯♯ G♯. Writing the 7th as G gives G♯ A♯ B C♯ D♯ E G G♯: two G letters and no F. The scale uses each letter once, so note 7 must be an F.'),
    watch('**Starting from the relative major.** To build E minor from a major scale, start from E major, the same key note. Lower the 3rd, 6th and 7th of G major (the relative major) instead and you get G A B♭ C D E♭ F. That is G minor, not E minor.'),

    h('Try it'),
    p('Practice asks you to pick the right notes for a scale. The natural minor appears at the medium level, and all three forms appear at the hard level.'),
    practise({ label: 'Practise natural minor and other scales (medium)', topics: ['scales'], level: 2 }),
    practise({ label: 'Practise all three minor scales (hard)', topics: ['scales'], level: 3 }),
    list('Next lessons: Pentatonic and blues scales, then Key signatures.'),
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
    p('A **pentatonic scale** is a scale of five different notes ("penta" means five). You make one by taking a seven-note scale and leaving two notes out. Pentatonic scales turn up in folk music, rock and blues, and they are quick to learn because there are only five notes.'),
    p('There are two main ones: the major pentatonic and the minor pentatonic. The blues scale in this app is the minor pentatonic with one extra note, the blue note, so it has six notes.'),
    words(
      { term: 'Key note (tonic)', meaning: 'The note a scale or key starts on and is named after. It is note 1 of the scale.' },
      { term: 'Semitone', meaning: 'The smallest step in Western music: from one piano key to the very next key, black or white.' },
      { term: 'Tone', meaning: 'A step of two semitones, such as C up to D.' },
      { term: 'Sharp (♯)', meaning: 'A sign that raises a note by one semitone. F♯ is one semitone higher than F.' },
      { term: 'Flat (♭)', meaning: 'A sign that lowers a note by one semitone. B♭ is one semitone lower than B.' },
      { term: 'Natural', meaning: 'A note with no sharp or flat, such as E or B.' },
      { term: 'Octave', meaning: 'The distance from a note to the next note with the same letter name: 8 letter names, or 12 semitones.' },
      { term: 'Major scale', meaning: 'The scale whose steps go tone, tone, semitone, tone, tone, tone, semitone.' },
      { term: 'Natural minor scale', meaning: 'The basic minor scale. Its steps go tone, semitone, tone, tone, semitone, tone, tone.' },
      { term: 'Pentatonic scale', meaning: 'A scale of five different notes. "Penta" means five.' },
      { term: 'Major pentatonic scale', meaning: 'The major scale with notes 4 and 7 left out, so it keeps notes 1, 2, 3, 5 and 6.' },
      { term: 'Minor pentatonic scale', meaning: 'The natural minor scale with notes 2 and 6 left out, so it keeps notes 1, 3, 4, 5 and 7.' },
      { term: 'Blues scale', meaning: 'The minor pentatonic scale plus one extra note, the blue note, so it has six different notes.' },
      { term: 'Blue note', meaning: 'The flattened 5th: note 5 of the scale lowered by a semitone. It keeps the letter name of note 5.' },
      { term: 'Enharmonic', meaning: 'Two names for the same piano key, such as F♯ and G♭. They sound the same but are spelled differently.' },
    ),

    h('The facts: which notes to keep'),
    p('The notes of a scale are numbered from the key note: 1, 2, 3 and so on. The table below also uses ♭3, which you say "flat three". It means note 3 of the major scale, lowered by a semitone. ♭5 and ♭7 mean the same for notes 5 and 7.'),
    table(
      ['Scale', 'Which notes', 'Taken from', 'Left out'],
      [
        ['Major pentatonic', '1 2 3 5 6', 'the major scale', 'the 4th and 7th'],
        ['Minor pentatonic', '1 ♭3 4 5 ♭7 (these are the 1st, 3rd, 4th, 5th and 7th notes of the natural minor scale)', 'the natural minor scale', 'the 2nd and 6th'],
        ['Blues', '1 ♭3 4 ♭5 5 ♭7 (six notes)', 'the minor pentatonic plus the flattened 5th between the 4th and 5th notes', 'the 2nd and 6th of the natural minor (the ♭5 is added)'],
      ],
      'The three scales.',
    ),
    p('Here they are on the key note C. Read each pentatonic line against the seven-note scale above it, and see which notes have gone.'),
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
    p(`Now measure the steps of C major pentatonic: ${scaleLine('C', 'major-pentatonic')} C goes tone, tone, one and a half tones, tone, one and a half tones. There is no semitone step. A major scale has its semitones between notes 3 and 4, and between notes 7 and 8. Notes 4 and 7 are the two you leave out, so both semitones go. The same happens in the natural minor scale, where you leave out notes 2 and 6.`),
    tip(`C major pentatonic (${scaleLine('C', 'major-pentatonic')}) and A minor pentatonic (${scaleLine('A', 'minor-pentatonic')}) use exactly the same five notes. A is note 6 of C major, so A minor is the relative minor of C major.`),

    h('Spelling the blue note'),
    p('The blue note is the flattened 5th: take note 5 and lower it by a semitone. In C, note 5 is G, so the blue note is G♭.'),
    p('On a piano, G♭ is the same key as F♯: the two names are enharmonic. So why not write F♯? Because spelling follows the letter. Note 5 of C is a G (count C, D, E, F, G), so lowering it gives a G-something: G♭. An F♯ would be a raised note 4, which is a different job in the scale. In this app the blues scale is spelled with the flattened 5th, so the blues scale on C is C E♭ F G♭ G B♭.'),
    p('The letter G now appears twice (G♭ and G). That is normal for the blues scale. In the seven-note scales every letter appears once.'),

    h('The method: major pentatonic'),
    steps(
      '**Choose the scale to start from.** The major pentatonic comes from the major scale with the same key note. For B♭ major pentatonic, start from B♭ major.',
      '**Write the key note.** This is note 1: B♭.',
      '**Write the letter names.** Note 7 is left out, so you need notes 1 to 6 only. Write 6 letter names in alphabetical order, starting on the key note: B C D E F G.',
      '**Write the major pattern.** Use the first 5 steps of tone, tone, semitone, tone, tone, tone, semitone. That is one step for each gap between your 6 letters.',
      '**Work out each gap, one at a time.** For each gap, count the semitones from the note you have to the next letter. If the pattern asks for a bigger gap, raise the new note with a sharp. If it asks for a smaller gap, lower it with a flat. If it is right, leave the note natural. You get B♭ C D E♭ F G.',
      '**Leave out notes 4 and 7.** Note 4 is E♭. Note 7 you never needed to work out. This removes both semitone steps of the major scale.',
      '**Keep the other five notes.** Keep notes 1, 2, 3, 5 and 6: B♭ C D F G.',
      '**Write the scale out.** Read the five notes from the bottom up and finish on the key note again, one octave higher: B♭ C D F G B♭.',
      '**Check another way.** Measure each gap of your answer in semitones, counting piano keys. No gap should be a single semitone.',
    ),

    h('The method: minor pentatonic and blues'),
    p('The first seven steps are the same for both scales. The last four steps are for the blues scale only. Work with C as the example.'),
    steps(
      '**Choose the scale to start from.** These scales come from the natural minor scale with the same key note. For C, start from C natural minor.',
      '**Write the key note.** This is note 1: C.',
      '**Write the letter names.** You need notes 1 to 7. Write 7 letter names in alphabetical order, starting on the key note: C D E F G A B.',
      '**Write the natural minor pattern.** Use the first 6 steps of tone, semitone, tone, tone, semitone, tone, tone. That is one step for each gap between your 7 letters.',
      '**Work out each gap, one at a time.** Raise with a sharp, lower with a flat or leave natural, as in the major pentatonic method. You get C D E♭ F G A♭ B♭.',
      '**Leave out notes 2 and 6.** Note 2 is D and note 6 is A♭. This removes both semitone steps of the natural minor scale.',
      '**Keep the other five notes.** Keep notes 1, 3, 4, 5 and 7: C E♭ F G B♭. For the minor pentatonic, you can go straight to "Write the scale out".',
      '**Find the blue note.** Blues only. The blue note is note 5 lowered by a semitone. Note 5 is G, so add a flat: G♭.',
      '**Spell the blue note with the letter of note 5.** G♭ is the same piano key as F♯, but the blue note keeps the letter G. Write G♭, not F♯.',
      '**Put the blue note between notes 4 and 5.** It sits between F and G: C E♭ F G♭ G B♭.',
      '**Write the scale out.** Read the notes from the bottom up and finish on the key note again, one octave higher. C minor pentatonic is C E♭ F G B♭ C. C blues is C E♭ F G♭ G B♭ C.',
      '**Check another way.** For the minor pentatonic, measure each gap in semitones: none should be a single semitone. For the blues scale, count up from the key note one piano key at a time: C, D♭, D, E♭, E, F, G♭ is 6 steps. The blue note is always 6 semitones above the key note.',
    ),

    h('Worked examples'),
    p('Start with the easiest: C major pentatonic, where every note is natural.'),
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
    watch('**Spelling the blue note as F♯.** In C blues, the wrong scale is C E♭ F F♯ G B♭. The right scale is C E♭ F G♭ G B♭. The blue note lowers note 5, which is a G, so it keeps the letter G.'),
    watch('**Taking notes 1 3 4 5 7 from the major scale.** In C, the wrong notes are C E F G B (from C major). The right notes are C E♭ F G B♭, because the minor pentatonic comes from the natural minor scale.'),
    watch('**Putting the blue note at the end.** The wrong blues scale is C E♭ F G B♭ G♭. The right one is C E♭ F G♭ G B♭: the blue note goes between note 4 (F) and note 5 (G), a semitone from each.'),

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
    p('A **key signature** is a group of sharps or flats written at the start of every line of music, straight after the clef. It means: every note with this letter name is sharp (or flat) all the way through, unless a sign says otherwise. It applies in every octave, so one F♯ in the signature makes every F on the staff an F♯, high or low.'),
    p('Most pieces stay in one key: a home note plus the scale built on it. The scale of D major has two sharps, F♯ and C♯. Instead of printing a ♯ in front of every F and every C, the composer prints the two sharps once, at the start. That saves a lot of clutter, and it tells the player the key at a glance. Compare these:'),
    staffBlock(notesOnStaff('treble', D_SCALE), 'The D major scale with no key signature: every F♯ and C♯ needs its own sign.'),
    staffBlock(notesOnStaff('treble', D_SCALE, D_MAJOR), 'The same scale with the key signature of D major (two sharps) at the start: the notes need no signs.'),
    words(
      { term: 'Clef', meaning: 'A sign at the start of the staff that fixes one line to one letter name, so you can count to every other note.' },
      { term: 'Key', meaning: 'The set of notes a piece mainly uses, named after its home note, such as G major.' },
      { term: 'Key note (tonic)', meaning: 'The note a scale or key starts on and is named after. It is note 1 of the scale.' },
      { term: 'Key signature', meaning: 'The sharps or flats written straight after the clef. Each one applies to every note with that letter name, in every octave.' },
      { term: 'Sharp (♯)', meaning: 'A sign that raises a note by one semitone. F♯ is one semitone higher than F.' },
      { term: 'Flat (♭)', meaning: 'A sign that lowers a note by one semitone. B♭ is one semitone lower than B.' },
      { term: 'Semitone', meaning: 'The smallest step in Western music: from one piano key to the very next key, black or white.' },
      { term: 'Order of sharps', meaning: 'The fixed order sharps are added to a key signature: F C G D A E B.' },
      { term: 'Order of flats', meaning: 'The fixed order flats are added to a key signature: B E A D G C F, the order of sharps backwards.' },
      { term: 'Leading note', meaning: 'A 7th note that is a semitone below the key note. It sounds as if it wants to rise, or "lead", to the key note.' },
      { term: 'Relative major', meaning: 'The major key that has the same notes and key signature as a minor key. Its key note is 3 semitones higher.' },
      { term: 'Relative minor', meaning: 'The minor key that has the same notes and key signature as a major key. Its key note is 3 semitones lower.' },
      { term: 'Perfect 5th', meaning: 'An interval of 5 letter names (counting both notes) and 7 semitones, such as C up to G.' },
      { term: 'Circle of fifths', meaning: 'The keys in a ring, each a perfect 5th above the one before. Each step up adds a sharp or takes away a flat.' },
    ),

    h('The facts: the order, the keys and the circle'),
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
    p('A memory aid for the sharps: *F*ather *C*harles *G*oes *D*own *A*nd *E*nds *B*attle. For the flats, say it backwards: *B*attle *E*nds *A*nd *D*own *G*oes *C*harles\'s *F*ather. Another aid for the flats: they spell BEAD and then GCF.'),
    p('This means you only ever need to know how many sharps or flats a key has. The order tells you which ones.'),

    h('2. Where the signs sit'),
    p('Each sharp or flat is drawn on its own line or space, in a zigzag pattern that keeps the signs on the staff. The pattern is different in each clef. You do not need to learn where they go: you only have to count them. The app draws them for you. Here are the biggest signatures, seven sharps (C♯ major) and seven flats (C♭ major):'),
    staffBlock(emptyStaff('treble', SEVEN_SHARPS), 'Seven sharps in the treble clef: F♯ C♯ G♯ D♯ A♯ E♯ B♯.'),
    staffBlock(emptyStaff('bass', SEVEN_SHARPS), 'Seven sharps in the bass clef. The same seven sharps, drawn in a different pattern.'),
    staffBlock(emptyStaff('treble', SEVEN_FLATS), 'Seven flats in the treble clef: B♭ E♭ A♭ D♭ G♭ C♭ F♭.'),
    staffBlock(emptyStaff('bass', SEVEN_FLATS), 'Seven flats in the bass clef.'),

    h('3. All the keys at a glance'),
    p('Every key signature belongs to two keys: a major key and its relative minor. This table lists all 15 key signatures, from seven flats to seven sharps. These 30 keys, with up to seven sharps or flats, are the standard ones.'),
    table(['Number of signs', 'Major key', 'Relative minor', 'The signs'], keySignatureTableRows(), 'All 15 key signatures. Going down the table, each row has one more sharp (or one fewer flat) than the row above.'),
    p(`Look at the order of the major keys, going down the table: ${circleOfFifths().map((e) => noteLabel(e.major.tonic)).join(', ')}. Each step down is a perfect 5th higher (a perfect 5th is 7 semitones: C up to G is one). Each step down adds one sharp, or takes away one flat. Draw the keys round a clock face with C at the top and you have the circle of fifths: the sharp keys go clockwise and the flat keys go anticlockwise.`),

    h('4. Reading a key signature: which key is it?'),
    remember('**Sharps:** the major key is a **semitone above the last sharp**. **Flats:** the major key is the **second-to-last flat**. **One flat:** F major (learn this one). **No signs:** C major. For the **minor** key, go **3 semitones below** the major key.'),
    p('Why does each rule work? Take the sharps first. Sharps are added in the order F C G D A E B, and the last sharp is always note 7 of the major scale, the leading note. A leading note is a semitone below the key note, so the key note is a semitone above the last sharp. Example: the last sharp is C♯, a semitone above is D, so the key is D major.'),
    p('Now the flats. Each flat in the order B E A D G C F is 4 letter names and 5 semitones above the one before it. The last flat is note 4 of the major scale, which is 4 letter names and 5 semitones above the key note. So the key note is the flat just before the last one: the second-to-last flat. Example: the flats are B♭ and E♭, the second-to-last is B♭, so the key is B♭ major.'),
    p('Two cases have to be learned. With one flat there is no second-to-last flat, so B♭ alone means F major. With no signs the key is C major.'),
    p('For the minor key, go 3 semitones below the major key note, which is 3 letter names counting both ends. Example: D major has the relative minor B minor (D, C, B).'),
    tip('One signature, two keys. The same signature belongs to a major key and its relative minor. Two sharps is D major and B minor. So the question always says which one it wants: look for the word "major" or "minor".'),

    h('5. Writing a key signature: which signs?'),
    p('Writing a signature is the same idea backwards. First work out how many signs, then the order tells you which ones.'),
    list(
      'Minor keys: find the relative major first (3 semitones above). The signature is the same.',
      'Sharp keys are the major keys G, D, A, E, B, F♯ and C♯. Flat keys are the major keys F, B♭, E♭, A♭, D♭, G♭ and C♭. C major has no signs.',
      'Sharp key: the last sharp is a semitone below the key note, so it uses the letter before the key note. Find that letter in F C G D A E B. Its place in that order is the number of sharps. Example: D major, the last sharp is C♯, and C is 2nd in F C G D A E B, so 2 sharps.',
      'Flat key: find the key note\'s letter in B E A D G C F. The last flat is the next one along. Example: A♭ major, A is 3rd in B E A D G C F, the next is D (4th), so 4 flats. F major is the exception: it has 1 flat (B♭).',
    ),
    p('The circle of fifths gives a way to check. Start on C major, which has no signs. Each key a perfect 5th higher adds one sharp:'),
    p(circleLine('sharps')),
    p('Each key a perfect 5th lower adds one flat:'),
    p(circleLine('flats')),
    p('The number in brackets is the number of sharps or flats.'),

    h('The method: reading a key signature with sharps'),
    steps(
      '**Count the signs after the clef.** Count the signs straight after the clef. They are all sharps or all flats, never a mixture. You only need to count them: where each one sits does not matter. Say there are 2 sharps.',
      '**Name the sharps from the order.** Sharps are always added in the order F C G D A E B. Take as many as you counted: for 2 sharps, F♯ and C♯.',
      '**Go up a semitone from the last sharp.** The last sharp is the leading note of the major key, a semitone below the key note. C up to D is 2 semitones and C♯ is 1 higher than C, so C♯ up to D is 1 semitone. The key is D major.',
      '**Check another way: the circle of fifths.** Start at C major, with no signs. Each step up a perfect 5th adds one sharp: C (0), G (1), D (2). D major is 2 steps along, so 2 sharps.',
    ),

    h('The method: reading a key signature with flats'),
    steps(
      '**Count the signs after the clef.** Count the signs straight after the clef. Say there are 3 flats.',
      '**Name the flats from the order.** Flats are always added in the order B E A D G C F. Take as many as you counted: for 3 flats, B♭ E♭ A♭.',
      '**Use the one-flat rule.** Only for a signature with a single flat. There is no second-to-last flat, so learn this one: B♭ alone means F major. Then go to the check.',
      '**Take the second-to-last flat.** For two or more flats, the key note is the second-to-last flat. In B♭ E♭ A♭ it is E♭, so the key is E♭ major.',
      '**Check another way: the circle of fifths.** Start at C major, with no signs. Each step down a perfect 5th adds one flat: C (0), F (1), B♭ (2), E♭ (3). E♭ major is 3 steps along, so 3 flats.',
    ),

    h('The method: finding the minor key'),
    p('Do this after either list above, when the question asks for the minor key. The relative minor has the same key signature and starts 3 semitones below the major key note. The example finds the minor key of A major (3 sharps).'),
    steps(
      '**Count 3 letter names down from the major key note.** Count down from A, counting A as 1: A, G, F. The letter is F.',
      '**Count 3 semitones down from the major key note.** Count down one piano key at a time, counting the steps and not the key you start on: A, G♯, G, F♯ is 3 steps. It lands on F♯, which uses the letter F. The minor key is F♯ minor.',
      '**Check another way: the circle of fifths.** Start at A minor, with no signs. Each step up a perfect 5th adds one sharp: A (0), E (1), B (2), F♯ (3). F♯ minor is 3 steps along, so 3 sharps.',
    ),

    h('The method: writing a key signature'),
    p('If the key is minor, start with these two steps. They find the relative major, which has the same signature. Then follow the steps for that major key. For the check, start the circle of fifths at A minor instead of C major. The example is F♯ minor.'),
    steps(
      '**Count 3 letter names up from the minor key note.** Count up from F, counting F as 1: F, G, A. The letter is A.',
      '**Count 3 semitones up from the minor key note.** Count up one piano key at a time from F♯: F♯, G, G♯, A is 3 steps. It lands on A, so the relative major is A major.',
    ),
    p('For a major key with sharps, the example is D major:'),
    steps(
      '**Decide whether the key has sharps or flats.** Learn the two lists in part 5 above. D is in the list of sharp keys. C major is in neither list, so its signature is empty.',
      '**Find the last sharp.** It is the leading note, a semitone below the key note, so it uses the letter before D: C. C up to D is 2 semitones. That is 1 too many, so raise C with a sharp: C♯.',
      '**Count along the order of sharps.** Count along F C G D A E B until you reach C: F (1), C (2). D major has the first 2 sharps of the order.',
      '**Write the signs after the clef.** Write the 2 signs straight after the clef, in the order you counted them: F♯ C♯.',
      '**Check another way: the circle of fifths.** Start at C major. Each step up a perfect 5th adds one sharp: C (0), G (1), D (2). D major is 2 steps along, so 2 sharps.',
    ),
    p('For a major key with flats, the example is A♭ major:'),
    steps(
      '**Decide whether the key has sharps or flats.** A♭ is in the list of flat keys.',
      '**Learn the one-flat key.** Only for F major. It has 1 flat, B♭, because the last flat is note 4 of the key (F, G, A, B♭). Write B♭ and skip to the signs.',
      '**Find the key note in the order of flats.** For two or more flats, the key note is the second-to-last flat. Find A in B E A D G C F: B (1), E (2), A (3).',
      '**Add one for the last flat.** The last flat is the next one in the order: D, number 4. A♭ major has the first 4 flats: B♭ E♭ A♭ D♭.',
      '**Write the signs after the clef.** Write the 4 signs straight after the clef, in the order you counted them: B♭ E♭ A♭ D♭.',
      '**Check another way: the circle of fifths.** Start at C major. Each step down a perfect 5th adds one flat: C (0), F (1), B♭ (2), E♭ (3), A♭ (4). A♭ major is 4 steps along, so 4 flats.',
    ),

    h('Worked examples: reading signatures'),
    p('Each example starts with a picture of a signature. Follow the working with the picture in front of you.'),
    worked(keyFromSignatureExample(key('D', 'major'), 'treble')),
    worked(keyFromSignatureExample(key('Eb', 'major'), 'bass')),
    worked(keyFromSignatureExample(key('F', 'major'), 'treble')),
    p('Now minor keys. The next picture is in the alto clef, which violas read. Its clef sign looks different, but the method is exactly the same: count the signs.'),
    worked(keyFromSignatureExample(key('F#', 'minor'), 'alto')),
    worked(keyFromSignatureExample(key('Bb', 'minor'), 'treble')),

    h('Worked examples: writing signatures'),
    p('Each example ends with a check by the circle of fifths. The last one starts from a minor key.'),
    worked(signatureFromKeyExample(key('D', 'major'))),
    worked(signatureFromKeyExample(key('Ab', 'major'))),
    worked(signatureFromKeyExample(key('F', 'major'))),
    worked(signatureFromKeyExample(key('F#', 'minor'))),

    h('Common mistakes'),
    watch('**Choosing between major and minor by guessing.** Which minor key has 2 sharps? Wrong: D minor, because D major has 2 sharps. Right: the signature points to D major first, then you go 3 semitones down (D, C, B) to B minor. The question says which one it wants.'),
    watch('**Using the last flat instead of the second-to-last.** The flats are B♭ E♭ A♭. Wrong: A♭ major, the last flat. Right: E♭ major, the second-to-last. With sharps you go a semitone up from the last sharp, but with flats you name the second-to-last.'),
    watch('**Writing the signs in the wrong order.** Three sharps are F♯ C♯ G♯. Wrong: F♯ G♯ C♯, or any other three sharps. Right: the first three of F C G D A E B.'),
    watch('**Putting the raised 7th of harmonic minor in the signature.** A harmonic minor contains G♯, but its signature is empty, the same as C major. Raised notes are written next to the notes, not in the signature.'),

    h('Try it'),
    p('Start at the easy level (up to two sharps or flats), then move up.'),
    practise({ label: 'Practise key signatures (easy)', topics: ['keys'], level: 1 }),
    practise({ label: 'Practise key signatures (medium)', topics: ['keys'], level: 2 }),
    list('Next lesson: Relative and parallel keys.'),
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
    p('Keys are related to each other in three ways, and a piece often moves from its home key to a key that is related to it. **Relative keys** share a key signature. **Parallel keys** share a key note. **Closely related keys** have signatures that differ by at most one sharp or flat. The three are easy to mix up, so this lesson takes them one at a time.'),
    words(
      { term: 'Key', meaning: 'The set of notes a piece mainly uses, named after its home note, such as G major.' },
      { term: 'Key note (tonic)', meaning: 'The note a scale or key starts on and is named after. It is note 1 of the scale.' },
      { term: 'Key signature', meaning: 'The sharps or flats written straight after the clef. Each one applies to every note with that letter name, in every octave.' },
      { term: 'Sharp (♯)', meaning: 'A sign that raises a note by one semitone. F♯ is one semitone higher than F.' },
      { term: 'Flat (♭)', meaning: 'A sign that lowers a note by one semitone. B♭ is one semitone lower than B.' },
      { term: 'Semitone', meaning: 'The smallest step in Western music: from one piano key to the very next key, black or white.' },
      { term: 'Major scale', meaning: 'The scale whose steps go tone, tone, semitone, tone, tone, tone, semitone.' },
      { term: 'Natural minor scale', meaning: 'The basic minor scale. Its steps go tone, semitone, tone, tone, semitone, tone, tone.' },
      { term: 'Mediant', meaning: 'The 3rd degree of a scale. It is halfway, or in the middle, between the tonic and the dominant.' },
      { term: 'Submediant', meaning: 'The 6th degree of a scale. It is a 3rd below the tonic, as the mediant is a 3rd above.' },
      { term: 'Perfect 5th', meaning: 'An interval of 5 letter names (counting both notes) and 7 semitones, such as C up to G.' },
      { term: 'Relative minor', meaning: 'The minor key that has the same notes and key signature as a major key. Its key note is 3 semitones lower.' },
      { term: 'Relative major', meaning: 'The major key that has the same notes and key signature as a minor key. Its key note is 3 semitones higher.' },
      { term: 'Parallel keys', meaning: 'A major key and a minor key with the same key note, such as A major and A minor.' },
      { term: 'Closely related keys', meaning: 'Keys whose key signatures differ by no more than one sharp or flat. Every key has five of them.' },
      { term: 'Circle of fifths', meaning: 'The keys in a ring, each a perfect 5th above the one before. Each step up adds a sharp or takes away a flat.' },
    ),

    h('The facts: three relationships'),
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
    p('Example: the G major scale is G A B C D E F♯. Count to note 6: G (1), A (2), B (3), C (4), D (5), E (6). The relative minor of G major is E minor. Check: the natural minor scale on E is E F♯ G A B C D, the same seven notes, and both keys have one sharp. Going down from G by 3 semitones (G, F♯, F, E) lands on E too.'),
    p('Relative keys share the same notes, so they share the same key signature. That is why one signature belongs to two keys.'),

    h('Parallel keys'),
    p('Parallel keys have the same key note but one is major and one is minor: C major and C minor, A major and A minor. They start on the same note but use different notes, so their key signatures differ.'),
    p('Going from a major key to its parallel minor always moves the signature 3 places towards the flats: three more flats, or three fewer sharps. The reason is that the natural minor scale lowers notes 3, 6 and 7 of the major scale, and each lowered note adds a flat or takes away a sharp. For example, A major has 3 sharps and A minor has none.'),
    table(['Major key', 'Parallel minor', 'Major signature', 'Minor signature'], PARALLEL_ROWS, 'Parallel pairs where both keys exist in practice.'),
    tip(`**Some parallel keys do not exist in practice.** The parallel minor of ${joinOr([...NO_PARALLEL].reverse())} would need eight or more flats. The parallel major of ${joinOr(NO_PARALLEL_MINOR)} would need eight or more sharps. Keys like these are called theoretical keys, and the app does not ask about them.`),

    h('The circle of fifths and closely related keys'),
    p('List the keys from seven flats to seven sharps and each step down the list is a perfect 5th higher, with one more sharp (the same table as in the Key signatures lesson). Draw the list round a clock face, with C major at the top, and you have the circle of fifths.'),
    table(
      ['Number of signs', 'Major key', 'Relative minor'],
      keySignatureTableRows().map((row) => [row[0]!, row[1]!, row[2]!]),
      'The circle of fifths as a list. Neighbouring rows are closely related.',
    ),
    p('Closely related keys have signatures that differ from yours by at most one sharp or flat. They share almost all their notes (all seven, or six of the seven), which is why pieces so often move from one of them to another. For any key there are five:'),
    list(
      'its relative key (the same signature),',
      'the key a perfect 5th above (one more sharp), of the same kind (major or minor), and that key\'s relative,',
      'the key a perfect 5th below (one more flat), of the same kind, and that key\'s relative.',
    ),
    tip('Some pairs of keys use the same piano keys but are written differently, for example F♯ major (6 sharps) and G♭ major (6 flats). They sit near each other at the bottom of the circle.'),

    h('The method: the relative minor of a major key'),
    steps(
      '**Write the key note.** This is note 1. For G major, write G.',
      '**Write the letter names.** The relative minor starts on note 6 of the major scale, so you only need notes 1 to 6. Write 6 letter names in alphabetical order, starting on G: G A B C D E.',
      '**Write the major pattern.** Use the first 5 steps of tone, tone, semitone, tone, tone, tone, semitone: one for each gap between your 6 letters.',
      '**Work out each gap, one at a time.** For each gap, count the semitones from the note you have to the next letter. Add a sharp if the gap is too small and a flat if it is too big. G major gives G A B C D E.',
      '**Take note 6, the submediant.** Note 6 is E. The minor key on E uses the same seven notes, so it has the same key signature. The relative minor is E minor.',
      '**Check another way: count 3 semitones down.** The relative minor is always 3 letter names and 3 semitones below. Letters down from G: G, F, E. Piano keys down from G: G, F♯, F, E is 3 steps. It is E again.',
    ),

    h('The method: the relative major of a minor key'),
    steps(
      '**Write the key note.** This is note 1. For E minor, write E.',
      '**Write the letter names.** The relative major starts on note 3 of the natural minor scale, so you only need notes 1 to 3: E F G.',
      '**Write the natural minor pattern.** Use the first 2 steps of tone, semitone, tone, tone, semitone, tone, tone: one for each gap between your 3 letters.',
      '**Work out each gap, one at a time.** E up to F is 1 semitone but the pattern asks for a tone, so raise F to F♯. F♯ up to G is 1 semitone, as the pattern asks. You get E F♯ G.',
      '**Take note 3, the mediant.** Note 3 is G. The major key on G uses the same seven notes, so the relative major is G major.',
      '**Check another way: count 3 semitones up.** Letters up from E: E, F, G. Piano keys up from E: E, F, F♯, G is 3 steps. It is G again.',
    ),

    h('The method: the parallel key'),
    p('The example finds the parallel minor of A major. Steps 2 to 4 find the signature of A major, with the steps from the Key signatures lesson. Steps 5 to 7 find the signature of A minor, through its relative major. Step 8 compares the two. If you start from a minor key, change minor to major in step 1, and then do the same work: both signatures, then the comparison.'),
    steps(
      '**Keep the key note, change major to minor.** Parallel keys share a key note. The key note of A major is A, so keep A and change major to minor: A minor.',
      '**Decide whether the key has sharps or flats.** A major is in the list of sharp keys, so its signature has sharps.',
      '**Find the last sharp.** It is the leading note, a semitone below the key note, so it uses the letter before A: G. G up to A is 2 semitones, which is 1 too many, so raise G with a sharp: G♯.',
      '**Count along the order of sharps.** Count along F C G D A E B until you reach G: F (1), C (2), G (3). A major has 3 sharps: F♯ C♯ G♯.',
      '**Count 3 letter names up from the minor key note.** A minor shares its signature with its relative major, 3 semitones higher. Count 3 letter names up from A, counting A as 1: A, B, C. The letter is C.',
      '**Count 3 semitones up from the minor key note.** Count up one piano key at a time: A, A♯, B, C is 3 steps. The relative major is C major.',
      '**Decide whether the relative major has sharps or flats.** C major is in neither list, so its signature is empty. A minor has no sharps or flats.',
      '**Compare the two key signatures.** A major has 3 sharps. A minor has none. Going from A major to A minor, the signature loses 3 sharps: 3 places towards the flats.',
      '**Check another way: compare notes 3, 6 and 7.** A minor is A major with notes 3, 6 and 7 lowered by a semitone. They change from C♯ F♯ G♯ to C F G. Each lowered note takes away a sharp or adds a flat.',
    ),

    h('The method: closely related keys'),
    p('The example lists the closely related keys of C major.'),
    steps(
      '**List the five keys to find.** The relative key, the key a perfect 5th above and its relative, the key a perfect 5th below and its relative.',
      '**Count 3 letter names down from the major key note.** This finds the relative minor of C major. Count down from C, counting C as 1: C, B, A. The letter is A.',
      '**Count 3 semitones down from the major key note.** Count down one piano key at a time: C, B, A♯, A is 3 steps. The relative minor is A minor. (From a minor key, count up instead, to find its relative major.)',
      '**Go up a perfect 5th from the key note.** Count 5 letter names: C, D, E, F, G. Count 7 piano keys: C up to G is 7 steps. This key has one more sharp (or one fewer flat): G major.',
      '**Count 3 letter names down from the new key note.** This finds the relative minor of G major: G, F, E. The letter is E.',
      '**Count 3 semitones down from the new key note.** G, F♯, F, E is 3 steps. The relative minor is E minor.',
      '**Go down a perfect 5th from the key note.** Count 5 letter names down: C, B, A, G, F. Count 7 piano keys down: C down to F is 7 steps. This key has one more flat (or one fewer sharp): F major.',
      '**Count 3 letter names down from the new key note.** This finds the relative minor of F major: F, E, D. The letter is D.',
      '**Count 3 semitones down from the new key note.** F, E, D♯, D is 3 steps. The relative minor is D minor.',
      '**Check another way: compare the key signatures.** C major and A minor have no signs. G major and E minor have 1 sharp. F major and D minor have 1 flat. Each differs from C major by one sign at most.',
    ),

    h('Worked examples'),
    p('First the relative keys: one from major to minor, one from minor to major, and one in a flat key.'),
    worked(relativeKeyExample(key('G', 'major'), 'relative')),
    worked(relativeKeyExample(key('E', 'minor'), 'relative')),
    worked(relativeKeyExample(key('Eb', 'major'), 'relative')),
    p('Now parallel keys, where the signature changes. The first goes from major to minor, the second from minor to major.'),
    worked(relativeKeyExample(key('A', 'major'), 'parallel')),
    worked(relativeKeyExample(key('E', 'minor'), 'parallel')),
    p('And closely related keys: one with no signs and one in a flat key.'),
    worked(relativeKeyExample(key('C', 'major'), 'closely-related')),
    worked(relativeKeyExample(key('Eb', 'major'), 'closely-related')),

    h('Common mistakes'),
    watch('**Mixing up relative and parallel.** What is the relative minor of C major? Wrong: C minor, which has the same key note (that is the parallel minor). Right: A minor, which has the same signature (no sharps or flats).'),
    watch('**Counting note 6 from the wrong place.** The relative minor of G major is note 6. Wrong: counting G as 0, which gives F♯. Right: G (1), A (2), B (3), C (4), D (5), E (6), so the relative minor is E minor.'),
    watch('**Going the wrong way.** What is the relative minor of G major? Wrong: 3 semitones up from G, which gives B♭. Right: 3 semitones down, G, F♯, F, E, which gives E minor. The minor key note is always the lower one.'),
    watch('**Leaving out relatives when listing closely related keys.** For C major, the wrong list is G major and F major. The right list has five keys: A minor, G major, E minor, F major and D minor.'),

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
    p('A **scale degree** is the position of a note in its scale: the 1st degree is the key note, the 2nd degree is the next note up, and so on to the 7th. Each degree also has a traditional name. The 1st is the tonic and the 5th is the dominant. Musicians use these names to talk about harmony and to analyse music, so it pays to know them well.'),
    p('The numbers say where a note is. The names say what job it does in the key.'),
    words(
      { term: 'Scale degree', meaning: 'A note\'s position in the scale, counting the key note as 1. The 5th degree is the 5th note.' },
      { term: 'Key note (tonic)', meaning: 'The note a scale or key starts on and is named after. It is note 1 of the scale.' },
      { term: 'Major scale', meaning: 'The scale whose steps go tone, tone, semitone, tone, tone, tone, semitone.' },
      { term: 'Natural minor scale', meaning: 'The basic minor scale. Its steps go tone, semitone, tone, tone, semitone, tone, tone.' },
      { term: 'Semitone', meaning: 'The smallest step in Western music: from one piano key to the very next key, black or white.' },
      { term: 'Tone', meaning: 'A step of two semitones, such as C up to D.' },
      { term: 'Sharp (♯)', meaning: 'A sign that raises a note by one semitone. F♯ is one semitone higher than F.' },
      { term: 'Flat (♭)', meaning: 'A sign that lowers a note by one semitone. B♭ is one semitone lower than B.' },
      { term: 'Perfect 5th', meaning: 'An interval of 5 letter names (counting both notes) and 7 semitones, such as C up to G.' },
      { term: 'Supertonic', meaning: 'The 2nd degree of a scale. "Super" means above: it is one step above the tonic.' },
      { term: 'Mediant', meaning: 'The 3rd degree of a scale. It is halfway, or in the middle, between the tonic and the dominant.' },
      { term: 'Subdominant', meaning: 'The 4th degree of a scale. "Sub" means below: it is a perfect 5th below the tonic, as the dominant is a 5th above.' },
      { term: 'Dominant', meaning: 'The 5th degree of a scale, a perfect 5th above the tonic. After the tonic it is the most important note.' },
      { term: 'Submediant', meaning: 'The 6th degree of a scale. It is a 3rd below the tonic, as the mediant is a 3rd above.' },
      { term: 'Leading note', meaning: 'A 7th note that is a semitone below the key note. It sounds as if it wants to rise, or "lead", to the key note.' },
      { term: 'Subtonic', meaning: 'The name for the 7th note when it is a tone below the key note, as in the natural minor scale.' },
    ),

    h('The facts: the seven names'),
    p('Here are the names in order, with an example in D major and in A natural minor. Number the notes from the key note, which is degree 1.'),
    table(['Degree', 'Name', 'In D major', 'In A natural minor'], degreeRows, 'Degree names. Only the 7th has two names.'),
    remember('**1 tonic, 2 supertonic, 3 mediant, 4 subdominant, 5 dominant, 6 submediant, 7 leading note** (or **subtonic** in natural minor).'),
    p('A memory aid for the order: *T*en *S*mall *M*ice *S*at *D*own *S*inging *L*oudly. The first letters are T, S, M, S, D, S, L. Three of the names start with S, so also learn which is which: the 2nd is "super", and the 4th and 6th are "sub".'),

    h('What the names mean'),
    p('The names come in pairs. In the table, the first column counts up from the key note at the bottom of the scale. The second column counts down from the key note an octave higher, at the top of the scale. "Sub" means under.'),
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
    p('The 7th note of a major scale is a semitone below the key note. It is called the leading note, because many people feel it "leads" up to the key note. The 7th note of the natural minor scale is a tone below the key note. It is called the subtonic. In the harmonic minor scale the 7th is raised by a semitone, so it is a leading note again.'),
    p('So the rule is about the gap: a semitone below the key note is a leading note, and a tone below is a subtonic. Take A: the 7th note of A natural minor is G, a tone below A, so it is a subtonic. In A harmonic minor it is G♯, a semitone below A, so it is a leading note.'),

    h('The method: finding the note for a degree name'),
    p('The example is "the dominant of D major". For a minor key, use the natural minor pattern in step 4.'),
    steps(
      '**Turn the name into a number.** Use the list: tonic 1, supertonic 2, mediant 3, subdominant 4, dominant 5, submediant 6, leading note or subtonic 7. The dominant is number 5.',
      '**Write the key note.** This is note 1: D.',
      '**Write the letter names.** You need notes 1 up to your number only. For 5, write 5 letter names in alphabetical order, starting on D: D E F G A.',
      '**Write the major pattern.** Use the first steps of tone, tone, semitone, tone, tone, tone, semitone: one for each gap between your letters, so 4 for the dominant. For a minor key, write the natural minor pattern instead: tone, semitone, tone, tone, semitone, tone, tone.',
      '**Work out each gap, one at a time.** For each gap, count the semitones from the note you have to the next letter. If the pattern asks for a bigger gap, raise the new note with a sharp. If it asks for a smaller gap, lower it with a flat. If it is right, leave the note natural. In D major, E to F is 1 semitone but the pattern asks for a tone, so F becomes F♯.',
      '**Take the note with that number.** Note 5 of D major is A. The dominant is A.',
      '**Check another way.** Add up the pattern steps from note 1 to your note: tone, tone, semitone, tone is 2 + 2 + 1 + 2 = 7 semitones. Count up one piano key at a time from the key note: D, D♯, E, F, F♯, G, G♯, A is 7 steps. For the 7th degree, instead measure the gap from note 7 up to the key note: a semitone for a leading note, a tone for a subtonic.',
    ),

    h('The method: naming a degree'),
    p('The example is "what is the 4th note of G major called, and which note is it?"'),
    steps(
      '**Look up the name of degree 4.** Use the same list. Number 4 is the subdominant.',
      '**Write the key note.** This is note 1: G.',
      '**Write the letter names.** Write 4 letter names, starting on G: G A B C.',
      '**Write the major pattern.** Use the first 3 steps: tone, tone, semitone.',
      '**Work out each gap, one at a time.** G up to A, A up to B and B up to C all match the pattern, so every note stays natural.',
      '**Measure the gap from note 7 to the key note.** Only when the degree is the 7th. A 7th a semitone below the key note is a leading note. A 7th a tone below is a subtonic.',
      '**Take the note with that number.** Note 4 of G major is C. The subdominant is C.',
      '**Check another way.** Note 4 of a major scale is 5 semitones above the key note: tone, tone, semitone is 2 + 2 + 1 = 5. Count up from G: G, G♯, A, A♯, B, C is 5 steps.',
    ),

    h('Worked examples'),
    p('The first two find the note for a name in a major key. The third goes the other way: it names a degree.'),
    worked(scaleDegreeExample(key('D', 'major'), 5)),
    worked(scaleDegreeExample(key('Bb', 'major'), 6)),
    worked(scaleDegreeExample(key('G', 'major'), 4, 'name')),
    p('The 7th degree has two names. Here it is as a leading note (major) and as a subtonic (natural minor).'),
    worked(scaleDegreeExample(key('Eb', 'major'), 7)),
    worked(scaleDegreeExample(key('A', 'minor'), 7)),
    p('And a minor key, where the notes are different from the major scale on the same key note.'),
    worked(scaleDegreeExample(key('C', 'minor'), 3)),

    h('Common mistakes'),
    watch('**Counting the key note as 0.** What is the dominant of D major? Wrong: counting D as 0 gives B. Right: D (1), E (2), F♯ (3), G (4), A (5). The dominant is A.'),
    watch('**Mixing up subdominant and submediant.** In C major, the subdominant is the 4th note, F, and the submediant is the 6th note, A. Wrong: calling A the subdominant. Dominant is the 5th, so the subdominant is the note just below it.'),
    watch('**Using the major scale for a minor key.** What is the mediant of C minor? Wrong: E, from the C major scale. Right: E♭, from the C natural minor scale, C D E♭.'),
    watch('**Calling the 7th a leading note in natural minor.** In A natural minor the 7th is G, a tone below A, so it is a subtonic. A leading note is a semitone below the key note, which in A would be G♯.'),

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
    p('An **interval** is the distance between two notes. Every interval has a name in two parts: a number (a 2nd, a 3rd, a 5th) and a quality (major, minor, perfect, augmented or diminished). Together they make a name like "major 3rd" or "perfect 5th". Chords, melodies and harmony are all described with intervals, so naming them is a skill you will use again and again.'),
    p('If the two notes are played one after the other, the interval is melodic. If they are played at the same time, it is harmonic. The name is the same either way.'),
    words(
      { term: 'Interval', meaning: 'The distance between two notes. Its name has a quality and a number, as in "major 3rd".' },
      { term: 'Number (of an interval)', meaning: 'How many letter names the interval spans, counting both notes. C up to E is C, D, E: a 3rd.' },
      { term: 'Quality (of an interval)', meaning: 'The word before the number: major, minor, perfect, augmented or diminished. It comes from the number of semitones.' },
      { term: 'Major (interval)', meaning: 'The larger of the two normal sizes of a 2nd, 3rd, 6th or 7th. A major 3rd is 4 semitones.' },
      { term: 'Minor (interval)', meaning: 'The smaller of the two normal sizes of a 2nd, 3rd, 6th or 7th: one semitone less than major.' },
      { term: 'Perfect (interval)', meaning: 'The one normal size of a 4th, 5th or octave: 5, 7 and 12 semitones.' },
      { term: 'Augmented', meaning: 'One semitone bigger than a major or perfect interval.' },
      { term: 'Diminished', meaning: 'One semitone smaller than a minor or perfect interval.' },
      { term: 'Melodic interval', meaning: 'Two notes played one after the other.' },
      { term: 'Harmonic interval', meaning: 'Two notes played at the same time.' },
      { term: 'Semitone', meaning: 'The smallest step in Western music: from one piano key to the very next key, black or white.' },
      { term: 'Sharp (♯)', meaning: 'A sign that raises a note by one semitone. F♯ is one semitone higher than F.' },
      { term: 'Flat (♭)', meaning: 'A sign that lowers a note by one semitone. B♭ is one semitone lower than B.' },
      { term: 'Natural', meaning: 'A note with no sharp or flat, such as E or B.' },
      { term: 'Octave', meaning: 'The distance from a note to the next note with the same letter name: 8 letter names, or 12 semitones.' },
      { term: 'Inversion (of an interval)', meaning: 'Turning an interval upside down: the lower note moves up an octave, so it becomes the upper note.' },
    ),
    p('Here is the same interval, C and E, played both ways. It is a major 3rd.'),
    staffBlock(notesOnStaff('treble', [pit('C4'), pit('E4')]), 'A melodic interval: C then E, one after the other. It is a major 3rd.'),
    listenBlock('Hear C then E', melodyAudio([pit('C4'), pit('E4')])),
    staffBlock(chordsOnStaff('treble', [[pit('C4'), pit('E4')]]), 'A harmonic interval: C and E together. The same major 3rd.'),
    listenBlock('Hear C and E together', chordAudioBlock([pit('C4'), pit('E4')])),

    h('The facts: a two-step method'),
    remember('**Step 1, the number:** count the **letter names** from the lower note to the upper note, counting **both** ends. **Step 2, the quality:** count the **semitones** and look it up in the table.'),
    p('Step 1 is about letters. The notes use seven letter names, A B C D E F G, and after G they start again at A. C to E: C, D, E is three letter names, so it is a 3rd. Sharps and flats do not change this: C to E♭ is still a 3rd, because a sign changes the sound but not the letter.'),
    p('Step 2 is about semitones. The number alone does not say which 3rd you have. There are two kinds of 3rd, a minor 3rd (3 semitones) and a major 3rd (4 semitones). The semitone count tells you which.'),
    p('To count semitones between two natural letters, use the piano. E up to F and B up to C have no black key between them, so each is 1 semitone. Every other pair of neighbouring natural letters has one black key between them, so each is 2 semitones.'),
    table(['Interval', 'Short name', 'Semitones'], intervalTableRows(), 'The intervals to know, from a semitone to an octave.'),
    p('Learn the table by its pattern:'),
    list(
      '2nds, 3rds, 6ths and 7ths come in a major and a minor size. A minor interval is one semitone smaller than the major one.',
      '4ths, 5ths and the octave are perfect. They have one normal size.',
      'Augmented means one semitone bigger than major or perfect. Diminished means one semitone smaller than perfect or minor. The ones in the table (augmented 4th and diminished 5th) are the common ones. Others are rare.',
      'Two notes with the same name and pitch make a unison (P1, 0 semitones). Practice starts at the 2nd.',
    ),
    p('Here are the intervals on natural notes only. The same number can have different qualities, because of where the semitones fall:'),
    table(['Notes', 'Number', 'Semitones', 'Interval'], intervalRowsFromC, 'White-note intervals above C.'),
    table(['Notes', 'Number', 'Semitones', 'Interval'], intervalRowsFromD, 'White-note intervals above D. Compare the 3rd above C (major) with the 3rd above D (minor).'),

    h('Why the spelling matters'),
    p('C to F♯ and C to G♭ are the same two piano keys, six semitones apart. But they are different intervals, because the letters are different.'),
    staffBlock(notesOnStaff('treble', [pit('C4'), pit('F#4')]), 'C to F♯: letters C D E F, so a 4th. Six semitones makes it an augmented 4th (A4).'),
    staffBlock(notesOnStaff('treble', [pit('C4'), pit('Gb4')]), 'C to G♭: letters C D E F G, so a 5th. Six semitones makes it a diminished 5th (d5).'),
    p('A perfect 4th is 5 semitones, so 6 is one bigger: augmented. A perfect 5th is 7 semitones, so 6 is one smaller: diminished. Same sound, different spelling, different name.'),

    h('Inversion'),
    p('To invert an interval, take the lower note and move it up an octave, so that it becomes the upper note. Two things always happen: the numbers add up to 9 (a 3rd becomes a 6th) and the semitones add up to 12 (4 and 8). The quality flips as well:'),
    table(['Interval (semitones)', 'Inverts to (semitones)'], INVERSION_ROWS, 'Inversions of common intervals.'),
    remember('**Inversion:** the numbers add up to 9. **Major ↔ minor. Perfect stays perfect. Augmented ↔ diminished.** The semitones add up to 12.'),

    h('The method: naming an interval'),
    p('The example is the interval from D up to F♯.'),
    steps(
      '**Find the lower and upper notes.** An interval is measured from the lower note up. Here the lower note is D and the upper note is F♯.',
      '**Count the letter names.** Count from the lower letter to the upper letter, counting both ends: D, E, F is 3 letter names. The number is a 3rd. A sharp or flat never changes the letter, so it never changes the number.',
      '**Count the semitones, one pair of letters at a time.** Use the natural letters first and leave the signs until later. D up to E is 2 semitones. E up to F is 1 semitone. Add them: 2 + 1 = 3.',
      '**Adjust for the sharp or flat.** A sign on the upper note moves it: a sharp on the upper note adds 1, and a flat on the upper note takes away 1. A sign on the lower note does the opposite: a sharp takes away 1 and a flat adds 1. F♯ is a sharp on the upper note, so 3 + 1 = 4.',
      '**Look up the quality.** The number is 3 and the semitones are 4. In the table, that is a major 3rd.',
      '**Check another way: count piano keys.** Count up one piano key at a time from D to F♯, without using the letter pairs: D, D♯, E, F, F♯ is 4 steps, so 4 semitones. It is a major 3rd again.',
    ),

    h('The method: building an interval'),
    p('The example is a major 3rd above B♭.'),
    steps(
      '**Look up the interval.** Find how many letter names and how many semitones it needs. A major 3rd is 3 letter names and 4 semitones. Note which way you go, up or down.',
      '**Count the letter names up.** Count up from the start letter, counting it as 1: B, C, D. The new note must use the letter D, whatever sign it needs. To go below the note, count the letter names down instead.',
      '**Count the semitones, one pair of letters at a time.** Use the natural letters first. B up to C is 1 semitone. C up to D is 2 semitones. Add them: 1 + 2 = 3.',
      '**Adjust for the sharp or flat.** Only if your start note has a sign. Going up, a flat on the start note makes the distance 1 bigger and a sharp makes it 1 smaller. Going down, it is the other way round. B♭ is a flat, so 3 + 1 = 4.',
      '**Fix the sign on the new note.** Compare what you have with what you need. Here you need 4 and have 4, so D stays natural. If the new note is too close to the start, move it further away: raise it with a sharp going up, lower it with a flat going down. If it is too far, move it closer.',
      '**Check another way: count piano keys.** Count up one piano key at a time from B♭ to D: B♭, B, C, D♭, D is 4 steps, so 4 semitones, as a major 3rd needs.',
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
    watch('**Not counting both ends.** What is the number from C up to E? Wrong: 2nd, from counting the steps C to D and D to E. Right: 3rd, from counting the letters C, D, E. Count the lower note as 1.'),
    watch('**Using semitones to find the number.** C up to G♭ and C up to F♯ are both 6 semitones. Wrong: calling C to G♭ a 4th. Right: C, D, E, F, G is five letters, so C to G♭ is a diminished 5th. C to F♯ is an augmented 4th.'),
    watch('**Using the wrong letter when building.** What is a perfect 5th above F♯? Wrong: D♭, which is the right piano key but a 6th. Right: C♯. Count the letters first (F, G, A, B, C), then fix the sign.'),
    watch('**Forgetting the two natural semitones.** E up to G is 3 semitones, not 4. Wrong: calling it a major 3rd. Right: E to F is only 1 semitone and F to G is 2, so E to G is a minor 3rd. C to E is a major 3rd.'),

    h('Try it'),
    p('When you name an interval on the staff, the easy level asks only for the number, and the medium and hard levels add the quality. Questions that ask you to build a note above or below another appear at every level.'),
    practise({ label: 'Practise intervals (easy)', topics: ['intervals'], level: 1 }),
    practise({ label: 'Practise intervals with quality (medium)', topics: ['intervals'], level: 2 }),
    practise({ label: 'Practise intervals including augmented and diminished (hard)', topics: ['intervals'], level: 3 }),
  ],
}

export const SCALES_INTERVALS_LESSONS: LibraryLesson[] = [MINOR_SCALES, PENTATONIC_BLUES, KEY_SIGNATURES, RELATED_KEYS, SCALE_DEGREES, INTERVALS]
