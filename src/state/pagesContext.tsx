import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import type { Page } from '../storage/storage'

type PagesContextValue = {
  pages: Page[]
  createPage: (title?: string) => Page
  renamePage: (id: string, title: string) => void
  toggleFavorite: (id: string) => void
  trashPage: (id: string) => void
  restorePage: (id: string) => void
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

  const createPage = useCallback(
    (title?: string) => {
      const now = new Date().toISOString()
      const page: Page = {
        id: createId(),
        title: title?.trim() || 'Untitled',
        parentId: null,
        order: pages.length,
        contentMarkdown: '',
        updatedAt: now,
        createdAt: now,
        trashed: false,
        favorited: false,
      }
      setPages((prev) => [...prev, page])
      return page
    },
    [pages.length],
  )

  const renamePage = useCallback((id: string, title: string) => {
    const nextTitle = title.trim() || 'Untitled'
    const now = new Date().toISOString()
    setPages((prev) =>
      prev.map((page) =>
        page.id === id ? { ...page, title: nextTitle, updatedAt: now } : page,
      ),
    )
  }, [])

  const toggleFavorite = useCallback((id: string) => {
    const now = new Date().toISOString()
    setPages((prev) =>
      prev.map((page) =>
        page.id === id ? { ...page, favorited: !page.favorited, updatedAt: now } : page,
      ),
    )
  }, [])

  const trashPage = useCallback((id: string) => {
    const now = new Date().toISOString()
    setPages((prev) =>
      prev.map((page) => (page.id === id ? { ...page, trashed: true, updatedAt: now } : page)),
    )
  }, [])

  const restorePage = useCallback((id: string) => {
    const now = new Date().toISOString()
    setPages((prev) =>
      prev.map((page) =>
        page.id === id ? { ...page, trashed: false, updatedAt: now } : page,
      ),
    )
  }, [])

  const value = useMemo(
    () => ({ pages, createPage, renamePage, toggleFavorite, trashPage, restorePage }),
    [pages, createPage, renamePage, toggleFavorite, trashPage, restorePage],
  )

  return <PagesContext.Provider value={value}>{children}</PagesContext.Provider>
}

export function usePages() {
  const context = useContext(PagesContext)
  if (!context) {
    throw new Error('usePages must be used within PagesProvider')
  }
  return context
}
