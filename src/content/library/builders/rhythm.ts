import type { WorkedExample, WorkedStep, WorkedTerm } from '../types'
import {
  NOTE_VALUES,
  type NoteValueName,
  dottedCrotchets,
  dottedSemiquavers,
  noteValue,
  noteValueLabel,
  pitchAtPosition,
  restLabel,
} from '../../../theory'
import type { NotationItem, StaffSpec } from '../../../questions/types'

/*
 * Builders about note values, rests and dots. Lengths are worked out long-hand in beats and in semiquavers
 * (one crotchet beat = 4 semiquavers) and then checked against the theory engine. A disagreement throws.
 */

/** One note or rest in a worked example. `rest: true` draws a rest of that value. */
export interface Figure {
  readonly name: NoteValueName
  readonly dots?: number
  readonly rest?: boolean
}

const FRACTIONS: Record<number, string> = { 0: '', 0.25: '¼', 0.5: '½', 0.75: '¾' }

/** Beats as they are written: ¼, ½, ¾, 1, 1½, 1¾, 2, 3, 3½, 4 ... Works for any whole number of quarter-beats. */
export function beatsText(beats: number): string {
  if (beats < 0 || Math.round(beats * 4) !== beats * 4) throw new RangeError('Beats must be a whole number of quarters')
  const whole = Math.floor(beats)
  const fraction = FRACTIONS[beats - whole]!
  return whole === 0 ? fraction : `${whole}${fraction}`
}

/** "1 crotchet beat", "3½ crotchet beats", "¾ of a crotchet beat". */
const beatsWord = (beats: number) => (beats < 1 ? `${beatsText(beats)} of a crotchet beat` : `${beatsText(beats)} crotchet beat${beats === 1 ? '' : 's'}`)

/** "1 beat", "2 beats", "½ a beat", "¼ of a beat": how a length reads in a sentence. */
function beatsPhrase(beats: number): string {
  if (beats === 1) return '1 beat'
  if (beats > 1) return `${beatsText(beats)} beats`
  return beats === 0.5 ? '½ a beat' : `${beatsText(beats)} of a beat`
}

const withArticle = (phrase: string) => `${/^[aeiou]/i.test(phrase) ? 'an' : 'a'} ${phrase}`

/** What each rest looks like, in words. Same wording as the Practice explanations. */
export const REST_LOOKS: Record<NoteValueName, string> = {
  semibreve: 'a small block hanging below a line',
  minim: 'a small block sitting on top of a line',
  crotchet: 'a squiggly, zigzag shape',
  quaver: 'a slanted stroke with one hook (flag)',
  semiquaver: 'a slanted stroke with two hooks (flags)',
}

/** A picture of notes and rests in a row. Notes sit on the middle line of the treble staff. */
export function figuresOnStaff(figures: readonly Figure[]): StaffSpec {
  const middle = pitchAtPosition(4, 'treble')
  const items: NotationItem[] = figures.map((f) =>
    f.rest
      ? { kind: 'rest', duration: noteValue(f.name).vex, dots: f.dots ?? 0 }
      : { kind: 'notes', pitches: [middle], duration: noteValue(f.name).vex, dots: f.dots ?? 0 },
  )
  return { clef: 'treble', items }
}

function assertDots(dots: number): void {
  if (!Number.isInteger(dots) || dots < 0 || dots > 2) throw new RangeError('Dots must be 0, 1 or 2')
}

/** Length of a plain note in beats, by halving: a semibreve is 4, and each step down the family halves it. */
function plainBeats(name: NoteValueName): number {
  const index = NOTE_VALUES.findIndex((v) => v.name === name)
  const beats = 4 / 2 ** index
  if (beats !== noteValue(name).crotchets) throw new Error(`The ${name} length by halving disagrees with the theory engine`)
  return beats
}

