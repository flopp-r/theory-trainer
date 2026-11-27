import {
  type Chord,
  type ChordQuality,
  type ClefName,
  type NoteName,
  chordNotes,
  chordSymbol,
  identifyChord,
  inversionFigure,
  inversionName,
  letterAt,
  letterIndex,
  parseChordSymbol,
  sameNote,
  withoutOctave,
} from '../../../theory'
import { chordWords } from '../../../questions/chords'
import { noteLabel, notesLabel } from '../../../questions/pitchTools'
import type { WorkedExample, WorkedStep, WorkedTerm } from '../types'
import { listenChord } from './audio'
import { chordsOnStaff } from './common'
import {
  type Role,
  Explained,
  ROLES,
  TERM,
  andList,
  article,
  countsText,
  assertSameNotes,
  capital,
  chordPicture,
  chordTypeTerm,
  countStep,
  finish,
  intervalTerm,
  isSeventhQuality,
  isTriadQuality,
  letterNumber,
  letterStep,
  nameNotesStep,
  neighbourWalks,
  ordinal,
  qualityFromSemitones,
  qualityPhrase,
  recipeCounts,
  signTerms,
  spellNoteSteps,
} from './chords'

/*
 * Worked examples for inversions and chord symbols.
 * The long-hand working finds the root by testing which note has the others stacked above it in 3rds,
 * then counts semitones to name the chord. Everything is cross-checked against the theory engine.
 */

const ROLE = ['root', '3rd', '5th', '7th'] as const

/** Hand-written figured bass labels. */
const FIGURES = { triad: ['5/3', '6', '6/4'], seventh: ['7', '6/5', '4/3', '4/2'] } as const

/** Hand-written: the full figure (every interval above the bass) and the short form used in this app. */
const SHORT_FIGURE: Record<string, string> = { '5/3': '5/3', '6/3': '6', '6/4': '6/4', '7/5/3': '7', '6/5/3': '6/5', '6/4/3': '4/3', '6/4/2': '4/2' }

/** Hand-written chord symbol endings (the same ones the app uses). */
export const SYMBOL_CODE: Record<ChordQuality, string> = {
  major: '',
  minor: 'm',
  diminished: 'dim',
  augmented: 'aug',
  dominant7: '7',
  major7: 'maj7',
  minor7: 'm7',
  'half-diminished7': 'm7b5',
  diminished7: 'dim7',
}

/** What each ending means, in words. */
export const SYMBOL_MEANING: Record<ChordQuality, string> = {
  major: 'a major triad (major is the only type with no ending)',
  minor: 'a minor triad',
  diminished: 'a diminished triad',
  augmented: 'an augmented triad',
  dominant7: 'a dominant 7th chord: a major triad with a minor 7th added',
  major7: 'a major 7th chord: a major triad with a major 7th added',
  minor7: 'a minor 7th chord: a minor triad with a minor 7th added',
  'half-diminished7': 'a half-diminished 7th chord: read it as "minor 7th with a flattened 5th", which makes the triad diminished',
  diminished7: 'a diminished 7th chord: a diminished triad with a diminished 7th added',
}

const INVERSION_ORDER = ['root position', 'first inversion', 'second inversion', 'third inversion']
const INVERSION_TERM = [TERM.rootPosition, TERM.firstInversion, TERM.secondInversion, TERM.thirdInversion]
const MOVES = ['no times', 'once', 'twice', 'three times']

/** "E, F, G" : the letter names from one note up to another, both counted. */
function lettersUpTo(from: NoteName, to: NoteName): string {
  return Array.from({ length: letterNumber(from, to) }, (_, i) => letterAt(letterIndex(from.letter) + i)).join(', ')
}

export interface StackAnalysis {
  /** The notes of the chord stacked in 3rds from the root, root first. */
  readonly stack: NoteName[]
  /** One step for each note tried as the root, up to and including the one that works. */
  readonly tries: WorkedStep[]
  /** The counting steps, from the root to each other note. */
  readonly countSteps: WorkedStep[]
  /** Semitones from the root to each other note in the stack. */
  readonly counts: number[]
  /** Interval names from the root to each other note. */
  readonly names: string[]
  readonly quality: ChordQuality
  /** Which note of the stack is lowest as written: 0 = root ... */
  readonly inversion: number
}

