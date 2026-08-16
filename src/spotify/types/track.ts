// Minimal shape for now — Phase 3 (Spotify playback) will replace
// this with real types generated from the Spotify Web API responses.
export interface Track {
  title: string
  artist: string
  album: string
  artworkUrl: string
  durationMs: number
}

export type PlaybackStatus = 'playing' | 'paused' | 'loading' | 'disconnected'
