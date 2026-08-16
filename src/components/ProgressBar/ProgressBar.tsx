import './ProgressBar.css'

interface ProgressBarProps {
  positionMs: number
  durationMs: number
  onSeek: (ms: number) => void
}

function formatTime(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000))
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
}

export function ProgressBar({ positionMs, durationMs, onSeek }: ProgressBarProps) {
  const percent = durationMs > 0 ? (positionMs / durationMs) * 100 : 0

  return (
    <div className="progress-bar">
      <span className="progress-bar__time">{formatTime(positionMs)}</span>
      <input
        type="range"
        className="progress-bar__track"
        min={0}
        max={durationMs || 0}
        value={positionMs}
        onChange={(e) => onSeek(Number(e.target.value))}
        style={{ ['--fill' as string]: `${percent}%` }}
        aria-label="Seek"
      />
      <span className="progress-bar__time">{formatTime(durationMs)}</span>
    </div>
  )
}
