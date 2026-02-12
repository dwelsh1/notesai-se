import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { Page } from '../storage/storage'

vi.mock('./semanticSearchService', () => ({ searchPages: vi.fn() }))

import { searchPages } from './semanticSearchService'
import { getRAGContext } from './ragService'

const mockSearchPages = vi.mocked(searchPages)

function makePage(overrides: Partial<Page> = {}): Page {
  return {
    id: 'p1',
    title: 'Test Page',
    contentMarkdown: '<p>Some content for context.</p>',
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

beforeEach(() => {
  vi.clearAllMocks()
})

describe('getRAGContext', () => {
  it('returns empty when query is empty', async () => {
    const result = await getRAGContext('', [makePage()])
    expect(result.contextText).toBe('')
    expect(result.sources).toEqual([])
    expect(mockSearchPages).not.toHaveBeenCalled()
  })

  it('returns empty when pages array is empty', async () => {
    const result = await getRAGContext('hello', [])
    expect(result.contextText).toBe('')
    expect(result.sources).toEqual([])
    expect(mockSearchPages).not.toHaveBeenCalled()
  })

  it('returns empty when searchPages throws', async () => {
    mockSearchPages.mockRejectedValueOnce(new Error('No embeddings'))
    const result = await getRAGContext('hello', [makePage()])
    expect(result.contextText).toBe('')
    expect(result.sources).toEqual([])
  })

  it('returns context and sources when search returns hits', async () => {
    const page = makePage({ id: 'p1', title: 'My Note', contentMarkdown: 'Body text here.' })
    mockSearchPages.mockResolvedValueOnce([
      { pageId: 'p1', title: 'My Note', subtitle: '', similarity: 0.9, preview: 'Body text...' },
    ])
    const result = await getRAGContext('test query', [page], 5)
    expect(mockSearchPages).toHaveBeenCalledWith('test query', [page], 5)
    expect(result.sources).toHaveLength(1)
    expect(result.sources[0]).toMatchObject({ pageId: 'p1', title: 'My Note', similarity: 0.9 })
    expect(result.contextText).toContain('Relevant notes')
    expect(result.contextText).toContain('[My Note]')
    expect(result.contextText).toContain('Body text here')
  })

  it('includes manual pages and uploaded files in context', async () => {
    const page = makePage({ id: 'p2', title: 'Manual Page', contentMarkdown: 'Manual content.' })
    const result = await getRAGContext('query', [page], 10, {
      manualPageIds: ['p2'],
      uploadedFiles: [{ name: 'readme.txt', content: 'File content here.' }],
    })
    expect(result.contextText).toContain('[Manual Page]')
    expect(result.contextText).toContain('Manual content')
    expect(result.contextText).toContain('[Uploaded: readme.txt]')
    expect(result.contextText).toContain('File content here')
    expect(result.sources).toHaveLength(1)
    expect(result.sources[0]).toMatchObject({ pageId: 'p2', title: 'Manual Page' })
  })
})
