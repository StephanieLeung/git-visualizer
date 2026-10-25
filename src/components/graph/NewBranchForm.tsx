import { GitBranchIcon } from '@primer/octicons-react'
import { useState, type FormEvent } from 'react'
import { summarize } from '../../context/TerminalContext'
import { useGitActions } from '../../hooks/useGitActions'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Spinner } from '../ui/spinner'

interface NewBranchFormProps {
  // Commit hash the new branch starts at
  startPoint: string
  // Called once the branch exists and is checked out
  onCreated: () => void
  // id for the name field, unique per card
  inputId: string
}

// "New branch…" button that opens into a name field; creating the branch also switches to it
export function NewBranchForm({ startPoint, onCreated, inputId }: NewBranchFormProps) {
  const actions = useGitActions()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const canCreate = name.trim() !== '' && !creating

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!canCreate) return
    setCreating(true)
    setError(null)
    const result = await actions.createBranch(name.trim(), startPoint)
    setCreating(false)
    if (result.ok) onCreated()
    else setError(summarize(result))
  }

  if (!open) {
    return (
      <Button size="sm" className="w-full" onClick={() => setOpen(true)}>
        <GitBranchIcon size={16} className="text-fg-muted" />
        New branch…
      </Button>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="motion-safe:animate-fade-in">
      <label htmlFor={inputId} className="mb-1.5 block text-xs font-semibold text-fg">
        New branch
      </label>
      <Input
        id={inputId}
        autoFocus
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Branch name"
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${inputId}-error` : undefined}
      />
      {error && (
        <p
          id={`${inputId}-error`}
          className="mt-1.5 text-[11px] text-danger-fg [overflow-wrap:anywhere]"
        >
          {error}
        </p>
      )}
      <div className="mt-2 flex gap-2">
        <Button type="submit" variant="primary" size="sm" disabled={!canCreate} className="flex-1">
          {creating ? (
            <>
              <Spinner className="size-3" />
              Creating…
            </>
          ) : (
            'Create branch'
          )}
        </Button>
        <Button
          variant="invisible"
          size="sm"
          onClick={() => {
            setOpen(false)
            setName('')
            setError(null)
          }}
        >
          Cancel
        </Button>
      </div>
    </form>
  )
}
