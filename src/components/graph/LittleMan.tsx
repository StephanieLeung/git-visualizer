import { KebabHorizontalIcon } from '@primer/octicons-react'
import holdBox from '../../assets/hold_box.svg'
import littleman from '../../assets/lilman.svg'
import luggage from '../../assets/luggage.svg'
import pull from '../../assets/pull.gif'
import { useGit, type CharacterState } from '../../context/GitContext'
import { Button } from '../ui/button'

// Rendered size (sprite + gap + menu button), used by DAGGraph to stand him next to HEAD
export const LITTLEMAN_WIDTH = 76
export const LITTLEMAN_HEIGHT = 48

const STATE_SPRITES: Record<CharacterState, { src: string; alt: string }> = {
  idle: { src: littleman, alt: 'LittleMan' },
  working: { src: pull, alt: 'LittleMan pulling a rope: a push or pull is running' },
  dirty: { src: holdBox, alt: 'LittleMan holding a box: there are uncommitted changes' },
  stashed: { src: luggage, alt: 'LittleMan carrying luggage: changes are stashed' }
}

interface LittleManProps {
  // HEAD's card (which holds the git actions) is pinned open
  actionsOpen: boolean
  onToggleActions: () => void
}

// The character standing next to HEAD; his button opens and closes HEAD's card of git actions
export function LittleMan({ actionsOpen, onToggleActions }: LittleManProps) {
  const { characterState } = useGit()
  const sprite = STATE_SPRITES[characterState]

  return (
    <div className="flex items-center gap-1">
      {/* The faint outline keeps the black rope and luggage straps visible on dark backgrounds */}
      <img
        src={sprite.src}
        alt={sprite.alt}
        data-state={characterState}
        className="size-12 object-contain dark:drop-shadow-[0_0_1px_rgba(255,255,255,0.6)]"
      />
      {/* data-pin-target: a click here toggles the card rather than counting as clicking outside it */}
      <Button
        size="sm"
        data-pin-target
        aria-label="Git actions"
        aria-expanded={actionsOpen}
        title="Git actions"
        onClick={onToggleActions}
        className="w-6 px-0"
      >
        <KebabHorizontalIcon size={16} className="text-fg-muted" />
      </Button>
    </div>
  )
}
