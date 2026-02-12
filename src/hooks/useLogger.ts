import { useCallback, useEffect, useState } from 'react'
import {
  clearLogs,
  exportLogsText,
  getLogCount,
  getLogs,
  type LogEntry,
  type LogLevel,
} from '../utils/logger'

export function useLogger() {
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [counts, setCounts] = useState(getLogCount())
  const [filterLevel, setFilterLevel] = useState<LogLevel | 'all'>('all')
  const [search, setSearch] = useState('')

  const refresh = useCallback(() => {
    setLogs(getLogs())
    setCounts(getLogCount())
  }, [])

  useEffect(() => {
    const interval = setInterval(refresh, 500)
    return () => clearInterval(interval)
  }, [refresh])

  const clear = useCallback(() => {
    clearLogs()
    setLogs([])
    setCounts(getLogCount())
  }, [])

  const filteredLogs = logs.filter((e) => {
    if (filterLevel !== 'all' && e.level !== filterLevel) return false
    if (search.trim() && !e.message.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const exportText = useCallback(() => {
    return exportLogsText(filteredLogs)
  }, [filteredLogs])

  return {
    logs: filteredLogs,
    counts,
    filterLevel,
    setFilterLevel,
    search,
    setSearch,
    clear,
    refresh,
    exportText,
  }
}
