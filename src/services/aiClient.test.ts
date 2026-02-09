import { describe, it, expect, vi } from 'vitest'
import { createLmStudioClient } from './aiClient'

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
