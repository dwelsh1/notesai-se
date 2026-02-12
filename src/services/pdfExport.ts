import { jsPDF } from 'jspdf'
import html2canvas from 'html2canvas'
import type { Page } from '../storage/storage'

const A4_MM = { w: 210, h: 297 }
const MARGIN_MM = 15
const CONTENT_W = A4_MM.w - 2 * MARGIN_MM
const TITLE_FONT_SIZE = 16
const BODY_FONT_SIZE = 11
const LINE_HEIGHT = 1.35
const TITLE_MARGIN_BOTTOM = 6

/** Convert pt to mm (1 pt = 1/72 inch). */
function ptToMm(pt: number): number {
  return (pt * 25.4) / 72
}

const PRINT_CSS = `
  * { box-sizing: border-box; }
  body { margin: 0; padding: 0; font-family: system-ui, -apple-system, sans-serif; font-size: 11pt; line-height: 1.5; color: #1a1a1a; }
  .pdf-page { page-break-after: always; padding: 24px; min-height: 100vh; }
  .pdf-page:last-child { page-break-after: auto; }
  .pdf-page h1 { margin: 0 0 12px 0; font-size: 18pt; font-weight: 600; }
  .pdf-page .content { white-space: pre-wrap; word-break: break-word; }
  .pdf-page .content p { margin: 0 0 0.5em 0; }
  .pdf-page .content img { max-width: 100%; height: auto; }
`

/**
 * Build a full HTML document for all pages (HTML formatting + images).
 * Uses each page's contentMarkdown as HTML (TipTap output).
 */
