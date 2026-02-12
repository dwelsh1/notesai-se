import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Monitor,
  HardDrive,
  Package,
  Settings,
  Zap,
  Laptop,
  FolderOpen,
  Sparkles,
  FileText,
  RefreshCw,
  FileDown,
  Download,
  Copy,
  Check,
} from 'lucide-react'
import { loadConfig } from '../config/appConfig'
import { usePages } from '../state/pagesContext'
import { checkAIConnection } from '../services/aiConnection'
import {
  exportDiagnosticsHTML,
  exportDiagnosticsJSON,
  type AiInfo,
  type DiagnosticsState,
  type PagesInfo,
} from '../utils/diagnostics'
import { useDiagnostics } from '../hooks/useDiagnostics'
import { useLogger } from '../hooks/useLogger'
import type { ConnectionCheckResult } from '../services/aiConnection'

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

function buildPagesInfo(pages: { title: string; contentMarkdown: string; favorited: boolean; trashed: boolean; parentId: string | null }[]): PagesInfo {
  const totalPages = pages.length
  const favorites = pages.filter((p) => p.favorited && !p.trashed).length
  const trash = pages.filter((p) => p.trashed).length
  const rootPages = pages.filter((p) => !p.parentId && !p.trashed).length
  const withContent = pages.filter((p) => (p.contentMarkdown ?? '').trim().length > 0).length
  const emptyPages = totalPages - withContent
  let totalBytes = 0
  for (const p of pages) {
    totalBytes += ((p.title ?? '') + (p.contentMarkdown ?? '')).length * 2
  }
  return {
    totalPages,
    favorites,
    trash,
    expanded: 0,
    rootPages,
    withContent,
    emptyPages,
    withTags: 0,
    totalStorage: formatBytes(totalBytes),
  }
}

function buildAiInfo(
  config: ReturnType<typeof loadConfig>,
  connectionResult: ConnectionCheckResult | null,
): AiInfo {
  const status = connectionResult?.status ?? 'unknown'
  const connection =
    status === 'connected'
      ? 'Connected'
      : status === 'disconnected'
        ? 'Disconnected'
        : status === 'connecting'
          ? 'Checking'
          : 'Unknown'
  const lastCheck = connectionResult
    ? connectionResult.message?.toLowerCase().includes('just now')
      ? 'Just now'
      : new Date().toLocaleString()
    : 'Never'
  return {
    enabled: config.aiEnabled,
    connection,
    endpoint: config.aiEndpoint,
    defaultModel: config.aiModel || 'Auto',
    embeddingModel: config.aiEmbeddingModel,
    codeModel: config.aiCodeModel,
    chatModel: config.aiChatModel,
    temperature: config.aiTemperature,
    maxTokens: config.aiMaxTokens,
    availableModels: connectionResult?.models?.length ?? 0,
    lastCheck,
  }
}

function Badge({
  status,
  label,
}: {
  status: 'healthy' | 'offline' | 'warning' | 'working' | 'error'
  label: string
}) {
  const className =
    status === 'healthy' || status === 'working'
      ? 'diagnostics-badge diagnostics-badge--healthy'
      : status === 'error' || status === 'offline'
        ? 'diagnostics-badge diagnostics-badge--error'
        : 'diagnostics-badge diagnostics-badge--warning'
  return <span className={className}>{label}</span>
}

function DiagnosticsCard({
  title,
  icon: Icon,
  children,
  footer,
}: {
  title: string
  icon: React.ElementType
  children: React.ReactNode
  footer?: string
}) {
  return (
    <div className="diagnostics-card">
      <div className="diagnostics-card__header">
        <Icon size={18} className="diagnostics-card__icon" />
        <h3 className="diagnostics-card__title">{title}</h3>
      </div>
      <div className="diagnostics-card__body">{children}</div>
      {footer && <p className="diagnostics-card__footer">{footer}</p>}
    </div>
  )
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="diagnostics-row">
      <span className="diagnostics-row__label">{label}</span>
      <span className="diagnostics-row__value">{value}</span>
    </div>
  )
}

