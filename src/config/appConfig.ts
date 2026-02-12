export type CustomPrompt = {
  system?: string
  user: string
}

export type AppConfig = {
  aiEndpoint: string
  aiModel: string
  aiTemperature: number
  aiEnabled: boolean
  aiMaxTokens: number
  aiEmbeddingModel: string
  aiCodeModel: string
  aiChatModel: string
  customPrompts: Record<string, CustomPrompt>
  theme: 'light' | 'dark'
  rememberSidebarWidth: boolean
  sidebarWidth: number | null
  backupPath: string
  exportPath: string
  importPath: string
}

export const defaultConfig: AppConfig = {
  aiEndpoint: 'http://127.0.0.1:1234/v1',
  aiModel: '',
  aiTemperature: 0.2,
  aiEnabled: true,
  aiMaxTokens: 800,
  aiEmbeddingModel: 'nomic-embed-text-v1.5',
  aiCodeModel: '',
  aiChatModel: '',
  customPrompts: {},
  theme: 'dark',
  rememberSidebarWidth: false,
  sidebarWidth: null,
  backupPath: '',
  exportPath: '',
  importPath: '',
}

const STORAGE_KEY = 'notesai-se:config'

// Migration helper: ensure old configs get new fields
function migrateConfig(config: Partial<AppConfig>): AppConfig {
  return {
    ...defaultConfig,
    ...config,
    // Ensure new fields exist even if not in old config
    aiEnabled: config.aiEnabled !== undefined ? config.aiEnabled : defaultConfig.aiEnabled,
    aiMaxTokens: config.aiMaxTokens !== undefined ? config.aiMaxTokens : defaultConfig.aiMaxTokens,
    aiEmbeddingModel:
      config.aiEmbeddingModel !== undefined
        ? config.aiEmbeddingModel
        : defaultConfig.aiEmbeddingModel,
    aiCodeModel: config.aiCodeModel !== undefined ? config.aiCodeModel : defaultConfig.aiCodeModel,
    aiChatModel: config.aiChatModel !== undefined ? config.aiChatModel : defaultConfig.aiChatModel,
    customPrompts:
      config.customPrompts !== undefined ? config.customPrompts : defaultConfig.customPrompts,
    backupPath: config.backupPath !== undefined ? config.backupPath : defaultConfig.backupPath,
    exportPath: config.exportPath !== undefined ? config.exportPath : defaultConfig.exportPath,
    importPath: config.importPath !== undefined ? config.importPath : defaultConfig.importPath,
  }
}

export function loadConfig(storage: Storage = localStorage): AppConfig {
  try {
    const raw = storage.getItem(STORAGE_KEY)
    if (!raw) return defaultConfig
    const parsed = JSON.parse(raw) as Partial<AppConfig>
    return migrateConfig(parsed)
  } catch {
    return defaultConfig
  }
}

export function saveConfig(config: AppConfig, storage: Storage = localStorage) {
  storage.setItem(STORAGE_KEY, JSON.stringify(config))
}
