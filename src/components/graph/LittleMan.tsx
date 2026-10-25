import { EllipsisVertical } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import holdBox from '../../assets/hold_box.svg'
import littleman from '../../assets/lilman.svg'
import luggage from '../../assets/luggage.svg'
import pull from '../../assets/pull.gif'
import { useGit, type CharacterState } from '../../context/GitContext'
import { useGitActions } from '../../hooks/useGitActions'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../ui/accordion'
import { Input } from '../ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover'

const STATE_SPRITES: Record<CharacterState, string> = {
  idle: littleman,
  working: pull,
  dirty: holdBox,
  stashed: luggage
}

interface LittleManProps {
  menuOpen: boolean
  onMenuOpenChange: (open: boolean) => void
}

// The character standing next to HEAD, with a popover menu of common git actions
export function LittleMan({ menuOpen, onMenuOpenChange }: LittleManProps) {
  const { characterState, hasChanges, hasStash } = useGit()
  const actions = useGitActions()
  const [commitMessage, setCommitMessage] = useState('')
  const [committing, setCommitting] = useState(false)

  const menuActions = [
    { label: 'Push', run: actions.push, disabled: false },
    { label: 'Pull', run: actions.pull, disabled: false },
    { label: 'Stash', run: actions.stash, disabled: !hasChanges },
    { label: 'Unstash', run: actions.unstash, disabled: !hasStash }
  ]

  const canCommit = hasChanges && commitMessage.trim() !== '' && !committing

  async function handleCommit(event: FormEvent) {
    event.preventDefault()
    if (!canCommit) return
    setCommitting(true)
    const result = await actions.commit(commitMessage.trim())
    setCommitting(false)
    if (result.ok) {
      setCommitMessage('')
      onMenuOpenChange(false)
    }
  }

  return (
    <div className="relative grid grid-rows-1 grid-cols-2">
      <img
        src={STATE_SPRITES[characterState]}
        alt="littleman"
        data-state={characterState}
        className="w-12 h-12"
      />

      <Popover open={menuOpen} onOpenChange={onMenuOpenChange}>
        <PopoverTrigger asChild>
          <div className="justify-self-start self-start">
            <button className="w-5 h-5 rounded-2xl border-1 border-zinc-800 shadow-md hover:bg-zinc-100 flex justify-center items-center">
              <EllipsisVertical size={15} color="black" />
            </button>
          </div>
        </PopoverTrigger>
        <PopoverContent className="z-50 bg-white shadow-md w-50 p-2">
          <div className="space-y-1 cursor-default">
            <Accordion type="single" collapsible>
              <AccordionItem value="Commit" className="px-2 py-1 m-0 rounded-md hover:bg-zinc-100">
                <AccordionTrigger>Commit</AccordionTrigger>
                <AccordionContent>
                  <form onSubmit={handleCommit}>
                    <Input
                      value={commitMessage}
                      onChange={(e) => setCommitMessage(e.target.value)}
                      placeholder="Enter commit message"
                      className="mb-2 mt-2"
                    />
                    {!hasChanges && (
                      <p className="mb-2 text-left text-xs text-gray-400">No changes to commit</p>
                    )}
                    <div className="flex space-x-2">
                      <button
                        type="submit"
                        disabled={!canCommit}
                        className="px-3 py-1.5 text-xs font-semibold text-sm text-purple-700 bg-gradient-to-r from-purple-100 to-pink-100 hover:from-purple-200 hover:to-pink-200 border-2 border-purple-200 rounded-full shadow-sm disabled:opacity-50 disabled:pointer-events-none"
                      >
                        {committing ? 'Committing…' : 'Commit'}
                      </button>
                    </div>
                  </form>
                </AccordionContent>
              </AccordionItem>
            </Accordion>

            {menuActions.map(({ label, run, disabled }) => (
              <button
                key={label}
                disabled={disabled}
                className="block w-full px-2 py-1 rounded-md text-left hover:bg-zinc-100 disabled:opacity-40 disabled:hover:bg-transparent"
                onClick={() => {
                  onMenuOpenChange(false)
                  run()
                }}
              >
                {label}
              </button>
            ))}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}
