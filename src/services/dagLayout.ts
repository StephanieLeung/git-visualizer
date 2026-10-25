import type { Commit } from './gitHistory'

// Lays the commit DAG out in lanes: topological order, a lane per branch, a colour per lane

export interface CommitNode extends Commit {
  children: string[]
}

export interface LayoutNode extends CommitNode {
  lane: number
  // Index in topological order (oldest first)
  order: number
  x: number
  y: number
  color: string
}

export const LANE_WIDTH = 80
export const ROW_HEIGHT = 60

// main/master always occupy lane 0 and are drawn in this colour
const MAIN_LANE_COLOR = '#000000'
// Colours for the other lanes, handed out in lane order
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
const FALLBACK_COLOR = '#999'

export class DAGLayout {
  private nodes = new Map<string, CommitNode>()
  private sorted: string[] = []
  private lanes = new Map<string, number>()
  private branchLane = new Map<string, number>()

  constructor(commits: Commit[]) {
    this.buildDAG(commits)
    this.topologicalSort()
    this.assignLanes()
  }

  // Positioned nodes, newest commit at the top (largest order → y = 0)
  getLayout(): LayoutNode[] {
    const colorsByLane = this.assignLaneColors()
    const total = this.sorted.length

    return this.sorted.map((hash, order) => {
      const node = this.nodes.get(hash)!
      const lane = this.lanes.get(hash) || 0

      return {
        ...node,
        lane,
        order,
        x: lane * LANE_WIDTH,
        y: (total - 1 - order) * ROW_HEIGHT,
        color: colorsByLane.get(lane) || FALLBACK_COLOR
      }
    })
  }

  // One node per commit, with each parent linked back to its children
  private buildDAG(commits: Commit[]) {
    commits.forEach((commit) => {
      this.nodes.set(commit.hash, {
        hash: commit.hash,
        parents: commit.parents,
        children: [],
        message: commit.message,
        refs: commit.refs
      })
    })

    commits.forEach((commit) => {
      commit.parents.forEach((parent) => {
        this.nodes.get(parent)?.children.push(commit.hash)
      })
    })
  }

  // Depth-first post-order: each commit is pushed after its parents, so `sorted` is oldest first
  private topologicalSort() {
    const visited = new Set<string>()
    const visiting = new Set<string>()

    const visit = (hash: string) => {
      if (visited.has(hash) || visiting.has(hash)) return // already placed, or a cycle
      visiting.add(hash)
      this.nodes.get(hash)?.parents.forEach((parent) => visit(parent))
      visiting.delete(hash)
      visited.add(hash)
      this.sorted.push(hash)
    }

    this.nodes.forEach((_, hash) => visit(hash))
  }

  // main/master → lane 0; each other named branch keeps one lane; undecorated commits follow
  // their first parent
  private assignLanes() {
    let nextLaneId = 0
    // TODO: while nextLaneId is still 0 this returns lane 1 without advancing, so lane 1 can be shared
    const allocateLane = () => (nextLaneId === 0 ? 1 : nextLaneId++)

    this.sorted.forEach((hash) => {
      const node = this.nodes.get(hash)!
      const branchNames = this.normalizeRefs(node.refs)
      let lane: number

      if (branchNames.includes('main') || branchNames.includes('master')) {
        lane = 0
        this.branchLane.set('main', 0)
        this.branchLane.set('master', 0)
      } else if (branchNames.length > 0) {
        // Reuse this branch's lane, or open a new one (lane 0 is reserved for main/master)
        const branch = branchNames[0]
        const existing = this.branchLane.get(branch)
        if (existing !== undefined) {
          lane = existing
        } else {
          lane = Math.max(nextLaneId, 1)
          nextLaneId = lane + 1
          this.branchLane.set(branch, lane)
        }
      } else if (node.parents.length > 0) {
        // Undecorated commit (merges included): stay in the first parent's lane
        lane = this.lanes.get(node.parents[0]) ?? allocateLane()
      } else {
        // Undecorated root commit
        lane = allocateLane()
      }

      this.lanes.set(hash, lane)
    })
  }

  // Lane 0 gets MAIN_LANE_COLOR; other lanes take unused palette colours, cycling once exhausted
  private assignLaneColors(): Map<number, string> {
    const colorsByLane = new Map<number, string>([[0, MAIN_LANE_COLOR]])
    const used = new Set<string>([MAIN_LANE_COLOR])
    let idx = 0

    const lanes = Array.from(new Set(this.lanes.values())).sort((a, b) => a - b)
    lanes.forEach((lane) => {
      if (lane === 0) return

      let color = LANE_PALETTE[idx % LANE_PALETTE.length]
      let attempts = 0
      while (used.has(color) && attempts < LANE_PALETTE.length) {
        idx++
        color = LANE_PALETTE[idx % LANE_PALETTE.length]
        attempts++
      }
      colorsByLane.set(lane, color)
      used.add(color)
      idx++
    })

    return colorsByLane
  }

  // Bare branch names from decorations like "HEAD -> main", "origin/main", "tag: v1.0".
  // TODO: also splits on '-', so "feature/user-auth" yields "feature/user" and "auth"
  private normalizeRefs(refs: string[]): string[] {
    const names: string[] = []
    refs.forEach((ref) => {
      ref
        .split(/[:,\->\s]+/)
        .map((part) => part.trim())
        .filter(Boolean)
        .forEach((part) => {
          if (part === 'HEAD' || part === 'tag' || part === 'origin') return
          names.push(part.replace('remotes/', '').replace('origin/', ''))
        })
    })
    return Array.from(new Set(names))
  }
}
