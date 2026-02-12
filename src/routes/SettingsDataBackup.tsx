import { useState, useCallback } from 'react'
import JSZip from 'jszip'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { usePages } from '../state/pagesContext'
import { useToast } from '../state/toastContext'
import { loadConfig } from '../config/appConfig'
import { getNextBackupAt } from '../services/backupPolicy'
const BACKUP_TYPES = [
  {
    id: 'pages-only',
    label: 'Pages Only',
    shortDesc: 'Only page content',
    longDesc:
      'Contains all your pages and their content. Does not include settings or media references.',
  },
  {
    id: 'pages-settings',
    label: 'Pages + Settings',
    shortDesc: 'Pages and preferences',
    longDesc:
      'Contains all pages plus your app settings (theme, preferences, etc.). Does not include media metadata.',
  },
  {
    id: 'pages-settings-media',
    label: 'Pages + Settings + Media Metadata (Recommended)',
    shortDesc: 'Complete snapshot in a single JSON file',
    longDesc:
      'Recommended for most users. Contains everything: all pages, settings, and media file references. Single JSON file. Media files themselves are stored locally and not included in the backup.',
  },
  {
    id: 'everything-zip',
    label: 'Everything (ZIP)',
    shortDesc: 'All data organized in separate files',
    longDesc:
      'Same content as "Pages + Settings + Media Metadata" but as a ZIP archive with separate files (pages.json, settings.json, media.json, README.txt). ZIP backups: Extract the ZIP file, then import pages.json from the Import tab.',
  },
] as const

type BackupTypeId = (typeof BACKUP_TYPES)[number]['id']

function download(filename: string, content: string, _type: string) {
  const blob = new Blob([content], { type: 'application/octet-stream' })
  downloadBlob(blob, filename)
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(url)
}

function joinPath(dir: string, name: string): string {
  const sep = dir.includes('\\') ? '\\' : '/'
  return dir.endsWith(sep) ? dir + name : dir + sep + name
}

