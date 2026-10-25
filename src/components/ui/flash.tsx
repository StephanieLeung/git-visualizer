import { AlertIcon } from '@primer/octicons-react'
import type { ReactNode } from 'react'

import { cn } from './utils'

// GitHub Desktop's inline error banner
function ErrorFlash({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      role="alert"
      className={cn(
        'flex items-start gap-2 rounded-md border border-danger-border bg-danger-subtle px-3 py-2 text-xs text-danger-fg',
        className
      )}
    >
      <AlertIcon size={16} className="mt-px shrink-0" />
      {/* pre-line: a \n in the message starts a new line */}
      <p className="min-w-0 text-left whitespace-pre-line [overflow-wrap:anywhere]">{children}</p>
    </div>
  )
}

export { ErrorFlash }
