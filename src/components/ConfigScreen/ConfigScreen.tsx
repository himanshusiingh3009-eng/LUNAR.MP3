import { useState } from 'react'
import type { LunarConfig } from '../../spotify/auth/config'
import './ConfigScreen.css'

const THEMES = [
  'NEON PURPLE',
  'NEON PINK',
  'MONOCHROME',
  'RED',
  'ROSE',
  'GREEN',
  'ORANGE',
  'BLUE',
  'CELESTE',
  'AQUA',
  'DARK',
]

function slugify(label: string) {
  return label.toLowerCase().replace(/\s+/g, '-')
}

interface ConfigScreenProps {
  initial: LunarConfig
  onSave: (config: LunarConfig) => void
}

export function ConfigScreen({ initial, onSave }: ConfigScreenProps) {
  const [clientId, setClientId] = useState(initial.spotifyClientId)
  const [theme, setTheme] = useState(initial.theme)
  const [error, setError] = useState<string | null>(null)

  const handleSave = () => {
    const trimmed = clientId.trim()
    if (!trimmed) {
      setError('Spotify Client ID is missing. Enter the Client ID from your Spotify Developer App.')
      return
    }
    setError(null)
    // Preserve autoScroll/crtEnabled from whatever's already saved —
    // this screen only has controls for Client ID and theme; those
    // two preferences live in the Settings panel (Phase 14).
    onSave({ ...initial, spotifyClientId: trimmed, theme, configured: true })
  }

  return (
    <div className="config-screen" data-theme={theme}>
      <div className="config-screen__panel panel">
        <div className="config-screen__title">LUNAR.MP3</div>
        <div className="config-screen__subtitle">INITIAL CONFIGURATION</div>

        <label className="config-screen__field">
          <span>SPOTIFY CLIENT ID</span>
          <input
            type="text"
            value={clientId}
            onChange={(e) => setClientId(e.target.value)}
            placeholder="paste your Client ID"
            autoComplete="off"
            spellCheck={false}
          />
        </label>

        <p className="config-screen__help">
          Create a Spotify Developer App (Web API), then copy its Client ID.{' '}
          <a
            href="https://developer.spotify.com/dashboard"
            target="_blank"
            rel="noreferrer"
          >
            OPEN SPOTIFY DEVELOPER DASHBOARD ↗
          </a>
        </p>

        <p className="config-screen__help config-screen__help--muted">
          No Client Secret needed — LUNAR.MP3 uses Authorization Code with
          PKCE, which is built specifically so desktop apps never have to
          store one.
        </p>

        <label className="config-screen__field">
          <span>THEME</span>
          <select value={theme} onChange={(e) => setTheme(e.target.value)}>
            {THEMES.map((label) => (
              <option key={label} value={slugify(label)}>
                {label}
              </option>
            ))}
          </select>
        </label>

        {error && (
          <div className="config-screen__error" role="alert">
            <div className="config-screen__error-title">[ CONFIGURATION ERROR ]</div>
            {error}
          </div>
        )}

        <button type="button" className="config-screen__save" onClick={handleSave}>
          SAVE &amp; CONTINUE
        </button>
      </div>
    </div>
  )
}
