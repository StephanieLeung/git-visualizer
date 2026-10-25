import { app, BrowserWindow, nativeTheme } from 'electron'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { registerIpcHandlers } from './ipc'
import { getThemePreference } from './settings'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// APP_ROOT holds dist/ (renderer build) and dist-electron/ (main.js, preload.mjs)
process.env.APP_ROOT = path.join(__dirname, '..')

// Bracket access keeps vite:define from inlining the value at build time
const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL']
const RENDERER_DIST = path.join(process.env.APP_ROOT, 'dist')

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL
  ? path.join(process.env.APP_ROOT, 'public')
  : RENDERER_DIST

// The renderer's canvas colours (--color-canvas in src/index.css), shown before it first paints
function windowBackground(): string {
  return nativeTheme.shouldUseDarkColors ? '#24292e' : '#ffffff'
}

function createWindow() {
  const win = new BrowserWindow({
    icon: path.join(process.env.VITE_PUBLIC, 'electron-vite.svg'),
    // GitHub Desktop's default window size (desktop/desktop, app/src/main-process/app-window.ts)
    width: 960,
    height: 660,
    minWidth: 720,
    minHeight: 480,
    backgroundColor: windowBackground(),
    // Frameless: the renderer draws its own title bar (src/components/TitleBar.tsx)
    frame: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.mjs'),
      nodeIntegration: true
    }
  })

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL)
  } else {
    win.loadFile(path.join(RENDERER_DIST, 'index.html'))
  }
}

// Quit when all windows close, except on macOS where apps stay active until Cmd+Q
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

// macOS: re-create the window when the dock icon is clicked and none are open
app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow()
})

// Theme changed in the app or, while following the system, in the OS
nativeTheme.on('updated', () => {
  for (const win of BrowserWindow.getAllWindows()) win.setBackgroundColor(windowBackground())
})

app
  .whenReady()
  .then(() => {
    // Also drives the renderer's prefers-color-scheme, which the CSS theme follows
    nativeTheme.themeSource = getThemePreference()
    registerIpcHandlers()
    createWindow()
  })
  .catch((e) => console.error(e))
