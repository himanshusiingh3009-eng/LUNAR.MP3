// Deliberately minimal. PKCE does not require a client secret, and
// the Spotify username has no authentication role — the OAuth
// session itself is the identity. See Phase 2 notes.
export interface LunarConfig {
  spotifyClientId: string
  theme: string
  configured: boolean
  // Phase 14: persisted preferences, previously local component
  // state that reset on every reload.
  autoScroll: boolean
  crtEnabled: boolean
}

export const DEFAULT_CONFIG: LunarConfig = {
  spotifyClientId: '',
  theme: 'neon-purple',
  configured: false,
  autoScroll: true,
  crtEnabled: true,
}

export const CONFIG_STORAGE_KEY = 'lunar.config'
