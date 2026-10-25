import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode
} from 'react'
import type { GitRunResult } from '../../electron/git'

export type CommandStatus = 'idle' | 'running' | 'ok' | 'error'

interface TerminalContextType {
  // Last git command the UI ran, formatted for display
  command: string
  status: CommandStatus
  // One line of git's output for that command
  summary: string
  // Everything git printed for it
  output: string
  // Runs `git <args>` in the open repo and shows it in the TerminalPanel
  run: (args: string[]) => Promise<GitRunResult>
}

const TerminalContext = createContext<TerminalContextType | undefined>(undefined)

// Display form of a command; arguments with spaces or quotes are shown quoted
export function formatCommand(args: string[]): string {
  return [
    'git',
    ...args.map((arg) => (/^[\w@%+=:,./-]+$/.test(arg) ? arg : JSON.stringify(arg)))
  ].join(' ')
}

// Non-empty lines, minus advisory noise like CRLF warnings and hints
function meaningfulLines(text: string): string[] {
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line && !/^(warning|hint):/.test(line))
}

// On failure the fatal/error line. On success git's first line of output, or the last
// progress line when it only wrote to stderr (push, checkout).
function summarize({ ok, stdout, stderr }: GitRunResult): string {
  if (!ok) {
    const lines = meaningfulLines(`${stderr}\n${stdout}`)
    return lines.find((line) => /^(fatal|error):/.test(line)) ?? lines[0] ?? 'Command failed'
  }
  const progress = meaningfulLines(stderr)
  return meaningfulLines(stdout)[0] ?? progress[progress.length - 1] ?? 'Done'
}

export function TerminalProvider({ children }: { children: ReactNode }) {
  const [command, setCommand] = useState('')
  const [status, setStatus] = useState<CommandStatus>('idle')
  const [summary, setSummary] = useState('')
  const [output, setOutput] = useState('')
  // A slow command must not overwrite the result of one started after it
  const latestRun = useRef(0)

  const run = useCallback(async (args: string[]) => {
    const runId = ++latestRun.current
    setCommand(formatCommand(args))
    setStatus('running')
    setSummary('')
    setOutput('')

    let result: GitRunResult
    try {
      result = await window.API.git.run(args)
    } catch (err) {
      result = { ok: false, stdout: '', stderr: err instanceof Error ? err.message : String(err) }
    }

    if (runId === latestRun.current) {
      setStatus(result.ok ? 'ok' : 'error')
      setSummary(summarize(result))
      setOutput(`${result.stdout}\n${result.stderr}`.trim())
    }
    return result
  }, [])

  const value = useMemo(
    () => ({ command, status, summary, output, run }),
    [command, status, summary, output, run]
  )

  return <TerminalContext.Provider value={value}>{children}</TerminalContext.Provider>
}

export function useTerminal() {
  const context = useContext(TerminalContext)
  if (!context) throw new Error('useTerminal must be used within a TerminalProvider')
  return context
}
