/**
 * Hash routing: the app lives at /#/something, so it works on any static host
 * and any sub-path without server rewrites.
 */
export function parseHash(hash: string): string {
  const path = hash.replace(/^#/, '').split('?')[0] ?? ''
  const clean = path.replace(/\/+$/, '')
  return clean.startsWith('/') ? clean : '/' + clean
}
