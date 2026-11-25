import { useSyncExternalStore } from 'react'
import { parseHash } from './route'

function subscribe(callback: () => void) {
  window.addEventListener('hashchange', callback)
  return () => window.removeEventListener('hashchange', callback)
}

/** Current route path taken from the URL hash, e.g. "/" or "/practice". */
export function useHashRoute(): string {
  return useSyncExternalStore(subscribe, () => parseHash(window.location.hash))
}
