import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { ChatMessageRecord } from './chatHistoryService'

vi.mock('../config/appConfig', () => ({ loadConfig: vi.fn() }))
vi.mock('./modelSelection', () => ({ getModelForUseCase: vi.fn() }))
vi.mock('./aiClient', () => ({ createLmStudioClient: vi.fn() }))

import { loadConfig } from '../config/appConfig'
import { createLmStudioClient } from './aiClient'
import { getModelForUseCase } from './modelSelection'
import { sendChatMessage, buildConversationHistory } from './chatService'

const mockLoadConfig = vi.mocked(loadConfig)
const mockGetModelForUseCase = vi.mocked(getModelForUseCase)
const mockCreateLmStudioClient = vi.mocked(createLmStudioClient)

beforeEach(() => {
  vi.clearAllMocks()
  mockLoadConfig.mockReturnValue({
    aiEnabled: true,
    aiEndpoint: 'http://127.0.0.1:1234/v1',
    aiTemperature: 0.2,
    aiMaxTokens: 800,
  } as any)
  mockGetModelForUseCase.mockResolvedValue('test-chat-model')
  mockCreateLmStudioClient.mockReturnValue({
    completeChat: vi.fn().mockResolvedValue({ content: 'Assistant reply here' }),
  } as any)
})

describe('sendChatMessage', () => {
  it('calls LM Studio with system + history + user message', async () => {
    const completeChat = vi.fn().mockResolvedValue({ content: 'Hi there' })
    mockCreateLmStudioClient.mockReturnValue({ completeChat } as any)

    const result = await sendChatMessage({
      userContent: 'Hello',
      conversationHistory: [],
    })

    expect(mockGetModelForUseCase).toHaveBeenCalledWith('chat')
    expect(mockCreateLmStudioClient).toHaveBeenCalledWith({ baseUrl: 'http://127.0.0.1:1234/v1' })
    expect(completeChat).toHaveBeenCalledOnce()
    const call = completeChat.mock.calls[0][0]
    expect(call.model).toBe('test-chat-model')
    expect(call.messages).toHaveLength(2)
    expect(call.messages[0].role).toBe('system')
    expect(call.messages[1].role).toBe('user')
    expect(call.messages[1].content).toBe('Hello')
    expect(result).toBe('Hi there')
  })

  it('includes conversation history in messages', async () => {
    const completeChat = vi.fn().mockResolvedValue({ content: 'Reply' })
    mockCreateLmStudioClient.mockReturnValue({ completeChat } as any)

    await sendChatMessage({
      userContent: 'Second',
      conversationHistory: [
        { role: 'user', content: 'First' },
        { role: 'assistant', content: 'First reply' },
      ],
    })

    const call = completeChat.mock.calls[0][0]
    expect(call.messages).toHaveLength(4) // system + user + assistant + user
    expect(call.messages[1].content).toBe('First')
    expect(call.messages[2].content).toBe('First reply')
    expect(call.messages[3].content).toBe('Second')
  })

  it('throws when AI is disabled', async () => {
    mockLoadConfig.mockReturnValue({ aiEnabled: false } as any)
    await expect(
      sendChatMessage({ userContent: 'Hi', conversationHistory: [] }),
    ).rejects.toThrow('AI features are disabled')
    expect(mockCreateLmStudioClient).not.toHaveBeenCalled()
  })
})

describe('buildConversationHistory', () => {
  it('filters to user and assistant only', () => {
    const messages: ChatMessageRecord[] = [
      { role: 'system', content: 'Sys', timestamp: 0 },
      { role: 'user', content: 'U', timestamp: 1 },
      { role: 'assistant', content: 'A', timestamp: 2 },
    ]
    expect(buildConversationHistory(messages)).toEqual([
      { role: 'user', content: 'U' },
      { role: 'assistant', content: 'A' },
    ])
  })
  it('returns empty for no messages', () => {
    expect(buildConversationHistory([])).toEqual([])
  })
})
