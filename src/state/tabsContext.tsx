import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'

export type Tab = {
  id: string
  pageId: string
  pinned: boolean
  lastActiveAt: string
  order: number
}

type TabsState = {
  tabs: Tab[]
  activeTabId: string | null
}

type TabsContextValue = TabsState & {
  openTab: (pageId: string) => Tab
  closeTab: (tabId: string) => void
  togglePin: (tabId: string) => void
  reorderTab: (tabId: string, toIndex: number) => void
  setActiveTab: (tabId: string) => void
}

const TabsContext = createContext<TabsContextValue | null>(null)
const DEFAULT_STORAGE_KEY = 'notesai.tabs'

function canUseStorage() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'
}

function createId() {
  return `tab-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

function normalizeTabs(tabs: Tab[]) {
  return tabs.map((tab, index) => ({ ...tab, order: index }))
}

function loadTabsState(storageKey: string): TabsState | null {
  if (!canUseStorage()) {
    return null
  }

  try {
    const raw = window.localStorage.getItem(storageKey)
    if (!raw) {
      return null
    }
    const parsed = JSON.parse(raw) as TabsState
    if (!Array.isArray(parsed.tabs)) {
      return null
    }

    const normalizedTabs = normalizeTabs(parsed.tabs)
    const activeTabId = normalizedTabs.some((tab) => tab.id === parsed.activeTabId)
      ? parsed.activeTabId
      : normalizedTabs[0]?.id ?? null

    return { tabs: normalizedTabs, activeTabId }
  } catch {
    return null
  }
}

export function TabsProvider({
  children,
  initialTabs,
  initialActiveId,
  storageKey = DEFAULT_STORAGE_KEY,
  persist = true,
}: {
  children: React.ReactNode
  initialTabs?: Tab[]
  initialActiveId?: string | null
  storageKey?: string
  persist?: boolean
}) {
  const storedState = persist ? loadTabsState(storageKey) : null
  const [tabs, setTabs] = useState<Tab[]>(() => {
    if (initialTabs) {
      return normalizeTabs(initialTabs)
    }
    if (storedState) {
      return storedState.tabs
    }
    return []
  })
  const [activeTabId, setActiveTabId] = useState<string | null>(() => {
    if (initialActiveId !== undefined) {
      return initialActiveId
    }
    if (storedState) {
      return storedState.activeTabId
    }
    return null
  })

  useEffect(() => {
    if (!persist || !canUseStorage()) {
      return
    }

    const payload: TabsState = { tabs, activeTabId }
    window.localStorage.setItem(storageKey, JSON.stringify(payload))
  }, [activeTabId, persist, storageKey, tabs])

  const openTab = useCallback((pageId: string) => {
    const now = new Date().toISOString()
    let createdTab: Tab | undefined

    setTabs((prev) => {
      const existing = prev.find((tab) => tab.pageId === pageId)
      if (existing) {
        createdTab = { ...existing, lastActiveAt: now }
        return normalizeTabs(
          prev.map((tab) => (tab.id === existing.id ? createdTab ?? tab : tab)),
        )
      }

      createdTab = {
        id: createId(),
        pageId,
        pinned: false,
        lastActiveAt: now,
        order: prev.length,
      }
      return normalizeTabs([...prev, createdTab])
    })

    setActiveTabId((prevActive) => {
      if (createdTab) {
        return createdTab.id
      }
      return prevActive
    })

    return createdTab ?? {
      id: createId(),
      pageId,
      pinned: false,
      lastActiveAt: now,
      order: tabs.length,
    }
  }, [tabs.length])

  const closeTab = useCallback((tabId: string) => {
    setTabs((prev) => {
      const index = prev.findIndex((tab) => tab.id === tabId)
      if (index === -1) {
        return prev
      }

      const nextTabs = prev.filter((tab) => tab.id !== tabId)
      setActiveTabId((current) => {
        if (current !== tabId) {
          return current
        }
        if (nextTabs.length === 0) {
          return null
        }
        const nextIndex = Math.min(index, nextTabs.length - 1)
        return nextTabs[nextIndex].id
      })

      return normalizeTabs(nextTabs)
    })
  }, [])

  const togglePin = useCallback((tabId: string) => {
    const now = new Date().toISOString()
    setTabs((prev) =>
      normalizeTabs(
        prev.map((tab) =>
          tab.id === tabId ? { ...tab, pinned: !tab.pinned, lastActiveAt: now } : tab,
        ),
      ),
    )
  }, [])

  const reorderTab = useCallback((tabId: string, toIndex: number) => {
    setTabs((prev) => {
      const currentIndex = prev.findIndex((tab) => tab.id === tabId)
      if (currentIndex === -1) {
        return prev
      }

      const nextIndex = Math.max(0, Math.min(toIndex, prev.length - 1))
      const nextTabs = [...prev]
      const [moved] = nextTabs.splice(currentIndex, 1)
      nextTabs.splice(nextIndex, 0, moved)
      return normalizeTabs(nextTabs)
    })
  }, [])

  const setActiveTab = useCallback((tabId: string) => {
    const now = new Date().toISOString()
    setTabs((prev) =>
      normalizeTabs(
        prev.map((tab) =>
          tab.id === tabId ? { ...tab, lastActiveAt: now } : tab,
        ),
      ),
    )
    setActiveTabId(tabId)
  }, [])

  const value = useMemo(
    () => ({
      tabs,
      activeTabId,
      openTab,
      closeTab,
      togglePin,
      reorderTab,
      setActiveTab,
    }),
    [activeTabId, closeTab, openTab, reorderTab, setActiveTab, tabs, togglePin],
  )

  return <TabsContext.Provider value={value}>{children}</TabsContext.Provider>
}

export function useTabs() {
  const context = useContext(TabsContext)
  if (!context) {
    throw new Error('useTabs must be used within TabsProvider')
  }
  return context
}
