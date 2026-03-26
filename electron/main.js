import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { app, BrowserWindow, ipcMain, session, shell } from 'electron'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const APP_PROTOCOL = 'axconnect'
const DEFAULT_DEV_URL = 'http://localhost:3000'
const DEFAULT_INITIAL_PATH = '/sign-in'
const DEV_LOAD_RETRIES = 60
const DEV_RETRY_DELAY_MS = 1000
const ALLOWED_PERMISSIONS = new Set(['camera', 'microphone', 'media', 'notifications', 'fullscreen'])

let mainWindow = null
let pendingDeepLink = null

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

const getInitialPath = () => {
  const config = app.isPackaged ? readDesktopConfig() : null

  return config?.initialPath || process.env.ELECTRON_INITIAL_PATH || DEFAULT_INITIAL_PATH
}

const getInitialRendererUrl = () => {
  const rendererUrl = getRendererUrl()

  if (!isHttpUrl(rendererUrl)) {
    return rendererUrl
  }

  const initialPath = getInitialPath()
  const url = new URL(rendererUrl)

  if (url.pathname === '/' || url.pathname === '') {
    url.pathname = initialPath
  }

  return url.toString()
}

const getSessionIdFromDeepLink = (urlString) => {
  try {
    return new URL(urlString).searchParams.get('session_id')
  } catch {
    return null
  }
}

const sendDeepLinkToRenderer = (urlString) => {
  if (!mainWindow || mainWindow.isDestroyed()) {
    pendingDeepLink = urlString
    return
  }

  const payload = {
    url: urlString,
    sessionId: getSessionIdFromDeepLink(urlString),
  }

  mainWindow.webContents.send('desktop:deep-link', payload)

  if (payload.sessionId) {
    mainWindow.webContents.send('clerk:session', payload.sessionId)
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

  mainWindow.webContents.on('did-finish-load', () => {
    if (pendingDeepLink) {
      const deepLink = pendingDeepLink
      pendingDeepLink = null
      sendDeepLinkToRenderer(deepLink)
    }
  })

  mainWindow.on('closed', () => {
    mainWindow = null
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
      sendDeepLinkToRenderer(deepLink)
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
    sendDeepLinkToRenderer(startupDeepLink)
  }
})

app.on('open-url', (event, url) => {
  event.preventDefault()
  sendDeepLinkToRenderer(url)
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
