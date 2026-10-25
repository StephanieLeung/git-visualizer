import { execFile } from 'node:child_process'
import path from 'node:path'

// Large enough for `git log` over big histories (execFile's default is 1 MB)
const MAX_BUFFER = 64 * 1024 * 1024

// Repository chosen in the renderer; every git command runs with this as its cwd
let repoPath = ''

export function getRepoPath(): string {
  return repoPath
}

export function setRepoPath(path: string): void {
  repoPath = path
  console.log(`repoPath set to ${repoPath}`)
}

// Throws unless the renderer has selected a repository
export function requireRepo(): void {
  if (!repoPath) throw new Error('No repository selected')
}

export interface GitResult {
  stdout: string
  stderr: string
  error: Error | null
}

// Outcome of a command the user triggered (git:run)
export interface GitRunResult {
  ok: boolean
  stdout: string
  stderr: string
}

// Polled repo state (git:snapshot)
export interface GitSnapshot {
  repoPath: string
  // `git status` text, or 'error' if it failed
  status: string
  // Last 5 commits as "<hash>|<parents>|<author>|<when>|<subject>" lines
  logs: string
  // Staged, unstaged or untracked changes
  hasChanges: boolean
  hasStash: boolean
  // Changes whenever any ref moves or HEAD switches branch
  refsKey: string
}

// Runs git with an explicit argument list (no shell), in the selected repo unless `cwd` is given.
// Never rejects; callers check `error`.
export function git(args: string[], cwd = repoPath): Promise<GitResult> {
  return new Promise((resolve) => {
    execFile('git', args, { cwd, maxBuffer: MAX_BUFFER }, (error, stdout, stderr) => {
      resolve({ error, stdout, stderr })
    })
  })
}

// Top-level folder of the repository containing `dir`, or null if `dir` isn't inside a work tree
// (or doesn't exist)
export async function repoRoot(dir: string): Promise<string | null> {
  const { error, stdout } = await git(['rev-parse', '--show-toplevel'], dir)
  // git prints forward slashes on Windows; normalize to the platform's separators
  return error || !stdout.trim() ? null : path.normalize(stdout.trim())
}
