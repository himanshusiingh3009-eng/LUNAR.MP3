import type { AuthStatus } from '../../hooks/useSpotifyAuth'
import './ConnectScreen.css'

interface ConnectScreenProps {
  status: AuthStatus
  errorMessage: string | null
  theme: string
  onConnect: () => void
  onReconfigure: () => void
}

const MESSAGES: Partial<Record<AuthStatus, string>> = {
  not_connected: 'LUNAR.MP3 needs to connect to your Spotify account to show what\u2019s playing.',
  connecting: 'Opening Spotify authorization\u2026',
  authorization_denied: 'Authorization was denied. LUNAR.MP3 can\u2019t read playback without it.',
  authentication_failed: 'Something went wrong connecting to Spotify.',
}

export function ConnectScreen({
  status,
  errorMessage,
  theme,
  onConnect,
  onReconfigure,
}: ConnectScreenProps) {
  return (
    <div className="connect-screen" data-theme={theme}>
      <div className="connect-screen__panel panel">
        <div className="connect-screen__title">LUNAR.MP3</div>
        <div className="connect-screen__subtitle">SPOTIFY CONNECTION</div>

        <p className="connect-screen__message">{MESSAGES[status]}</p>

        {status === 'authentication_failed' && errorMessage && (
          <div className="connect-screen__error" role="alert">
            <div className="connect-screen__error-title">[ CONNECTION ERROR ]</div>
            {errorMessage}
          </div>
        )}

        <button
          type="button"
          className="connect-screen__connect"
          onClick={onConnect}
          disabled={status === 'connecting'}
        >
          {status === 'connecting' ? 'CONNECTING\u2026' : 'CONNECT TO SPOTIFY'}
        </button>

        <button type="button" className="connect-screen__reconfigure" onClick={onReconfigure}>
          RECONFIGURE
        </button>
      </div>
    </div>
  )
}
