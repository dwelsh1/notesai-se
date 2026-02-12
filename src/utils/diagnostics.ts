/**
 * Diagnostics state and helpers for Settings → Diagnostics tab.
 * Adapted for NotesAI SE (Electron + SQLite, no PocketBase).
 */

export type HealthStatus = 'healthy' | 'offline' | 'warning'
export type StorageStatus = 'working' | 'error'

export type SystemStatus = {
  server: HealthStatus
  api: HealthStatus
  onlineStatus: HealthStatus
}

export type StorageInfo = {
  localStorage: StorageStatus
  sessionStorage: StorageStatus
  localStorageUsed?: string
  sessionStorageUsed?: string
}

export type PackageVersions = {
  editor: string
  ui: string
  utils: string
  types: string
}

export type EnvironmentInfo = {
  platform: string
  version: string
  osPlatform: string
  hostname: string
  port: string
  url?: string
}

export type PerformanceInfo = {
  uptime: string
  memoryUsage: string
  nodeVersion: string
}

export type SystemInfo = {
  platform: string
  architecture: string
  processId: string
  userAgent: string
}

export type ElectronPaths = {
  userData: string
  logs: string
  backups: string
  dbPath?: string
}

export type AiInfo = {
  enabled: boolean
  connection: string
  endpoint: string
  defaultModel: string
  embeddingModel: string
  codeModel: string
  chatModel: string
  temperature: number
  maxTokens: number
  availableModels: number
  lastCheck: string
}

export type PagesInfo = {
  totalPages: number
  favorites: number
  trash: number
  expanded: number
  rootPages: number
  withContent: number
  emptyPages: number
  withTags: number
  totalStorage: string
}

export type DiagnosticsState = {
  systemStatus: SystemStatus
  storage: StorageInfo
  packages: PackageVersions
  environment: EnvironmentInfo
  performance: PerformanceInfo
  systemInfo: SystemInfo
  electronPaths?: ElectronPaths
  aiInfo?: AiInfo
  pagesInfo?: PagesInfo
  lastUpdated: number
}

const SENSITIVE_KEYS = ['token', 'password', 'auth', 'secret', 'key', 'email']

function redactRecursive(obj: unknown): unknown {
  if (obj === null || typeof obj !== 'object') return obj
  if (Array.isArray(obj)) return obj.map(redactRecursive)
  const out: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(obj)) {
    const lower = k.toLowerCase()
    if (SENSITIVE_KEYS.some((s) => lower.includes(s))) {
      out[k] = '[REDACTED]'
    } else {
      out[k] = redactRecursive(v)
    }
  }
  return out
}

function getLocalStorageUsed(): string {
  try {
    let total = 0
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key) {
        const val = localStorage.getItem(key) ?? ''
        total += (key.length + val.length) * 2
      }
    }
    if (total < 1024) return `${total} B`
    if (total < 1024 * 1024) return `${(total / 1024).toFixed(2)} KB`
    return `${(total / (1024 * 1024)).toFixed(2)} MB`
  } catch {
    return '0 B'
  }
}

function getSessionStorageUsed(): string {
  try {
    let total = 0
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i)
      if (key) {
        const val = sessionStorage.getItem(key) ?? ''
        total += (key.length + val.length) * 2
      }
    }
    if (total < 1024) return `${total} B`
    if (total < 1024 * 1024) return `${(total / 1024).toFixed(2)} KB`
    return `${(total / (1024 * 1024)).toFixed(2)} MB`
  } catch {
    return '0 B'
  }
}

function getStorageStatus(): StorageInfo {
  let localStorageStatus: StorageStatus = 'working'
  let sessionStorageStatus: StorageStatus = 'working'
  try {
    localStorage.setItem('_diag', '1')
    localStorage.removeItem('_diag')
  } catch {
    localStorageStatus = 'error'
  }
  try {
    sessionStorage.setItem('_diag', '1')
    sessionStorage.removeItem('_diag')
  } catch {
    sessionStorageStatus = 'error'
  }
  return {
    localStorage: localStorageStatus,
    sessionStorage: sessionStorageStatus,
    localStorageUsed: localStorageStatus === 'working' ? getLocalStorageUsed() : undefined,
    sessionStorageUsed: sessionStorageStatus === 'working' ? getSessionStorageUsed() : undefined,
  }
}

