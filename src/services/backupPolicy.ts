export type BackupRecord = {
  id: string
  createdAt: string
  type: 'manual' | 'scheduled'
  location: string
}

export type BackupRetention = {
  maxBackups: number
  maxAgeDays?: number
}

export type BackupSchedule = {
  mode: 'manual' | 'daily' | 'weekly'
  hour?: number
  dayOfWeek?: number
}

export type BackupRetentionResult = {
  keep: BackupRecord[]
  purge: BackupRecord[]
}

function startOfDay(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()))
}

export function applyRetention(
  backups: BackupRecord[],
  retention: BackupRetention,
  now: Date = new Date(),
): BackupRetentionResult {
  const sorted = [...backups].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  const cutoff =
    retention.maxAgeDays !== undefined
      ? startOfDay(new Date(now.getTime() - retention.maxAgeDays * 24 * 60 * 60 * 1000))
      : null

  const keep: BackupRecord[] = []
  const purge: BackupRecord[] = []

  for (const backup of sorted) {
    const backupDate = new Date(backup.createdAt)
    const isExpired = cutoff ? backupDate < cutoff : false
    if (isExpired) {
      purge.push(backup)
      continue
    }
    if (keep.length < retention.maxBackups) {
      keep.push(backup)
    } else {
      purge.push(backup)
    }
  }

  return { keep, purge }
}

export function getNextBackupAt(now: Date, schedule: BackupSchedule): Date | null {
  if (schedule.mode === 'manual') {
    return null
  }

  const hour = schedule.hour ?? 2
  const next = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), hour))

  if (schedule.mode === 'daily') {
    if (next <= now) {
      next.setUTCDate(next.getUTCDate() + 1)
    }
    return next
  }

  const dayOfWeek = schedule.dayOfWeek ?? 1
  const currentDay = next.getUTCDay()
  let delta = dayOfWeek - currentDay
  if (delta < 0) {
    delta += 7
  }
  if (delta === 0 && next <= now) {
    delta = 7
  }
  next.setUTCDate(next.getUTCDate() + delta)
  return next
}
