import { describe, expect, it } from 'vitest'
import { CLEF_NAMES, type ClefName, keyFifths } from '../theory'
import { FLAT_ORDER, MAJOR_FIFTHS, MINOR_FIFTHS, SHARP_ORDER, ascii, pc } from './handTables'
import { keyFromSignatureGenerator, relativeKeyGenerator, signatureFromKeyGenerator } from './keys'
import { createRng } from './rng'
import { choicesOf } from './testing'
import type { Difficulty, Question } from './types'

const ctx = (seed: number, difficulty: Difficulty, clefs: readonly ClefName[] = CLEF_NAMES) => ({
  rng: createRng(seed),
  clefs,
  difficulty,
  maxLedgerLines: 1,
})
const many = (g: { generate: (c: ReturnType<typeof ctx>) => Question }, count: number, difficulty: Difficulty, clefs?: readonly ClefName[]) =>
  Array.from({ length: count }, (_, i) => g.generate(ctx(i + 17 * difficulty, difficulty, clefs)))

/** "D major" -> sharps (+) / flats (-) from the hand-written tables. */
function fifthsOfName(name: string): number {
  const [tonic, mode] = ascii(name).split(' ')
  const table = mode === 'major' ? MAJOR_FIFTHS : MINOR_FIFTHS
  const value = table[tonic!]
  if (value === undefined) throw new Error(`Unknown key ${name}`)
  return value
}
const MAX: Record<Difficulty, number> = { 1: 2, 2: 4, 3: 7 }

describe('key-from-signature', () => {
  it('the drawn signature belongs to the answer, checked against hand tables', () => {
    for (const level of [1, 2, 3] as const) {
      for (const q of many(keyFromSignatureGenerator, 250, level)) {
        const staff = q.notation!.staves[0]!
        expect(staff.items).toEqual([])
        const drawnFifths = keyFifths(staff.key!)
        expect(fifthsOfName(q.correct)).toBe(drawnFifths)
        // The asked mode and the answer's mode agree.
        const mode = q.prompt.includes('major') ? 'major' : 'minor'
        expect(q.correct.endsWith(mode)).toBe(true)
        for (const c of choicesOf(q)) expect(c.label.endsWith(mode)).toBe(true)
        expect(Math.abs(drawnFifths)).toBeLessThanOrEqual(MAX[level])
      }
    }
  })

  it('never offers a wrong answer that has the same signature (that would be a second right answer)', () => {
    for (const q of many(keyFromSignatureGenerator, 400, 3)) {
      const staff = q.notation!.staves[0]!
      for (const c of choicesOf(q)) {
        if (c.id === q.correct) continue
        expect(fifthsOfName(c.label)).not.toBe(keyFifths(staff.key!))
      }
    }
  })

  it('always offers the key with the same number of accidentals of the other kind (D major vs B♭ major)', () => {
    for (const q of many(keyFromSignatureGenerator, 300, 2)) {
      const f = keyFifths(q.notation!.staves[0]!.key!)
      if (f === 0) continue
      expect(choicesOf(q).map((c) => fifthsOfName(c.label))).toContain(-f)
    }
  })

  it('the rule of thumb in the explanation is true for every major key (checked by hand)', () => {
    for (const [tonic, fifths] of Object.entries(MAJOR_FIFTHS)) {
      if (fifths > 0) {
        const last = SHARP_ORDER.charAt(fifths - 1)
        // the major key is a semitone above the last sharp
        expect(pc(tonic)).toBe((pc(`${last}#`) + 1) % 12)
      } else if (fifths < -1) {
        const secondLast = FLAT_ORDER.charAt(-fifths - 2)
        expect(tonic).toBe(`${secondLast}b`)
      }
    }
    expect(MAJOR_FIFTHS['F']).toBe(-1)
  })

  it('explanations quote the rule that matches the key', () => {
    const texts = many(keyFromSignatureGenerator, 300, 3).map((q) => q.explanation)
    expect(texts.some((t) => t.includes('semitone above it'))).toBe(true)
    expect(texts.some((t) => t.includes('second-to-last flat'))).toBe(true)
    expect(texts.some((t) => t.includes('This one has to be learned'))).toBe(true)
    expect(texts.some((t) => t.includes('no sharps or flats'))).toBe(true)
  })

  it('draws in every chosen clef, including alto and tenor', () => {
    const clefs = new Set(many(keyFromSignatureGenerator, 200, 2).map((q) => q.notation!.staves[0]!.clef))
    expect([...clefs].sort()).toEqual(['alto', 'bass', 'tenor', 'treble'])
  })

  it('tags treble and bass as AQA candidates and alto and tenor as extras', () => {
    for (const q of many(keyFromSignatureGenerator, 200, 2)) {
      const clef = q.notation!.staves[0]!.clef
      expect(q.tags).toEqual(clef === 'treble' || clef === 'bass' ? ['aqa-candidate'] : ['extra'])
    }
  })
})