/** Beats each dot adds: the first dot adds half of the note, the second adds half of the first. */
function dotAdditions(name: NoteValueName, dots: number): number[] {
  const additions: number[] = []
  let add = plainBeats(name)
  for (let i = 0; i < dots; i++) {
    add = add / 2
    additions.push(add)
  }
  return additions
}

/** Total beats worked out by adding the note and its dot amounts, checked against the engine. */
function totalBeats(name: NoteValueName, dots: number): number {
  assertDots(dots)
  const total = plainBeats(name) + dotAdditions(name, dots).reduce((a, b) => a + b, 0)
  if (total !== dottedCrotchets(name, dots)) throw new Error(`The length of a ${noteValueLabel(name, dots)} disagrees with the theory engine`)
  if (total * 4 !== dottedSemiquavers(name, dots)) throw new Error('Beats and semiquavers disagree')
  return total
}

const americanName = (name: NoteValueName, dots: number) => `${dots === 0 ? '' : dots === 1 ? 'dotted ' : 'double-dotted '}${noteValue(name).american}`
const capital = (text: string) => text.charAt(0).toUpperCase() + text.slice(1)
const ORDINAL_WORDS = ['First', 'Second', 'Third', 'Fourth', 'Fifth', 'Sixth', 'Seventh', 'Eighth']

/* "Words you need" for the rhythm builders. */
const NOTE_HEAD_TERM: WorkedTerm = { term: 'Note head', meaning: 'The oval part of a note. It is either hollow (white inside) or filled in (black).' }
const STEM_TERM: WorkedTerm = { term: 'Stem', meaning: 'The straight line going up or down from a note head. Which way it points makes no difference.' }
const FLAG_TERM: WorkedTerm = { term: 'Flag', meaning: 'A small tail on the end of a stem. Each flag halves the length of the note.' }
const DOT_TERM: WorkedTerm = { term: 'Dot', meaning: "A dot just after a note head. It adds half of the note's own length." }
const DOUBLE_DOT_TERM: WorkedTerm = { term: 'Double dot', meaning: 'Two dots after a note head. The second dot adds half of what the first dot added.' }
const CROTCHET_BEAT_TERM: WorkedTerm = { term: 'Crotchet beat', meaning: 'The beat that note lengths are measured in here: a crotchet lasts 1 beat. A beat is the steady pulse you tap your foot to.' }
const SEMIBREVE_TERM: WorkedTerm = { term: 'Semibreve', meaning: 'The longest note in this lesson: a hollow head with no stem. It lasts 4 crotchet beats.' }
const SEMIQUAVER_TERM: WorkedTerm = { term: 'Semiquaver', meaning: 'The shortest note in this lesson, ¼ of a crotchet beat. 4 semiquavers last 1 beat and 16 fill a semibreve.' }
const REST_TERM: WorkedTerm = { term: 'Rest', meaning: 'A sign for silence. You play nothing but keep counting, for as long as the note with the same name lasts.' }

/** "semibreve 4, minim 4 ÷ 2 = 2, crotchet 2 ÷ 2 = 1": halving from the semibreve down to the note, in beats or semiquavers. */
function halvingChain(name: NoteValueName, unit: 'beats' | 'semiquavers'): { text: string; short: string; value: number } {
  const index = NOTE_VALUES.findIndex((v) => v.name === name)
  let value = unit === 'beats' ? 4 : 16
  const show = (n: number) => (unit === 'beats' ? beatsText(n) : String(n))
  const parts = [`semibreve ${show(value)}`]
  const values = [show(value)]
  for (let i = 1; i <= index; i++) {
    const next = value / 2
    parts.push(`${NOTE_VALUES[i]!.name} ${show(value)} ÷ 2 = ${show(next)}`)
    values.push(show(next))
    value = next
  }
  const engine = unit === 'beats' ? noteValue(name).crotchets : noteValue(name).semiquavers
  if (value !== engine) throw new Error(`Halving to a ${name} disagrees with the theory engine`)
  const short = index === 0 ? 'the whole semibreve' : `${values[0]} halved ${index === 1 ? 'once' : index === 2 ? 'twice' : `${index} times`}: ${values.slice(1).join(', ')}`
  return { text: parts.join(', '), short, value }
}

