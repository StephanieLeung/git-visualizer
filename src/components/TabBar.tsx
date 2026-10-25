import { GitBranchIcon, HistoryIcon, type Icon } from '@primer/octicons-react'
import type { KeyboardEvent } from 'react'
import { cn } from './ui/utils'

export type Tab = 'tree' | 'log'

const TABS: { id: Tab; label: string; icon: Icon }[] = [
  { id: 'tree', label: 'Tree', icon: GitBranchIcon },
  { id: 'log', label: 'Log', icon: HistoryIcon }
]

interface TabBarProps {
  activeTab: Tab
  setActiveTab: (tab: Tab) => void
}

// Underline tabs under the toolbar; the panel they control has id `panel-<tab>`
export function TabBar({ activeTab, setActiveTab }: TabBarProps) {
  // Left/Right arrows move between tabs, as in any tab list
  function onKeyDown(event: KeyboardEvent) {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return
    const index = TABS.findIndex((tab) => tab.id === activeTab)
    const step = event.key === 'ArrowRight' ? 1 : -1
    const next = TABS[(index + step + TABS.length) % TABS.length].id
    setActiveTab(next)
    document.getElementById(`tab-${next}`)?.focus()
  }

  return (
    <div
      role="tablist"
      aria-label="View"
      onKeyDown={onKeyDown}
      className="flex h-9 shrink-0 select-none items-stretch border-b border-border bg-canvas px-2"
    >
      {TABS.map(({ id, label, icon: TabIcon }) => {
        const selected = activeTab === id
        return (
          <button
            key={id}
            id={`tab-${id}`}
            role="tab"
            aria-selected={selected}
            aria-controls={`panel-${id}`}
            tabIndex={selected ? 0 : -1}
            onClick={() => setActiveTab(id)}
            className={cn(
              'flex items-center gap-2 px-3 text-xs',
              selected
                ? 'text-fg shadow-[inset_0_-2px_0_var(--color-accent-fg)]'
                : 'text-fg-muted hover:text-fg hover:shadow-[inset_0_-2px_0_var(--color-border)]'
            )}
          >
            <TabIcon size={16} className={selected ? 'text-fg' : 'text-fg-muted'} />
            {/* The hidden bold copy reserves the bold width, so selecting a tab doesn't shift its neighbours */}
            <span className="grid">
              <span aria-hidden className="invisible col-start-1 row-start-1 font-semibold">
                {label}
              </span>
              <span className={cn('col-start-1 row-start-1', selected && 'font-semibold')}>
                {label}
              </span>
            </span>
          </button>
        )
      })}
    </div>
  )
}
