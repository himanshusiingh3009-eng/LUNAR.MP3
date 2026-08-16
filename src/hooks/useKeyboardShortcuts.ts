import { useEffect } from 'react'

interface KeyboardShortcutHandlers {
  onTogglePlay: () => void
  onSeekBack: () => void
  onSeekForward: () => void
  onVolumeUp: () => void
  onVolumeDown: () => void
  onToggleMute: () => void
  onFocusTheme: () => void
}

const FORM_TAGS = new Set(['INPUT', 'TEXTAREA', 'SELECT'])

export function useKeyboardShortcuts(handlers: KeyboardShortcutHandlers, enabled: boolean) {
  useEffect(() => {
    if (!enabled) return

    function onKeyDown(e: KeyboardEvent) {
      // Don't hijack typing, native range-slider arrow handling, or
      // the theme <select> while it's open/focused.
      const active = document.activeElement
      if (active && FORM_TAGS.has(active.tagName)) return
      if (e.metaKey || e.ctrlKey || e.altKey) return

      switch (e.key) {
        case ' ':
          e.preventDefault()
          handlers.onTogglePlay()
          break
        case 'ArrowLeft':
          e.preventDefault()
          handlers.onSeekBack()
          break
        case 'ArrowRight':
          e.preventDefault()
          handlers.onSeekForward()
          break
        case 'ArrowUp':
          e.preventDefault()
          handlers.onVolumeUp()
          break
        case 'ArrowDown':
          e.preventDefault()
          handlers.onVolumeDown()
          break
        case 'm':
        case 'M':
          handlers.onToggleMute()
          break
        case 't':
        case 'T':
          handlers.onFocusTheme()
          break
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [handlers, enabled])
}
