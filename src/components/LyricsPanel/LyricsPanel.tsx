import { useEffect, useRef } from 'react'
import type { LyricLine as LyricLineData } from '../../lyrics/types/lyric'
import { LyricLine } from '../LyricLine/LyricLine'
import './LyricsPanel.css'

interface LyricsPanelProps {
  lines: LyricLineData[]
  activeIndex: number
  synced?: boolean
  sourceName?: string | null
  /** Controlled from Settings (Phase 14) so the preference persists. */
  autoScroll: boolean
}

export function LyricsPanel({
  lines,
  activeIndex,
  synced = true,
  sourceName = null,
  autoScroll,
}: LyricsPanelProps) {
  const bodyRef = useRef<HTMLDivElement>(null)
  const activeLineRef = useRef<HTMLDivElement>(null)

  // Keep the active line centered as playback advances.
  useEffect(() => {
    if (!autoScroll) return
    activeLineRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, [activeIndex, autoScroll])

  return (
    <div className="lyrics-panel panel">
      <div className="lyrics-panel__header">
        <span>
          ♪ LYRICS
          {lines.length > 0 && (
            <span
              className={`lyrics-panel__sync-badge lyrics-panel__sync-badge--${synced ? 'synced' : 'unsynced'}`}
            >
              {synced ? 'SYNCED' : 'UNSYNCED PREVIEW'}
            </span>
          )}
        </span>
      </div>

      <div className="lyrics-panel__body" ref={bodyRef}>
        {lines.length === 0 ? (
          <p className="lyrics-panel__empty">LYRICS UNAVAILABLE</p>
        ) : (
          <>
            {lines.map((line, i) => {
              const isActive = i === activeIndex
              return (
                <LyricLine
                  key={line.id}
                  ref={isActive ? activeLineRef : undefined}
                  text={line.text}
                  state={isActive ? 'active' : i < activeIndex ? 'past' : 'upcoming'}
                />
              )
            })}
            {sourceName && <p className="lyrics-panel__source">source: {sourceName}</p>}
          </>
        )}
      </div>
    </div>
  )
}
