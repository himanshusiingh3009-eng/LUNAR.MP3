import type { PlaybackStatus } from '../../spotify/types/track'
import './StatusIndicator.css'

const LABEL: Record<PlaybackStatus, string> = {
  playing: 'PLAYING',
  paused: 'PAUSED',
  loading: 'CONNECTING',
  disconnected: 'DISCONNECTED',
}

const GLYPH: Record<PlaybackStatus, string> = {
  playing: '●',
  paused: '■',
  loading: '◌',
  disconnected: '✕',
}

export function StatusIndicator({ status }: { status: PlaybackStatus }) {
  return (
    <div className={`status-indicator status-indicator--${status}`} role="status">
      <span aria-hidden="true" className="status-indicator__glyph">
        {GLYPH[status]}
      </span>
      {LABEL[status]}
    </div>
  )
}
