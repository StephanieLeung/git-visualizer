import {
  FileText,
  FolderGit2,
  FolderOpen,
  FolderTree,
  SquareCode,
  type LucideIcon
} from 'lucide-react'
import { usePath } from '../context/PathContext'

export type Tab = 'repos' | 'tree' | 'log'

const TABS: { id: Tab; label: string; icon: LucideIcon }[] = [
  { id: 'repos', label: 'Repositories', icon: FolderGit2 },
  { id: 'tree', label: 'Tree', icon: FolderTree },
  { id: 'log', label: 'Log', icon: FileText }
]

// What the system file manager is called, for the "Show in …" button
const FILE_MANAGER: Partial<Record<string, string>> = { win32: 'Explorer', darwin: 'Finder' }

const ACTION_CLASS =
  'px-3 py-1 text-xs font-semibold flex items-center gap-1.5 rounded-full text-purple-600 hover:bg-purple-100 hover:text-purple-800'

interface MenuBarProps {
  activeTab: Tab
  setActiveTab: (tab: Tab) => void
}

export function MenuBar({ activeTab, setActiveTab }: MenuBarProps) {
  const { path } = usePath()
  const repoName = path.split(/[\\/]/).filter(Boolean).pop() ?? path

  return (
    <div className="bg-purple-50 border-b-2 border-purple-200">
      <div className="flex items-center px-3 pt-2 gap-1">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`px-4 py-2 text-xs font-semibold flex items-center gap-2 rounded-t-xl transition-all ${
              activeTab === id
                ? 'bg-white text-purple-600 shadow-sm border-2 border-b-0 border-purple-200'
                : 'text-purple-400 hover:text-purple-600 hover:bg-purple-100/50'
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}

        {/* The open repository and GitHub Desktop-style shortcuts for it */}
        <div className="ml-auto min-w-0 flex items-center gap-1 pb-1">
          <span title={path} className="mr-2 truncate text-xs font-semibold text-purple-800">
            {repoName}
          </span>
          <button onClick={() => window.API.open.vscode()} className={ACTION_CLASS}>
            <SquareCode className="w-4 h-4" />
            Open in VS Code
          </button>
          <button onClick={() => window.API.open.folder()} className={ACTION_CLASS}>
            <FolderOpen className="w-4 h-4" />
            Show in {FILE_MANAGER[window.API.platform] ?? 'File Manager'}
          </button>
        </div>
      </div>
    </div>
  )
}
