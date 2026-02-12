import { useState, useEffect } from 'react'
import { FolderOpen } from 'lucide-react'
import { useTheme, type Theme } from '../state/themeContext'
import { useSidebar } from '../state/sidebarContext'
import { loadConfig, saveConfig } from '../config/appConfig'

export function SettingsGeneral() {
  const { theme, setTheme } = useTheme()
  const { rememberSidebarWidth, setRememberSidebarWidth } = useSidebar()
  const [backupPath, setBackupPath] = useState('')
  const [exportPath, setExportPath] = useState('')
  const [importPath, setImportPath] = useState('')

  useEffect(() => {
    const config = loadConfig()
    setBackupPath(config.backupPath)
    setExportPath(config.exportPath)
    setImportPath(config.importPath)
  }, [])

  const updatePath = (
    key: 'backupPath' | 'exportPath' | 'importPath',
    value: string,
  ) => {
    const config = loadConfig()
    const next = { ...config, [key]: value }
    saveConfig(next)
    if (key === 'backupPath') setBackupPath(value)
    if (key === 'exportPath') setExportPath(value)
    if (key === 'importPath') setImportPath(value)
  }

  const handleBrowse = async (key: 'backupPath' | 'exportPath' | 'importPath') => {
    const current =
      key === 'backupPath' ? backupPath : key === 'exportPath' ? exportPath : importPath
    const selected = await window.notesAISE?.selectDirectory?.(current || undefined)
    if (selected != null) updatePath(key, selected)
  }

  const canBrowse = typeof window.notesAISE?.selectDirectory === 'function'

  return (
    <div className="settings-tab-content" data-testid="settings-general">
      <h2>General Settings</h2>
      <div className="settings-section">
        <label className="settings-field">
          <span>Theme</span>
          <div className="settings-radio-group">
            <label className="settings-radio">
              <input
                type="radio"
                name="theme"
                value="light"
                checked={theme === 'light'}
                onChange={() => setTheme('light' as Theme)}
              />
              Light
            </label>
            <label className="settings-radio">
              <input
                type="radio"
                name="theme"
                value="dark"
                checked={theme === 'dark'}
                onChange={() => setTheme('dark' as Theme)}
              />
              Dark
            </label>
          </div>
        </label>
        <div className="settings-general__toggle-card" data-testid="settings-remember-sidebar-width">
          <div className="settings-general__toggle-label-wrap">
            <span className="settings-general__toggle-title">Remember Sidebar Width</span>
            <span className="settings-general__toggle-desc">
              Save sidebar width for next launch
            </span>
          </div>
          <label className="settings-ai__toggle">
            <input
              type="checkbox"
              checked={rememberSidebarWidth}
              onChange={(event) => setRememberSidebarWidth(event.target.checked)}
              data-testid="settings-remember-sidebar-width-toggle"
            />
            <span className="settings-ai__toggle-slider" />
          </label>
        </div>
      </div>

      <div className="settings-section settings-section--default-paths">
        <h3 className="settings-section__subtitle">Default File Paths</h3>
        <p className="settings-section__desc">
          Configure default directories for backups, exports, and imports. Files will be saved
          directly to these paths without opening file dialogs.
        </p>
        <div className="default-paths__row">
          <label className="default-paths__label">Backup Directory:</label>
          <div className="default-paths__controls">
            <input
              type="text"
              className="default-paths__input"
              value={backupPath}
              onChange={(e) => setBackupPath(e.target.value)}
              onBlur={() => updatePath('backupPath', backupPath)}
              placeholder="No default path"
              data-testid="settings-backup-path"
            />
            <button
              type="button"
              className="settings-button settings-button--primary default-paths__browse"
              disabled={!canBrowse}
              onClick={() => handleBrowse('backupPath')}
              title="Choose directory"
              data-testid="settings-backup-path-browse"
            >
              <FolderOpen size={18} aria-hidden />
              Browse
            </button>
            <button
              type="button"
              className="settings-button settings-button--secondary default-paths__clear"
              onClick={() => updatePath('backupPath', '')}
              data-testid="settings-backup-path-clear"
            >
              Clear
            </button>
          </div>
        </div>
        <div className="default-paths__row">
          <label className="default-paths__label">Export Directory:</label>
          <div className="default-paths__controls">
            <input
              type="text"
              className="default-paths__input"
              value={exportPath}
              onChange={(e) => setExportPath(e.target.value)}
              onBlur={() => updatePath('exportPath', exportPath)}
              placeholder="No default path"
              data-testid="settings-export-path"
            />
            <button
              type="button"
              className="settings-button settings-button--primary default-paths__browse"
              disabled={!canBrowse}
              onClick={() => handleBrowse('exportPath')}
              title="Choose directory"
              data-testid="settings-export-path-browse"
            >
              <FolderOpen size={18} aria-hidden />
              Browse
            </button>
            <button
              type="button"
              className="settings-button settings-button--secondary default-paths__clear"
              onClick={() => updatePath('exportPath', '')}
              data-testid="settings-export-path-clear"
            >
              Clear
            </button>
          </div>
        </div>
        <div className="default-paths__row">
          <label className="default-paths__label">Import Directory:</label>
          <div className="default-paths__controls">
            <input
              type="text"
              className="default-paths__input"
              value={importPath}
              onChange={(e) => setImportPath(e.target.value)}
              onBlur={() => updatePath('importPath', importPath)}
              placeholder="No default path"
              data-testid="settings-import-path"
            />
            <button
              type="button"
              className="settings-button settings-button--primary default-paths__browse"
              disabled={!canBrowse}
              onClick={() => handleBrowse('importPath')}
              title="Choose directory"
              data-testid="settings-import-path-browse"
            >
              <FolderOpen size={18} aria-hidden />
              Browse
            </button>
            <button
              type="button"
              className="settings-button settings-button--secondary default-paths__clear"
              onClick={() => updatePath('importPath', '')}
              data-testid="settings-import-path-clear"
            >
              Clear
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