let appStartTime = Date.now()

function formatUptime(ms: number): string {
  const sec = Math.floor(ms / 1000) % 60
  const min = Math.floor(ms / 60000) % 60
  const hr = Math.floor(ms / 3600000)
  return [hr, min, sec].map((n) => String(n).padStart(2, '0')).join(':')
}

export function getDiagnosticsState(options: {
  electronPaths?: ElectronPaths
  nodeVersion?: string
  aiInfo?: AiInfo
  pagesInfo?: PagesInfo
}): DiagnosticsState {
  const { electronPaths, nodeVersion = 'N/A', aiInfo, pagesInfo } = options
  const nav = typeof navigator !== 'undefined' ? navigator : { onLine: true, userAgent: '' }
  const onlineStatus: HealthStatus = nav.onLine ? 'healthy' : 'offline'

  const storage = getStorageStatus()

  const state: DiagnosticsState = {
    systemStatus: {
      server: 'healthy',
      api: 'healthy',
      onlineStatus,
    },
    storage,
    packages: {
      editor: '2.x (Tiptap)',
      ui: '18.3.1',
      utils: 'Context',
      types: '5.9 (TypeScript)',
    },
    environment: {
      platform: typeof window?.notesAISE !== 'undefined' ? 'Desktop App (Electron)' : 'Browser',
      version: '0.2.0',
      osPlatform: typeof navigator !== 'undefined' ? navigator.platform : 'Unknown',
      hostname: typeof window !== 'undefined' && window.location?.hostname ? window.location.hostname : 'localhost',
      port: typeof window !== 'undefined' && window.location?.port ? window.location.port : 'N/A',
      url: typeof window !== 'undefined' ? window.location.href : undefined,
    },
    performance: {
      uptime: formatUptime(Date.now() - appStartTime),
      memoryUsage: (() => {
        const perf = typeof performance !== 'undefined' ? (performance as unknown as { memory?: { usedJSHeapSize: number } }) : undefined
        const used = perf?.memory?.usedJSHeapSize
        if (used != null) {
          return `${Math.round(used / (1024 * 1024))} MB`
        }
        return 'N/A'
      })(),
      nodeVersion,
    },
    systemInfo: {
      platform: typeof navigator !== 'undefined' ? navigator.platform : 'Unknown',
      architecture: typeof navigator !== 'undefined' ? (navigator.userAgent?.includes('WOW64') || navigator.userAgent?.includes('Win64') ? 'x64' : 'Unknown') : 'Unknown',
      processId: 'N/A',
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
    },
    lastUpdated: Date.now(),
  }

  if (electronPaths) state.electronPaths = electronPaths
  if (aiInfo) state.aiInfo = aiInfo
  if (pagesInfo) state.pagesInfo = pagesInfo

  return state
}

export function setAppStartTimeForDiagnostics(time: number) {
  appStartTime = time
}

export function redactSensitive(obj: unknown): unknown {
  return redactRecursive(obj)
}

export function exportDiagnosticsJSON(
  diagnostics: DiagnosticsState,
  options?: { includeLogs?: string[] },
): string {
  const payload = {
    timestamp: new Date().toISOString(),
    version: '0.2.0',
    diagnostics: redactSensitive(diagnostics) as DiagnosticsState,
    ...(options?.includeLogs && options.includeLogs.length > 0 ? { consoleLogs: options.includeLogs } : {}),
  }
  return JSON.stringify(payload, null, 2)
}