/** What the drawing of a note shows, read from its VexFlow code (the same code the picture is drawn from). */
function features(name: NoteValueName) {
  const vex = noteValue(name).vex
  return { hollow: vex === 'w' || vex === 'h', stem: vex !== 'w', flags: vex === '8' ? 1 : vex === '16' ? 2 : 0 }
}

/** "Name this note", by looking at the head, the stem and the flags, then the dots. */
export function nameNoteValueExample(name: NoteValueName, dots = 0): WorkedExample {
  assertDots(dots)
  const { hollow, stem, flags } = features(name)
  // Name it from those features alone, then check that it is the note we meant.
  const found: NoteValueName = hollow ? (stem ? 'minim' : 'semibreve') : flags === 0 ? 'crotchet' : flags === 1 ? 'quaver' : 'semiquaver'
  if (found !== name) throw new Error(`Naming ${name} from its shape gave ${found}`)
  // The check builds the note up from a semibreve, one change at a time; the number of changes must match its place in the family.
  const changes = ['add a stem for a minim', 'fill in the head for a crotchet', 'add a flag for a quaver', 'add a second flag for a semiquaver']
  const made = (stem ? 1 : 0) + (hollow ? 0 : 1) + flags
  if (made !== NOTE_VALUES.findIndex((v) => v.name === name)) throw new Error('Building up from the semibreve gives a different note')

  const label = noteValueLabel(name, dots)
  const flagWords = flags === 0 ? 'no flags' : flags === 1 ? '1 flag' : '2 flags'
  const shape = `${hollow ? 'A hollow' : 'A filled-in'} head ${stem ? 'with a stem' : 'with no stem'}${hollow ? '' : ` and ${flagWords}`}`
  const article = (phrase: string) => withArticle(phrase)

  const steps: WorkedStep[] = [
    {
      title: 'Look at the note head',
      text: `The note head (the oval part of the note) is ${hollow ? 'hollow: white inside' : 'filled in: black'}.`,
      result: hollow ? 'Hollow head' : 'Filled-in head',
      staff: figuresOnStaff([{ name, dots }]),
    },
    {
      title: 'Look for a stem',
      text: stem
        ? 'It has a stem (a straight line going up or down from the head).'
        : 'It has no stem (the straight line that most notes have, going up or down from the head).',
      result: stem ? 'A stem' : 'No stem',
    },
  ]
  if (!hollow) {
    steps.push({
      title: 'Count the flags',
      text: `Look at the end of the stem for flags (small tails; each one halves the note). There ${flags === 1 ? 'is' : 'are'} ${flagWords}.`,
      result: capital(flagWords),
    })
  }
  steps.push(
    {
      title: 'Name the shape',
      text: `${shape} is ${article(name)}. In American English this is ${article(noteValue(name).american)}.`,
      result: capital(name),
    },
    dots === 0
      ? {
          title: 'Look for a dot',
          text: `Look just after the head for a dot (it would make the note half as long again). There is none, so the name stays ${name}.`,
          result: `No dot: ${name}`,
        }
      : {
          title: 'Look for a dot',
          text: `Look just after the head. There ${dots === 1 ? 'is 1 dot (a dot adds half of the note\'s own length)' : 'are 2 dots (a double dot: the second adds half of what the first added)'}, so the note is ${article(label)}. In American English this is ${article(americanName(name, dots))}.`,
          result: capital(label),
        },
    {
      title: 'Check by building up from the semibreve',
      text: `Start from the semibreve: a hollow head with no stem. Change one thing at a time: ${changes.join(', ')}. Your note has ${made === 0 ? 'none of these changes' : `${made === 1 ? 'the first change' : `the first ${made} changes`}`}, so it is ${article(name)}.`,
      result: `${capital(name)}, as found`,
    },
  )
  const terms: WorkedTerm[] = [NOTE_HEAD_TERM, STEM_TERM, FLAG_TERM, dots === 2 ? DOUBLE_DOT_TERM : DOT_TERM, SEMIBREVE_TERM]
  return {
    title: dots === 0 ? 'Name a note from its shape' : `Name a note with ${dots === 1 ? 'a dot' : 'two dots'}`,
    task: 'What is the name of this note?',
    terms,
    steps,
    answer: `It is ${article(label)}.`,
  }
}

