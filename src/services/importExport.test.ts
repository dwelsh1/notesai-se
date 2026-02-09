import { describe, it, expect } from 'vitest'
import {
  exportPagesToHtml,
  exportPagesToJson,
  exportPagesToMarkdown,
  importHtml,
  importJson,
  importMarkdown,
} from './importExport'

describe('importExport', () => {
  it('imports markdown with heading title', () => {
    const result = importMarkdown('# Sample Title\n\nBody')
    expect(result.pages).toHaveLength(1)
    expect(result.pages[0].title).toBe('Sample Title')
    expect(result.pages[0].contentMarkdown).toContain('Body')
  })

  it('imports JSON pages', () => {
    const result = importJson(
      JSON.stringify({
        pages: [
          { id: 'p1', title: 'First', contentMarkdown: 'Hello' },
          { title: 'Second', contentMarkdown: 'World' },
        ],
      }),
    )
    expect(result.pages).toHaveLength(2)
    expect(result.pages[0].title).toBe('First')
    expect(result.pages[1].title).toBe('Second')
  })

  it('imports HTML pages', () => {
    const result = importHtml('<h1>My Doc</h1><p>Line one</p><p>Line two</p>')
    expect(result.pages).toHaveLength(1)
    expect(result.pages[0].title).toBe('My Doc')
    expect(result.pages[0].contentMarkdown).toContain('Line one')
    expect(result.pages[0].contentMarkdown).toContain('Line two')
  })

  it('exports pages to markdown/json/html', () => {
    const pages = [
      {
        id: 'p1',
        title: 'Export Me',
        contentMarkdown: 'Body',
        updatedAt: '2026-02-08T00:00:00.000Z',
        createdAt: '2026-02-08T00:00:00.000Z',
        trashed: false,
        favorited: false,
        parentId: null,
        order: 0,
      },
    ]

    const markdown = exportPagesToMarkdown(pages)
    expect(markdown).toContain('# Export Me')

    const json = exportPagesToJson(pages)
    expect(json).toContain('Export Me')

    const html = exportPagesToHtml(pages)
    expect(html).toContain('<h1>Export Me</h1>')
  })
})
