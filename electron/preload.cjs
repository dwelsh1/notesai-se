const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('notesAISE', {
  version: '0.1.0',
  pages: {
    list: () => ipcRenderer.invoke('pages:list'),
    get: (id) => ipcRenderer.invoke('pages:get', id),
    upsert: (page) => ipcRenderer.invoke('pages:upsert', page),
    delete: (id) => ipcRenderer.invoke('pages:delete', id),
  },
  embeddings: {
    getAll: () => ipcRenderer.invoke('embeddings:getAll'),
    get: (pageId) => ipcRenderer.invoke('embeddings:get', pageId),
    upsert: (pageId, embedding, textHash) =>
      ipcRenderer.invoke('embeddings:upsert', pageId, embedding, textHash),
    delete: (pageId) => ipcRenderer.invoke('embeddings:delete', pageId),
  },
  onShowAbout: (callback) => {
    ipcRenderer.on('app:show-about', callback)
  },
  removeShowAboutListener: (callback) => {
    ipcRenderer.removeListener('app:show-about', callback)
  },
  onNewPage: (callback) => {
    ipcRenderer.on('app:new-page', callback)
  },
  removeNewPageListener: (callback) => {
    ipcRenderer.removeListener('app:new-page', callback)
  },
  selectDirectory: (defaultPath) =>
    ipcRenderer.invoke('dialog:selectDirectory', defaultPath),
  writeFile: (filePath, content, options) =>
    ipcRenderer.invoke('files:writeFile', filePath, content, options),
  openFile: (options) => ipcRenderer.invoke('dialog:openFile', options),
  printToPdf: (html) => ipcRenderer.invoke('export:printToPdf', html),
  getDiagnosticsPaths: () => ipcRenderer.invoke('diagnostics:getPaths'),
})
