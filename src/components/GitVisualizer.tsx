import { useState } from 'react'
import { DAGGraph } from './graph/DAGGraph'
import { Landing } from './Landing'
import { LogView } from './LogView'
import { MenuBar, type Tab } from './MenuBar'
import { TerminalPanel } from './TerminalPanel'

// Main screen once a repo is open: tab bar, the active tab, and the command panel
export function GitVisualizer() {
  const [activeTab, setActiveTab] = useState<Tab>('tree')

  return (
    <div className="flex flex-col h-full justify-between">
      <MenuBar activeTab={activeTab} setActiveTab={setActiveTab} />

      <div className="flex-1 overflow-hidden flex">
        {activeTab === 'landing' && (
          <div className="w-full flex justify-center items-center">
            <Landing />
          </div>
        )}
        {activeTab === 'tree' && (
          <div className="flex-1 h-full w-full overflow-hidden">
            <DAGGraph />
          </div>
        )}
        {activeTab === 'log' && <LogView />}
      </div>

      <TerminalPanel />
    </div>
  )
}
