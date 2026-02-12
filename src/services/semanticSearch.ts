import type { Page } from '../storage/storage'
import { createLmStudioClient } from './aiClient'
import type { AiClientConfig } from './aiClient'

export type SemanticSearchResult = {
  pageId: string
  relevanceScore: number
  reason: string
}

export type SemanticSearchOptions = {
  query: string
  pages: Page[]
  aiConfig: AiClientConfig & { model: string; temperature?: number }
  maxResults?: number
}

/**
 * Performs semantic search across pages using AI to find relevant pages based on meaning,
 * not just keyword matching.
 */
export async function semanticSearch(
  options: SemanticSearchOptions,
): Promise<SemanticSearchResult[]> {
  const { query, pages, aiConfig, maxResults = 10 } = options

  if (!query.trim()) {
    return []
  }

  if (pages.length === 0) {
    return []
  }

  // Build a prompt that asks the AI to find relevant pages
  // Limit to most recent 100 pages to avoid timeout with large page counts
  const activePages = pages.filter((p) => !p.trashed)
  const pagesToSearch = activePages
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()) // Most recent first
    .slice(0, 100) // Limit to 100 pages max

  const pagesContext = pagesToSearch
    .map((p) => {
      // Extract text content from HTML (simple strip for now)
      const textContent = p.contentMarkdown
        .replace(/<[^>]*>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
      // Reduce content length to 200 chars to keep prompt smaller
      const truncatedContent = textContent.substring(0, 200)
      return `Page ID: ${p.id}\nTitle: ${p.title}\nContent: ${truncatedContent}${textContent.length > 200 ? '...' : ''}`
    })
    .join('\n\n---\n\n')

  const systemPrompt = `You are a semantic search assistant. Your task is to find pages that are semantically relevant to a user's query, even if they don't contain the exact keywords.

For each relevant page, provide:
1. The page ID
2. A relevance score from 0.0 to 1.0 (1.0 = highly relevant, 0.0 = not relevant)
3. A brief reason why it's relevant

Return your response as a JSON array of objects with this exact structure:
[
  {
    "pageId": "page-id-here",
    "relevanceScore": 0.85,
    "reason": "Brief explanation of relevance"
  }
]

Only include pages with relevanceScore >= 0.3. Sort by relevanceScore descending.`

  const pageCountInfo =
    activePages.length > pagesToSearch.length
      ? `\n\nNote: Searching ${pagesToSearch.length} most recent pages (out of ${activePages.length} total).`
      : ''

  const userPrompt = `User query: "${query}"

Available pages:
${pagesContext}${pageCountInfo}

Find the most relevant pages for this query. Return only pages that are semantically relevant (relevanceScore >= 0.3).`

  try {
    const client = createLmStudioClient(aiConfig)
    const result = await client.completeChat({
      model: aiConfig.model,
      temperature: aiConfig.temperature ?? 0.2,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
    })

    // Parse the AI response (should be JSON)
    let results: SemanticSearchResult[] = []
    try {
      // Try to extract JSON from the response (AI might add extra text)
      const jsonMatch = result.content.match(/\[[\s\S]*\]/)
      if (jsonMatch) {
        results = JSON.parse(jsonMatch[0]) as SemanticSearchResult[]
      } else {
        // Fallback: try parsing the whole response
        results = JSON.parse(result.content) as SemanticSearchResult[]
      }
    } catch (parseError) {
      // If parsing fails, return empty results
      console.error('Failed to parse semantic search response:', parseError)
      return []
    }

    // Validate and filter results
    const activePageIds = new Set(pages.filter((p) => !p.trashed).map((p) => p.id))
    results = results
      .filter(
        (r) =>
          r.pageId &&
          typeof r.relevanceScore === 'number' &&
          r.relevanceScore >= 0.3 &&
          activePageIds.has(r.pageId),
      )
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, maxResults)

    return results
  } catch (error) {
    console.error('Semantic search error:', error)
    throw error
  }
}
