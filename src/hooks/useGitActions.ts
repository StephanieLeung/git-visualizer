import { useMemo } from 'react'
import { useGit } from '../context/GitContext'
import { useTerminal } from '../context/TerminalContext'
import type { CheckoutTarget } from '../services/gitHistory'

// Every action that changes the repo. Each one is echoed in the TerminalPanel and followed by a
// refresh of the git state, which in turn redraws the graph if any refs moved.
export function useGitActions() {
  const { refetchGit, withAnimation } = useGit()
  const { run } = useTerminal()

  return useMemo(() => {
    const mutate = async (args: string[]) => {
      const result = await run(args)
      await refetchGit()
      return result
    }

    return {
      // Stages everything, untracked files included, then commits
      commit: async (message: string) => {
        const staged = await run(['add', '-A'])
        if (!staged.ok) {
          await refetchGit()
          return staged
        }
        return mutate(['commit', '-m', message])
      },
      // -u gives a newly pushed branch an upstream, so pulling it later works
      push: () => withAnimation('pushing', () => mutate(['push', '-u', 'origin', 'HEAD'])),
      pull: () => withAnimation('pulling', () => mutate(['pull'])),
      // -u includes untracked files, matching what counts as "changes"
      stash: () => mutate(['stash', '-u']),
      unstash: () => mutate(['stash', 'pop']),
      checkout: (target: CheckoutTarget) => mutate(target.args)
    }
  }, [run, refetchGit, withAnimation])
}
