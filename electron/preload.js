import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electron', {
  isDesktop: true,
  openExternal: (url) => ipcRenderer.invoke('desktop:open-external', url),
  writeClipboardText: (text) => ipcRenderer.invoke('desktop:write-clipboard', text),
  getBuildInfo: () => ipcRenderer.invoke('desktop:get-build-info'),
  getWindowState: () => ipcRenderer.invoke('desktop:get-window-state'),
  getUpdateStatus: () => ipcRenderer.invoke('desktop:get-update-status'),
  checkForUpdate: () => ipcRenderer.invoke('desktop:check-for-update'),
  installUpdate: () => ipcRenderer.invoke('desktop:install-update'),
  onUpdateStatus: (callback) => {
    const listener = (_event, status) => callback(status)

    ipcRenderer.on('desktop:update-status', listener)

    return () => {
      ipcRenderer.removeListener('desktop:update-status', listener)
    }
  },
  onWindowStateChange: (callback) => {
    const listener = (_event, state) => callback(state)

    ipcRenderer.on('desktop:window-state-change', listener)

    return () => {
      ipcRenderer.removeListener('desktop:window-state-change', listener)
    }
  },
  showUnreadNotification: (payload) => ipcRenderer.invoke('desktop:show-unread-notification', payload),
  onUnreadNotificationNavigate: (callback) => {
    const listener = (_event, path) => callback(path)

    ipcRenderer.on('desktop:navigate', listener)

    return () => {
      ipcRenderer.removeListener('desktop:navigate', listener)
    }
  },
  notifyReady: () => ipcRenderer.send('desktop:renderer-ready'),
  onAuthSession: (callback) => {
    const listener = (_event, sessionId) => callback(sessionId)

    ipcRenderer.on('auth:session', listener)

    return () => {
      ipcRenderer.removeListener('auth:session', listener)
    }
  },
})
