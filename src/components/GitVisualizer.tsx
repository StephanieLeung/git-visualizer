import { useState } from 'react'
import { DAGGraph } from './graph/DAGGraph'
import { LogView } from './LogView'
import { TabBar, type Tab } from './TabBar'
import { TerminalPanel } from './TerminalPanel'
import { Toolbar } from './Toolbar'

// Main screen once a repo is open: toolbar, tabs, the active tab, and the command status bar
export function GitVisualizer() {
  const [activeTab, setActiveTab] = useState<Tab>('tree')

  return (
    <div className="flex h-full flex-col">
      {/* Opening another repository from the toolbar shows its graph */}
      <Toolbar onRepositoryOpen={() => setActiveTab('tree')} />
      <TabBar activeTab={activeTab} setActiveTab={setActiveTab} />

      <main
        id={`panel-${activeTab}`}
        role="tabpanel"
        aria-labelledby={`tab-${activeTab}`}
        className="flex min-h-0 flex-1"
      >
        {activeTab === 'tree' ? <DAGGraph /> : <LogView />}
      </main>

      <TerminalPanel />
    </div>
  )
}
