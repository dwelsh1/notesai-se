import { Outlet, useNavigate } from 'react-router-dom'
import { useEffect } from 'react'
import { Sidebar } from './Sidebar'
import { PagesProvider, usePages } from '../state/pagesContext'
import { TabsProvider } from '../state/tabsContext'
import { TabsBar } from './TabsBar'

function AppShellContent() {
  const { createPage } = usePages()
  const navigate = useNavigate()

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.key.toLowerCase() === 'n') {
        event.preventDefault()
        const page = createPage()
        navigate(`/page/${page.id}`)
      }

      if (event.ctrlKey && event.key.toLowerCase() === 'f') {
        event.preventDefault()
        window.dispatchEvent(new CustomEvent('notesai:focus-search'))
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [createPage, navigate])

  return (
    <div className="app-shell" data-testid="app-shell">
      <Sidebar />
      <main className="app-main">
        <TabsBar />
        <div className="app-content">
          <Outlet />
        </div>
      </main>
    </div>
  )
}

export function AppShell() {
  return (
    <PagesProvider>
      <TabsProvider>
        <AppShellContent />
      </TabsProvider>
    </PagesProvider>
  )
}
