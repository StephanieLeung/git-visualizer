import { app } from 'electron'
import fs from 'node:fs'
import path from 'node:path'

// 'system' follows the OS light/dark setting
export type ThemePreference = 'light' | 'dark' | 'system'

const THEMES: readonly ThemePreference[] = ['light', 'dark', 'system']

interface Settings {
  theme: ThemePreference
}

const DEFAULTS: Settings = { theme: 'system' }

export function isThemePreference(value: unknown): value is ThemePreference {
  return THEMES.includes(value as ThemePreference)
}

// %APPDATA%\<app name>\settings.json on Windows, the app's user-data folder elsewhere
function storeFile(): string {
  return path.join(app.getPath('userData'), 'settings.json')
}

// Saved settings over the defaults; the defaults alone if the file is missing or unreadable
function load(): Settings {
  try {
    const data: unknown = JSON.parse(fs.readFileSync(storeFile(), 'utf8'))
    const theme = (data as Partial<Settings> | null)?.theme
    return { ...DEFAULTS, ...(isThemePreference(theme) ? { theme } : {}) }
  } catch {
    return { ...DEFAULTS }
  }
}

function save(settings: Settings): void {
  fs.mkdirSync(path.dirname(storeFile()), { recursive: true })
  fs.writeFileSync(storeFile(), JSON.stringify(settings, null, 2))
}

export function getThemePreference(): ThemePreference {
  return load().theme
}

export function setThemePreference(theme: ThemePreference): void {
  save({ ...load(), theme })
}
