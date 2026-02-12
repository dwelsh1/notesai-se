import { useState, useMemo } from 'react'
import { FileText, Code, FileJson, FileOutput, ChevronDown, ChevronUp } from 'lucide-react'
import { usePages } from '../state/pagesContext'
import { useToast } from '../state/toastContext'
import { loadConfig } from '../config/appConfig'
import {
  exportPagesToHtml,
  exportPagesToJson,
  exportPagesToMarkdown,
} from '../services/importExport'
import { exportPagesToPdf } from '../services/pdfExport'

const activePagesCount = (pages: { trashed: boolean }[]) =>
  pages.filter((p) => !p.trashed).length

function download(filename: string, content: string, type: string) {
  const blob = new Blob([content], { type })
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

const FORMATS = [
  { id: 'markdown', label: 'Markdown', desc: 'Plain text with formatting', icon: FileText },
  { id: 'html', label: 'HTML', desc: 'Web page format', icon: Code },
  { id: 'json', label: 'JSON', desc: 'Structured data', icon: FileJson },
  { id: 'pdf', label: 'PDF', desc: 'Portable document', icon: FileOutput },
] as const

type FormatId = (typeof FORMATS)[number]['id']

export function SettingsDataExport() {
  const { pages } = usePages()
  const toast = useToast()
  const count = useMemo(() => activePagesCount(pages), [pages])
  const activePages = useMemo(() => pages.filter((p) => !p.trashed), [pages])

  const [exportStatus, setExportStatus] = useState('')
  const [pdfSettingsOpen, setPdfSettingsOpen] = useState(false)
  const [namingOpen, setNamingOpen] = useState(false)
  const [singlePattern, setSinglePattern] = useState('{PageTitle}.{ext}')
  const [multiPattern, setMultiPattern] = useState('{BaseName}-{format}-{Date}.zip')

  const exportByFormat = async (format: FormatId) => {
    if (activePages.length === 0) {
      setExportStatus('No pages to export.')
      return
    }
    const date = new Date().toISOString().slice(0, 10)
    const config = loadConfig()
    const exportDir = config.exportPath.trim()
    const hasWriteFile = typeof window.notesAISE?.writeFile === 'function'
    const useDefaultPath = exportDir.length > 0

    if (useDefaultPath && !hasWriteFile) {
      toast.error(
        'Default export path is set but the app cannot write files. Restart the desktop app, or clear the path in Settings → General to use download.',
      )
      return
    }

    try {
      if (format === 'json') {
        const filename = `notesai-pages-${date}.json`
        const content = exportPagesToJson(activePages)
        if (useDefaultPath && hasWriteFile) {
          await window.notesAISE!.writeFile!(joinPath(exportDir, filename), content)
        } else {
          download(filename, content, 'application/json')
        }
      }
      if (format === 'markdown') {
        const filename = `notesai-pages-${date}.md`
        const content = exportPagesToMarkdown(activePages)
        if (useDefaultPath && hasWriteFile) {
          await window.notesAISE!.writeFile!(joinPath(exportDir, filename), content)
        } else {
          download(filename, content, 'text/markdown')
        }
      }
      if (format === 'html') {
        const filename = `notesai-pages-${date}.html`
        const content = exportPagesToHtml(activePages)
        if (useDefaultPath && hasWriteFile) {
          await window.notesAISE!.writeFile!(joinPath(exportDir, filename), content)
        } else {
          download(filename, content, 'text/html')
        }
      }
      if (format === 'pdf') {
        const filename = `notesai-pages-${date}.pdf`
        const result = await exportPagesToPdf(activePages)
        let base64: string
        if (typeof result === 'string') {
          base64 = result
        } else {
          const dataUri = result.output('datauristring')
          base64 = dataUri.split(',')[1] ?? ''
          if (!base64) throw new Error('PDF generation failed')
        }
        if (useDefaultPath && hasWriteFile) {
          await window.notesAISE!.writeFile!(joinPath(exportDir, filename), base64, {
            encoding: 'base64',
          })
        } else {
          const blob = await fetch(`data:application/pdf;base64,${base64}`).then((r) => r.blob())
          const url = URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.href = url
          a.download = filename
          a.click()
          URL.revokeObjectURL(url)
        }
        const successMsg =
          useDefaultPath && hasWriteFile
            ? `Export succeeded. ${activePages.length} pages saved to folder.`
            : `Export succeeded. ${activePages.length} pages as PDF.`
        setExportStatus(successMsg)
        toast.success(successMsg)
        return
      }
      const successMsg =
        useDefaultPath && hasWriteFile
          ? `Export succeeded. ${activePages.length} pages saved to folder.`
          : `Export succeeded. ${activePages.length} pages as ${format.toUpperCase()}.`
      setExportStatus(successMsg)
      toast.success(successMsg)
    } catch (err) {
      const errMsg = `Export failed: ${(err as Error).message}`
      setExportStatus(errMsg)
      toast.error(errMsg)
    }
  }

  const resetNamingDefaults = () => {
    setSinglePattern('{PageTitle}.{ext}')
    setMultiPattern('{BaseName}-{format}-{Date}.zip')
    setExportStatus('Reset to defaults.')
  }

  return (
    <div className="settings-data-export" data-testid="settings-export">
      <section className="settings-section data-management-section">
        <h3 className="data-management-section__title">Export Format</h3>
        <p className="data-management-section__desc">
          Export {count} pages to your preferred format.
        </p>
        <div className="data-management-format-cards">
          {FORMATS.map(({ id, label, desc, icon: Icon }) => (
            <button
              key={id}
              type="button"
              className="data-management-format-card"
              onClick={() => exportByFormat(id)}
              data-testid={`export-format-${id}`}
            >
              <Icon size={28} className="data-management-format-card__icon" aria-hidden />
              <span className="data-management-format-card__label">{label}</span>
              <span className="data-management-format-card__desc">{desc}</span>
            </button>
          ))}
        </div>
      </section>

      <div className="data-management-collapsible">
        <button
          type="button"
          className="data-management-collapsible__head"
          onClick={() => setPdfSettingsOpen(!pdfSettingsOpen)}
        >
          PDF Export Settings
          {pdfSettingsOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </button>
        {pdfSettingsOpen && (
          <div className="data-management-collapsible__body">
            <p className="data-management-section__desc">
              Configure default settings for PDF exports (orientation, etc.).
            </p>
            <label className="settings-field">
              Page size
              <select>
                <option>A4 (8.27" x 11.69")</option>
                <option>Letter</option>
              </select>
            </label>
            <label className="settings-field">
              Orientation
              <div className="settings-radio-group">
                <label className="settings-radio">
                  <input type="radio" name="pdf-orientation" defaultChecked /> Portrait
                </label>
                <label className="settings-radio">
                  <input type="radio" name="pdf-orientation" /> Landscape
                </label>
              </div>
            </label>
          </div>
        )}
      </div>

      <div className="data-management-collapsible">
        <button
          type="button"
          className="data-management-collapsible__head"
          onClick={() => setNamingOpen(!namingOpen)}
        >
          Export File Naming
          {namingOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </button>
        {namingOpen && (
          <div className="data-management-collapsible__body">
            <p className="data-management-section__desc">
              Customize how exported files are named. Available variables: {'{PageTitle}'}, {'{BaseName}'}, {'{Date}'}, {'{Time}'}, {'{Format}'}, {'{Timestamp}'}, {'{ext}'}.
            </p>
            <label className="settings-field">
              Single page export pattern
              <input
                type="text"
                value={singlePattern}
                onChange={(e) => setSinglePattern(e.target.value)}
              />
            </label>
            <p className="data-management-preview">Preview: My Page.pdf</p>
            <label className="settings-field">
              Multiple pages export pattern (ZIP)
              <input
                type="text"
                value={multiPattern}
                onChange={(e) => setMultiPattern(e.target.value)}
              />
            </label>
            <p className="data-management-preview">Preview: notesai-export-pdf-2025-11-30.zip</p>
            <button type="button" className="settings-button settings-button--secondary" onClick={resetNamingDefaults}>
              Reset to Defaults
            </button>
          </div>
        )}
      </div>

      {exportStatus && (
        <p className="data-management-message--success" role="status" data-testid="export-status">
          {exportStatus}
        </p>
      )}
    </div>
  )
}
