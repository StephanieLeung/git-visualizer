import { app } from 'electron'
import fs from 'node:fs'
import path from 'node:path'

// A repository opened before, listed on the Landing screen
export interface RecentRepo {
  path: string
  // Folder name, e.g. "git-visualizer"
  name: string
  // False once the folder has been moved or deleted
  exists: boolean
}

// %APPDATA%\<app name>\recent-repos.json on Windows, the app's user-data folder elsewhere
function storeFile(): string {
  return path.join(app.getPath('userData'), 'recent-repos.json')
}

// Windows paths are case-insensitive
function samePath(a: string, b: string): boolean {
  return process.platform === 'win32' ? a.toLowerCase() === b.toLowerCase() : a === b
}

// Paths, most recently opened first; [] if the file is missing or unreadable
function load(): string[] {
  try {
    const data: unknown = JSON.parse(fs.readFileSync(storeFile(), 'utf8'))
    return Array.isArray(data) ? data.filter((p): p is string => typeof p === 'string') : []
  } catch {
    return []
  }
}

function save(paths: string[]): void {
  fs.mkdirSync(path.dirname(storeFile()), { recursive: true })
  fs.writeFileSync(storeFile(), JSON.stringify(paths, null, 2))
}

export function listRecentRepos(): RecentRepo[] {
  return load().map((p) => ({ path: p, name: path.basename(p), exists: fs.existsSync(p) }))
}

// Moves `repo` to the top of the list, adding it if it's new
export function addRecentRepo(repo: string): void {
  save([repo, ...load().filter((p) => !samePath(p, repo))])
}

export function removeRecentRepo(repo: string): void {
  save(load().filter((p) => !samePath(p, repo)))
}
