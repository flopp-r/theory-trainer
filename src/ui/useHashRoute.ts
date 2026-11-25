import { useSyncExternalStore } from 'react'

function subscribe(callback: () => void) {
  window.addEventListener('hashchange', callback)
  return () => window.removeEventListener('hashchange', callback)
}

/** The raw URL hash, e.g. "#/practice/play?clefs=alto". Use parseHash and parseHashQuery to read it. */
export function useHash(): string {
  return useSyncExternalStore(subscribe, () => window.location.hash)
}
