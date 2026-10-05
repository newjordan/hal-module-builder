'use strict';

/**
 * HAL · Owl3D shell — an always-on stereo portal for the Owl3D Shift.
 *
 *   npm run owl3d       build, then run against dist/ on the hal://app origin
 *   npm run owl3d:dev   run against the Vite dev server (hot reload)
 *
 * The shell starts the HAL agent bridge (Codex + Claude Code sessions, every
 * workspace) unless one is already running, and can open HAL Studio and the
 * agent console in the same origin so studio edits reach the 3D eye live.
 * Child processes run on Electron's bundled Node, so no system Node is needed.
 */

const fs = require('node:fs');
const net = require('node:net');
const path = require('node:path');
const { spawn } = require('node:child_process');
const {
  app,
  BrowserWindow,
  Menu,
  Tray,
  globalShortcut,
  ipcMain,
  nativeImage,
  protocol,
  screen,
  shell,
} = require('electron');

const ROOT = path.resolve(__dirname, '..', '..');
const DIST = path.join(ROOT, 'dist');
const MODELS = path.join(ROOT, 'public', 'owl3d', 'models');
const DEV = process.argv.includes('--dev');
const DEV_PORT = 5173;
const BRIDGE_PORT = Number(process.env.HAL_BRIDGE_PORT || 8765);
const DISPLAY_MATCH = /owl\s*3d|shift/i;
const DEFAULTS = {
  mode: 'sbs',
  depth: 0.7,
  convergence: 0,
  swapEyes: false,
  squeeze: true,
  hud: true,
  displayId: null,
};
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.glb': 'model/gltf-binary',
  '.gltf': 'model/gltf+json',
  '.bin': 'application/octet-stream',
  '.woff2': 'font/woff2',
};

protocol.registerSchemesAsPrivileged([
  {
    scheme: 'hal',
    privileges: { standard: true, secure: true, supportFetchAPI: true, corsEnabled: true, stream: true },
  },
]);

let settings = { ...DEFAULTS };
let portal = null;
let tray = null;
let baseUrl = 'hal://app/';
const children = [];
const appWindows = new Map();

/* ----------------------------- settings ----------------------------- */

const settingsFile = () => path.join(app.getPath('userData'), 'owl3d-settings.json');

function loadSettings() {
  try {
    settings = { ...DEFAULTS, ...JSON.parse(fs.readFileSync(settingsFile(), 'utf8')) };
  } catch {
    settings = { ...DEFAULTS };
  }
  const mode = process.argv.find(arg => arg.startsWith('--mode='));
  if (mode) settings.mode = mode.endsWith('window') ? 'window' : 'sbs';
}

function saveSettings() {
  try {
    fs.mkdirSync(path.dirname(settingsFile()), { recursive: true });
    fs.writeFileSync(settingsFile(), JSON.stringify(settings, null, 2));
  } catch {
    /* settings are a convenience */
  }
}

function update(patch) {
  const placementChanged =
    (patch.mode && patch.mode !== settings.mode) ||
    ('displayId' in patch && patch.displayId !== settings.displayId);
  settings = { ...settings, ...patch };
  settings.depth = Math.min(2, Math.max(0, Number(settings.depth) || 0));
  settings.convergence = Math.min(8, Math.max(-8, Number(settings.convergence) || 0));
  saveSettings();
  if (placementChanged) placePortal();
  else sendSettings();
  rebuildTray();
}

function sendSettings() {
  if (portal && !portal.isDestroyed()) portal.webContents.send('owl3d:settings', settings);
}

/* ------------------------------ displays ----------------------------- */

function owlDisplay() {
  const displays = screen.getAllDisplays();
  return (
    displays.find(d => d.id === settings.displayId) ||
    displays.find(d => DISPLAY_MATCH.test(d.label || '')) ||
    screen.getPrimaryDisplay()
  );
}

/** The display for flat windows: anything that is not the 3D panel. */
function flatDisplay() {
  const owl = owlDisplay();
  return screen.getAllDisplays().find(d => d.id !== owl.id) || owl;
}

function placePortal() {
  if (!portal) return;
  const { bounds, workArea } = owlDisplay();
  if (settings.mode === 'sbs') {
    // The panel splits the whole signal into two eyes, so the portal must
    // own every pixel of the display, menu bar included.
    portal.setBounds(bounds);
    portal.setSimpleFullScreen(true);
    portal.setAlwaysOnTop(true, 'screen-saver');
  } else {
    portal.setSimpleFullScreen(false);
    const width = Math.round(workArea.width * 0.42);
    const height = Math.round(width * 0.62);
    portal.setBounds({
      x: workArea.x + workArea.width - width - 24,
      y: workArea.y + workArea.height - height - 24,
      width,
      height,
    });
    portal.setAlwaysOnTop(true, 'floating');
  }
  portal.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
  sendSettings();
}

