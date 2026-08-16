import type { LyricLine } from '../types/lyric'

// Pure, stateless — given lines and a position, tell me what's
// active and how far through it we are. No timers of its own; the
// caller re-evaluates these on every position update (Phase 4's
// rAF-driven playback position), so lyric sync always tracks real
// Spotify playback rather than an independent clock.

export function getActiveLyricIndex(lines: LyricLine[], positionSec: number): number {
  for (let i = lines.length - 1; i >= 0; i--) {
    if (positionSec >= lines[i].startSec) return i
  }
  return -1
}

export function getLyricProgress(line: LyricLine | undefined, positionSec: number): number {
  if (!line) return 0
  const span = line.endSec - line.startSec
  if (span <= 0) return 1
  return Math.min(1, Math.max(0, (positionSec - line.startSec) / span))
}
