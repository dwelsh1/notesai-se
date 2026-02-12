import { createLmStudioClient } from './aiClient'

export type ConnectionStatus = 'connected' | 'disconnected' | 'connecting' | 'unknown'

export type ConnectionCheckResult = {
  status: ConnectionStatus
  message: string
  models: string[]
  modelCount: number
}

const connectionCache = new Map<string, { result: ConnectionCheckResult; timestamp: number }>()
const CACHE_TTL = 25_000 // 25 seconds

/**
 * Checks connection to LM Studio and fetches available models
 */
export async function checkAIConnection(
  endpoint: string,
  model: string = '',
  useCache: boolean = true,
): Promise<ConnectionCheckResult> {
  const cacheKey = `${endpoint}:${model}`
  const cached = connectionCache.get(cacheKey)

  if (useCache && cached) {
    const age = Date.now() - cached.timestamp
    if (age < CACHE_TTL) {
      return cached.result
    }
  }

  const modelsUrl = `${endpoint.replace(/\/$/, '')}/models`
  console.log('[AI] Starting connection check for endpoint:', endpoint)
  console.log('[AI] Checking connection to', modelsUrl)

  try {
    const client = createLmStudioClient({ baseUrl: endpoint, timeoutMs: 5000 })

    // Test connection by making a simple request
    // We'll use the models endpoint if available, otherwise try a minimal chat request
    let models: string[] = []

    try {
      // Try to fetch models from LM Studio
      const modelsResponse = await fetch(modelsUrl, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      })

      console.log('[AI] Connection check response:', {
        ok: modelsResponse.ok,
        status: modelsResponse.status,
        statusText: modelsResponse.statusText,
      })

      if (modelsResponse.ok) {
        const modelsData = (await modelsResponse.json()) as { data?: Array<{ id: string }> }
        if (modelsData.data) {
          models = modelsData.data.map((m) => m.id)
        }
      }
    } catch (modelsErr) {
      console.log('[AI] Failed to fetch models:', modelsErr)
      // Models endpoint not available, that's okay
    }

    // If models endpoint didn't work, try a minimal chat request to verify connection
    if (models.length === 0) {
      const testModel = model || 'test'
      try {
        await client.completeChat({
          model: testModel,
          messages: [{ role: 'user', content: 'test' }],
          temperature: 0.1,
        })
        // If we get here, connection works but we don't have model list
        models = []
      } catch {
        // Connection failed
        throw new Error('Failed to connect to LM Studio')
      }
    }

    console.log('[AI] Connection check result: CONNECTED')
    if (models.length > 0) {
      console.log('[AI] Fetched', models.length, 'models:', models)
    }

    const result: ConnectionCheckResult = {
      status: 'connected',
      message:
        models.length > 0
          ? `Connected to LM Studio (${models.length} models available)`
          : 'Connected to LM Studio',
      models,
      modelCount: models.length,
    }

    connectionCache.set(cacheKey, { result, timestamp: Date.now() })
    return result
  } catch (error) {
    console.log('[AI] Connection check failed:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    const result: ConnectionCheckResult = {
      status: 'disconnected',
      message: `Connection failed: ${errorMessage}`,
      models: [],
      modelCount: 0,
    }
    connectionCache.set(cacheKey, { result, timestamp: Date.now() })
    console.log('[AI] Connection check result: DISCONNECTED')
    return result
  }
}

/**
 * Clears the connection cache
 */
export function clearConnectionCache(): void {
  connectionCache.clear()
}
