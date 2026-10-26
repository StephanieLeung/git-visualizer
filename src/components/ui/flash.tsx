import { AlertIcon } from '@primer/octicons-react'
import type { ReactNode } from 'react'

import { cn } from './utils'

const VARIANTS = {
  danger: 'border-danger-border bg-danger-subtle text-danger-fg',
  warning: 'border-attention-border bg-attention-subtle text-attention-fg'
}

interface FlashProps {
  children: ReactNode
  className?: string
}

// GitHub Desktop's inline banner
function Flash({ children, className, variant }: FlashProps & { variant: keyof typeof VARIANTS }) {
  return (
    <div
      role={variant === 'danger' ? 'alert' : undefined}
      className={cn(
        'flex items-start gap-2 rounded-md border px-3 py-2 text-xs',
        VARIANTS[variant],
        className
      )}
    >
      <AlertIcon size={16} className="mt-px shrink-0" />
      {/* pre-line: a \n in the message starts a new line */}
      <p className="min-w-0 text-left whitespace-pre-line [overflow-wrap:anywhere]">{children}</p>
    </div>
  )
}

const ErrorFlash = (props: FlashProps) => <Flash {...props} variant="danger" />
const WarningFlash = (props: FlashProps) => <Flash {...props} variant="warning" />

export { ErrorFlash, WarningFlash }
