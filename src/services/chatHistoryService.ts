/**
 * Chat history persistence (localStorage).
 * Max 50 sessions, max 100 messages per session.
 */

const STORAGE_KEY = 'notesai-se:chat-history'
const MAX_SESSIONS = 50
const MAX_MESSAGES_PER_SESSION = 100

export type ChatMessageRole = 'user' | 'assistant' | 'system'

export type AutoSelectedDetail = {
  pageId: string
  similarity: number
}

export type ChatMessageSource = {
  autoSelected?: string[]
  /** When present, used for display (relevance %) */
  autoSelectedDetails?: AutoSelectedDetail[]
  manuallySelected?: string[]
  uploadedFiles?: string[]
  pageReferences?: string[]
}

export type ChatMessageRecord = {
  role: ChatMessageRole
  content: string
  timestamp: number
  sources?: ChatMessageSource
  error?: string
  retryCount?: number
}

export type ChatSession = {
  id: string
  title: string | null
  messages: ChatMessageRecord[]
  createdAt: number
  updatedAt: number
}

function createSessionId(): string {
  return `chat-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

export function getChatHistory(): ChatSession[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as ChatSession[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function saveChatHistory(sessions: ChatSession[]): void {
  const trimmed = sessions.slice(-MAX_SESSIONS)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed))
}

export function getOrCreateCurrentSession(): ChatSession {
  const sessions = getChatHistory()
  if (sessions.length > 0) {
    const last = sessions[sessions.length - 1]
    if (last && last.messages) return last
  }
  const newSession: ChatSession = {
    id: createSessionId(),
    title: null,
    messages: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  }
  sessions.push(newSession)
  saveChatHistory(sessions)
  return newSession
}

export function saveChatSession(session: ChatSession): void {
  const sessions = getChatHistory().filter((s) => s.id !== session.id)
  session.updatedAt = Date.now()
  sessions.push(session)
  saveChatHistory(sessions)
}

export function addMessageToSession(
  sessionId: string,
  message: ChatMessageRecord,
): ChatSession | null {
  const sessions = getChatHistory()
  const session = sessions.find((s) => s.id === sessionId)
  if (!session) return null
  session.messages = session.messages.slice(-(MAX_MESSAGES_PER_SESSION - 1))
  session.messages.push(message)
  session.updatedAt = Date.now()
  saveChatHistory(sessions)
  return session
}

export function updateMessageInSession(
  sessionId: string,
  messageIndex: number,
  update: Partial<ChatMessageRecord>,
): ChatSession | null {
  const sessions = getChatHistory()
  const session = sessions.find((s) => s.id === sessionId)
  if (!session || messageIndex < 0 || messageIndex >= session.messages.length) return null
  session.messages[messageIndex] = { ...session.messages[messageIndex], ...update }
  session.updatedAt = Date.now()
  saveChatHistory(sessions)
  return session
}

export function createNewChatSession(): ChatSession {
  const newSession: ChatSession = {
    id: createSessionId(),
    title: null,
    messages: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  }
  const sessions = getChatHistory()
  sessions.push(newSession)
  saveChatHistory(sessions)
  return newSession
}

export function clearChatHistory(): ChatSession {
  saveChatHistory([])
  return createNewChatSession()
}

export function getChatHistoryStats(): { sessionCount: number; totalMessages: number } {
  const sessions = getChatHistory()
  const totalMessages = sessions.reduce((sum, s) => sum + (s.messages?.length ?? 0), 0)
  return { sessionCount: sessions.length, totalMessages }
}
