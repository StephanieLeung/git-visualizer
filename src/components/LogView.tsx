import { useGit } from '../context/GitContext'

// Text colour for one line of `git status` output
function statusLineClass(line: string): string {
  if (line.includes('modified:')) return 'text-yellow-600'
  if (line.includes('deleted:')) return 'text-red-600'
  if (line.includes('new file:')) return 'text-green-600'
  return 'text-gray-600'
}

// "Log" tab: raw `git status` output and the last 5 commits
export function LogView() {
  const { status, logs, loading } = useGit()

  return (
    <div className="flex-1 p-4 overflow-auto bg-purple-50/30">
      <div className="font-mono text-xs space-y-1 bg-white p-4 rounded-2xl border-2 border-purple-100">
        {loading ? (
          <div className="text-gray-500">Loading git status...</div>
        ) : (
          <>
            <div className="text-purple-600 font-semibold">$ git status</div>
            {status.split('\n').map((line, index) => (
              <div key={index} className={statusLineClass(line)}>
                {line || ' '}
              </div>
            ))}

            <div className="mt-4 text-purple-600 font-semibold">$ git log -5</div>
            {logs.split('\n').map((line, index) => (
              <div key={index} className="text-gray-600">
                {line || ' '}
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  )
}
