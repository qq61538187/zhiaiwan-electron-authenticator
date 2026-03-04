const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('authenticatorApi', {
  listAccounts: () => ipcRenderer.invoke('auth:list'),
  addAccount: (payload) => ipcRenderer.invoke('auth:add', payload),
  removeAccount: (id) => ipcRenderer.invoke('auth:remove', id),
  listTrash: () => ipcRenderer.invoke('auth:trash:list'),
  restoreFromTrash: (id) => ipcRenderer.invoke('auth:trash:restore', id),
  clearTrashItem: (id) => ipcRenderer.invoke('auth:trash:clear-item', id),
  clearTrashAll: (masterPassword) => ipcRenderer.invoke('auth:trash:clear-all', masterPassword),
  getCodes: () => ipcRenderer.invoke('auth:codes'),
  exportAccounts: () => ipcRenderer.invoke('auth:export'),
  importAccounts: () => ipcRenderer.invoke('auth:import'),
  getSettings: () => ipcRenderer.invoke('app:settings:get'),
  setLanguage: (language) => ipcRenderer.invoke('app:settings:set-language', language),
  setHideTrayIcon: (hideTrayIcon) =>
    ipcRenderer.invoke('app:settings:set-hide-tray-icon', hideTrayIcon),
  setLaunchAtLogin: (launchAtLogin) =>
    ipcRenderer.invoke('app:settings:set-launch-at-login', launchAtLogin),
  setEnableFloatingBall: (enableFloatingBall) =>
    ipcRenderer.invoke('app:settings:set-enable-floating-ball', enableFloatingBall),
  pickFloatingBallBackgroundImage: () =>
    ipcRenderer.invoke('app:settings:pick-floating-ball-background-image'),
  saveFloatingBallAppearance: (payload) =>
    ipcRenderer.invoke('app:settings:save-floating-ball-appearance', payload),
  openRepository: () => ipcRenderer.invoke('app:external:open-repository'),
  openReleases: () => ipcRenderer.invoke('app:external:open-releases'),
  openIssues: () => ipcRenderer.invoke('app:external:open-issues'),
  getAppVersion: () => ipcRenderer.invoke('app:version:get'),
  setMasterPassword: (payload) => ipcRenderer.invoke('app:security:set-master-password', payload),
  verifyMasterPassword: (password) =>
    ipcRenderer.invoke('app:security:verify-master-password', password),
  getMasterPasswordLockStatus: () => ipcRenderer.invoke('app:security:get-lock-status')
});
