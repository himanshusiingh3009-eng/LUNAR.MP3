import type { LyricLine } from '../types/lyric'

// Parses standard LRC-format synced lyrics, e.g.:
//   [00:12.34]Here she comes walking down the street
// into LyricLine[] with startSec set from the timestamp and endSec
// inferred from the next line's start (last line gets a 4s tail).
// Built now so Phase 7 can drop in a real LyricsProvider that
// returns raw LRC text without writing a new parser.
const LRC_LINE = /^\[(\d{2}):(\d{2})(?:\.(\d{1,3}))?\](.*)$/

export function parseLrc(raw: string): LyricLine[] {
  const rawLines = raw
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)

  const parsed: { startSec: number; text: string }[] = []

  for (const line of rawLines) {
    const match = LRC_LINE.exec(line)
    if (!match) continue

    const [, mm, ss, frac, text] = match
    const minutes = Number(mm)
    const seconds = Number(ss)
    const fraction = frac ? Number(`0.${frac}`) : 0
    const startSec = minutes * 60 + seconds + fraction

    const trimmedText = text.trim()
    if (trimmedText) parsed.push({ startSec, text: trimmedText })
  }

  parsed.sort((a, b) => a.startSec - b.startSec)

  return parsed.map((line, i) => ({
    id: String(i),
    text: line.text,
    startSec: line.startSec,
    endSec: i < parsed.length - 1 ? parsed[i + 1].startSec : line.startSec + 4,
  }))
}
