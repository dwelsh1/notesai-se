import { describe, it, expect, beforeEach } from 'vitest'
import { defaultConfig, loadConfig, saveConfig } from './appConfig'

describe('appConfig', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('returns defaults when storage is empty', () => {
    expect(loadConfig()).toEqual(defaultConfig)
  })

  it('merges stored config with defaults', () => {
    saveConfig({ ...defaultConfig, theme: 'light' })
    expect(loadConfig().theme).toBe('light')
  })
})
