import type { LyricLine } from '../types/lyric'

export interface LyricsQuery {
  title: string
  artist: string
  album?: string
  durationMs?: number
}

export interface LyricsResult {
  lines: LyricLine[]
  /** True only when line timestamps are real, not evenly-guessed. */
  synced: boolean
  sourceName: string
}

export interface LyricsProvider {
  name: string
  fetchLyrics(query: LyricsQuery): Promise<LyricsResult | null>
}
