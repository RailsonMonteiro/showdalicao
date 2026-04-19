const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  clearQuestionsFile: () => ipcRenderer.invoke('questions:clear'),
  saveQuestionsFile: (questions) => ipcRenderer.invoke('questions:save', questions),
  getUpdaterState: () => ipcRenderer.invoke('updater:get-state'),
  checkForUpdates: () => ipcRenderer.invoke('updater:check'),
  downloadAndInstallUpdate: () => ipcRenderer.invoke('updater:download-install'),
  onUpdaterStateChange: (callback) => {
    const listener = (_event, state) => callback(state);
    ipcRenderer.on('updater:state', listener);
    return () => {
      ipcRenderer.removeListener('updater:state', listener);
    };
  }
});
