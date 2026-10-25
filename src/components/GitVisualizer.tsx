import { useEffect, useState } from 'react'
import { useGit } from '../context/GitContext'
import { usePath } from '../context/PathContext'
import { DAGGraph } from './graph/DAGGraph'
import { Landing } from './Landing'
import { LogView } from './LogView'
import { MenuBar, type Tab } from './MenuBar'
import { TerminalPanel } from './TerminalPanel'

const HAS_CHANGES_POLL_MS = 5000

// Main screen once a repo is open: tab bar, the active tab, and the command echo panel
export function GitVisualizer() {
  const [activeTab, setActiveTab] = useState<Tab>('tree')
  const { path } = usePath()
  const { refetchGit } = useGit()

  // Refresh git state on mount and whenever a different repository is opened
  useEffect(() => {
    refetchGit()
  }, [path, refetchGit])

  // TODO: the result is only logged; nothing updates when the working tree changes
  useEffect(() => {
    const intervalId = setInterval(() => {
      window.API.git
        .hasChanges()
        .then((hasChanges) => console.log('git:hasChanges response:', hasChanges))
        .catch((error) => console.error('Error calling git:hasChanges:', error))
    }, HAS_CHANGES_POLL_MS)

    return () => clearInterval(intervalId)
  }, [])

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
