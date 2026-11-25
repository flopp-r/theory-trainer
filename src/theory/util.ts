/** Positive modulo: result is always in 0..n-1. */
export function mod(value: number, n: number): number {
  return ((value % n) + n) % n
}

/** Array lookup that throws instead of returning undefined. */
export function at<T>(items: readonly T[], index: number): T {
  const item = items[index]
  if (item === undefined) {
    throw new RangeError(`Index ${index} is out of range (length ${items.length})`)
  }
  return item
}
