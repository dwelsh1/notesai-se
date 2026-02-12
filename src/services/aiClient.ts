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
  max_tokens?: number
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
          max_tokens: request.max_tokens,
        }),
        signal: controller.signal,
      })

      if (!response.ok) {
        throw new Error(`LM Studio error: ${response.status} ${response.statusText}`)
      }

      const data = (await response.json()) as LmStudioResponse
      const content = data.choices?.[0]?.message?.content?.trim() ?? ''
      return { content }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        const timeoutSeconds = Math.round(timeoutMs / 1000)
        throw new Error(
          `Request timed out after ${timeoutSeconds} seconds. Please check your LM Studio connection and endpoint in Settings (⚙). Ensure LM Studio is running and the API server is enabled.`,
        )
      }
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error(
          `Failed to connect to LM Studio at ${baseUrl}. Please ensure LM Studio is running, the API server is enabled, and the endpoint is correct in Settings (⚙).`,
        )
      }
      throw error
    } finally {
      clearTimeout(timeout)
    }
  }

  return { completeChat }
}

// --- Embeddings (OpenAI-compatible: LM Studio /v1/embeddings) ---

type EmbeddingsResponse = {
  data?: Array<{ embedding: number[]; index?: number }>
}

export async function generateEmbedding(
  config: AiClientConfig & { model: string },
  text: string,
): Promise<number[]> {
  const baseUrl = ensureTrailingSlash(config.baseUrl)
  const timeoutMs = config.timeoutMs ?? 30_000
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const response = await fetch(`${baseUrl}embeddings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(config.apiKey ? { Authorization: `Bearer ${config.apiKey}` } : {}),
      },
      body: JSON.stringify({
        model: config.model,
        input: text,
      }),
      signal: controller.signal,
    })

    if (!response.ok) {
      throw new Error(`LM Studio embeddings error: ${response.status} ${response.statusText}`)
    }

    const data = (await response.json()) as EmbeddingsResponse
    const embedding = data.data?.[0]?.embedding
    if (!Array.isArray(embedding)) {
      throw new Error('Invalid embeddings response: missing embedding array')
    }
    return embedding
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(
        `Embedding request timed out. Check LM Studio and your embedding model in Settings.`,
      )
    }
    throw error
  } finally {
    clearTimeout(timeout)
  }
}
