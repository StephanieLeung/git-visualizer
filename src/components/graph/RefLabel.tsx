import { GitBranchIcon, GitCommitIcon, GlobeIcon, TagIcon, type Icon } from '@primer/octicons-react'
import type { GitRef } from '../../services/gitHistory'
import { cn } from '../ui/utils'

const STYLES: Record<GitRef['kind'] | 'current' | 'detached', { icon: Icon; className: string }> = {
  local: {
    icon: GitBranchIcon,
    className: 'border-accent-fg/25 bg-accent-subtle text-accent-fg'
  },
  // The branch HEAD is on
  current: { icon: GitBranchIcon, className: 'border-transparent bg-accent text-fg-on-emphasis' },
  remote: { icon: GlobeIcon, className: 'border-border bg-canvas-subtle text-fg-muted' },
  tag: { icon: TagIcon, className: 'border-attention-fg/25 bg-attention-subtle text-attention-fg' },
  detached: {
    icon: GitCommitIcon,
    className: 'border-attention-fg/25 bg-attention-subtle text-attention-fg'
  }
}

const PILL_CLASS =
  'inline-flex h-5 max-w-[220px] shrink-0 items-center gap-1 rounded-md border px-1.5 font-mono text-[11px]'

// A branch with no commits of its own yet gets a dashed outline: a label waiting for its first commit
const NEW_BRANCH_CLASS = {
  current: 'border-dashed border-fg-on-emphasis/70',
  local: 'border-dashed border-accent-fg'
}

interface PillProps {
  kind: keyof typeof STYLES
  name: string
  isNew?: boolean
  className?: string
}

function Pill({ kind, name, isNew = false, className: extra }: PillProps) {
  const { icon: PillIcon, className } = STYLES[kind]
  const newClass = isNew && (kind === 'current' || kind === 'local') && NEW_BRANCH_CLASS[kind]
  return (
    <span
      title={isNew ? `${name}: no commits yet` : name}
      className={cn(PILL_CLASS, className, newClass, extra)}
    >
      <PillIcon size={12} className="shrink-0" />
      <span className="truncate">{name}</span>
    </span>
  )
}

interface RefLabelsProps {
  refs: GitRef[]
  // HEAD points at this commit without being on a branch
  detached: boolean
  // In windows under 900px wide, show only the first pill (detached HEAD or the current branch
  // come first) and fold the rest into "+N", so the commit message keeps some room
  collapse?: boolean
  className?: string
}

// Branch, remote branch and tag names on a commit, as GitHub-style pills
export function RefLabels({ refs, detached, collapse = false, className }: RefLabelsProps) {
  const pills: PillProps[] = refs.map((ref) => ({
    kind: ref.kind === 'local' && ref.isCurrent ? 'current' : ref.kind,
    name: ref.name,
    isNew: ref.isNew
  }))
  // The pill that matters most leads: where HEAD is
  const currentIndex = pills.findIndex((pill) => pill.kind === 'current')
  if (currentIndex > 0) pills.unshift(...pills.splice(currentIndex, 1))
  if (detached) pills.unshift({ kind: 'detached', name: 'HEAD (detached)' })
  if (pills.length === 0) return null

  const folded = pills.slice(1)
  return (
    <span className={cn('flex items-center gap-1', className)}>
      {pills.map((pill, index) => (
        <Pill
          key={`${pill.kind}:${pill.name}`}
          {...pill}
          className={collapse && index > 0 ? 'max-[900px]:hidden' : undefined}
        />
      ))}
      {collapse && folded.length > 0 && (
        <span
          title={folded.map((pill) => pill.name).join(', ')}
          className={cn(PILL_CLASS, 'hidden border-border text-fg-muted max-[900px]:inline-flex')}
        >
          +{folded.length}
        </span>
      )}
    </span>
  )
}
