import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react'
import { loadConfig } from '../config/appConfig'
import { checkAIConnection } from '../services/aiConnection'
import type { ConnectionStatus } from '../services/aiConnection'
import {
  getOrCreateCurrentSession,
  createNewChatSession,
  addMessageToSession,
  updateMessageInSession,
  clearChatHistory,
  type ChatSession,
  type ChatMessageRecord,
  type ChatMessageSource,
} from '../services/chatHistoryService'
import {
  sendChatMessage,
  buildConversationHistory,
} from '../services/chatService'
import { getRAGContext } from '../services/ragService'
import { usePages } from './pagesContext'

export type UploadedChatFile = { name: string; content: string }

type ChatPanelContextValue = {
  isOpen: boolean
  open: () => void
  close: () => void
  toggle: () => void
  connectionStatus: ConnectionStatus
  refreshConnection: () => Promise<void>
  session: ChatSession | null
  messages: ChatMessageRecord[]
  sendMessage: (content: string) => Promise<void>
  retryMessage: (assistantMessageIndex: number) => Promise<void>
  loading: boolean
  newChat: () => void
  exportChat: () => void
  clearHistory: () => void
  manualSelectedPageIds: string[]
  toggleManualPage: (pageId: string) => void
  clearManualPages: () => void
  uploadedFiles: UploadedChatFile[]
  addUploadedFiles: (files: UploadedChatFile[]) => void
  removeUploadedFile: (name: string) => void
  clearUploadedFiles: () => void
  pageSelectorOpen: boolean
  openPageSelector: () => void
  closePageSelector: () => void
}

const ChatPanelContext = createContext<ChatPanelContextValue | null>(null)

