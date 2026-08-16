import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // Relative asset paths — required for the built app to load
  // correctly under Electron's file:// protocol (loadFile()).
  // Vite's default of absolute "/assets/..." paths resolves against
  // the filesystem root under file://, not the dist folder, and
  // silently breaks every asset (blank white window, no errors in
  // the visible UI). Harmless for the Vite dev server, which always
  // serves from root regardless of this setting.
  base: './',
  server: {
    // Spotify's OAuth redirect URI validation requires the literal
    // loopback IP, not the "localhost" hostname (localhost aliases
    // were dropped from Spotify's OAuth support in Nov 2025).
    // Always open the app via http://127.0.0.1:5173/ during dev.
    host: '127.0.0.1',
    port: 5173,
    proxy: {
      // Musixmatch's API doesn't support CORS, so browser requests
      // are routed through this dev-server proxy instead of hitting
      // api.musixmatch.com directly. See lyrics/providers/musixmatchProvider.ts.
      // NOTE: this proxy only exists in `npm run dev` — the packaged
      // Electron app has no dev server to proxy through, so
      // Musixmatch (already optional, needs VITE_MUSIXMATCH_API_KEY)
      // will fail there and the lyrics chain gracefully skips it,
      // same as when the key isn't set at all. lrclib (no proxy
      // needed, CORS-open) is unaffected and remains the primary
      // source in the packaged app.
      '/api/musixmatch': {
        target: 'https://api.musixmatch.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/musixmatch/, ''),
      },
    },
  },
})
