import { forwardRef } from 'react'
import { ThemeSelector } from '../ThemeSelector/ThemeSelector'
import './SettingsPanel.css'

interface SettingsPanelProps {
  theme: string
  onThemeChange: (theme: string) => void
  autoScroll: boolean
  onAutoScrollChange: (value: boolean) => void
  crtEnabled: boolean
  onCrtChange: (value: boolean) => void
  onLogout: () => void
  onReconfigure: () => void
  onClose: () => void
}

const SHORTCUTS: [string, string][] = [
  ['SPACE', 'Play / Pause'],
  ['← / →', 'Seek -5s / +5s'],
  ['↑ / ↓', 'Volume up / down'],
  ['M', 'Mute'],
  ['T', 'Focus theme selector'],
]

export const SettingsPanel = forwardRef<HTMLDivElement, SettingsPanelProps>(
  function SettingsPanel(
    {
      theme,
      onThemeChange,
      autoScroll,
      onAutoScrollChange,
      crtEnabled,
      onCrtChange,
      onLogout,
      onReconfigure,
      onClose,
    },
    ref,
  ) {
    return (
      <div className="settings-panel panel" ref={ref} role="dialog" aria-label="Settings" tabIndex={-1}>
        <div className="settings-panel__header">
          <span>SETTINGS</span>
          <button type="button" className="settings-panel__close" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        <div className="settings-panel__row">
          <span className="settings-panel__label">THEME</span>
          <ThemeSelector value={theme} onChange={onThemeChange} />
        </div>

        <div className="settings-panel__row">
          <span className="settings-panel__label">AUTO-SCROLL</span>
          <button
            type="button"
            className="settings-panel__toggle"
            onClick={() => onAutoScrollChange(!autoScroll)}
            aria-pressed={autoScroll}
          >
            {autoScroll ? 'ON' : 'OFF'}
          </button>
        </div>

        <div className="settings-panel__row">
          <span className="settings-panel__label">CRT EFFECTS</span>
          <button
            type="button"
            className="settings-panel__toggle"
            onClick={() => onCrtChange(!crtEnabled)}
            aria-pressed={crtEnabled}
          >
            {crtEnabled ? 'ON' : 'OFF'}
          </button>
        </div>

        <div className="settings-panel__section">
          <span className="settings-panel__label">KEYBOARD SHORTCUTS</span>
          <div className="settings-panel__shortcuts">
            {SHORTCUTS.map(([key, desc]) => (
              <div key={key} className="settings-panel__shortcut-row">
                <span className="settings-panel__key">{key}</span>
                <span className="settings-panel__desc">{desc}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="settings-panel__section">
          <span className="settings-panel__label">SPOTIFY CONNECTION</span>
          <div className="settings-panel__connection">
            <span className="settings-panel__connected">● CONNECTED</span>
            <button type="button" className="settings-panel__action" onClick={onLogout}>
              LOGOUT
            </button>
          </div>
        </div>

        <button type="button" className="settings-panel__reconfigure" onClick={onReconfigure}>
          RESET CONFIGURATION
        </button>
      </div>
    )
  },
)
