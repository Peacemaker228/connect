import { contextBridge, ipcRenderer } from 'electron'

// Безопасно экспортируем API в окно
contextBridge.exposeInMainWorld('electronAPI', {
  onClerkSession: (callback) => ipcRenderer.on('clerk:session', (_event, sessionId) => callback(sessionId))
})
