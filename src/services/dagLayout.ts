import type { Commit } from './gitHistory'

// Lays the commit graph out in lanes, the way `git log --graph` and VS Code's Git Graph do:
// each branch keeps a lane from its tip down to where it forks, and freed lanes are reused.

export interface LayoutNode extends Commit {
  children: string[]
  lane: number
  // 0 = newest commit
  row: number
  x: number
  y: number
  color: string
}

// Line from a child commit down to one of its parents
export interface LayoutEdge {
  from: string
  to: string
  // Lane the line runs down between the two commits
  lane: number
  color: string
}

export interface GraphLayout {
  nodes: LayoutNode[]
  edges: LayoutEdge[]
  laneCount: number
}

export const LANE_WIDTH = 32
export const ROW_HEIGHT = 60

// main/master's first-parent history always occupies lane 0, drawn in this colour
const MAIN_LANE_COLOR = '#000000'
// Colours handed out to other lanes as they open
const LANE_PALETTE = [
  '#3b82f6', // blue
  '#ec4899', // pink
  '#10b981', // green
  '#a855f7', // purple
  '#f59e0b', // amber
  '#f97316', // orange
  '#22c55e', // emerald
  '#64748b' // slate
]
const MAIN_BRANCHES = ['main', 'master']

// Tip of the trunk: local main/master if present, otherwise a remote one
function findMainTip(commits: Commit[]): string | undefined {
  for (const kind of ['local', 'remote'] as const) {
    for (const name of MAIN_BRANCHES) {
      const tip = commits.find((c) => c.refs.some((r) => r.kind === kind && r.branch === name))
      if (tip) return tip.hash
    }
  }
}

// `commits` must list children before their parents (git log --date-order guarantees this)
export function layoutGraph(commits: Commit[]): GraphLayout {
  const byHash = new Map(commits.map((c) => [c.hash, c]))

  const children = new Map<string, string[]>()
  for (const commit of commits) {
    for (const parent of commit.parents) {
      if (byHash.has(parent)) children.set(parent, [...(children.get(parent) ?? []), commit.hash])
    }
  }

  const mainChain = new Set<string>()
  for (let hash = findMainTip(commits); hash && byHash.has(hash) && !mainChain.has(hash);) {
    mainChain.add(hash)
    hash = byHash.get(hash)!.parents[0]
  }
  const reserveMain = mainChain.size > 0

  // lanes[i] = the commit lane i is waiting for next, or null when the lane is free
  const lanes: (string | null)[] = reserveMain ? [null] : []
  const laneColors: string[] = reserveMain ? [MAIN_LANE_COLOR] : []
  let nextColor = 0

  // Opens the leftmost free lane (never lane 0 while it's reserved for main) waiting for `hash`
  const openLane = (hash: string): number => {
    let lane = lanes.indexOf(null, reserveMain ? 1 : 0)
    if (lane === -1) lane = lanes.length
    lanes[lane] = hash
    laneColors[lane] = LANE_PALETTE[nextColor++ % LANE_PALETTE.length]
    return lane
  }

  const nodes: LayoutNode[] = []
  const edges: LayoutEdge[] = []

  commits.forEach((commit, row) => {
    const waiting = lanes.flatMap((expected, i) => (expected === commit.hash ? [i] : []))

    let lane: number
    if (mainChain.has(commit.hash)) lane = 0
    else if (waiting.length > 0) lane = waiting[0]
    else lane = openLane(commit.hash) // branch tip: nothing above leads here

    // Any other lanes waiting for this commit are branches forking from it; they end here
    for (const i of waiting) if (i !== lane) lanes[i] = null

    // Parents outside the graph (e.g. shallow clones) would hold their lane open forever
    const [firstParent, ...mergeParents] = commit.parents.filter((p) => byHash.has(p))

    // The commit's own lane continues down to its first parent (or ends at a root commit)
    lanes[lane] = firstParent ?? null
    if (firstParent) {
      edges.push({ from: commit.hash, to: firstParent, lane, color: laneColors[lane] })
    }

    // Merged-in parents join a lane already heading to them, or open a new one
    for (const parent of mergeParents) {
      const existing = lanes.indexOf(parent)
      const target = existing === -1 ? openLane(parent) : existing
      edges.push({ from: commit.hash, to: parent, lane: target, color: laneColors[target] })
    }

    nodes.push({
      ...commit,
      children: children.get(commit.hash) ?? [],
      lane,
      row,
      x: lane * LANE_WIDTH,
      y: row * ROW_HEIGHT,
      color: laneColors[lane]
    })
  })

  return { nodes, edges, laneCount: Math.max(lanes.length, 1) }
}
