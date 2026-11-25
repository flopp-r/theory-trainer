import { describe, expect, it } from 'vitest'
import { parseHash } from './route'

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
