import { BrowserWindow, dialog, ipcMain } from 'electron'
import {
  getRepoPath,
  git,
  requireRepo,
  setRepoPath,
  type GitRunResult,
  type GitSnapshot
} from './git'

// One commit per line; \x1f can't appear in hashes, ref names or subjects
const HISTORY_FORMAT = ['%H', '%P', '%D', '%s'].join('%x1f')

// Registers every channel the preload bridge (preload.ts) exposes to the renderer
export function registerIpcHandlers(): void {
  // Commit graph of all branches, remote branches, tags and HEAD (stashes excluded), newest first
  ipcMain.handle('git:history', async () => {
    requireRepo()

    const inside = await git(['rev-parse', '--is-inside-work-tree'])
    if (inside.error || inside.stdout.trim() !== 'true') {
      throw new Error('Not a git repository')
    }
    // Unborn HEAD (no commits yet): nothing to draw
    if ((await git(['rev-parse', '--verify', '-q', 'HEAD'])).error) return ''

    const log = await git([
      'log',
      '--branches',
      '--remotes',
      '--tags',
      'HEAD',
      '--date-order',
      '--decorate=full',
      `--pretty=format:${HISTORY_FORMAT}`
    ])
    if (log.error) throw new Error(log.stderr || log.error.message)
    return log.stdout
  })

  // Runs `git <args>` for a user action and reports whether it succeeded
  ipcMain.handle('git:run', async (_event, args: unknown): Promise<GitRunResult> => {
    if (!Array.isArray(args) || !args.every((arg) => typeof arg === 'string')) {
      throw new Error('git:run expects an array of strings')
    }
    requireRepo()

    const { error, stdout, stderr } = await git(args)
    if (error) console.error(`git ${args.join(' ')} failed: ${stderr || error.message}`)
    return { ok: !error, stdout, stderr: error && !stderr ? error.message : stderr }
  })

  // Everything the renderer polls for: status text, recent log, dirty/stash flags, refs key
  ipcMain.handle('git:snapshot', async (): Promise<GitSnapshot> => {
    requireRepo()
    const repo = getRepoPath()

    // Background reads must never take index.lock away from the user's own git commands
    const read = (args: string[]) => git(['--no-optional-locks', ...args])
    const [status, log, porcelain, showRef, symbolicRef] = await Promise.all([
      read(['status']),
      read(['log', '-5', '--pretty=format:%h|%p|%an|%ar|%s']),
      read(['status', '--porcelain']),
      read(['show-ref', '--head']),
      read(['symbolic-ref', '-q', 'HEAD'])
    ])
    const refs = showRef.error ? '' : showRef.stdout

    return {
      repoPath: repo,
      status: status.error ? 'error' : status.stdout,
      logs: log.error ? '' : log.stdout,
      hasChanges: !porcelain.error && porcelain.stdout.trim().length > 0,
      hasStash: /^\S+ refs\/stash$/m.test(refs),
      refsKey: `${refs}\n${symbolicRef.stdout.trim()}`
    }
  })

  ipcMain.handle('path:set', (_event, path: string) => {
    setRepoPath(path)
    return path
  })

  // Native folder picker; resolves to the chosen directory, or null if cancelled
  ipcMain.handle('path:select', async () => {
    const result = await dialog.showOpenDialog({ properties: ['openDirectory'] })
    return result.canceled || result.filePaths.length === 0 ? null : result.filePaths[0]
  })

  ipcMain.handle('window:minimize', (event) => {
    BrowserWindow.fromWebContents(event.sender)?.minimize()
  })
  ipcMain.handle('window:close', (event) => {
    BrowserWindow.fromWebContents(event.sender)?.close()
  })
}
