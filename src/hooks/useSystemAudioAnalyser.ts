import { useCallback, useEffect, useRef, useState } from 'react'

const BAR_COUNT = 28

// Captures system/tab audio via the browser's own screen-share
// picker — the user explicitly chooses what to share and must check
// "Share audio" — this is NOT tapping Spotify's stream directly, it's
// analyzing whatever is audibly playing on the machine. Real FFT via
// AnalyserNode, no fabricated data. Opt-in only: requires an explicit
// user gesture to start (browsers enforce this for getDisplayMedia
// regardless), matching the consent already given for this feature.
export function useSystemAudioAnalyser() {
  const [active, setActive] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [bars, setBars] = useState<number[] | null>(null)

  const audioCtxRef = useRef<AudioContext | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const rafRef = useRef<number>()

  const stop = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    streamRef.current?.getTracks().forEach((t) => t.stop())
    audioCtxRef.current?.close().catch(() => {})
    audioCtxRef.current = null
    streamRef.current = null
    setActive(false)
    setBars(null)
  }, [])

  const start = useCallback(async () => {
    setError(null)
    try {
      // Browsers require video:true to be requested for screen/tab
      // capture even though only the audio track is used below.
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true,
      })

      const audioTracks = stream.getAudioTracks()
      if (audioTracks.length === 0) {
        stream.getTracks().forEach((t) => t.stop())
        setError('No audio shared — pick "This Tab" and check "Share audio" in the dialog.')
        return
      }

      // Never need the video track — stop it immediately.
      stream.getVideoTracks().forEach((t) => t.stop())

      const audioCtx = new AudioContext()
      const source = audioCtx.createMediaStreamSource(stream)
      const analyser = audioCtx.createAnalyser()
      analyser.fftSize = 128
      analyser.smoothingTimeConstant = 0.75
      source.connect(analyser)

      audioCtxRef.current = audioCtx
      streamRef.current = stream
      setActive(true)

      const freqData = new Uint8Array(analyser.frequencyBinCount)
      const binsPerBar = Math.max(1, Math.floor(freqData.length / BAR_COUNT))

      const tick = () => {
        analyser.getByteFrequencyData(freqData)
        const next: number[] = []
        for (let i = 0; i < BAR_COUNT; i++) {
          let sum = 0
          const base = i * binsPerBar
          for (let j = 0; j < binsPerBar; j++) sum += freqData[base + j] ?? 0
          const avg = sum / binsPerBar
          next.push(Math.max(4, (avg / 255) * 100))
        }
        setBars(next)
        rafRef.current = requestAnimationFrame(tick)
      }
      tick()

      // If the user stops sharing via the browser's own UI chrome.
      audioTracks[0].addEventListener('ended', stop)
    } catch (err) {
      if (err instanceof DOMException && err.name === 'NotAllowedError') {
        setError('Permission denied.')
      } else {
        setError('Could not start audio capture.')
      }
    }
  }, [stop])

  useEffect(() => stop, [stop]) // cleanup on unmount

  return {
    supported: typeof navigator !== 'undefined' && Boolean(navigator.mediaDevices?.getDisplayMedia),
    active,
    error,
    bars,
    start,
    stop,
  }
}
