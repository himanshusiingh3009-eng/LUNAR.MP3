export interface SpotifySession {
  accessToken: string
  refreshToken: string
  expiresAt: number // epoch ms
  scope: string
}

const SESSION_KEY = 'lunar.session'

// Electron: the refresh token lives in OS-level encrypted storage
// (DPAPI on Windows via Electron's safeStorage — see
// electron/main.cjs) instead of plain localStorage. Browser dev mode
// has no equivalent OS-level store available, so it falls back to
// localStorage there, same as every phase before Electron packaging.
async function storageSet(key: string, value: string): Promise<void> {
  if (window.lunarDesktop) {
    await window.lunarDesktop.secureStorage.set(key, value)
  } else {
    localStorage.setItem(key, value)
  }
}

async function storageGet(key: string): Promise<string | null> {
  if (window.lunarDesktop) {
    return window.lunarDesktop.secureStorage.get(key)
  }
  return localStorage.getItem(key)
}

async function storageDelete(key: string): Promise<void> {
  if (window.lunarDesktop) {
    await window.lunarDesktop.secureStorage.delete(key)
  } else {
    localStorage.removeItem(key)
  }
}

export async function saveSession(session: SpotifySession): Promise<void> {
  await storageSet(SESSION_KEY, JSON.stringify(session))
}

export async function loadSession(): Promise<SpotifySession | null> {
  try {
    const raw = await storageGet(SESSION_KEY)
    return raw ? (JSON.parse(raw) as SpotifySession) : null
  } catch {
    return null
  }
}

export async function clearSession(): Promise<void> {
  await storageDelete(SESSION_KEY)
}

export function isSessionExpired(session: SpotifySession): boolean {
  // 30s buffer so we refresh slightly before actual expiry
  return Date.now() > session.expiresAt - 30_000
}
