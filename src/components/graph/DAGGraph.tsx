import { GitCommitIcon } from '@primer/octicons-react'
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent as ReactKeyboardEvent,
  type MouseEvent as ReactMouseEvent
} from 'react'
import { useCommitGraph } from '../../hooks/useCommitGraph'
import { useGitActions } from '../../hooks/useGitActions'
import { LANE_WIDTH, ROW_HEIGHT, type LayoutNode } from '../../services/dagLayout'
import { checkoutTarget, type CheckoutTarget } from '../../services/gitHistory'
import { cn } from '../ui/utils'
import { CARD_WIDTH, CommitCard, HEAD_CARD_HEIGHT, TIP_CARD_HEIGHT } from './CommitCard'
import { LittleMan, LITTLEMAN_HEIGHT, LITTLEMAN_WIDTH } from './LittleMan'
import { RefLabels } from './RefLabel'

// Where lane 0 starts in the canvas; the gutter to its left is where LittleMan stands
const GRAPH_LEFT = 96
const GRAPH_TOP = 12
// Space between the rightmost lane and the commit text
const LABEL_GAP = 16
// Narrowest the text column gets before the canvas scrolls sideways (room for the hover card);
// wider windows give it the rest, and long messages truncate
const MIN_TEXT_WIDTH = CARD_WIDTH + 16
// Space between LittleMan and the HEAD node
const LITTLEMAN_GAP = 14
// The card tucks this far up into its row, so the pointer can move from a row into its card
const CARD_OVERLAP = 6

// Branch-tip rows wash in their lane's colour (--lane), deeper on hover or keyboard focus,
// and while their card is open
const TIP_ROW_CLASS =
  'bg-[color-mix(in_srgb,var(--lane)_8%,transparent)] hover:bg-[color-mix(in_srgb,var(--lane)_16%,transparent)] focus-visible:bg-[color-mix(in_srgb,var(--lane)_16%,transparent)]'
const TIP_ROW_ACTIVE_CLASS = 'bg-[color-mix(in_srgb,var(--lane)_16%,transparent)]'
// HEAD's "you are here" tint, deeper on hover or focus, and while its card is open
const HEAD_ROW_ACTIVE_CLASS = 'bg-accent-fg/10 dark:bg-accent-fg/20'
const HEAD_ROW_CLASS =
  'bg-accent-subtle hover:bg-accent-fg/10 dark:hover:bg-accent-fg/20 focus-visible:bg-accent-fg/10 dark:focus-visible:bg-accent-fg/20'

const centerX = (node: LayoutNode) => node.x + LANE_WIDTH / 2
const centerY = (node: LayoutNode) => node.y + ROW_HEIGHT / 2

// Child (above) to parent (below): curve over into the edge's lane just under the child, run
// straight down it, then curve into the parent just above it. Adjacent rows get one curve.
function edgePath(child: LayoutNode, parent: LayoutNode, lane: number): string {
  const x1 = centerX(child)
  const y1 = centerY(child)
  const x2 = centerX(parent)
  const y2 = centerY(parent)
  const laneX = lane * LANE_WIDTH + LANE_WIDTH / 2
  const half = ROW_HEIGHT / 2

  if (parent.row - child.row <= 1) {
    const midY = (y1 + y2) / 2
    return `M ${x1},${y1} C ${x1},${midY} ${x2},${midY} ${x2},${y2}`
  }

  let d = `M ${x1},${y1}`
  let y = y1
  if (laneX !== x1) {
    y = y1 + ROW_HEIGHT
    d += ` C ${x1},${y1 + half} ${laneX},${y1 + half} ${laneX},${y}`
  }
  const runEnd = laneX !== x2 ? y2 - ROW_HEIGHT : y2
  if (runEnd > y) d += ` L ${laneX},${runEnd}`
  if (laneX !== x2) d += ` C ${laneX},${y2 - half} ${x2},${y2 - half} ${x2},${y2}`
  return d
}

// HEAD is on this commit but not on any branch
const isDetached = (node: LayoutNode) => node.isHead && !node.refs.some((r) => r.isCurrent)