/** Finds the root of notes written bottom to top (in any inversion), names the chord and says which inversion it is. */
export function analyseStack(written: readonly NoteName[], ex: Explained): StackAnalysis {
  const size = written.length
  if (size !== 3 && size !== 4) throw new Error('A chord here has three or four notes')
  const wanted = size === 3 ? [3, 5] : [3, 5, 7]
  const wantedWords = size === 3 ? 'a 3rd and a 5th' : 'a 3rd, 5th and 7th'
  const tries: WorkedStep[] = []
  const found: number[] = []
  for (let i = 0; i < size; i++) {
    const candidate = written[i]!
    const others = written.filter((_, j) => j !== i).sort((a, b) => letterNumber(candidate, a) - letterNumber(candidate, b))
    const sizes = others.map((n) => letterNumber(candidate, n))
    const ok = sizes.every((s, k) => s === wanted[k])
    if (found.length === 0) {
      const c = noteLabel(candidate)
      const counted = others.map((n) => `${noteLabel(n)} is a ${ordinal(letterNumber(candidate, n))} (${lettersUpTo(candidate, n)})`).join('; ')
      const lettersOnly = candidate.accidental !== 0 ? ex.once('letters-only', ' (sharps and flats do not change the letter count)') : ''
      tries.push({
        title: `Try ${c} as the root`,
        text: `Count letter names up from ${candidate.letter}, counting ${candidate.letter} as 1${lettersOnly}: ${counted}. ${
          ok ? `That is ${wantedWords}, so the notes are stacked in 3rds on ${c}.` : `A root needs ${wantedWords} above it, so ${c} is not the root.`
        }`,
        result: ok ? `Root: ${c}` : `${c} is not the root`,
      })
    }
    if (ok) found.push(i)
  }
  if (found.length !== 1) throw new Error(`Could not find one root for ${notesLabel(written)}`)
  const root = written[found[0]!]!
  const stack = [...written].sort((a, b) => letterNumber(root, a) - letterNumber(root, b))
  const steps = stack.slice(1).map((n, i) => countStep(root, n, ex, `Count from the root up to the ${ROLES[i]!}, ${noteLabel(n)}`))
  const counts = steps.map((s) => s.total)
  const quality = qualityFromSemitones(counts)
  if (!quality) throw new Error(`${notesLabel(stack)} is not one of the supported chords (${counts.join(', ')})`)
  const engine = identifyChord(stack)
  if (!engine || engine.quality !== quality || !sameNote(engine.root, root)) throw new Error(`Working says ${quality} but the engine disagrees for ${notesLabel(stack)}`)
  const inversion = stack.findIndex((n) => sameNote(n, written[0]!))
  return { stack, tries, countSteps: steps.flatMap((s) => s.steps), counts, names: steps.map((s) => s.name), quality, inversion }
}

/** The steps after the tries: stack from the root, count, and name the chord. */
function nameChordSteps(a: StackAnalysis, ex: Explained): WorkedStep[] {
  const root = a.stack[0]!
  const label = chordWords({ root, quality: a.quality })
  return [
    {
      title: 'Stack the notes in 3rds from the root',
      text: `Write the notes again starting from ${noteLabel(root)}, each one a 3rd above the one before. This is the chord in root position${a.inversion === 0 ? ', the same order as written' : ''}.`,
      result: notesLabel(a.stack),
    },
    ...a.countSteps,
    {
      title: 'Match the counts to a chord type',
      text: `${countsText(a.stack.length, a.counts, a.quality, ex)} The root is ${noteLabel(root)}.`,
      result: `${article(qualityPhrase(a.quality))}: ${label}`,
    },
  ]
}

