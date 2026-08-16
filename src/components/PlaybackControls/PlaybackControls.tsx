import { memo } from 'react'
import './PlaybackControls.css'

interface PlaybackControlsProps {
  isPlaying: boolean
  disabled?: boolean
  onPrevious: () => void
  onTogglePlay: () => void
  onNext: () => void
}

export const PlaybackControls = memo(function PlaybackControls({
  isPlaying,
  disabled = false,
  onPrevious,
  onTogglePlay,
  onNext,
}: PlaybackControlsProps) {
  return (
    <div className="playback-controls">
      <button
        type="button"
        className="playback-controls__btn"
        onClick={onPrevious}
        disabled={disabled}
        aria-label="Previous track"
      >
        <span aria-hidden="true">|&#9666;&#9666;</span>
      </button>
      <button
        type="button"
        className="playback-controls__btn playback-controls__btn--primary"
        onClick={onTogglePlay}
        disabled={disabled}
        aria-label={isPlaying ? 'Pause' : 'Play'}
      >
        <span aria-hidden="true">{isPlaying ? '\u275A\u275A' : '\u25B8'}</span>
      </button>
      <button
        type="button"
        className="playback-controls__btn"
        onClick={onNext}
        disabled={disabled}
        aria-label="Next track"
      >
        <span aria-hidden="true">&#9656;&#9656;|</span>
      </button>
    </div>
  )
})
