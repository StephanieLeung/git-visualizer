import {
  CodeSquareIcon,
  FileDirectoryIcon,
  RepoIcon,
  TriangleDownIcon,
  type Icon
} from '@primer/octicons-react'
import { useState } from 'react'
import { usePath } from '../context/PathContext'
import { useRepositoryPicker } from '../hooks/useRepositoryPicker'
import { RecentRepoList } from './RecentRepoList'
import { Button } from './ui/button'
import { ErrorFlash } from './ui/flash'
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover'
import { Spinner } from './ui/spinner'

// What the system file manager is called, for the "Show in …" button
const FILE_MANAGER: Partial<Record<string, string>> = { win32: 'Explorer', darwin: 'Finder' }

interface ToolbarButtonProps {
  icon: Icon
  label: string
  onClick: () => void
}

// Icon plus label; the toolbar fits both labels even at the 720px minimum window width
function ToolbarButton({ icon: ButtonIcon, label, onClick }: ToolbarButtonProps) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 border-l border-chrome-border px-4 text-xs hover:bg-chrome-hover focus-visible:outline-chrome-focus"
    >
      <ButtonIcon size={16} className="shrink-0 text-chrome-fg-muted" />
      <span className="whitespace-nowrap">{label}</span>
    </button>
  )
}

// Contents of the "Current repository" dropdown: the recent list and a folder picker
function RepositoryFoldout({ onOpen }: { onOpen: () => void }) {
  const { recent, busy, error, currentPath, openRepo, forget } = useRepositoryPicker(onOpen)

  return (
    <div className="flex max-h-[calc(100vh-96px)] flex-col text-left">
      <div className="flex items-center gap-2 border-b border-border px-3 py-2">
        <h2 className="flex-1 text-xs font-semibold text-fg">Recent repositories</h2>
        <Button size="sm" onClick={() => openRepo()} disabled={busy}>
          {busy ? <Spinner className="size-3" /> : <FileDirectoryIcon size={16} />}
          {busy ? 'Opening…' : 'Open Repository…'}
        </Button>
      </div>
      {error && <ErrorFlash className="mx-3 mt-3">{error}</ErrorFlash>}
      <RecentRepoList
        repos={recent}
        currentPath={currentPath}
        busy={busy}
        onOpen={openRepo}
        onForget={forget}
        className="min-h-0 flex-1"
      />
    </div>
  )
}

interface ToolbarProps {
  // Called after another repository opens from the dropdown
  onRepositoryOpen: () => void
}

// GitHub Desktop-style toolbar: the repository switcher, and shortcuts for opening the repository
export function Toolbar({ onRepositoryOpen }: ToolbarProps) {
  const { path } = usePath()
  const [foldoutOpen, setFoldoutOpen] = useState(false)
  const repoName = path.split(/[\\/]/).filter(Boolean).pop() ?? path

  return (
    <div className="flex h-[50px] shrink-0 select-none border-b border-chrome-border bg-chrome text-chrome-fg">
      <Popover open={foldoutOpen} onOpenChange={setFoldoutOpen}>
        <PopoverTrigger asChild>
          <button
            title={path}
            className="group flex w-[260px] min-w-[180px] items-center gap-3 border-r border-chrome-border px-3 text-left hover:bg-chrome-hover focus-visible:outline-chrome-focus data-[state=open]:bg-canvas data-[state=open]:text-fg"
          >
            <RepoIcon
              size={16}
              className="shrink-0 text-chrome-fg-muted group-data-[state=open]:text-fg-muted"
            />
            <span className="min-w-0 flex-1 leading-tight">
              <span className="block text-[11px] text-chrome-fg-muted group-data-[state=open]:text-fg-muted">
                Current repository
              </span>
              <span className="block truncate text-[13px] font-semibold">{repoName}</span>
            </span>
            <TriangleDownIcon
              size={16}
              className="shrink-0 text-chrome-fg-muted group-data-[state=open]:text-fg-muted"
            />
          </button>
        </PopoverTrigger>
        <PopoverContent
          align="start"
          sideOffset={0}
          className="w-[360px] rounded-t-none border-t-0 bg-canvas p-0"
        >
          <RepositoryFoldout
            onOpen={() => {
              setFoldoutOpen(false)
              onRepositoryOpen()
            }}
          />
        </PopoverContent>
      </Popover>

      <div className="ml-auto flex">
        <ToolbarButton
          icon={CodeSquareIcon}
          label="Open in VS Code"
          onClick={() => window.API.open.vscode()}
        />
        <ToolbarButton
          icon={FileDirectoryIcon}
          label={`Show in ${FILE_MANAGER[window.API.platform] ?? 'File Manager'}`}
          onClick={() => window.API.open.folder()}
        />
      </div>
    </div>
  )
}
