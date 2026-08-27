const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('nullpoint', {
  settings: {
    get: () => ipcRenderer.invoke('settings:get'),
    set: (value) => ipcRenderer.invoke('settings:set', value),
    choosePath: () => ipcRenderer.invoke('client:choosePath')
  },
  profile: { get: () => ipcRenderer.invoke('profile:get') },
  auth: { logout: () => ipcRenderer.invoke('auth:logout') },
  window: {
    minimize: () => ipcRenderer.invoke('window:minimize'),
    close: () => ipcRenderer.invoke('window:close')
  }
});
