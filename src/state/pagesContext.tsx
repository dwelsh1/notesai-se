import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { Page } from '../storage/storage'
import { createSqliteStorage } from '../storage/sqliteStorage'
import {
  generatePageEmbedding,
  updatePageEmbedding,
} from '../services/embeddingService'

type PagesContextValue = {
  pages: Page[]
  createPage: (title?: string, parentId?: string | null) => Promise<Page>
  addPages: (pages: Page[]) => void
  updatePageContent: (id: string, contentMarkdown: string) => Promise<void>
  renamePage: (id: string, title: string) => Promise<void>
  toggleFavorite: (id: string) => Promise<void>
  trashPage: (id: string) => Promise<void>
  restorePage: (id: string) => Promise<void>
  deletePage: (id: string) => Promise<void>
  duplicatePage: (id: string) => Promise<Page | null>
  updatePageParent: (id: string, parentId: string | null) => Promise<void>
  updatePageOrder: (id: string, order: number) => Promise<void>
  updateFavoriteOrder: (id: string, newOrder: number) => Promise<void>
}

const PagesContext = createContext<PagesContextValue | null>(null)

function createId() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  return `page-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

export function PagesProvider({
  children,
  initialPages = [],
}: {
  children: React.ReactNode
  initialPages?: Page[]
}) {
  const [pages, setPages] = useState<Page[]>(initialPages)
  const [storage, setStorage] = useState<ReturnType<typeof createSqliteStorage> | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Initialize storage and load pages
  useEffect(() => {
    let mounted = true
    let cancelled = false

    async function init() {
      // If initialPages are provided (e.g., in tests), skip SQLite initialization
      if (initialPages.length > 0) {
        setPages(initialPages)
        setIsLoading(false)
        return
      }

      try {
        console.log('[DB] Loading pages from local database...')
        const sqliteStorage = createSqliteStorage()
        if (cancelled || !mounted) return
        setStorage(sqliteStorage)
        const loadedPages = await sqliteStorage.listPages()
        if (mounted && !cancelled) {
          console.log(`[DB] Loaded ${loadedPages.length} pages from local database`)
          setPages(loadedPages)
          setIsLoading(false)
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        console.error('[DB] Failed to load pages:', message)
        // Fallback to memory storage if SQLite is not available (e.g., in browser tests)
        if (mounted && !cancelled) {
          setPages([])
          setIsLoading(false)
        }
      }
    }
    init()
    return () => {
      mounted = false
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Only run once on mount

  const createPage = useCallback(
    async (title?: string, parentId?: string | null) => {
      const now = new Date().toISOString()
      // Calculate order: if parentId is provided, find max order among siblings; otherwise use pages.length
      let order = pages.length
      if (parentId !== undefined && parentId !== null) {
        const siblings = pages.filter((p) => p.parentId === parentId && !p.trashed)
        order = siblings.length > 0 ? Math.max(...siblings.map((p) => p.order)) + 1 : 0
      } else {
        const rootPages = pages.filter((p) => !p.parentId && !p.trashed)
        order = rootPages.length > 0 ? Math.max(...rootPages.map((p) => p.order)) + 1 : 0
      }
      const page: Page = {
        id: createId(),
        title: title?.trim() || 'Untitled',
        parentId: parentId ?? null,
        order,
        contentMarkdown: '',
        updatedAt: now,
        createdAt: now,
        trashed: false,
        favorited: false,
        favoriteOrder: null,
      }
      setPages((prev) => [...prev, page])
      if (storage) {
        await storage.upsertPage(page)
      }
      // Generate embedding in background (non-blocking)
      generatePageEmbedding(page.id, page.title, page.contentMarkdown).catch((err) =>
        console.warn('Embedding generation failed for new page:', err),
      )
      return page
    },
    [pages, storage],
  )

  const addPages = useCallback((incomingPages: Page[]) => {
    if (incomingPages.length === 0) {
      return
    }

    setPages((prev) => {
      const next = [...prev]
      const existingIds = new Set(prev.map((page) => page.id))
      for (const page of incomingPages) {
        if (!existingIds.has(page.id)) {
          next.push({ ...page, order: next.length })
        }
      }
      return next
    })
  }, [])

  const updatePageContent = useCallback(
    async (id: string, contentMarkdown: string) => {
      const now = new Date().toISOString()
      const holder: { updated: Page | null } = { updated: null }
      setPages((prev) =>
        prev.map((page) => {
          if (page.id === id) {
            holder.updated = { ...page, contentMarkdown, updatedAt: now }
            return holder.updated
          }
          return page
        }),
      )
      const updatedPage = holder.updated
      if (storage && updatedPage) {
        await storage.upsertPage(updatedPage)
      }
      if (updatedPage) {
        updatePageEmbedding(updatedPage.id, updatedPage.title, updatedPage.contentMarkdown).catch(
          (err) => console.warn('Embedding update failed:', err),
        )
      }
    },
    [storage],
  )

  const renamePage = useCallback(
    async (id: string, title: string) => {
      const nextTitle = title.trim() || 'Untitled'
      const now = new Date().toISOString()
      const holder: { updated: Page | null } = { updated: null }
      setPages((prev) =>
        prev.map((page) => {
          if (page.id === id) {
            holder.updated = { ...page, title: nextTitle, updatedAt: now }
            return holder.updated
          }
          return page
        }),
      )
      const updatedPage = holder.updated
      if (storage && updatedPage) {
        await storage.upsertPage(updatedPage)
      }
      if (updatedPage) {
        updatePageEmbedding(updatedPage.id, updatedPage.title, updatedPage.contentMarkdown).catch(
          (err) => console.warn('Embedding update failed:', err),
        )
      }
    },
    [storage],
  )

  const toggleFavorite = useCallback(
    async (id: string) => {
      const now = new Date().toISOString()
      let updatedPage: Page | null = null
      setPages((prev) => {
        const page = prev.find((p) => p.id === id)
        const isFavoriting = !page?.favorited
        // If favoriting, set favoriteOrder to the end of favorites list
        const favoritedPages = prev.filter((p) => p.favorited && p.favoriteOrder !== null)
        const maxFavoriteOrder =
          favoritedPages.length > 0
            ? Math.max(...favoritedPages.map((p) => p.favoriteOrder ?? -1))
            : -1
        return prev.map((p) => {
          if (p.id === id) {
            updatedPage = {
              ...p,
              favorited: !p.favorited,
              favoriteOrder: isFavoriting ? maxFavoriteOrder + 1 : null,
              updatedAt: now,
            }
            return updatedPage
          }
          return p
        })
      })
      if (storage && updatedPage) {
        await storage.upsertPage(updatedPage)
      }
    },
    [pages, storage],
  )

  const trashPage = useCallback(
    async (id: string) => {
      const now = new Date().toISOString()
      let updatedPage: Page | null = null
      setPages((prev) =>
        prev.map((page) => {
          if (page.id === id) {
            updatedPage = { ...page, trashed: true, updatedAt: now }
            return updatedPage
          }
          return page
        }),
      )
      if (storage && updatedPage) {
        await storage.upsertPage(updatedPage)
      }
    },
    [storage],
  )

  const restorePage = useCallback(
    async (id: string) => {
      const now = new Date().toISOString()
      let updatedPage: Page | null = null
      setPages((prev) =>
        prev.map((page) => {
          if (page.id === id) {
            updatedPage = { ...page, trashed: false, updatedAt: now }
            return updatedPage
          }
          return page
        }),
      )
      if (storage && updatedPage) {
        await storage.upsertPage(updatedPage)
      }
    },
    [storage],
  )

  const duplicatePage = useCallback(
    async (id: string): Promise<Page | null> => {
      const page = pages.find((p) => p.id === id)
      if (!page || page.trashed) return null
      const siblings = pages.filter(
        (p) => p.parentId === page.parentId && !p.trashed && p.id !== id,
      )
      const maxOrder =
        siblings.length > 0 ? Math.max(...siblings.map((p) => p.order)) : -1
      const now = new Date().toISOString()
      const newPage: Page = {
        ...page,
        id: createId(),
        title: `${page.title.trim()} (copy)`,
        order: maxOrder + 1,
        createdAt: now,
        updatedAt: now,
        trashed: false,
        favorited: false,
        favoriteOrder: null,
      }
      setPages((prev) => [...prev, newPage])
      if (storage) {
        await storage.upsertPage(newPage)
      }
      generatePageEmbedding(newPage.id, newPage.title, newPage.contentMarkdown).catch((err) =>
        console.warn('Embedding generation failed for duplicated page:', err),
      )
      return newPage
    },
    [pages, storage],
  )

  const deletePage = useCallback(
    async (id: string) => {
      setPages((prev) => prev.filter((page) => page.id !== id))
      if (storage) {
        await storage.deletePage(id)
      }
    },
    [storage],
  )

  const updatePageParent = useCallback(
    async (id: string, parentId: string | null) => {
      const now = new Date().toISOString()
      // Prevent circular references: ensure the new parent is not a descendant of this page
      if (parentId !== null) {
        const checkCircular = (pageId: string, targetParentId: string): boolean => {
          if (pageId === targetParentId) return true
          const page = pages.find((p) => p.id === pageId)
          if (!page || !page.parentId) return false
          return checkCircular(page.parentId, targetParentId)
        }
        if (checkCircular(parentId, id)) {
          console.error('Cannot set parent: would create circular reference')
          return
        }
      }

      // Calculate new order based on siblings
      const siblings = pages.filter((p) => p.parentId === parentId && p.id !== id && !p.trashed)
      const newOrder = siblings.length > 0 ? Math.max(...siblings.map((p) => p.order)) + 1 : 0

      let updatedPage: Page | null = null
      setPages((prev) =>
        prev.map((page) => {
          if (page.id === id) {
            updatedPage = { ...page, parentId, order: newOrder, updatedAt: now }
            return updatedPage
          }
          return page
        }),
      )
      if (storage && updatedPage) {
        await storage.upsertPage(updatedPage)
      }
    },
    [pages, storage],
  )

  const updatePageOrder = useCallback(
    async (id: string, order: number) => {
      const now = new Date().toISOString()
      let updatedPage: Page | null = null
      setPages((prev) =>
        prev.map((page) => {
          if (page.id === id) {
            updatedPage = { ...page, order, updatedAt: now }
            return updatedPage
          }
          return page
        }),
      )
      if (storage && updatedPage) {
        await storage.upsertPage(updatedPage)
      }
    },
    [storage],
  )

  const updateFavoriteOrder = useCallback(
    async (id: string, newOrder: number) => {
      const now = new Date().toISOString()
      let updatedPage: Page | null = null
      setPages((prev) => {
        const pageToMove = prev.find((p) => p.id === id)
        if (!pageToMove || !pageToMove.favorited) return prev

        return prev.map((page) => {
          if (page.id === id) {
            updatedPage = { ...page, favoriteOrder: newOrder, updatedAt: now }
            return updatedPage
          }
          return page
        })
      })
      if (storage && updatedPage) {
        await storage.upsertPage(updatedPage)
      }
    },
    [storage],
  )

  const value = useMemo(
    () => ({
      pages,
      createPage,
      addPages,
      updatePageContent,
      renamePage,
      toggleFavorite,
      trashPage,
      restorePage,
      deletePage,
      duplicatePage,
      updatePageParent,
      updatePageOrder,
      updateFavoriteOrder,
    }),
    [
      pages,
      createPage,
      addPages,
      updatePageContent,
      renamePage,
      toggleFavorite,
      trashPage,
      restorePage,
      deletePage,
      duplicatePage,
      updatePageParent,
      updatePageOrder,
      updateFavoriteOrder,
    ],
  )

  if (isLoading) {
    return <div>Loading...</div>
  }

  return <PagesContext.Provider value={value}>{children}</PagesContext.Provider>
}

export function usePages() {
  const context = useContext(PagesContext)
  if (!context) {
    throw new Error('usePages must be used within PagesProvider')
  }
  return context
}