export function SettingsDataBackup() {
  const { pages } = usePages()
  const toast = useToast()
  const [selectedTypes, setSelectedTypes] = useState<Set<BackupTypeId>>(new Set(['pages-only']))
  const [creating, setCreating] = useState(false)

  const [scheduledEnabled, setScheduledEnabled] = useState(false)
  const [notifyOnCompletion, setNotifyOnCompletion] = useState(true)
  const [scheduleSettingsOpen, setScheduleSettingsOpen] = useState(true)
  const [dailyEnabled, setDailyEnabled] = useState(false)
  const [dailyTime, setDailyTime] = useState('02:00')
  const [weeklyEnabled, setWeeklyEnabled] = useState(false)
  const [weeklyDay, setWeeklyDay] = useState(0)
  const [weeklyTime, setWeeklyTime] = useState('11:50')
  const [monthlyEnabled, setMonthlyEnabled] = useState(false)
  const [monthlyDay, setMonthlyDay] = useState(1)
  const [monthlyTime, setMonthlyTime] = useState('02:00')

  const selectAll = useCallback(() => {
    setSelectedTypes(new Set(BACKUP_TYPES.map((t) => t.id)))
  }, [])
  const clearAll = useCallback(() => {
    setSelectedTypes(new Set())
  }, [])
  const toggleType = useCallback((id: BackupTypeId) => {
    setSelectedTypes((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const createBackup = useCallback(async () => {
    if (selectedTypes.size === 0) {
      toast.error('Select at least one backup type.')
      return
    }
    setCreating(true)
    const date = new Date()
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '-')
    const files: string[] = []

    try {
      const config = loadConfig()
      const activePages = pages.filter((p) => !p.trashed)
      const backupDir = config.backupPath.trim()
      const hasWriteFile = typeof window.notesAISE?.writeFile === 'function'
      const useDefaultPath = backupDir.length > 0

      if (useDefaultPath && !hasWriteFile) {
        toast.error(
          'Default backup path is set but the app cannot write files. Restart the desktop app, or clear the path in Settings → General to use download.',
        )
        setCreating(false)
        return
      }

      const writeOrDownload = async (name: string, content: string) => {
        if (useDefaultPath && hasWriteFile) {
          const fullPath = joinPath(backupDir, name)
          await window.notesAISE!.writeFile!(fullPath, content)
          files.push(fullPath)
        } else {
          download(name, content, 'application/json')
          files.push(name)
        }
      }

      if (selectedTypes.has('pages-only')) {
        const content = JSON.stringify({ pages: activePages }, null, 2)
        const name = `notesai-backup-pages-only-${dateStr}.json`
        await writeOrDownload(name, content)
      }
      if (selectedTypes.has('pages-settings')) {
        const content = JSON.stringify(
          { pages: activePages, settings: config, createdAt: date.toISOString() },
          null,
          2,
        )
        const name = `notesai-backup-pages-settings-${dateStr}.json`
        await writeOrDownload(name, content)
      }
      if (selectedTypes.has('pages-settings-media')) {
        const content = JSON.stringify(
          {
            pages: activePages,
            settings: config,
            media: [],
            createdAt: date.toISOString(),
          },
          null,
          2,
        )
        const name = `notesai-backup-pages-settings-media-${dateStr}.json`
        await writeOrDownload(name, content)
      }
      if (selectedTypes.has('everything-zip')) {
        const zip = new JSZip()
        zip.file('pages.json', JSON.stringify({ pages: activePages }, null, 2))
        zip.file('settings.json', JSON.stringify(config, null, 2))
        zip.file('media.json', JSON.stringify([]))
        zip.file(
          'README.txt',
          'NotesAI SE full backup. Import pages.json from the Import tab to restore pages.',
        )
        const zipFilename = `notesai-backup-everything-${dateStr}.zip`
        if (useDefaultPath && hasWriteFile) {
          const base64 = await zip.generateAsync({ type: 'base64' })
          const zipPath = joinPath(backupDir, zipFilename)
          await window.notesAISE!.writeFile!(zipPath, base64, { encoding: 'base64' })
          files.push(zipPath)
        } else {
          const blob = await zip.generateAsync({ type: 'blob' })
          downloadBlob(blob, zipFilename)
          files.push(zipFilename)
        }
      }

      toast.success(
        files.length ? `Backup succeeded. Created ${files.length} file(s).` : 'Backup created.',
      )
    } catch (err) {
      toast.error((err as Error).message)
    } finally {
      setCreating(false)
    }
  }, [pages, selectedTypes, toast])

  const count = selectedTypes.size
  const nextDaily = getNextBackupAt(new Date(), { mode: 'daily', hour: parseInt(dailyTime.slice(0, 2), 10) })

  return (
    <div className="settings-data-backup" data-testid="settings-backup">
      {/* Full Backup */}
      <section className="settings-section data-management-section">
        <h3 className="data-management-section__title">Full Backup</h3>
        <p className="data-management-section__desc">
          Create complete backups including all pages and settings. Select one or more backup types to download.
        </p>
        <div className="data-management-section__actions">
          <button type="button" className="settings-link" onClick={selectAll}>
            Select All
          </button>
          <span className="data-management-section__sep"> </span>
          <button type="button" className="settings-link" onClick={clearAll}>
            Clear All
          </button>
        </div>
        <ul className="data-management-backup-types">
          {BACKUP_TYPES.map((t) => (
            <li key={t.id} className="data-management-backup-type">
              <label className="settings-checkbox data-management-checkbox">
                <input
                  type="checkbox"
                  checked={selectedTypes.has(t.id)}
                  onChange={() => toggleType(t.id)}
                />
                <span className="data-management-checkbox__label">{t.label}</span>
              </label>
              <p className="data-management-backup-type__short">{t.shortDesc}</p>
              <p className="data-management-backup-type__long">{t.longDesc}</p>
            </li>
          ))}
        </ul>
        <button
          type="button"
          className="settings-button settings-button--primary"
          disabled={creating || count === 0}
          onClick={() => void createBackup()}
        >
          {creating ? `Creating ${count} Backup(s)...` : `Download ${count} Backup${count !== 1 ? 's' : ''}`}
        </button>
      </section>

      {/* Scheduled Backups */}
      <section className="settings-section data-management-section">
        <h3 className="data-management-section__title">Scheduled Backups</h3>
        <p className="data-management-section__desc">
          Automatically create backups on a schedule. Backups will be saved to the same location as manual backups.
        </p>
        <div className="data-management-toggle-row">
          <div>
            <span className="data-management-toggle-label">Enable Scheduled Backups</span>
            <p className="data-management-toggle-desc">Master toggle to enable/disable all scheduled backups</p>
          </div>
          <label className="settings-ai__toggle">
            <input
              type="checkbox"
              checked={scheduledEnabled}
              onChange={(e) => setScheduledEnabled(e.target.checked)}
            />
            <span className="settings-ai__toggle-slider" />
          </label>
        </div>
        <div className="data-management-toggle-row">
          <div>
            <span className="data-management-toggle-label">Notify on backup completion</span>
            <p className="data-management-toggle-desc">Show notifications when scheduled backups complete or fail</p>
          </div>
          <label className="settings-ai__toggle">
            <input
              type="checkbox"
              checked={notifyOnCompletion}
              onChange={(e) => setNotifyOnCompletion(e.target.checked)}
            />
            <span className="settings-ai__toggle-slider" />
          </label>
        </div>

        <div className="data-management-collapsible">
          <button
            type="button"
            className="data-management-collapsible__head"
            onClick={() => setScheduleSettingsOpen(!scheduleSettingsOpen)}
          >
            Schedule Settings
            {scheduleSettingsOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </button>
          {scheduleSettingsOpen && (
            <div className="data-management-collapsible__body">
              {/* Daily */}
              <div className="data-management-schedule-card">
                <div className="data-management-schedule-card__head">
                  <label className="settings-ai__toggle">
                    <input
                      type="checkbox"
                      checked={dailyEnabled}
                      onChange={(e) => setDailyEnabled(e.target.checked)}
                    />
                    <span className="settings-ai__toggle-slider" />
                  </label>
                  <span className="data-management-schedule-card__title">Daily Backup</span>
                </div>
                <p className="data-management-schedule-card__desc">Runs every day at the specified time</p>
                <div className="data-management-schedule-card__row">
                  <label className="settings-field">
                    Time
                    <input
                      type="time"
                      value={dailyTime}
                      onChange={(e) => setDailyTime(e.target.value)}
                    />
                  </label>
                  <button type="button" className="settings-button settings-button--secondary">
                    Run Now
                  </button>
                </div>
                {nextDaily && (
                  <p className="data-management-schedule-card__last">
                    Next backup: {nextDaily.toLocaleString()}
                  </p>
                )}
              </div>

              {/* Weekly */}
              <div className="data-management-schedule-card">
                <div className="data-management-schedule-card__head">
                  <label className="settings-ai__toggle">
                    <input
                      type="checkbox"
                      checked={weeklyEnabled}
                      onChange={(e) => setWeeklyEnabled(e.target.checked)}
                    />
                    <span className="settings-ai__toggle-slider" />
                  </label>
                  <span className="data-management-schedule-card__title">Weekly Backup</span>
                </div>
                <p className="data-management-schedule-card__desc">Runs every selected day at the specified time</p>
                <div className="data-management-schedule-card__row">
                  <label className="settings-field">
                    Day of week
                    <select
                      value={weeklyDay}
                      onChange={(e) => setWeeklyDay(Number(e.target.value))}
                    >
                      {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map(
                        (d, i) => (
                          <option key={d} value={i}>
                            {d}
                          </option>
                        ),
                      )}
                    </select>
                  </label>
                  <label className="settings-field">
                    Time
                    <input
                      type="time"
                      value={weeklyTime}
                      onChange={(e) => setWeeklyTime(e.target.value)}
                    />
                  </label>
                  <button type="button" className="settings-button settings-button--secondary">
                    Run Now
                  </button>
                </div>
              </div>

              {/* Monthly */}
              <div className="data-management-schedule-card">
                <div className="data-management-schedule-card__head">
                  <label className="settings-ai__toggle">
                    <input
                      type="checkbox"
                      checked={monthlyEnabled}
                      onChange={(e) => setMonthlyEnabled(e.target.checked)}
                    />
                    <span className="settings-ai__toggle-slider" />
                  </label>
                  <span className="data-management-schedule-card__title">Monthly Backup</span>
                </div>
                <p className="data-management-schedule-card__desc">Runs on the selected day of each month</p>
                <div className="data-management-schedule-card__row">
                  <label className="settings-field">
                    Day of month
                    <input
                      type="number"
                      min={1}
                      max={31}
                      value={monthlyDay}
                      onChange={(e) => setMonthlyDay(Number(e.target.value) || 1)}
                    />
                  </label>
                  <label className="settings-field">
                    Time
                    <input
                      type="time"
                      value={monthlyTime}
                      onChange={(e) => setMonthlyTime(e.target.value)}
                    />
                  </label>
                  <button type="button" className="settings-button settings-button--secondary">
                    Run Now
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

    </div>
  )
}
