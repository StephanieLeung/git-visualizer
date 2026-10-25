import { exec, execFile } from 'node:child_process'

// Repository chosen in the renderer; every git command runs with this as its cwd
let repoPath = ''

export function getRepoPath(): string {
  return repoPath
}

export function setRepoPath(path: string): void {
  repoPath = path
  console.log(`repoPath set to ${repoPath}`)
}

export interface GitResult {
  stdout: string
  stderr: string
  error: Error | null
}

// Payload of the git:startup channel
export interface GitSnapshot {
  status: string
  logs: string
}

// Runs git with an explicit argument list (no shell). Never rejects; callers check `error`.
export function git(args: string[]): Promise<GitResult> {
  return new Promise((resolve) => {
    execFile('git', args, { cwd: repoPath }, (error, stdout, stderr) => {
      resolve({ error, stdout, stderr })
    })
  })
}

// Runs `git <command>` through the system shell so callers can pass free-form, shell-quoted
// arguments (e.g. `commit -m "msg"`). Never rejects; callers check `error`.
export function gitShell(command: string): Promise<GitResult> {
  return new Promise((resolve) => {
    exec(`git ${command}`, { cwd: repoPath }, (error, stdout, stderr) => {
      resolve({ error, stdout, stderr })
    })
  })
}