/** How each rest is told apart: the step that looks closer, and the check by a different route. */
function restDetails(name: NoteValueName): { title: string; text: string; result: string; check: string; checkResult: string } {
  switch (name) {
    case 'semibreve':
      return {
        title: 'See where the block sits',
        text: 'The block hangs down from a line, below it. On a staff (the five lines music is written on) it hangs from the 4th line up.',
        result: 'Hanging below the line',
        check: 'Check with a memory aid. The semibreve rest is the longer of the two block rests (4 beats against 2), so think of it as heavier: it hangs down. The lighter minim rest sits on top, like a hat. This block hangs down.',
        checkResult: 'Heavier, hanging: the semibreve rest',
      }
    case 'minim':
      return {
        title: 'See where the block sits',
        text: 'The block sits on top of a line, like a hat. On a staff (the five lines music is written on) it sits on the middle line.',
        result: 'Sitting on the line',
        check: 'Check with a memory aid. The minim rest is the shorter of the two block rests (2 beats against 4), so think of it as lighter: it sits on top, like a hat. The heavier semibreve rest hangs down. This block sits on top.',
        checkResult: 'Lighter, sitting on top: the minim rest',
      }
    case 'crotchet':
      return {
        title: 'Look for hooks',
        text: 'It has no hooks (the small curls on the top of quaver and semiquaver rests). It is one zigzag line from top to bottom.',
        result: 'No hooks: a zigzag',
        check: 'Check by ruling out the other rests. The semibreve and minim rests are small blocks. The quaver and semiquaver rests are slanted strokes with hooks. Only the crotchet rest is a zigzag.',
        checkResult: 'Only the crotchet rest is a zigzag',
      }
    default: {
      const hooks = name === 'quaver' ? 1 : 2
      return {
        title: 'Count the hooks',
        text: `Count the hooks (the small curls on the slanted stroke). There ${hooks === 1 ? 'is 1 hook' : 'are 2 hooks'}.`,
        result: hooks === 1 ? '1 hook' : '2 hooks',
        check: `Check against the note with the same name. A rest has as many hooks as its note has flags (tails on the stem): a quaver has 1 flag and a semiquaver has 2. This rest has ${hooks}, like ${withArticle(name)}.`,
        checkResult: `${hooks === 1 ? '1 hook' : '2 hooks'}, like the ${name}'s ${hooks === 1 ? 'flag' : 'flags'}`,
      }
    }
  }
}

