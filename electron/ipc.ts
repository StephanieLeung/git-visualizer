import { BrowserWindow, dialog, ipcMain } from 'electron'
import { getRepoPath, git, gitShell, setRepoPath, type GitSnapshot } from './git'

// Registers every channel the preload bridge (preload.ts) exposes to the renderer
export function registerIpcHandlers(): void {
  // Full history for the DAG view, one "<hash>|<parents>|<refs>|<subject>" line per commit
  ipcMain.handle('git:getHistory', async () => {
    if (!getRepoPath()) throw new Error('repoPath not set')

    const inside = await git(['rev-parse', '--is-inside-work-tree'])
    if (inside.error || inside.stdout.trim() !== 'true') {
      throw new Error('Not a git repository at repoPath')
    }

    const log = await git([
      'log',
      '--all',
      '--parents',
      '--date-order',
      '--pretty=format:%H|%P|%D|%s'
    ])
    if (log.error) throw new Error(log.stderr || log.error.message)
    return log.stdout
  })

  // Runs an arbitrary `git <command>` line and always resolves with stdout, even on failure.
  // TODO: shell interpolation breaks on quotes in arguments and allows injection; callers can't see failures
  ipcMain.handle('git:run', async (_event, command: string): Promise<string> => {
    const { error, stdout, stderr } = await gitShell(command)
    if (error) {
      console.error(`Error executing git command: ${stderr || error.message}`)
    } else {
      console.log(`Git command output: ${stdout}`)
    }
    return stdout
  })

  // `git status` text plus the last 5 commits, for the Log tab
  ipcMain.handle('git:startup', async (): Promise<GitSnapshot> => {
    const statusResult = await git(['status'])
    const status = statusResult.error ? 'error' : statusResult.stdout

    const log = await git(['log', '-5', '--pretty=format:%h|%p|%an|%ar|%s'])
    if (log.error) throw log.error
    return { status, logs: log.stdout }
  })

  // True when the working tree has staged, unstaged or untracked changes
  ipcMain.handle('git:hasChanges', async () => {
    if (!getRepoPath()) throw new Error('repoPath not set')

    const { error, stdout, stderr } = await git(['status', '--porcelain'])
    if (error) throw new Error(stderr || error.message)
    return stdout.trim().length > 0
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
