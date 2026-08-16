// LUNAR.MP3 — Electron main process.
//
// Responsibilities:
//   1. Create the app window, loading the Vite dev server in
//      development or the built dist/ in production.
//   2. Handle Spotify OAuth via the SYSTEM BROWSER (not an embedded
//      webview — embedding login forms in an app-controlled webview
//      is a well-known phishing/credential-capture risk and is
//      against standard OAuth best practice for desktop apps) plus a
//      tiny local loopback HTTP server to catch the redirect, since
//      Spotify's redirect_uri validation only accepts https or a
//      literal loopback address — not a custom app:// URI scheme.
//   3. Store the refresh token using Electron's OS-level safeStorage
//      (DPAPI on Windows) instead of plain localStorage, replacing
//      the dev-grade storage flagged throughout earlier phases.
const { app, BrowserWindow, shell, ipcMain, safeStorage, session, desktopCapturer } = require('electron')
const path = require('node:path')
const fs = require('node:fs')
const http = require('node:http')

const isDev = !app.isPackaged
const OAUTH_CALLBACK_PORT = 5174
const SECURE_STORE_FILE = () => path.join(app.getPath('userData'), 'secure-session.json')

let mainWindow = null
let callbackServer = null

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 960,
    minHeight: 640,
    backgroundColor: '#0c0a18',
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  })

  if (isDev) {
    // Requires `npm run dev` running separately — matches the
    // 127.0.0.1 requirement from the browser-based OAuth setup
    // (see redirectUri.ts comments).
    mainWindow.loadURL('http://127.0.0.1:5173')
    mainWindow.webContents.openDevTools({ mode: 'detach' })
  } else {
    mainWindow.loadFile(path.join(__dirname, '..', 'dist', 'index.html'))
  }
}

// ---------- OAuth loopback callback server ----------
// Started once at launch (cheap, idle until used) so it's always
// ready the moment the system browser redirects back after login.
function startOAuthCallbackServer() {
  callbackServer = http.createServer((req, res) => {
    if (!req.url || !req.url.startsWith('/callback')) {
      res.writeHead(404)
      res.end()
      return
    }

    const url = new URL(req.url, `http://127.0.0.1:${OAUTH_CALLBACK_PORT}`)
    const params = Object.fromEntries(url.searchParams.entries())

    res.writeHead(200, { 'Content-Type': 'text/html' })
    res.end(
      '<!doctype html><html><body style="background:#0c0a18;color:#e9e4fb;' +
        'font-family:monospace;display:flex;align-items:center;justify-content:center;' +
        'height:100vh;margin:0;"><p>LUNAR.MP3 connected — you can close this tab.</p>' +
        '</body></html>',
    )

    if (mainWindow) {
      mainWindow.webContents.send('oauth-callback', params)
      mainWindow.focus()
    }
  })

  callbackServer.listen(OAUTH_CALLBACK_PORT, '127.0.0.1')
}

ipcMain.handle('oauth:redirect-uri', () => `http://127.0.0.1:${OAUTH_CALLBACK_PORT}/callback`)

ipcMain.handle('oauth:open-external', (_event, url) => {
  shell.openExternal(url)
})

// ---------- Secure token storage (OS-level encryption) ----------
ipcMain.handle('secure-storage:set', (_event, key, value) => {
  if (!safeStorage.isEncryptionAvailable()) return false
  let store = {}
  try {
    store = JSON.parse(fs.readFileSync(SECURE_STORE_FILE(), 'utf-8'))
  } catch {
    // no existing store yet — start fresh
  }
  store[key] = safeStorage.encryptString(value).toString('base64')
  fs.writeFileSync(SECURE_STORE_FILE(), JSON.stringify(store))
  return true
})

ipcMain.handle('secure-storage:get', (_event, key) => {
  try {
    const store = JSON.parse(fs.readFileSync(SECURE_STORE_FILE(), 'utf-8'))
    if (!store[key]) return null
    return safeStorage.decryptString(Buffer.from(store[key], 'base64'))
  } catch {
    return null
  }
})

ipcMain.handle('secure-storage:delete', (_event, key) => {
  try {
    const store = JSON.parse(fs.readFileSync(SECURE_STORE_FILE(), 'utf-8'))
    delete store[key]
    fs.writeFileSync(SECURE_STORE_FILE(), JSON.stringify(store))
  } catch {
    // nothing to delete
  }
})

// ---------- Live spectral visualizer: system audio capture ----------
// Electron has no built-in screen/audio picker the way a real
// browser tab does — a bare navigator.mediaDevices.getDisplayMedia()
// call in the renderer fails outright unless the main process
// explicitly supplies a handler. useSystemPicker lets Windows show
// its own native "choose what to share" dialog (Windows 10/11); if
// that's unavailable on the user's OS/Electron version, this falls
// back to auto-selecting the primary screen with system-audio
// loopback, so live audio still works without a picker UI.
function setupDisplayMediaHandler() {
  session.defaultSession.setDisplayMediaRequestHandler(
    (_request, callback) => {
      desktopCapturer
        .getSources({ types: ['screen'] })
        .then((sources) => {
          callback(sources.length > 0 ? { video: sources[0], audio: 'loopback' } : {})
        })
        .catch(() => callback({}))
    },
    { useSystemPicker: true },
  )
}

app.whenReady().then(() => {
  setupDisplayMediaHandler()
  startOAuthCallbackServer()
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  callbackServer?.close()
  if (process.platform !== 'darwin') app.quit()
})
