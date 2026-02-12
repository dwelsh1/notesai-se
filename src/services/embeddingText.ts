/**
 * Extract plain text from page content (markdown/HTML) for embedding and preview.
 */
export function contentToPlainText(contentMarkdown: string): string {
  if (!contentMarkdown || !contentMarkdown.trim()) return ''
  // Strip HTML tags, collapse whitespace
  const text = contentMarkdown
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  return text
}

/**
 * Build full text used for embedding: title + optional subtitle + content plain text.
 */
export function buildTextForEmbedding(title: string, contentMarkdown: string): string {
  const contentText = contentToPlainText(contentMarkdown)
  const parts = [title.trim()]
  if (contentText) parts.push(contentText)
  return parts.join('\n\n')
}

/**
 * First ~200 characters of plain text for preview display.
 */
export function getPreviewText(contentMarkdown: string, maxLength = 200): string {
  const text = contentToPlainText(contentMarkdown)
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength) + '...'
}

/**
 * Simple non-crypto string hash for change detection (djb2).
 */
export function textHash(str: string): string {
  let h = 5381
  for (let i = 0; i < str.length; i++) {
    h = (h * 33) ^ str.charCodeAt(i)
  }
  return (h >>> 0).toString(36)
}
