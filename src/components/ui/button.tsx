import * as React from 'react'

import { cn } from './utils'

// GitHub Desktop's button styles
const VARIANTS = {
  // Blue; offset focus ring so it shows against the fill
  primary:
    'bg-accent text-fg-on-emphasis enabled:hover:bg-accent-hover focus-visible:outline-offset-2',
  secondary: 'border border-btn-border bg-btn text-fg enabled:hover:bg-btn-hover',
  invisible: 'text-fg enabled:hover:bg-hover'
}

const SIZES = {
  sm: 'h-6 gap-1 px-2',
  md: 'h-7 gap-1.5 px-3'
}

interface ButtonProps extends React.ComponentProps<'button'> {
  variant?: keyof typeof VARIANTS
  size?: keyof typeof SIZES
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'secondary', size = 'md', type = 'button', className, ...props }, ref) => (
    <button
      ref={ref}
      type={type}
      className={cn(
        'inline-flex shrink-0 select-none items-center justify-center whitespace-nowrap rounded-md text-xs font-semibold disabled:opacity-60',
        VARIANTS[variant],
        SIZES[size],
        className
      )}
      {...props}
    />
  )
)

Button.displayName = 'Button'

export { Button }
