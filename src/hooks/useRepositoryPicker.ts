import { useEffect, useState } from 'react'
import type { RecentRepo } from '../../electron/recentRepos'
import { usePath } from '../context/PathContext'

// Opening repositories and the recent list, shared by the welcome screen and the toolbar's
// "Current repository" dropdown. `onOpen` runs after a repository opens.
export function useRepositoryPicker(onOpen?: () => void) {
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
        // The recovery goes on its own line so it can't be misread as part of the path
        setError(
          `No git repository found at ${target}\nChoose the repository's folder, or any folder inside it.`
        )
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

  return { recent, busy, error, currentPath, openRepo, forget }
}
