import { describe, it, expect } from 'vitest'
import {
  contentToPlainText,
  buildTextForEmbedding,
  getPreviewText,
  textHash,
} from './embeddingText'

describe('contentToPlainText', () => {
  it('returns empty string for empty input', () => {
    expect(contentToPlainText('')).toBe('')
    expect(contentToPlainText('   ')).toBe('')
  })

  it('strips HTML tags', () => {
    expect(contentToPlainText('<p>hello</p>')).toBe('hello')
    expect(contentToPlainText('<h1>Title</h1><p>Body</p>')).toBe('Title Body')
  })

  it('collapses whitespace', () => {
    expect(contentToPlainText('a   b\n\nc')).toBe('a b c')
  })
})

describe('buildTextForEmbedding', () => {
  it('combines title and content with newlines', () => {
    const out = buildTextForEmbedding('My Page', '<p>Content here</p>')
    expect(out).toContain('My Page')
    expect(out).toContain('Content here')
    expect(out).toMatch(/\n\n/)
  })

  it('returns only title when content is empty', () => {
    expect(buildTextForEmbedding('Title', '')).toBe('Title')
  })
})

describe('getPreviewText', () => {
  it('returns full text when under max length', () => {
    const text = 'Short'
    expect(getPreviewText(text, 200)).toBe(text)
  })

  it('truncates and adds ellipsis when over max length', () => {
    const text = 'x'.repeat(250)
    const out = getPreviewText(text, 200)
    expect(out.length).toBe(203)
    expect(out.endsWith('...')).toBe(true)
  })

  it('uses default max length of 200', () => {
    const text = 'a'.repeat(300)
    expect(getPreviewText(text).length).toBe(203)
  })
})

describe('textHash', () => {
  it('returns same hash for same string', () => {
    const h1 = textHash('hello')
    const h2 = textHash('hello')
    expect(h1).toBe(h2)
  })

  it('returns different hash for different strings', () => {
    expect(textHash('a')).not.toBe(textHash('b'))
  })

  it('returns a string', () => {
    expect(typeof textHash('test')).toBe('string')
    expect(textHash('test').length).toBeGreaterThan(0)
  })
})
