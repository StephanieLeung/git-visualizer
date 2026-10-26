import { useEffect, useRef, useState } from 'react'
import type { ResetInfo } from '../../../electron/git'
import { useGit } from '../../context/GitContext'
import type { ResetMode } from '../../hooks/useGitActions'
import { Button } from '../ui/button'
import { Dialog, DialogFooter } from '../ui/dialog'
import { ErrorFlash, WarningFlash } from '../ui/flash'

interface ResetDialogProps {
  // The commit to reset the current branch to; null while the dialog is closed
  target: { hash: string; message: string } | null
  branch: string
  onCancel: () => void
  onConfirm: (mode: ResetMode) => void
}

// "The 3 commits", or "The commit" when there's one
const commitCount = (n: number) => (n === 1 ? 'The commit' : `The ${n} commits`)

// Confirms a reset of the current branch to an earlier commit, and whether the removed commits'
// changes are kept (--soft) or thrown away (--hard). It says how many commits come off the branch,
// warns when some are already pushed, and shows the exact command.
export function ResetDialog({ target, branch, onCancel, onConfirm }: ResetDialogProps) {
  const { hasChanges } = useGit()
  const [mode, setMode] = useState<ResetMode>('soft')
  const [info, setInfo] = useState<ResetInfo | null>(null)
  const keepRef = useRef<HTMLInputElement>(null)
  const hash = target?.hash

  // Every opening starts on the safe choice, with fresh counts
  useEffect(() => {
    setMode('soft')
    setInfo(null)
    if (!hash) return
    let current = true
    window.API.git
      .resetInfo(hash)
      .then((result) => {
        if (current) setInfo(result)
      })
      .catch(console.error)
    return () => {
      current = false
    }
  }, [hash])

  const discard = mode === 'hard'
  // Wording for one removed commit or several
  const one = info?.commits === 1
  const options: { value: ResetMode; label: string; description: string }[] = [
    {
      value: 'soft',
      label: 'Keep the changes',
      description: `Everything ${one ? 'it' : 'they'} changed stays as uncommitted changes, ready to commit again.`
    },
    {
      value: 'hard',
      label: 'Discard the changes',
      description: `${one ? 'Its' : 'Their'} changes are thrown away, along with any uncommitted changes to tracked files. Untracked files are kept.`
    }
  ]

  const confirm = (
    <Button key="confirm" variant={discard ? 'danger' : 'primary'} onClick={() => onConfirm(mode)}>
      {discard ? 'Discard and reset' : `Reset ${branch}`}
    </Button>
  )
  const cancel = (
    <Button key="cancel" onClick={onCancel}>
      Cancel
    </Button>
  )

  return (
    <Dialog
      open={target !== null}
      onClose={onCancel}
      title={`Reset ${branch} to this commit`}
      id="reset-dialog"
      role="alertdialog"
      initialFocusRef={keepRef}
    >
      {target && (
        <>
          <div id="reset-dialog-body" className="space-y-3 p-4 text-xs">
            <p className="flex min-w-0 items-baseline gap-2">
              <code className="shrink-0 rounded-md border border-border px-1.5 font-mono text-[11px] text-fg-muted">
                {target.hash.slice(0, 7)}
              </code>
              <span className="truncate">{target.message}</span>
            </p>
            <p className="text-fg-muted">
              {info ? (
                <>
                  {commitCount(info.commits)} after this one will be removed from{' '}
                  <strong className="font-semibold text-fg">{branch}</strong>.
                </>
              ) : (
                'Counting the commits after this one…'
              )}
            </p>
            {info && info.pushed > 0 && (
              <WarningFlash>
                {info.pushed === info.commits
                  ? info.commits === 1
                    ? 'It is'
                    : 'All of them are'
                  : `${info.pushed} of them are`}{' '}
                already on {info.upstream}. After the reset, Push will be rejected, because this app
                doesn&apos;t force-push, and Pull would bring them back.
              </WarningFlash>
            )}

            <fieldset>
              <legend className="mb-1 font-semibold text-fg">
                What should happen to {one ? 'its' : 'their'} changes?
              </legend>
              {options.map((option) => (
                <label key={option.value} className="flex cursor-pointer gap-2 py-1.5">
                  <input
                    ref={option.value === 'soft' ? keepRef : undefined}
                    type="radio"
                    name="reset-mode"
                    value={option.value}
                    checked={mode === option.value}
                    onChange={() => setMode(option.value)}
                    className="mt-0.5 shrink-0 accent-accent"
                  />
                  <span>
                    <span className="block font-semibold text-fg">{option.label}</span>
                    <span className="block text-fg-muted">{option.description}</span>
                  </span>
                </label>
              ))}
            </fieldset>

            {discard && hasChanges && (
              <ErrorFlash>
                You have uncommitted changes. Discarding deletes them for good; git can&apos;t bring
                them back.
              </ErrorFlash>
            )}
            <p className="font-mono text-[11px] text-fg-muted [overflow-wrap:anywhere]">
              $ git reset --{mode} {target.hash}
            </p>
          </div>
          {/* GitHub Desktop's order: Cancel last on Windows and Linux, first on macOS */}
          <DialogFooter>
            {window.API.platform === 'darwin' ? [cancel, confirm] : [confirm, cancel]}
          </DialogFooter>
        </>
      )}
    </Dialog>
  )
}