/** "Name this rest", from its shape. */
export function nameRestExample(name: NoteValueName, dots = 0): WorkedExample {
  assertDots(dots)
  const label = restLabel(name, dots)
  const beats = totalBeats(name, dots)
  const detail = restDetails(name)
  const { flags } = features(name)
  if ((name === 'quaver' || name === 'semiquaver') && detail.result !== `${flags} hook${flags === 1 ? '' : 's'}`) throw new Error('Hooks must match the flags of the note')
  const terms: WorkedTerm[] = [REST_TERM, CROTCHET_BEAT_TERM]
  if (dots > 0) terms.push(DOT_TERM)
  if (name === 'semibreve' || name === 'minim') terms.push({ term: 'Memory aid', meaning: 'A phrase or picture that helps you remember a fact. It is not a rule of music.' })
  if (name === 'quaver' || name === 'semiquaver') terms.push(FLAG_TERM)
  return {
    title: 'Name a rest from its shape',
    task: 'What is the name of this rest?',
    terms,
    steps: [
      {
        title: 'Look at the shape',
        text: `A rest (a sign for silence) is written where a note would be. This one is ${REST_LOOKS[name]}.`,
        result: capital(REST_LOOKS[name]),
        staff: figuresOnStaff([{ name, dots, rest: true }]),
      },
      { title: detail.title, text: detail.text, result: detail.result },
      { title: 'Name the rest', text: `${capital(REST_LOOKS[name])} is ${withArticle(`${name} rest`)}.`, result: capital(`${name} rest`) },
      dots === 0
        ? { title: 'Look for a dot', text: 'Look just after the rest for a dot (it would make the rest half as long again). There is none.', result: 'No dot' }
        : {
            title: 'Look for a dot',
            text: `There ${dots === 1 ? 'is 1 dot' : 'are 2 dots'} after it. A dot after a rest works just as it does after a note: it adds half of the rest's own length. So it is ${withArticle(label)}.`,
            result: capital(label),
          },
      {
        title: 'Find how long it lasts',
        text: `A rest lasts as long as the note with the same name. ${capital(withArticle(noteValueLabel(name, dots)))} lasts ${beatsWord(beats)} (the beat we count note lengths in), so this rest is ${beatsPhrase(beats)} of silence.`,
        result: `${capital(beatsPhrase(beats))} of silence`,
      },
      { title: detail.check.startsWith('Check with') ? 'Check with a memory aid' : detail.check.startsWith('Check by') ? 'Check by ruling out the other rests' : 'Check against the note with the same name', text: detail.check.replace(/^Check[^.]*\. /, ''), result: detail.checkResult },
    ],
    answer: `It is ${withArticle(label)}.`,
  }
}

/** The step that works out how long one note or rest is, in beats: halving from the semibreve, then the dots. */
function lengthText(name: NoteValueName, dots: number, rest: boolean): { text: string; beats: number } {
  const { value: plain } = halvingChain(name, 'beats')
  const additions = dotAdditions(name, dots)
  const total = totalBeats(name, dots)
  const index = NOTE_VALUES.findIndex((v) => v.name === name)
  const base =
    index === 0
      ? 'A semibreve is 4 beats.'
      : `${capital(withArticle(name))} is half ${withArticle(NOTE_VALUES[index - 1]!.name)}: ${beatsText(plain * 2)} ÷ 2 = ${beatsPhrase(plain)}.`
  const dotText =
    dots === 0
      ? ''
      : dots === 1
        ? ` The dot adds half of that: ${beatsText(plain)} ÷ 2 = ${beatsText(additions[0]!)}. ${beatsText(plain)} + ${beatsText(additions[0]!)} = ${beatsText(total)}.`
        : ` The first dot adds ${beatsText(plain)} ÷ 2 = ${beatsText(additions[0]!)}, the second ${beatsText(additions[0]!)} ÷ 2 = ${beatsText(additions[1]!)}. ${[plain, ...additions].map(beatsText).join(' + ')} = ${beatsText(total)}.`
  const restText = rest ? 'A rest lasts as long as the note with the same name. ' : ''
  return { text: `${restText}${base}${dotText}`, beats: total }
}

/**
 * "How many crotchet beats is this note worth?" The working is long-hand: the length without dots (by halving from the semibreve),
 * plus what each dot adds. It is checked against `dottedCrotchets`, and again in semiquavers, and throws if they disagree.
 */
