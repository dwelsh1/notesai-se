import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { loadConfig, saveConfig } from '../config/appConfig'

type SidebarContextValue = {
  collapsed: boolean
  toggleSidebar: () => void
  setCollapsed: (collapsed: boolean) => void
  selectedId: string | null
  setSelectedId: (id: string | null) => void
  sidebarWidth: number | null
  setSidebarWidth: (width: number | null) => void
  rememberSidebarWidth: boolean
  setRememberSidebarWidth: (remember: boolean) => void
}

const SidebarContext = createContext<SidebarContextValue | null>(null)

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  // Initialize from localStorage using lazy initialization
  const [collapsed, setCollapsed] = useState(() => {
    const saved = localStorage.getItem('sidebarCollapsed')
    return saved === 'true'
  })
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const config = loadConfig()
  const [rememberSidebarWidth, setRememberSidebarWidthState] = useState(config.rememberSidebarWidth)
  // Ignore saved width if 0 or too small so the sidebar doesn't load as invisible
  const [sidebarWidth, setSidebarWidthState] = useState<number | null>(() => {
    const w = config.sidebarWidth
    return w != null && w >= 250 ? w : null
  })

  const toggleSidebar = useCallback(() => {
    setCollapsed((prev) => !prev)
  }, [])

  const setRememberSidebarWidth = useCallback((remember: boolean) => {
    setRememberSidebarWidthState(remember)
    const newConfig = { ...loadConfig(), rememberSidebarWidth: remember }
    saveConfig(newConfig)
    if (!remember) {
      // Clear saved width when disabling persistence
      setSidebarWidthState(null)
      const clearedConfig = { ...newConfig, sidebarWidth: null }
      saveConfig(clearedConfig)
    }
  }, [])

  const setSidebarWidth = useCallback(
    (width: number | null) => {
      setSidebarWidthState(width)
      if (rememberSidebarWidth && width !== null) {
        const newConfig = { ...loadConfig(), sidebarWidth: width }
        saveConfig(newConfig)
      }
    },
    [rememberSidebarWidth],
  )

  // Persist collapsed state to localStorage
  useEffect(() => {
    localStorage.setItem('sidebarCollapsed', String(collapsed))
  }, [collapsed])

  return (
    <SidebarContext.Provider
      value={{
        collapsed,
        toggleSidebar,
        setCollapsed,
        selectedId,
        setSelectedId,
        sidebarWidth,
        setSidebarWidth,
        rememberSidebarWidth,
        setRememberSidebarWidth,
      }}
    >
      {children}
    </SidebarContext.Provider>
  )
}

export function useSidebar() {
  const context = useContext(SidebarContext)
  if (!context) {
    throw new Error('useSidebar must be used within SidebarProvider')
  }
  return context
}
