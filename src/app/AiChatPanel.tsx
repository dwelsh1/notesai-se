import { useRef, useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import {
  MessageCircle,
  Send,
  Plus,
  Download,
  Trash2,
  X,
  Loader2,
  AlertCircle,
  ChevronDown,
  ChevronRight,
  Paperclip,
  FileText,
  RotateCcw,
} from 'lucide-react'
import { useChatPanel } from '../state/chatPanelContext'
import type { ConnectionStatus } from '../services/aiConnection'
import type { ChatMessageRecord, ChatMessageSource } from '../services/chatHistoryService'
import type { Page } from '../storage/storage'
import { usePages } from '../state/pagesContext'
import { markdownToHTML } from '../utils/markdownToHtml'
import { ChatPageSelectorModal } from './ChatPageSelectorModal'

const statusColor: Record<ConnectionStatus, string> = {
  connected: 'var(--status-connected, #22c55e)',
  disconnected: 'var(--status-disconnected, #ef4444)',
  connecting: 'var(--status-connecting, #eab308)',
  unknown: 'var(--text-muted)',
}

function StatusDot({ status }: { status: ConnectionStatus }) {
  return (
    <span
      className="ai-chat-status-dot"
      data-testid="ai-chat-connection-status"
      data-status={status}
      style={{ backgroundColor: statusColor[status] }}
      title={status}
      aria-label={`Connection: ${status}`}
    />
  )
}

function hasSources(sources?: ChatMessageSource): boolean {
  const a = sources?.autoSelected?.length ?? 0
  const m = sources?.manuallySelected?.length ?? 0
  const u = sources?.uploadedFiles?.length ?? 0
  const r = sources?.pageReferences?.length ?? 0
  return a > 0 || m > 0 || u > 0 || r > 0
}

function ChatMessageSources({
  message,
  pages,
}: {
  message: ChatMessageRecord
  pages: Page[]
}) {
  const [expanded, setExpanded] = useState(false)
  const sources = message.sources
  if (!sources || !hasSources(sources)) return null

  const pageById = new Map(pages.map((p) => [p.id, p]))
  const details = sources.autoSelectedDetails ?? []
  const autoIds = sources.autoSelected ?? []
  const autoWithTitle = autoIds.map((pageId) => {
    const detail = details.find((d) => d.pageId === pageId)
    const page = pageById.get(pageId)
    const title = page?.title?.trim() || 'Untitled'
    const similarity = detail?.similarity
    return { pageId, title, similarity }
  })

  const count =
    (sources.autoSelected?.length ?? 0) +
    (sources.manuallySelected?.length ?? 0) +
    (sources.uploadedFiles?.length ?? 0) +
    (sources.pageReferences?.length ?? 0)
  if (count === 0) return null

  return (
    <div className="ai-chat-sources" data-testid="ai-chat-sources">
      <button
        type="button"
        className="ai-chat-sources-toggle"
        onClick={() => setExpanded((e) => !e)}
        aria-expanded={expanded}
        data-testid="ai-chat-sources-toggle"
      >
        {expanded ? (
          <ChevronDown size={14} aria-hidden />
        ) : (
          <ChevronRight size={14} aria-hidden />
        )}
        <span>Sources ({count})</span>
      </button>
      {expanded && (
        <div className="ai-chat-sources-list" data-testid="ai-chat-sources-list">
          {autoWithTitle.length > 0 && (
            <div className="ai-chat-sources-group">
              <span className="ai-chat-sources-group-label">From notes</span>
              <ul>
                {autoWithTitle.map(({ pageId, title, similarity }) => (
                  <li key={pageId}>
                    <Link
                      to={`/page/${pageId}`}
                      className="ai-chat-source-link"
                      data-testid={`ai-chat-source-${pageId}`}
                    >
                      {title}
                      {similarity !== undefined && (
                        <span className="ai-chat-source-relevance">
                          {Math.round(similarity * 100)}%
                        </span>
                      )}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {(sources.manuallySelected?.length ?? 0) > 0 && (
            <div className="ai-chat-sources-group">
              <span className="ai-chat-sources-group-label">Manually selected</span>
              <ul>
                {(sources.manuallySelected ?? []).map((pageId) => {
                  const page = pageById.get(pageId)
                  const title = page?.title?.trim() || 'Untitled'
                  return (
                    <li key={pageId}>
                      <Link
                        to={`/page/${pageId}`}
                        className="ai-chat-source-link"
                        data-testid={`ai-chat-source-${pageId}`}
                      >
                        {title}
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </div>
          )}
          {(sources.uploadedFiles?.length ?? 0) > 0 && (
            <div className="ai-chat-sources-group">
              <span className="ai-chat-sources-group-label">Uploaded files</span>
              <ul>
                {(sources.uploadedFiles ?? []).map((name) => (
                  <li key={name}>
                    <span className="ai-chat-source-file" data-testid={`ai-chat-source-file-${name}`}>
                      {name}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function ChatMessageBubble({
  message,
  pages,
  messageIndex,
  onRetry,
}: {
  message: ChatMessageRecord
  pages: Page[]
  messageIndex: number
  onRetry?: (index: number) => void
}) {
  const isAssistant = message.role === 'assistant'
  if (message.role === 'system') return null
  const showRetry = isAssistant && message.error && typeof onRetry === 'function'
  const assistantHtml = isAssistant && !message.error && message.content
    ? markdownToHTML(message.content)
    : ''
  return (
    <div
      className={`ai-chat-message ai-chat-message--${message.role}`}
      data-testid={`ai-chat-message-${message.role}`}
      data-message-index={message.timestamp}
    >
      <div className="ai-chat-message-bubble">
        {isAssistant && message.error ? (
          <>
            <div className="ai-chat-message-error" data-testid="ai-chat-message-error">
              <AlertCircle size={16} aria-hidden />
              <span>{message.error}</span>
            </div>
            {showRetry && (
              <button
                type="button"
                className="ai-chat-retry-btn"
                onClick={() => onRetry?.(messageIndex)}
                data-testid="ai-chat-retry"
              >
                <RotateCcw size={14} aria-hidden />
                Retry
              </button>
            )}
          </>
        ) : isAssistant && assistantHtml ? (
          <div
            className="ai-chat-message-content ai-chat-message-content--markdown"
            dangerouslySetInnerHTML={{ __html: assistantHtml }}
          />
        ) : (
          <div
            className="ai-chat-message-content"
            style={isAssistant ? { whiteSpace: 'pre-wrap' } : undefined}
          >
            {message.content || '\u00A0'}
          </div>
        )}
      </div>
      {isAssistant && hasSources(message.sources) && (
        <ChatMessageSources message={message} pages={pages} />
      )}
    </div>
  )
}

const ACCEPT_FILE_TYPES = '.txt,.md,.json,.js,.ts,.jsx,.tsx,.css,.html,.xml,.yaml,.yml'

export function AiChatPanel() {
  const {
    close,
    connectionStatus,
    messages,
    sendMessage,
    retryMessage,
    loading,
    newChat,
    exportChat,
    clearHistory,
    session,
    manualSelectedPageIds,
    toggleManualPage,
    uploadedFiles,
    addUploadedFiles,
    removeUploadedFile,
    pageSelectorOpen,
    openPageSelector,
    closePageSelector,
  } = useChatPanel()
  const { pages } = usePages()
  const [inputValue, setInputValue] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    if (!files.length) return
    const toAdd: Array<{ name: string; content: string }> = []
    let done = 0
    files.forEach((file) => {
      const reader = new FileReader()
      reader.onload = () => {
        const content = typeof reader.result === 'string' ? reader.result : ''
        toAdd.push({ name: file.name, content })
        done++
        if (done === files.length) addUploadedFiles(toAdd)
      }
      reader.onerror = () => {
        done++
        if (done === files.length) addUploadedFiles(toAdd)
      }
      reader.readAsText(file)
    })
    e.target.value = ''
  }

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    if (!pageSelectorOpen) return
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        closePageSelector()
      }
    }
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [pageSelectorOpen, closePageSelector])

  useEffect(() => {
    inputRef.current?.focus({ preventScroll: true })
  }, [])

  const handleInputResize = useCallback(() => {
    const el = inputRef.current
    if (!el) return
    el.style.height = 'auto'
    const max = 200
    el.style.height = `${Math.min(el.scrollHeight, max)}px`
  }, [])

  useEffect(() => {
    handleInputResize()
  }, [inputValue, handleInputResize])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const text = inputValue.trim()
    if (!text || loading) return
    setInputValue('')
    sendMessage(text)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      const text = inputValue.trim()
      if (text && !loading) {
        setInputValue('')
        sendMessage(text)
      }
    }
  }

  const canExport = (session?.messages?.length ?? 0) > 0
  const aiUnavailable =
    connectionStatus === 'disconnected' || connectionStatus === 'unknown'

  return (
    <div className="ai-chat-panel" data-testid="ai-chat-panel">
      <header className="ai-chat-header" data-testid="ai-chat-header">
        <div className="ai-chat-header-title">
          <span data-testid="ai-chat-title">AI Chat</span>
          <StatusDot status={connectionStatus} />
        </div>
        <div className="ai-chat-header-actions">
          <button
            type="button"
            className="ai-chat-btn ai-chat-btn-icon"
            onClick={newChat}
            data-testid="ai-chat-new"
            title="New chat"
            aria-label="New chat"
          >
            <Plus size={18} aria-hidden />
          </button>
          <button
            type="button"
            className="ai-chat-btn ai-chat-btn-icon"
            onClick={exportChat}
            disabled={!canExport}
            data-testid="ai-chat-export"
            title="Export chat"
            aria-label="Export chat"
          >
            <Download size={18} aria-hidden />
          </button>
          <button
            type="button"
            className="ai-chat-btn ai-chat-btn-icon"
            onClick={() => {
              if (window.confirm('Delete all chat history? This cannot be undone.')) {
                clearHistory()
              }
            }}
            data-testid="ai-chat-clear"
            title="Clear history"
            aria-label="Clear history"
          >
            <Trash2 size={18} aria-hidden />
          </button>
          <button
            type="button"
            className="ai-chat-btn ai-chat-btn-icon"
            onClick={close}
            data-testid="ai-chat-close"
            title="Close"
            aria-label="Close chat panel"
          >
            <X size={18} aria-hidden />
          </button>
        </div>
      </header>

      <div className="ai-chat-messages-wrap" data-testid="ai-chat-messages-area">
        {aiUnavailable && (
          <div
            className="ai-chat-unavailable"
            data-testid="ai-chat-unavailable"
            role="alert"
          >
            <AlertCircle size={24} aria-hidden />
            <p>AI is unavailable. Enable it in Settings and ensure LM Studio is running.</p>
          </div>
        )}
        {!aiUnavailable && messages.length === 0 && (
          <div className="ai-chat-empty" data-testid="ai-chat-empty-state">
            <MessageCircle size={48} className="ai-chat-empty-icon" aria-hidden />
            <p className="ai-chat-empty-title">Start a conversation with AI</p>
            <p className="ai-chat-empty-hint">
              Ask questions about your notes, and I&apos;ll use relevant pages as context.
            </p>
          </div>
        )}
        {!aiUnavailable && messages.length > 0 && (
          <div className="ai-chat-messages">
            {messages.map((m, idx) => (
              <ChatMessageBubble
                key={`${m.role}-${m.timestamp}`}
                message={m}
                pages={pages}
                messageIndex={idx}
                onRetry={retryMessage}
              />
            ))}
            {loading && (
              <div
                className="ai-chat-loading"
                data-testid="ai-chat-loading"
                aria-busy="true"
              >
                <Loader2 size={20} className="ai-chat-loading-spinner" aria-hidden />
                <span>Thinking...</span>
              </div>
            )}
            <div ref={messagesEndRef} data-testid="ai-chat-messages-end" />
          </div>
        )}
      </div>

      <form
        className="ai-chat-input-wrap"
        onSubmit={handleSubmit}
        data-testid="ai-chat-input-form"
      >
        {(manualSelectedPageIds.length > 0 || uploadedFiles.length > 0) && (
          <div className="ai-chat-attachments" data-testid="ai-chat-attachments">
            {manualSelectedPageIds.map((id) => {
              const page = pages.find((p) => p.id === id)
              const title = page?.title?.trim() || 'Untitled'
              return (
                <span key={id} className="ai-chat-attachment-chip">
                  <FileText size={12} aria-hidden />
                  <span>{title}</span>
                  <button
                    type="button"
                    className="ai-chat-attachment-remove"
                    onClick={() => toggleManualPage(id)}
                    aria-label={`Remove ${title}`}
                    data-testid={`ai-chat-remove-page-${id}`}
                  >
                    <X size={12} />
                  </button>
                </span>
              )
            })}
            {uploadedFiles.map((f) => (
              <span key={f.name} className="ai-chat-attachment-chip">
                <Paperclip size={12} aria-hidden />
                <span>{f.name}</span>
                <button
                  type="button"
                  className="ai-chat-attachment-remove"
                  onClick={() => removeUploadedFile(f.name)}
                  aria-label={`Remove ${f.name}`}
                  data-testid={`ai-chat-remove-file-${f.name}`}
                >
                  <X size={12} />
                </button>
              </span>
            ))}
          </div>
        )}
        <textarea
          ref={inputRef}
          className="ai-chat-input"
          placeholder="Type your message..."
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={loading || aiUnavailable}
          rows={2}
          data-testid="ai-chat-input"
          aria-label="Chat message"
        />
        <div className="ai-chat-input-actions">
          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPT_FILE_TYPES}
            multiple
            className="ai-chat-file-input"
            onChange={handleFileChange}
            data-testid="ai-chat-file-input"
            aria-hidden
          />
          <button
            type="button"
            className="ai-chat-btn ai-chat-btn-icon"
            onClick={() => fileInputRef.current?.click()}
            disabled={loading}
            title="Attach files"
            aria-label="Attach files"
            data-testid="ai-chat-attach-files"
          >
            <Paperclip size={18} aria-hidden />
          </button>
          <button
            type="button"
            className="ai-chat-btn ai-chat-btn-icon"
            onClick={openPageSelector}
            disabled={loading}
            title="Add pages as context"
            aria-label="Add pages as context"
            data-testid="ai-chat-add-pages"
          >
            <FileText size={18} aria-hidden />
          </button>
          <button
            type="submit"
            className="ai-chat-btn ai-chat-send"
            disabled={!inputValue.trim() || loading || aiUnavailable}
            data-testid="ai-chat-send"
            aria-label="Send message"
          >
            <Send size={18} aria-hidden />
          </button>
        </div>
      </form>
      <ChatPageSelectorModal
        isOpen={pageSelectorOpen}
        onClose={closePageSelector}
        pages={pages}
        selectedIds={manualSelectedPageIds}
        onTogglePage={toggleManualPage}
      />
    </div>
  )
}
