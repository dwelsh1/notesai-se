import type { StorageAdapter, Page } from './storage'

export type EmbeddingRow = {
  pageId: string
  embedding: number[]
  textHash: string
}

declare global {
  interface Window {
    notesAISE?: {
      pages: {
        list: () => Promise<Page[]>
        get: (id: string) => Promise<Page | null>
        upsert: (page: Page) => Promise<void>
        delete: (id: string) => Promise<void>
      }
      embeddings?: {
        getAll: () => Promise<EmbeddingRow[]>
        get: (pageId: string) => Promise<EmbeddingRow | null>
        upsert: (pageId: string, embedding: number[], textHash: string) => Promise<void>
        delete: (pageId: string) => Promise<void>
      }
      onShowAbout?: (callback: () => void) => void
      removeShowAboutListener?: (callback: () => void) => void
      onNewPage?: (callback: () => void) => void
      removeNewPageListener?: (callback: () => void) => void
      selectDirectory?: (defaultPath?: string) => Promise<string | null>
      writeFile?: (
        filePath: string,
        content: string,
        options?: { encoding?: 'utf8' | 'base64' },
      ) => Promise<void>
      openFile?: (options: {
        defaultPath?: string
        filters?: { name: string; extensions: string[] }[]
      }) => Promise<{ content: string; filename: string } | null>
      /** Render HTML to PDF (Electron only). Returns base64 PDF. */
      printToPdf?: (html: string) => Promise<string>
      /** Diagnostics paths (Electron only). */
      getDiagnosticsPaths?: () => Promise<{
        userData: string
        logs: string
        backups: string
        dbPath: string
        nodeVersion: string
      }>
    }
  }
}

export function createSqliteStorage(): StorageAdapter {
  if (!window.notesAISE?.pages) {
    throw new Error('SQLite storage not available. Make sure you are running in Electron.')
  }

  const api = window.notesAISE.pages

  return {
    listPages: async () => {
      return api.list()
    },
    getPage: async (id: string) => {
      return api.get(id)
    },
    upsertPage: async (page: Page) => {
      return api.upsert(page)
    },
    deletePage: async (id: string) => {
      return api.delete(id)
    },
  }
}
