import { FileText, FolderTree, Smile, type LucideIcon } from 'lucide-react'

export type Tab = 'landing' | 'tree' | 'log'

const TABS: { id: Tab; label: string; icon: LucideIcon }[] = [
  { id: 'landing', label: 'Landing', icon: Smile },
  { id: 'tree', label: 'Tree', icon: FolderTree },
  { id: 'log', label: 'Log', icon: FileText }
]

interface MenuBarProps {
  activeTab: Tab
  setActiveTab: (tab: Tab) => void
}

export function MenuBar({ activeTab, setActiveTab }: MenuBarProps) {
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
      </div>
    </div>
  )
}
