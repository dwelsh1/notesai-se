import { useState, useCallback } from 'react'
import { Upload } from 'lucide-react'

export function SettingsDataRestore() {
  const [dragging, setDragging] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const handleFile = useCallback(
    async (file: File | null) => {
      if (!file) return
      const ext = file.name.split('.').pop()?.toLowerCase()
      if (ext !== 'json' && ext !== 'zip') {
        setMessage({ type: 'error', text: 'Supported formats: .json, .zip (from Full Backup)' })
        return
      }
      setMessage(null)
      try {
        if (ext === 'zip') {
          setMessage({
            type: 'error',
            text: 'ZIP backups: Extract the ZIP file, then import pages.json from the Import tab.',
          })
          return
        }
        const text = await file.text()
        const data = JSON.parse(text) as { pages?: unknown[] }
        const count = Array.isArray(data.pages) ? data.pages.length : 0
        setMessage({
          type: 'success',
          text: `Backup file loaded. Found ${count} page(s). Use the Import tab to import pages.json from an extracted ZIP, or implement full restore here.`,
        })
      } catch (err) {
        setMessage({ type: 'error', text: (err as Error).message })
      }
    },
    [],
  )

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setDragging(false)
      const file = e.dataTransfer.files?.[0]
      if (file) void handleFile(file)
    },
    [handleFile],
  )
  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragging(true)
  }, [])
  const onDragLeave = useCallback(() => {
    setDragging(false)
  }, [])

  return (
    <div className="settings-data-restore" data-testid="settings-restore">
      <section className="settings-section data-management-section">
        <h3 className="data-management-section__title">Restore from Backup</h3>
        <p className="data-management-section__desc">
          Restore your workspace from a backup file (JSON or ZIP format).
        </p>
        <div
          className={`data-management-drop-zone ${dragging ? 'data-management-drop-zone--active' : ''}`}
          onDrop={onDrop}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          data-testid="restore-drop-zone"
        >
          <Upload size={48} className="data-management-drop-zone__icon" aria-hidden />
          <p className="data-management-drop-zone__text">Select Backup File to Restore</p>
          <p className="data-management-drop-zone__formats">Supported formats: .json, .zip (from Full Backup)</p>
          <label className="settings-button settings-button--primary data-management-drop-zone__button">
            <Upload size={18} aria-hidden />
            Choose Backup File
            <input
              type="file"
              accept=".json,.zip"
              className="data-management-drop-zone__input"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) void handleFile(file)
                e.target.value = ''
              }}
            />
          </label>
        </div>
      </section>
      {message && (
        <p
          className={message.type === 'success' ? 'data-management-message--success' : 'data-management-message--error'}
          role="status"
        >
          {message.text}
        </p>
      )}
    </div>
  )
}
