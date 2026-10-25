import { BrowserWindow, dialog, ipcMain, nativeTheme, shell } from 'electron'
import { pathToFileURL } from 'node:url'
import {
  getRepoPath,
  git,
  repoRoot,
  requireRepo,
  setRepoPath,
  type GitRunResult,
  type GitSnapshot
} from './git'
import { addRecentRepo, listRecentRepos, removeRecentRepo } from './recentRepos'
import { getThemePreference, isThemePreference, setThemePreference } from './settings'

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

  // Local branches with no commits of their own yet: still on the commit they were created at.
  // That means a reflog holding only its "branch: Created from …" entry and no upstream (a branch
  // checked out from a remote one starts with the remote's commits)
  ipcMain.handle('git:newBranches', async (): Promise<string[]> => {
    requireRepo()
    const heads = await git([
      'for-each-ref',
      '--format=%(refname:short)%00%(upstream)',
      'refs/heads'
    ])
    if (heads.error) return []

    const candidates = heads.stdout
      .split('\n')
      .map((line) => line.split('\0'))
      .filter(([name, upstream]) => name && !upstream)
      .map(([name]) => name)

    const fresh = await Promise.all(
      candidates.map(async (name) => {
        const reflog = await git(['reflog', 'show', '--format=%gs', `refs/heads/${name}`])
        const entries = reflog.stdout.split('\n').filter(Boolean)
        const created = entries.length === 1 && entries[0].startsWith('branch: Created from')
        return !reflog.error && created ? name : null
      })
    )
    return fresh.filter((name): name is string => name !== null)
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

  // Opens the repository containing `dir` and records it in the recent list. Resolves to the
  // repository's top-level folder, or null if `dir` isn't inside one.
  ipcMain.handle('path:set', async (_event, dir: string) => {
    const root = await repoRoot(dir)
    if (!root) return null
    setRepoPath(root)
    addRecentRepo(root)
    return root
  })

  // Native folder picker; resolves to the chosen directory, or null if cancelled
  ipcMain.handle('path:select', async () => {
    const result = await dialog.showOpenDialog({ properties: ['openDirectory'] })
    return result.canceled || result.filePaths.length === 0 ? null : result.filePaths[0]
  })

  ipcMain.handle('path:recent', () => listRecentRepos())

  // Drops a repository from the recent list (the folder itself is untouched)
  ipcMain.handle('path:forget', (_event, repo: string) => {
    removeRecentRepo(repo)
    return listRecentRepos()
  })

  // Opens the current repository through VS Code's URL handler, so `code` needn't be on PATH
  ipcMain.handle('open:vscode', async () => {
    requireRepo()
    // pathToFileURL percent-encodes spaces, # and %; the trailing slash opens it as a folder.
    // windowId=_blank forces a new window; otherwise VS Code replaces the last active window's
    // folder (often the one this app was launched from)
    const url = `vscode://file${pathToFileURL(getRepoPath()).pathname}/?windowId=_blank`
    try {
      await shell.openExternal(url)
    } catch (err) {
      dialog.showErrorBox(
        "Couldn't open VS Code",
        `Make sure Visual Studio Code is installed.\n\n${err instanceof Error ? err.message : String(err)}`
      )
    }
  })

  // Opens the current repository's folder in Explorer / Finder / the file manager
  ipcMain.handle('open:folder', async () => {
    requireRepo()
    const error = await shell.openPath(getRepoPath())
    if (error) dialog.showErrorBox("Couldn't open the folder", error)
  })

  ipcMain.handle('theme:get', () => getThemePreference())

  // Applies and saves the theme. nativeTheme switches the renderer's prefers-color-scheme, which
  // the CSS theme tokens follow.
  ipcMain.handle('theme:set', (_event, theme: unknown) => {
    if (!isThemePreference(theme)) throw new Error(`Unknown theme: ${String(theme)}`)
    nativeTheme.themeSource = theme
    setThemePreference(theme)
  })

  ipcMain.handle('window:minimize', (event) => {
    BrowserWindow.fromWebContents(event.sender)?.minimize()
  })
  ipcMain.handle('window:close', (event) => {
    BrowserWindow.fromWebContents(event.sender)?.close()
  })
}
