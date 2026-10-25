import { Terminal } from 'lucide-react'
import { useTerminal, type CommandStatus } from '../context/TerminalContext'

const STATUS_STYLES: Record<Exclude<CommandStatus, 'idle'>, { icon: string; className: string }> = {
  running: { icon: '…', className: 'text-purple-400' },
  ok: { icon: '✓', className: 'text-green-600' },
  error: { icon: '✗', className: 'text-red-600' }
}

// Read-only "terminal" showing the last git command the UI ran and how it went
export function TerminalPanel() {
  const { command, status, summary, output } = useTerminal()
  const style = status === 'idle' ? null : STATUS_STYLES[status]

  return (
    <div className="bg-gradient-to-r from-purple-100 via-pink-100 to-blue-100 border-t-2 border-purple-200 p-3">
      <div className="bg-white rounded-2xl border-2 border-purple-200 px-4 py-2 flex items-center gap-2 shadow-sm">
        <Terminal className="w-4 h-4 text-purple-500" />
        <span className="text-purple-600 font-mono text-sm font-semibold">$</span>
        <span
          className={`flex-1 min-w-0 truncate text-left text-sm font-mono ${command ? 'text-purple-700' : 'text-purple-300'}`}
        >
          {command || 'git pull'}
        </span>
        {style && (
          <span
            title={output || summary}
            className={`shrink-0 max-w-[50%] truncate text-xs font-mono ${style.className}`}
          >
            {style.icon} {status === 'running' ? 'running' : summary}
          </span>
        )}
      </div>
    </div>
  )
}