/** Terms shared by the inversion and symbol examples. */
function chordTerms(a: StackAnalysis, written: readonly NoteName[]): WorkedTerm[] {
  return [
    TERM.root,
    TERM.stacked,
    TERM.third,
    TERM.fifth,
    ...(a.stack.length === 4 ? [TERM.seventh] : []),
    TERM.semitone,
    ...a.names.map(intervalTerm),
    chordTypeTerm(a.quality),
    ...signTerms(written).filter((t) => t !== TERM.natural),
  ]
}

/** The notes at each stage of moving the bottom note to the top. */
function rotations(stack: readonly NoteName[], times: number): NoteName[][] {
  const out: NoteName[][] = []
  let current = [...stack]
  for (let k = 0; k < times; k++) {
    current = [...current.slice(1), current[0]!]
    out.push(current)
  }
  return out
}

function figureFor(quality: ChordQuality, inversion: number): string {
  const f = (isSeventhQuality(quality) ? FIGURES.seventh : FIGURES.triad)[inversion]
  if (f === undefined) throw new Error('No such inversion')
  if (f !== inversionFigure(quality, inversion)) throw new Error('Figured bass disagrees with the engine')
  return f
}

/**
 * Find the inversion of a chord written on a staff.
 * Working: find the root by testing each note, name the chord, then see which chord note is lowest.
 * Check: turn the root-position chord over, one note at a time.
 * Cross-check: the engine's `identifyChord`, `inversionName` and `inversionFigure`.
 */
export function inversionExample(chord: Chord, inversion: number, clef: ClefName = 'treble'): WorkedExample {
  const ex = new Explained()
  const pitches = chordPicture(chord, clef, inversion)
  const written = pitches.map(withoutOctave)
  const a = analyseStack(written, ex)
  if (a.inversion !== inversion || a.quality !== chord.quality || !sameNote(a.stack[0]!, chord.root)) {
    throw new Error(`Inversion working for ${notesLabel(written)} disagrees with the chord that was asked for`)
  }
  assertSameNotes('inversion stack', a.stack, chordNotes(chord))
  const name = INVERSION_ORDER[inversion]!
  if (inversionName(inversion) !== name) throw new Error('Inversion name disagrees with the engine')
  const figure = figureFor(chord.quality, inversion)
  const label = chordWords(chord)
  const bass = written[0]!
  const role = ROLE[inversion]!

  // Figured bass, worked out by counting letter names above the bass note.
  const above = written.slice(1).map((n) => ({ n, number: letterNumber(bass, n) }))
  const full = [...new Set(above.map((x) => x.number))].sort((x, y) => y - x).join('/')
  if (SHORT_FIGURE[full] !== figure) throw new Error(`Figured bass: counting gives ${full}, which does not shorten to ${figure}`)
  const figureText = `${above
    .sort((x, y) => x.number - y.number)
    .map((x) => `${noteLabel(x.n)} is a ${ordinal(x.number)} (${lettersUpTo(bass, x.n)})`)
    .join('; ')}. Written from the largest down, that is ${full}${full === figure ? '.' : `, which is shortened to ${figure}.`}`

  const moves = rotations(a.stack, inversion)
  if (moves.length > 0) assertSameNotes('turned chord', moves.at(-1)!, written)
  const checkText =
    inversion === 0
      ? `Root position needs no moves: the notes stacked in 3rds from the root, ${notesLabel(a.stack)}, are already in the order written, lowest first.`
      : `Start from root position, ${notesLabel(a.stack)}. Move the bottom note up to the top ${MOVES[inversion]}: ${moves.map((m) => notesLabel(m)).join(', then ')}. That is the order written, lowest first.`

  return finish({
    title: `Find the inversion of ${label}${inversion > 0 ? ` (${name})` : ''}`,
    task: 'Look at the chord on the staff. Which inversion is it in?',
    terms: [
      ...chordTerms(a, written),
      TERM.bass,
      TERM.inversion,
      ...INVERSION_TERM.slice(0, a.stack.length === 4 ? 4 : 3),
      TERM.figuredBass,
    ],
    steps: [
      nameNotesStep(pitches, clef),
      ...a.tries,
      ...nameChordSteps(a, ex),
      {
        title: 'Find the bass note',
        text: `The bass note${ex.once('bass', ' (the lowest note)')} is ${noteLabel(bass)}. In ${label}, stacked from the root (${notesLabel(a.stack)}), ${noteLabel(bass)} is the ${role}.`,
        result: `Bass note: ${noteLabel(bass)}, the ${role}`,
      },
      {
        title: 'Name the inversion from the bass note',
        text: `Root in the bass: root position. 3rd in the bass: first inversion. 5th in the bass: second inversion. 7th in the bass: third inversion (7th chords only). Here the ${role} is in the bass.`,
        result: capital(name),
      },
      {
        title: 'Write the figured bass',
        text: `Figured bass counts letter names up from the bass note, ${noteLabel(bass)}, counting it as 1. ${figureText}`,
        result: `Figured bass: ${figure}`,
      },
      {
        title: 'Check another way: turn the chord over',
        text: checkText,
        result: inversion === 0 ? 'No moves: root position, as found' : `Turned ${MOVES[inversion]!}: ${name}, as found`,
      },
    ],
    answer: `${label} in ${name} (${noteLabel(bass)} in the bass${inversion === 0 ? ', which is the root' : ''}). Figured bass: ${figure}.`,
  })
}

