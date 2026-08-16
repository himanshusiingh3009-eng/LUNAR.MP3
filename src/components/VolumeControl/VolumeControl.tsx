import { memo } from 'react'
import './VolumeControl.css'

interface VolumeControlProps {
  volume: number // 0-100
  muted: boolean
  onChange: (volume: number) => void
  onToggleMute: () => void
}

export const VolumeControl = memo(function VolumeControl({
  volume,
  muted,
  onChange,
  onToggleMute,
}: VolumeControlProps) {
  const effective = muted ? 0 : volume

  return (
    <div className="volume-control">
      <button
        type="button"
        className="volume-control__icon"
        onClick={onToggleMute}
        aria-label={muted ? 'Unmute' : 'Mute'}
      >
        {muted || volume === 0 ? '✕ VOL' : 'VOL'}
      </button>
      <input
        type="range"
        className="volume-control__slider"
        min={0}
        max={100}
        value={effective}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{ ['--fill' as string]: `${effective}%` }}
        aria-label="Volume"
      />
      <span className="volume-control__value">{effective}</span>
    </div>
  )
})
