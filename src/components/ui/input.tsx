import * as React from 'react'

import { cn } from './utils'

// GitHub Desktop text field
const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<'input'>>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        ref={ref}
        type={type}
        data-slot="input"
        className={cn(
          'flex h-7 w-full min-w-0 rounded-md border border-border bg-canvas px-2 text-xs text-fg placeholder:text-fg-muted transition-[border-color,box-shadow] duration-150',
          'focus-visible:border-accent-fg focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-accent/30',
          'disabled:cursor-not-allowed disabled:opacity-60',
          // Invalid (e.g. a rejected branch name): red border and ring, even while focused
          'aria-invalid:border-danger-fg aria-invalid:focus-visible:border-danger-fg aria-invalid:focus-visible:ring-danger-fg/30',
          className
        )}
        {...props}
      />
    )
  }
)

Input.displayName = 'Input'

export { Input }
