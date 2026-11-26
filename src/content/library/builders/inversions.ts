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
  letterIndex,
  parseChordSymbol,
  sameNote,
  withoutOctave,
} from '../../../theory'
import { chordWords } from '../../../questions/chords'
import { noteLabel, notesLabel } from '../../../questions/pitchTools'
import type { WorkedExample } from '../types'
import { listenChord } from './audio'
import { chordsOnStaff } from './common'
import {
  SEVENTH_NAME,
  SEVENTH_RECIPE,
  TRIAD_RECIPE,
  assertSameNotes,
  chordPicture,
  isSeventhQuality,
  isTriadQuality,
  ordinal,
  qualityFromSemitones,
  semitoneWorking,
  spellAbove,
} from './chords'

/*
 * Worked examples for inversions and chord symbols.
 * The long-hand working finds the root by testing which note has the others stacked above it in thirds,
 * then counts semitones to name the chord. Everything is cross-checked against the theory engine.
 */

const mod = (n: number, m: number) => ((n % m) + m) % m

const ROLE = ['root', '3rd', '5th', '7th'] as const

/** Hand-written figured bass labels. */
const FIGURES = { triad: ['5/3', '6', '6/4'], seventh: ['7', '6/5', '4/3', '4/2'] } as const

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

/** The words after the code in a symbol, in plain English. */
export const SYMBOL_MEANING: Record<ChordQuality, string> = {
  major: 'a major triad (no code is written)',
  minor: 'a minor triad',
  diminished: 'a diminished triad',
  augmented: 'an augmented triad',
  dominant7: 'a dominant 7th: a major triad with a minor 7th added',
  major7: 'a major 7th: a major triad with a major 7th added',
  minor7: 'a minor 7th: a minor triad with a minor 7th added',
  'half-diminished7': 'a half-diminished 7th: a diminished triad with a minor 7th added',
  diminished7: 'a diminished 7th: a diminished triad with a diminished 7th added',
}

/** "a major triad" or "a dominant 7th chord". */
export function qualityPhrase(quality: ChordQuality): string {
  return isTriadQuality(quality) ? `${quality} triad` : `${SEVENTH_NAME[quality as keyof typeof SEVENTH_NAME]} chord`
}

export interface StackAnalysis {
  /** The notes of the chord stacked in thirds from the root, root first. */
  readonly stack: NoteName[]
  /** The index of the root in the notes as written, bottom first. */
  readonly rootIndex: number
  /** One sentence for each note tried as the root, up to and including the one that works. */
  readonly tries: string[]
  /** Semitones from the root to each other note in the stack. */
  readonly counts: number[]
  readonly quality: ChordQuality
  /** The semitone working for each upper note. */
  readonly working: string[]
  /** Which note of the stack is lowest as written: 0 = root ... */
  readonly inversion: number
}

/** Finds the root of notes written bottom to top (in any inversion), names the chord and says which inversion it is. */
export function analyseStack(written: readonly NoteName[]): StackAnalysis {
  const size = written.length
  if (size !== 3 && size !== 4) throw new Error('A chord here has three or four notes')
  const wanted = size === 3 ? [3, 5] : [3, 5, 7]
  const tries: string[] = []
  const found: number[] = []
  for (let i = 0; i < size; i++) {
    const candidate = written[i]!
    const sizes = written
      .filter((_, j) => j !== i)
      .map((n) => mod(letterIndex(n.letter) - letterIndex(candidate.letter), 7) + 1)
      .sort((a, b) => a - b)
    const ok = sizes.every((s, k) => s === wanted[k])
    if (found.length === 0) {
      const list = sizes.map((s) => ordinal(s))
      const joined = list.length === 2 ? `a ${list[0]} and a ${list[1]}` : `a ${list[0]}, a ${list[1]} and a ${list[2]}`
      tries.push(
        ok
          ? `Try ${noteLabel(candidate)}: the other notes are ${joined} above it. That is exactly ${size === 3 ? 'a 3rd and a 5th' : 'a 3rd, a 5th and a 7th'}, so **${noteLabel(candidate)} is the root**.`
          : `Try ${noteLabel(candidate)}: the other notes are ${joined} above it. That is not ${size === 3 ? 'a 3rd and a 5th' : 'a 3rd, a 5th and a 7th'}, so ${noteLabel(candidate)} is not the root.`,
      )
    }
    if (ok) found.push(i)
  }
  if (found.length !== 1) throw new Error(`Could not find one root for ${notesLabel(written)}`)
  const rootIndex = found[0]!
  const root = written[rootIndex]!
  const stack = [...written].sort((a, b) => mod(letterIndex(a.letter) - letterIndex(root.letter), 7) - mod(letterIndex(b.letter) - letterIndex(root.letter), 7))
  const sums = stack.slice(1).map((n) => semitoneWorking(root, n))
  const counts = sums.map((s) => s.total)
  const quality = qualityFromSemitones(counts)
  if (!quality) throw new Error(`${notesLabel(stack)} is not one of the supported chords (${counts.join(', ')})`)
  const engine = identifyChord(stack)
  if (!engine || engine.quality !== quality || !sameNote(engine.root, root)) throw new Error(`Working says ${quality} but the engine disagrees for ${notesLabel(stack)}`)
  const inversion = stack.findIndex((n) => sameNote(n, written[0]!))
  return { stack, rootIndex, tries, counts, quality, working: sums.map((s) => s.text), inversion }
}