/* ------------------------------ serving ------------------------------ */

function inside(base, file) {
  const relative = path.relative(base, file);
  return relative && !relative.startsWith('..') && !path.isAbsolute(relative);
}

function serveDist() {
  protocol.handle('hal', request => {
    const { pathname } = new URL(request.url);
    const route = decodeURIComponent(pathname);
    // Models come straight from public/ so a Blender export shows up without
    // a rebuild; everything else is the built app.
    const fromModels = route.startsWith('/owl3d/models/');
    const base = fromModels ? MODELS : DIST;
    let file = path.join(base, fromModels ? route.slice('/owl3d/models/'.length) : route);
    if (!inside(base, file)) return new Response('Forbidden', { status: 403 });
    let stat = fs.statSync(file, { throwIfNoEntry: false });
    if ((!stat || stat.isDirectory()) && !fromModels && !path.extname(route)) {
      file = path.join(DIST, 'index.html'); // client-side routes (/studio)
      stat = fs.statSync(file, { throwIfNoEntry: false });
    }
    if (!stat || !stat.isFile()) return new Response('Not found', { status: 404 });
    const headers = {
      'content-type': MIME[path.extname(file).toLowerCase()] || 'application/octet-stream',
      'content-length': String(stat.size),
      'last-modified': stat.mtime.toUTCString(),
      'cache-control': 'no-store',
    };
    const body = request.method === 'HEAD' ? null : fs.readFileSync(file);
    return new Response(body, { status: 200, headers });
  });
}

/* ------------------------------ children ----------------------------- */

function portOpen(port) {
  return new Promise(resolve => {
    const socket = net.connect({ host: '127.0.0.1', port });
    socket.once('connect', () => {
      socket.destroy();
      resolve(true);
    });
    socket.once('error', () => resolve(false));
  });
}

async function waitForPort(port, timeoutMs) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (await portOpen(port)) return true;
    await new Promise(resolve => setTimeout(resolve, 250));
  }
  return false;
}

