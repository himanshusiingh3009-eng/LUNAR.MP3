import type { LyricsProvider } from './types'
import type { LyricLine } from '../types/lyric'

// Demo/testing provider — used in the provider chain as the very
// last resort so lyrics UI/sync can always be exercised even with
// no network. Real songs should get real lyrics from lrclib or
// Musixmatch before this is ever reached.
const DEMO_LINES: LyricLine[] = [
  { id: '1', text: 'the signal is quiet before it plays', startSec: 0, endSec: 4 },
  { id: '2', text: 'a station waiting in the dark', startSec: 4, endSec: 8 },
  { id: '3', text: 'connect the deck and let it spark', startSec: 8, endSec: 12 },
  { id: '4', text: 'this is where the static ends', startSec: 12, endSec: 16 },
  { id: '5', text: 'and the real broadcast begins', startSec: 16, endSec: 20 },
]

export const placeholderProvider: LyricsProvider = {
  name: 'placeholder',
  async fetchLyrics() {
    return { lines: DEMO_LINES, synced: true, sourceName: 'placeholder' }
  },
}
