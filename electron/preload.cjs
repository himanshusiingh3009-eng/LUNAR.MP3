// Preload script — the only bridge between the sandboxed renderer
// (our React app) and Node/Electron APIs. contextIsolation is on and
// nodeIntegration is off in main.cjs, so this is the sole place
// Node-level access exists; only these specific, narrow functions
// are exposed, nothing broader.
const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('lunarDesktop', {
  isElectron: true,

  getOAuthRedirectUri: () => ipcRenderer.invoke('oauth:redirect-uri'),
  openExternal: (url) => ipcRenderer.invoke('oauth:open-external', url),
  onOAuthCallback: (callback) => {
    const handler = (_event, params) => callback(params)
    ipcRenderer.on('oauth-callback', handler)
    return () => ipcRenderer.removeListener('oauth-callback', handler)
  },

  secureStorage: {
    set: (key, value) => ipcRenderer.invoke('secure-storage:set', key, value),
    get: (key) => ipcRenderer.invoke('secure-storage:get', key),
    delete: (key) => ipcRenderer.invoke('secure-storage:delete', key),
  },
})
