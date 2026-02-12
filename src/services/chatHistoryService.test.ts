import { describe, it, expect, beforeEach } from 'vitest'
import {
  getChatHistory,
  getOrCreateCurrentSession,
  createNewChatSession,
  addMessageToSession,
  updateMessageInSession,
  clearChatHistory,
  getChatHistoryStats,
  type ChatSession,
  type ChatMessageRecord,
} from './chatHistoryService'

const STORAGE_KEY = 'notesai-se:chat-history'

beforeEach(() => {
  localStorage.removeItem(STORAGE_KEY)
})

describe('chatHistoryService', () => {
  describe('getChatHistory', () => {
    it('returns empty array when no history', () => {
      expect(getChatHistory()).toEqual([])
    })
    it('returns saved sessions after creating one', () => {
      const session = getOrCreateCurrentSession()
      expect(getChatHistory()).toHaveLength(1)
      expect(getChatHistory()[0].id).toBe(session.id)
      expect(getChatHistory()[0].messages).toEqual([])
    })
  })

  describe('getOrCreateCurrentSession', () => {
    it('creates new session when none exist', () => {
      const session = getOrCreateCurrentSession()
      expect(session.id).toMatch(/^chat-\d+-[a-z0-9]+$/)
      expect(session.messages).toEqual([])
      expect(getChatHistory()).toHaveLength(1)
    })
    it('returns most recent session when history exists', () => {
      const s1 = getOrCreateCurrentSession()
      const s2 = createNewChatSession()
      const current = getOrCreateCurrentSession()
      expect(getChatHistory()).toHaveLength(2)
      expect(current.id).toBe(s2.id)
    })
  })

  describe('createNewChatSession', () => {
    it('adds a new session with unique id', () => {
      const s1 = createNewChatSession()
      const s2 = createNewChatSession()
      expect(s1.id).not.toBe(s2.id)
      expect(getChatHistory()).toHaveLength(2)
    })
  })

  describe('addMessageToSession', () => {
    it('appends message and updates session', () => {
      const session = getOrCreateCurrentSession()
      const msg: ChatMessageRecord = {
        role: 'user',
        content: 'Hello',
        timestamp: Date.now(),
      }
      const updated = addMessageToSession(session.id, msg)
      expect(updated).not.toBeNull()
      expect(updated!.messages).toHaveLength(1)
      expect(updated!.messages[0].content).toBe('Hello')
    })
    it('returns null for unknown session id', () => {
      const result = addMessageToSession('unknown-id', {
        role: 'user',
        content: 'Hi',
        timestamp: Date.now(),
      })
      expect(result).toBeNull()
    })
  })

  describe('updateMessageInSession', () => {
    it('updates message at index', () => {
      const session = getOrCreateCurrentSession()
      addMessageToSession(session.id, {
        role: 'user',
        content: 'Hi',
        timestamp: 1,
      })
      addMessageToSession(session.id, {
        role: 'assistant',
        content: 'Old',
        timestamp: 2,
      })
      const updated = updateMessageInSession(session.id, 1, { content: 'New' })
      expect(updated?.messages[1].content).toBe('New')
    })
    it('returns null for invalid index', () => {
      const session = getOrCreateCurrentSession()
      expect(updateMessageInSession(session.id, 0, { content: 'x' })).toBeNull()
    })
  })

  describe('clearChatHistory', () => {
    it('clears storage and returns new empty session', () => {
      getOrCreateCurrentSession()
      addMessageToSession(getChatHistory()[0].id, {
        role: 'user',
        content: 'Hi',
        timestamp: 1,
      })
      const newSession = clearChatHistory()
      expect(getChatHistory()).toHaveLength(1)
      expect(newSession.messages).toHaveLength(0)
    })
  })

  describe('getChatHistoryStats', () => {
    it('returns session and message counts', () => {
      const session = getOrCreateCurrentSession()
      addMessageToSession(session.id, {
        role: 'user',
        content: 'A',
        timestamp: 1,
      })
      addMessageToSession(session.id, {
        role: 'assistant',
        content: 'B',
        timestamp: 2,
      })
      expect(getChatHistoryStats()).toEqual({ sessionCount: 1, totalMessages: 2 })
    })
  })
})
