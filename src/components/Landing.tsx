import { FolderGit2, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import type { RecentRepo } from '../../electron/recentRepos'
import { usePath } from '../context/PathContext'

interface LandingProps {
  // Called after a repository opens (the Repositories tab uses it to switch to the graph)
  onOpen?: () => void
}

// Repo picker: shown before a repo is open, and in the "Repositories" tab to switch repos
export function Landing({ onOpen }: LandingProps) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [recent, setRecent] = useState<RecentRepo[]>([])
  const { path: currentPath, setPath } = usePath()

  useEffect(() => {
    window.API.path.recent().then(setRecent).catch(console.error)
  }, [])

  // Opens the repository containing `dir`, or containing a folder picked in a dialog
  async function openRepo(dir?: string) {
    setBusy(true)
    setError(null)

    try {
      const target = dir ?? (await window.API.path.select())
      if (!target) return // dialog cancelled

      const root = await window.API.path.set(target)
      if (!root) {
        setError(`No git repository found at ${target}`)
        return
      }
      setPath(root) // App switches over to the visualizer
      onOpen?.()
    } catch (e) {
      setError((e instanceof Error && e.message) || String(e))
    } finally {
      setBusy(false)
    }
  }

  async function forget(repo: string) {
    setRecent(await window.API.path.forget(repo))
  }

  return (
    <div className="flex flex-col items-center justify-center h-full p-8">
      <h1 className="text-3xl font-bold mb-4">Welcome to Git Visualizer</h1>
      <p className="mb-6 text-center max-w-lg">
        Choose a local git repository folder to visualize its branches and commits.
      </p>

      <div className="flex gap-4">
        <button
          onClick={() => openRepo()}
          disabled={busy}
          className="px-4 py-2 rounded bg-slate-800 text-white disabled:opacity-60"
        >
          {busy ? 'Opening...' : 'Open Repository…'}
        </button>
      </div>

      {error && <p className="mt-4 max-w-lg text-sm text-red-500 break-all">Error: {error}</p>}

      {recent.length > 0 && (
        <div className="mt-8 w-full max-w-lg text-left">
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-purple-500">
            Recent repositories
          </h2>
          <ul className="max-h-72 overflow-auto rounded-2xl border-2 border-purple-100 bg-white divide-y divide-purple-50">
            {recent.map((repo) => (
              <li key={repo.path} className="group flex items-center">
                <button
                  onClick={() => openRepo(repo.path)}
                  disabled={busy || !repo.exists}
                  title={repo.path}
                  className="flex-1 min-w-0 flex items-center gap-3 px-4 py-2 text-left enabled:hover:bg-purple-50 disabled:opacity-50"
                >
                  <FolderGit2 className="w-4 h-4 shrink-0 text-purple-500" />
                  <span className="min-w-0">
                    <span className="flex items-center gap-2">
                      <span className="truncate text-sm font-semibold text-purple-800">
                        {repo.name}
                      </span>
                      {repo.path === currentPath && (
                        <span className="shrink-0 rounded-full bg-purple-100 px-2 text-[10px] font-semibold text-purple-600">
                          current
                        </span>
                      )}
                    </span>
                    <span className="block truncate text-xs text-gray-400">
                      {repo.exists ? repo.path : `Folder not found: ${repo.path}`}
                    </span>
                  </span>
                </button>
                <button
                  onClick={() => forget(repo.path)}
                  title="Remove from list"
                  className="mr-2 p-1 rounded-full text-gray-400 opacity-0 group-hover:opacity-100 focus:opacity-100 hover:bg-purple-100 hover:text-purple-700"
                >
                  <X className="w-4 h-4" />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
