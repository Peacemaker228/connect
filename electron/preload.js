import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electron', {
  isDesktop: true,
  openExternal: (url) => ipcRenderer.invoke('desktop:open-external', url),
  writeClipboardText: (text) => ipcRenderer.invoke('desktop:write-clipboard', text),
  getBuildInfo: () => ipcRenderer.invoke('desktop:get-build-info'),
  notifyReady: () => ipcRenderer.send('desktop:renderer-ready'),
  onAuthSession: (callback) => {
    const listener = (_event, sessionId) => callback(sessionId)

    ipcRenderer.on('auth:session', listener)

    return () => {
      ipcRenderer.removeListener('auth:session', listener)
    }
  },
})
