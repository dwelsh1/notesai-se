import { loadConfig } from '../config/appConfig'
import { generateEmbedding } from './aiClient'
import { buildTextForEmbedding, textHash } from './embeddingText'
import { getModelForUseCase } from './modelSelection'

const MIN_TEXT_LENGTH = 24

function getEmbeddingsApi() {
  return typeof window !== 'undefined' ? window.notesAISE?.embeddings : undefined
}

export async function getAllEmbeddings(): Promise<
  Array<{ pageId: string; embedding: number[]; textHash: string }>
> {
  const api = getEmbeddingsApi()
  if (!api) return []
  return api.getAll()
}

export async function getPageEmbedding(
  pageId: string,
): Promise<{ embedding: number[]; textHash: string } | null> {
  const api = getEmbeddingsApi()
  if (!api) return null
  return api.get(pageId)
}

export async function storePageEmbedding(
  pageId: string,
  embedding: number[],
  textHash: string,
): Promise<void> {
  const api = getEmbeddingsApi()
  if (!api) return
  await api.upsert(pageId, embedding, textHash)
}

export async function deletePageEmbedding(pageId: string): Promise<void> {
  const api = getEmbeddingsApi()
  if (!api) return
  await api.delete(pageId)
}

/**
 * Generate embedding for a page and store it. Skips very short text.
 */
export async function generatePageEmbedding(
  pageId: string,
  title: string,
  contentMarkdown: string,
): Promise<void> {
  const api = getEmbeddingsApi()
  if (!api) return

  const text = buildTextForEmbedding(title, contentMarkdown)
  if (text.length < MIN_TEXT_LENGTH) {
    await deletePageEmbedding(pageId)
    return
  }

  const config = loadConfig()
  const model = await getModelForUseCase('embedding')
  const embedding = await generateEmbedding(
    {
      baseUrl: config.aiEndpoint,
      model,
      timeoutMs: 30_000,
    },
    text,
  )
  const hash = textHash(text)
  await storePageEmbedding(pageId, embedding, hash)
}

/**
 * If text hash changed, regenerate and store embedding; otherwise skip.
 */
export async function updatePageEmbedding(
  pageId: string,
  title: string,
  contentMarkdown: string,
): Promise<void> {
  const api = getEmbeddingsApi()
  if (!api) return

  const text = buildTextForEmbedding(title, contentMarkdown)
  const newHash = textHash(text)

  if (text.length < MIN_TEXT_LENGTH) {
    await deletePageEmbedding(pageId)
    return
  }

  const existing = await getPageEmbedding(pageId)
  if (existing && existing.textHash === newHash) return

  const config = loadConfig()
  const model = await getModelForUseCase('embedding')
  const embedding = await generateEmbedding(
    {
      baseUrl: config.aiEndpoint,
      model,
      timeoutMs: 30_000,
    },
    text,
  )
  await storePageEmbedding(pageId, embedding, newHash)
}
