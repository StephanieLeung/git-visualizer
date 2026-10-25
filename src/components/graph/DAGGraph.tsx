import { useMemo, useState } from 'react'
import { useGit } from '../../context/GitContext'
import { useCommitGraph } from '../../hooks/useCommitGraph'
import { LANE_WIDTH, ROW_HEIGHT, type LayoutNode } from '../../services/dagLayout'
import { CommitTooltip } from './CommitTooltip'
import { LittleMan } from './LittleMan'

// Whitespace around the graph inside the SVG
const MARGIN_TOP = 100
const MARGIN_BOTTOM = 50
const MARGIN_LEFT = 100
const MARGIN_RIGHT = 50
// Offset from a node's layout (x, y) to the centre of its circle
const NODE_OFFSET = 40
// How long a tooltip lingers after the pointer leaves
const TOOLTIP_HIDE_DELAY_MS = 600

const HEAD_RING_COLOR = '#FFD700'
const BRANCH_TIP_COLOR = '#4CAF50'
const CHECKING_OUT_COLOR = '#FF9800'

// Line from a parent commit to its child: an elbow when a branch forks off or merges across
// lanes, a straight line otherwise. Edges use the child's colour so a branch keeps its colour.
function CommitEdge({ node, parent }: { node: LayoutNode; parent: LayoutNode }) {
  const x1 = parent.x + NODE_OFFSET
  const y1 = parent.y + NODE_OFFSET
  const x2 = node.x + NODE_OFFSET
  const y2 = node.y + NODE_OFFSET

  const isCrossLane = parent.lane !== node.lane
  const isMerge = node.parents.length > 1
  const isBranch = parent.children.length > 1

  if (isCrossLane && (isMerge || isBranch)) {
    const midY = (y1 + y2) / 2
    return (
      <path
        d={`M ${x1},${y1} L ${x1},${midY} L ${x2},${midY} L ${x2},${y2}`}
        stroke={node.color}
        strokeWidth="2"
        fill="none"
        opacity="0.7"
      />
    )
  }

  return <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={node.color} strokeWidth="2" opacity="0.6" />
}

