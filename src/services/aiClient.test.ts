import { describe, it, expect, vi, afterEach } from 'vitest'
import { createLmStudioClient, generateEmbedding } from './aiClient'

describe('createLmStudioClient', () => {
  it('posts chat payload and returns content', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: 'Hello from AI' } }],
      }),
    })
    vi.stubGlobal('fetch', fetchMock)

    const client = createLmStudioClient({ baseUrl: 'http://localhost:1234/v1' })
    const result = await client.completeChat({
      model: 'llama',
      messages: [{ role: 'user', content: 'Hi' }],
    })

    expect(fetchMock).toHaveBeenCalledOnce()
    expect(result.content).toBe('Hello from AI')

    vi.unstubAllGlobals()
  })

  it('throws on non-ok response', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({}),
    })
    vi.stubGlobal('fetch', fetchMock)

    const client = createLmStudioClient({ baseUrl: 'http://localhost:1234/v1' })

    await expect(
      client.completeChat({
        model: 'llama',
        messages: [{ role: 'user', content: 'Hi' }],
      }),
    ).rejects.toThrow('LM Studio error')

    vi.unstubAllGlobals()
  })
})

describe('generateEmbedding', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('posts to embeddings endpoint and returns embedding array', async () => {
    const embedding = [0.1, -0.2, 0.3]
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        data: [{ embedding }],
      }),
    })
    vi.stubGlobal('fetch', fetchMock)

    const result = await generateEmbedding(
      { baseUrl: 'http://localhost:1234/v1', model: 'embed-model' },
      'hello world',
    )

    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:1234/v1/embeddings',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ model: 'embed-model', input: 'hello world' }),
      }),
    )
    expect(result).toEqual(embedding)
  })

  it('throws on invalid response missing embedding array', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ data: [] }),
    })
    vi.stubGlobal('fetch', fetchMock)

    await expect(
      generateEmbedding(
        { baseUrl: 'http://localhost:1234/v1', model: 'm' },
        'text',
      ),
    ).rejects.toThrow('Invalid embeddings response')
  })
})
