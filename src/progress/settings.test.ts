// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest'
import { getSoundEnabled, resetSettingsCache, setSoundEnabled } from './settings'

beforeEach(() => {
  localStorage.clear()
  resetSettingsCache()
})

describe('settings', () => {
  it('sound is on by default', () => {
    expect(getSoundEnabled()).toBe(true)
  })

  it('remembers the choice after the app is reopened (a fresh read of storage)', () => {
    setSoundEnabled(false)
    resetSettingsCache()
    expect(getSoundEnabled()).toBe(false)
    setSoundEnabled(true)
    resetSettingsCache()
    expect(getSoundEnabled()).toBe(true)
  })

  it('stores a version number', () => {
    setSoundEnabled(false)
    expect(JSON.parse(localStorage.getItem('theory-trainer:settings')!)).toEqual({ version: 1, soundEnabled: false, theme: 'auto' })
  })

  it('ignores damaged or unknown data and falls back to the defaults', () => {
    for (const bad of ['not json', '{"version":2,"soundEnabled":false}', '{"version":1,"soundEnabled":"no"}', 'null', '[]']) {
      localStorage.setItem('theory-trainer:settings', bad)
      resetSettingsCache()
      expect(getSoundEnabled(), bad).toBe(true)
    }
  })

  it('keeps working when storage is blocked', () => {
    const original = Storage.prototype.setItem
    Storage.prototype.setItem = () => {
      throw new Error('blocked')
    }
    try {
      expect(() => setSoundEnabled(false)).not.toThrow()
      expect(getSoundEnabled()).toBe(false)
    } finally {
      Storage.prototype.setItem = original
    }
  })
})

describe('theme', () => {
  it('follows the device by default, and remembers a choice', async () => {
    const { getTheme, setTheme } = await import('./settings')
    expect(getTheme()).toBe('auto')
    setTheme('dark')
    resetSettingsCache()
    expect(getTheme()).toBe('dark')
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark')
    setTheme('auto')
    expect(document.documentElement.hasAttribute('data-theme')).toBe(false)
  })

  it('ignores an unknown theme and keeps the sound setting', () => {
    localStorage.setItem('theory-trainer:settings', '{"version":1,"soundEnabled":false,"theme":"purple"}')
    resetSettingsCache()
    expect(getSoundEnabled()).toBe(false)
  })
})
