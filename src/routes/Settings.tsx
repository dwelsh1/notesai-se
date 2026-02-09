import { useMemo, useState } from 'react'
import { usePages } from '../state/pagesContext'
import {
  exportPagesToHtml,
  exportPagesToJson,
  exportPagesToMarkdown,
  importHtml,
  importJson,
  importMarkdown,
} from '../services/importExport'
import { getNextBackupAt } from '../services/backupPolicy'

type ScheduleMode = 'manual' | 'daily' | 'weekly'

export function Settings() {
  const { pages, addPages } = usePages()
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [importStatus, setImportStatus] = useState('')
  const [exportStatus, setExportStatus] = useState('')
  const [scheduleMode, setScheduleMode] = useState<ScheduleMode>('manual')
  const [scheduleHour, setScheduleHour] = useState(2)
  const [scheduleDay, setScheduleDay] = useState(1)
  const [maxBackups, setMaxBackups] = useState(10)
  const [maxAgeDays, setMaxAgeDays] = useState<number | ''>('')

  const selectedPages = useMemo(
    () => pages.filter((page) => selectedIds.has(page.id)),
    [pages, selectedIds],
  )

  const nextBackupAt = useMemo(() => {
    if (scheduleMode === 'manual') {
      return null
    }
    return getNextBackupAt(new Date(), {
      mode: scheduleMode,
      hour: scheduleHour,
      dayOfWeek: scheduleDay,
    })
  }, [scheduleDay, scheduleHour, scheduleMode])

  const toggleSelection = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const download = (filename: string, content: string, type: string) => {
    const blob = new Blob([content], { type })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = filename
    anchor.click()
    URL.revokeObjectURL(url)
  }

  const handleImportFile = async (file: File) => {
    try {
      const text = await file.text()
      const extension = file.name.split('.').pop()?.toLowerCase()
      const result =
        extension === 'json'
          ? importJson(text)
          : extension === 'html' || extension === 'htm'
            ? importHtml(text)
            : importMarkdown(text)

      addPages(result.pages)
      setImportStatus(`Imported ${result.pages.length} page(s).`)
    } catch (error) {
      setImportStatus(`Import failed: ${(error as Error).message}`)
    }
  }

  const exportPages = (format: 'json' | 'md' | 'html', all = false) => {
    const exportSet = all ? pages : selectedPages
    if (exportSet.length === 0) {
      setExportStatus('Select at least one page to export.')
      return
    }

    const timestamp = new Date().toISOString().split('T')[0]
    if (format === 'json') {
      download(`notesai-pages-${timestamp}.json`, exportPagesToJson(exportSet), 'application/json')
    }
    if (format === 'md') {
      download(`notesai-pages-${timestamp}.md`, exportPagesToMarkdown(exportSet), 'text/markdown')
    }
    if (format === 'html') {
      download(`notesai-pages-${timestamp}.html`, exportPagesToHtml(exportSet), 'text/html')
    }
    setExportStatus(`Exported ${exportSet.length} page(s).`)
  }

  const exportBackup = () => {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const payload = {
      createdAt: new Date().toISOString(),
      pages,
    }
    download(`notesai-backup-${timestamp}.json`, JSON.stringify(payload, null, 2), 'application/json')
    setExportStatus('Backup exported (JSON stub).')
  }

  return (
    <section>
      <h1 data-testid="settings-title">Settings</h1>
      <div className="settings-grid">
        <div className="settings-card" data-testid="settings-import">
          <h2>Import</h2>
          <p>Import Markdown, JSON, or HTML into pages.</p>
          <input
            type="file"
            accept=".md,.markdown,.json,.html,.htm"
            data-testid="import-file"
            onChange={(event) => {
              const file = event.target.files?.[0]
              if (file) {
                void handleImportFile(file)
              }
            }}
          />
          {importStatus && <p data-testid="import-status">{importStatus}</p>}
        </div>

        <div className="settings-card" data-testid="settings-export">
          <h2>Export</h2>
          <p>Select pages to export or export everything.</p>
          <div className="settings-list">
            {pages.length === 0 ? (
              <p>No pages available.</p>
            ) : (
              pages.map((page) => (
                <label key={page.id} className="settings-checkbox">
                  <input
                    type="checkbox"
                    checked={selectedIds.has(page.id)}
                    onChange={() => toggleSelection(page.id)}
                  />
                  {page.title}
                </label>
              ))
            )}
          </div>
          <div className="settings-actions">
            <button type="button" onClick={() => exportPages('json')}>
              Export JSON
            </button>
            <button type="button" onClick={() => exportPages('md')}>
              Export Markdown
            </button>
            <button type="button" onClick={() => exportPages('html')}>
              Export HTML
            </button>
            <button type="button" onClick={() => exportPages('json', true)}>
              Export All (JSON)
            </button>
          </div>
          {exportStatus && <p data-testid="export-status">{exportStatus}</p>}
        </div>

        <div className="settings-card" data-testid="settings-backups">
          <h2>Backups</h2>
          <p>Configure backup schedule and retention.</p>
          <label className="settings-field">
            Schedule
            <select
              value={scheduleMode}
              onChange={(event) => setScheduleMode(event.target.value as ScheduleMode)}
            >
              <option value="manual">Manual</option>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
            </select>
          </label>
          {scheduleMode !== 'manual' && (
            <>
              <label className="settings-field">
                Hour (UTC)
                <input
                  type="number"
                  min={0}
                  max={23}
                  value={scheduleHour}
                  onChange={(event) => setScheduleHour(Number(event.target.value))}
                />
              </label>
              {scheduleMode === 'weekly' && (
                <label className="settings-field">
                  Day of week (0=Sun)
                  <input
                    type="number"
                    min={0}
                    max={6}
                    value={scheduleDay}
                    onChange={(event) => setScheduleDay(Number(event.target.value))}
                  />
                </label>
              )}
            </>
          )}
          <label className="settings-field">
            Max backups
            <input
              type="number"
              min={1}
              value={maxBackups}
              onChange={(event) => setMaxBackups(Number(event.target.value))}
            />
          </label>
          <label className="settings-field">
            Max age (days, optional)
            <input
              type="number"
              min={1}
              value={maxAgeDays}
              onChange={(event) =>
                setMaxAgeDays(event.target.value === '' ? '' : Number(event.target.value))
              }
            />
          </label>
          <button type="button" onClick={exportBackup}>
            Export Backup (JSON stub)
          </button>
          {nextBackupAt && (
            <p data-testid="backup-next">Next backup: {nextBackupAt.toISOString()}</p>
          )}
          <p data-testid="backup-retention">
            Retention: keep {maxBackups} backup(s)
            {maxAgeDays ? `, max age ${maxAgeDays} days` : ''}.
          </p>
        </div>
      </div>
    </section>
  )
}
