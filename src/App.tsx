import { useCallback, useEffect, useRef, useState } from 'react'
import logoUrl from './assets/logo.png'
import { AlbumArt } from './components/AlbumArt/AlbumArt'
import { TrackInfo } from './components/TrackInfo/TrackInfo'
import { PlaybackControls } from './components/PlaybackControls/PlaybackControls'
import { ProgressBar } from './components/ProgressBar/ProgressBar'
import { VolumeControl } from './components/VolumeControl/VolumeControl'
import { SpectralVisualizer } from './components/SpectralVisualizer/SpectralVisualizer'
import { LyricsPanel } from './components/LyricsPanel/LyricsPanel'
import { CRTOverlay } from './components/CRTOverlay/CRTOverlay'
import { ConfigScreen } from './components/ConfigScreen/ConfigScreen'
import { ConnectScreen } from './components/ConnectScreen/ConnectScreen'
import { SettingsPanel } from './components/SettingsPanel/SettingsPanel'
import { useLocalStorage } from './hooks/useLocalStorage'
import { useSpotifyAuth } from './hooks/useSpotifyAuth'
import { usePlaybackState } from './hooks/usePlaybackState'
import { useLyrics } from './hooks/useLyrics'
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts'
import { lrclibProvider } from './lyrics/providers/lrclibProvider'
import { musixmatchProvider } from './lyrics/providers/musixmatchProvider'
import { createLyricsProviderChain } from './lyrics/providers/chainProvider'
import { getActiveLyricIndex } from './lyrics/synchronizer/synchronizer'
import { DEFAULT_CONFIG, CONFIG_STORAGE_KEY, type LunarConfig } from './spotify/auth/config'
import './App.css'

// Phase 7: versatile provider chain. lrclib (free, real sync) tried
// first, Musixmatch (preview-only, needs VITE_MUSIXMATCH_API_KEY)
// second. Deliberately NO demo/placeholder fallback here — showing
// fake lyrics on a real song would violate "don't fake sync." If
// both real providers come up empty, LyricsPanel shows LYRICS
// UNAVAILABLE, per the brief. Add a new real source later by adding
// one entry to this array — nothing else needs to change.
const lyricsProvider = createLyricsProviderChain([lrclibProvider, musixmatchProvider])

