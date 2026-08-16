import { useEffect, useState, useCallback, useRef } from 'react'
import { beginAuthorization, completeAuthorization, refreshSession } from '../spotify/auth/tokenExchange'
import {
  loadSession,
  saveSession,
  clearSession,
  isSessionExpired,
  type SpotifySession,
} from '../spotify/auth/session'

export type AuthStatus =
  | 'not_connected'
  | 'connecting'
  | 'authenticated'
  | 'authorization_denied'
  | 'authentication_failed'
  | 'token_expired'

interface AuthState {
  status: AuthStatus
  session: SpotifySession | null
  errorMessage: string | null
}

export function useSpotifyAuth(clientId: string) {
  // Session storage is async everywhere now (Electron's secureStorage
  // is an IPC round-trip; see session.ts), so the initial state can't
  // be known synchronously the way a plain localStorage read could —
  // start neutral and resolve it in an effect below.
  const [state, setState] = useState<AuthState>({
    status: 'not_connected',
    session: null,
    errorMessage: null,
  })
  const initialLoadDone = useRef(false)

  useEffect(() => {
    if (initialLoadDone.current) return
    initialLoadDone.current = true
    loadSession().then((existing) => {
      if (existing) {
        setState({ status: 'authenticated', session: existing, errorMessage: null })
      }
    })
  }, [])

  const handleCallbackParams = useCallback(
    async (params: URLSearchParams) => {
      if (!clientId) return
      setState((s) => ({ ...s, status: 'connecting' }))

      const result = await completeAuthorization(clientId, params)

      if (result.status === 'success') {
        await saveSession(result.session)
        setState({ status: 'authenticated', session: result.session, errorMessage: null })
      } else if (result.status === 'denied') {
        setState({ status: 'authorization_denied', session: null, errorMessage: null })
      } else {
        setState({ status: 'authentication_failed', session: null, errorMessage: result.message })
      }
    },
    [clientId],
  )

  // Browser dev flow: Spotify redirects the SAME window back to
  // /callback?code=...
  useEffect(() => {
    if (window.location.pathname !== '/callback') return
    const params = new URLSearchParams(window.location.search)
    handleCallbackParams(params).finally(() => {
      window.history.replaceState({}, '', '/')
    })
  }, [handleCallbackParams])

  // Electron flow: login happens in the system browser, which hits a
  // separate loopback server in the main process (electron/main.cjs)
  // — this app window never navigates, so the result arrives via IPC
  // instead of window.location. See tokenExchange.ts's beginAuthorization.
  useEffect(() => {
    if (!window.lunarDesktop) return
    const unsubscribe = window.lunarDesktop.onOAuthCallback((paramsObj) => {
      handleCallbackParams(new URLSearchParams(paramsObj))
    })
    return unsubscribe
  }, [handleCallbackParams])

  // Proactively refresh a token that's about to expire.
  useEffect(() => {
    if (state.status !== 'authenticated' || !state.session) return
    if (!isSessionExpired(state.session)) return

    setState((s) => ({ ...s, status: 'token_expired' }))
    refreshSession(clientId, state.session.refreshToken).then((refreshed) => {
      if (refreshed) {
        saveSession(refreshed)
        setState({ status: 'authenticated', session: refreshed, errorMessage: null })
      } else {
        clearSession()
        setState({
          status: 'authentication_failed',
          session: null,
          errorMessage: 'Session expired and could not be refreshed. Please reconnect.',
        })
      }
    })
  }, [state.status, state.session, clientId])

  const login = useCallback(() => {
    if (!clientId) return
    setState((s) => ({ ...s, status: 'connecting' }))
    beginAuthorization(clientId)
  }, [clientId])

  const logout = useCallback(() => {
    clearSession()
    setState({ status: 'not_connected', session: null, errorMessage: null })
  }, [])

  return { ...state, login, logout }
}
