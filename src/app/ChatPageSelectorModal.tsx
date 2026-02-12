import { useMemo, useState } from 'react'
import { FileText, Search, X } from 'lucide-react'
import type { Page } from '../storage/storage'

type ChatPageSelectorModalProps = {
  isOpen: boolean
  onClose: () => void
  pages: Page[]
  selectedIds: string[]
  onTogglePage: (pageId: string) => void
}

export function ChatPageSelectorModal({
  isOpen,
  onClose,
  pages,
  selectedIds,
  onTogglePage,
}: ChatPageSelectorModalProps) {
  const [filter, setFilter] = useState('')

  const filtered = useMemo(() => {
    const q = filter.trim().toLowerCase()
    const active = pages.filter((p) => !p.trashed)
    if (!q) return active
    return active.filter(
      (p) =>
        (p.title || '').toLowerCase().includes(q),
    )
  }, [pages, filter])

  if (!isOpen) return null

  return (
    <div
      className="modal-backdrop ai-chat-page-selector-backdrop"
      onClick={onClose}
      data-testid="ai-chat-page-selector-backdrop"
    >
      <div
        className="ai-chat-page-selector-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="ai-chat-page-selector-title"
        data-testid="ai-chat-page-selector-modal"
      >
        <div className="ai-chat-page-selector-header">
          <h2 id="ai-chat-page-selector-title" className="ai-chat-page-selector-title">
            <FileText size={20} aria-hidden />
            Add pages as context
          </h2>
          <button
            type="button"
            className="modal-close"
            title="Close"
            onClick={onClose}
            aria-label="Close"
            data-testid="ai-chat-page-selector-close"
          >
            <X size={20} />
          </button>
        </div>
        <div className="ai-chat-page-selector-search">
          <Search size={16} aria-hidden />
          <input
            type="text"
            placeholder="Search pages..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="ai-chat-page-selector-input"
            data-testid="ai-chat-page-selector-input"
            aria-label="Search pages"
          />
        </div>
        <div className="ai-chat-page-selector-list-wrap" data-testid="ai-chat-page-selector-list">
          {filtered.length === 0 ? (
            <p className="ai-chat-page-selector-empty">No pages match.</p>
          ) : (
            <ul className="ai-chat-page-selector-list">
              {filtered.map((page) => {
                const checked = selectedIds.includes(page.id)
                return (
                  <li key={page.id}>
                    <label className="ai-chat-page-selector-item">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => onTogglePage(page.id)}
                        data-testid={`ai-chat-page-selector-check-${page.id}`}
                      />
                      <span className="ai-chat-page-selector-item-title">
                        {page.title?.trim() || 'Untitled'}
                      </span>
                    </label>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
        <div className="ai-chat-page-selector-footer">
          <span className="ai-chat-page-selector-count">
            {selectedIds.length} selected
          </span>
          <button
            type="button"
            className="ai-chat-btn ai-chat-page-selector-done"
            onClick={onClose}
            data-testid="ai-chat-page-selector-done"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  )
}