/** The notes at each stage of moving the bottom note to the top, for the check step. */
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

const INVERSION_ORDER = ['root position', 'first inversion', 'second inversion', 'third inversion']

/** The semitone-counting step, used by the inversion and symbol examples. */
function nameChordStep(a: StackAnalysis): string {
  const root = a.stack[0]!
  const parts = a.stack.slice(1).map((n, i) => `${noteLabel(n)} (the ${ROLE[i + 1]}) is ${a.counts[i]}`)
  const triadTable = 'major is 4 and 7; minor is 3 and 7; diminished is 3 and 6; augmented is 4 and 8'
  const seventhTable = 'dominant 7th is 4, 7 and 10; major 7th is 4, 7 and 11; minor 7th is 3, 7 and 10; half-diminished 7th is 3, 6 and 10; diminished 7th is 3, 6 and 9'
  const table = a.stack.length === 3 ? `For a triad (the 3rd and 5th): ${triadTable}.` : `For a 7th chord (the 3rd, 5th and 7th): ${seventhTable}.`
  return `Now name the chord. Count the semitones from the root ${noteLabel(root)} up to each other note: ${parts.join('; ')} (semitones above the root). ${table} So the chord is **${chordWords({ root, quality: a.quality })}**.`
}

/**
 * Find the inversion of a chord written on a staff.
 * Working: find the root by stacking in thirds, then see which chord note is lowest.
 * Cross-check: the engine's `identifyChord`, `inversionName` and `inversionFigure`.
 */
export function inversionExample(chord: Chord, inversion: number, clef: ClefName = 'treble'): WorkedExample {
  const pitches = chordPicture(chord, clef, inversion)
  const written = pitches.map(withoutOctave)
  const a = analyseStack(written)
  if (a.inversion !== inversion || a.quality !== chord.quality || !sameNote(a.stack[0]!, chord.root)) {
    throw new Error(`Inversion working for ${notesLabel(written)} disagrees with the chord that was asked for`)
  }
  assertSameNotes('inversion stack', a.stack, chordNotes(chord))
  const engineName = inversionName(inversion)
  const name = INVERSION_ORDER[inversion]!
  if (engineName !== name) throw new Error('Inversion name disagrees with the engine')
  const figure = figureFor(chord.quality, inversion)
  const label = chordWords(chord)
  const lowest = written[0]!
  const root = a.stack[0]!
  const moves = rotations(a.stack, inversion)
  const checkText =
    inversion === 0
      ? `Check: stack the chord in thirds from the root: ${notesLabel(a.stack)}. That is exactly what is written, lowest first, so it is in root position.`
      : `Check: start with the chord stacked in thirds from the root: ${notesLabel(a.stack)}. Move the bottom note to the top ${inversion === 1 ? 'once' : inversion === 2 ? 'twice' : 'three times'}: ${moves.map((m) => notesLabel(m)).join(', then ')}. The last list, ${notesLabel(written)}, is what is written, so it is in ${name}.`
  return {
    title: `Find the inversion of ${label}${inversion > 0 ? ` (${name})` : ''}`,
    task: 'Look at the chord on the staff. Which inversion is it in?',
    steps: [
      {
        text: `Name the notes, bottom to top: **${notesLabel(written)}**. (Use the clef to name each note, and add any sharp or flat written in front.)`,
        staff: chordsOnStaff(clef, [pitches]),
        listen: listenChord('Hear this chord', pitches),
      },
      {
        text: `Find the **root**: the note that the others are stacked above in thirds. Test each note in turn, counting letters upwards (a 3rd is two letters up, a 5th is four letters up, a 7th is six letters up). ${a.tries.join(' ')}`,
      },
      { text: nameChordStep(a) },
      {
        text: `Now look at the **lowest** note on the staff: **${noteLabel(lowest)}**. In ${label} (${notesLabel(a.stack)}) the note ${noteLabel(lowest)} is the **${ROLE[inversion]}**.`,
      },
      {
        text: `Use the rule: root lowest is root position; 3rd lowest is first inversion; 5th lowest is second inversion; 7th lowest (7th chords only) is third inversion. The ${ROLE[inversion]} is lowest, so the chord is in **${name}**. Its figured bass label is **${figure}**.`,
      },
      { text: checkText },
    ],
    answer: `${label} in ${name} (${noteLabel(lowest)} in the bass${root.letter === lowest.letter && root.accidental === lowest.accidental ? ', which is the root' : ''}). Figured bass: ${figure}.`,
  }
}