export function noteBeatsExample(name: NoteValueName, dots = 0): WorkedExample {
  assertDots(dots)
  const label = noteValueLabel(name, dots)
  const chain = halvingChain(name, 'beats')
  const plain = chain.value
  const additions = dotAdditions(name, dots)
  const total = totalBeats(name, dots)
  const semiChain = halvingChain(name, 'semiquavers')
  const semis = semiChain.value
  const semiAdd: number[] = []
  let add = semis
  for (let i = 0; i < dots; i++) {
    add = add / 2
    semiAdd.push(add)
  }
  const semiTotal = semis + semiAdd.reduce((a, b) => a + b, 0)
  if (semiTotal !== dottedSemiquavers(name, dots) || semiTotal / 4 !== total) throw new Error('Semiquaver working disagrees with the theory engine')

  const { hollow, stem, flags } = features(name)
  const looks = `${hollow ? 'hollow' : 'filled-in'} head${stem ? ', a stem' : ', no stem'}${flags ? ` and ${flags === 1 ? '1 flag' : '2 flags'}` : ''}`
  const steps: WorkedStep[] = [
    {
      title: 'Name the note',
      text: `A ${looks}: this is ${withArticle(name)}.${dots === 0 ? ' There is no dot after the head.' : ` There ${dots === 1 ? 'is 1 dot' : 'are 2 dots'} after the head, so it is ${withArticle(label)}.`}`,
      result: capital(label),
      staff: figuresOnStaff([{ name, dots }]),
    },
    {
      title: 'Find its length without dots',
      text:
        name === 'semibreve'
          ? 'A semibreve, the longest note here, lasts 4 crotchet beats (a crotchet beat is the beat we count in).'
          : `Start from the semibreve, 4 crotchet beats (a crotchet beat is the beat we count in). Each note lasts half as long as the one before: ${chain.text}.`,
      result: `${capital(name)}: ${beatsPhrase(plain)}`,
    },
  ]
  if (dots === 0) {
    steps.push({ title: 'Look for a dot', text: 'There is no dot after the head, so nothing is added.', result: `Total: ${beatsPhrase(total)}` })
  } else {
    additions.forEach((a, i) =>
      steps.push(
        i === 0
          ? {
              title: 'Add half for the dot',
              text: `A dot (a small dot just after the head) adds half of the note's own length. Half of ${beatsText(plain)} is ${beatsText(plain)} ÷ 2 = ${beatsText(a)}.`,
              result: `The dot adds ${beatsPhrase(a)}`,
            }
          : {
              title: 'Add half again for the second dot',
              text: `With a double dot, the second dot adds half of what the first dot added: ${beatsText(additions[0]!)} ÷ 2 = ${beatsText(a)}.`,
              result: `The second dot adds ${beatsPhrase(a)}`,
            },
      ),
    )
    steps.push({
      title: 'Add the parts',
      text: `Add the note and what the ${dots === 1 ? 'dot adds' : 'dots add'}: ${[plain, ...additions].map(beatsText).join(' + ')} = ${beatsText(total)}.`,
      result: `Total: ${beatsPhrase(total)}`,
    })
  }
  const semiWork =
    dots === 0
      ? `${capital(withArticle(name))} is ${semis} semiquavers${name === 'semibreve' ? '' : ` (${semiChain.short})`}.`
      : `${capital(withArticle(name))} is ${semis} (${semiChain.short}). ${dots === 1 ? 'The dot adds' : 'The dots add'} ${semiAdd.map((a, i) => `${i === 0 ? semis : semiAdd[i - 1]!} ÷ 2 = ${a}`).join(' and then ')}. ${[semis, ...semiAdd].join(' + ')} = ${semiTotal} semiquavers.`
  steps.push({
    title: 'Check by counting in semiquavers',
    text: `Count in semiquavers instead (¼ of a beat each: 4 make a beat, 16 make a semibreve). ${semiWork} Then ${semiTotal} ÷ 4 = ${beatsPhrase(total)}.`,
    result: `${semiTotal} semiquavers = ${beatsPhrase(total)}, the same`,
  })
  const terms: WorkedTerm[] = [CROTCHET_BEAT_TERM, SEMIBREVE_TERM]
  if (dots > 0) terms.push(DOT_TERM)
  if (dots > 1) terms.push(DOUBLE_DOT_TERM)
  terms.push(SEMIQUAVER_TERM)
  return {
    title: dots === 0 ? 'Beats in a note with no dot' : dots === 1 ? 'Beats in a dotted note' : 'Beats in a double-dotted note',
    task: `How many crotchet beats is ${withArticle(label)} worth?`,
    terms,
    steps,
    answer: `${capital(withArticle(label))} is worth ${beatsWord(total)}.`,
  }
}

