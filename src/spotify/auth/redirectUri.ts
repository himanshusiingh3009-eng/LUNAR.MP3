// Spotify no longer accepts "localhost" as a redirect URI host —
// only the explicit loopback IP. This derives the redirect URI from
// wherever the app is actually running, normalizing the host so it
// always matches what you register in the Spotify dashboard.
//
// In the packaged/dev Electron shell, the app is loaded from a
// file:// URL (or the Vite dev server) rather than the fixed
// loopback address the OS actually opens for the OAuth redirect —
// window.location isn't meaningful there. Electron's main process
// runs its own tiny loopback HTTP server for exactly this (see
// electron/main.cjs), on a fixed, known port — use that instead.
// NOTE: this port must match OAUTH_CALLBACK_PORT in electron/main.cjs.
export function getRedirectUri(): string {
  if (window.lunarDesktop) {
    return 'http://127.0.0.1:5174/callback'
  }
  const { protocol, hostname, port } = window.location
  const host = hostname === 'localhost' ? '127.0.0.1' : hostname
  const portPart = port ? `:${port}` : ''
  return `${protocol}//${host}${portPart}/callback`
}
