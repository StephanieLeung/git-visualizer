export type RefKind = 'local' | 'remote' | 'tag'

export interface GitRef {
  kind: RefKind
  // Display name, e.g. "main", "origin/main", "v1.0"
  name: string
  // Branch name without the remote prefix (local and remote refs only)
  branch?: string
  // The branch HEAD is currently on
  isCurrent?: boolean
  // Local branch with no commits of its own yet (see git:newBranches in electron/ipc.ts)
  isNew?: boolean
}

// One commit from the git:history channel (see electron/ipc.ts)
export interface Commit {
  hash: string
  parents: string[]
  refs: GitRef[]
  // HEAD points at this commit, on a branch or detached
  isHead: boolean
  message: string
}

// How clicking a commit checks it out
export interface CheckoutTarget {
  label: string
  args: string[]
}

const FIELD_SEPARATOR = '\x1f'

// Loads the commit graph, marking just-created branches; resolves to [] (and logs) on failure
export async function fetchCommits(): Promise<Commit[]> {
  try {
    const [output, newBranches] = await Promise.all([
      window.API.git.history(),
      window.API.git.newBranches()
    ])
    const isNew = new Set(newBranches)
    const commits = parseCommits(output)
    for (const ref of commits.flatMap((c) => c.refs)) {
      if (ref.kind === 'local' && isNew.has(ref.name)) ref.isNew = true
    }
    return commits
  } catch (err) {
    console.error('Error fetching commits:', err)
    return []
  }
}

// Parses "<hash>\x1f<parents>\x1f<decorations>\x1f<subject>" lines (decorations from --decorate=full)
export function parseCommits(output: string): Commit[] {
  return output
    .split('\n')
    .filter((line) => line.trim())
    .map((line) => {
      const [hash = '', parents = '', decorations = '', ...subject] = line.split(FIELD_SEPARATOR)
      const commit: Commit = {
        hash: hash.trim(),
        parents: parents.split(' ').filter(Boolean),
        refs: [],
        isHead: false,
        message: subject.join(FIELD_SEPARATOR).trim() || 'No message'
      }
      decorations
        .split(', ')
        .map((d) => d.trim())
        .filter(Boolean)
        .forEach((decoration) => addDecoration(commit, decoration))
      return commit
    })
    .filter((c) => c.hash)
}

// e.g. "HEAD -> refs/heads/main", "HEAD", "refs/remotes/origin/main", "tag: refs/tags/v1.0"
function addDecoration(commit: Commit, decoration: string) {
  if (decoration === 'HEAD') {
    commit.isHead = true // detached
    return
  }

  let ref = decoration
  const isCurrent = ref.startsWith('HEAD -> ')
  if (isCurrent) {
    commit.isHead = true
    ref = ref.slice('HEAD -> '.length)
  }

  if (ref.startsWith('tag: refs/tags/')) {
    commit.refs.push({ kind: 'tag', name: ref.slice('tag: refs/tags/'.length) })
  } else if (ref.startsWith('refs/heads/')) {
    const name = ref.slice('refs/heads/'.length)
    commit.refs.push({ kind: 'local', name, branch: name, isCurrent })
  } else if (ref.startsWith('refs/remotes/')) {
    const name = ref.slice('refs/remotes/'.length)
    const branch = name.slice(name.indexOf('/') + 1)
    // Skip origin/HEAD-style symbolic refs; they just mirror another remote branch
    if (name.includes('/') && branch !== 'HEAD') commit.refs.push({ kind: 'remote', name, branch })
  }
}

// Branch to switch to when this commit is clicked: a local branch that isn't checked out yet,
// otherwise a remote branch (tracked as a new local branch, or detached if the name is taken)
export function checkoutTarget(commit: Commit, localBranches: Set<string>): CheckoutTarget | null {
  const local = commit.refs.find((r) => r.kind === 'local' && !r.isCurrent)
  if (local) return { label: local.name, args: ['checkout', local.name] }

  const remote = commit.refs.find((r) => r.kind === 'remote')
  if (!remote?.branch) return null
  return localBranches.has(remote.branch)
    ? { label: `${remote.name} (detached)`, args: ['checkout', remote.name] }
    : { label: remote.branch, args: ['checkout', '--track', remote.name] }
}
