import { GitBranchIcon, GitCommitIcon } from '@primer/octicons-react'
import type { MouseEvent, Ref } from 'react'
import type { GitRef } from '../../services/gitHistory'
import { Button } from '../ui/button'
import { Spinner } from '../ui/spinner'
import { cn } from '../ui/utils'
import { GitActionsPanel } from './GitActionsPanel'
import { RefLabels } from './RefLabel'

export const CARD_WIDTH = 320
// Tallest each kind of card gets; the graph leaves room for them under its last rows
export const TIP_CARD_HEIGHT = 150
export const HEAD_CARD_HEIGHT = 400

interface CommitCardProps {
  // Top-left corner, in the graph canvas's pixels
  left: number
  top: number
  // A tip's card switches to its branch; HEAD's card holds the git actions
  kind: 'head' | 'tip'
  hash: string
  refs: GitRef[]
  detached: boolean
  message: string
  // Lets DAGGraph tell when the pointer moves between a row and its card
  containerRef: Ref<HTMLDivElement>
  onMouseLeave: (event: MouseEvent) => void
  // Clicking or focusing inside the card pins it, so it can't vanish mid-use
  onPin: () => void
  // Closes the card once an action has started or finished
  onDone: () => void
  // Tip only: the switch button's label, whether that checkout is running, and running it
  action?: string
  busy?: boolean
  onSwitch?: () => void
  // HEAD only: the branch for the commit button
  branch?: string
}

// GitHub-style card for HEAD and for commits that can be checked out; it appears on hover and
// stays when its row is clicked
export function CommitCard({
  left,
  top,
  kind,
  hash,
  refs,
  detached,
  message,
  containerRef,
  onMouseLeave,
  onPin,
  onDone,
  action,
  busy = false,
  onSwitch,
  branch
}: CommitCardProps) {
  const isHead = kind === 'head'

  return (
    <div
      ref={containerRef}
      data-card
      onMouseLeave={onMouseLeave}
      onPointerDown={onPin}
      onFocus={onPin}
      style={{ left, top, width: CARD_WIDTH }}
      className={cn(
        'absolute z-30 overflow-hidden rounded-md border bg-canvas-overlay text-left shadow-overlay animate-popover-in motion-reduce:animate-none',
        busy ? 'border-attention-fg' : 'border-border'
      )}
    >
      <div className="p-3">
        <div className="flex items-center gap-2">
          <GitCommitIcon size={16} className="shrink-0 text-fg-muted" />
          <span className="flex-1 text-xs font-semibold text-fg">
            {isHead ? 'Current HEAD' : 'Branch tip'}
          </span>
          <span className="rounded-md border border-border px-1.5 font-mono text-[11px] text-fg-muted">
            {hash.slice(0, 10)}
          </span>
        </div>

        <RefLabels refs={refs} detached={detached} className="mt-2 flex-wrap" />
        <p className="mt-2 line-clamp-2 text-xs text-fg [overflow-wrap:anywhere]">{message}</p>

        {!isHead && (
          <Button
            variant="primary"
            size="sm"
            className="mt-3 w-full min-w-0"
            disabled={busy}
            onClick={onSwitch}
          >
            {busy ? <Spinner className="size-3" /> : <GitBranchIcon size={16} />}
            <span className="truncate">{busy ? 'Checking out…' : action}</span>
          </Button>
        )}
      </div>

      {isHead && (
        <div className="border-t border-border">
          <GitActionsPanel branch={branch} onDone={onDone} inputId="head-card-commit-summary" />
        </div>
      )}
    </div>
  )
}
