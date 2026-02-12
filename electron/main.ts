import { app, BrowserWindow, dialog, ipcMain, Menu } from 'electron'
import { mkdir } from 'node:fs/promises'
import { readFile } from 'node:fs/promises'
import { unlink } from 'node:fs/promises'
import { writeFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const require = createRequire(import.meta.url)
const pkg = require('../package.json') as { version: string }
const isDev = !app.isPackaged

// Startup logging (NotesAI-style)
console.log(
  `[NotesAI SE] Starting v${pkg.version} (${app.isPackaged ? 'production' : 'development'})`,
)
console.log(`[NotesAI SE] App starting, data path: ${app.getPath('userData')}`)
if (isDev) {
  process.env.ELECTRON_DISABLE_SECURITY_WARNINGS = 'true'
}
const shouldOpenDevTools = isDev && process.env.E2E !== 'true'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const getAppIcon = () => {
  const iconName = process.platform === 'win32' ? 'favicon.ico' : 'favicon-256.png'
  if (isDev) {
    return path.join(app.getAppPath(), 'public', iconName)
  }
  return path.join(__dirname, '../dist', iconName)
}

const createWindow = () => {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    icon: getAppIcon(),
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
    },
  })

  if (isDev) {
    win.loadURL('http://localhost:5173')
    if (shouldOpenDevTools) {
      win.webContents.openDevTools({ mode: 'detach' })
    }
  } else {
    win.loadFile(path.join(__dirname, '../dist/index.html'))
  }
}

