import { GitMergeIcon } from '@primer/octicons-react'
import type { ReactNode } from 'react'

interface CaptionButtonProps {
  label: string
  onClick: () => void
  // Close turns red on hover, like Windows
  danger?: boolean
  children: ReactNode
}

function CaptionButton({ label, onClick, danger, children }: CaptionButtonProps) {
  return (
    <button
      aria-label={label}
      title={label}
      onClick={onClick}
      className={`flex h-full w-[46px] items-center justify-center text-chrome-fg focus-visible:outline-chrome-focus ${
        danger ? 'hover:bg-[#c42b1c] hover:text-white' : 'hover:bg-chrome-hover'
      }`}
    >
      {children}
    </button>
  )
}

// Title bar for the frameless window; the whole bar is a drag region except the buttons
export function TitleBar() {
  return (
    <div className="flex h-8 select-none items-center border-b border-chrome-border bg-chrome text-chrome-fg [app-region:drag]">
      <div className="flex min-w-0 items-center gap-2 px-3">
        <GitMergeIcon size={16} className="shrink-0 text-chrome-fg-muted" />
        <span className="truncate text-xs">Git Visualizer</span>
      </div>

      <div className="ml-auto flex h-full [app-region:no-drag]">
        <CaptionButton label="Minimize" onClick={() => window.API.window.minimize()}>
          <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden>
            <path d="M0 5.5h10" stroke="currentColor" />
          </svg>
        </CaptionButton>
        <CaptionButton label="Close" danger onClick={() => window.API.window.close()}>
          <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden>
            <path d="M.5.5l9 9m0-9l-9 9" stroke="currentColor" />
          </svg>
        </CaptionButton>
      </div>
    </div>
  )
}
