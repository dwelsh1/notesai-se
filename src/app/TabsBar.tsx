import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { usePages } from '../state/pagesContext'
import { useTabs } from '../state/tabsContext'

export function TabsBar() {
  const { tabs, activeTabId, setActiveTab, closeTab, togglePin } = useTabs()
  const { pages } = usePages()
  const navigate = useNavigate()

  const tabEntries = useMemo(
    () =>
      tabs.map((tab) => ({
        tab,
        title: pages.find((page) => page.id === tab.pageId)?.title ?? 'Untitled',
      })),
    [pages, tabs],
  )

  const handleActivate = (tabId: string, pageId: string) => {
    setActiveTab(tabId)
    navigate(`/page/${pageId}`)
  }

  return (
    <div className="tabs-bar" data-testid="tabs-bar">
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
              onClick={() => handleActivate(tab.id, tab.pageId)}
            >
              {title}
            </button>
            <button
              type="button"
              className="tabs-bar__action"
              aria-label="Pin tab"
              data-testid={`tab-pin-${tab.id}`}
              onClick={() => togglePin(tab.id)}
            >
              {tab.pinned ? 'Unpin' : 'Pin'}
            </button>
            <button
              type="button"
              className="tabs-bar__action"
              aria-label="Close tab"
              data-testid={`tab-close-${tab.id}`}
              onClick={() => closeTab(tab.id)}
            >
              Close
            </button>
          </div>
        ))
      )}
    </div>
  )
}
