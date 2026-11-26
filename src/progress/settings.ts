import { useSyncExternalStore } from 'react'

/**
 * Settings that survive closing the app. Stored on this device only.
 * The version number lets later versions of the app change the shape safely.
 */
interface StoredSettings {
  readonly version: 1
  readonly soundEnabled: boolean
}

const KEY = 'theory-trainer:settings'
const DEFAULTS: StoredSettings = { version: 1, soundEnabled: true }

let cache: StoredSettings | null = null
const listeners = new Set<() => void>()

function read(): StoredSettings {
  if (cache) return cache
  try {
    const text = localStorage.getItem(KEY)
    if (text) {
      const parsed: unknown = JSON.parse(text)
      if (typeof parsed === 'object' && parsed !== null && (parsed as { version?: unknown }).version === 1) {
        const sound = (parsed as { soundEnabled?: unknown }).soundEnabled
        cache = { version: 1, soundEnabled: typeof sound === 'boolean' ? sound : DEFAULTS.soundEnabled }
        return cache
      }
    }
  } catch {
    // storage blocked or damaged: use the defaults
  }
  cache = DEFAULTS
  return cache
}

function write(next: StoredSettings): void {
  cache = next
  try {
    localStorage.setItem(KEY, JSON.stringify(next))
  } catch {
    // storage blocked: the setting still works until the app is closed
  }
  for (const listener of listeners) listener()
}

export function getSoundEnabled(): boolean {
  return read().soundEnabled
}

export function setSoundEnabled(enabled: boolean): void {
  write({ ...read(), soundEnabled: enabled })
}

/** For tests: forget what was read so the next call reads storage again. */
export function resetSettingsCache(): void {
  cache = null
}

/** Sound on/off as a React value that updates when it changes. */
export function useSoundEnabled(): boolean {
  return useSyncExternalStore(
    (callback) => {
      listeners.add(callback)
      return () => listeners.delete(callback)
    },
    getSoundEnabled,
  )
}
