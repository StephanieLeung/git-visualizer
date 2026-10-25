import { XIcon } from '@primer/octicons-react'
import { useLayoutEffect, useRef, type ReactNode, type RefObject } from 'react'

import { Button } from './button'
import { cn } from './utils'

interface DialogProps {
  open: boolean
  // Called once the dialog has closed by any route: ×, Escape, a backdrop click, or `open`
  // turning false
  onClose: () => void
  title: string
  // Unique per dialog, for aria-labelledby / aria-describedby
  id: string
  // alertdialog for errors and confirmations
  role?: 'dialog' | 'alertdialog'
  // Focused when the dialog opens (otherwise the browser picks its first control)
  initialFocusRef?: RefObject<HTMLElement>
  className?: string
  // Body and footer; give the body the `${id}-body` id
  children: ReactNode
}

// GitHub Desktop's modal dialog: a native <dialog> shown with showModal(), so it sits above the
// title bar, dims everything behind it and keeps focus inside. A 50px header holds the title and
// a close button. Closing hands focus back to whatever had it before.
export function Dialog({
  open,
  onClose,
  title,
  id,
  role = 'dialog',
  initialFocusRef,
  className,
  children
}: DialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  // Whether the click began on the backdrop, so a text selection dragged out of the dialog
  // doesn't close it
  const pressedBackdrop = useRef(false)

  // Before paint, so a dialog closing never shows a frame of its emptied box
  useLayoutEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (open && !dialog.open) {
      dialog.showModal()
      initialFocusRef?.current?.focus()
    } else if (!open && dialog.open) {
      dialog.close()
    }
  }, [open, initialFocusRef])

  const close = () => dialogRef.current?.close()

  return (
    // The content fills the dialog, so the <dialog> itself is only the target on its backdrop
    <dialog
      ref={dialogRef}
      role={role}
      aria-labelledby={`${id}-title`}
      aria-describedby={`${id}-body`}
      // Every way of closing (Escape included) ends here
      onClose={onClose}
      onMouseDown={(event) => {
        pressedBackdrop.current = event.target === event.currentTarget
      }}
      onClick={(event) => {
        if (pressedBackdrop.current && event.target === event.currentTarget) close()
        pressedBackdrop.current = false
      }}
      // m-auto: Tailwind's preflight zeroes the auto margins that centre a modal dialog
      className={cn(
        'm-auto w-[560px] max-w-[calc(100vw-32px)] rounded-md border border-border bg-canvas p-0 text-fg shadow-dialog backdrop:bg-backdrop motion-safe:animate-dialog-in motion-safe:backdrop:animate-fade-in',
        className
      )}
    >
      {open && (
        <div className="text-left">
          <header className="flex h-[50px] items-center gap-2 border-b border-border pr-2 pl-4">
            <h1 id={`${id}-title`} className="flex-1 truncate text-sm font-semibold">
              {title}
            </h1>
            <Button variant="invisible" aria-label="Close" onClick={close} className="w-7 px-0">
              <XIcon size={16} className="text-fg-muted" />
            </Button>
          </header>
          {children}
        </div>
      )}
    </dialog>
  )
}

// Right-aligned buttons under a hairline
export function DialogFooter({ children }: { children: ReactNode }) {
  return <footer className="flex justify-end gap-2 border-t border-border p-4">{children}</footer>
}
