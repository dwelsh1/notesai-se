import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { semanticSearch } from './semanticSearch'
import type { Page } from '../storage/storage'

describe('semanticSearch', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('returns empty array for empty query', async () => {
    const pages: Page[] = [
      {
        id: 'p1',
        title: 'Test Page',
        contentMarkdown: 'Some content',
        updatedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        trashed: false,
        favorited: false,
        parentId: null,
        order: 0,
      },
    ]

    const result = await semanticSearch({
      query: '',
      pages,
      aiConfig: {
        baseUrl: 'http://localhost:1234/v1',
        model: 'test-model',
      },
    })

    expect(result).toEqual([])
  })

  it('returns empty array for no pages', async () => {
    const result = await semanticSearch({
      query: 'test',
      pages: [],
      aiConfig: {
        baseUrl: 'http://localhost:1234/v1',
        model: 'test-model',
      },
    })

    expect(result).toEqual([])
  })

  it('calls AI with correct prompt and parses results', async () => {
    const pages: Page[] = [
      {
        id: 'p1',
        title: 'Project Alpha',
        contentMarkdown: 'This is about project management',
        updatedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        trashed: false,
        favorited: false,
        parentId: null,
        order: 0,
      },
      {
        id: 'p2',
        title: 'Meeting Notes',
        contentMarkdown: 'Discussed quarterly goals',
        updatedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        trashed: false,
        favorited: false,
        parentId: null,
        order: 1,
      },
    ]

    const mockResponse = {
      choices: [
        {
          message: {
            content: JSON.stringify([
              {
                pageId: 'p1',
                relevanceScore: 0.9,
                reason: 'Highly relevant to project management',
              },
              {
                pageId: 'p2',
                relevanceScore: 0.6,
                reason: 'Somewhat relevant',
              },
            ]),
          },
        },
      ],
    }

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockResponse,
    })
    vi.stubGlobal('fetch', fetchMock)

    const result = await semanticSearch({
      query: 'project management',
      pages,
      aiConfig: {
        baseUrl: 'http://localhost:1234/v1',
        model: 'test-model',
        temperature: 0.2,
      },
    })

    expect(fetchMock).toHaveBeenCalledOnce()
    const callArgs = fetchMock.mock.calls[0]
    expect(callArgs[0]).toBe('http://localhost:1234/v1/chat/completions')
    expect(callArgs[1].method).toBe('POST')
    expect(callArgs[1].headers['Content-Type']).toBe('application/json')

    const body = JSON.parse(callArgs[1].body)
    expect(body.model).toBe('test-model')
    expect(body.temperature).toBe(0.2)
    expect(body.messages[0].role).toBe('system')
    expect(body.messages[1].role).toBe('user')
    expect(body.messages[1].content).toContain('project management')
    expect(body.messages[1].content).toContain('Project Alpha')
    expect(body.messages[1].content).toContain('Meeting Notes')

    expect(result).toHaveLength(2)
    expect(result[0].pageId).toBe('p1')
    expect(result[0].relevanceScore).toBe(0.9)
    expect(result[1].pageId).toBe('p2')
    expect(result[1].relevanceScore).toBe(0.6)
  })

  it('filters out low relevance scores', async () => {
    const pages: Page[] = [
      {
        id: 'p1',
        title: 'Test Page',
        contentMarkdown: 'Some content',
        updatedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        trashed: false,
        favorited: false,
        parentId: null,
        order: 0,
      },
    ]

    const mockResponse = {
      choices: [
        {
          message: {
            content: JSON.stringify([
              {
                pageId: 'p1',
                relevanceScore: 0.9,
                reason: 'Highly relevant',
              },
              {
                pageId: 'p2',
                relevanceScore: 0.2, // Below threshold
                reason: 'Not relevant',
              },
            ]),
          },
        },
      ],
    }

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockResponse,
    })
    vi.stubGlobal('fetch', fetchMock)

    const result = await semanticSearch({
      query: 'test',
      pages,
      aiConfig: {
        baseUrl: 'http://localhost:1234/v1',
        model: 'test-model',
      },
    })

    expect(result).toHaveLength(1)
    expect(result[0].pageId).toBe('p1')
  })

  it('sorts results by relevance score descending', async () => {
    const pages: Page[] = [
      {
        id: 'p1',
        title: 'Page 1',
        contentMarkdown: 'Content 1',
        updatedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        trashed: false,
        favorited: false,
        parentId: null,
        order: 0,
      },
      {
        id: 'p2',
        title: 'Page 2',
        contentMarkdown: 'Content 2',
        updatedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        trashed: false,
        favorited: false,
        parentId: null,
        order: 1,
      },
    ]

    const mockResponse = {
      choices: [
        {
          message: {
            content: JSON.stringify([
              {
                pageId: 'p2',
                relevanceScore: 0.8,
                reason: 'Relevant',
              },
              {
                pageId: 'p1',
                relevanceScore: 0.9,
                reason: 'More relevant',
              },
            ]),
          },
        },
      ],
    }

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockResponse,
    })
    vi.stubGlobal('fetch', fetchMock)

    const result = await semanticSearch({
      query: 'test',
      pages,
      aiConfig: {
        baseUrl: 'http://localhost:1234/v1',
        model: 'test-model',
      },
    })

    expect(result[0].pageId).toBe('p1')
    expect(result[0].relevanceScore).toBe(0.9)
    expect(result[1].pageId).toBe('p2')
    expect(result[1].relevanceScore).toBe(0.8)
  })

  it('respects maxResults limit', async () => {
    const pages: Page[] = Array.from({ length: 20 }, (_, i) => ({
      id: `p${i}`,
      title: `Page ${i}`,
      contentMarkdown: `Content ${i}`,
      updatedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      trashed: false,
      favorited: false,
      parentId: null,
      order: i,
    }))

    const mockResults = pages.map((p, i) => ({
      pageId: p.id,
      relevanceScore: 0.9 - i * 0.01,
      reason: 'Relevant',
    }))

    const mockResponse = {
      choices: [
        {
          message: {
            content: JSON.stringify(mockResults),
          },
        },
      ],
    }

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockResponse,
    })
    vi.stubGlobal('fetch', fetchMock)

    const result = await semanticSearch({
      query: 'test',
      pages,
      aiConfig: {
        baseUrl: 'http://localhost:1234/v1',
        model: 'test-model',
      },
      maxResults: 5,
    })

    expect(result).toHaveLength(5)
  })

  it('handles JSON extraction from response with extra text', async () => {
    const pages: Page[] = [
      {
        id: 'p1',
        title: 'Test Page',
        contentMarkdown: 'Some content',
        updatedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        trashed: false,
        favorited: false,
        parentId: null,
        order: 0,
      },
    ]

    const mockResponse = {
      choices: [
        {
          message: {
            content: `Here are the relevant pages:\n\n${JSON.stringify([
              {
                pageId: 'p1',
                relevanceScore: 0.9,
                reason: 'Relevant',
              },
            ])}\n\nThese pages match your query.`,
          },
        },
      ],
    }

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockResponse,
    })
    vi.stubGlobal('fetch', fetchMock)

    const result = await semanticSearch({
      query: 'test',
      pages,
      aiConfig: {
        baseUrl: 'http://localhost:1234/v1',
        model: 'test-model',
      },
    })

    expect(result).toHaveLength(1)
    expect(result[0].pageId).toBe('p1')
  })

  it('returns empty array on parse error', async () => {
    const pages: Page[] = [
      {
        id: 'p1',
        title: 'Test Page',
        contentMarkdown: 'Some content',
        updatedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        trashed: false,
        favorited: false,
        parentId: null,
        order: 0,
      },
    ]

    const mockResponse = {
      choices: [
        {
          message: {
            content: 'This is not valid JSON',
          },
        },
      ],
    }

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockResponse,
    })
    vi.stubGlobal('fetch', fetchMock)

    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    const result = await semanticSearch({
      query: 'test',
      pages,
      aiConfig: {
        baseUrl: 'http://localhost:1234/v1',
        model: 'test-model',
      },
    })

    expect(result).toEqual([])
    expect(consoleErrorSpy).toHaveBeenCalled()

    consoleErrorSpy.mockRestore()
  })

  it('filters out trashed pages', async () => {
    const pages: Page[] = [
      {
        id: 'p1',
        title: 'Active Page',
        contentMarkdown: 'Some content',
        updatedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        trashed: false,
        favorited: false,
        parentId: null,
        order: 0,
      },
      {
        id: 'p2',
        title: 'Trashed Page',
        contentMarkdown: 'Some content',
        updatedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        trashed: true,
        favorited: false,
        parentId: null,
        order: 1,
      },
    ]

    const mockResponse = {
      choices: [
        {
          message: {
            content: JSON.stringify([
              {
                pageId: 'p1',
                relevanceScore: 0.9,
                reason: 'Relevant',
              },
              {
                pageId: 'p2',
                relevanceScore: 0.8,
                reason: 'Relevant but trashed',
              },
            ]),
          },
        },
      ],
    }

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockResponse,
    })
    vi.stubGlobal('fetch', fetchMock)

    const result = await semanticSearch({
      query: 'test',
      pages,
      aiConfig: {
        baseUrl: 'http://localhost:1234/v1',
        model: 'test-model',
      },
    })

    // Should only return p1 (p2 is trashed and filtered out in the prompt)
    expect(result).toHaveLength(1)
    expect(result[0].pageId).toBe('p1')
  })
})
