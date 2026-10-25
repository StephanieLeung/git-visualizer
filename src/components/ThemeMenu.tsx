import { CheckIcon, DeviceDesktopIcon, MoonIcon, SunIcon, type Icon } from '@primer/octicons-react'
import { useEffect, useState } from 'react'
import type { ThemePreference } from '../../electron/settings'
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover'

const OPTIONS: { value: ThemePreference; label: string; icon: Icon }[] = [
  { value: 'light', label: 'Light', icon: SunIcon },
  { value: 'dark', label: 'Dark', icon: MoonIcon },
  { value: 'system', label: 'System', icon: DeviceDesktopIcon }
]

// Title bar button for the Light / Dark / System setting. The main process applies and saves the
// choice (electron/settings.ts); the CSS follows it through prefers-color-scheme.
export function ThemeMenu() {
  const [open, setOpen] = useState(false)
  const [theme, setTheme] = useState<ThemePreference>('system')

  // Reread on open too, so the check mark is right even if the setting changed elsewhere
  useEffect(() => {
    window.API.theme.get().then(setTheme).catch(console.error)
  }, [open])

  function choose(value: ThemePreference) {
    setTheme(value)
    setOpen(false)
    window.API.theme.set(value).catch(console.error)
  }

  const current = OPTIONS.find((option) => option.value === theme) ?? OPTIONS[2]
  const CurrentIcon = current.icon

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          aria-label={`Theme: ${current.label}`}
          title="Theme"
          className="flex h-full w-10 items-center justify-center text-chrome-fg-muted hover:bg-chrome-hover hover:text-chrome-fg focus-visible:outline-chrome-focus data-[state=open]:bg-chrome-hover data-[state=open]:text-chrome-fg"
        >
          <CurrentIcon size={16} />
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" sideOffset={4} className="w-44 p-1">
        <p className="px-2 pt-1 pb-1.5 text-[11px] font-semibold text-fg-muted">Theme</p>
        <div role="radiogroup" aria-label="Theme">
          {OPTIONS.map(({ value, label, icon: OptionIcon }) => (
            <button
              key={value}
              role="radio"
              aria-checked={theme === value}
              onClick={() => choose(value)}
              className="flex h-7 w-full items-center gap-2 rounded-md px-2 text-left text-xs text-fg hover:bg-hover"
            >
              <OptionIcon size={16} className="text-fg-muted" />
              <span className="flex-1">{label}</span>
              {theme === value && <CheckIcon size={16} className="text-accent-fg" />}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  )
}