export function SettingsDiagnostics() {
  const [autoRefresh, setAutoRefresh] = useState(false)
  const [aiConnectionResult, setAiConnectionResult] = useState<ConnectionCheckResult | null>(null)
  const [copiedPath, setCopiedPath] = useState<string | null>(null)

  const { diagnostics: baseDiagnostics, isLoading, refresh } = useDiagnostics({
    autoRefresh,
    refreshInterval: 10_000,
  })
  const { pages } = usePages()
  const config = loadConfig()
  const { logs, counts, filterLevel, setFilterLevel, search, setSearch, clear, exportText } =
    useLogger()

  useEffect(() => {
    if (!baseDiagnostics || !config.aiEnabled) return
    checkAIConnection(config.aiEndpoint, config.aiModel, false).then(setAiConnectionResult)
  }, [baseDiagnostics, config.aiEnabled, config.aiEndpoint, config.aiModel])

  const mergedDiagnostics: DiagnosticsState | null = useMemo(() => {
    if (!baseDiagnostics) return null
    const aiInfo = buildAiInfo(config, aiConnectionResult)
    const pagesInfo = buildPagesInfo(pages)
    return { ...baseDiagnostics, aiInfo, pagesInfo }
  }, [baseDiagnostics, config, aiConnectionResult, pages])

  const lastUpdated = mergedDiagnostics?.lastUpdated
    ? new Date(mergedDiagnostics.lastUpdated).toLocaleString()
    : '—'

  const handleExportReport = useCallback(() => {
    if (!mergedDiagnostics) return
    const html = exportDiagnosticsHTML(mergedDiagnostics, { includeLogs: exportText().split('\n') })
    const blob = new Blob([html], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `diagnostics-report-${new Date().toISOString().slice(0, 10)}.html`
    a.click()
    URL.revokeObjectURL(url)
  }, [mergedDiagnostics, exportText])

  const handleExportJson = useCallback(() => {
    if (!mergedDiagnostics) return
    const json = exportDiagnosticsJSON(mergedDiagnostics, {
      includeLogs: exportText().split('\n'),
    })
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `diagnostics-report-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }, [mergedDiagnostics, exportText])

  const handleExportLogs = useCallback(() => {
    const text = exportText()
    const blob = new Blob([text], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `console-logs-${new Date().toISOString().slice(0, 10)}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }, [exportText])

  const copyPath = useCallback(async (path: string) => {
    try {
      await navigator.clipboard.writeText(path)
      setCopiedPath(path)
      setTimeout(() => setCopiedPath(null), 2000)
    } catch {
      // ignore
    }
  }, [])

  const handleResetData = useCallback(() => {
    if (
      !window.confirm(
        'Reset all data? This clears localStorage and sessionStorage, then reloads the app. Cannot be undone.',
      )
    )
      return
    localStorage.clear()
    sessionStorage.clear()
    window.location.reload()
  }, [])

  if (isLoading && !mergedDiagnostics) {
    return (
      <div className="settings-tab-content" data-testid="settings-diagnostics">
        <div className="diagnostics-loading">
          <RefreshCw size={24} className="diagnostics-spinner" />
          <p>Loading diagnostics...</p>
        </div>
      </div>
    )
  }

  const d = mergedDiagnostics!
  const paths = d.electronPaths

  return (
    <div className="settings-tab-content settings-diagnostics" data-testid="settings-diagnostics">
      <div className="diagnostics-header">
        <div className="diagnostics-header__controls">
          <label className="diagnostics-header__checkbox">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
            />
            Auto-refresh (10s)
          </label>
          <button
            type="button"
            className="diagnostics-header__btn"
            onClick={refresh}
            disabled={isLoading}
            title="Refresh diagnostics"
            data-testid="refresh-button"
          >
            {isLoading ? (
              <RefreshCw size={16} className="diagnostics-spinner" />
            ) : (
              <RefreshCw size={16} />
            )}
            Refresh
          </button>
          <button
            type="button"
            className="diagnostics-header__btn"
            onClick={handleExportReport}
            title="Export report as HTML"
            data-testid="export-html-button"
          >
            <FileDown size={16} />
            Export Report
          </button>
          <button
            type="button"
            className="diagnostics-header__btn"
            onClick={handleExportJson}
            title="Export report as JSON"
            data-testid="export-json-button"
          >
            <Download size={16} />
            JSON
          </button>
          <button
            type="button"
            className="diagnostics-header__btn"
            onClick={handleExportLogs}
            title="Export console logs"
            data-testid="export-logs-button"
          >
            <FileDown size={16} />
            Export Logs
          </button>
        </div>
        <span className="diagnostics-header__updated">Last updated: {lastUpdated}</span>
      </div>

      <div className="diagnostics-grid">
        <DiagnosticsCard
          title="System Status"
          icon={Monitor}
          footer='"Healthy" means everything is working. "Offline" indicates a connection issue.'
        >
          <Row label="Server" value={<Badge status={d.systemStatus.server} label={d.systemStatus.server.toUpperCase()} />} />
          <Row label="API" value={<Badge status={d.systemStatus.api} label={d.systemStatus.api.toUpperCase()} />} />
          <Row
            label="Online Status"
            value={<Badge status={d.systemStatus.onlineStatus} label={d.systemStatus.onlineStatus.toUpperCase()} />}
          />
        </DiagnosticsCard>

        <DiagnosticsCard
          title="Storage"
          icon={HardDrive}
          footer='If you see "Error", try clearing your browser cache or using a different browser.'
        >
          <Row
            label="localStorage"
            value={
              <>
                {d.storage.localStorageUsed && `Used: ${d.storage.localStorageUsed} · `}
                <Badge status={d.storage.localStorage} label={d.storage.localStorage.toUpperCase()} />
              </>
            }
          />
          <Row
            label="sessionStorage"
            value={
              <>
                {d.storage.sessionStorageUsed && `Used: ${d.storage.sessionStorageUsed} · `}
                <Badge status={d.storage.sessionStorage} label={d.storage.sessionStorage.toUpperCase()} />
              </>
            }
          />
        </DiagnosticsCard>

        <DiagnosticsCard title="Package Versions" icon={Package}>
          <Row label="Editor (Tiptap)" value={d.packages.editor} />
          <Row label="UI (React)" value={d.packages.ui} />
          <Row label="Utils (Context)" value={d.packages.utils} />
          <Row label="Types (TypeScript)" value={d.packages.types} />
        </DiagnosticsCard>

        <DiagnosticsCard title="App Environment" icon={Settings}>
          <Row label="Platform" value={d.environment.platform} />
          <Row label="Version" value={d.environment.version} />
          <Row label="OS Platform" value={d.environment.osPlatform} />
          <Row label="Hostname" value={d.environment.hostname} />
          <Row label="Port" value={d.environment.port} />
        </DiagnosticsCard>

        <DiagnosticsCard
          title="Performance Metrics"
          icon={Zap}
          footer="Memory usage is only available in Chrome-based browsers."
        >
          <Row label="Uptime" value={d.performance.uptime} />
          <Row label="Memory Usage" value={d.performance.memoryUsage} />
          <Row label="Node Version" value={d.performance.nodeVersion} />
        </DiagnosticsCard>

        <DiagnosticsCard title="System Information" icon={Laptop}>
          <Row label="Platform" value={d.systemInfo.platform} />
          <Row label="Architecture" value={d.systemInfo.architecture} />
          <Row label="Process ID" value={d.systemInfo.processId} />
          <Row
            label="User Agent"
            value={
              <span title={d.systemInfo.userAgent} className="diagnostics-row__value--truncate">
                {d.systemInfo.userAgent.slice(0, 60)}…
              </span>
            }
          />
        </DiagnosticsCard>

        {paths && (
          <DiagnosticsCard title="Electron Paths" icon={FolderOpen}>
            {[
              { label: 'User Data', path: paths.userData },
              { label: 'Logs', path: paths.logs },
              { label: 'Backups', path: paths.backups },
              ...(paths.dbPath ? [{ label: 'Database', path: paths.dbPath }] : []),
            ].map(({ label, path: p }) => (
              <div key={label} className="diagnostics-row diagnostics-row--copy">
                <span className="diagnostics-row__label">{label}</span>
                <span className="diagnostics-row__value diagnostics-row__value--path">{p}</span>
                <button
                  type="button"
                  className="diagnostics-copy-btn"
                  onClick={() => copyPath(p)}
                  title="Copy path"
                >
                  {copiedPath === p ? <Check size={14} /> : <Copy size={14} />}
                </button>
              </div>
            ))}
          </DiagnosticsCard>
        )}

        {d.aiInfo && (
          <DiagnosticsCard title="AI Information" icon={Sparkles}>
            <Row label="Enabled" value={d.aiInfo.enabled ? 'Yes' : 'No'} />
            <Row
              label="Connection"
              value={
                <Badge
                  status={
                    d.aiInfo.connection === 'Connected'
                      ? 'healthy'
                      : d.aiInfo.connection === 'Disconnected'
                        ? 'error'
                        : 'warning'
                  }
                  label={d.aiInfo.connection}
                />
              }
            />
            <Row label="Endpoint" value={<code className="diagnostics-mono">{d.aiInfo.endpoint}</code>} />
            <Row label="Default Model" value={d.aiInfo.defaultModel} />
            <Row label="Embedding Model" value={d.aiInfo.embeddingModel} />
            <Row label="Code Model" value={d.aiInfo.codeModel} />
            <Row label="Chat Model" value={d.aiInfo.chatModel} />
            <Row label="Temperature" value={String(d.aiInfo.temperature)} />
            <Row label="Max Tokens" value={String(d.aiInfo.maxTokens)} />
            <Row label="Available Models" value={String(d.aiInfo.availableModels)} />
            <Row label="Last Check" value={d.aiInfo.lastCheck} />
          </DiagnosticsCard>
        )}

        {d.pagesInfo && (
          <DiagnosticsCard title="Pages Information" icon={FileText}>
            <Row label="Total Pages" value={String(d.pagesInfo.totalPages)} />
            <Row label="Favorites" value={String(d.pagesInfo.favorites)} />
            <Row label="Trash" value={String(d.pagesInfo.trash)} />
            <Row label="Root Pages" value={String(d.pagesInfo.rootPages)} />
            <Row label="With Content" value={String(d.pagesInfo.withContent)} />
            <Row label="Empty Pages" value={String(d.pagesInfo.emptyPages)} />
            <Row label="With Tags" value={String(d.pagesInfo.withTags)} />
            <Row label="Total Storage" value={d.pagesInfo.totalStorage} />
          </DiagnosticsCard>
        )}
      </div>

      <div className="diagnostics-section">
        <h3 className="diagnostics-section__title">Quick Actions</h3>
        <div className="diagnostics-actions">
          <button
            type="button"
            className="diagnostics-action-btn diagnostics-action-btn--neutral"
            onClick={() => window.location.reload()}
            data-testid="reload-app-button"
          >
            Reload App
          </button>
          <button
            type="button"
            className="diagnostics-action-btn diagnostics-action-btn--danger"
            onClick={handleResetData}
            data-testid="reset-data-button"
          >
            Reset Data
          </button>
        </div>
        <p className="diagnostics-section__footer">
          Reload App refreshes the page. Reset Data clears localStorage and sessionStorage, then
          reloads (cannot be undone).
        </p>
      </div>

      <div className="diagnostics-section">
        <div className="diagnostics-section__head">
          <h3 className="diagnostics-section__title">Console Logs ({counts.total})</h3>
          <button
            type="button"
            className="diagnostics-header__btn"
            onClick={clear}
            data-testid="clear-logs-button"
          >
            Clear
          </button>
        </div>
        <div className="diagnostics-logs-toolbar">
          <input
            type="text"
            className="diagnostics-logs-search"
            placeholder="Search logs..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            data-testid="search-logs-input"
          />
          <select
            className="diagnostics-logs-filter"
            value={filterLevel}
            onChange={(e) => setFilterLevel(e.target.value as 'all' | 'log' | 'info' | 'warn' | 'error' | 'debug')}
            data-testid="filter-level-select"
          >
            <option value="all">All ({counts.total})</option>
            <option value="error">Error ({counts.byLevel.error})</option>
            <option value="warn">Warn ({counts.byLevel.warn})</option>
            <option value="info">Info ({counts.byLevel.info})</option>
            <option value="log">Log ({counts.byLevel.log})</option>
            <option value="debug">Debug ({counts.byLevel.debug})</option>
          </select>
        </div>
        <div
          className="diagnostics-logs-display"
          data-testid="console-logs-display"
          role="log"
          aria-live="polite"
        >
          {logs.length === 0 ? (
            <div className="diagnostics-logs-empty">No logs to display</div>
          ) : (
            logs.map((e) => (
              <div
                key={e.id}
                className={`diagnostics-log-line diagnostics-log-line--${e.level}`}
              >
                <span className="diagnostics-log-time">
                  {new Date(e.timestamp).toLocaleTimeString()}
                </span>
                <span className="diagnostics-log-level">[{e.level.toUpperCase()}]</span>
                <span className="diagnostics-log-msg">{e.message}</span>
                {e.stack && (
                  <pre className="diagnostics-log-stack">{e.stack}</pre>
                )}
              </div>
            ))
          )}
        </div>
        <p className="diagnostics-section__footer">
          Real-time log capture. Last 1000 entries shown. Use search and filters.
        </p>
      </div>
    </div>
  )
}
