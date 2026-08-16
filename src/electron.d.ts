// Ambient type for the bridge exposed by electron/preload.cjs.
// Only present when running inside the packaged/dev Electron shell —
// undefined in the plain browser dev mode, which every consumer
// must check for before using it.
export interface LunarDesktopBridge {
  isElectron: true
  getOAuthRedirectUri: () => Promise<string>
  openExternal: (url: string) => Promise<void>
  onOAuthCallback: (callback: (params: Record<string, string>) => void) => () => void
  secureStorage: {
    set: (key: string, value: string) => Promise<boolean>
    get: (key: string) => Promise<string | null>
    delete: (key: string) => Promise<void>
  }
}

declare global {
  interface Window {
    lunarDesktop?: LunarDesktopBridge
  }
}
