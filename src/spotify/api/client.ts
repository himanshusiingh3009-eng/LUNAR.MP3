const API_BASE = 'https://api.spotify.com/v1'

export class SpotifyApiError extends Error {
  status: number
  reason?: string

  constructor(status: number, message: string, reason?: string) {
    super(message)
    this.status = status
    this.reason = reason
  }
}

interface RequestOptions {
  method?: string
  body?: unknown
}

export async function spotifyFetch<T = unknown>(
  accessToken: string,
  path: string,
  options: RequestOptions = {},
): Promise<T | null> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: options.method ?? 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  })

  // Spotify returns 204 for "no active playback" and for successful
  // control commands (play/pause/next/etc).
  if (res.status === 204) return null

  if (res.status === 401) {
    throw new SpotifyApiError(401, 'Access token expired or invalid')
  }

  if (!res.ok) {
    let message = res.statusText
    let reason: string | undefined
    try {
      const data = await res.json()
      message = data?.error?.message ?? message
      reason = data?.error?.reason
    } catch {
      // body wasn't JSON — fall back to statusText
    }
    throw new SpotifyApiError(res.status, message, reason)
  }

  const text = await res.text()
  return text ? (JSON.parse(text) as T) : null
}
