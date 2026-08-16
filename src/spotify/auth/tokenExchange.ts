import { generateCodeChallenge, generateCodeVerifier, generateState } from './pkce'
import { getRedirectUri } from './redirectUri'
import type { SpotifySession } from './session'

const AUTHORIZE_URL = 'https://accounts.spotify.com/authorize'
const TOKEN_URL = 'https://accounts.spotify.com/api/token'

// Only the scopes LUNAR.MP3 actually needs: reading what's playing,
// controlling playback (play/pause/skip/seek/volume), and streaming
// via the Web Playback SDK later. No scopes beyond what the feature
// set in the brief requires.
const SCOPES = [
  'user-read-playback-state',
  'user-modify-playback-state',
  'user-read-currently-playing',
  'streaming',
].join(' ')

const VERIFIER_KEY = 'lunar.pkce_verifier'
const STATE_KEY = 'lunar.pkce_state'

export async function beginAuthorization(clientId: string) {
  const verifier = generateCodeVerifier()
  const challenge = await generateCodeChallenge(verifier)
  const state = generateState()

  sessionStorage.setItem(VERIFIER_KEY, verifier)
  sessionStorage.setItem(STATE_KEY, state)

  const params = new URLSearchParams({
    client_id: clientId,
    response_type: 'code',
    redirect_uri: getRedirectUri(),
    code_challenge_method: 'S256',
    code_challenge: challenge,
    state,
    scope: SCOPES,
  })

  const authorizeUrl = `${AUTHORIZE_URL}?${params.toString()}`

  // In the Electron shell, open the system browser instead of
  // navigating the app window itself — never show a login form
  // inside an app-controlled webview (an established phishing/
  // credential-capture risk and against standard desktop OAuth
  // practice). The app window stays open and receives the result
  // via IPC from electron/main.cjs's loopback server, so sessionStorage
  // here survives untouched — nothing reloads.
  if (window.lunarDesktop) {
    await window.lunarDesktop.openExternal(authorizeUrl)
  } else {
    window.location.assign(authorizeUrl)
  }
}

export type CallbackResult =
  | { status: 'success'; session: SpotifySession }
  | { status: 'denied' }
  | { status: 'error'; message: string }

export async function completeAuthorization(
  clientId: string,
  searchParams: URLSearchParams,
): Promise<CallbackResult> {
  const error = searchParams.get('error')
  if (error === 'access_denied') return { status: 'denied' }
  if (error) return { status: 'error', message: error }

  const code = searchParams.get('code')
  const returnedState = searchParams.get('state')
  const expectedState = sessionStorage.getItem(STATE_KEY)
  const verifier = sessionStorage.getItem(VERIFIER_KEY)

  if (!code || !verifier) {
    return { status: 'error', message: 'Missing authorization code or PKCE verifier.' }
  }
  if (!returnedState || returnedState !== expectedState) {
    return { status: 'error', message: 'State mismatch — possible CSRF, aborting.' }
  }

  sessionStorage.removeItem(VERIFIER_KEY)
  sessionStorage.removeItem(STATE_KEY)

  try {
    const body = new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: getRedirectUri(),
      client_id: clientId,
      code_verifier: verifier,
    })

    const res = await fetch(TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    })

    if (!res.ok) {
      const text = await res.text()
      return { status: 'error', message: `Token exchange failed (${res.status}): ${text}` }
    }

    const data = await res.json()
    return {
      status: 'success',
      session: {
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        expiresAt: Date.now() + data.expires_in * 1000,
        scope: data.scope,
      },
    }
  } catch (err) {
    return { status: 'error', message: err instanceof Error ? err.message : 'Network error' }
  }
}

export async function refreshSession(
  clientId: string,
  refreshToken: string,
): Promise<SpotifySession | null> {
  try {
    const body = new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: clientId,
    })

    const res = await fetch(TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    })

    if (!res.ok) return null

    const data = await res.json()
    return {
      accessToken: data.access_token,
      // Spotify may or may not rotate the refresh token — keep the
      // old one if a new one wasn't issued.
      refreshToken: data.refresh_token ?? refreshToken,
      expiresAt: Date.now() + data.expires_in * 1000,
      scope: data.scope,
    }
  } catch {
    return null
  }
}
