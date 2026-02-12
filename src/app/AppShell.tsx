import { Outlet, useNavigate } from 'react-router-dom'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Group, Panel, Separator, usePanelRef } from 'react-resizable-panels'
import { Sidebar } from './Sidebar'
import { ErrorBoundary } from './ErrorBoundary'
import { PagesProvider, usePages } from '../state/pagesContext'
import { TabsProvider } from '../state/tabsContext'
import { TabsBar } from './TabsBar'
import { ThemeProvider } from '../state/themeContext'
import { useTabs } from '../state/tabsContext'
import { AboutModal } from './AboutModal'
import { SemanticSearchModal } from './SemanticSearchModal'
import { SidebarProvider, useSidebar } from '../state/sidebarContext'
import {
  SemanticSearchProvider,
  useSemanticSearchModal,
} from '../state/semanticSearchContext'
import { ChatPanelProvider, useChatPanel } from '../state/chatPanelContext'
import { ToastProvider } from '../state/toastContext'
import { ToastContainer } from './Toast'
import { AiChatPanel } from './AiChatPanel'
import { loadConfig } from '../config/appConfig'
import { checkAIConnection } from '../services/aiConnection'
function SidebarCollapsedStrip() {
  return (
    <div className="sidebar-collapsed-strip" data-testid="sidebar-collapsed-strip" aria-hidden="true" />
  )
}

