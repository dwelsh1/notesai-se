const { contextBridge } = require('electron')

contextBridge.exposeInMainWorld('notesAISE', {
  version: '0.1.0',
})