/** The chord symbol, put together by hand: root, then the ending for the type, then a slash and the bass note if inverted. */
export function handChordSymbol(chord: Chord, inversion: number): string {
  const base = `${noteLabel(chord.root)}${SYMBOL_CODE[chord.quality]}`
  const symbol = inversion === 0 ? base : `${base}/${noteLabel(chordNotes(chord)[inversion]!)}`
  const engine = chordSymbol(chord, { inversion, style: 'symbol' })
  if (engine !== symbol) throw new Error(`Chord symbol "${symbol}" disagrees with the engine's "${engine}"`)
  return symbol
}

/**
 * Write the chord symbol (with a slash if the chord is inverted) for a chord on a staff.
 * Working: find the root and type as in `inversionExample`, then add the ending and the bass note.
 * Cross-check: the engine's `chordSymbol`, and `parseChordSymbol` reading it back.
 */
export function chordSymbolExample(chord: Chord, inversion: number, clef: ClefName = 'treble'): WorkedExample {
  const pitches = chordPicture(chord, clef, inversion)
  const written = pitches.map(withoutOctave)
  const a = analyseStack(written)
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
  const base = `${noteLabel(root)}${SYMBOL_CODE[chord.quality]}`
  const label = chordWords(chord)
  return {
    title: `Write the chord symbol${inversion > 0 ? ' (an inverted chord)' : ''}: ${symbol}`,
    task: `Write the chord symbol for the chord on the staff.${inversion > 0 ? ' It is not in root position, so show the bass note with a slash.' : ''}`,
    steps: [
      {
        text: `Name the notes, bottom to top: **${notesLabel(written)}**.`,
        staff: chordsOnStaff(clef, [pitches]),
        listen: listenChord('Hear this chord', pitches),
      },
      { text: `Find the **root**: test each note to see which one has the others stacked above it in thirds. ${a.tries.join(' ')}` },
      { text: nameChordStep(a) },
      {
        text: `Write the **root** and then the **ending** for the type. The ending for ${qualityPhrase(chord.quality)} is **${SYMBOL_CODE[chord.quality] === '' ? 'nothing' : SYMBOL_CODE[chord.quality]}**${SYMBOL_CODE[chord.quality] === '' ? ' (a plain letter means major)' : ''}. So far: **${base}**.`,
      },
      {
        text:
          inversion === 0
            ? `Look at the lowest note: **${noteLabel(bass)}**. It is the root, so the chord is in root position and nothing more is added.`
            : `Look at the lowest note: **${noteLabel(bass)}**. It is not the root (${noteLabel(root)}), so add a **slash** and the bass note: **${symbol}**. Read it as "${label} with ${noteLabel(bass)} in the bass".`,
      },
      {
        text: `Check: read the symbol back. **${symbol}** means ${SYMBOL_MEANING[chord.quality]} on ${noteLabel(root)}${inversion === 0 ? '' : `, with ${noteLabel(bass)} as the lowest note`}. That is exactly the chord on the staff. ✓`,
      },
    ],
    answer: `The chord symbol is ${symbol}.`,
  }
}

/** Splits a symbol such as "E♭m7/G♭" into root, ending and slash note (hand-written reading of the symbol). */
function splitSymbol(symbol: string): { root: string; code: string; slash: string | null } {
  const match = /^([A-G][♯♭]*)([^/]*)(?:\/([A-G][♯♭]*))?$/.exec(symbol)
  if (!match) throw new Error(`Cannot split chord symbol ${symbol}`)
  return { root: match[1]!, code: match[2] ?? '', slash: match[3] ?? null }
}

