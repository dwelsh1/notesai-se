import { app, BrowserWindow } from 'electron'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const isDev = !app.isPackaged
const shouldOpenDevTools = isDev && process.env.E2E !== 'true'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const createWindow = () => {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
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
  if (process.env.E2E !== 'true') {
    const { getDb } = await import('./db/sqlite.js')
    getDb()
  }
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
