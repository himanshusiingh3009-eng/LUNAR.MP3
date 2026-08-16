import { useCallback, useEffect, useRef, useState } from 'react'
import * as api from '../spotify/api/playback'
import { SpotifyApiError } from '../spotify/api/client'

export type PlaybackError = 'premium_required' | 'no_active_device' | 'network_error' | null

const POLL_INTERVAL_MS = 3000
// How often the smooth-interpolation loop actually commits a React
// state update. The underlying position math still runs every
// animation frame for accuracy — this only throttles how often that
// triggers a re-render. 100ms (~10fps) is visually indistinguishable
// from 60fps for a progress bar moving over minutes, and cuts
// re-renders of the whole app tree by ~85% while a track plays.
const POSITION_COMMIT_INTERVAL_MS = 100
// How long a transient control-command error stays visible before
// auto-clearing.
const CONTROL_ERROR_DISPLAY_MS = 4000

export function usePlaybackState(accessToken: string | null, onUnauthorized: () => void) {
  const [loading, setLoading] = useState(true)
  const [snapshot, setSnapshot] = useState<api.PlaybackSnapshot | null>(null)
  const [error, setError] = useState<PlaybackError>(null)
  const [positionMs, setPositionMs] = useState(0)
  const [volume, setVolumeState] = useState(70)
  const [controlError, setControlError] = useState<string | null>(null)

  const lastSyncAt = useRef(Date.now())
  const rafRef = useRef<number>()
  const lastCommitAt = useRef(0)
  const controlErrorTimeout = useRef<ReturnType<typeof setTimeout>>()

  const showControlError = useCallback((message: string) => {
    setControlError(message)
    clearTimeout(controlErrorTimeout.current)
    controlErrorTimeout.current = setTimeout(() => setControlError(null), CONTROL_ERROR_DISPLAY_MS)
  }, [])

  useEffect(() => {
    return () => clearTimeout(controlErrorTimeout.current)
  }, [])

  const poll = useCallback(async (): Promise<api.PlaybackSnapshot | null> => {
    if (!accessToken) return null
    try {
      const data = await api.getPlaybackState(accessToken)
      setSnapshot(data)
      setError(null)
      lastSyncAt.current = Date.now()
      if (data) {
        setPositionMs(data.progressMs)
        if (data.device) setVolumeState(data.device.volumePercent)
      }
      return data
    } catch (err) {
      if (err instanceof SpotifyApiError) {
        if (err.status === 401) {
          onUnauthorized()
          return null
        }
        if (err.reason === 'PREMIUM_REQUIRED') setError('premium_required')
        else if (err.status === 404) setError('no_active_device')
        else setError('network_error')
      } else {
        setError('network_error')
      }
      return null
    } finally {
      setLoading(false)
    }
  }, [accessToken, onUnauthorized])

  useEffect(() => {
    poll()
    const id = setInterval(poll, POLL_INTERVAL_MS)
    return () => clearInterval(id)
  }, [poll])

  // Smoothly advance position between polls instead of jumping every
  // 3s — but always anchored to the last real Spotify position, per
  // the brief: no independent timer as the actual source of truth.
  // State commits are throttled (see POSITION_COMMIT_INTERVAL_MS)
  // so this doesn't re-render the whole app 60x/sec.
  useEffect(() => {
    if (!snapshot?.isPlaying || !snapshot.track) return

    const durationMs = snapshot.track.durationMs
    const baseProgress = snapshot.progressMs
    const baseTime = lastSyncAt.current

    const tick = () => {
      const now = Date.now()
      if (now - lastCommitAt.current >= POSITION_COMMIT_INTERVAL_MS) {
        lastCommitAt.current = now
        const elapsed = now - baseTime
        setPositionMs(Math.min(baseProgress + elapsed, durationMs))
      }
      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [snapshot])

  // Control commands occasionally reject even though Spotify actually
  // applied them (observed specifically in the packaged Electron
  // app — functionally the action always worked, only the promise
  // sometimes didn't resolve cleanly, likely a networking-layer quirk
  // rather than a real failure). Rather than trust a possibly-flaky
  // rejection, confirm against real state via a follow-up poll and
  // only surface an error if the action genuinely didn't take effect.
  const togglePlay = useCallback(() => {
    if (!accessToken || !snapshot) return
    const wasPlaying = snapshot.isPlaying
    setSnapshot((s) => (s ? { ...s, isPlaying: !wasPlaying } : s))
    const action = wasPlaying ? api.pause(accessToken) : api.play(accessToken)
    action.catch(async () => {
      const fresh = await poll()
      if (fresh && fresh.isPlaying === !wasPlaying) return // actually worked
      showControlError(wasPlaying ? 'Could not pause' : 'Could not play')
    })
  }, [accessToken, snapshot, poll, showControlError])

  const next = useCallback(() => {
    if (!accessToken) return
    const previousTrackId = snapshot?.track?.id ?? null
    api
      .skipNext(accessToken)
      .then(poll)
      .catch(async () => {
        const fresh = await poll()
        if (fresh?.track?.id && fresh.track.id !== previousTrackId) return
        showControlError('Could not skip to next track')
      })
  }, [accessToken, snapshot, poll, showControlError])

  const previous = useCallback(() => {
    if (!accessToken) return
    const previousTrackId = snapshot?.track?.id ?? null
    api
      .skipPrevious(accessToken)
      .then(poll)
      .catch(async () => {
        const fresh = await poll()
        if (fresh?.track?.id && fresh.track.id !== previousTrackId) return
        showControlError('Could not go to previous track')
      })
  }, [accessToken, snapshot, poll, showControlError])

  const seekTo = useCallback(
    (ms: number) => {
      if (!accessToken) return
      setPositionMs(ms)
      lastSyncAt.current = Date.now()
      setSnapshot((s) => (s ? { ...s, progressMs: ms } : s))
      api.seek(accessToken, ms).catch(async () => {
        const fresh = await poll()
        // Allow a few seconds of drift — by the time the confirming
        // poll lands, playback has naturally moved on a bit further.
        if (fresh && Math.abs(fresh.progressMs - ms) < 4000) return
        showControlError('Seek failed')
      })
    },
    [accessToken, poll, showControlError],
  )

  const changeVolume = useCallback(
    (percent: number) => {
      if (!accessToken) return
      setVolumeState(percent)
      api.setVolume(accessToken, percent).catch(async () => {
        const fresh = await poll()
        if (fresh?.device && Math.abs(fresh.device.volumePercent - percent) <= 5) return
        showControlError('Could not change volume')
      })
    },
    [accessToken, poll, showControlError],
  )

  const track = snapshot?.track ?? null

  return {
    loading,
    hasTrack: Boolean(track),
    isPlaying: snapshot?.isPlaying ?? false,
    trackId: track?.id ?? null,
    title: track?.title ?? '',
    artist: track?.artist ?? '',
    album: track?.album ?? '',
    artworkUrl: track?.artworkUrl ?? null,
    positionMs,
    durationMs: track?.durationMs ?? 0,
    volume,
    error,
    controlError,
    togglePlay,
    next,
    previous,
    seekTo,
    changeVolume,
  }
}