/**
 * Read a chord symbol and write the chord (spelling it, putting the slash note in the bass, drawing it).
 * Working: spell the chord by counting semitones, then rearrange for the bass note.
 * Cross-check: the engine's `parseChordSymbol` and `chordNotes`.
 */
export function readChordSymbolExample(chord: Chord, inversion: number, clef: ClefName = 'treble'): WorkedExample {
  const symbol = handChordSymbol(chord, inversion)
  const parts = splitSymbol(symbol)
  const type = (Object.keys(SYMBOL_CODE) as ChordQuality[]).find((q) => SYMBOL_CODE[q] === parts.code.replace('♭', 'b'))
  if (type !== chord.quality) throw new Error('Reading the ending of the symbol gives a different chord type')

  const engine = parseChordSymbol(chordSymbol(chord, { inversion }))
  if (engine.inversion !== inversion || engine.chord.quality !== chord.quality || !sameNote(engine.chord.root, chord.root)) {
    throw new Error('The engine reads the symbol differently')
  }

  const recipe = isTriadQuality(chord.quality)
    ? { third: TRIAD_RECIPE[chord.quality].third, fifth: TRIAD_RECIPE[chord.quality].fifth, seventh: null as number | null }
    : isSeventhQuality(chord.quality)
      ? SEVENTH_RECIPE[chord.quality]
      : (() => {
          throw new Error('Unsupported chord type')
        })()
  const third = spellAbove(chord.root, 2, recipe.third, '3rd')
  const fifth = spellAbove(chord.root, 4, recipe.fifth, '5th')
  const seventh = recipe.seventh === null ? null : spellAbove(chord.root, 6, recipe.seventh, '7th')
  const stack = [chord.root, third.note, fifth.note, ...(seventh ? [seventh.note] : [])]
  assertSameNotes(`${symbol}`, stack, chordNotes(chord))

  const pitches = chordPicture(chord, clef, inversion)
  const written = pitches.map(withoutOctave)
  const rotated = rotations(stack, inversion).at(-1) ?? stack
  assertSameNotes(`${symbol} as written`, rotated, written)
  const label = chordWords(chord)
  const bass = written[0]!
  const slashNote = parts.slash

  return {
    title: `Read a chord symbol and write the chord: ${symbol}`,
    task: `Spell the chord ${symbol} and write it on the staff${inversion > 0 ? ', with the bass note the symbol asks for' : ''}.`,
    steps: [
      {
        text: `Split the symbol into its parts: the **root** is **${parts.root}**, the **ending** is **${parts.code === '' ? 'nothing' : parts.code}**${slashNote ? `, and after the slash the **bass note** is **${slashNote}**` : ', and there is no slash'}.`,
      },
      {
        text: `Read the ending. ${parts.code === '' ? 'No ending' : `The ending "${parts.code}"`} means ${SYMBOL_MEANING[chord.quality]}. So the chord is **${label}**. (Notes: root, 3rd, 5th${seventh ? ', 7th' : ''}.)`,
      },
      { text: `Write the root: **${noteLabel(chord.root)}**. Its letters go up in thirds: ${stack.map((n) => n.letter).join(', ')}.` },
      { text: third.text },
      { text: fifth.text },
      ...(seventh ? [{ text: seventh.text }] : []),
      {
        text: `The chord in its basic form is **${notesLabel(stack)}**.${
          inversion === 0
            ? ' There is no slash, so this is also the order to write it, with the root at the bottom.'
            : ` Now the slash: **${slashNote}** must be the lowest note. Move the bottom note to the top until ${slashNote} is at the bottom. That gives **${notesLabel(rotated)}**.`
        }`,
      },
      {
        text: `Write it on the staff, lowest note first${inversion > 0 ? `, with ${noteLabel(bass)} at the bottom` : ''}. Press the button to hear it.`,
        staff: chordsOnStaff(clef, [pitches]),
        listen: listenChord(`Hear ${symbol}`, pitches),
      },
      {
        text: `Check: the lowest note is ${noteLabel(bass)}${inversion === 0 ? ', the root' : `, which is the ${ROLE[inversion]} of ${label}, so the chord is in ${INVERSION_ORDER[inversion]}`}. The notes are all from ${notesLabel(stack)}. ✓`,
      },
    ],
    answer: `${symbol} is ${notesLabel(rotated)}, written lowest first${inversion > 0 ? ` (${INVERSION_ORDER[inversion]})` : ' (root position)'}.`,
  }
}
