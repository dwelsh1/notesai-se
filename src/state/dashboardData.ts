import { useMemo } from 'react'
import { usePages } from './pagesContext'
import { useTabs } from './tabsContext'
import type { Page } from '../storage/storage'

type DashboardStats = {
  totalPages: number
  favorites: number
  trashed: number
  openTabs: number
}

type DashboardData = {
  recent: Page[]
  favorites: Page[]
  stats: DashboardStats
}

export function useDashboardData(): DashboardData {
  const { pages } = usePages()
  const { tabs } = useTabs()

  return useMemo(() => {
    const activePages = pages.filter((page) => !page.trashed)
    const favorites = activePages.filter((page) => page.favorited)
    const recent = [...activePages]
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
      .slice(0, 5)

    return {
      recent,
      favorites,
      stats: {
        totalPages: pages.length,
        favorites: favorites.length,
        trashed: pages.filter((page) => page.trashed).length,
        openTabs: tabs.length,
      },
    }
  }, [pages, tabs])
}
