import type { Page } from '../storage/storage'
import { loadConfig } from '../config/appConfig'
import { checkAIConnection } from './aiConnection'
import { generateEmbedding } from './aiClient'
import { getAllEmbeddings } from './embeddingService'
import { getPreviewText } from './embeddingText'
import { getModelForUseCase } from './modelSelection'
import { cosineSimilarity, normalizeSimilarity } from './vectorMath'

export type SemanticSearchHit = {
  pageId: string
  title: string
  subtitle: string
  similarity: number
  preview: string
}

/**
 * Whether semantic search can be used (AI enabled and LM Studio connected).
 */
export async function isSemanticSearchAvailable(): Promise<boolean> {
  const config = loadConfig()
  if (!config.aiEnabled) return false
  try {
    const result = await checkAIConnection(config.aiEndpoint, '', true)
    return result.status === 'connected'
  } catch {
    return false
  }
}

/**
 * Semantic search using embeddings and cosine similarity.
 * Requires AI enabled and connection; throws with a clear message otherwise.
 */
export async function searchPages(
  query: string,
  pages: Page[],
  limit = 15,
): Promise<SemanticSearchHit[]> {
  const config = loadConfig()
  if (!config.aiEnabled) {
    throw new Error('Semantic search is unavailable. Enable AI in Settings → AI Settings → General.')
  }

  let status: 'connected' | 'disconnected' | 'connecting' | 'unknown' = 'unknown'
  try {
    const check = await checkAIConnection(config.aiEndpoint, '', true)
    status = check.status
  } catch {
    status = 'disconnected'
  }

  if (status !== 'connected') {
    if (status === 'connecting') {
      throw new Error('Connecting to LM Studio… Please wait and try again.')
    }
    throw new Error(
      'LM Studio is not connected. Ensure LM Studio is running and check Settings → AI Settings.',
    )
  }

  const trimmed = query.trim()
  if (!trimmed) return []

  const activePages = pages.filter((p) => !p.trashed)
  if (activePages.length === 0) return []

  const model = await getModelForUseCase('embedding')
  const queryEmbedding = await generateEmbedding(
    {
      baseUrl: config.aiEndpoint,
      model,
      timeoutMs: 30_000,
    },
    trimmed,
  )

  const allStored = await getAllEmbeddings()
  const embeddingByPage = new Map<string, number[]>()
  for (const row of allStored) {
    embeddingByPage.set(row.pageId, row.embedding)
  }

  const results: Array<{ page: Page; similarity: number }> = []
  for (const page of activePages) {
    const embedding = embeddingByPage.get(page.id)
    if (!embedding || embedding.length !== queryEmbedding.length) continue
    const sim = cosineSimilarity(queryEmbedding, embedding)
    const normalized = normalizeSimilarity(sim)
    results.push({ page, similarity: normalized })
  }

  results.sort((a, b) => b.similarity - a.similarity)
  const top = results.slice(0, limit)

  return top.map(({ page, similarity }) => ({
    pageId: page.id,
    title: page.title || 'Untitled',
    subtitle: '',
    similarity,
    preview: getPreviewText(page.contentMarkdown, 200),
  }))
}
