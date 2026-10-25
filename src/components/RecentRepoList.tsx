import { AlertIcon, RepoIcon, XIcon } from '@primer/octicons-react'
import type { RecentRepo } from '../../electron/recentRepos'
import { cn } from './ui/utils'

interface RecentRepoListProps {
  repos: RecentRepo[]
  // Path of the open repository, marked "Current"
  currentPath: string
  // While a repository is opening, every row is disabled
  busy: boolean
  onOpen: (repo: string) => void
  onForget: (repo: string) => void
  className?: string
}

// Recently opened repositories, most recent first. Folders that have moved or been deleted are
// listed but can't be opened.
export function RecentRepoList({
  repos,
  currentPath,
  busy,
  onOpen,
  onForget,
  className
}: RecentRepoListProps) {
  if (repos.length === 0) {
    return (
      <p className={cn('px-4 py-8 text-center text-xs text-fg-muted', className)}>
        Repositories you open will appear here.
      </p>
    )
  }

  return (
    <ul className={cn('divide-y divide-border overflow-auto', className)}>
      {repos.map((repo) => {
        const openable = repo.exists && !busy
        return (
          <li
            key={repo.path}
            className={cn('group relative flex items-center', openable && 'hover:bg-hover')}
          >
            <button
              onClick={() => onOpen(repo.path)}
              disabled={!openable}
              title={repo.path}
              className="flex min-w-0 flex-1 items-center gap-3 py-2 pr-10 pl-3 text-left disabled:cursor-not-allowed"
            >
              {repo.exists ? (
                <RepoIcon size={16} className="shrink-0 text-fg-muted" />
              ) : (
                <AlertIcon size={16} className="shrink-0 text-attention-fg" />
              )}
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-2">
                  <span
                    className={cn(
                      'truncate text-[13px] font-semibold',
                      repo.exists ? 'text-fg' : 'text-fg-muted'
                    )}
                  >
                    {repo.name}
                  </span>
                  {repo.path === currentPath && (
                    <span className="shrink-0 rounded-full border border-accent-fg/40 px-1.5 text-[11px] leading-[18px] font-medium text-accent-fg">
                      Current
                    </span>
                  )}
                </span>
                <span className="block truncate text-[11px] text-fg-muted">
                  {repo.exists ? repo.path : `Folder not found: ${repo.path}`}
                </span>
              </span>
            </button>
            <button
              onClick={() => onForget(repo.path)}
              aria-label={`Remove ${repo.name} from the list`}
              title="Remove from list"
              className="absolute right-2 flex size-6 items-center justify-center rounded-md text-fg-muted opacity-0 group-hover:opacity-100 hover:bg-hover hover:text-fg focus-visible:opacity-100"
            >
              <XIcon size={16} />
            </button>
          </li>
        )
      })}
    </ul>
  )
}
