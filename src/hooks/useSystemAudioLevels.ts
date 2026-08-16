import { useCallback, useEffect, useRef, useState } from 'react'

// Captures the user's own system/tab audio output via the browser's
// screen-share picker — NOT Spotify's stream directly, and nothing
// to do with Spotify's SDK or API. This is the same category of
// thing as pointing a microphone at your speakers: it reads sound
// that's already audible on your machine. Still opt-in and
// explicit, since Spotify's broad ToS language around visualizing
// their audio is a real consideration the user accepted knowingly.
export function useSystemAudioLevels() {
  const [enabled, setEnabled] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const audioCtxRef = useRef<AudioContext | null>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const disable = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop())
    audioCtxRef.current?.close().catch(() => {})
    analyserRef.current = null
    audioCtxRef.current = null
    streamRef.current = null
    setEnabled(false)
  }, [])

  const enable = useCallback(async () => {
    setError(null)
    try {
      // video: true is required by getDisplayMedia in most browsers
      // even though only the audio track is wanted — the video track
      // is stopped immediately below and never rendered anywhere.
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true,
      })

      const audioTracks = stream.getAudioTracks()
      if (audioTracks.length === 0) {
        stream.getTracks().forEach((t) => t.stop())
        setError('No audio was shared — pick "share tab audio" or enable system audio in the picker.')
        return
      }
      stream.getVideoTracks().forEach((t) => t.stop())

      const audioCtx = new AudioContext()
      const source = audioCtx.createMediaStreamSource(stream)
      const analyser = audioCtx.createAnalyser()
      analyser.fftSize = 64 // 32 frequency bins — plenty for 28 bars
      analyser.smoothingTimeConstant = 0.75
      source.connect(analyser)

      audioCtxRef.current = audioCtx
      analyserRef.current = analyser
      streamRef.current = stream
      audioTracks[0].addEventListener('ended', disable)

      setEnabled(true)
    } catch (err) {
      setError(
        err instanceof DOMException && err.name === 'NotAllowedError'
          ? 'Permission denied.'
          : 'Could not start audio capture — needs a Chromium browser (Chrome/Edge) with "share audio" support.',
      )
    }
  }, [disable])

  const getAnalyser = useCallback(() => analyserRef.current, [])

  // Release the mic-equivalent capture stream and close the
  // AudioContext if the component using this hook unmounts while
  // live audio is still active — otherwise the stream and context
  // leak silently (and the browser's "sharing" indicator would stay
  // on with no visible source).
  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop())
      audioCtxRef.current?.close().catch(() => {})
    }
  }, [])

  return { enabled, error, enable, disable, getAnalyser }
}
