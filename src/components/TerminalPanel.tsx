import { Terminal } from 'lucide-react'
import { useTerminal } from '../context/TerminalContext'

// Read-only "terminal" that echoes the last git command the UI ran
export function TerminalPanel() {
  const { command } = useTerminal()

  return (
    <div className="bg-gradient-to-r from-purple-100 via-pink-100 to-blue-100 border-t-2 border-purple-200 p-3">
      <div className="bg-white rounded-2xl border-2 border-purple-200 px-4 py-2 flex items-center gap-2 shadow-sm">
        <Terminal className="w-4 h-4 text-purple-500" />
        <span className="text-purple-600 font-mono text-sm font-semibold">$</span>
        <input
          disabled
          type="text"
          value={command}
          placeholder="git pull"
          className="flex-1 bg-transparent outline-none text-sm font-mono text-purple-700 placeholder:text-purple-300"
        />
      </div>
    </div>
  )
}