app.whenReady().then(async () => {
  const { getDb } = await import('./db/sqlite.js')
  const db = getDb()

  // Diagnostics paths and env (for Settings → Diagnostics)
  ipcMain.handle('diagnostics:getPaths', async () => {
    const userData = app.getPath('userData')
    const logs = path.join(userData, 'logs')
    const backups = path.join(userData, 'backups')
    const dbPath = path.join(userData, 'notesai-se.sqlite')
    const nodeVersion = process.versions?.node ?? 'N/A'
    return { userData, logs, backups, dbPath, nodeVersion }
  })

  // IPC handlers for pages
  ipcMain.handle('pages:list', async () => {
    const rows = db
      .prepare(
        'SELECT id, title, parentId, "order", contentMarkdown, updatedAt, createdAt, trashed, favorited, favoriteOrder FROM pages ORDER BY "order"',
      )
      .all() as Array<{
      id: string
      title: string
      parentId: string | null
      order: number
      contentMarkdown: string
      updatedAt: string
      createdAt: string
      trashed: number
      favorited: number
      favoriteOrder: number | null
    }>
    return rows.map((row) => ({
      id: row.id,
      title: row.title,
      parentId: row.parentId,
      order: row.order,
      contentMarkdown: row.contentMarkdown,
      updatedAt: row.updatedAt,
      createdAt: row.createdAt,
      trashed: Boolean(row.trashed),
      favorited: Boolean(row.favorited),
      favoriteOrder: row.favoriteOrder ?? null,
    }))
  })

  ipcMain.handle('pages:get', async (_event, id: string) => {
    const row = db
      .prepare(
        'SELECT id, title, parentId, "order", contentMarkdown, updatedAt, createdAt, trashed, favorited, favoriteOrder FROM pages WHERE id = ?',
      )
      .get(id) as
      | {
          id: string
          title: string
          parentId: string | null
          order: number
          contentMarkdown: string
          updatedAt: string
          createdAt: string
          trashed: number
          favorited: number
          favoriteOrder: number | null
        }
      | undefined
    if (!row) return null
    return {
      id: row.id,
      title: row.title,
      parentId: row.parentId,
      order: row.order,
      contentMarkdown: row.contentMarkdown,
      updatedAt: row.updatedAt,
      createdAt: row.createdAt,
      trashed: Boolean(row.trashed),
      favorited: Boolean(row.favorited),
      favoriteOrder: row.favoriteOrder ?? null,
    }
  })

  ipcMain.handle('pages:upsert', async (_event, page: any) => {
    db.prepare(
      `INSERT INTO pages (id, title, parentId, "order", contentMarkdown, updatedAt, createdAt, trashed, favorited, favoriteOrder)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
         title = excluded.title,
         parentId = excluded.parentId,
         "order" = excluded."order",
         contentMarkdown = excluded.contentMarkdown,
         updatedAt = excluded.updatedAt,
         trashed = excluded.trashed,
         favorited = excluded.favorited,
         favoriteOrder = excluded.favoriteOrder`,
    ).run(
      page.id,
      page.title,
      page.parentId,
      page.order,
      page.contentMarkdown,
      page.updatedAt,
      page.createdAt,
      page.trashed ? 1 : 0,
      page.favorited ? 1 : 0,
      page.favoriteOrder ?? null,
    )
  })

  ipcMain.handle('pages:delete', async (_event, id: string) => {
    db.prepare('DELETE FROM embeddings WHERE page_id = ?').run(id)
    db.prepare('DELETE FROM pages WHERE id = ?').run(id)
  })

  // IPC handlers for embeddings (semantic search)
  ipcMain.handle('embeddings:getAll', async () => {
    const rows = db
      .prepare('SELECT page_id, embedding, text_hash FROM embeddings')
      .all() as Array<{ page_id: string; embedding: string; text_hash: string }>
    return rows.map((r) => ({
      pageId: r.page_id,
      embedding: JSON.parse(r.embedding) as number[],
      textHash: r.text_hash,
    }))
  })

  ipcMain.handle('embeddings:get', async (_event, pageId: string) => {
    const row = db
      .prepare('SELECT page_id, embedding, text_hash FROM embeddings WHERE page_id = ?')
      .get(pageId) as { page_id: string; embedding: string; text_hash: string } | undefined
    if (!row) return null
    return {
      pageId: row.page_id,
      embedding: JSON.parse(row.embedding) as number[],
      textHash: row.text_hash,
    }
  })

  ipcMain.handle(
    'embeddings:upsert',
    async (
      _event,
      pageId: string,
      embedding: number[],
      textHash: string,
    ) => {
      const now = new Date().toISOString()
      db.prepare(
        `INSERT INTO embeddings (page_id, embedding, text_hash, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?)
         ON CONFLICT(page_id) DO UPDATE SET
           embedding = excluded.embedding,
           text_hash = excluded.text_hash,
           updated_at = excluded.updated_at`,
      ).run(pageId, JSON.stringify(embedding), textHash, now, now)
    },
  )

  ipcMain.handle('embeddings:delete', async (_event, pageId: string) => {
    db.prepare('DELETE FROM embeddings WHERE page_id = ?').run(pageId)
  })

  // IPC handler for directory picker (backup/export/import paths)
  ipcMain.handle(
    'dialog:selectDirectory',
    async (_event, defaultPath?: string) => {
      const result = await dialog.showOpenDialog({
        properties: ['openDirectory'],
        defaultPath: defaultPath || app.getPath('documents'),
      })
      if (result.canceled || result.filePaths.length === 0) return null
      return result.filePaths[0]
    },
  )

  // Write a file to disk (used when default backup/export path is set).
  // options.encoding === 'base64' writes binary (e.g. for ZIP files).
  // Fallback: .zip path is always written as decoded base64 so the archive is valid.
  ipcMain.handle(
    'files:writeFile',
    async (
      _event,
      filePath: string,
      content: string,
      options?: { encoding?: 'utf8' | 'base64' },
    ) => {
      const normalizedPath = path.normalize(filePath)
      const dir = path.dirname(normalizedPath)
      await mkdir(dir, { recursive: true })
      const isZip = normalizedPath.toLowerCase().endsWith('.zip')
      const writeAsBinary = options?.encoding === 'base64' || isZip
      if (writeAsBinary) {
        await writeFile(normalizedPath, Buffer.from(content, 'base64'))
      } else {
        await writeFile(normalizedPath, content, 'utf-8')
      }
    },
  )

  // Open file dialog and return file content (for import with default path)
  ipcMain.handle(
    'dialog:openFile',
    async (
      _event,
      options: { defaultPath?: string; filters?: { name: string; extensions: string[] }[] },
    ) => {
      const result = await dialog.showOpenDialog({
        properties: ['openFile'],
        defaultPath: options.defaultPath || app.getPath('documents'),
        filters: options.filters ?? [
          { name: 'Supported', extensions: ['json', 'md', 'markdown', 'html', 'htm'] },
        ],
      })
      if (result.canceled || result.filePaths.length === 0) return null
      const filePath = result.filePaths[0]
      const content = await readFile(filePath, 'utf-8')
      const filename = path.basename(filePath)
      return { content, filename }
    },
  )

  // Export HTML to PDF via Chromium print (preserves formatting and images)
  ipcMain.handle('export:printToPdf', async (_event, html: string) => {
    const tmpPath = path.join(app.getPath('temp'), `notesai-pdf-${Date.now()}.html`)
    await writeFile(tmpPath, html, 'utf-8')
    const win = new BrowserWindow({
      show: false,
      width: 794,
      height: 1123,
      webPreferences: {},
    })
    try {
      await win.loadFile(tmpPath)
      const data = await win.webContents.printToPDF({
        printBackground: true,
        margins: { marginType: 'default' },
      })
      return data.toString('base64')
    } finally {
      win.destroy()
      await unlink(tmpPath).catch(() => {})
    }
  })

  // IPC handler for opening About modal
  ipcMain.handle('app:open-about', () => {
    // Send event to renderer to open About modal
    const windows = BrowserWindow.getAllWindows()
    windows.forEach((win) => {
      win.webContents.send('app:show-about')
    })
  })

  // Create application menu
  const template: Electron.MenuItemConstructorOptions[] = [
    {
      label: 'File',
      submenu: [
        {
          label: 'New Page',
          accelerator: 'CmdOrCtrl+N',
          click: () => {
            const windows = BrowserWindow.getAllWindows()
            windows.forEach((win) => {
              win.webContents.send('app:new-page')
            })
          },
        },
        { type: 'separator' },
        {
          label: 'Exit',
          accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
          click: () => {
            app.quit()
          },
        },
      ],
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo', label: 'Undo' },
        { role: 'redo', label: 'Redo' },
        { type: 'separator' },
        { role: 'cut', label: 'Cut' },
        { role: 'copy', label: 'Copy' },
        { role: 'paste', label: 'Paste' },
        { role: 'selectAll', label: 'Select All' },
      ],
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload', label: 'Reload' },
        { role: 'forceReload', label: 'Force Reload' },
        { role: 'toggleDevTools', label: 'Toggle Developer Tools' },
        { type: 'separator' },
        { role: 'resetZoom', label: 'Actual Size' },
        { role: 'zoomIn', label: 'Zoom In' },
        { role: 'zoomOut', label: 'Zoom Out' },
        { type: 'separator' },
        { role: 'togglefullscreen', label: 'Toggle Full Screen' },
      ],
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'About NotesAI SE',
          click: () => {
            const windows = BrowserWindow.getAllWindows()
            windows.forEach((win) => {
              win.webContents.send('app:show-about')
            })
          },
        },
      ],
    },
  ]

  const menu = Menu.buildFromTemplate(template)
  Menu.setApplicationMenu(menu)

  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
