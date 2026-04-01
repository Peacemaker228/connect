import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { app, BrowserWindow, desktopCapturer, ipcMain, session, shell } from 'electron'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const APP_PROTOCOL = 'axconnect'
const DEFAULT_DEV_URL = 'http://localhost:3005'
const DEFAULT_INITIAL_PATH = '/'
const DEV_LOAD_RETRIES = 60
const DEV_RETRY_DELAY_MS = 1000
const ALLOWED_PERMISSIONS = new Set(['camera', 'microphone', 'media', 'display-capture', 'notifications', 'fullscreen'])
const WINDOW_ICON_PATH = path.join(__dirname, 'assets', 'icon.ico')
const SHOULD_DISABLE_MEDIA_FOUNDATION_VIDEO_CAPTURE =
  process.platform === 'win32' &&
  (process.env.AXCONNECT_DISABLE_MEDIA_FOUNDATION_VIDEO_CAPTURE === '1' ||
    process.env.AXCONNECT_USE_MEDIA_FOUNDATION_VIDEO_CAPTURE === '0')
const BUILD_INFO_PATH = path.join(__dirname, 'build-info.json')
const DESKTOP_SOURCE_PICKER_PROTOCOL = 'axconnect-picker:'

if (SHOULD_DISABLE_MEDIA_FOUNDATION_VIDEO_CAPTURE) {
  app.commandLine.appendSwitch('disable-features', 'MediaFoundationVideoCapture')
}

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

const getOriginVariants = (value) => {
  const origin = getUrlOrigin(value) || value

  if (!origin) {
    return []
  }

  try {
    const url = new URL(origin)
    const variants = new Set([url.origin])
    const { hostname, protocol, port } = url

    if (hostname === 'localhost' || /^\d+\.\d+\.\d+\.\d+$/.test(hostname)) {
      return [...variants]
    }

    const bareHostname = hostname.startsWith('www.') ? hostname.slice(4) : hostname
    const hostnames = new Set([bareHostname, `www.${bareHostname}`])

    for (const variantHostname of hostnames) {
      variants.add(`${protocol}//${variantHostname}${port ? `:${port}` : ''}`)
    }

    return [...variants]
  } catch {
    return [origin]
  }
}

const getTrustedOrigins = () => {
  const origins = new Set()

  for (const candidate of [getRendererUrl(), mainWindow?.webContents.getURL()]) {
    for (const origin of getOriginVariants(candidate)) {
      origins.add(origin)
    }
  }

  return origins
}

const isTrustedOrigin = (value) => {
  const origin = getUrlOrigin(value) || value

  if (!origin) {
    return false
  }

  return getTrustedOrigins().has(origin)
}

const canGrantPermission = (webContents, permission, requestingValue) => {
  if (!ALLOWED_PERMISSIONS.has(permission)) {
    return false
  }

  const currentWindowUrl = webContents?.getURL?.() || ''

  if (isTrustedOrigin(currentWindowUrl)) {
    return true
  }

  return isTrustedOrigin(requestingValue)
}

const readBuildInfo = () => {
  if (!fs.existsSync(BUILD_INFO_PATH)) {
    return null
  }

  try {
    return JSON.parse(fs.readFileSync(BUILD_INFO_PATH, 'utf8'))
  } catch (error) {
    console.error('[desktop] Failed to read build-info.json', error)
    return null
  }
}

const escapeHtml = (value) => {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

const buildDesktopSourcePickerHtml = (sources) => {
  const sections = [
    {
      title: 'Экраны',
      items: sources.filter((source) => source.id.startsWith('screen:')),
    },
    {
      title: 'Окна приложений',
      items: sources.filter((source) => !source.id.startsWith('screen:')),
    },
  ].filter((section) => section.items.length > 0)

  const sectionsHtml = sections
    .map(
      (section) => `
        <section>
          <h2>${escapeHtml(section.title)}</h2>
          <div class="grid">
            ${section.items
              .map(
                (source) => `
                  <button class="source" data-source-id="${escapeHtml(source.id)}">
                    <span class="source-title">${escapeHtml(source.name)}</span>
                    <span class="source-meta">${escapeHtml(source.id.startsWith('screen:') ? 'Экран' : 'Окно')}</span>
                  </button>
                `,
              )
              .join('')}
          </div>
        </section>
      `,
    )
    .join('')

  return `data:text/html;charset=UTF-8,${encodeURIComponent(`
    <!DOCTYPE html>
    <html lang="ru">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Выбор источника экрана</title>
        <style>
          :root {
            color-scheme: dark;
            font-family: Inter, Arial, sans-serif;
          }

          * {
            box-sizing: border-box;
          }

          body {
            margin: 0;
            padding: 24px;
            background: #111827;
            color: #f9fafb;
          }

          h1 {
            margin: 0 0 8px;
            font-size: 20px;
          }

          p {
            margin: 0 0 20px;
            color: #9ca3af;
            font-size: 14px;
          }

          section + section {
            margin-top: 20px;
          }

          h2 {
            margin: 0 0 12px;
            font-size: 14px;
            color: #d1d5db;
          }

          .grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
            gap: 12px;
          }

          .source {
            width: 100%;
            border: 1px solid rgba(255, 255, 255, 0.12);
            border-radius: 12px;
            background: #1f2937;
            color: inherit;
            padding: 16px;
            text-align: left;
            cursor: pointer;
          }

          .source:hover {
            border-color: rgba(34, 211, 238, 0.9);
            background: #243041;
          }

          .source-title {
            display: block;
            font-size: 14px;
            font-weight: 600;
            word-break: break-word;
          }

          .source-meta {
            display: block;
            margin-top: 8px;
            font-size: 12px;
            color: #9ca3af;
          }

          .footer {
            display: flex;
            justify-content: flex-end;
            margin-top: 24px;
          }

          .cancel {
            border: 1px solid rgba(255, 255, 255, 0.12);
            border-radius: 10px;
            background: transparent;
            color: #f9fafb;
            padding: 10px 14px;
            cursor: pointer;
          }
        </style>
      </head>
      <body>
        <h1>Поделиться экраном</h1>
        <p>Выберите экран или окно приложения, которое хотите показать.</p>
        ${sectionsHtml}
        <div class="footer">
          <button class="cancel" type="button">Отмена</button>
        </div>

        <script>
          document.addEventListener('click', (event) => {
            const sourceButton = event.target.closest('[data-source-id]')

            if (sourceButton) {
              const sourceId = sourceButton.getAttribute('data-source-id')
              window.location.href = '${DESKTOP_SOURCE_PICKER_PROTOCOL}//select?sourceId=' + encodeURIComponent(sourceId)
              return
            }

            if (event.target.closest('.cancel')) {
              window.location.href = '${DESKTOP_SOURCE_PICKER_PROTOCOL}//cancel'
            }
          })
        </script>
      </body>
    </html>
  `)}`
}