function buildFullHtml(pages: Page[]): string {
  const parts = pages.map((page) => {
    const title = escapeHtml(page.title || 'Untitled')
    const content = page.contentMarkdown || ''
    return `<section class="pdf-page"><h1>${title}</h1><div class="content">${content}</div></section>`
  })
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>${PRINT_CSS}</style></head><body>${parts.join('')}</body></html>`
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

/**
 * Replace blob: URLs in img src with data URLs so the HTML can be rendered in a new context (e.g. Electron printToPDF).
 */
async function inlineBlobUrls(html: string): Promise<string> {
  const parser = new DOMParser()
  const doc = parser.parseFromString(html, 'text/html')
  const images = doc.querySelectorAll<HTMLImageElement>('img[src^="blob:"]')
  await Promise.all(
    Array.from(images).map(async (img) => {
      try {
        const res = await fetch(img.getAttribute('src')!)
        const blob = await res.blob()
        const dataUrl = await new Promise<string>((resolve, reject) => {
          const r = new FileReader()
          r.onload = () => resolve(r.result as string)
          r.onerror = reject
          r.readAsDataURL(blob)
        })
        img.setAttribute('src', dataUrl)
      } catch {
        // leave blob URL or remove
      }
    }),
  )
  return '<!DOCTYPE html>\n' + doc.documentElement.outerHTML
}

/**
 * Export pages to PDF with HTML formatting and images.
 * - Electron: uses printToPDF (full fidelity).
 * - Browser: uses iframe + html2canvas, then slices to PDF pages; falls back to text-only if capture fails.
 */
export async function exportPagesToPdf(pages: Page[]): Promise<jsPDF | string> {
  if (pages.length === 0) {
    const doc = new jsPDF({ unit: 'mm', format: 'a4' })
    return doc
  }

  const rawHtml = buildFullHtml(pages)
  const html = await inlineBlobUrls(rawHtml)

  // Electron: Chromium printToPDF preserves HTML and images
  if (typeof window !== 'undefined' && window.notesAISE?.printToPdf) {
    const base64 = await window.notesAISE.printToPdf(html)
    return base64
  }

  // Browser: render in iframe and capture with html2canvas, or fall back to text
  try {
    const iframe = document.createElement('iframe')
    iframe.style.position = 'fixed'
    iframe.style.left = '-9999px'
    iframe.style.width = '794px'
    iframe.style.height = '1123px'
    iframe.style.border = 'none'
    document.body.appendChild(iframe)

    const iframeDoc = iframe.contentDocument!
    iframeDoc.open()
    iframeDoc.write(html)
    iframeDoc.close()

    await new Promise<void>((resolve, reject) => {
      iframe.onload = () => resolve()
      iframe.onerror = reject
      if (iframeDoc.readyState === 'complete') resolve()
    })

    // Wait for images to load
    const imgs = iframeDoc.querySelectorAll('img')
    await Promise.all(
      Array.from(imgs).map(
        (img) =>
          new Promise<void>((res) => {
            if (img.complete) res()
            else img.onload = () => res()
          }),
      )
    )

    const scale = 2
    const pageHeightPx = Math.round(1123 * scale)
    const body = iframeDoc.body
    const fullHeight = Math.max(body.scrollHeight, body.offsetHeight, 1123)

    const canvas = await html2canvas(body, {
      scale,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
      height: fullHeight,
      windowHeight: fullHeight,
    })

    document.body.removeChild(iframe)

    const doc = new jsPDF({ unit: 'mm', format: 'a4' })
    const pxToMm = 25.4 / 96
    const pageHeightMm = A4_MM.h - 2 * MARGIN_MM
    const contentWidthMm = CONTENT_W
    let y = 0
    let pageIndex = 0

    while (y < canvas.height) {
      const sliceH = Math.min(pageHeightPx, canvas.height - y)
      const sliceCanvas = document.createElement('canvas')
      sliceCanvas.width = canvas.width
      sliceCanvas.height = sliceH
      const ctx = sliceCanvas.getContext('2d')!
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, sliceCanvas.width, sliceCanvas.height)
      ctx.drawImage(canvas, 0, y, canvas.width, sliceH, 0, 0, canvas.width, sliceH)

      let dataUrl: string
      try {
        dataUrl = sliceCanvas.toDataURL('image/jpeg', 0.92)
      } catch {
        dataUrl = sliceCanvas.toDataURL('image/png')
      }
      if (!dataUrl?.startsWith('data:image/')) {
        throw new Error('Failed to capture page image')
      }

      if (pageIndex > 0) doc.addPage()
      const imgWmm = (canvas.width / scale) * pxToMm
      const imgHmm = (sliceH / scale) * pxToMm
      const ratio = Math.min(contentWidthMm / imgWmm, pageHeightMm / imgHmm)
      const w = imgWmm * ratio
      const h = imgHmm * ratio
      const x = MARGIN_MM + (contentWidthMm - w) / 2
      doc.addImage(dataUrl, dataUrl.startsWith('data:image/jpeg') ? 'JPEG' : 'PNG', x, MARGIN_MM, w, h)
      y += sliceH
      pageIndex++
    }

    return doc
  } catch {
    // Fallback: text-only PDF
    return exportPagesToPdfTextOnly(pages)
  }
}

/** Text-only PDF (no HTML/images) for environments where capture fails. */
function exportPagesToPdfTextOnly(pages: Page[]): jsPDF {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })

  for (let i = 0; i < pages.length; i++) {
    if (i > 0) doc.addPage()

    const page = pages[i]
    const title = page.title || 'Untitled'
    const body = page.contentMarkdown || ''
    const plainBody = body.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()

    let y = MARGIN_MM

    doc.setFontSize(TITLE_FONT_SIZE)
    doc.setFont('helvetica', 'bold')
    const titleLines = doc.splitTextToSize(title, CONTENT_W)
    const titleLineHeightMm = ptToMm(TITLE_FONT_SIZE) * LINE_HEIGHT
    for (let t = 0; t < titleLines.length; t++) {
      doc.text(titleLines[t], MARGIN_MM, y + ptToMm(TITLE_FONT_SIZE))
      y += titleLineHeightMm
    }
    y += TITLE_MARGIN_BOTTOM

    doc.setFontSize(BODY_FONT_SIZE)
    doc.setFont('helvetica', 'normal')
    const bodyLines = doc.splitTextToSize(plainBody, CONTENT_W)
    const bodyLineHeightMm = ptToMm(BODY_FONT_SIZE) * LINE_HEIGHT

    for (const line of bodyLines) {
      if (y + bodyLineHeightMm > A4_MM.h - MARGIN_MM) {
        doc.addPage()
        y = MARGIN_MM
      }
      doc.text(line, MARGIN_MM, y + ptToMm(BODY_FONT_SIZE))
      y += bodyLineHeightMm
    }
  }

  return doc
}
