import { CLEF_NAMES, type ClefName } from '../../theory'

export interface PracticeConfig {
  readonly clefs: readonly ClefName[]
  /** Most ledger lines above or below the staff, 0 to 3. */
  readonly maxLedgerLines: number
}

export const DEFAULT_PRACTICE_CONFIG: PracticeConfig = { clefs: ['alto'], maxLedgerLines: 1 }

/** Reads the setup from the page address. Anything missing or invalid falls back to the default for that part. */
export function parsePracticeConfig(query: URLSearchParams): PracticeConfig {
  const requested = (query.get('clefs') ?? '').split(',')
  const clefs = CLEF_NAMES.filter((clef) => requested.includes(clef))
  const ledgerText = query.get('ledger')
  const ledger = ledgerText !== null && /^[0-3]$/.test(ledgerText) ? Number(ledgerText) : DEFAULT_PRACTICE_CONFIG.maxLedgerLines
  return {
    clefs: clefs.length > 0 ? clefs : DEFAULT_PRACTICE_CONFIG.clefs,
    maxLedgerLines: ledger,
  }
}

/** The part of the address after "?" for this setup. Clefs are always in the same order. */
export function practiceConfigToQuery(config: PracticeConfig): string {
  const clefs = CLEF_NAMES.filter((clef) => config.clefs.includes(clef))
  return `clefs=${clefs.join(',')}&ledger=${config.maxLedgerLines}`
}
