import { useEffect, useState } from 'react'
import { useGit } from '../context/GitContext'
import { useTerminal } from '../context/TerminalContext'
import { DAGLayout, type LayoutNode } from '../services/dagLayout'
import { fetchCommits } from '../services/gitHistory'

// Fetches the full history and lays it out as a DAG
async function loadLayout() {
  const commits = await fetchCommits()
  return { commits, nodes: new DAGLayout(commits).getLayout() }
}

// Data side of the DAG view: positioned nodes, the HEAD commit, and branch checkout
export function useCommitGraph() {
  const [layoutNodes, setLayoutNodes] = useState<LayoutNode[]>([])
  const [loading, setLoading] = useState(true)
  const [currentCommit, setCurrentCommit] = useState<string | null>(null)
  const [checkingOutBranch, setCheckingOutBranch] = useState<string | null>(null)
  const { status, refetchGit } = useGit()
  const { setCommand } = useTerminal()

  // Rebuild whenever the `git status` text changes (checkout, commit, stash...). The refetch
  // below can itself change status, in which case this runs once more.
  useEffect(() => {
    async function buildGraph() {
      setLoading(true)
      try {
        await refetchGit()

        const { commits, nodes } = await loadLayout()
        setLayoutNodes(nodes)

        const head = (await window.API.git.run('rev-parse HEAD')).trim()
        const headCommit = commits.find((c) => c.hash === head)
        if (headCommit) setCurrentCommit(headCommit.hash)
      } catch (err) {
        console.error('Error building DAG:', err)
      } finally {
        setLoading(false)
      }
    }

    buildGraph()
  }, [status, refetchGit])

  async function checkoutBranch(branchName: string) {
    setCheckingOutBranch(branchName)
    try {
      setCommand(`git checkout ${branchName}`)
      await window.API.git.run(`checkout ${branchName}`)

      const { commits, nodes } = await loadLayout()
      setLayoutNodes(nodes)

      // TODO: unlike buildGraph this guesses HEAD from ref names, which can also match origin/HEAD
      const headCommit = commits.find((c) => c.refs.some((r) => r.includes('HEAD')))
      if (headCommit) setCurrentCommit(headCommit.hash)

      // Refresh status/dirty state (which also triggers a rebuild if status changed)
      await refetchGit()
    } catch (err) {
      console.error(`Error checking out ${branchName}:`, err)
      alert(`Failed to checkout ${branchName}: ${err}`)
    } finally {
      setCheckingOutBranch(null)
    }
  }

  return { layoutNodes, loading, currentCommit, checkingOutBranch, checkoutBranch }
}
