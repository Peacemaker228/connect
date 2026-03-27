import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { app, BrowserWindow, ipcMain, session, shell } from 'electron'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const APP_PROTOCOL = 'axconnect'
const DEFAULT_DEV_URL = 'http://localhost:3005'
const DEFAULT_INITIAL_PATH = '/'
const DEV_LOAD_RETRIES = 60
const DEV_RETRY_DELAY_MS = 1000
const ALLOWED_PERMISSIONS = new Set(['camera', 'microphone', 'media', 'notifications', 'fullscreen'])

let mainWindow = null
let pendingNavigationPath = null
let pendingSessionId = null
let isRendererReady = false

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

const isHttpUrl = (value) => {
  try {
    const url = new URL(value)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

const getUrlOrigin = (value) => {
  try {
    return new URL(value).origin
  } catch {
    return null
  }
}

const readDesktopConfig = () => {
  const configPath = path.join(__dirname, 'app-config.json')

  if (!fs.existsSync(configPath)) {
    return {}
  }

  try {
    return JSON.parse(fs.readFileSync(configPath, 'utf8'))
  } catch (error) {
    console.error('[desktop] Failed to read app-config.json', error)
    return {}
  }
}

const getRendererUrl = () => {
  if (!app.isPackaged) {
    return process.env.ELECTRON_RENDERER_URL || DEFAULT_DEV_URL
  }

  const config = readDesktopConfig()

  return config.productionUrl || process.env.ELECTRON_RENDERER_URL || process.env.NEXT_PUBLIC_SITE_URL || ''
}

const getInitialRendererUrl = () => {
  const rendererUrl = getRendererUrl()

  if (!isHttpUrl(rendererUrl)) {
    return rendererUrl
  }

  const initialPath = pendingNavigationPath || process.env.ELECTRON_INITIAL_PATH || DEFAULT_INITIAL_PATH
  pendingNavigationPath = null
  const url = new URL(rendererUrl)

  if (url.pathname === '/' || url.pathname === '') {
    url.pathname = initialPath
  }

  return url.toString()
}

const getAppPathFromDeepLink = (urlString) => {
  try {
    const url = new URL(urlString)

    if (url.protocol !== `${APP_PROTOCOL}:`) {
      return null
    }

    if (url.hostname === 'invite') {
      const inviteCode = url.pathname.replace(/^\/+/, '')

      if (inviteCode) {
        return `/invite/${inviteCode}`
      }
    }

    const pathFromQuery = url.searchParams.get('path')

    if (pathFromQuery?.startsWith('/')) {
      return pathFromQuery
    }

    return null
  } catch {
    return null
  }
}

const getRendererNavigationUrl = (appPath) => {
  const rendererUrl = getRendererUrl()

  if (!isHttpUrl(rendererUrl)) {
    return rendererUrl
  }

  return new URL(appPath, rendererUrl).toString()
}

const getSessionIdFromDeepLink = (urlString) => {
  try {
    return new URL(urlString).searchParams.get('session_id')
  } catch {
    return null
  }
}

const sendSessionToRenderer = (sessionId) => {
  if (!sessionId) {
    return
  }

  if (!mainWindow || mainWindow.isDestroyed() || !isRendererReady) {
    pendingSessionId = sessionId
    return
  }

  mainWindow.webContents.send('clerk:session', sessionId)
}

const handleDeepLink = (urlString) => {
  const appPath = getAppPathFromDeepLink(urlString)
  const sessionId = getSessionIdFromDeepLink(urlString)

  if (appPath) {
    pendingNavigationPath = appPath
  }

  if (sessionId) {
    pendingSessionId = sessionId
  }

  if (mainWindow && !mainWindow.isDestroyed() && appPath) {
    void mainWindow.loadURL(getRendererNavigationUrl(appPath))
    return
  }

  if (sessionId) {
    sendSessionToRenderer(sessionId)
  }
}

const restoreMainWindow = () => {
  if (!mainWindow) {
    return
  }

  if (mainWindow.isMinimized()) {
    mainWindow.restore()
  }

  mainWindow.focus()
}

const extractDeepLinkFromArgv = (argv) => {
  return argv.find((value) => typeof value === 'string' && value.startsWith(`${APP_PROTOCOL}://`)) || null
}

const registerProtocol = () => {
  if (process.defaultApp && process.argv[1]) {
    app.setAsDefaultProtocolClient(APP_PROTOCOL, process.execPath, [path.resolve(process.argv[1])])
    return
  }

  app.setAsDefaultProtocolClient(APP_PROTOCOL)
}

const buildErrorHtml = (title, description) => {
  return `data:text/html;charset=UTF-8,${encodeURIComponent(`
    <!DOCTYPE html>
    <html lang="ru">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>${title}</title>
        <style>
          :root {
            color-scheme: dark;
            font-family: Inter, Arial, sans-serif;
          }

          body {
            margin: 0;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            background: #111827;
            color: #f9fafb;
          }

          main {
            width: min(560px, calc(100vw - 48px));
            padding: 32px;
            border-radius: 16px;
            background: rgba(17, 24, 39, 0.92);
            border: 1px solid rgba(255, 255, 255, 0.08);
            box-shadow: 0 20px 50px rgba(0, 0, 0, 0.35);
          }

          h1 {
            margin: 0 0 12px;
            font-size: 24px;
          }

          p {
            margin: 0;
            line-height: 1.6;
            color: #d1d5db;
          }

          code {
            display: inline-block;
            margin-top: 16px;
            padding: 8px 12px;
            border-radius: 10px;
            background: rgba(255, 255, 255, 0.06);
            color: #93c5fd;
          }
        </style>
      </head>
      <body>
        <main>
          <h1>${title}</h1>
          <p>${description}</p>
          <code>electron/app-config.json</code>
        </main>
      </body>
    </html>
  `)}`
}

const loadRenderer = async () => {
  const rendererUrl = getInitialRendererUrl()

  if (!isHttpUrl(rendererUrl)) {
    await mainWindow.loadURL(
      buildErrorHtml(
        'Не настроен desktop URL',
        'Укажите productionUrl в electron/app-config.json перед упаковкой desktop-версии.',
      ),
    )
    return
  }

  if (app.isPackaged) {
    await mainWindow.loadURL(rendererUrl)
    return
  }

  let lastError = null

  for (let attempt = 1; attempt <= DEV_LOAD_RETRIES; attempt += 1) {
    try {
      await mainWindow.loadURL(rendererUrl)
      return
    } catch (error) {
      lastError = error
      await delay(DEV_RETRY_DELAY_MS)
    }
  }

  console.error('[desktop] Failed to load renderer', lastError)

  await mainWindow.loadURL(
    buildErrorHtml(
      'Не удалось дождаться web-приложение',
      `Проверьте, что Next.js стартует по адресу ${rendererUrl} и повторите запуск desktop-режима.`,
    ),
  )
}

const createWindow = async () => {
  isRendererReady = false

  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1200,
    minHeight: 720,
    show: false,
    autoHideMenuBar: true,
    backgroundColor: '#111827',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      sandbox: false,
      nodeIntegration: false,
    },
  })

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show()
  })

  mainWindow.webContents.on('did-start-loading', () => {
    isRendererReady = false
  })

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (!isHttpUrl(url)) {
      return { action: 'deny' }
    }

    return {
      action: 'allow',
      overrideBrowserWindowOptions: {
        autoHideMenuBar: true,
        backgroundColor: '#111827',
        webPreferences: {
          contextIsolation: true,
          sandbox: false,
          nodeIntegration: false,
        },
      },
    }
  })

  mainWindow.on('closed', () => {
    mainWindow = null
    isRendererReady = false
  })

  await loadRenderer()
}

