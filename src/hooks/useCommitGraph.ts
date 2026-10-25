import { useEffect, useState } from 'react'
import { useGit } from '../context/GitContext'
import { layoutGraph, type GraphLayout } from '../services/dagLayout'
import { fetchCommits } from '../services/gitHistory'

// Laid-out commit graph of the open repo, reloaded whenever a ref moves
export function useCommitGraph() {
  const { ready, refsKey } = useGit()
  const [layout, setLayout] = useState<GraphLayout | null>(null)

  useEffect(() => {
    if (!ready) return
    let cancelled = false
    fetchCommits().then((commits) => {
      if (!cancelled) setLayout(layoutGraph(commits))
    })
    return () => {
      cancelled = true
    }
  }, [ready, refsKey])

  return layout
}