/** The chord symbol, put together by hand: root, then the ending for the type, then a slash and the bass note if inverted. */
export function handChordSymbol(chord: Chord, inversion: number): string {
  const base = `${noteLabel(chord.root)}${SYMBOL_CODE[chord.quality]}`
  const symbol = inversion === 0 ? base : `${base}/${noteLabel(chordNotes(chord)[inversion]!)}`
  const engine = chordSymbol(chord, { inversion, style: 'symbol' })
  if (engine !== symbol) throw new Error(`Chord symbol "${symbol}" disagrees with the engine's "${engine}"`)
  return symbol
}

/** The check shared by the symbol examples: the 3rds of the chord counted by piano keys match the ending. */
function symbolCheck(stack: readonly NoteName[], quality: ChordQuality, code: string, ex: Explained): WorkedStep {
  const walks = neighbourWalks(stack, ex)
  const expected = recipeCounts(quality).map((c, i, all) => c - (i === 0 ? 0 : all[i - 1]!))
  if (walks.sizes.join(',') !== expected.join(',')) throw new Error('The piano-key check does not match the chord type')
  return {
    title: 'Check another way: count the 3rds by piano keys',
    text: `Count up one piano key at a time. ${walks.text} Added up from the root: ${walks.sizes
      .map((_, i) => walks.sizes.slice(0, i + 1).reduce((x, y) => x + y, 0))
      .join(', ')}.`,
    result: `${walks.sizes.join(' then ')}: ${qualityPhrase(quality)}, as ${code === '' ? 'no ending means' : `the ending ${code} says`}`,
  }
}

/**
 * Write the chord symbol (with a slash if the chord is inverted) for a chord on a staff.
 * Working: find the root and type as in `inversionExample`, then add the ending and the bass note.
 * Check: the 3rds by piano keys. Cross-check: the engine's `chordSymbol`, and `parseChordSymbol` reading it back.
 */