const selectDesktopSource = async (sources) => {
  if (!mainWindow || mainWindow.isDestroyed()) {
    return null
  }

  return new Promise((resolve) => {
    let isResolved = false

    const finish = (sourceId = null) => {
      if (isResolved) {
        return
      }

      isResolved = true
      resolve(sources.find((source) => source.id === sourceId) || null)
    }

    const pickerWindow = new BrowserWindow({
      parent: mainWindow,
      modal: true,
      width: 920,
      height: 680,
      resizable: false,
      maximizable: false,
      minimizable: false,
      autoHideMenuBar: true,
      show: false,
      title: 'Выбор источника экрана',
      backgroundColor: '#111827',
      webPreferences: {
        sandbox: true,
        contextIsolation: true,
        nodeIntegration: false,
      },
    })

    const handleNavigation = (event, url) => {
      if (!url.startsWith(DESKTOP_SOURCE_PICKER_PROTOCOL)) {
        return
      }

      event.preventDefault()

      try {
        const parsedUrl = new URL(url)
        const sourceId = parsedUrl.searchParams.get('sourceId')
        finish(parsedUrl.hostname === 'select' ? sourceId : null)
      } finally {
        if (!pickerWindow.isDestroyed()) {
          pickerWindow.close()
        }
      }
    }

    pickerWindow.webContents.setWindowOpenHandler(() => ({ action: 'deny' }))
    pickerWindow.webContents.on('will-navigate', handleNavigation)
    pickerWindow.once('ready-to-show', () => pickerWindow.show())
    pickerWindow.once('closed', () => finish())

    void pickerWindow.loadURL(buildDesktopSourcePickerHtml(sources))
  })
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
    icon: WINDOW_ICON_PATH,
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

ipcMain.handle('desktop:get-build-info', async () => {
  return readBuildInfo()
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

  console.log('[desktop][app-info]', {
    appName: app.getName(),
    appVersion: app.getVersion(),
    isPackaged: app.isPackaged,
    execPath: process.execPath,
    buildInfo: readBuildInfo(),
  })

  session.defaultSession.setPermissionRequestHandler((_webContents, permission, callback, details) => {
    const isAllowed = canGrantPermission(_webContents, permission, details.requestingUrl)
    callback(isAllowed)
  })

  session.defaultSession.setPermissionCheckHandler((_webContents, permission, requestingOrigin) => {
    return canGrantPermission(_webContents, permission, requestingOrigin)
  })

  session.defaultSession.setDisplayMediaRequestHandler(
    async (request, callback) => {
      const currentWindowUrl = request.frame?.url || request.securityOrigin || ''

      if (!canGrantPermission(mainWindow?.webContents, 'display-capture', currentWindowUrl)) {
        console.log('[desktop][display-media] denied for', currentWindowUrl)
        callback({})
        return
      }

      try {
        const sources = await desktopCapturer.getSources({
          types: ['screen', 'window'],
        })

        if (sources.length === 0) {
          console.log('[desktop][display-media] no available sources')
          callback({})
          return
        }

        const selectedSource = await selectDesktopSource(sources)

        if (!selectedSource) {
          console.log('[desktop][display-media] no available sources')
          callback({})
          return
        }

        const displayMediaResponse = {
          video: selectedSource,
          ...(selectedSource.id.startsWith('screen:') ? { audio: 'loopback' } : {}),
        }

        callback(displayMediaResponse)
      } catch (error) {
        console.error('[desktop] Failed to get display media source', error)
        callback({})
      }
    },
    {
      useSystemPicker: false,
    },
  )

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
