import { marked } from 'marked'

const ALLOWED_TAGS = new Set([
  'p', 'br', 'strong', 'em', 'b', 'i', 'code', 'pre', 'a', 'ul', 'ol', 'li',
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'hr', 'span', 'div',
])

function sanitizeNode(node: Node, doc: Document): Node {
  if (node.nodeType === Node.TEXT_NODE) return node.cloneNode(true)
  if (node.nodeType !== Node.ELEMENT_NODE) return doc.createDocumentFragment()
  const el = node as Element
  const tag = el.tagName.toLowerCase()
  if (!ALLOWED_TAGS.has(tag)) {
    const fragment = doc.createDocumentFragment()
    Array.from(el.childNodes).forEach((c) => fragment.appendChild(sanitizeNode(c, doc)))
    return fragment
  }
  const out = doc.createElement(tag)
  if (tag === 'a') {
    const href = el.getAttribute('href')
    if (href && !href.startsWith('javascript:')) out.setAttribute('href', href)
  }
  Array.from(el.childNodes).forEach((c) => out.appendChild(sanitizeNode(c, doc)))
  return out
}

function sanitizeHtml(html: string): string {
  const doc = new DOMParser().parseFromString(html, 'text/html')
  const fragment = doc.createDocumentFragment()
  Array.from(doc.body.childNodes).forEach((c) => fragment.appendChild(sanitizeNode(c, doc)))
  doc.body.innerHTML = ''
  doc.body.appendChild(fragment)
  return doc.body.innerHTML
}

export function markdownToHTML(markdown: string): string {
  if (!markdown?.trim()) return ''
  const raw = marked.parse(markdown, { async: false }) as string
  return sanitizeHtml(raw || '')
}
