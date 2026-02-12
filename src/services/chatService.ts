/**
 * Send chat message to LM Studio and return assistant response.
 * Uses chat model from settings and existing aiClient.
 */

import { loadConfig } from '../config/appConfig'
import { createLmStudioClient } from './aiClient'
import { getModelForUseCase } from './modelSelection'
import type { ChatMessageRecord } from './chatHistoryService'

export type SendChatMessageParams = {
  userContent: string
  conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>
  /** Optional RAG context (relevant note excerpts) to ground the answer */
  ragContext?: string
}

export async function sendChatMessage(params: SendChatMessageParams): Promise<string> {
  const config = loadConfig()
  if (!config.aiEnabled) {
    throw new Error('AI features are disabled. Enable them in Settings > AI Settings > General.')
  }
  const model = await getModelForUseCase('chat')
  const temperature = config.aiTemperature ?? 0.2
  const maxTokens = Math.min(4000, config.aiMaxTokens ?? 800)

  let systemContent =
    'You are a helpful assistant. Answer the user based on the conversation and any context they provide. Be concise and clear.'
  if (params.ragContext?.trim()) {
    systemContent += `\n\n${params.ragContext.trim()}`
  }

  const systemMessage = {
    role: 'system' as const,
    content: systemContent,
  }

  const messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }> = [
    systemMessage,
    ...params.conversationHistory.map((m) => ({ role: m.role, content: m.content })),
    { role: 'user', content: params.userContent },
  ]

  const client = createLmStudioClient({ baseUrl: config.aiEndpoint })
  const result = await client.completeChat({
    model,
    messages,
    temperature,
    max_tokens: maxTokens,
  })
  return result.content || ''
}

/**
 * Build conversation history for API from session messages (user + assistant only).
 */
export function buildConversationHistory(messages: ChatMessageRecord[]): Array<{ role: 'user' | 'assistant'; content: string }> {
  return messages
    .filter((m) => m.role === 'user' || m.role === 'assistant')
    .map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content }))
}
