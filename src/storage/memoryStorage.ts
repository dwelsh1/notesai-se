import { StorageAdapter, Page } from './storage'

export function createMemoryStorage(seed: Page[] = []): StorageAdapter {
  const pages = new Map(seed.map((page) => [page.id, page]))
  return {
    listPages: async () => [...pages.values()],
    getPage: async (id) => pages.get(id) ?? null,
    upsertPage: async (page) => {
      pages.set(page.id, page)
    },
    deletePage: async (id) => {
      pages.delete(id)
    },
  }
}
