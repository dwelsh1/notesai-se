import { describe, it, expect } from 'vitest'
import { createMemoryStorage } from './memoryStorage'
import type { Page } from './storage'

const page: Page = {
  id: 'p1',
  title: 'Test',
  contentMarkdown: '# Test',
  updatedAt: '2026-02-07T00:00:00.000Z',
  createdAt: '2026-02-07T00:00:00.000Z',
  trashed: false,
  favorited: false,
  parentId: null,
  order: 0,
}

describe('memoryStorage', () => {
  it('stores and retrieves pages', async () => {
    const store = createMemoryStorage()
    await store.upsertPage(page)
    const loaded = await store.getPage('p1')
    expect(loaded?.title).toBe('Test')
  })

  it('deletes pages', async () => {
    const store = createMemoryStorage([page])
    await store.deletePage('p1')
    const loaded = await store.getPage('p1')
    expect(loaded).toBeNull()
  })
})
