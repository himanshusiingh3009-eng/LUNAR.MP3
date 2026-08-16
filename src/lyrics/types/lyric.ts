// Phase 6/7 will populate these from a real LyricsProvider.
// For Phase 1 we only need the shape so LyricsPanel can render
// static placeholder content.
export interface LyricLine {
  id: string
  text: string
  startSec: number
  endSec: number
}
