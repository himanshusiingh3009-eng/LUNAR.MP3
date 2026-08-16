import { spotifyFetch } from './client'

export interface PlaybackSnapshot {
  isPlaying: boolean
  progressMs: number
  track: {
    id: string
    title: string
    artist: string
    album: string
    artworkUrl: string | null
    durationMs: number
  } | null
  device: { id: string; name: string; volumePercent: number } | null
}

interface SpotifyArtist {
  name: string
}
interface SpotifyImage {
  url: string
}
interface SpotifyTrackItem {
  id: string
  name: string
  duration_ms: number
  artists: SpotifyArtist[]
  album: { name: string; images: SpotifyImage[] }
}
interface SpotifyPlayerStateResponse {
  is_playing: boolean
  progress_ms: number | null
  item: SpotifyTrackItem | null
  device: { id: string; name: string; volume_percent: number | null } | null
}

export async function getPlaybackState(accessToken: string): Promise<PlaybackSnapshot | null> {
  const data = await spotifyFetch<SpotifyPlayerStateResponse>(accessToken, '/me/player')
  if (!data || !data.item) return null

  const item = data.item
  return {
    isPlaying: Boolean(data.is_playing),
    progressMs: data.progress_ms ?? 0,
    track: {
      id: item.id,
      title: item.name,
      artist: item.artists.map((a) => a.name).join(', '),
      album: item.album.name,
      artworkUrl: item.album.images[0]?.url ?? null,
      durationMs: item.duration_ms,
    },
    device: data.device
      ? {
          id: data.device.id,
          name: data.device.name,
          volumePercent: data.device.volume_percent ?? 100,
        }
      : null,
  }
}

export async function play(accessToken: string) {
  await spotifyFetch(accessToken, '/me/player/play', { method: 'PUT' })
}

export async function pause(accessToken: string) {
  await spotifyFetch(accessToken, '/me/player/pause', { method: 'PUT' })
}

export async function skipNext(accessToken: string) {
  await spotifyFetch(accessToken, '/me/player/next', { method: 'POST' })
}

export async function skipPrevious(accessToken: string) {
  await spotifyFetch(accessToken, '/me/player/previous', { method: 'POST' })
}

export async function seek(accessToken: string, positionMs: number) {
  await spotifyFetch(accessToken, `/me/player/seek?position_ms=${Math.round(positionMs)}`, {
    method: 'PUT',
  })
}

export async function setVolume(accessToken: string, percent: number) {
  await spotifyFetch(accessToken, `/me/player/volume?volume_percent=${Math.round(percent)}`, {
    method: 'PUT',
  })
}
