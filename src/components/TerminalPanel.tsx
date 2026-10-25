import { CheckIcon, TerminalIcon, XIcon } from '@primer/octicons-react'
import { useTerminal } from '../context/TerminalContext'
import { Spinner } from './ui/spinner'
import { cn } from './ui/utils'

// Status bar showing the last git command the UI ran and how it went. A failure's details are in
// the error dialog, which the Failed button reopens.
export function TerminalPanel() {
  const { command, status, summary, output, showLastFailure } = useTerminal()

  return (
    <footer className="flex h-7 shrink-0 items-center gap-2 border-t border-border bg-canvas-subtle px-3 text-xs">
      <TerminalIcon size={16} className="shrink-0 text-fg-muted" />
      <span className="shrink-0 select-none font-mono text-fg-muted">$</span>
      {command ? (
        <span title={command} className="min-w-0 flex-1 truncate font-mono text-fg">
          {command}
        </span>
      ) : (
        <span className="min-w-0 flex-1 truncate text-fg-muted">No commands run yet</span>
      )}

      {/* Announced to screen readers as each command finishes */}
      <span aria-live="polite" className="flex max-w-[50%] min-w-0 shrink-0 justify-end">
        {status === 'error' && (
          <button
            title="Show the error"
            onClick={showLastFailure}
            className="flex shrink-0 items-center gap-1.5 rounded-sm px-1 font-mono text-danger-fg hover:underline"
          >
            <XIcon size={16} className="shrink-0" />
            Failed
          </button>
        )}
        {(status === 'running' || status === 'ok') && (
          <span
            title={output || summary}
            className={cn(
              'flex min-w-0 items-center gap-1.5 font-mono',
              status === 'running' ? 'text-fg-muted' : 'text-success-fg'
            )}
          >
            {status === 'running' ? (
              <Spinner className="size-3" />
            ) : (
              <CheckIcon size={16} className="shrink-0" />
            )}
            <span className="truncate">{status === 'running' ? 'running' : summary}</span>
          </span>
        )}
      </span>
    </footer>
  )
}
