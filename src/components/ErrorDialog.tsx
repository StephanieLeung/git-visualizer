import { StopIcon } from '@primer/octicons-react'
import { useRef } from 'react'
import { useTerminal } from '../context/TerminalContext'
import { Button } from './ui/button'
import { Dialog, DialogFooter } from './ui/dialog'

// The dialog's title for a failed command, in GitHub Desktop's wording where it has one
function failureTitle([command, option]: string[]): string {
  switch (command) {
    case 'push':
      return 'Failed to push'
    case 'pull':
      return 'Failed to pull'
    // A commit stages everything first, so a failed `add` is a failed commit too
    case 'add':
    case 'commit':
      return 'Commit failed'
    case 'stash':
      return option === 'pop' ? 'Failed to unstash' : 'Failed to stash'
    case 'checkout':
      return option === '-b' ? 'Failed to create branch' : 'Failed to switch branch'
    case 'reset':
      return 'Failed to reset'
    default:
      return 'Error'
  }
}

// GitHub Desktop-style error dialog with git's own output. TerminalContext opens it when a
// command fails.
export function ErrorDialog() {
  const { failure, dismissFailure } = useTerminal()
  const closeRef = useRef<HTMLButtonElement>(null)

  return (
    <Dialog
      open={failure !== null}
      onClose={dismissFailure}
      title={failure ? failureTitle(failure.args) : ''}
      id="error-dialog"
      role="alertdialog"
      initialFocusRef={closeRef}
    >
      {failure && (
        <>
          <div id="error-dialog-body" className="flex gap-4 p-4">
            <StopIcon size={24} className="shrink-0 text-danger-fg" />
            <div className="min-w-0 flex-1 text-xs">
              <p className="[overflow-wrap:anywhere]">
                <code className="font-mono">{failure.command}</code> failed.
              </p>
              <pre className="mt-2 max-h-72 overflow-auto rounded-md border border-border bg-canvas-subtle p-2 font-mono text-[11px] whitespace-pre-wrap [overflow-wrap:anywhere]">
                {failure.output || "Git didn't say why."}
              </pre>
            </div>
          </div>
          <DialogFooter>
            <Button ref={closeRef} variant="primary" onClick={dismissFailure}>
              Close
            </Button>
          </DialogFooter>
        </>
      )}
    </Dialog>
  )
}
