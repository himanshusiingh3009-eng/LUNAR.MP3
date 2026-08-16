interface CRTOverlayProps {
  enabled: boolean
}

export function CRTOverlay({ enabled }: CRTOverlayProps) {
  if (!enabled) return null
  return (
    <>
      <div className="crt-overlay crt-flicker" aria-hidden="true" />
      <div className="crt-noise" aria-hidden="true" />
    </>
  )
}
