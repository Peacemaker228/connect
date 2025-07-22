import { app, BrowserWindow } from 'electron'
import path from 'path'
import { fileURLToPath } from 'url'

// ⛳ Для поддержки __dirname в ESM
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

let mainWindow = null

if (!app.isDefaultProtocolClient('axconnect')) {
  app.setAsDefaultProtocolClient('axconnect')
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    }
  })

  mainWindow.loadURL('http://localhost:3002') // <-- у тебя порт 3002, не 3001

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

app.whenReady().then(() => {
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('open-url', (event, urlStr) => {
  event.preventDefault()
  const parsedUrl = new URL(urlStr)
  const sessionId = parsedUrl.searchParams.get('session_id')

  console.log('Received session ID from Clerk:', sessionId)

  if (mainWindow && sessionId) {
    mainWindow.webContents.send('clerk:session', sessionId)
  }
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
