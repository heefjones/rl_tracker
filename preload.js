const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('tracker', {
  loadAccounts: () => ipcRenderer.invoke('accounts:load'),
  saveAccounts: (accounts) => ipcRenderer.invoke('accounts:save', accounts),
  lookup: (name) => ipcRenderer.invoke('tracker:lookup', name),
});
