import { contextBridge, ipcRenderer } from 'electron'
import type { GitSnapshot } from './git'

// Typed bridge exposed to the renderer as `window.API`; each method maps 1:1 to a channel in ipc.ts
const api = {
  git: {
    // Runs `git <command>` in the repo; always resolves with stdout, even when git fails
    run: (command: string): Promise<string> => ipcRenderer.invoke('git:run', command),
    // Raw `git log --all` output for the DAG (parsed by src/services/gitHistory.ts)
    getHistory: (): Promise<string> => ipcRenderer.invoke('git:getHistory'),
    // `git status` text plus the last 5 commits
    startup: (): Promise<GitSnapshot> => ipcRenderer.invoke('git:startup'),
    hasChanges: (): Promise<boolean> => ipcRenderer.invoke('git:hasChanges')
  },
  path: {
    // Sets the repository every git command runs in
    set: (path: string): Promise<string> => ipcRenderer.invoke('path:set', path),
    // Opens a native folder picker; resolves to the chosen path, or null if cancelled
    select: (): Promise<string | null> => ipcRenderer.invoke('path:select')
  },
  window: {
    minimize: (): Promise<void> => ipcRenderer.invoke('window:minimize'),
    close: (): Promise<void> => ipcRenderer.invoke('window:close')
  }
}

export type Api = typeof api

contextBridge.exposeInMainWorld('API', api)
