import { describe, expect, it } from 'vitest'
import { parseHash, parseHashQuery } from './route'

describe('parseHash', () => {
  it.each([
    ['', '/'],
    ['#', '/'],
    ['#/', '/'],
    ['#/practice', '/practice'],
    ['#practice', '/practice'],
    ['#/practice/', '/practice'],
    ['#/practice?topic=clefs', '/practice'],
  ])('%j -> %j', (hash, expected) => {
    expect(parseHash(hash)).toBe(expected)
  })
})

describe('parseHashQuery', () => {
  it('reads parameters after the question mark', () => {
    const q = parseHashQuery('#/practice/play?clefs=alto,bass&ledger=2')
    expect(q.get('clefs')).toBe('alto,bass')
    expect(q.get('ledger')).toBe('2')
  })

  it('is empty when there is no query', () => {
    expect([...parseHashQuery('#/practice')]).toEqual([])
    expect([...parseHashQuery('')]).toEqual([])
  })
})