// Placeholder rows while the first graph loads
function GraphSkeleton() {
  return (
    <div
      aria-busy="true"
      aria-label="Loading commit graph"
      className="min-w-0 flex-1 overflow-hidden bg-canvas pt-3 motion-safe:animate-pulse"
    >
      {Array.from({ length: 8 }, (_, i) => (
        <div
          key={i}
          className="flex items-center"
          style={{ height: ROW_HEIGHT, paddingLeft: GRAPH_LEFT + LANE_WIDTH / 2 - 5 }}
        >
          <span className="size-2.5 shrink-0 rounded-full bg-fg/15" />
          <span className="ml-9 flex flex-col gap-2">
            <span className="h-2.5 rounded-sm bg-fg/10" style={{ width: 140 + ((i * 67) % 180) }} />
            <span className="h-2 w-14 rounded-sm bg-fg/10" />
          </span>
        </div>
      ))}
    </div>
  )
}

// The commit graph: SVG lanes and nodes over HTML rows, with LittleMan standing next to HEAD.
// Branch tips and HEAD are interactive: hover for a card, click the row to pin it open. A tip's
// card switches to the branch; HEAD's card holds the git actions.
export function DAGGraph() {
  const layout = useCommitGraph()
  const actions = useGitActions()
  const [hoveredHash, setHoveredHash] = useState<string | null>(null)
  // Commit whose card was clicked open; it stays until you click elsewhere or press Escape
  const [pinnedHash, setPinnedHash] = useState<string | null>(null)
  const [checkingOut, setCheckingOut] = useState<string | null>(null)
  const cardRef = useRef<HTMLDivElement>(null)
  // Set when a row is pinned from the keyboard, so focus moves into the card that opens
  const focusCardOnPin = useRef(false)
  // Set while Escape hands focus back to a row, so that focus doesn't reopen its card as a preview
  const skipFocusPreview = useRef(false)

  // A pinned card closes on any click outside it (other than on a clickable row or LittleMan's
  // button, which pin their own card), or on Escape, which hands focus back to its row
  useEffect(() => {
    if (!pinnedHash) return
    const onPointerDown = (event: PointerEvent) => {
      if (!(event.target as Element | null)?.closest('[data-card], [data-pin-target]')) {
        setPinnedHash(null)
      }
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      // Closed even if the pointer is still over the row; it reopens when the pointer comes back
      setPinnedHash(null)
      setHoveredHash(null)
      skipFocusPreview.current = true
      document.querySelector<HTMLElement>(`[data-hash="${pinnedHash}"]`)?.focus()
      skipFocusPreview.current = false
    }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [pinnedHash])

  useEffect(() => {
    if (!pinnedHash || !focusCardOnPin.current) return
    focusCardOnPin.current = false
    cardRef.current?.querySelector<HTMLElement>('input, button:not(:disabled)')?.focus()
  }, [pinnedHash])

  const nodesByHash = useMemo(
    () => new Map((layout?.nodes ?? []).map((node) => [node.hash, node])),
    [layout]
  )

  // What clicking each commit would check out (null for HEAD and commits without branches)
  const targets = useMemo(() => {
    const nodes = layout?.nodes ?? []
    const localBranches = new Set(
      nodes.flatMap((n) => n.refs.filter((r) => r.kind === 'local').map((r) => r.name))
    )
    return new Map<string, CheckoutTarget | null>(
      nodes.map((n) => [n.hash, n.isHead ? null : checkoutTarget(n, localBranches)])
    )
  }, [layout])

  if (!layout) return <GraphSkeleton />
  if (layout.nodes.length === 0) {
    return (
      <div className="flex min-w-0 flex-1 flex-col items-center justify-center gap-2 bg-canvas p-8 text-center">
        <GitCommitIcon size={24} className="text-fg-muted" />
        <p className="text-sm font-semibold text-fg">No commits yet</p>
        <p className="max-w-[40ch] text-xs text-fg-muted">
          This repository&apos;s graph appears here once it has a commit.
        </p>
      </div>
    )
  }

  const isInteractive = (node: LayoutNode) => node.isHead || Boolean(targets.get(node.hash))
  const cardTop = (node: LayoutNode) => GRAPH_TOP + node.y + ROW_HEIGHT - CARD_OVERLAP

  const lanesWidth = layout.laneCount * LANE_WIDTH
  const textLeft = GRAPH_LEFT + lanesWidth + LABEL_GAP
  const canvasWidth = textLeft + MIN_TEXT_WIDTH
  // Tall enough for the last row, and for the card of any interactive row near the bottom
  const canvasHeight =
    Math.max(
      GRAPH_TOP + layout.nodes.length * ROW_HEIGHT,
      ...layout.nodes
        .filter(isInteractive)
        .map((n) => cardTop(n) + (n.isHead ? HEAD_CARD_HEIGHT : TIP_CARD_HEIGHT))
    ) + 16
  const svgWidth = GRAPH_LEFT + lanesWidth

  // LittleMan stands in the gutter on HEAD's row, just left of lane 0, so he never covers a lane;
  // after a checkout he walks up or down the gutter to the new HEAD row
  const head = layout.nodes.find((n) => n.isHead)
  const spriteLeft = GRAPH_LEFT + LANE_WIDTH / 2 - LITTLEMAN_WIDTH - LITTLEMAN_GAP
  const spriteTop = head ? GRAPH_TOP + centerY(head) - LITTLEMAN_HEIGHT / 2 : 0
  const currentBranch = head?.refs.find((r) => r.isCurrent)?.name

  // A pinned card wins; otherwise whichever clickable row (or its card) is under the pointer
  const cardHash = pinnedHash ?? hoveredHash

  // Leaving a row hides its card at once, unless the pointer (or focus) is moving into the card
  const leaveRow = (hash: string, next: EventTarget | null) => {
    if (next instanceof Node && cardRef.current?.contains(next)) return
    setHoveredHash((current) => (current === hash ? null : current))
  }
  // Leaving a card: same, unless it's back onto the card's own row
  const leaveCard = (hash: string, next: EventTarget | null) => {
    if (next instanceof Element && next.closest('[data-hash]')?.getAttribute('data-hash') === hash)
      return
    setHoveredHash((current) => (current === hash ? null : current))
  }
  const closeCard = () => {
    setPinnedHash(null)
    setHoveredHash(null)
  }

  // Clicking a row (or Enter/Space on it) pins its card open; from the keyboard, focus moves in
  const pin = (hash: string, fromKeyboard = false) => {
    focusCardOnPin.current = fromKeyboard
    setPinnedHash(hash)
  }

  // The card closes once the checkout succeeds; on failure it stays (the status bar has the error)
  const checkout = async (node: LayoutNode, target: CheckoutTarget) => {
    setCheckingOut(node.hash)
    const result = await actions.checkout(target)
    setCheckingOut(null)
    if (result.ok) closeCard()
  }

  const rowLabel = (node: LayoutNode): string =>
    node.isHead
      ? `Current HEAD: ${node.message}`
      : `Branch tip ${targets.get(node.hash)?.label}: ${node.message}`

  const onRowKeyDown = (event: ReactKeyboardEvent, node: LayoutNode) => {
    if (event.key !== 'Enter' && event.key !== ' ') return
    event.preventDefault()
    pin(node.hash, true)
  }

  const renderCard = () => {
    const node = cardHash ? nodesByHash.get(cardHash) : undefined
    if (!node || !isInteractive(node)) return null
    const shared = {
      left: textLeft - 8,
      top: cardTop(node),
      hash: node.hash,
      refs: node.refs,
      detached: isDetached(node),
      message: node.message,
      containerRef: cardRef,
      onMouseLeave: (event: ReactMouseEvent) => leaveCard(node.hash, event.relatedTarget),
      onPin: () => pin(node.hash),
      onDone: closeCard
    }

    if (node.isHead) return <CommitCard {...shared} kind="head" branch={currentBranch} />
    const target = targets.get(node.hash)
    return (
      <CommitCard
        {...shared}
        kind="tip"
        action={`Switch to ${target?.label}`}
        busy={checkingOut === node.hash}
        onSwitch={() => {
          if (target && checkingOut !== node.hash) checkout(node, target)
        }}
      />
    )
  }

  return (
    <div className="relative min-w-0 flex-1 overflow-auto bg-canvas">
      <div
        className="relative select-none"
        style={{ width: canvasWidth, minWidth: '100%', height: canvasHeight }}
      >
        {/* Rows sit under the SVG, which ignores the pointer, so a row is hovered across its full width */}
        {layout.nodes.map((node) => {
          const interactive = isInteractive(node)
          const cardShown = cardHash === node.hash
          return (
            <div
              key={node.hash}
              data-hash={node.hash}
              // A click here pins this row's card rather than counting as clicking outside one
              data-pin-target={interactive ? true : undefined}
              role={interactive ? 'button' : undefined}
              tabIndex={interactive ? 0 : undefined}
              aria-label={interactive ? rowLabel(node) : undefined}
              aria-expanded={interactive ? pinnedHash === node.hash : undefined}
              onMouseEnter={interactive ? () => setHoveredHash(node.hash) : undefined}
              onMouseLeave={
                interactive ? (event) => leaveRow(node.hash, event.relatedTarget) : undefined
              }
              onFocus={
                interactive
                  ? () => {
                      if (!skipFocusPreview.current) setHoveredHash(node.hash)
                    }
                  : undefined
              }
              onBlur={interactive ? (event) => leaveRow(node.hash, event.relatedTarget) : undefined}
              onClick={interactive ? () => pin(node.hash) : undefined}
              onKeyDown={interactive ? (event) => onRowKeyDown(event, node) : undefined}
              // Clickable rows are tinted at rest (HEAD blue, tips in their lane's colour) and
              // deepen on hover and while their card is open; plain commits get neither
              className={cn(
                'absolute inset-x-0 flex items-center pr-4',
                interactive && 'cursor-pointer',
                node.isHead && cn(HEAD_ROW_CLASS, cardShown && HEAD_ROW_ACTIVE_CLASS),
                !node.isHead && interactive && cn(TIP_ROW_CLASS, cardShown && TIP_ROW_ACTIVE_CLASS)
              )}
              style={
                {
                  top: GRAPH_TOP + node.y,
                  height: ROW_HEIGHT,
                  paddingLeft: textLeft,
                  '--lane': node.color
                } as CSSProperties
              }
            >
              <div className="min-w-0 flex-1">
                <div className="flex min-w-0 items-center gap-1.5">
                  <RefLabels
                    refs={node.refs}
                    detached={isDetached(node)}
                    collapse
                    className="shrink-0"
                  />
                  <span className="truncate text-[13px] text-fg">{node.message}</span>
                </div>
                <div className="mt-0.5 font-mono text-[11px] text-fg-muted">
                  {node.hash.slice(0, 7)}
                </div>
              </div>
            </div>
          )
        })}

        <svg
          width={svgWidth}
          height={canvasHeight}
          viewBox={`${-GRAPH_LEFT} ${-GRAPH_TOP} ${svgWidth} ${canvasHeight}`}
          aria-hidden
          className="pointer-events-none absolute top-0 left-0 z-10 overflow-visible"
        >
          {layout.edges.map((edge) => {
            const child = nodesByHash.get(edge.from)
            const parent = nodesByHash.get(edge.to)
            if (!child || !parent) return null
            return (
              <path
                key={`${edge.from}-${edge.to}`}
                d={edgePath(child, parent, edge.lane)}
                style={{ stroke: edge.color }}
                strokeWidth={2}
                strokeLinecap="round"
                fill="none"
              />
            )
          })}

          {layout.nodes.map((node) => {
            const isTip = !node.isHead && Boolean(targets.get(node.hash))
            const hovered = hoveredHash === node.hash
            const busy = checkingOut === node.hash
            const cx = centerX(node)
            const cy = centerY(node)

            return (
              <g key={node.hash}>
                {/* HEAD's ring, or an amber one while this branch is being checked out */}
                {(node.isHead || busy) && (
                  <circle
                    cx={cx}
                    cy={cy}
                    r={11}
                    fill="none"
                    strokeWidth={2}
                    style={{
                      stroke: busy ? 'var(--color-attention-fg)' : 'var(--color-accent-fg)'
                    }}
                    className={busy ? 'motion-safe:animate-pulse' : undefined}
                  />
                )}
                {isTip ? (
                  // Branch tips are hollow rings: the commits you can click to switch to
                  <circle
                    cx={cx}
                    cy={cy}
                    r={hovered ? 7 : 6}
                    strokeWidth={2.5}
                    style={{ fill: 'var(--color-canvas)', stroke: node.color }}
                  />
                ) : (
                  <circle
                    cx={cx}
                    cy={cy}
                    r={node.isHead ? (hovered ? 7 : 6) : 5}
                    strokeWidth={2}
                    style={{ fill: node.color, stroke: 'var(--color-canvas)' }}
                  />
                )}
              </g>
            )
          })}
        </svg>

        {head && (
          // Slides to the new HEAD after a checkout
          <div
            className="absolute top-0 left-0 z-20 transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none"
            style={{ transform: `translate(${spriteLeft}px, ${spriteTop}px)` }}
          >
            <LittleMan
              actionsOpen={pinnedHash === head.hash}
              onToggleActions={() =>
                setPinnedHash((current) => (current === head.hash ? null : head.hash))
              }
            />
          </div>
        )}

        {/* Drawn last so it sits above every row */}
        {renderCard()}
      </div>
    </div>
  )
}
