import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { Page } from '../storage/storage'
import {
  isSemanticSearchAvailable,
  searchPages,
  type SemanticSearchHit,
} from './semanticSearchService'

vi.mock('../config/appConfig', () => ({
  loadConfig: vi.fn(() => ({
    aiEnabled: true,
    aiEndpoint: 'http://localhost:1234/v1',
  })),
}))

vi.mock('./aiConnection', () => ({
  checkAIConnection: vi.fn(),
}))

vi.mock('./aiClient', () => ({
  generateEmbedding: vi.fn(),
}))

vi.mock('./embeddingService', () => ({
  getAllEmbeddings: vi.fn(),
}))

vi.mock('./modelSelection', () => ({
  getModelForUseCase: vi.fn(() => Promise.resolve('embed-model')),
}))

import { loadConfig } from '../config/appConfig'
import { checkAIConnection } from './aiConnection'
import { generateEmbedding } from './aiClient'
import { getAllEmbeddings } from './embeddingService'

const mockCheckAIConnection = vi.mocked(checkAIConnection)
const mockGenerateEmbedding = vi.mocked(generateEmbedding)
const mockGetAllEmbeddings = vi.mocked(getAllEmbeddings)
const mockLoadConfig = vi.mocked(loadConfig)

function makePage(overrides: Partial<Page> = {}): Page {
  return {
    id: 'p1',
    title: 'Test Page',
    contentMarkdown: 'Content',
    updatedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    trashed: false,
    favorited: false,
    parentId: null,
    order: 0,
    favoriteOrder: null,
    ...overrides,
  }
}

describe('isSemanticSearchAvailable', () => {
  beforeEach(() => {
    mockLoadConfig.mockReturnValue({
      aiEnabled: true,
      aiEndpoint: 'http://localhost:1234/v1',
    } as any)
    mockCheckAIConnection.mockResolvedValue({
      status: 'connected',
      message: 'OK',
      models: [],
      modelCount: 0,
    })
  })

  it('returns true when AI enabled and connected', async () => {
    const result = await isSemanticSearchAvailable()
    expect(result).toBe(true)
  })

  it('returns false when AI disabled', async () => {
    mockLoadConfig.mockReturnValue({
      aiEnabled: false,
      aiEndpoint: 'http://localhost:1234/v1',
    } as any)
    const result = await isSemanticSearchAvailable()
    expect(result).toBe(false)
  })

  it('returns false when connection check throws', async () => {
    mockCheckAIConnection.mockRejectedValue(new Error('Network error'))
    const result = await isSemanticSearchAvailable()
    expect(result).toBe(false)
  })

  it('returns false when status is not connected', async () => {
    mockCheckAIConnection.mockResolvedValue({
      status: 'disconnected',
      message: 'Off',
      models: [],
      modelCount: 0,
    })
    const result = await isSemanticSearchAvailable()
    expect(result).toBe(false)
  })
})

describe('searchPages', () => {
  const vec3 = [1, 0, 0]

  beforeEach(() => {
    mockLoadConfig.mockReturnValue({
      aiEnabled: true,
      aiEndpoint: 'http://localhost:1234/v1',
    } as any)
    mockCheckAIConnection.mockResolvedValue({
      status: 'connected',
      message: 'OK',
      models: [],
      modelCount: 0,
    })
    mockGenerateEmbedding.mockResolvedValue(vec3)
    mockGetAllEmbeddings.mockResolvedValue([
      { pageId: 'p1', embedding: [1, 0, 0], textHash: 'h1' },
      { pageId: 'p2', embedding: [0.9, 0.1, 0], textHash: 'h2' },
    ])
  })

  it('throws when AI disabled', async () => {
    mockLoadConfig.mockReturnValue({
      aiEnabled: false,
      aiEndpoint: 'http://localhost:1234/v1',
    } as any)
    await expect(
      searchPages('q', [makePage()]),
    ).rejects.toThrow('Semantic search is unavailable')
  })

  it('returns empty array for empty query', async () => {
    const result = await searchPages('  ', [makePage()])
    expect(result).toEqual([])
  })

  it('returns empty array for no active pages', async () => {
    const result = await searchPages('q', [])
    expect(result).toEqual([])
  })

  it('returns hits with similarity and preview', async () => {
    const pages: Page[] = [
      makePage({ id: 'p1', title: 'Page One', contentMarkdown: 'Body one' }),
      makePage({ id: 'p2', title: 'Page Two', contentMarkdown: 'Body two' }),
    ]
    const result = await searchPages('query', pages, 10)
    expect(mockGenerateEmbedding).toHaveBeenCalledWith(
      expect.objectContaining({ baseUrl: 'http://localhost:1234/v1', model: 'embed-model' }),
      'query',
    )
    expect(Array.isArray(result)).toBe(true)
    result.forEach((hit: SemanticSearchHit) => {
      expect(hit).toHaveProperty('pageId')
      expect(hit).toHaveProperty('title')
      expect(hit).toHaveProperty('similarity')
      expect(hit).toHaveProperty('preview')
      expect(hit.similarity).toBeGreaterThanOrEqual(0)
      expect(hit.similarity).toBeLessThanOrEqual(1)
    })
  })

  it('excludes trashed pages', async () => {
    mockGetAllEmbeddings.mockResolvedValue([
      { pageId: 'p1', embedding: [1, 0, 0], textHash: 'h1' },
    ])
    const pages: Page[] = [
      makePage({ id: 'p1' }),
      makePage({ id: 'p2', trashed: true }),
    ]
    const result = await searchPages('q', pages)
    expect(result.every((h) => h.pageId !== 'p2')).toBe(true)
  })
})
