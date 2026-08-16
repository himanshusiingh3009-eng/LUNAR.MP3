import type { LyricsProvider, LyricsResult } from './types'
import type { LyricLine } from '../types/lyric'
import { parseLrc } from '../parser/lrcParser'

// LRCLIB is a free, open, community-sourced synced-lyrics database.
// No API key required. Its docs ask clients to identify themselves
// via a User-Agent header — browsers won't let JS set that header,
// so this is a best-effort identification via a custom header
// instead; this becomes fully correct once LUNAR.MP3 runs inside
// Electron (Phase 16), where requests aren't browser-restricted.
const BASE_URL = 'https://lrclib.net/api/get'

function linesFromPlainText(text: string, durationSec: number): LyricLine[] {
  const rawLines = text
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
  if (rawLines.length === 0) return []

  const step = durationSec > 0 ? durationSec / rawLines.length : 4
  return rawLines.map((text, i) => ({
    id: String(i),
    text,
    startSec: i * step,
    endSec: (i + 1) * step,
  }))
}

export const lrclibProvider: LyricsProvider = {
  name: 'lrclib',
  async fetchLyrics(query): Promise<LyricsResult | null> {
    const durationSec = query.durationMs ? Math.round(query.durationMs / 1000) : undefined

    // Single precise query — track, artist, album (when we have it),
    // duration. No retry-without-album broadening (that traded
    // accuracy for coverage and made matches worse) and no
    // duration-drift downgrade (Spotify's and lrclib's durations can
    // legitimately differ by several seconds for the exact same
    // correct recording — that guard was rejecting good matches, not
    // just bad ones). Trust lrclib's own syncedLyrics field directly.
    const params = new URLSearchParams({ track_name: query.title, artist_name: query.artist })
    if (query.album) params.set('album_name', query.album)
    if (durationSec) params.set('duration', String(durationSec))

    let data: Record<string, unknown> | null
    try {
      const res = await fetch(`${BASE_URL}?${params.toString()}`, {
        headers: { 'X-User-Agent': 'LUNAR.MP3 (retro Spotify client)' },
      })
      data = res.ok ? await res.json() : null
    } catch {
      data = null
    }
    if (!data) return null

    if (data.instrumental) return { lines: [], synced: true, sourceName: 'lrclib' }

    if (typeof data.syncedLyrics === 'string' && data.syncedLyrics.trim()) {
      return { lines: parseLrc(data.syncedLyrics), synced: true, sourceName: 'lrclib' }
    }

    if (typeof data.plainLyrics === 'string' && data.plainLyrics.trim()) {
      return {
        lines: linesFromPlainText(data.plainLyrics, durationSec ?? 0),
        synced: false,
        sourceName: 'lrclib (unsynced)',
      }
    }

    return null
  },
}
