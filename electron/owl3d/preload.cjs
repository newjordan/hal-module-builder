'use strict';

const { contextBridge, ipcRenderer } = require('electron');

// Matches the Owl3dHost interface in src/owl3d/main.ts.
contextBridge.exposeInMainWorld('halOwl3d', {
  onSettings: callback => ipcRenderer.on('owl3d:settings', (_event, settings) => callback(settings)),
  onDemo: callback => ipcRenderer.on('owl3d:demo', () => callback()),
  update: patch => ipcRenderer.send('owl3d:update', patch),
  heard: text => ipcRenderer.send('owl3d:heard', text),
  onSpeak: callback => ipcRenderer.on('owl3d:speak', (_event, line) => callback(line)),
  spoken: id => ipcRenderer.send('owl3d:spoken', id),
});