// SVG commit graph with LittleMan standing on HEAD; branch tips can be clicked to check out
export function DAGGraph() {
  const { layoutNodes, loading, currentCommit, checkingOutBranch, checkoutBranch } =
    useCommitGraph()
  const { characterState, animationState, triggerAnimation } = useGit()
  const [hoveredNode, setHoveredNode] = useState<string | null>(null)

  const nodesByHash = useMemo(
    () => new Map(layoutNodes.map((node) => [node.hash, node])),
    [layoutNodes]
  )

  if (loading) return <div className="flex items-center justify-center h-full">Building DAG...</div>

  const maxLane = Math.max(...layoutNodes.map((n) => n.lane), 0)
  const maxY = Math.max(...layoutNodes.map((n) => n.y), 0)
  const contentWidth = (maxLane + 1) * LANE_WIDTH + 100
  const contentHeight = maxY + ROW_HEIGHT + 100
  const width = contentWidth + MARGIN_LEFT + MARGIN_RIGHT
  const height = contentHeight + MARGIN_TOP + MARGIN_BOTTOM

  // LittleMan sits just left of and above the HEAD node (pixel offsets tuned by eye)
  const headNode = currentCommit ? nodesByHash.get(currentCommit) : undefined
  const spriteLeft = headNode ? headNode.x + MARGIN_LEFT - 28 : 0
  const spriteTop = headNode ? headNode.y + MARGIN_TOP + 20 : 0

  const showTooltip = (hash: string) => setHoveredNode(hash)
  // TODO: this timeout is never cancelled, so re-entering within the delay still hides the tooltip
  const hideTooltip = () => {
    setTimeout(() => setHoveredNode(null), TOOLTIP_HIDE_DELAY_MS)
  }

  return (
    <div className="h-full w-full overflow-auto bg-gray-50 relative pl-8">
      {currentCommit && layoutNodes.length > 0 && (
        <div
          style={{
            position: 'absolute',
            left: `${spriteLeft}px`,
            top: `${spriteTop}px`,
            zIndex: 50
          }}
        >
          <LittleMan
            characterState={characterState}
            animationState={animationState}
            onActionSelect={(action) => {
              if (action === 'Pull') triggerAnimation('pulling')
              if (action === 'Push') triggerAnimation('pushing')
            }}
          />
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
        {layoutNodes.map((node) =>
          node.parents.map((parentHash) => {
            const parent = nodesByHash.get(parentHash)
            if (!parent) return null
            return <CommitEdge key={`${node.hash}-${parentHash}`} node={node} parent={parent} />
          })
        )}

        {layoutNodes.map((node) => {
          const isCurrentNode = node.hash === currentCommit
          const isHovered = hoveredNode === node.hash
          // Branch tips (a branch ref and no children) and HEAD respond to hover
          const branchNames = node.refs.filter((r) => !r.includes('HEAD') && !r.includes('tag:'))
          const isBranchTip = branchNames.length > 0 && node.children.length === 0
          const isInteractive = isCurrentNode || isBranchTip
          const isCheckingOut = checkingOutBranch === branchNames[0]

          return (
            <g
              key={node.hash}
              onMouseEnter={() => isInteractive && showTooltip(node.hash)}
              onMouseLeave={() => isInteractive && hideTooltip()}
              style={{ cursor: isInteractive ? 'pointer' : 'default' }}
            >
              <circle
                cx={node.x + NODE_OFFSET}
                cy={node.y + NODE_OFFSET}
                r={isInteractive && isHovered ? 8 : 6}
                fill={node.color}
                stroke={isCurrentNode ? HEAD_RING_COLOR : isBranchTip ? BRANCH_TIP_COLOR : 'white'}
                strokeWidth={isInteractive ? 3 : 2}
              />
              <text
                x={node.x + 60}
                y={node.y + 35}
                fontSize="12"
                fill="#333"
                fontFamily="monospace"
              >
                {node.hash.slice(0, 7)}
              </text>
              <text
                x={node.x + 60}
                y={node.y + 50}
                fontSize="11"
                fill="#666"
                fontFamily="sans-serif"
              >
                {node.message.slice(0, 40)}
              </text>

              {isCurrentNode && isHovered && (
                <CommitTooltip
                  x={node.x + 50}
                  y={node.y}
                  borderColor={node.color}
                  borderWidth={2}
                  title={`Current HEAD: ${node.hash.slice(0, 10)}`}
                  branchLabel={
                    node.refs.filter((r) => !r.includes('HEAD')).join(', ') || 'detached'
                  }
                  message={node.message}
                  action="▶ Click for more actions"
                  actionColor="#0066cc"
                  onMouseEnter={() => showTooltip(node.hash)}
                  onMouseLeave={hideTooltip}
                />
              )}

              {isBranchTip && !isCurrentNode && isHovered && (
                <CommitTooltip
                  x={node.x + 60}
                  y={node.y}
                  borderColor={isCheckingOut ? CHECKING_OUT_COLOR : BRANCH_TIP_COLOR}
                  borderWidth={isCheckingOut ? 3 : 2}
                  title={`Branch Tip: ${node.hash.slice(0, 10)}`}
                  branchLabel={branchNames.join(', ')}
                  message={node.message}
                  action={isCheckingOut ? '⟳ Checking out...' : '▶ Click to switch to this branch'}
                  actionColor={isCheckingOut ? CHECKING_OUT_COLOR : BRANCH_TIP_COLOR}
                  onMouseEnter={() => showTooltip(node.hash)}
                  onMouseLeave={hideTooltip}
                  onClick={() => checkoutBranch(branchNames[0])}
                />
              )}
            </g>
          )
        })}
      </svg>
    </div>
  )
}
