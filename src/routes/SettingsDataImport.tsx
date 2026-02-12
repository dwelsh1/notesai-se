import { useState, useCallback, useRef } from 'react'
import { Upload } from 'lucide-react'
import { usePages } from '../state/pagesContext'
import { useToast } from '../state/toastContext'
import { loadConfig } from '../config/appConfig'
import { importHtml, importJson, importMarkdown } from '../services/importExport'

export function SettingsDataImport() {
  const { addPages } = usePages()
  const toast = useToast()
  const [importStatus, setImportStatus] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [dragging, setDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const processContent = useCallback(
    (text: string, filename: string) => {
      const ext = filename.split('.').pop()?.toLowerCase()
      if (!['json', 'html', 'htm', 'md', 'markdown'].includes(ext ?? '')) {
        const msg = 'Supported formats: .md, .json, .html'
        setImportStatus({ type: 'error', text: msg })
        toast.error(msg)
        return
      }
      const result =
        ext === 'json'
          ? importJson(text)
          : ext === 'html' || ext === 'htm'
            ? importHtml(text)
            : importMarkdown(text)
      addPages(result.pages)
      const msg = `Successfully imported ${result.pages.length} page(s).`
      setImportStatus({ type: 'success', text: msg })
      toast.success(msg)
    },
    [addPages, toast],
  )

  const handleFile = useCallback(
    async (file: File | null) => {
      if (!file) return
      setImportStatus(null)
      try {
        const text = await file.text()
        processContent(text, file.name)
      } catch (error) {
        const msg = `Import failed: ${(error as Error).message}`
        setImportStatus({ type: 'error', text: msg })
        toast.error(msg)
      }
    },
    [processContent, toast],
  )

  const handleChooseFile = useCallback(async () => {
    if (typeof window.notesAISE?.openFile === 'function') {
      const config = loadConfig()
      const defaultPath = config.importPath.trim() || undefined
      setImportStatus(null)
      try {
        const result = await window.notesAISE.openFile({
          defaultPath,
          filters: [{ name: 'Supported', extensions: ['json', 'md', 'markdown', 'html', 'htm'] }],
        })
        if (result) processContent(result.content, result.filename)
      } catch (error) {
        const msg = `Import failed: ${(error as Error).message}`
        setImportStatus({ type: 'error', text: msg })
        toast.error(msg)
      }
    } else {
      fileInputRef.current?.click()
    }
  }, [processContent, toast])

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
  const onDragLeave = useCallback(() => setDragging(false), [])

  return (
    <div className="settings-data-import" data-testid="settings-import">
      <section className="settings-section data-management-section">
        <h3 className="data-management-section__title">Import Pages</h3>
        <p className="data-management-section__desc">
          Import pages from Markdown, backup files (JSON), or HTML.
        </p>
        <div
          className={`data-management-drop-zone ${dragging ? 'data-management-drop-zone--active' : ''}`}
          onDrop={onDrop}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          data-testid="import-drop-zone"
        >
          <Upload size={48} className="data-management-drop-zone__icon" aria-hidden />
          <p className="data-management-drop-zone__text">Select File to Import</p>
          <p className="data-management-drop-zone__formats">Supported formats: .md, .json, .html</p>
          <button
            type="button"
            className="settings-button settings-button--primary data-management-drop-zone__button"
            onClick={handleChooseFile}
          >
            <Upload size={18} aria-hidden />
            Choose File
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".md,.markdown,.json,.html,.htm"
            className="data-management-drop-zone__input"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) void handleFile(file)
              e.target.value = ''
            }}
            data-testid="import-file"
            aria-hidden
          />
        </div>
      </section>

      <section className="settings-section data-management-section data-management-tips">
        <h4 className="data-management-tips__title">Import Tips</h4>
        <ul className="data-management-tips__list">
          <li>Markdown files (.md) preserve formatting</li>
          <li>HTML files (.html) maintain structure and metadata</li>
          <li>JSON backup files restore complete data</li>
          <li>Multiple pages in one file are supported</li>
          <li>ZIP backups: Extract first, then import pages.json</li>
          <li>Imported pages get &quot;(imported)&quot; suffix if titles match existing pages</li>
        </ul>
      </section>

      {importStatus && (
        <p
          className={importStatus.type === 'success' ? 'data-management-message--success' : 'data-management-message--error'}
          role="status"
          data-testid="import-status"
        >
          {importStatus.text}
        </p>
      )}
    </div>
  )
}
