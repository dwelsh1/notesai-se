/**
 * In-memory console logger for Diagnostics tab.
 * Intercepts console.log/info/warn/error/debug and keeps a ring buffer (max 1000).
 */

export type LogLevel = 'log' | 'info' | 'warn' | 'error' | 'debug'

export type LogEntry = {
  id: string
  timestamp: number
  level: LogLevel
  message: string
  stack?: string
  source?: string
}

const MAX_LOGS = 1000
const buffer: LogEntry[] = []
let idCounter = 0
let originalConsole: {
  log: typeof console.log
  info: typeof console.info
  warn: typeof console.warn
  error: typeof console.error
  debug: typeof console.debug
} | null = null

function nextId(): string {
  idCounter += 1
  return `log-${idCounter}-${Date.now()}`
}

function push(level: LogLevel, args: unknown[], stack?: string) {
  const message = args
    .map((a) => {
      if (typeof a === 'string') return a
      try {
        return typeof a === 'object' && a !== null ? JSON.stringify(a) : String(a)
      } catch {
        return String(a)
      }
    })
    .join(' ')
  const entry: LogEntry = {
    id: nextId(),
    timestamp: Date.now(),
    level,
    message,
    stack,
  }
  buffer.push(entry)
  if (buffer.length > MAX_LOGS) buffer.shift()
}

function capture(level: LogLevel) {
  return (...args: unknown[]) => {
    let stack: string | undefined
    if (level === 'error' && args[0] instanceof Error) {
      stack = args[0].stack
    } else {
      try {
        throw new Error()
      } catch (e) {
        stack = (e as Error).stack
      }
    }
    push(level, args, stack)
    if (originalConsole) originalConsole[level].apply(console, args as [string?, ...unknown[]])
  }
}

export function init() {
  if (originalConsole) return
  originalConsole = {
    log: console.log.bind(console),
    info: console.info.bind(console),
    warn: console.warn.bind(console),
    error: console.error.bind(console),
    debug: console.debug.bind(console),
  }
  console.log = capture('log')
  console.info = capture('info')
  console.warn = capture('warn')
  console.error = capture('error')
  console.debug = capture('debug')
}

export function getLogs(): LogEntry[] {
  return [...buffer]
}

export function clearLogs(): void {
  buffer.length = 0
}

export function getLogCount(): { total: number; byLevel: Record<LogLevel, number> } {
  const byLevel: Record<LogLevel, number> = {
    log: 0,
    info: 0,
    warn: 0,
    error: 0,
    debug: 0,
  }
  for (const e of buffer) {
    byLevel[e.level] += 1
  }
  return { total: buffer.length, byLevel }
}

export function exportLogsText(entries: LogEntry[] = buffer): string {
  const lines = entries.map((e) => {
    const time = new Date(e.timestamp).toISOString()
    const level = e.level.toUpperCase()
    let line = `${time} | [${level}] | ${e.message}`
    if (e.stack) line += `\n  ${e.stack.replace(/\n/g, '\n  ')}`
    return line
  })
  return lines.join('\n')
}
