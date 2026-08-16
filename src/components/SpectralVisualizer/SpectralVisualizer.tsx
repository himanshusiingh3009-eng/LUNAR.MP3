import { useEffect, useMemo, useRef } from 'react'
import { useSystemAudioLevels } from '../../hooks/useSystemAudioLevels'
import './SpectralVisualizer.css'

const BAR_COUNT = 28

// Deterministic per-track pattern used only as the idle/no-live-audio
// look — see Phase 10 notes on why this isn't claimed to be real
// audio analysis.
function seededHeights(seed: string, count: number): number[] {
  let h = 0
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0
  const heights: number[] = []
  for (let i = 0; i < count; i++) {
    h = (h * 1103515245 + 12345) >>> 0
    heights.push(20 + ((h % 1000) / 1000) * 55)
  }
  return heights
}

interface SpectralVisualizerProps {
  isPlaying: boolean
  trackKey: string
}

export function SpectralVisualizer({ isPlaying, trackKey }: SpectralVisualizerProps) {
  const idleHeights = useMemo(() => seededHeights(trackKey || 'idle', BAR_COUNT), [trackKey])
  const barRefs = useRef<(HTMLSpanElement | null)[]>([])
  const audio = useSystemAudioLevels()
  const rafRef = useRef<number>()

  // Live loop: reads real FFT frequency data from the captured
  // system/tab audio and writes bar heights directly to the DOM via
  // refs — bypassing React state so this can run every animation
  // frame without re-rendering the rest of the app.
  useEffect(() => {
    if (!audio.enabled) return
    const analyser = audio.getAnalyser()
    if (!analyser) return

    const data = new Uint8Array(analyser.frequencyBinCount)

    function tick() {
      const a = audio.getAnalyser()
      if (!a) return
      a.getByteFrequencyData(data)
      const bins = data.length
      for (let i = 0; i < BAR_COUNT; i++) {
        // Weight toward lower bins (bass/mid) where visible energy
        // concentrates, rather than a flat linear mapping.
        const binIndex = Math.floor((i / BAR_COUNT) ** 1.5 * bins)
        const value = data[Math.min(binIndex, bins - 1)] / 255
        const pct = 8 + value * 85
        const el = barRefs.current[i]
        if (el) el.style.height = `${pct}%`
      }
      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [audio, audio.enabled])

  // Not live — fall back to the seeded idle pattern (still reacts to
  // real play/pause via the CSS classes below).
  useEffect(() => {
    if (audio.enabled) return
    barRefs.current.forEach((el, i) => {
      if (el) el.style.height = `${idleHeights[i]}%`
    })
  }, [audio.enabled, idleHeights])

  const stateClass = audio.enabled
    ? 'spectral-visualizer--live'
    : isPlaying
      ? 'spectral-visualizer--playing'
      : 'spectral-visualizer--paused'

  return (
    <div className="spectral-visualizer-block">
      <div className="spectral-visualizer__header-row">
        <span className="spectral-visualizer__label">SPECTRAL</span>
        <button
          type="button"
          className="spectral-visualizer__live-toggle"
          onClick={audio.enabled ? audio.disable : audio.enable}
          aria-pressed={audio.enabled}
        >
          {audio.enabled ? '● LIVE' : 'ENABLE LIVE AUDIO'}
        </button>
      </div>
      {audio.error && <p className="spectral-visualizer__error">{audio.error}</p>}
      <div className={`spectral-visualizer ${stateClass}`} aria-hidden="true">
        {idleHeights.map((h, i) => (
          <span
            key={i}
            ref={(el) => {
              barRefs.current[i] = el
            }}
            className="spectral-visualizer__bar"
            style={{ height: `${h}%`, animationDelay: `${i * 0.08}s` }}
          />
        ))}
      </div>
    </div>
  )
}
