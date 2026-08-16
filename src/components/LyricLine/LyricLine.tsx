import { forwardRef } from 'react'
import './LyricLine.css'

interface LyricLineProps {
  text: string
  state: 'past' | 'active' | 'upcoming'
}

export const LyricLine = forwardRef<HTMLDivElement, LyricLineProps>(function LyricLine(
  { text, state },
  ref,
) {
  return (
    <div ref={ref} className={`lyric-line lyric-line--${state}`}>
      <p className="lyric-line__text">{text}</p>
    </div>
  )
})
