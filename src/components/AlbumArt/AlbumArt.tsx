import { memo, useEffect, useState } from 'react'
import './AlbumArt.css'

interface AlbumArtProps {
  src: string | null
  alt: string
}

export const AlbumArt = memo(function AlbumArt({ src, alt }: AlbumArtProps) {
  // Defaults to square (matches Spotify's near-universal 1:1 art)
  // but adapts to the real loaded image so any future non-square
  // artwork still gets an exactly-fitting frame instead of a fixed
  // 1:1 box letterboxing it.
  const [ratio, setRatio] = useState(1)

  // Reset to the square default whenever the track changes, so the
  // frame doesn't briefly keep the previous cover's ratio while the
  // next image is still loading.
  useEffect(() => {
    setRatio(1)
  }, [src])

  return (
    <div className="album-art" style={{ aspectRatio: ratio }}>
      {src ? (
        <img
          src={src}
          alt={alt}
          className="album-art__image"
          onLoad={(e) => {
            const img = e.currentTarget
            if (img.naturalWidth && img.naturalHeight) {
              setRatio(img.naturalWidth / img.naturalHeight)
            }
          }}
        />
      ) : (
        <div className="album-art__placeholder" aria-hidden="true">
          <span>NO SIGNAL</span>
        </div>
      )}
      <div className="album-art__scan" aria-hidden="true" />
      <div className="album-art__lines" aria-hidden="true" />
    </div>
  )
})