/** Adds up a short run of notes and rests in beats, one step per note or rest. Checked against the engine and in semiquavers. */
export function sumValuesExample(figures: readonly Figure[]): WorkedExample {
  if (figures.length < 2) throw new RangeError('Give at least two notes or rests to add up')
  if (figures.length > ORDINAL_WORDS.length) throw new RangeError('Too many notes for one example')
  const parts = figures.map((f) => {
    const dots = f.dots ?? 0
    const work = lengthText(f.name, dots, f.rest ?? false)
    return { f, dots, beats: work.beats, text: work.text, label: f.rest ? restLabel(f.name, dots) : noteValueLabel(f.name, dots) }
  })
  const total = parts.reduce((sum, p) => sum + p.beats, 0)
  const semis = parts.map((p) => dottedSemiquavers(p.f.name, p.dots))
  const semiTotal = semis.reduce((a, b) => a + b, 0)
  if (semis.some((s, i) => s !== parts[i]!.beats * 4) || semiTotal !== total * 4) throw new Error('The total disagrees with the theory engine')

  // Running total, one addition at a time.
  const running: string[] = []
  let sum = parts[0]!.beats
  for (const p of parts.slice(1)) {
    running.push(`${beatsText(sum)} + ${beatsText(p.beats)} = ${beatsText(sum + p.beats)}`)
    sum += p.beats
  }
  const semiParts = parts.map((p, i) => {
    const base = noteValue(p.f.name).semiquavers
    return p.dots === 0 ? `${p.label} ${semis[i]}` : `${p.label} ${base} + ${semis[i]! - base} = ${semis[i]}`
  })
  const hasRest = figures.some((f) => f.rest)
  const hasDot = figures.some((f) => (f.dots ?? 0) > 0)
  const terms: WorkedTerm[] = [CROTCHET_BEAT_TERM]
  if (hasRest) terms.push(REST_TERM)
  if (hasDot) terms.push(DOT_TERM)
  terms.push(SEMIQUAVER_TERM)

  const steps: WorkedStep[] = [
    {
      title: 'Name each note and rest',
      text: `From left to right: ${andList(parts.map((p) => withArticle(p.label)))}.${hasRest ? ' A rest (a sign for silence) still takes up time.' : ''}`,
      result: capital(parts.map((p) => p.label).join(', ')),
      staff: figuresOnStaff(figures),
    },
    ...parts.map((p, i) => ({
      title: `${ORDINAL_WORDS[i]}: the ${p.label}`,
      text: i === 0 ? `${p.text} We count in crotchet beats (a crotchet lasts 1 beat).` : p.text,
      result: beatsPhrase(p.beats),
    })),
    {
      title: 'Add the beats from left to right',
      text: `Add one at a time, keeping a running total: ${running.join(', then ')}.`,
      result: `Total: ${beatsPhrase(total)}`,
    },
    {
      title: 'Check by counting in semiquavers',
      text: `Count in semiquavers instead (¼ of a beat each, so 4 make a beat): ${semiParts.join(', ')}. ${semis.join(' + ')} = ${semiTotal} semiquavers, and ${semiTotal} ÷ 4 = ${beatsText(total)}.`,
      result: `${semiTotal} semiquavers = ${beatsPhrase(total)}, the same`,
    },
  ]
  return {
    title: 'Add up a run of note values',
    task: 'How many crotchet beats do these notes and rests last altogether?',
    terms,
    steps,
    answer: `Altogether they last ${beatsWord(total)}.`,
  }
}

/** "a minim and a crotchet", "a, b and c". */
function andList(items: readonly string[]): string {
  return items.length <= 1 ? items.join('') : `${items.slice(0, -1).join(', ')} and ${items.at(-1)}`
}
