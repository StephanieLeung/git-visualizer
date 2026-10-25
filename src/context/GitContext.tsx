import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode
} from 'react'
import type { GitSnapshot } from '../../electron/git'
import { usePath } from './PathContext'

// LittleMan's mood: 'dirty' = uncommitted changes, 'stashed' = clean tree but a stash exists
export type CharacterState = 'idle' | 'working' | 'dirty' | 'stashed'
export type AnimationState = 'none' | 'pulling' | 'pushing'

interface GitContextType {
  // False until the first snapshot of the open repo arrives
  ready: boolean
  status: string
  logs: string
  hasChanges: boolean
  hasStash: boolean
  // Changes whenever any ref moves or HEAD switches branch
  refsKey: string
  error: string | null
  characterState: CharacterState
  animationState: AnimationState
  refetchGit: () => Promise<void>
  // Plays the pull/push animation while `task` runs
  withAnimation: <T>(type: 'pulling' | 'pushing', task: () => Promise<T>) => Promise<T>
}

const POLL_MS = 5000
// One loop of assets/pull.gif, so short commands still show the whole animation
const MIN_ANIMATION_MS = 1700

const GitContext = createContext<GitContextType | undefined>(undefined)

function sameSnapshot(a: GitSnapshot, b: GitSnapshot): boolean {
  return (Object.keys(a) as (keyof GitSnapshot)[]).every((key) => a[key] === b[key])
}

// Polled git state of the open repo, shared by the Log tab, the DAG and LittleMan
export function GitProvider({ children }: { children: ReactNode }) {
  const { path } = usePath()
  const [snapshot, setSnapshot] = useState<GitSnapshot | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [animationState, setAnimationState] = useState<AnimationState>('none')
  const pathRef = useRef(path)
  // Responses can arrive out of order; only the newest request may update state
  const requestSeq = useRef(0)
  const appliedSeq = useRef(0)

  const refetchGit = useCallback(async () => {
    const seq = ++requestSeq.current
    try {
      const next = await window.API.git.snapshot()
      if (seq < appliedSeq.current || next.repoPath !== pathRef.current) return
      appliedSeq.current = seq
      setSnapshot((prev) => (prev && sameSnapshot(prev, next) ? prev : next))
      setError(null)
    } catch (err) {
      if (seq < appliedSeq.current) return
      setError((err instanceof Error && err.message) || 'Failed to fetch git data')
    }
  }, [])

  // New repository: drop the old snapshot and load the new one
  useEffect(() => {
    pathRef.current = path
    setSnapshot(null)
    refetchGit()
  }, [path, refetchGit])

  // Keep up with changes made outside the app (editor saves, terminal commits...)
  useEffect(() => {
    const intervalId = setInterval(refetchGit, POLL_MS)
    return () => clearInterval(intervalId)
  }, [refetchGit])

  const withAnimation = useCallback(
    async <T,>(type: 'pulling' | 'pushing', task: () => Promise<T>): Promise<T> => {
      setAnimationState(type)
      const started = Date.now()
      try {
        return await task()
      } finally {
        const remaining = MIN_ANIMATION_MS - (Date.now() - started)
        if (remaining > 0) await new Promise((resolve) => setTimeout(resolve, remaining))
        setAnimationState('none')
      }
    },
    []
  )

  const characterState: CharacterState =
    animationState !== 'none'
      ? 'working'
      : snapshot?.hasChanges
        ? 'dirty'
        : snapshot?.hasStash
          ? 'stashed'
          : 'idle'

  const value = useMemo(
    () => ({
      ready: snapshot !== null,
      status: snapshot?.status ?? '',
      logs: snapshot?.logs ?? '',
      hasChanges: snapshot?.hasChanges ?? false,
      hasStash: snapshot?.hasStash ?? false,
      refsKey: snapshot?.refsKey ?? '',
      error,
      characterState,
      animationState,
      refetchGit,
      withAnimation
    }),
    [snapshot, error, characterState, animationState, refetchGit, withAnimation]
  )

  return <GitContext.Provider value={value}>{children}</GitContext.Provider>
}

export function useGit() {
  const context = useContext(GitContext)
  if (!context) throw new Error('useGit must be used within GitProvider')
  return context
}
