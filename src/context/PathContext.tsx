import { createContext, useContext, useState, type ReactNode } from 'react'

interface PathContextType {
  // Absolute path of the open repository; '' until one is chosen
  path: string
  setPath: (path: string) => void
}

const PathContext = createContext<PathContextType | undefined>(undefined)

export function PathProvider({ children }: { children: ReactNode }) {
  const [path, setPath] = useState('')

  return <PathContext.Provider value={{ path, setPath }}>{children}</PathContext.Provider>
}

export function usePath() {
  const context = useContext(PathContext)
  if (!context) throw new Error('usePath must be used within a PathProvider')
  return context
}
