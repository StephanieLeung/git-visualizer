import { useEffect, useMemo, useRef, useState } from 'react'
import { useCommitGraph } from '../../hooks/useCommitGraph'
import { useGitActions } from '../../hooks/useGitActions'
import { LANE_WIDTH, ROW_HEIGHT, type LayoutNode } from '../../services/dagLayout'
import { checkoutTarget, type CheckoutTarget } from '../../services/gitHistory'
import { truncate } from '../../utils/truncate'
import { CommitTooltip, TOOLTIP_HEIGHT, TOOLTIP_WIDTH } from './CommitTooltip'
import { LittleMan } from './LittleMan'

// Whitespace around the graph inside the SVG
const MARGIN_TOP = 100
const MARGIN_BOTTOM = 50
const MARGIN_LEFT = 100
const MARGIN_RIGHT = 50
// The scroll container's pl-8, which shifts the SVG relative to the absolutely placed sprite
const CONTAINER_PADDING_LEFT = 32
// Space between the rightmost lane and the hash/message labels
const LABEL_GAP = 16
// How long a tooltip lingers after the pointer leaves, so it can be reached
const TOOLTIP_HIDE_DELAY_MS = 600

const HEAD_RING_COLOR = '#FFD700'
const BRANCH_TIP_COLOR = '#4CAF50'
const CHECKING_OUT_COLOR = '#FF9800'

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

// Branch and remote branch names on a commit (tags excluded)
function branchLabel(node: LayoutNode): string {
  const names = node.refs.filter((r) => r.kind !== 'tag').map((r) => r.name)
  if (node.isHead && !node.refs.some((r) => r.isCurrent)) names.unshift('detached HEAD')
  return names.join(', ')
}

// SVG commit graph with LittleMan standing next to HEAD; branch commits can be clicked to check out
export function DAGGraph() {
  const layout = useCommitGraph()
  const actions = useGitActions()
  const [hoveredHash, setHoveredHash] = useState<string | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [checkingOut, setCheckingOut] = useState<string | null>(null)
  const hideTimer = useRef<ReturnType<typeof setTimeout>>()

  useEffect(() => () => clearTimeout(hideTimer.current), [])

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

  if (!layout) return <div className="flex items-center justify-center h-full">Building DAG...</div>
  if (layout.nodes.length === 0) {
    return <div className="flex items-center justify-center h-full">No commits yet</div>
  }

  const labelX = layout.laneCount * LANE_WIDTH + LABEL_GAP
  const width = MARGIN_LEFT + labelX + TOOLTIP_WIDTH + MARGIN_RIGHT
  const height = MARGIN_TOP + layout.nodes.length * ROW_HEIGHT + TOOLTIP_HEIGHT + MARGIN_BOTTOM

  // LittleMan stands just left of the HEAD node
  const head = layout.nodes.find((n) => n.isHead)
  const spriteLeft = head ? CONTAINER_PADDING_LEFT + MARGIN_LEFT + centerX(head) - 100 : 0
  const spriteTop = head ? MARGIN_TOP + centerY(head) - 20 : 0

  const showTooltip = (hash: string) => {
    clearTimeout(hideTimer.current)
    setHoveredHash(hash)
  }
  const hideTooltip = () => {
    clearTimeout(hideTimer.current)
    hideTimer.current = setTimeout(() => setHoveredHash(null), TOOLTIP_HIDE_DELAY_MS)
  }

  const checkout = async (node: LayoutNode, target: CheckoutTarget) => {
    setCheckingOut(node.hash)
    await actions.checkout(target)
    setCheckingOut(null)
  }

  const renderTooltip = () => {
    const node = hoveredHash ? nodesByHash.get(hoveredHash) : undefined
    if (!node) return null
    const shared = {
      x: labelX - 10,
      y: node.y,
      branchLabel: branchLabel(node),
      message: node.message,
      onMouseEnter: () => showTooltip(node.hash),
      onMouseLeave: hideTooltip
    }

    if (node.isHead) {
      return (
        <CommitTooltip
          {...shared}
          borderColor={node.color}
          borderWidth={2}
          title={`Current HEAD: ${node.hash.slice(0, 10)}`}
          action="▶ Click for more actions"
          actionColor="#0066cc"
          onClick={() => {
            setHoveredHash(null)
            setMenuOpen(true)
          }}
        />
      )
    }

    const target = targets.get(node.hash)
    if (!target) return null
    const busy = checkingOut === node.hash
    return (
      <CommitTooltip
        {...shared}
        borderColor={busy ? CHECKING_OUT_COLOR : BRANCH_TIP_COLOR}
        borderWidth={busy ? 3 : 2}
        title={`Branch Tip: ${node.hash.slice(0, 10)}`}
        action={busy ? '⟳ Checking out...' : `▶ Click to switch to ${target.label}`}
        actionColor={busy ? CHECKING_OUT_COLOR : BRANCH_TIP_COLOR}
        onClick={() => {
          if (!busy) checkout(node, target)
        }}
      />
    )
  }

  return (
    <div className="h-full w-full overflow-auto bg-gray-50 relative pl-8">
      {head && (
        <div
          style={{
            position: 'absolute',
            left: `${spriteLeft}px`,
            top: `${spriteTop}px`,
            zIndex: 50
          }}
        >
          <LittleMan menuOpen={menuOpen} onMenuOpenChange={setMenuOpen} />
        </div>
      )}
      <svg
        width={width}
        height={height}
        viewBox={`${-MARGIN_LEFT} ${-MARGIN_TOP} ${width} ${height}`}
        preserveAspectRatio="xMinYMin meet"
        className="block relative"
        style={{ zIndex: 10 }}
      >
        {layout.edges.map((edge) => {
          const child = nodesByHash.get(edge.from)
          const parent = nodesByHash.get(edge.to)
          if (!child || !parent) return null
          return (
            <path
              key={`${edge.from}-${edge.to}`}
              d={edgePath(child, parent, edge.lane)}
              stroke={edge.color}
              strokeWidth="2"
              fill="none"
              opacity="0.7"
            />
          )
        })}

        {layout.nodes.map((node) => {
          const target = targets.get(node.hash)
          const isInteractive = node.isHead || Boolean(target)
          const isHovered = hoveredHash === node.hash

          return (
            <g
              key={node.hash}
              onMouseEnter={() => isInteractive && showTooltip(node.hash)}
              onMouseLeave={() => isInteractive && hideTooltip()}
              style={{ cursor: isInteractive ? 'pointer' : 'default' }}
            >
              <circle
                cx={centerX(node)}
                cy={centerY(node)}
                r={isInteractive && isHovered ? 8 : 6}
                fill={node.color}
                stroke={node.isHead ? HEAD_RING_COLOR : target ? BRANCH_TIP_COLOR : 'white'}
                strokeWidth={isInteractive ? 3 : 2}
              />
              <text
                x={labelX}
                y={centerY(node) - 5}
                fontSize="12"
                fill="#333"
                fontFamily="monospace"
              >
                {node.hash.slice(0, 7)}
              </text>
              <text
                x={labelX}
                y={centerY(node) + 10}
                fontSize="11"
                fill="#666"
                fontFamily="sans-serif"
              >
                {truncate(node.message, 40)}
              </text>
            </g>
          )
        })}

        {/* Drawn last so it sits above every row */}
        {renderTooltip()}
      </svg>
    </div>
  )
}
