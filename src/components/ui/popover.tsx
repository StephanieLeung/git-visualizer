'use client'

import * as React from 'react'
import * as PopoverPrimitive from '@radix-ui/react-popover'

import { cn } from './utils'

// Root renders no DOM node, so unlike the parts below it takes no ref
function Popover(props: React.ComponentProps<typeof PopoverPrimitive.Root>) {
  return <PopoverPrimitive.Root data-slot="popover" {...props} />
}

const PopoverTrigger = React.forwardRef<
  React.ElementRef<typeof PopoverPrimitive.Trigger>,
  React.ComponentProps<typeof PopoverPrimitive.Trigger>
>(({ ...props }, ref) => {
  return <PopoverPrimitive.Trigger ref={ref} data-slot="popover-trigger" {...props} />
})

const PopoverContent = React.forwardRef<
  React.ElementRef<typeof PopoverPrimitive.Content>,
  React.ComponentProps<typeof PopoverPrimitive.Content>
>(({ className, align = 'center', sideOffset = 4, ...props }, ref) => {
  return (
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Content
        ref={ref}
        data-slot="popover-content"
        align={align}
        sideOffset={sideOffset}
        className={cn(
          // z-200 keeps menus above the fixed title bar (#titlebar is z-index 100). Radix waits
          // for the closing animation before it unmounts the content.
          'z-[200] w-72 origin-(--radix-popover-content-transform-origin) rounded-md border border-border bg-canvas-overlay p-3 text-xs text-fg shadow-overlay outline-hidden motion-safe:animate-popover-in motion-safe:data-[state=closed]:animate-popover-out',
          className
        )}
        {...props}
      />
    </PopoverPrimitive.Portal>
  )
})

const PopoverAnchor = React.forwardRef<
  React.ElementRef<typeof PopoverPrimitive.Anchor>,
  React.ComponentProps<typeof PopoverPrimitive.Anchor>
>(({ ...props }, ref) => {
  return <PopoverPrimitive.Anchor ref={ref} data-slot="popover-anchor" {...props} />
})

Popover.displayName = 'Popover'
PopoverTrigger.displayName = 'PopoverTrigger'
PopoverContent.displayName = 'PopoverContent'
PopoverAnchor.displayName = 'PopoverAnchor'

export { Popover, PopoverTrigger, PopoverContent, PopoverAnchor }
