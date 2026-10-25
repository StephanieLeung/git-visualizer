import { cn } from './utils'

// Small ring spinner in the current text colour; pair it with visible text saying what's loading
function Spinner({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        'inline-block size-3.5 shrink-0 animate-spin rounded-full border-2 border-current border-r-transparent motion-reduce:[animation-duration:2s]',
        className
      )}
    />
  )
}

export { Spinner }
