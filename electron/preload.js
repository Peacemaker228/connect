import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electron', {
  isDesktop: true,
  openExternal: (url) => ipcRenderer.invoke('desktop:open-external', url),
  getBuildInfo: () => ipcRenderer.invoke('desktop:get-build-info'),
  notifyReady: () => ipcRenderer.send('desktop:renderer-ready'),
  onClerkSession: (callback) => {
    const listener = (_event, sessionId) => callback(sessionId)

    ipcRenderer.on('clerk:session', listener)

    return () => {
      ipcRenderer.removeListener('clerk:session', listener)
    }
  },
})