export default function App() {
  const [config, setConfig] = useLocalStorage<LunarConfig>(CONFIG_STORAGE_KEY, DEFAULT_CONFIG)
  const auth = useSpotifyAuth(config.spotifyClientId)
  const accessToken = auth.status === 'authenticated' ? auth.session?.accessToken ?? null : null
  const playback = usePlaybackState(accessToken, auth.logout)
  const [muted, setMuted] = useState(false)
  const [preMuteVolume, setPreMuteVolume] = useState(70)
  const [settingsOpen, setSettingsOpen] = useState(false)

  // Phase 6/7: modular lyrics pipeline — see lyricsProvider above.
  const lyricsTrack = playback.hasTrack
    ? {
        title: playback.title,
        artist: playback.artist,
        album: playback.album,
        durationMs: playback.durationMs,
      }
    : null
  const lyrics = useLyrics(lyricsTrack, lyricsProvider)
  const positionSec = playback.positionMs / 1000
  const activeLyricIndex = getActiveLyricIndex(lyrics.lines, positionSec)
  const trackKey = playback.trackId ?? `${playback.title}::${playback.artist}`

  const settingsPanelRef = useRef<HTMLDivElement>(null)
  const settingsButtonRef = useRef<HTMLButtonElement>(null)

  const handleToggleMute = useCallback(() => {
    if (muted) {
      playback.changeVolume(preMuteVolume)
      setMuted(false)
    } else {
      setPreMuteVolume(playback.volume)
      playback.changeVolume(0)
      setMuted(true)
    }
  }, [muted, preMuteVolume, playback.changeVolume, playback.volume])

  // Close the settings panel on an outside click.
  useEffect(() => {
    if (!settingsOpen) return
    function onPointerDown(e: MouseEvent) {
      const target = e.target as Node
      if (settingsPanelRef.current?.contains(target)) return
      if (settingsButtonRef.current?.contains(target)) return
      setSettingsOpen(false)
    }
    document.addEventListener('mousedown', onPointerDown)
    return () => document.removeEventListener('mousedown', onPointerDown)
  }, [settingsOpen])

  // "T" opens the settings panel, where theme lives now.
  useEffect(() => {
    if (settingsOpen) settingsPanelRef.current?.focus()
  }, [settingsOpen])

  // Phase 13: keyboard controls. Only active on the main player —
  // the config/connect gates below return before this ever runs
  // their own screens, and this hook itself already skips handling
  // when a text input, range slider, or the theme <select> has focus.
  useKeyboardShortcuts(
    {
      onTogglePlay: playback.togglePlay,
      onSeekBack: () => playback.seekTo(Math.max(0, playback.positionMs - 5000)),
      onSeekForward: () =>
        playback.seekTo(Math.min(playback.durationMs, playback.positionMs + 5000)),
      onVolumeUp: () => {
        if (muted) setMuted(false)
        playback.changeVolume(Math.min(100, playback.volume + 5))
      },
      onVolumeDown: () => {
        if (muted) setMuted(false)
        playback.changeVolume(Math.max(0, playback.volume - 5))
      },
      onToggleMute: handleToggleMute,
      onFocusTheme: () => setSettingsOpen(true),
    },
    config.configured && auth.status === 'authenticated',
  )

  // Gate 1: first-launch configuration (Client ID + theme).
  if (!config.configured) {
    return <ConfigScreen initial={config} onSave={setConfig} />
  }

  // Gate 2: Spotify OAuth. Anything other than "authenticated" shows
  // the connect screen, including while /callback is being processed.
  if (auth.status !== 'authenticated') {
    return (
      <ConnectScreen
        status={auth.status}
        errorMessage={auth.errorMessage}
        theme={config.theme}
        onConnect={auth.login}
        onReconfigure={() => setConfig(DEFAULT_CONFIG)}
      />
    )
  }

  const statusLabel = playback.loading
    ? 'loading'
    : playback.error === 'premium_required' || playback.error === 'no_active_device'
      ? 'disconnected'
      : playback.isPlaying
        ? 'playing'
        : 'paused'

  const noTrackMessage =
    playback.error === 'premium_required'
      ? 'SPOTIFY PREMIUM REQUIRED FOR PLAYBACK CONTROL'
      : playback.error === 'no_active_device'
        ? 'NO ACTIVE SPOTIFY DEVICE — START PLAYING SOMETHING ON SPOTIFY'
        : playback.error === 'network_error'
          ? 'CONNECTION ERROR — RETRYING'
          : 'NOTHING PLAYING RIGHT NOW'

  return (
    <div className="app-shell" data-theme={config.theme}>
      <CRTOverlay enabled={config.crtEnabled} />

      {playback.controlError && (
        <div className="control-error-toast" role="alert">
          [ ERROR ] {playback.controlError}
        </div>
      )}

      <header className="app-header">
        <span className="app-header__wordmark">
          <img src={logoUrl} alt="" className="app-header__logo" />
          LUNAR.MP3
        </span>
        <div className="app-header__actions">
          <button
            type="button"
            ref={settingsButtonRef}
            className="app-header__crt-toggle"
            onClick={() => setSettingsOpen((v) => !v)}
            aria-pressed={settingsOpen}
          >
            ⚙ SETTINGS
          </button>
          {settingsOpen && (
            <SettingsPanel
              ref={settingsPanelRef}
              theme={config.theme}
              onThemeChange={(theme) => setConfig({ ...config, theme })}
              autoScroll={config.autoScroll}
              onAutoScrollChange={(autoScroll) => setConfig({ ...config, autoScroll })}
              crtEnabled={config.crtEnabled}
              onCrtChange={(crtEnabled) => setConfig({ ...config, crtEnabled })}
              onLogout={auth.logout}
              onReconfigure={() => setConfig(DEFAULT_CONFIG)}
              onClose={() => setSettingsOpen(false)}
            />
          )}
        </div>
      </header>

      <div className="app-main">
        <div className="app-left panel">
          <AlbumArt src={playback.artworkUrl} alt={playback.title || 'Album artwork'} />
          {playback.hasTrack ? (
            <TrackInfo
              title={playback.title}
              artist={playback.artist}
              album={playback.album}
              status={statusLabel}
            />
          ) : (
            <div className="app-left__no-track">
              <p>{noTrackMessage}</p>
            </div>
          )}
          <SpectralVisualizer isPlaying={playback.isPlaying} trackKey={trackKey} />
          <PlaybackControls
            isPlaying={playback.isPlaying}
            disabled={playback.loading}
            onPrevious={playback.previous}
            onTogglePlay={playback.togglePlay}
            onNext={playback.next}
          />
          <VolumeControl
            volume={playback.volume}
            muted={muted}
            onChange={playback.changeVolume}
            onToggleMute={handleToggleMute}
          />
        </div>

        <LyricsPanel
          lines={lyrics.lines}
          activeIndex={activeLyricIndex}
          synced={lyrics.synced}
          sourceName={lyrics.sourceName}
          autoScroll={config.autoScroll}
        />
      </div>

      <ProgressBar
        positionMs={playback.positionMs}
        durationMs={playback.durationMs}
        onSeek={playback.seekTo}
      />
    </div>
  )
}
