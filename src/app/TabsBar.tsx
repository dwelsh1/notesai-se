import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Home, Moon, Settings, Pin, FileText, X, PanelLeft } from 'lucide-react'
import { usePages } from '../state/pagesContext'
import { useTabs } from '../state/tabsContext'
import { useTheme } from '../state/themeContext'
import { useSidebar } from '../state/sidebarContext'

type PageGroup = {
  label: string
  pages: Array<{ id: string; title: string }>
}

const DAY_MS = 24 * 60 * 60 * 1000

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

function groupPagesByRecency(pages: Array<{ id: string; title: string; createdAt: string }>) {
  const today = startOfDay(new Date())
  const yesterday = new Date(today.getTime() - DAY_MS)
  const weekAgo = new Date(today.getTime() - 7 * DAY_MS)

  const groups: PageGroup[] = [
    { label: 'Today', pages: [] },
    { label: 'Yesterday', pages: [] },
    { label: 'Past Week', pages: [] },
  ]

  for (const page of pages) {
    const createdAt = new Date(page.createdAt)
    if (createdAt >= today) {
      groups[0].pages.push(page)
    } else if (createdAt >= yesterday && createdAt < today) {
      groups[1].pages.push(page)
    } else if (createdAt >= weekAgo && createdAt < yesterday) {
      groups[2].pages.push(page)
    }
  }

  return groups.filter((group) => group.pages.length > 0)
}

