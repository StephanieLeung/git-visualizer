import { EllipsisVertical } from 'lucide-react'
import { useEffect, useState } from 'react'
import littleman from '../../assets/lilman.svg'
import luggage from '../../assets/luggage.svg'
import pull from '../../assets/pull.gif'
import type { AnimationState, CharacterState } from '../../context/GitContext'
import { useTerminal } from '../../context/TerminalContext'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../ui/accordion'
import { Input } from '../ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover'

const STATE_SPRITES: Record<CharacterState, string> = {
  idle: littleman,
  working: pull,
  dirty: luggage
}

// Menu entries that map straight onto a git command (Commit has its own form above them)
const GIT_ACTIONS = [
  { label: 'Push', args: 'push origin HEAD' },
  { label: 'Pull', args: 'pull' },
  { label: 'Stash', args: 'stash' },
  { label: 'Unstash', args: 'stash pop' }
]

const SPRITE_SYNC_MS = 5000

interface LittleManProps {
  characterState?: CharacterState
  // TODO: not used yet; meant to drive the pull/push animation (GitContext.triggerAnimation)
  animationState?: AnimationState
  // TODO: never called, so Pull/Push don't start that animation
  onActionSelect?: (action: string) => void
}

// The character standing on HEAD, with a popover menu of common git actions
export function LittleMan({ characterState = 'idle' }: LittleManProps) {
  const [sprite, setSprite] = useState(STATE_SPRITES[characterState])
  const [isPopoverOpen, setIsPopoverOpen] = useState(false)
  const [commitMessage, setCommitMessage] = useState('')
  const { setCommand } = useTerminal()

  // Re-sync the sprite with characterState every few seconds.
  // TODO: meant to show assets/hold_box.svg while the tree is dirty, but the old check read
  // `.hasChanges` off the boolean result, so that branch never ran
  useEffect(() => {
    const intervalId = setInterval(() => {
      window.API.git
        .hasChanges()
        .then(() => setSprite(STATE_SPRITES[characterState]))
        .catch((error) => console.error('Error calling git:hasChanges:', error))
    }, SPRITE_SYNC_MS)

    return () => clearInterval(intervalId)
  }, [characterState])

  // Echoes the command in the TerminalPanel, then runs it
  function runGitAction(label: string, args: string) {
    setCommand(`git ${args}`)
    window.API.git.run(args).catch((error) => console.error(`${label} failed:`, error))
  }

  // TODO: an empty message or nothing to commit is only reported in the console
  async function handleCommit() {
    if (!commitMessage.trim()) {
      console.error('Commit message cannot be empty')
      return
    }

    try {
      setCommand('git status --porcelain')
      const statusOutput = await window.API.git.run('status --porcelain')
      if (!statusOutput.trim()) {
        console.error('No changes to commit')
        return
      }

      setCommand(`git commit -m "${commitMessage}"`)
      await window.API.git.run(`commit -m "${commitMessage}"`)
      setCommitMessage('')
    } catch (error) {
      console.error('Commit failed:', error)
    }
  }

  return (
    <div className="relative grid grid-rows-1 grid-cols-2">
      <img src={sprite} alt="littleman" className="w-12 h-12" />

      <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
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
                  <Input
                    value={commitMessage}
                    onChange={(e) => setCommitMessage(e.target.value)}
                    placeholder="Enter commit message"
                    className="mb-2 mt-2"
                  />
                  <div className="flex space-x-2">
                    <button
                      onClick={handleCommit}
                      className="px-3 py-1.5 text-xs font-semibold text-sm text-purple-700 bg-gradient-to-r from-purple-100 to-pink-100 hover:from-purple-200 hover:to-pink-200 border-2 border-purple-200 rounded-full shadow-sm"
                    >
                      Commit
                    </button>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>

            {GIT_ACTIONS.map(({ label, args }) => (
              <div
                key={label}
                className="px-2 py-1 rounded-md hover:bg-zinc-100"
                onClick={() => {
                  runGitAction(label, args)
                  setIsPopoverOpen(false)
                }}
              >
                {label}
              </div>
            ))}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}
