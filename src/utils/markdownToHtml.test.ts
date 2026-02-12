import { describe, it, expect } from 'vitest'
import { markdownToHTML } from './markdownToHtml'

describe('markdownToHTML', () => {
  it('returns empty string for empty input', () => {
    expect(markdownToHTML('')).toBe('')
    expect(markdownToHTML('   ')).toBe('')
  })

  it('renders bold and italic', () => {
    const html = markdownToHTML('**bold** and *italic*')
    expect(html).toContain('<strong>bold</strong>')
    expect(html).toContain('<em>italic</em>')
  })

  it('renders code blocks', () => {
    const html = markdownToHTML('```\ncode\n```')
    expect(html).toContain('<pre>')
    expect(html).toContain('code')
  })

  it('strips script tags', () => {
    const html = markdownToHTML('Hello <script>alert(1)</script> world')
    expect(html).not.toContain('<script>')
    expect(html).toContain('Hello')
    expect(html).toContain('world')
  })
})
