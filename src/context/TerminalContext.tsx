import { createContext, useContext, useState, type ReactNode } from 'react'

interface TerminalContextType {
  // Last git command the UI ran, echoed in the TerminalPanel
  command: string
  setCommand: (command: string) => void
}

const TerminalContext = createContext<TerminalContextType | undefined>(undefined)

export function TerminalProvider({ children }: { children: ReactNode }) {
  const [command, setCommand] = useState('')

  return (
    <TerminalContext.Provider value={{ command, setCommand }}>{children}</TerminalContext.Provider>
  )
}

export function useTerminal() {
  const context = useContext(TerminalContext)
  if (!context) throw new Error('useTerminal must be used within a TerminalProvider')
  return context
}