export function exportDiagnosticsHTML(
  diagnostics: DiagnosticsState,
  options?: { includeLogs?: string[] },
): string {
  const d = diagnostics
  const rows = (label: string, value: string) =>
    `<tr><td style="padding:4px 8px;font-weight:600;">${escapeHtml(label)}</td><td style="padding:4px 8px;">${escapeHtml(value)}</td></tr>`
  const section = (title: string, body: string) =>
    `<h3 style="margin-top:16px;">${escapeHtml(title)}</h3><table style="border-collapse:collapse;">${body}</table>`

  let html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>System Diagnostics Report</title></head><body style="font-family:sans-serif;padding:24px;max-width:800px;">`
  html += `<h1>System Diagnostics Report</h1><p>Generated: ${escapeHtml(new Date().toISOString())}</p>`

  html += section(
    'System Status',
    rows('Server', d.systemStatus.server) + rows('API', d.systemStatus.api) + rows('Online', d.systemStatus.onlineStatus),
  )
  html += section(
    'Storage',
    rows('localStorage', d.storage.localStorage + (d.storage.localStorageUsed ? ` (${d.storage.localStorageUsed})` : '')) +
      rows('sessionStorage', d.storage.sessionStorage + (d.storage.sessionStorageUsed ? ` (${d.storage.sessionStorageUsed})` : '')),
  )
  html += section(
    'Package Versions',
    rows('Editor', d.packages.editor) + rows('UI', d.packages.ui) + rows('Utils', d.packages.utils) + rows('Types', d.packages.types),
  )
  html += section(
    'App Environment',
    rows('Platform', d.environment.platform) +
      rows('Version', d.environment.version) +
      rows('OS', d.environment.osPlatform) +
      rows('Hostname', d.environment.hostname) +
      rows('Port', d.environment.port),
  )
  html += section(
    'Performance',
    rows('Uptime', d.performance.uptime) + rows('Memory', d.performance.memoryUsage) + rows('Node', d.performance.nodeVersion),
  )
  html += section(
    'System Information',
    rows('Platform', d.systemInfo.platform) + rows('Architecture', d.systemInfo.architecture) + rows('Process ID', d.systemInfo.processId) + rows('User Agent', d.systemInfo.userAgent.slice(0, 200)),
  )
  if (d.electronPaths) {
    html += section(
      'Electron Paths',
      rows('User Data', d.electronPaths.userData) +
        rows('Logs', d.electronPaths.logs) +
        rows('Backups', d.electronPaths.backups) +
        (d.electronPaths.dbPath ? rows('Database', d.electronPaths.dbPath) : ''),
    )
  }
  if (d.aiInfo) {
    html += section(
      'AI Information',
      rows('Enabled', d.aiInfo.enabled ? 'Yes' : 'No') +
        rows('Connection', d.aiInfo.connection) +
        rows('Endpoint', d.aiInfo.endpoint) +
        rows('Default Model', d.aiInfo.defaultModel) +
        rows('Embedding Model', d.aiInfo.embeddingModel) +
        rows('Chat Model', d.aiInfo.chatModel) +
        rows('Temperature', String(d.aiInfo.temperature)) +
        rows('Max Tokens', String(d.aiInfo.maxTokens)) +
        rows('Available Models', String(d.aiInfo.availableModels)) +
        rows('Last Check', d.aiInfo.lastCheck),
    )
  }
  if (d.pagesInfo) {
    html += section(
      'Pages Information',
      rows('Total Pages', String(d.pagesInfo.totalPages)) +
        rows('Favorites', String(d.pagesInfo.favorites)) +
        rows('Trash', String(d.pagesInfo.trash)) +
        rows('Root Pages', String(d.pagesInfo.rootPages)) +
        rows('With Content', String(d.pagesInfo.withContent)) +
        rows('Empty Pages', String(d.pagesInfo.emptyPages)) +
        rows('With Tags', String(d.pagesInfo.withTags)) +
        rows('Total Storage', d.pagesInfo.totalStorage),
    )
  }
  if (options?.includeLogs && options.includeLogs.length > 0) {
    html += `<h3 style="margin-top:16px;">Console Logs</h3><pre style="background:#1e1e1e;color:#d4d4d4;padding:12px;overflow:auto;max-height:400px;">${escapeHtml(options.includeLogs.join('\n'))}</pre>`
  }
  html += `</body></html>`
  return html
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}
