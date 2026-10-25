import { ArchiveIcon, ArrowDownIcon, ArrowUpIcon, UndoIcon } from '@primer/octicons-react'
import { useState, type FormEvent } from 'react'
import { useGit } from '../../context/GitContext'
import { useGitActions } from '../../hooks/useGitActions'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Spinner } from '../ui/spinner'

interface GitActionsPanelProps {
  // Branch HEAD is on, for the commit button; undefined when detached
  branch?: string
  // Called once an action starts, or after a commit succeeds, so the card holding it can close
  onDone: () => void
  // id for the summary field
  inputId: string
}

// The git actions for HEAD: a commit box, then push, pull, stash and unstash. Shown in HEAD's
// card (which LittleMan's button also opens).
export function GitActionsPanel({ branch, onDone, inputId }: GitActionsPanelProps) {
  const { hasChanges, hasStash } = useGit()
  const actions = useGitActions()
  const [commitMessage, setCommitMessage] = useState('')
  const [committing, setCommitting] = useState(false)

  const menuActions = [
    { label: 'Push', icon: ArrowUpIcon, run: actions.push, disabled: false },
    { label: 'Pull', icon: ArrowDownIcon, run: actions.pull, disabled: false },
    { label: 'Stash', icon: ArchiveIcon, run: actions.stash, disabled: !hasChanges },
    { label: 'Unstash', icon: UndoIcon, run: actions.unstash, disabled: !hasStash }
  ]

  const canCommit = hasChanges && commitMessage.trim() !== '' && !committing

  async function handleCommit(event: FormEvent) {
    event.preventDefault()
    if (!canCommit) return
    setCommitting(true)
    const result = await actions.commit(commitMessage.trim())
    setCommitting(false)
    if (result.ok) {
      setCommitMessage('')
      onDone()
    }
  }

  return (
    <>
      <form onSubmit={handleCommit} className="p-3">
        <label htmlFor={inputId} className="mb-1.5 block text-xs font-semibold text-fg">
          Commit
        </label>
        <Input
          id={inputId}
          value={commitMessage}
          onChange={(e) => setCommitMessage(e.target.value)}
          placeholder="Summary (required)"
        />
        {!hasChanges && <p className="mt-1.5 text-[11px] text-fg-muted">No changes to commit</p>}
        <Button
          type="submit"
          variant="primary"
          disabled={!canCommit}
          className="mt-2 w-full min-w-0 font-normal"
        >
          {committing ? (
            <>
              <Spinner className="size-3" />
              Committing…
            </>
          ) : branch ? (
            <span className="truncate">
              Commit to <strong className="font-semibold">{branch}</strong>
            </span>
          ) : (
            'Commit'
          )}
        </Button>
      </form>

      <div className="border-t border-border py-1">
        {menuActions.map(({ label, icon: ActionIcon, run, disabled }) => (
          <button
            key={label}
            disabled={disabled}
            className="flex h-8 w-full items-center gap-2 px-3 text-left text-xs text-fg enabled:hover:bg-hover disabled:text-fg-subtle"
            onClick={() => {
              onDone()
              run()
            }}
          >
            <ActionIcon size={16} className={disabled ? 'text-fg-subtle' : 'text-fg-muted'} />
            {label}
          </button>
        ))}
      </div>
    </>
  )
}