describe('signature-from-key', () => {
  it('counts and lists match the hand tables', () => {
    for (const level of [1, 2, 3] as const) {
      for (const q of many(signatureFromKeyGenerator, 300, level)) {
        const keyText = /(?:does|of) ([A-G][♯♭]? (?:major|minor))/.exec(q.prompt)![1]!
        const fifths = fifthsOfName(keyText)
        if (q.id.includes(':count:')) {
          const expected = fifths === 0 ? 'No sharps or flats' : `${Math.abs(fifths)} ${fifths > 0 ? 'sharp' : 'flat'}${Math.abs(fifths) === 1 ? '' : 's'}`
          expect(q.correct).toBe(expected)
        } else {
          expect(fifths).not.toBe(0)
          const letters = (fifths > 0 ? SHARP_ORDER : FLAT_ORDER).slice(0, Math.abs(fifths)).split('')
          expect(ascii(q.correct)).toBe(letters.map((l) => `${l}${fifths > 0 ? '#' : 'b'}`).join(' '))
        }
      }
    }
  })

  it('list questions need level 2 and never ask about a key with no accidentals', () => {
    expect(many(signatureFromKeyGenerator, 300, 1).every((q) => q.id.includes(':count:'))).toBe(true)
    const l2 = many(signatureFromKeyGenerator, 400, 2)
    expect(l2.some((q) => q.id.includes(':list:'))).toBe(true)
    for (const q of l2.filter((x) => x.id.includes(':list:'))) expect(q.correct).not.toBe('None')
  })

  it('offers the opposite kind (same number of sharps as flats) as a tempting wrong answer', () => {
    for (const q of many(signatureFromKeyGenerator, 300, 2)) {
      if (!q.id.includes(':count:') || q.correct.startsWith('No ')) continue
      const labels = choicesOf(q).map((c) => c.label)
      const n = q.correct.split(' ')[0]
      const opposite = q.correct.includes('sharp') ? `${n} flat${n === '1' ? '' : 's'}` : `${n} sharp${n === '1' ? '' : 's'}`
      expect(labels).toContain(opposite)
    }
  })
})

describe('relative-key', () => {
  it('the answer is the key with the same signature (relative) or the same tonic (parallel)', () => {
    for (const level of [1, 2, 3] as const) {
      for (const q of many(relativeKeyGenerator, 300, level)) {
        const m = /What is the (relative|parallel) (major|minor) of ([A-G][♯♭]? (?:major|minor))\?/.exec(q.prompt)!
        const [, relation, answerMode, asked] = m
        expect(q.correct.endsWith(answerMode!)).toBe(true)
        expect(asked!.endsWith(answerMode === 'major' ? 'minor' : 'major')).toBe(true)
        if (relation === 'relative') {
          expect(fifthsOfName(q.correct)).toBe(fifthsOfName(asked!))
        } else {
          expect(ascii(q.correct).split(' ')[0]).toBe(ascii(asked!).split(' ')[0])
        }
        expect(q.id).toContain(`relative-key:${relation}:`)
      }
    }
  })

  it('level 1 asks only for relative keys; parallel keys start at level 2', () => {
    expect(many(relativeKeyGenerator, 300, 1).every((q) => q.id.includes(':relative:'))).toBe(true)
    expect(many(relativeKeyGenerator, 400, 2).some((q) => q.id.includes(':parallel:'))).toBe(true)
  })

  it('the parallel key is on offer when asking for the relative key, and the other way round', () => {
    for (const q of many(relativeKeyGenerator, 400, 2)) {
      const m = /What is the (relative|parallel) (major|minor) of ([A-G][♯♭]? (?:major|minor))\?/.exec(q.prompt)!
      const asked = ascii(m[3]!)
      const labels = choicesOf(q).map((c) => ascii(c.label))
      if (m[1] === 'relative') {
        // same tonic as the asked key, other mode
        expect(labels).toContain(`${asked.split(' ')[0]} ${m[2]}`)
      } else {
        expect(labels.some((l) => fifthsOfName(l) === fifthsOfName(asked))).toBe(true)
      }
    }
  })

  it('no wrong answer is also correct', () => {
    for (const q of many(relativeKeyGenerator, 400, 3)) {
      const m = /What is the (relative|parallel) (major|minor) of ([A-G][♯♭]? (?:major|minor))\?/.exec(q.prompt)!
      const asked = ascii(m[3]!)
      for (const c of choicesOf(q)) {
        if (c.id === q.correct) continue
        const wrongRelative = fifthsOfName(c.label) !== fifthsOfName(asked)
        const wrongParallel = ascii(c.label).split(' ')[0] !== asked.split(' ')[0]
        expect(m[1] === 'relative' ? wrongRelative : wrongParallel).toBe(true)
      }
    }
  })
})

describe('every key shown is one of the 30 that exist in practice', () => {
  it('asked keys, answers and wrong answers all have seven sharps or flats or fewer', () => {
    for (const level of [1, 2, 3] as const) {
      for (const g of [keyFromSignatureGenerator, signatureFromKeyGenerator, relativeKeyGenerator]) {
        for (const q of many(g, 300, level)) {
          for (const c of choicesOf(q)) {
            if (/[A-G][♯♭]? (major|minor)/.test(c.label)) expect(() => fifthsOfName(c.label), `${q.id}: ${c.label}`).not.toThrow()
          }
          const asked = /([A-G][♯♭]? (?:major|minor))/.exec(q.prompt)
          if (asked) expect(() => fifthsOfName(asked[1]!), q.prompt).not.toThrow()
        }
      }
    }
  })
})