export function TabsBar() {
  const { tabs, activeTabId, setActiveTab, closeTab, togglePin, openTab } = useTabs()
  const { pages, createPage } = usePages()
  const { toggleTheme } = useTheme()
  // Use sidebar context if available, otherwise default to not collapsed
  let collapsed = false
  let toggleSidebar = () => {}
  try {
    const sidebar = useSidebar()
    collapsed = sidebar.collapsed
    toggleSidebar = sidebar.toggleSidebar
  } catch {
    // SidebarProvider not available (e.g., in tests)
  }
  const navigate = useNavigate()
  const [isPickerOpen, setIsPickerOpen] = useState(false)
  const [query, setQuery] = useState('')
  const tabsRef = useRef<HTMLDivElement | null>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)

  const tabEntries = useMemo(() => {
    const orderedTabs = [...tabs].sort((a, b) => {
      if (a.pinned !== b.pinned) {
        return a.pinned ? -1 : 1
      }
      return a.order - b.order
    })
    return orderedTabs
      .map((tab) => {
        const page = pages.find((item) => item.id === tab.pageId)
        // Filter out tabs for trashed pages
        if (!page || page.trashed) {
          return null
        }
        return {
          tab,
          title: page.title ?? 'Untitled',
          favorited: page.favorited ?? false,
        }
      })
      .filter(
        (entry): entry is { tab: (typeof tabs)[0]; title: string; favorited: boolean } =>
          entry !== null,
      )
  }, [pages, tabs])

  const availablePages = useMemo(
    () =>
      pages
        .filter((page) => !page.trashed)
        .map((page) => ({ id: page.id, title: page.title, createdAt: page.createdAt })),
    [pages],
  )

  const filteredPages = useMemo(() => {
    const trimmed = query.trim().toLowerCase()
    if (!trimmed) {
      return availablePages
    }
    return availablePages.filter((page) => page.title.toLowerCase().includes(trimmed))
  }, [availablePages, query])

  const groupedPages = useMemo(() => groupPagesByRecency(filteredPages), [filteredPages])

  const handleActivate = (tabId: string, pageId: string) => {
    setActiveTab(tabId)
    navigate(`/page/${pageId}`)
  }

  const handleOpenPage = (pageId: string) => {
    openTab(pageId)
    navigate(`/page/${pageId}`)
    setIsPickerOpen(false)
  }

  const handleCreatePage = async () => {
    const page = await createPage()
    openTab(page.id)
    navigate(`/page/${page.id}`)
    setIsPickerOpen(false)
  }

  useEffect(() => {
    if (!isPickerOpen) {
      return
    }
    const handler = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsPickerOpen(false)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [isPickerOpen])

  useEffect(() => {
    const updateScrollState = () => {
      const node = tabsRef.current
      if (!node) return
      setCanScrollLeft(node.scrollLeft > 0)
      setCanScrollRight(node.scrollLeft + node.clientWidth < node.scrollWidth)
    }

    updateScrollState()
    const node = tabsRef.current
    if (!node) return
    node.addEventListener('scroll', updateScrollState)
    window.addEventListener('resize', updateScrollState)
    return () => {
      node.removeEventListener('scroll', updateScrollState)
      window.removeEventListener('resize', updateScrollState)
    }
  }, [tabEntries.length])

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (!event.ctrlKey || event.key.toLowerCase() !== 'tab') {
        return
      }
      if (tabEntries.length === 0) {
        return
      }
      event.preventDefault()
      const currentIndex = tabEntries.findIndex((entry) => entry.tab.id === activeTabId)
      const delta = event.shiftKey ? -1 : 1
      const nextIndex =
        currentIndex === -1 ? 0 : (currentIndex + delta + tabEntries.length) % tabEntries.length
      const nextTab = tabEntries[nextIndex].tab
      handleActivate(nextTab.id, nextTab.pageId)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [activeTabId, handleActivate, tabEntries])

  const scrollTabs = (direction: 'left' | 'right') => {
    const node = tabsRef.current
    if (!node) return
    const delta = direction === 'left' ? -200 : 200
    node.scrollBy({ left: delta, behavior: 'smooth' })
  }

  return (
    <div className="tabs-bar" data-testid="tabs-bar">
      <div className="tabs-bar__controls">
        <button
          type="button"
          className="tabs-bar__nav"
          aria-label="Back"
          title="Back"
          onClick={() => navigate(-1)}
        >
          ‹
        </button>
        <button
          type="button"
          className="tabs-bar__nav"
          aria-label="Forward"
          title="Forward"
          onClick={() => navigate(1)}
        >
          ›
        </button>
      </div>
      <div className="tabs-bar__scroll">
        <button
          type="button"
          className="tabs-bar__nav"
          aria-label="Scroll tabs left"
          title="Scroll tabs left"
          disabled={!canScrollLeft}
          onClick={() => scrollTabs('left')}
        >
          ‹
        </button>
        <div className="tabs-bar__tabs" ref={tabsRef}>
          {tabEntries.length === 0 ? (
            <span className="tabs-bar__empty" data-testid="tabs-empty">
              No open tabs
            </span>
          ) : (
            tabEntries.map(({ tab, title }) => (
              <div
                key={tab.id}
                className={`tabs-bar__tab${activeTabId === tab.id ? ' tabs-bar__tab--active' : ''}`}
                data-testid={`tab-${tab.id}`}
              >
                <button
                  type="button"
                  className="tabs-bar__label"
                  title={`Open ${title}`}
                  onClick={() => handleActivate(tab.id, tab.pageId)}
                >
                  {title}
                </button>
                <button
                  type="button"
                  className={`tabs-bar__action tabs-bar__pin${tab.pinned ? ' tabs-bar__pin--active' : ''}`}
                  aria-label="Pin tab"
                  title={tab.pinned ? 'Unpin tab' : 'Pin tab'}
                  data-testid={`tab-pin-${tab.id}`}
                  onClick={() => togglePin(tab.id)}
                >
                  <Pin size={16} />
                </button>
                <button
                  type="button"
                  className="tabs-bar__action"
                  aria-label="Close tab"
                  title="Close tab"
                  data-testid={`tab-close-${tab.id}`}
                  onClick={() => closeTab(tab.id)}
                >
                  <X size={16} />
                </button>
              </div>
            ))
          )}
        </div>
        <button
          type="button"
          className="tabs-bar__nav"
          aria-label="Scroll tabs right"
          title="Scroll tabs right"
          disabled={!canScrollRight}
          onClick={() => scrollTabs('right')}
        >
          ›
        </button>
      </div>
      <button
        type="button"
        className="tabs-bar__icon"
        aria-label="Open tab picker"
        title="Open tab picker"
        data-testid="tabs-add"
        onClick={() => setIsPickerOpen(true)}
      >
        <FileText size={18} />
      </button>
      {collapsed && (
        <button
          type="button"
          className="tabs-bar__icon"
          aria-label="Show sidebar"
          title="Show sidebar (Ctrl+B)"
          data-testid="sidebar-toggle-tabs"
          onClick={toggleSidebar}
        >
          <PanelLeft size={18} />
        </button>
      )}
      <button
        type="button"
        className="tabs-bar__icon"
        aria-label="Go to dashboard"
        title="Go to dashboard"
        data-testid="nav-home"
        onClick={() => navigate('/')}
      >
        <Home size={18} />
      </button>
      <button
        type="button"
        className="tabs-bar__icon"
        aria-label="Go to settings"
        title="Go to settings"
        data-testid="nav-settings"
        onClick={() => navigate('/settings')}
      >
        <Settings size={18} />
      </button>
      <button
        type="button"
        className="tabs-bar__icon"
        aria-label="Toggle theme"
        title="Toggle theme"
        data-testid="theme-toggle"
        onClick={toggleTheme}
      >
        <Moon size={18} />
      </button>
      {isPickerOpen && (
        <div className="tabs-picker" data-testid="tabs-picker">
          <div className="tabs-picker__backdrop" onClick={() => setIsPickerOpen(false)} />
          <div className="tabs-picker__modal" role="dialog" aria-modal="true">
            <div className="tabs-picker__header">
              <span className="tabs-picker__icon">🔍</span>
              <input
                type="text"
                placeholder="Search pages..."
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                autoFocus
              />
            </div>
            <button type="button" className="tabs-picker__create" onClick={handleCreatePage}>
              + Create a new page
            </button>
            <div className="tabs-picker__list">
              {groupedPages.length === 0 ? (
                <p className="tabs-picker__empty">No pages found.</p>
              ) : (
                groupedPages.map((group) => (
                  <div key={group.label} className="tabs-picker__group">
                    <div className="tabs-picker__label">{group.label}</div>
                    <ul>
                      {group.pages.map((page) => (
                        <li key={page.id}>
                          <button
                            type="button"
                            title={`Open ${page.title}`}
                            onClick={() => handleOpenPage(page.id)}
                          >
                            {page.title}
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
