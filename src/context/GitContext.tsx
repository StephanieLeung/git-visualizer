import { createContext, useCallback, useContext, useState, type ReactNode } from 'react'

// LittleMan's mood; 'dirty' means the working tree has uncommitted changes
export type CharacterState = 'idle' | 'working' | 'dirty'
export type AnimationState = 'none' | 'pulling' | 'pushing'

export interface GitData {
  status: string
  logs: string
  loading: boolean
  error: string | null
  characterState: CharacterState
  animationState: AnimationState
  hasUnstagedChanges: boolean
}

interface GitContextType extends GitData {
  refetchGit: () => Promise<void>
  setCharacterState: (state: CharacterState) => void
  triggerAnimation: (type: 'pulling' | 'pushing') => void
}

// How long the pull/push animation plays before git state is refreshed
const ANIMATION_MS = 4000

const GitContext = createContext<GitContextType | undefined>(undefined)

// Snapshot of the open repo's git state, shared by the Log tab, the DAG and LittleMan
export function GitProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState('')
  const [logs, setLogs] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [characterState, setCharacterState] = useState<CharacterState>('idle')
  const [animationState, setAnimationState] = useState<AnimationState>('none')
  const [hasUnstagedChanges, setHasUnstagedChanges] = useState(false)

  // Reloads `git status`, the recent log and the dirty flag from the main process
  const refetchGit = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await window.API.git.startup()
      setStatus(data.status)
      setLogs(data.logs)

      const hasChanges = await window.API.git.hasChanges()
      setHasUnstagedChanges(hasChanges)
      setCharacterState(hasChanges ? 'dirty' : 'idle')
    } catch (err) {
      setError((err instanceof Error && err.message) || 'Failed to fetch git data')
    } finally {
      setLoading(false)
    }
  }, [])

  const triggerAnimation = useCallback(
    (type: 'pulling' | 'pushing') => {
      setAnimationState(type)
      setTimeout(() => {
        setAnimationState('none')
        refetchGit()
      }, ANIMATION_MS)
    },
    [refetchGit]
  )

  return (
    <GitContext.Provider
      value={{
        status,
        logs,
        loading,
        error,
        refetchGit,
        characterState,
        setCharacterState,
        animationState,
        triggerAnimation,
        hasUnstagedChanges
      }}
    >
      {children}
    </GitContext.Provider>
  )
}

export function useGit() {
  const context = useContext(GitContext)
  if (!context) throw new Error('useGit must be used within GitProvider')
  return context
}
