import { useState } from 'react'
import { usePath } from '../context/PathContext'

// Repo picker: shown before a repo is open, and in the "Landing" tab to switch repos
export function Landing() {
  const [busy, setBusy] = useState(false)
  const [selectedPath, setSelectedPath] = useState('')
  const [error, setError] = useState<string | null>(null)
  const { setPath } = usePath()

  async function chooseRepository() {
    setBusy(true)
    setError(null)

    try {
      const path = await window.API.path.select()
      if (!path) return // dialog cancelled

      setSelectedPath(path)
      await window.API.path.set(path)
      setPath(path) // App switches over to the visualizer
    } catch (e) {
      setError((e instanceof Error && e.message) || String(e))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex flex-col items-center justify-center h-full p-8">
      <h1 className="text-3xl font-bold mb-4">Welcome to Git Visualizer</h1>
      <p className="mb-6 text-center max-w-lg">
        Choose a local git repository folder to visualize its branches and commits.
      </p>

      <div className="flex gap-4">
        <button
          onClick={chooseRepository}
          disabled={busy}
          className="px-4 py-2 rounded bg-slate-800 text-white disabled:opacity-60"
        >
          {busy ? 'Opening...' : 'Open Repository…'}
        </button>
      </div>

      {selectedPath && <p className="mt-4 text-xs break-all">Selected: {selectedPath}</p>}

      {error && <p className="mt-4 text-sm text-red-500">Error: {error}</p>}

      <p className="mt-6 text-xs text-gray-400">
        Tip: select the top-level folder that contains the `.git` directory.
      </p>
    </div>
  )
}
