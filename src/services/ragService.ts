/**
 * RAG (Retrieval-Augmented Generation) for AI Chat.
 * Finds relevant pages via semantic search and formats context for the LLM.
 */

import type { Page } from '../storage/storage'
import { searchPages } from './semanticSearchService'
import { contentToPlainText } from './embeddingText'

const MAX_CONTENT_CHARS = 500

export type RAGSource = {
  pageId: string
  title: string
  subtitle: string
  similarity: number
}

export type RAGContextResult = {
  contextText: string
  sources: RAGSource[]
}

export type RAGContextOptions = {
  manualPageIds?: string[]
  uploadedFiles?: Array<{ name: string; content: string }>
}

function formatPageExcerpt(page: Page, maxChars: number): string {
  const title = page.title?.trim() || 'Untitled'
  const contentText = contentToPlainText(page.contentMarkdown || '').slice(0, maxChars)
  const suffix = contentText.length >= maxChars ? '...' : ''
  return `[${title}]\n${contentText}${suffix}`
}

/**
 * Get RAG context for a user query: semantic search + optional manual pages + uploaded files.
 * Returns empty context if search fails (e.g. no embeddings or AI disabled).
 */
export async function getRAGContext(
  query: string,
  pages: Page[],
  limit = 10,
  options: RAGContextOptions = {},
): Promise<RAGContextResult> {
  const trimmed = query.trim()
  const activePages = pages.filter((p) => !p.trashed)
  const pageById = new Map(activePages.map((p) => [p.id, p]))
  const parts: string[] = []
  const sources: RAGSource[] = []
  const seenIds = new Set<string>()

  if (trimmed && activePages.length > 0) {
    let hits: Array<{ pageId: string; title: string; subtitle: string; similarity: number; preview: string }> | null = null
    try {
      hits = await searchPages(trimmed, pages, limit)
    } catch {
      // continue with manual + files only
    }
    if (hits && hits.length > 0) {
      for (const hit of hits) {
        if (seenIds.has(hit.pageId)) continue
        seenIds.add(hit.pageId)
        const page = pageById.get(hit.pageId)
        const title = hit.title || 'Untitled'
        const subtitle = hit.subtitle || ''
        const contentText = page
          ? contentToPlainText(page.contentMarkdown || '').slice(0, MAX_CONTENT_CHARS)
          : hit.preview || ''
        const contentSuffix = contentText.length >= MAX_CONTENT_CHARS ? '...' : ''
        parts.push(`[${title}${subtitle ? ` — ${subtitle}` : ''}]\n${contentText}${contentSuffix}`)
        sources.push({ pageId: hit.pageId, title, subtitle, similarity: hit.similarity })
      }
    }
  }

  const manualIds = options.manualPageIds ?? []
  for (const id of manualIds) {
    if (seenIds.has(id)) continue
    const page = pageById.get(id)
    if (!page) continue
    seenIds.add(id)
    parts.push(formatPageExcerpt(page, MAX_CONTENT_CHARS))
    sources.push({ pageId: id, title: page.title?.trim() || 'Untitled', subtitle: '', similarity: 1 })
  }

  const uploaded = options.uploadedFiles ?? []
  for (const f of uploaded) {
    const text = f.content.slice(0, MAX_CONTENT_CHARS) + (f.content.length > MAX_CONTENT_CHARS ? '...' : '')
    parts.push(`[Uploaded: ${f.name}]\n${text}`)
  }

  const contextText =
    parts.length > 0
      ? 'Relevant notes and content (use as context to answer):\n\n' + parts.join('\n\n---\n\n')
      : ''
  return { contextText, sources }
}
