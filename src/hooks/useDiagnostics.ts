import { useCallback, useEffect, useState } from 'react'
import {
  getDiagnosticsState,
  setAppStartTimeForDiagnostics,
  type DiagnosticsState,
  type ElectronPaths,
} from '../utils/diagnostics'

let appStartTimeSet = false

export function useDiagnostics(options: {
  autoRefresh?: boolean
  refreshInterval?: number
} = {}) {
  const { autoRefresh = false, refreshInterval = 10_000 } = options
  const [diagnostics, setDiagnostics] = useState<DiagnosticsState | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const refresh = useCallback(async () => {
    if (!appStartTimeSet) {
      setAppStartTimeForDiagnostics(performance.timing?.navigationStart ?? Date.now() - 1)
      appStartTimeSet = true
    }
    setIsLoading(true)
    try {
      let electronPaths: ElectronPaths | undefined
      let nodeVersion = 'N/A'
      if (typeof window.notesAISE?.getDiagnosticsPaths === 'function') {
        const paths = await window.notesAISE.getDiagnosticsPaths()
        if (paths) {
          electronPaths = {
            userData: paths.userData,
            logs: paths.logs,
            backups: paths.backups,
            dbPath: paths.dbPath,
          }
          nodeVersion = paths.nodeVersion ?? 'N/A'
        }
      }
      const state = getDiagnosticsState({ electronPaths, nodeVersion })
      setDiagnostics(state)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  useEffect(() => {
    if (!autoRefresh || !diagnostics) return
    const t = setInterval(refresh, refreshInterval)
    return () => clearInterval(t)
  }, [autoRefresh, refreshInterval, refresh, diagnostics])

  return { diagnostics, isLoading, refresh }
}