function runNode(label, script, args, env) {
  const child = spawn(process.execPath, [script, ...args], {
    cwd: ROOT,
    env: { ...process.env, ...env, ELECTRON_RUN_AS_NODE: '1' },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  const log = chunk => process.stdout.write(`[${label}] ${chunk}`);
  child.stdout.on('data', log);
  child.stderr.on('data', log);
  children.push(child);
  return child;
}

async function startBridge() {
  if (await portOpen(BRIDGE_PORT)) {
    console.log(`[owl3d] using the HAL bridge already on :${BRIDGE_PORT}`);
    return;
  }
  runNode('bridge', path.join(ROOT, 'scripts', 'agent-bridge.mjs'), [], {
    HAL_WORKSPACE: process.env.HAL_WORKSPACE || '*',
    HAL_BRIDGE_PORT: String(BRIDGE_PORT),
  });
}

async function startViteIfNeeded() {
  if (await portOpen(DEV_PORT)) return;
  runNode('vite', path.join(ROOT, 'node_modules', 'vite', 'bin', 'vite.js'), ['--port', String(DEV_PORT), '--strictPort'], {
    VITE_HAL_AGENT_WS_URL: `ws://127.0.0.1:${BRIDGE_PORT}/hal-agent-events`,
  });
  if (!(await waitForPort(DEV_PORT, 30_000))) throw new Error('Vite dev server did not start');
}

/* ------------------------------ windows ------------------------------ */

function createPortal() {
  const display = owlDisplay();
  portal = new BrowserWindow({
    ...display.bounds,
    frame: false,
    show: false,
    backgroundColor: '#030406',
    hasShadow: false,
    fullscreenable: false,
    roundedCorners: false,
    title: 'HAL · Owl3D',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      backgroundThrottling: false,
    },
  });
  portal.loadURL(`${baseUrl}owl3d.html`);
  portal.webContents.on('did-finish-load', sendSettings);
  // Debug aid: OWL3D_SNAPSHOT=/path/to.png saves what the portal shows once
  // it has settled (OWL3D_SNAPSHOT_DELAY ms, default 12000), then quits.
  if (process.env.OWL3D_SNAPSHOT) {
    portal.webContents.once('did-finish-load', () =>
      setTimeout(async () => {
        const image = await portal.webContents.capturePage();
        fs.writeFileSync(process.env.OWL3D_SNAPSHOT, image.toPNG());
        console.log(`[owl3d] snapshot saved to ${process.env.OWL3D_SNAPSHOT}`);
        app.quit();
      }, Number(process.env.OWL3D_SNAPSHOT_DELAY || 12000))
    );
  }
  portal.once('ready-to-show', () => {
    placePortal();
    portal.showInactive();
  });
  portal.on('closed', () => {
    portal = null;
  });
}

function openAppWindow(route, title) {
  const existing = appWindows.get(route);
  if (existing && !existing.isDestroyed()) {
    existing.show();
    existing.focus();
    return;
  }
  const { workArea } = flatDisplay();
  const win = new BrowserWindow({
    x: workArea.x + 40,
    y: workArea.y + 40,
    width: Math.min(1500, workArea.width - 80),
    height: Math.min(950, workArea.height - 80),
    title,
    backgroundColor: '#07090b',
  });
  win.loadURL(`${baseUrl}${route}`);
  appWindows.set(route, win);
}

/* -------------------------------- tray ------------------------------- */

function trayIcon() {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32">
    <circle cx="16" cy="16" r="14" fill="#1b1d22" stroke="#7a808c" stroke-width="2"/>
    <circle cx="16" cy="16" r="8" fill="#c81400"/><circle cx="16" cy="16" r="3" fill="#ffd27a"/></svg>`;
  const image = nativeImage.createFromDataURL(`data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`);
  return image.isEmpty() ? image : image.resize({ width: 18, height: 18 });
}

function rebuildTray() {
  if (!tray) return;
  const current = owlDisplay();
  const toggle = (label, key) => ({
    label,
    type: 'checkbox',
    checked: Boolean(settings[key]),
    click: () => update({ [key]: !settings[key] }),
  });
  tray.setContextMenu(
    Menu.buildFromTemplate([
      { label: 'HAL · Owl3D', enabled: false },
      { type: 'separator' },
      {
        label: 'Stereo 3D (full-screen SBS)',
        type: 'radio',
        checked: settings.mode === 'sbs',
        click: () => update({ mode: 'sbs' }),
      },
      {
        label: 'Floating window (2D)',
        type: 'radio',
        checked: settings.mode === 'window',
        click: () => update({ mode: 'window' }),
      },
      { type: 'separator' },
      toggle('Swap eyes', 'swapEyes'),
      toggle('Anamorphic halves', 'squeeze'),
      toggle('Show HUD', 'hud'),
      {
        label: 'Depth',
        submenu: [0.3, 0.5, 0.7, 1, 1.3].map(depth => ({
          label: `${Math.round(depth * 100)}%`,
          type: 'radio',
          checked: Math.abs(settings.depth - depth) < 0.01,
          click: () => update({ depth }),
        })),
      },
      {
        label: '3D display',
        submenu: screen.getAllDisplays().map(d => ({
          label: `${d.label || `Display ${d.id}`} (${d.size.width}×${d.size.height})`,
          type: 'radio',
          checked: d.id === current.id,
          click: () => update({ displayId: d.id }),
        })),
      },
      { type: 'separator' },
      { label: 'Open HAL Studio', click: () => openAppWindow('studio', 'HAL Studio') },
      { label: 'Open Agent Console', click: () => openAppWindow('', 'HAL Agent Console') },
      { label: 'Open Models Folder', click: () => shell.openPath(MODELS) },
      { label: 'Play Demo Shift', click: () => portal?.webContents.send('owl3d:demo') },
      { label: 'Reload Portal', click: () => portal?.webContents.reload() },
      { type: 'separator' },
      { label: 'Quit', accelerator: 'Command+Q', click: () => app.quit() },
    ])
  );
}

/* ------------------------------- boot -------------------------------- */

ipcMain.on('owl3d:update', (_event, patch) => {
  if (patch && typeof patch === 'object') update(patch);
});

app.whenReady().then(async () => {
  if (process.platform === 'darwin') app.dock.hide();
  loadSettings();
  await startBridge();
  if (DEV) {
    await startViteIfNeeded();
    baseUrl = `http://localhost:${DEV_PORT}/`;
  } else {
    if (!fs.existsSync(path.join(DIST, 'owl3d.html'))) {
      console.error('[owl3d] dist/owl3d.html is missing; run `npm run owl3d` (it builds first).');
      app.exit(1);
      return;
    }
    serveDist();
  }
  createPortal();
  tray = new Tray(trayIcon());
  tray.setToolTip('HAL · Owl3D');
  rebuildTray();
  globalShortcut.register('CommandOrControl+Alt+H', () =>
    update({ mode: settings.mode === 'sbs' ? 'window' : 'sbs' })
  );
  for (const change of ['display-added', 'display-removed', 'display-metrics-changed']) {
    screen.on(change, () => {
      placePortal();
      rebuildTray();
    });
  }
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
  for (const child of children) child.kill();
});

// Closing Studio/Console windows must not quit the always-on portal.
app.on('window-all-closed', () => {
  if (!portal) app.quit();
});