function AppShellContent() {
  const { pages, createPage } = usePages()
  const { tabs, openTab, closeTab } = useTabs()
  const { collapsed, setCollapsed, sidebarWidth, setSidebarWidth, rememberSidebarWidth } = useSidebar()
  const navigate = useNavigate()
  const didInitTabs = useRef(false)
  const pagesLengthRef = useRef(pages.length)
  const [isAboutOpen, setIsAboutOpen] = useState(false)
  const { isOpen: isSemanticSearchOpen, openModal: openSemanticSearch, closeModal: closeSemanticSearch } = useSemanticSearchModal()
  const { isOpen: isChatOpen, toggle: toggleChat } = useChatPanel()
  const sidebarPanelRef = usePanelRef()

  // Collapsed sidebar size as % of group – narrow but visible strip for expand button + label (library uses %)
  const SIDEBAR_COLLAPSED_PERCENT = 6

  // Sync our collapsed state to the panel so it actually shrinks to a narrow strip.
  // Defer so the panel ref is ready after React commit (fixes hide sidebar toggle not working).
  useEffect(() => {
    const t = setTimeout(() => {
      const panel = sidebarPanelRef.current
      if (!panel) return
      if (collapsed) {
        if (typeof panel.collapse === 'function') panel.collapse()
      } else {
        if (typeof panel.expand === 'function') panel.expand()
      }
    }, 0)
    return () => clearTimeout(t)
  }, [collapsed, sidebarPanelRef])

  // Run AI connection check once at startup so [AI] logs appear without opening Settings/modal
  useEffect(() => {
    const config = loadConfig()
    if (config.aiEnabled && config.aiEndpoint?.trim()) {
      void checkAIConnection(config.aiEndpoint, '', true)
    }
  }, [])

  // Keyboard shortcut: Ctrl/Cmd+Shift+C to toggle AI Chat panel
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'c') {
        e.preventDefault()
        toggleChat()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [toggleChat])

  // Minimum sidebar width so it never collapses to 0 (which would hide it with no way to restore)
  const MIN_SIDEBAR_WIDTH = 250

  // Calculate default size from saved width (if available and enabled)
  // Use pixel values for more reliable sizing. Never use 0 or tiny values so the sidebar stays visible.
  const defaultSize = useMemo(() => {
    if (rememberSidebarWidth && sidebarWidth !== null && typeof window !== 'undefined') {
      return Math.max(MIN_SIDEBAR_WIDTH, sidebarWidth)
    }
    // Default to 300px (approximately 40% of a 1920px screen, but works better across screen sizes)
    return typeof window !== 'undefined'
      ? Math.max(MIN_SIDEBAR_WIDTH, Math.min(window.innerWidth * 0.5, 400))
      : 300
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Only calculate on mount

  // Track the last saved width to avoid unnecessary updates
  const lastSavedWidthRef = useRef<number | null>(null)

  // Track width changes when resizing; sync panel collapsed state when user drags to collapse
  const handleLayoutChange = useCallback(() => {
    const panel = sidebarPanelRef.current
    if (!panel || typeof window === 'undefined') return
    const isPanelCollapsed = typeof panel.isCollapsed === 'function' ? panel.isCollapsed() : false
    setCollapsed(isPanelCollapsed)
    if (rememberSidebarWidth && !isPanelCollapsed) {
      const sizeInfo = panel.getSize()
      const pixels = sizeInfo?.inPixels ?? 0
      if (pixels >= MIN_SIDEBAR_WIDTH && lastSavedWidthRef.current !== pixels) {
        lastSavedWidthRef.current = pixels
        setSidebarWidth(pixels)
      }
    }
  }, [rememberSidebarWidth, setSidebarWidth, setCollapsed, sidebarPanelRef])

  useEffect(() => {
    // Update ref to track current pages length
    pagesLengthRef.current = pages.length

    if (didInitTabs.current) {
      // After initialization, close tabs for any trashed pages
      const activePageIds = new Set(pages.filter((page) => !page.trashed).map((page) => page.id))
      const invalidTabs = tabs.filter((tab) => !activePageIds.has(tab.pageId))
      invalidTabs.forEach((tab) => closeTab(tab.id))
      return
    }

    // Only run initialization once when pages are first loaded
    if (pages.length === 0) {
      createPage().then((page) => {
        // Use refs to get latest values without causing re-renders
        if (!didInitTabs.current) {
          tabs.forEach((tab) => closeTab(tab.id))
          openTab(page.id)
          didInitTabs.current = true
        }
      })
    } else {
      const activePageIds = new Set(pages.filter((page) => !page.trashed).map((page) => page.id))
      const invalidTabs = tabs.filter((tab) => !activePageIds.has(tab.pageId))
      invalidTabs.forEach((tab) => closeTab(tab.id))

      if (tabs.length === 0 || tabs.length === invalidTabs.length) {
        const firstActivePage = pages.find((page) => !page.trashed)
        if (firstActivePage) {
          openTab(firstActivePage.id)
        }
      }
      didInitTabs.current = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pages.length]) // Only depend on pages.length to avoid infinite loops

  // Separate effect to close tabs when pages are trashed
  useEffect(() => {
    if (!didInitTabs.current) return

    const activePageIds = new Set(pages.filter((page) => !page.trashed).map((page) => page.id))
    const invalidTabs = tabs.filter((tab) => !activePageIds.has(tab.pageId))
    invalidTabs.forEach((tab) => closeTab(tab.id))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pages.map((p) => `${p.id}:${p.trashed}`).join(',')]) // Track trashed status changes

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.key.toLowerCase() === 'n') {
        event.preventDefault()
        createPage().then((page) => {
          navigate(`/page/${page.id}`)
        })
      }

      if (event.ctrlKey && event.key.toLowerCase() === 'f') {
        event.preventDefault()
        window.dispatchEvent(new CustomEvent('notesai:focus-search'))
      }

      if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        openSemanticSearch()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [createPage, navigate, openSemanticSearch])

  // Listen for About modal request from Electron menu
  useEffect(() => {
    const handleShowAbout = () => {
      setIsAboutOpen(true)
    }

    if (window.notesAISE?.onShowAbout) {
      window.notesAISE.onShowAbout(handleShowAbout)
      return () => {
        if (window.notesAISE?.removeShowAboutListener) {
          window.notesAISE.removeShowAboutListener(handleShowAbout)
        }
      }
    }
  }, [])

  // Listen for New Page request from Electron menu (single listener, ref for latest handlers)
  const newPageHandlersRef = useRef({ createPage, navigate })
  newPageHandlersRef.current = { createPage, navigate }
  useEffect(() => {
    const handleNewPage = () => {
      const { createPage: create, navigate: nav } = newPageHandlersRef.current
      create().then((page) => nav(`/page/${page.id}`))
    }
    if (window.notesAISE?.onNewPage) {
      window.notesAISE.onNewPage(handleNewPage)
      return () => {
        if (window.notesAISE?.removeNewPageListener) {
          window.notesAISE.removeNewPageListener(handleNewPage)
        }
      }
    }
  }, [])

  return (
    <div className="app-shell" data-testid="app-shell">
      <Group
        orientation="horizontal"
        className="app-panel-group"
        onLayoutChange={handleLayoutChange}
      >
        <Panel
          id="sidebar-panel"
          panelRef={sidebarPanelRef}
          defaultSize={`${defaultSize}px`}
          minSize={SIDEBAR_COLLAPSED_PERCENT}
          maxSize="85%"
          collapsible
          collapsedSize={SIDEBAR_COLLAPSED_PERCENT}
          className="app-panel-sidebar"
        >
          {collapsed ? <SidebarCollapsedStrip /> : <Sidebar />}
        </Panel>
        {!collapsed && <Separator className="app-panel-resize-handle" />}
        <Panel id="main-panel" minSize={10} className="app-panel-main">
          <main className="app-main">
            <ErrorBoundary>
              <TabsBar />
              <div className="app-content">
                <Outlet />
              </div>
            </ErrorBoundary>
          </main>
        </Panel>
        {isChatOpen && (
          <>
            <Separator className="app-panel-resize-handle" />
            <Panel
              id="chat-panel"
              defaultSize="28%"
              minSize="20%"
              maxSize="60%"
              collapsible
              collapsedSize={0}
              className="app-panel-chat"
            >
              <AiChatPanel />
            </Panel>
          </>
        )}
      </Group>
      <AboutModal isOpen={isAboutOpen} onClose={() => setIsAboutOpen(false)} />
      <SemanticSearchModal isOpen={isSemanticSearchOpen} onClose={closeSemanticSearch} />
      <ToastContainer />
    </div>
  )
}

export function AppShell() {
  return (
    <ThemeProvider>
      <PagesProvider>
        <TabsProvider>
          <SidebarProvider>
            <SemanticSearchProvider>
              <ChatPanelProvider>
                <ToastProvider>
                  <AppShellContent />
                </ToastProvider>
              </ChatPanelProvider>
            </SemanticSearchProvider>
          </SidebarProvider>
        </TabsProvider>
      </PagesProvider>
    </ThemeProvider>
  )
}