export function chordSymbolExample(chord: Chord, inversion: number, clef: ClefName = 'treble'): WorkedExample {
  const ex = new Explained()
  const pitches = chordPicture(chord, clef, inversion)
  const written = pitches.map(withoutOctave)
  const a = analyseStack(written, ex)
  if (a.inversion !== inversion || a.quality !== chord.quality || !sameNote(a.stack[0]!, chord.root)) {
    throw new Error('Chord symbol working disagrees with the chord that was asked for')
  }
  const symbol = handChordSymbol(chord, inversion)
  const back = parseChordSymbol(chordSymbol(chord, { inversion }))
  if (back.inversion !== inversion || back.chord.quality !== chord.quality || !sameNote(back.chord.root, chord.root)) {
    throw new Error('Reading the symbol back does not give the same chord')
  }
  const root = a.stack[0]!
  const bass = written[0]!
  const code = SYMBOL_CODE[chord.quality]
  const base = `${noteLabel(root)}${code}`
  const label = chordWords(chord)

  return finish({
    title: `Write the chord symbol${inversion > 0 ? ' (an inverted chord)' : ''}: ${symbol}`,
    task: `Write the chord symbol for the chord on the staff.${inversion > 0 ? ' It is not in root position, so show the bass note with a slash.' : ''}`,
    terms: [...chordTerms(a, written), TERM.symbol, TERM.bass, ...(inversion > 0 ? [TERM.slash, TERM.inversion, INVERSION_TERM[inversion]!] : [TERM.rootPosition])],
    steps: [
      nameNotesStep(pitches, clef),
      ...a.tries,
      ...nameChordSteps(a, ex),
      {
        title: 'Write the root, then the ending',
        text: `A chord symbol${ex.once('symbol', ' (a short name for a chord)')} starts with the root, ${noteLabel(root)}. Then comes the ending for the type. ${
          code === ''
            ? `A major triad has no ending, so the symbol is just the root.`
            : `The ending for a ${qualityPhrase(chord.quality)} is ${code}.${chord.quality === 'half-diminished7' ? ' Read it as "minor 7th with a flattened 5th": the b stands for a flat.' : ''}`
        }`,
        result: `So far: ${base}`,
      },
      inversion === 0
        ? {
            title: 'Look at the bass note',
            text: `The bass note${ex.once('bass', ' (the lowest note)')} is ${noteLabel(bass)}, which is the root. The chord is in root position, so nothing more is added.`,
            result: `Symbol: ${symbol}`,
          }
        : {
            title: 'Look at the bass note',
            text: `The bass note${ex.once('bass', ' (the lowest note)')} is ${noteLabel(bass)}, the ${ROLE[inversion]} of the chord, not the root. So the chord is in ${INVERSION_ORDER[inversion]}. Add a slash and the bass note: this makes a slash chord, read as "${label} with ${noteLabel(bass)} in the bass".`,
            result: `Symbol: ${symbol}`,
          },
      symbolCheck(a.stack, chord.quality, code, ex),
    ],
    answer: `The chord symbol is ${symbol}.`,
  })
}

/** Splits a symbol such as "E♭m7/G♭" into root, ending and slash note (hand-written reading of the symbol). */
function splitSymbol(symbol: string): { root: string; code: string; slash: string | null } {
  const match = /^([A-G][♯♭]*)([^/]*)(?:\/([A-G][♯♭]*))?$/.exec(symbol)
  if (!match) throw new Error(`Cannot split chord symbol ${symbol}`)
  return { root: match[1]!, code: match[2] ?? '', slash: match[3] ?? null }
}

/**
 * Read a chord symbol and write the chord (spelling it, putting the slash note in the bass, drawing it).
 * Working: spell the chord by counting semitones by letters, then turn it until the slash note is lowest.
 * Check: the 3rds by piano keys. Cross-check: the engine's `parseChordSymbol` and `chordNotes`.
 */
