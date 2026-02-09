export type AppConfig = {
  aiEndpoint: string
  aiModel: string
  aiTemperature: number
  theme: 'light' | 'dark'
}

export const defaultConfig: AppConfig = {
  aiEndpoint: 'http://localhost:1234/v1',
  aiModel: 'llama-3.1-8b-instruct',
  aiTemperature: 0.2,
  theme: 'dark',
}

const STORAGE_KEY = 'notesai-se:config'

export function loadConfig(storage: Storage = localStorage): AppConfig {
  try {
    const raw = storage.getItem(STORAGE_KEY)
    if (!raw) return defaultConfig
    const parsed = JSON.parse(raw) as Partial<AppConfig>
    return { ...defaultConfig, ...parsed }
  } catch {
    return defaultConfig
  }
}

export function saveConfig(config: AppConfig, storage: Storage = localStorage) {
  storage.setItem(STORAGE_KEY, JSON.stringify(config))
}
