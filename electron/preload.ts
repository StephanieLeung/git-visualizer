import { contextBridge, ipcRenderer } from 'electron'
import type { GitRunResult, GitSnapshot } from './git'
import type { RecentRepo } from './recentRepos'
import type { ThemePreference } from './settings'

// Typed bridge exposed to the renderer as `window.API`; each method maps 1:1 to a channel in ipc.ts
const api = {
  git: {
    // Runs git with these arguments in the selected repo (no shell) and reports the outcome
    run: (args: string[]): Promise<GitRunResult> => ipcRenderer.invoke('git:run', args),
    // Raw commit graph output (parsed by src/services/gitHistory.ts)
    history: (): Promise<string> => ipcRenderer.invoke('git:history'),
    // Status, recent log, dirty/stash flags and a key that changes whenever refs move
    snapshot: (): Promise<GitSnapshot> => ipcRenderer.invoke('git:snapshot')
  },
  path: {
    // Opens the repository containing `dir` (every git command then runs there) and adds it to
    // the recent list; resolves to its top-level folder, or null if `dir` isn't in a repository
    set: (dir: string): Promise<string | null> => ipcRenderer.invoke('path:set', dir),
    // Opens a native folder picker; resolves to the chosen path, or null if cancelled
    select: (): Promise<string | null> => ipcRenderer.invoke('path:select'),
    // Repositories opened before, most recent first
    recent: (): Promise<RecentRepo[]> => ipcRenderer.invoke('path:recent'),
    // Removes a repository from the recent list; resolves to the updated list
    forget: (repo: string): Promise<RecentRepo[]> => ipcRenderer.invoke('path:forget', repo)
  },
  open: {
    // Opens the current repository in VS Code
    vscode: (): Promise<void> => ipcRenderer.invoke('open:vscode'),
    // Opens the current repository's folder in the system file manager
    folder: (): Promise<void> => ipcRenderer.invoke('open:folder')
  },
  theme: {
    // Saved theme preference ('system' unless the user picked one)
    get: (): Promise<ThemePreference> => ipcRenderer.invoke('theme:get'),
    // Switches the app to this theme and saves it
    set: (theme: ThemePreference): Promise<void> => ipcRenderer.invoke('theme:set', theme)
  },
  // 'win32', 'darwin', 'linux', ...
  platform: process.platform,
  window: {
    minimize: (): Promise<void> => ipcRenderer.invoke('window:minimize'),
    close: (): Promise<void> => ipcRenderer.invoke('window:close')
  }
}

export type Api = typeof api

contextBridge.exposeInMainWorld('API', api)