export function readChordSymbolExample(chord: Chord, inversion: number, clef: ClefName = 'treble'): WorkedExample {
  const ex = new Explained()
  const symbol = handChordSymbol(chord, inversion)
  const parts = splitSymbol(symbol)
  const type = (Object.keys(SYMBOL_CODE) as ChordQuality[]).find((q) => SYMBOL_CODE[q] === parts.code.replace('♭', 'b'))
  if (type !== chord.quality) throw new Error('Reading the ending of the symbol gives a different chord type')
  const engine = parseChordSymbol(chordSymbol(chord, { inversion }))
  if (engine.inversion !== inversion || engine.chord.quality !== chord.quality || !sameNote(engine.chord.root, chord.root)) {
    throw new Error('The engine reads the symbol differently')
  }
  if (!isTriadQuality(chord.quality) && !isSeventhQuality(chord.quality)) throw new Error('Unsupported chord type')

  const counts = recipeCounts(chord.quality)
  const { step: lettersStep } = letterStep(chord.root, counts.length + 1, ex)
  const spelled = counts.map((wanted, i) => spellNoteSteps(chord.root, ROLES[i] as Role, wanted, ex))
  const stack = [chord.root, ...spelled.map((s) => s.note)]
  assertSameNotes(symbol, stack, chordNotes(chord))

  const pitches = chordPicture(chord, clef, inversion)
  const written = pitches.map(withoutOctave)
  const moves = rotations(stack, inversion)
  assertSameNotes(`${symbol} as written`, moves.at(-1) ?? stack, written)
  const label = chordWords(chord)
  const bass = written[0]!
  const seventh = counts.length === 3
  const countsText = seventh
    ? `the 3rd is ${counts[0]}, the 5th is ${counts[1]} and the 7th is ${counts[2]} semitones above the root`
    : `the 3rd is ${counts[0]} and the 5th is ${counts[1]} semitones above the root`

  const moveSteps: WorkedStep[] = moves.map((m, k) => {
    const before = k === 0 ? stack : moves[k - 1]!
    return {
      title: `Move ${noteLabel(before[0]!)} to the top`,
      text: `The slash asks for ${parts.slash ?? ''} at the bottom, and ${noteLabel(before[0]!)} is at the bottom now. Move it up an octave (to the next note with the same letter name), so it sits on top.`,
      result: `${notesLabel(m)}${sameNote(m[0]!, bass) ? `: ${noteLabel(bass)} is now the bass note` : ''}`,
    }
  })

  return finish({
    title: `Read a chord symbol and write the chord: ${symbol}`,
    task: `Spell the chord ${symbol} and write it on the staff${inversion > 0 ? ', with the bass note the symbol asks for' : ''}.`,
    terms: [
      TERM.symbol,
      TERM.root,
      chordTypeTerm(chord.quality),
      TERM.stacked,
      TERM.semitone,
      ...(inversion > 0 ? [TERM.slash, TERM.bass, TERM.octave] : [TERM.rootPosition]),
      ...signTerms(stack),
    ],
    steps: [
      {
        title: 'Split the symbol into its parts',
        text: `A chord symbol${ex.once('symbol', ' (a short name for a chord)')} is the root, then an ending for the type${parts.slash ? ', then a slash and the bass note' : ''}. ${symbol} splits into ${andList([parts.root, parts.code === '' ? 'no ending' : parts.code, ...(parts.slash ? [`/${parts.slash}`] : [])])}.`,
        result: `Root ${parts.root}, ending ${parts.code === '' ? 'none' : parts.code}${parts.slash ? `, bass note ${parts.slash}` : ', no slash'}`,
      },
      {
        title: 'Read the ending',
        text: `${parts.code === '' ? 'No ending' : `The ending ${parts.code}`} means ${SYMBOL_MEANING[chord.quality]}. Counted in semitones${ex.once('semitone', ' (one piano key to the very next)')}, ${countsText}.`,
        result: `${capital(label)}: ${counts.map((c, i) => `${ROLES[i]} ${c}`).join(', ')} semitones up`,
      },
      lettersStep,
      ...spelled.flatMap((s) => s.steps),
      {
        title: 'Write the chord in root position',
        text: `Put the notes in order from the root, ${noteLabel(chord.root)}, each a 3rd above the one before.${inversion === 0 ? ' There is no slash, so the root stays at the bottom.' : ''}`,
        result: notesLabel(stack),
      },
      ...moveSteps,
      {
        title: 'Write it on the staff',
        text: `Write the notes lowest first${inversion > 0 ? `, with ${noteLabel(bass)} at the bottom` : ''}. Press the button to hear it.`,
        result: notesLabel(written),
        staff: chordsOnStaff(clef, [pitches]),
        listen: listenChord(`Hear ${symbol}`, pitches),
      },
      symbolCheck(stack, chord.quality, parts.code, ex),
    ],
    answer: `${symbol} is ${notesLabel(written)}, written lowest first${inversion > 0 ? ` (${INVERSION_ORDER[inversion]})` : ' (root position)'}.`,
  })
}

