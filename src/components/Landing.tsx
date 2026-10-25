import { FileDirectoryIcon } from '@primer/octicons-react'
import littleman from '../assets/lilman.svg'
import { useRepositoryPicker } from '../hooks/useRepositoryPicker'
import { RecentRepoList } from './RecentRepoList'
import { Button } from './ui/button'
import { ErrorFlash } from './ui/flash'
import { Spinner } from './ui/spinner'

// Welcome screen, shown until a repository is open (the toolbar's dropdown switches repos after)
export function Landing() {
  const { recent, busy, error, currentPath, openRepo, forget } = useRepositoryPicker()

  return (
    <div className="flex h-full overflow-auto bg-canvas p-8">
      <div className="m-auto grid w-full max-w-[880px] items-start gap-10 md:grid-cols-2">
        <section className="text-left">
          <img src={littleman} alt="" className="mb-6 h-16 w-auto" />
          <h1 className="text-[28px] leading-tight font-normal text-fg">
            Welcome to Git Visualizer
          </h1>
          <p className="mt-2 max-w-[42ch] text-sm text-fg-muted">
            Choose a local git repository folder to visualize its branches and commits.
          </p>
          <Button variant="primary" className="mt-6" onClick={() => openRepo()} disabled={busy}>
            {busy ? <Spinner /> : <FileDirectoryIcon size={16} />}
            {busy ? 'Opening…' : 'Open Repository…'}
          </Button>
          {error && <ErrorFlash className="mt-4">{error}</ErrorFlash>}
        </section>

        <section className="overflow-hidden rounded-md border border-border text-left">
          <h2 className="border-b border-border bg-canvas-subtle px-3 py-2 text-xs font-semibold text-fg">
            Recent repositories
          </h2>
          <RecentRepoList
            repos={recent}
            currentPath={currentPath}
            busy={busy}
            onOpen={openRepo}
            onForget={forget}
            className="max-h-80"
          />
        </section>
      </div>
    </div>
  )
}
