import { describe, it, expect } from 'vitest'
import { applyRetention, getNextBackupAt, type BackupRecord } from './backupPolicy'

describe('backupPolicy', () => {
  it('applies retention limits', () => {
    const backups: BackupRecord[] = [
      {
        id: 'b1',
        createdAt: '2026-02-08T10:00:00.000Z',
        type: 'manual',
        location: 'a.zip',
      },
      {
        id: 'b2',
        createdAt: '2026-02-07T10:00:00.000Z',
        type: 'scheduled',
        location: 'b.zip',
      },
      {
        id: 'b3',
        createdAt: '2026-01-01T10:00:00.000Z',
        type: 'scheduled',
        location: 'c.zip',
      },
    ]

    const result = applyRetention(
      backups,
      { maxBackups: 2, maxAgeDays: 30 },
      new Date('2026-02-08T12:00:00.000Z'),
    )
    expect(result.keep).toHaveLength(2)
    expect(result.purge).toHaveLength(1)
    expect(result.purge[0].id).toBe('b3')
  })

  it('computes next backup for daily schedule', () => {
    const now = new Date('2026-02-08T03:00:00.000Z')
    const next = getNextBackupAt(now, { mode: 'daily', hour: 2 })
    expect(next?.toISOString()).toBe('2026-02-09T02:00:00.000Z')
  })

  it('computes next backup for weekly schedule', () => {
    const now = new Date('2026-02-08T03:00:00.000Z')
    const next = getNextBackupAt(now, { mode: 'weekly', hour: 2, dayOfWeek: 1 })
    expect(next?.toISOString()).toBe('2026-02-09T02:00:00.000Z')
  })
})
