import { describe, expect, it } from 'vitest'
import { DEFAULT_PRACTICE_CONFIG, parsePracticeConfig, practiceConfigToQuery } from './practiceConfig'

const parse = (text: string) => parsePracticeConfig(new URLSearchParams(text))

describe('parsePracticeConfig', () => {
  it('reads clefs and ledger lines', () => {
    expect(parse('clefs=treble,bass&ledger=2')).toEqual({ clefs: ['treble', 'bass'], maxLedgerLines: 2 })
  })

  it('puts clefs in a fixed order and ignores duplicates', () => {
    expect(parse('clefs=tenor,alto,treble,alto&ledger=0').clefs).toEqual(['treble', 'alto', 'tenor'])
  })

  it('falls back to the defaults when parts are missing or invalid', () => {
    expect(parse('')).toEqual(DEFAULT_PRACTICE_CONFIG)
    expect(parse('clefs=flute&ledger=9')).toEqual(DEFAULT_PRACTICE_CONFIG)
    expect(parse('clefs=&ledger=')).toEqual(DEFAULT_PRACTICE_CONFIG)
    expect(parse('clefs=bass&ledger=-1')).toEqual({ clefs: ['bass'], maxLedgerLines: DEFAULT_PRACTICE_CONFIG.maxLedgerLines })
    expect(parse('clefs=bass&ledger=1.5').maxLedgerLines).toBe(DEFAULT_PRACTICE_CONFIG.maxLedgerLines)
  })

  it('round-trips through the address', () => {
    for (const config of [
      { clefs: ['treble'], maxLedgerLines: 0 },
      { clefs: ['treble', 'bass', 'alto', 'tenor'], maxLedgerLines: 3 },
      { clefs: ['alto', 'tenor'], maxLedgerLines: 2 },
    ] as const) {
      expect(parse(practiceConfigToQuery(config))).toEqual(config)
    }
  })
})
