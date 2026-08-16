import { useEffect, useState } from 'react'
import type { LyricLine } from '../lyrics/types/lyric'
import type { LyricsProvider } from '../lyrics/providers/types'

interface TrackRef {
  title: string
  artist: string
  album: string
  durationMs: number
}

export function useLyrics(track: TrackRef | null, provider: LyricsProvider) {
  const [lines, setLines] = useState<LyricLine[]>([])
  const [synced, setSynced] = useState(false)
  const [sourceName, setSourceName] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!track || !track.title) {
      setLines([])
      setSynced(false)
      setSourceName(null)
      return
    }

    let cancelled = false
    setLoading(true)

    provider
      .fetchLyrics({
        title: track.title,
        artist: track.artist,
        album: track.album,
        durationMs: track.durationMs,
      })
      .then((result) => {
        if (cancelled) return
        setLines(result?.lines ?? [])
        setSynced(result?.synced ?? false)
        setSourceName(result?.sourceName ?? null)
      })
      .catch(() => {
        if (!cancelled) {
          setLines([])
          setSynced(false)
          setSourceName(null)
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
    // Re-fetch only when the track identity actually changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [track?.title, track?.artist, provider])

  return { lines, loading, synced, sourceName, available: lines.length > 0 }
}
