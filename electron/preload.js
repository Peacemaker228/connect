import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electron', {
  isDesktop: true,
  openExternal: (url) => ipcRenderer.invoke('desktop:open-external', url),
  onDeepLink: (callback) => {
    const listener = (_event, payload) => callback(payload)

    ipcRenderer.on('desktop:deep-link', listener)

    return () => {
      ipcRenderer.removeListener('desktop:deep-link', listener)
    }
  },
  onClerkSession: (callback) => {
    const listener = (_event, sessionId) => callback(sessionId)

    ipcRenderer.on('clerk:session', listener)

    return () => {
      ipcRenderer.removeListener('clerk:session', listener)
    }
  },
})
