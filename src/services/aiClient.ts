import type { ChatMessage } from './aiPrompt'

export type AiClientConfig = {
  baseUrl: string
  apiKey?: string
  timeoutMs?: number
}

export type ChatRequest = {
  messages: ChatMessage[]
  model: string
  temperature?: number
}

export type ChatResponse = {
  content: string
}

type LmStudioResponse = {
  choices?: Array<{ message?: { content?: string } }>
}

function ensureTrailingSlash(value: string) {
  return value.endsWith('/') ? value : `${value}/`
}

export function createLmStudioClient(config: AiClientConfig) {
  const baseUrl = ensureTrailingSlash(config.baseUrl)
  const timeoutMs = config.timeoutMs ?? 15_000

  async function completeChat(request: ChatRequest): Promise<ChatResponse> {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), timeoutMs)

    try {
      const response = await fetch(`${baseUrl}chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(config.apiKey ? { Authorization: `Bearer ${config.apiKey}` } : {}),
        },
        body: JSON.stringify({
          model: request.model,
          messages: request.messages,
          temperature: request.temperature ?? 0.2,
        }),
        signal: controller.signal,
      })

      if (!response.ok) {
        throw new Error(`LM Studio error: ${response.status}`)
      }

      const data = (await response.json()) as LmStudioResponse
      const content = data.choices?.[0]?.message?.content?.trim() ?? ''
      return { content }
    } finally {
      clearTimeout(timeout)
    }
  }

  return { completeChat }
}