export function ChatPanelProvider({ children }: { children: React.ReactNode }) {
  const { pages } = usePages()
  const [isOpen, setIsOpen] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('unknown')
  const [session, setSession] = useState<ChatSession | null>(null)
  const [loading, setLoading] = useState(false)
  const [manualSelectedPageIds, setManualSelectedPageIds] = useState<string[]>([])
  const [uploadedFiles, setUploadedFiles] = useState<UploadedChatFile[]>([])
  const [pageSelectorOpen, setPageSelectorOpen] = useState(false)
  const sessionRef = useRef<ChatSession | null>(null)

  const refreshConnection = useCallback(async () => {
    const config = loadConfig()
    if (!config.aiEnabled || !config.aiEndpoint?.trim()) {
      setConnectionStatus('disconnected')
      return
    }
    setConnectionStatus('connecting')
    try {
      const result = await checkAIConnection(config.aiEndpoint, '', false)
      setConnectionStatus(result.status)
    } catch {
      setConnectionStatus('disconnected')
    }
  }, [])

  const loadSession = useCallback(() => {
    const s = getOrCreateCurrentSession()
    setSession(s)
    sessionRef.current = s
  }, [])

  useEffect(() => {
    loadSession()
  }, [loadSession])

  useEffect(() => {
    if (isOpen) {
      refreshConnection()
    }
  }, [isOpen, refreshConnection])

  const open = useCallback(() => setIsOpen(true), [])
  const close = useCallback(() => setIsOpen(false), [])
  const toggle = useCallback(() => setIsOpen((prev) => !prev), [])

  const sendMessage = useCallback(async (content: string) => {
    const trimmed = content.trim()
    if (!trimmed || !sessionRef.current) return
    const sessionId = sessionRef.current.id

    let ragSources: ChatMessageSource | undefined
    let ragContextText = ''

    try {
      const rag = await getRAGContext(trimmed, pages, 10, {
        manualPageIds: manualSelectedPageIds.length > 0 ? manualSelectedPageIds : undefined,
        uploadedFiles: uploadedFiles.length > 0 ? uploadedFiles : undefined,
      })
      ragContextText = rag.contextText
      if (rag.sources.length > 0 || manualSelectedPageIds.length > 0 || uploadedFiles.length > 0) {
        const autoDetails = rag.sources.filter((s) => s.similarity < 1)
        ragSources = {
          autoSelected: rag.sources.filter((s) => s.similarity < 1).map((s) => s.pageId),
          autoSelectedDetails: autoDetails.map((s) => ({ pageId: s.pageId, similarity: s.similarity })),
          manuallySelected: manualSelectedPageIds.length > 0 ? [...manualSelectedPageIds] : undefined,
          uploadedFiles: uploadedFiles.length > 0 ? uploadedFiles.map((f) => f.name) : undefined,
        }
      }
    } catch {
      // RAG optional; continue without context
    }

    setManualSelectedPageIds([])
    setUploadedFiles([])

    const userMessage: ChatMessageRecord = {
      role: 'user',
      content: trimmed,
      timestamp: Date.now(),
      ...(ragSources && { sources: ragSources }),
    }
    let updated = addMessageToSession(sessionId, userMessage)
    if (updated) {
      setSession(updated)
      sessionRef.current = updated
    }

    const placeholder: ChatMessageRecord = {
      role: 'assistant',
      content: '',
      timestamp: Date.now(),
      ...(ragSources && { sources: ragSources }),
    }
    updated = addMessageToSession(sessionId, placeholder)
    const msgIndex = updated ? updated.messages.length - 1 : 0
    if (updated) {
      setSession(updated)
      sessionRef.current = updated
    }
    setLoading(true)
    try {
      const conversationHistory = buildConversationHistory(
        (updated?.messages ?? []).slice(0, -1),
      )
      const reply = await sendChatMessage({
        userContent: trimmed,
        conversationHistory,
        ragContext: ragContextText || undefined,
      })
      const after = updateMessageInSession(sessionId, msgIndex, { content: reply })
      if (after) {
        setSession(after)
        sessionRef.current = after
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Something went wrong'
      const after = updateMessageInSession(sessionId, msgIndex, {
        content: '',
        error: errorMessage,
      })
      if (after) {
        setSession(after)
        sessionRef.current = after
      }
    } finally {
      setLoading(false)
    }
  }, [pages, manualSelectedPageIds, uploadedFiles])

  const retryMessage = useCallback(
    async (assistantMessageIndex: number) => {
      if (!sessionRef.current || assistantMessageIndex <= 0) return
      const sessionId = sessionRef.current.id
      const messages = sessionRef.current.messages
      const userMsg = messages[assistantMessageIndex - 1]
      if (!userMsg || userMsg.role !== 'user') return
      const trimmed = userMsg.content.trim()
      if (!trimmed) return

      let ragContextText = ''
      try {
        const rag = await getRAGContext(trimmed, pages, 10)
        ragContextText = rag.contextText
      } catch {
        // continue
      }

      const conversationHistory = buildConversationHistory(messages.slice(0, assistantMessageIndex - 1))
      setLoading(true)
      try {
        const reply = await sendChatMessage({
          userContent: trimmed,
          conversationHistory,
          ragContext: ragContextText || undefined,
        })
        const after = updateMessageInSession(sessionId, assistantMessageIndex, {
          content: reply,
          error: undefined,
          retryCount: (messages[assistantMessageIndex]?.retryCount ?? 0) + 1,
        })
        if (after) {
          setSession(after)
          sessionRef.current = after
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Something went wrong'
        const after = updateMessageInSession(sessionId, assistantMessageIndex, {
          content: '',
          error: errorMessage,
          retryCount: (messages[assistantMessageIndex]?.retryCount ?? 0) + 1,
        })
        if (after) {
          setSession(after)
          sessionRef.current = after
        }
      } finally {
        setLoading(false)
      }
    },
    [pages],
  )

  const toggleManualPage = useCallback((pageId: string) => {
    setManualSelectedPageIds((prev) =>
      prev.includes(pageId) ? prev.filter((id) => id !== pageId) : [...prev, pageId],
    )
  }, [])

  const clearManualPages = useCallback(() => setManualSelectedPageIds([]), [])

  const addUploadedFiles = useCallback((files: UploadedChatFile[]) => {
    setUploadedFiles((prev) => {
      const names = new Set(prev.map((f) => f.name))
      const added = files.filter((f) => !names.has(f.name))
      return prev.concat(added)
    })
  }, [])

  const removeUploadedFile = useCallback((name: string) => {
    setUploadedFiles((prev) => prev.filter((f) => f.name !== name))
  }, [])

  const clearUploadedFiles = useCallback(() => setUploadedFiles([]), [])

  const openPageSelector = useCallback(() => setPageSelectorOpen(true), [])
  const closePageSelector = useCallback(() => setPageSelectorOpen(false), [])

  const newChat = useCallback(() => {
    setManualSelectedPageIds([])
    setUploadedFiles([])
    const s = createNewChatSession()
    setSession(s)
    sessionRef.current = s
  }, [])

  const exportChat = useCallback(() => {
    const s = sessionRef.current
    if (!s?.messages?.length) return
    const lines: string[] = []
    for (const m of s.messages) {
      if (m.role === 'system') continue
      const label = m.role === 'user' ? 'You' : 'Assistant'
      const time = new Date(m.timestamp).toLocaleString()
      lines.push(`## ${label} (${time})`, '', m.content, '', '---', '')
    }
    const blob = new Blob([lines.join('\n')], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `chat-${s.id}.md`
    a.click()
    URL.revokeObjectURL(url)
  }, [])

  const clearHistory = useCallback(() => {
    const newSession = clearChatHistory()
    setSession(newSession)
    sessionRef.current = newSession
  }, [])

  const value: ChatPanelContextValue = {
    isOpen,
    open,
    close,
    toggle,
    connectionStatus,
    refreshConnection,
    session,
    messages: session?.messages ?? [],
    sendMessage,
    retryMessage,
    loading,
    newChat,
    exportChat,
    clearHistory,
    manualSelectedPageIds,
    toggleManualPage,
    clearManualPages,
    uploadedFiles,
    addUploadedFiles,
    removeUploadedFile,
    clearUploadedFiles,
    pageSelectorOpen,
    openPageSelector,
    closePageSelector,
  }

  return (
    <ChatPanelContext.Provider value={value}>
      {children}
    </ChatPanelContext.Provider>
  )
}

export function useChatPanel() {
  const ctx = useContext(ChatPanelContext)
  if (!ctx) {
    throw new Error('useChatPanel must be used within ChatPanelProvider')
  }
  return ctx
}

/** Safe hook for use outside provider (e.g. Sidebar); returns no-op if no provider */
export function useChatPanelOptional() {
  const ctx = useContext(ChatPanelContext)
  return ctx ?? null
}
