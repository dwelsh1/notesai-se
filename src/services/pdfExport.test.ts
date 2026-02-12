import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { exportPagesToPdf } from './pdfExport'
import type { Page } from '../storage/storage'

function isJsPDF(result: unknown): result is { getNumberOfPages: () => number } {
  return (
    typeof result === 'object' &&
    result !== null &&
    'getNumberOfPages' in result &&
    typeof (result as { getNumberOfPages: () => number }).getNumberOfPages === 'function'
  )
}

function makePage(overrides: Partial<Page> = {}): Page {
  return {
    id: 'p1',
    title: 'Untitled',
    contentMarkdown: '',
    updatedAt: '2026-02-08T00:00:00.000Z',
    createdAt: '2026-02-08T00:00:00.000Z',
    trashed: false,
    favorited: false,
    parentId: null,
    order: 0,
    favoriteOrder: null,
    ...overrides,
  }
}

describe('pdfExport', () => {
  const originalNotesAISE = window.notesAISE

  beforeEach(() => {
    delete (window as unknown as { notesAISE?: unknown }).notesAISE
  })

  afterEach(() => {
    ;(window as unknown as { notesAISE: unknown }).notesAISE = originalNotesAISE
  })

  it('returns jsPDF with one page per note when not in Electron', async () => {
    const pages = [
      makePage({ id: 'p1', title: 'First', contentMarkdown: 'Content one' }),
      makePage({ id: 'p2', title: 'Second', contentMarkdown: 'Content two' }),
    ]
    const result = await exportPagesToPdf(pages)
    expect(isJsPDF(result)).toBe(true)
    expect((result as { getNumberOfPages: () => number }).getNumberOfPages()).toBe(2)
  })

  it('returns base64 string when printToPdf is available (Electron)', async () => {
    const mockPdfBase64 = Buffer.from('%PDF-1.4 fake').toString('base64')
    ;(window as unknown as { notesAISE: { printToPdf: (html: string) => Promise<string> } }).notesAISE = {
      printToPdf: vi.fn().mockResolvedValue(mockPdfBase64),
    }
    const pages = [makePage({ title: 'One', contentMarkdown: 'Body' })]
    const result = await exportPagesToPdf(pages)
    expect(typeof result).toBe('string')
    expect(result).toBe(mockPdfBase64)
    expect(window.notesAISE?.printToPdf).toHaveBeenCalledWith(
      expect.stringContaining('<!DOCTYPE html>'),
    )
    expect((window.notesAISE?.printToPdf as ReturnType<typeof vi.fn>).mock.calls[0][0]).toContain(
      'One',
    )
    expect((window.notesAISE?.printToPdf as ReturnType<typeof vi.fn>).mock.calls[0][0]).toContain(
      'Body',
    )
  })

  it('handles empty pages with single empty PDF page', async () => {
    const result = await exportPagesToPdf([])
    expect(isJsPDF(result)).toBe(true)
    expect((result as { getNumberOfPages: () => number }).getNumberOfPages()).toBe(1)
  })
})
