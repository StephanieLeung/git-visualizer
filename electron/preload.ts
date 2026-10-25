import { contextBridge, ipcRenderer } from 'electron'
import type { GitRunResult, GitSnapshot } from './git'

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
