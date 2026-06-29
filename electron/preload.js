const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // Widget management
  createWidget: () => ipcRenderer.invoke('create-widget'),
  closeWidget: () => ipcRenderer.invoke('close-widget'),
  getWidgetStatus: () => ipcRenderer.invoke('get-widget-status'),

  // Event communication
  sendWidgetEvent: (eventData) => ipcRenderer.send('widget-event', eventData),
  onHalEvent: (callback) => ipcRenderer.on('hal-event', callback),
  removeHalEventListener: (callback) => ipcRenderer.removeListener('hal-event', callback),

  // Widget settings
  updateWidgetSettings: (settings) => ipcRenderer.send('widget-settings', settings),

  // Widget focus state
  onWidgetFocused: (callback) => ipcRenderer.on('widget-focused', callback),
  onWidgetBlurred: (callback) => ipcRenderer.on('widget-blurred', callback),

  // Utility
  isElectron: true,
  platform: process.platform,
  removeAllListeners: (channel) => ipcRenderer.removeAllListeners(channel),
});

// For the main window, also expose window controls
if (window.location.hash !== '#widget') {
  contextBridge.exposeInMainWorld('windowAPI', {
    minimize: () => ipcRenderer.send('minimize-window'),
    maximize: () => ipcRenderer.send('maximize-window'),
    close: () => ipcRenderer.send('close-window'),
  });
}