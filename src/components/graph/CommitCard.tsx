import { GitBranchIcon, GitCommitIcon, HistoryIcon } from '@primer/octicons-react'
import type { MouseEvent, Ref } from 'react'
import type { GitRef } from '../../services/gitHistory'
import { Button } from '../ui/button'
import { Spinner } from '../ui/spinner'
import { cn } from '../ui/utils'
import { GitActionsPanel } from './GitActionsPanel'
import { NewBranchForm } from './NewBranchForm'
import { RefLabels } from './RefLabel'

export const CARD_WIDTH = 320
// Tallest each kind of card gets (Reset shown, New branch form open); the graph leaves room
// under its last rows
export const TIP_CARD_HEIGHT = 300
export const COMMIT_CARD_HEIGHT = 260
export const HEAD_CARD_HEIGHT = 500

export type CardKind = 'head' | 'tip' | 'commit'

const KIND_LABELS: Record<CardKind, string> = {
  head: 'Current HEAD',
  tip: 'Branch tip',
  commit: 'Commit'
}

interface CommitCardProps {
  // Top-left corner, in the graph canvas's pixels
  left: number
  top: number
  // HEAD's card holds the git actions; a tip's switches to its branch; a plain commit's (one in
  // the current branch's history) resets the branch to it
  kind: CardKind
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
  // The card has closed and is fading out: drawn but inert; onClosed fires when the fade ends
  closing?: boolean
  onClosed?: () => void
  // Tip only: the switch button's label, whether that checkout is running, and running it
  action?: string
  busy?: boolean
  onSwitch?: () => void
  // The current branch: HEAD's commit button names it, and Reset moves it
  branch?: string
  // Commits in the current branch's history (not HEAD): opens the reset dialog
  onReset?: () => void
}

// GitHub-style card for HEAD, branch tips, and the commits HEAD's branch can be reset to; it
// appears on hover and stays when its row is clicked
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
  closing = false,
  onClosed,
  action,
  busy = false,
  onSwitch,
  branch,
  onReset
}: CommitCardProps) {
  const isHead = kind === 'head'
  // Local branches here that have no commits of their own yet (see services/gitHistory.ts)
  const newBranches = refs.filter((ref) => ref.isNew).map((ref) => ref.name)

  return (
    <div
      // A closing card is click-through and out of DAGGraph's row/card bookkeeping
      ref={closing ? undefined : containerRef}
      data-card={closing ? undefined : true}
      aria-hidden={closing || undefined}
      onMouseLeave={closing ? undefined : onMouseLeave}
      onPointerDown={closing ? undefined : onPin}
      onFocus={closing ? undefined : onPin}
      onAnimationEnd={(event) => {
        if (closing && event.target === event.currentTarget) onClosed?.()
      }}
      style={{ left, top, width: CARD_WIDTH }}
      className={cn(
        'absolute z-30 overflow-hidden rounded-md border bg-canvas-overlay text-left shadow-overlay',
        busy ? 'border-attention-fg' : 'border-border',
        // Without motion there is no fade to wait for, so a closing card just hides
        closing
          ? 'pointer-events-none motion-safe:animate-popover-out motion-reduce:hidden'
          : 'motion-safe:animate-popover-in'
      )}
    >
      <div className="p-3">
        <div className="flex items-center gap-2">
          <GitCommitIcon size={16} className="shrink-0 text-fg-muted" />
          <span className="flex-1 text-xs font-semibold text-fg">{KIND_LABELS[kind]}</span>
          <span className="rounded-md border border-border px-1.5 font-mono text-[11px] text-fg-muted">
            {hash.slice(0, 10)}
          </span>
        </div>

        <RefLabels refs={refs} detached={detached} className="mt-2 flex-wrap" />
        {newBranches.length > 0 && (
          <p className="mt-2 text-[11px] text-fg-muted">
            No commits on {newBranches.join(', ')} yet
            {isHead && newBranches.includes(branch ?? '')
              ? '. Your next commit gives it its own row.'
              : '. It starts at this commit.'}
          </p>
        )}
        <p className="mt-2 line-clamp-2 text-xs text-fg [overflow-wrap:anywhere]">{message}</p>

        {!isHead && (
          <div className="mt-3 space-y-2">
            {kind === 'tip' && (
              <Button
                variant="primary"
                size="sm"
                className="w-full min-w-0"
                disabled={busy}
                onClick={onSwitch}
              >
                {busy ? <Spinner className="size-3" /> : <GitBranchIcon size={16} />}
                <span className="truncate">{busy ? 'Checking out…' : action}</span>
              </Button>
            )}
            {onReset && (
              <Button size="sm" className="w-full min-w-0" onClick={onReset}>
                <HistoryIcon size={16} className="text-fg-muted" />
                <span className="truncate">Reset {branch} to here…</span>
              </Button>
            )}
            <NewBranchForm
              startPoint={hash}
              onCreated={onDone}
              inputId={`${kind}-card-new-branch`}
            />
          </div>
        )}
      </div>

      {isHead && (
        <div className="border-t border-border">
          <GitActionsPanel branch={branch} onDone={onDone} inputId="head-card-commit-summary" />
          <div className="border-t border-border p-3">
            <NewBranchForm startPoint={hash} onCreated={onDone} inputId="head-card-new-branch" />
          </div>
        </div>
      )}
    </div>
  )
}
