const { app, BrowserWindow, ipcMain, screen } = require('electron');
const path = require('path');

let mainWindow = null;
let widgetWindow = null;

// Keep a global reference of the window object
function createWindow() {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;

  // Create the main browser window
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
  });

  // Load the app
  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
    if (widgetWindow && !widgetWindow.isDestroyed()) {
      widgetWindow.close();
    }
  });
}

// Create the floating widget window
function createWidgetWindow() {
  if (widgetWindow && !widgetWindow.isDestroyed()) {
    widgetWindow.focus();
    return;
  }

  const { width, height } = screen.getPrimaryDisplay().workAreaSize;

  widgetWindow = new BrowserWindow({
    width: 200,
    height: 200,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    resizable: true,
    movable: true,
    hasShadow: false,
    skipTaskbar: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    // Position in bottom right corner
    x: width - 220,
    y: height - 220,
  });

  // Set the widget to ignore mouse events initially (click-through)
  // We'll toggle this based on user interaction
  widgetWindow.setIgnoreMouseEvents(false);

  // Load the widget view
  if (process.env.NODE_ENV === 'development') {
    widgetWindow.loadURL('http://localhost:5173/#/widget');
  } else {
    widgetWindow.loadFile(path.join(__dirname, '../dist/index.html'), {
      hash: 'widget'
    });
  }

  // Widget window event handlers
  widgetWindow.on('closed', () => {
    widgetWindow = null;
  });

  // Handle mouse enter/leave for hover effects
  widgetWindow.on('focus', () => {
    widgetWindow.webContents.send('widget-focused');
  });

  widgetWindow.on('blur', () => {
    widgetWindow.webContents.send('widget-blurred');
  });

  return widgetWindow;
}

// App event handlers
app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});

// IPC handlers for widget communication
ipcMain.handle('create-widget', () => {
  return createWidgetWindow() ? true : false;
});

ipcMain.handle('close-widget', () => {
  if (widgetWindow && !widgetWindow.isDestroyed()) {
    widgetWindow.close();
    return true;
  }
  return false;
});

ipcMain.handle('get-widget-status', () => {
  return widgetWindow && !widgetWindow.isDestroyed();
});

// Widget event relay - forward events from main window to widget
ipcMain.on('widget-event', (event, eventData) => {
  if (widgetWindow && !widgetWindow.isDestroyed()) {
    widgetWindow.webContents.send('hal-event', eventData);
  }
});

// Widget settings
ipcMain.on('widget-settings', (event, settings) => {
  if (widgetWindow && !widgetWindow.isDestroyed()) {
    // Apply settings like size, position, opacity
    if (settings.size) {
      widgetWindow.setSize(settings.size.width, settings.size.height);
    }
    if (settings.position) {
      widgetWindow.setPosition(settings.position.x, settings.position.y);
    }
    if (settings.opacity !== undefined) {
      widgetWindow.setOpacity(settings.opacity);
    }
    if (settings.clickThrough !== undefined) {
      widgetWindow.setIgnoreMouseEvents(settings.clickThrough);
    }
  }
});

// Security: Prevent new window creation
app.on('web-contents-created', (event, contents) => {
  contents.on('new-window', (event, navigationUrl) => {
    event.preventDefault();
  });
});