const singleInstanceLock = app.requestSingleInstanceLock()

if (!singleInstanceLock) {
  app.quit()
} else {
  app.on('second-instance', (_event, argv) => {
    restoreMainWindow()

    const deepLink = extractDeepLinkFromArgv(argv)

    if (deepLink) {
      handleDeepLink(deepLink)
    }
  })
}

ipcMain.handle('desktop:open-external', async (_event, url) => {
  if (!isHttpUrl(url)) {
    return false
  }

  await shell.openExternal(url)
  return true
})

ipcMain.on('desktop:renderer-ready', () => {
  isRendererReady = true

  if (pendingSessionId) {
    const sessionId = pendingSessionId
    pendingSessionId = null
    sendSessionToRenderer(sessionId)
  }
})

app.whenReady().then(async () => {
  registerProtocol()

  const rendererOrigin = getUrlOrigin(getRendererUrl())

  session.defaultSession.setPermissionRequestHandler((_webContents, permission, callback, details) => {
    const requestingOrigin = getUrlOrigin(details.requestingUrl)
    callback(Boolean(rendererOrigin && requestingOrigin === rendererOrigin && ALLOWED_PERMISSIONS.has(permission)))
  })

  session.defaultSession.setPermissionCheckHandler((_webContents, permission, requestingOrigin) => {
    return Boolean(rendererOrigin && requestingOrigin === rendererOrigin && ALLOWED_PERMISSIONS.has(permission))
  })

  await createWindow()

  app.on('activate', async () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      await createWindow()
      return
    }

    restoreMainWindow()
  })

  const startupDeepLink = extractDeepLinkFromArgv(process.argv)

  if (startupDeepLink) {
    handleDeepLink(startupDeepLink)
  }
})

app.on('open-url', (event, url) => {
  event.preventDefault()
  handleDeepLink(url)
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
