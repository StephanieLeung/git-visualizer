import { useMemo } from 'react'
import { useGit } from '../context/GitContext'
import { useTerminal, type RunOptions } from '../context/TerminalContext'
import type { CheckoutTarget } from '../services/gitHistory'

export type ResetMode = 'soft' | 'hard'

// Every action that changes the repo. Each one is echoed in the TerminalPanel and followed by a
// refresh of the git state, which in turn redraws the graph if any refs moved.
export function useGitActions() {
  const { refetchGit, withAnimation } = useGit()
  const { run } = useTerminal()

  return useMemo(() => {
    const mutate = async (args: string[], options?: RunOptions) => {
      const result = await run(args, options)
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
      checkout: (target: CheckoutTarget) => mutate(target.args),
      // Creates the branch at `startPoint` (a commit hash, so no upstream gets set) and switches to
      // it. No error dialog: NewBranchForm shows a rejected name under its field.
      createBranch: (name: string, startPoint: string) =>
        mutate(['checkout', '-b', name, startPoint], { showErrorDialog: false }),
      // Moves the current branch back to `hash`. soft keeps the removed commits' changes as
      // uncommitted changes; hard throws them away, with any uncommitted changes to tracked files
      reset: (hash: string, mode: ResetMode) => mutate(['reset', `--${mode}`, hash])
    }
  }, [run, refetchGit, withAnimation])
}
