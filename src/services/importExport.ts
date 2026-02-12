import type { Page } from '../storage/storage'

type ImportResult = {
  pages: Page[]
}

function createId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

function nowIso() {
  return new Date().toISOString()
}

function buildPage(overrides: Partial<Page>, order: number): Page {
  const timestamp = nowIso()
  return {
    id: createId('page'),
    title: 'Untitled',
    contentMarkdown: '',
    updatedAt: timestamp,
    createdAt: timestamp,
    trashed: false,
    favorited: false,
    parentId: null,
    order,
    favoriteOrder: null,
    ...overrides,
  }
}

function stripHtmlTags(value: string) {
  return value
    .replace(/<[^>]*>/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

export function importMarkdown(markdown: string): ImportResult {
  const lines = markdown.split(/\r?\n/)
  const headingLine = lines.find((line) => line.trim().length > 0) ?? ''
  const title = headingLine.replace(/^#+\s*/, '').trim() || 'Untitled'

  return {
    pages: [buildPage({ title, contentMarkdown: markdown }, 0)],
  }
}

export function importJson(json: string): ImportResult {
  const parsed = JSON.parse(json) as { pages?: Partial<Page>[] } | Partial<Page>[]
  const pagesInput = Array.isArray(parsed) ? parsed : (parsed.pages ?? [])

  const pages = pagesInput.map((page, index) =>
    buildPage(
      {
        title: page.title?.trim() || 'Untitled',
        contentMarkdown: page.contentMarkdown ?? '',
        updatedAt: page.updatedAt ?? nowIso(),
        createdAt: page.createdAt ?? nowIso(),
        trashed: page.trashed ?? false,
        favorited: page.favorited ?? false,
        parentId: page.parentId ?? null,
        id: page.id ?? createId('page'),
      },
      index,
    ),
  )

  return { pages }
}

export function importHtml(html: string): ImportResult {
  const headingMatch = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)
  const title = headingMatch ? stripHtmlTags(headingMatch[1]) : 'Untitled'
  const paragraphs: string[] = []
  const paragraphRegex = /<p[^>]*>([\s\S]*?)<\/p>/gi
  let match = paragraphRegex.exec(html)
  while (match) {
    const text = stripHtmlTags(match[1])
    if (text) {
      paragraphs.push(text)
    }
    match = paragraphRegex.exec(html)
  }

  const contentMarkdown = paragraphs.length > 0 ? paragraphs.join('\n\n') : stripHtmlTags(html)

  return {
    pages: [buildPage({ title, contentMarkdown }, 0)],
  }
}

function escapeHtml(text: string) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

export function exportPagesToJson(pages: Page[]): string {
  return JSON.stringify({ pages }, null, 2)
}

export function exportPagesToMarkdown(pages: Page[]): string {
  return pages
    .map((page) => `# ${page.title}\n\n${page.contentMarkdown}`.trim())
    .join('\n\n---\n\n')
}

export function exportPagesToHtml(pages: Page[]): string {
  const style = `
article { margin-bottom: 2em; padding-bottom: 1em; border-bottom: 1px solid #eee; }
article:last-child { border-bottom: none; }
article h1 { margin: 0 0 0.5em 0; font-size: 1.5em; }
article .content { font-size: 1rem; line-height: 1.5; }
article .content img { max-width: 100%; height: auto; }
`.trim()
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>${style}</style></head><body>
${pages
  .map(
    (page) =>
      `<article><h1>${escapeHtml(page.title || 'Untitled')}</h1><div class="content">${page.contentMarkdown || ''}</div></article>`,
  )
  .join('\n')}
</body></html>`
}
