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

// A command that failed, as the error dialog shows it
export interface GitFailure {
  args: string[]
  command: string
  // Everything git printed for it
  output: string
}

export interface RunOptions {
  // false when the caller shows the error itself (e.g. under a form field); default true
  showErrorDialog?: boolean
}

interface TerminalContextType {
  // Last git command the UI ran, formatted for display
  command: string
  status: CommandStatus
  // One line of git's output for that command
  summary: string
  // Everything git printed for it
  output: string
  // Runs `git <args>` in the open repo and shows it in the TerminalPanel; a failure also opens
  // the error dialog unless options.showErrorDialog is false
  run: (args: string[], options?: RunOptions) => Promise<GitRunResult>
  // The failure the error dialog is showing, or null when it's closed
  failure: GitFailure | null
  // Reopens the dialog for the status bar's command, if it failed
  showLastFailure: () => void
  dismissFailure: () => void
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
// progress line when it only wrote to stderr (push, checkout). Also used for inline errors.
export function summarize({ ok, stdout, stderr }: GitRunResult): string {
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
  const [failure, setFailure] = useState<GitFailure | null>(null)
  // A slow command must not overwrite the result of one started after it
  const latestRun = useRef(0)
  // The status bar command's failure, for its Failed button; null unless it failed
  const lastFailure = useRef<GitFailure | null>(null)

  const run = useCallback(async (args: string[], options: RunOptions = {}) => {
    const runId = ++latestRun.current
    setCommand(formatCommand(args))
    setStatus('running')
    setSummary('')
    setOutput('')
    lastFailure.current = null

    let result: GitRunResult
    try {
      result = await window.API.git.run(args)
    } catch (err) {
      result = { ok: false, stdout: '', stderr: err instanceof Error ? err.message : String(err) }
    }

    const fullOutput = `${result.stdout}\n${result.stderr}`.trim()
    const failed = result.ok ? null : { args, command: formatCommand(args), output: fullOutput }
    // Every failure gets the dialog, even if a newer command has started since
    if (failed && options.showErrorDialog !== false) setFailure(failed)

    if (runId === latestRun.current) {
      setStatus(result.ok ? 'ok' : 'error')
      setSummary(summarize(result))
      setOutput(fullOutput)
      lastFailure.current = failed
    }
    return result
  }, [])

  const showLastFailure = useCallback(() => {
    if (lastFailure.current) setFailure(lastFailure.current)
  }, [])
  const dismissFailure = useCallback(() => setFailure(null), [])

  const value = useMemo(
    () => ({ command, status, summary, output, run, failure, showLastFailure, dismissFailure }),
    [command, status, summary, output, run, failure, showLastFailure, dismissFailure]
  )

  return <TerminalContext.Provider value={value}>{children}</TerminalContext.Provider>
}

export function useTerminal() {
  const context = useContext(TerminalContext)
  if (!context) throw new Error('useTerminal must be used within a TerminalProvider')
  return context
}
