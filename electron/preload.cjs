const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  clearQuestionsFile: () => ipcRenderer.invoke('questions:clear'),
  saveQuestionsFile: (questions) => ipcRenderer.invoke('questions:save', questions)
});
