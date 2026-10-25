// One commit from `git log --all --parents --pretty=format:%H|%P|%D|%s` (see electron/ipc.ts)
export interface Commit {
  hash: string
  parents: string[]
  // Ref decorations, e.g. "HEAD -> main", "origin/main", "tag: v1.0"
  refs: string[]
  message: string
}

// Loads the full commit history; resolves to [] (and logs) on failure
export async function fetchCommits(): Promise<Commit[]> {
  try {
    return parseCommits(await window.API.git.getHistory())
  } catch (err) {
    console.error('Error fetching commits:', err)
    return []
  }
}

// Parses one "<hash>|<parents>|<refs>|<subject>" line per commit.
// TODO: subjects containing '|' are cut off at the first '|'
export function parseCommits(gitOutput: string): Commit[] {
  return gitOutput
    .split('\n')
    .filter((line) => line.trim())
    .map((line) => {
      const [hash, parents, refs, message] = line.split('|')
      return {
        hash: (hash || '').trim(),
        parents: parents ? parents.trim().split(' ').filter(Boolean) : [],
        refs: refs
          ? refs
              .trim()
              .split(', ')
              .map((r) => r.trim())
              .filter(Boolean)
          : [],
        message: (message || '').trim() || 'No message'
      }
    })
    .filter((c) => c.hash)
}
