import { forwardRef } from 'react'
import './ThemeSelector.css'

const THEMES: { value: string; label: string }[] = [
  { value: 'neon-purple', label: 'NEON PURPLE' },
  { value: 'neon-pink', label: 'NEON PINK' },
  { value: 'monochrome', label: 'MONOCHROME' },
  { value: 'red', label: 'RED' },
  { value: 'rose', label: 'ROSE' },
  { value: 'green', label: 'GREEN' },
  { value: 'orange', label: 'ORANGE' },
  { value: 'blue', label: 'BLUE' },
  { value: 'celeste', label: 'CELESTE' },
  { value: 'aqua', label: 'AQUA' },
  { value: 'dark', label: 'DARK' },
]

interface ThemeSelectorProps {
  value: string
  onChange: (theme: string) => void
}

export const ThemeSelector = forwardRef<HTMLSelectElement, ThemeSelectorProps>(
  function ThemeSelector({ value, onChange }, ref) {
    return (
      <select
        ref={ref}
        className="theme-selector"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label="Theme"
      >
        {THEMES.map((t) => (
          <option key={t.value} value={t.value}>
            {t.label}
          </option>
        ))}
      </select>
    )
  },
)
