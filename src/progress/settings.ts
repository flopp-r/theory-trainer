import { useSyncExternalStore } from 'react'

/**
 * Settings that survive closing the app. Stored on this device only.
 * The version number lets later versions of the app change the shape safely.
 */
export type Theme = 'auto' | 'light' | 'dark'
export const THEMES: readonly Theme[] = ['auto', 'light', 'dark']

interface StoredSettings {
  readonly version: 1
  readonly soundEnabled: boolean
  /** "auto" follows the device's light or dark setting. */
  readonly theme: Theme
}

/** index.html reads this key too, to set the theme before the page first draws. */
export const SETTINGS_KEY = 'theory-trainer:settings'
const DEFAULTS: StoredSettings = { version: 1, soundEnabled: true, theme: 'auto' }

let cache: StoredSettings | null = null
const listeners = new Set<() => void>()

function read(): StoredSettings {
  if (cache) return cache
  try {
    const text = localStorage.getItem(SETTINGS_KEY)
    if (text) {
      const parsed: unknown = JSON.parse(text)
      if (typeof parsed === 'object' && parsed !== null && (parsed as { version?: unknown }).version === 1) {
        const { soundEnabled: sound, theme } = parsed as { soundEnabled?: unknown; theme?: unknown }
        cache = {
          version: 1,
          soundEnabled: typeof sound === 'boolean' ? sound : DEFAULTS.soundEnabled,
          theme: THEMES.includes(theme as Theme) ? (theme as Theme) : DEFAULTS.theme,
        }
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
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(next))
  } catch {
    // storage blocked: the setting still works until the app is closed
  }
  for (const listener of listeners) listener()
}

function subscribe(callback: () => void): () => void {
  listeners.add(callback)
  return () => listeners.delete(callback)
}

export function getSoundEnabled(): boolean {
  return read().soundEnabled
}

export function setSoundEnabled(enabled: boolean): void {
  write({ ...read(), soundEnabled: enabled })
}

/** Sound on/off as a React value that updates when it changes. */
export function useSoundEnabled(): boolean {
  return useSyncExternalStore(subscribe, getSoundEnabled)
}

export function getTheme(): Theme {
  return read().theme
}

export function setTheme(theme: Theme): void {
  write({ ...read(), theme })
  applyTheme()
}

export function useTheme(): Theme {
  return useSyncExternalStore(subscribe, getTheme)
}

const LIGHT_QUERY = '(prefers-color-scheme: light)'
const deviceIsLight = () => typeof window !== 'undefined' && (window.matchMedia?.(LIGHT_QUERY).matches ?? false)

/** True when the app is showing its light theme, whether chosen or following the device. */
export function isLightTheme(): boolean {
  const theme = getTheme()
  return theme === 'light' || (theme === 'auto' && deviceIsLight())
}

/** The light-or-dark answer as a React value: changes when the setting or the device changes. */
export function useLightTheme(): boolean {
  return useSyncExternalStore((callback) => {
    const query = typeof window !== 'undefined' ? window.matchMedia?.(LIGHT_QUERY) : undefined
    query?.addEventListener('change', callback)
    const stop = subscribe(callback)
    return () => {
      query?.removeEventListener('change', callback)
      stop()
    }
  }, isLightTheme)
}

const BAR_COLOUR = { light: '#f3eee2', dark: '#14120f' }

/** Put the chosen theme on the page (CSS reads data-theme) and colour the browser bar to match. */
export function applyTheme(): void {
  if (typeof document === 'undefined') return
  const theme = getTheme()
  const root = document.documentElement
  if (theme === 'auto') root.removeAttribute('data-theme')
  else root.setAttribute('data-theme', theme)
  for (const meta of document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]')) {
    const forMedia = meta.media.includes('light') ? 'light' : 'dark'
    meta.content = BAR_COLOUR[theme === 'auto' ? forMedia : theme]
  }
}

/** For tests: forget what was read so the next call reads storage again. */
export function resetSettingsCache(): void {
  cache = null
}
