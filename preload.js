const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('tracker', {
  getVersion: () => ipcRenderer.invoke('app:version'),
  loadAccounts: () => ipcRenderer.invoke('accounts:load'),
  saveAccounts: (accounts) => ipcRenderer.invoke('accounts:save', accounts),
  lookup: (name) => ipcRenderer.invoke('tracker:lookup', name),
});
