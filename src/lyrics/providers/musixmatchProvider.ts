import type { LyricsProvider, LyricsResult } from './types'

// Musixmatch's free developer tier only returns short lyric
// PREVIEWS, not full or synced lyrics — full/synced text requires a
// paid commercial license Musixmatch doesn't sell self-serve. So
// this provider is deliberately last in the chain: a partial,
// unsynced snippet, used only when lrclib has nothing.
//
// Musixmatch's API also doesn't support CORS, so calls are routed
// through the Vite dev proxy (see vite.config.ts) rather than
// hitting api.musixmatch.com directly from the browser. Electron
// packaging (Phase 16) will need an equivalent main-process proxy.
const PROXY_BASE = '/api/musixmatch/ws/1.1'

export const musixmatchProvider: LyricsProvider = {
  name: 'musixmatch',
  async fetchLyrics(query): Promise<LyricsResult | null> {
    const apiKey = import.meta.env.VITE_MUSIXMATCH_API_KEY as string | undefined
    if (!apiKey) return null // not configured — skip silently, chain moves on

    try {
      const matchParams = new URLSearchParams({
        q_track: query.title,
        q_artist: query.artist,
        apikey: apiKey,
        format: 'json',
      })
      const matchRes = await fetch(`${PROXY_BASE}/matcher.lyrics.get?${matchParams.toString()}`)
      if (!matchRes.ok) return null

      const data = await matchRes.json()
      const body = data?.message?.body?.lyrics
      const previewText: string | undefined = body?.lyrics_body

      if (!previewText || !previewText.trim()) return null

      // Preview text only — no per-line timestamps exist at this
      // tier, so this is intentionally rendered as a single
      // unsynced block rather than pretending to have line sync.
      const cleaned = previewText.replace(/\*+\s*This Lyrics is NOT for Commercial use.*$/is, '').trim()

      return {
        lines: [{ id: '0', text: cleaned, startSec: 0, endSec: Infinity }],
        synced: false,
        sourceName: 'musixmatch (preview)',
      }
    } catch {
      return null
    }
  },
}
