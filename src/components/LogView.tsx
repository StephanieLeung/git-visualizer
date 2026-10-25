import type { ReactNode } from 'react'
import { useGit } from '../context/GitContext'

// Text colour for one line of `git status` output
function statusLineClass(line: string): string {
  if (line.includes('modified:')) return 'text-attention-fg'
  if (line.includes('deleted:')) return 'text-danger-fg'
  if (line.includes('new file:')) return 'text-success-fg'
  return 'text-fg'
}

interface LogEntry {
  hash: string
  parents: string[]
  author: string
  when: string
  subject: string
}

// One "<hash>|<parents>|<author>|<when>|<subject>" line (see git:snapshot), or null if it doesn't fit
function parseLogLine(line: string): LogEntry | null {
  const [hash, parents, author, when, ...subject] = line.split('|')
  if (!hash || parents === undefined || when === undefined || subject.length === 0) return null
  // A | inside the subject split it apart; join it back
  return {
    hash,
    parents: parents.split(' ').filter(Boolean),
    author,
    when,
    subject: subject.join('|')
  }
}

function Box({
  title,
  command,
  children
}: {
  title: string
  command: string
  children: ReactNode
}) {
  return (
    <section className="overflow-hidden rounded-md border border-border">
      <header className="flex items-baseline gap-2 border-b border-border bg-canvas-subtle px-3 py-2">
        <h2 className="text-xs font-semibold text-fg">{title}</h2>
        <code className="font-mono text-[11px] text-fg-muted">{command}</code>
      </header>
      {children}
    </section>
  )
}

function LogSkeleton() {
  return (
    <div
      aria-busy="true"
      aria-label="Loading git status"
      className="min-w-0 flex-1 bg-canvas p-4 motion-safe:animate-pulse"
    >
      <div className="max-w-[960px] overflow-hidden rounded-md border border-border">
        <div className="h-9 border-b border-border bg-canvas-subtle" />
        <div className="space-y-2.5 p-3">
          {[220, 300, 180, 260].map((width) => (
            <div key={width} className="h-2.5 rounded-sm bg-fg/10" style={{ width }} />
          ))}
        </div>
      </div>
    </div>
  )
}

// "Log" tab: raw `git status` output and the last 5 commits
export function LogView() {
  const { status, logs, ready } = useGit()

  if (!ready) return <LogSkeleton />

  const logLines = logs.split('\n').filter((line) => line.trim())

  return (
    <div className="min-w-0 flex-1 overflow-auto bg-canvas p-4">
      <div className="flex max-w-[960px] flex-col gap-4 text-left">
        <Box title="Status" command="git status">
          <div className="overflow-x-auto px-3 py-2 font-mono text-xs leading-5 whitespace-pre [tab-size:4]">
            {status.split('\n').map((line, index) => (
              <div key={index} className={statusLineClass(line)}>
                {line || ' '}
              </div>
            ))}
          </div>
        </Box>

        <Box title="Recent commits" command="git log -5">
          {logLines.length === 0 ? (
            <p className="px-3 py-6 text-center text-xs text-fg-muted">No commits yet</p>
          ) : (
            <ul className="divide-y divide-border">
              {logLines.map((line, index) => {
                const entry = parseLogLine(line)
                if (!entry) {
                  return (
                    <li key={index} className="px-3 py-2 font-mono text-xs text-fg-muted">
                      {line}
                    </li>
                  )
                }
                return (
                  <li key={index} className="flex items-center gap-3 px-3 py-2">
                    <div className="min-w-0 flex-1">
                      <p title={entry.subject} className="truncate text-[13px] text-fg">
                        {entry.subject}
                      </p>
                      <p className="truncate text-[11px] text-fg-muted">
                        {entry.author} · {entry.when}
                        {entry.parents.length > 0 && (
                          <>
                            {' · '}
                            {entry.parents.length > 1 ? 'parents' : 'parent'}{' '}
                            <span className="font-mono">{entry.parents.join(', ')}</span>
                          </>
                        )}
                      </p>
                    </div>
                    <code className="shrink-0 rounded-md border border-border px-1.5 font-mono text-[11px] text-fg-muted">
                      {entry.hash}
                    </code>
                  </li>
                )
              })}
            </ul>
          )}
        </Box>
      </div>
    </div>
  )
}
