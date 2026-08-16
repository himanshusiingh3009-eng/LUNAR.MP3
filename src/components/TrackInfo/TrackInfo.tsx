import { memo } from 'react'
import type { PlaybackStatus } from '../../spotify/types/track'
import { StatusIndicator } from '../StatusIndicator/StatusIndicator'
import './TrackInfo.css'

interface TrackInfoProps {
  title: string
  artist: string
  album: string
  status: PlaybackStatus
}

export const TrackInfo = memo(function TrackInfo({ title, artist, album, status }: TrackInfoProps) {
  return (
    <div className="track-info">
      <div className="track-info__field">
        <span className="track-info__label">TITLE</span>
        <h1 className="track-info__title" title={title}>
          {title}
        </h1>
      </div>
      <div className="track-info__field">
        <span className="track-info__label">ARTIST</span>
        <p className="track-info__artist" title={artist}>
          {artist}
        </p>
      </div>
      <div className="track-info__field">
        <span className="track-info__label">ALBUM</span>
        <p className="track-info__album" title={album}>
          {album}
        </p>
      </div>
      <StatusIndicator status={status} />
    </div>
  )
})
