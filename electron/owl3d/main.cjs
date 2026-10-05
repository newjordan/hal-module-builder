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
const os = require('node:os');
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
  net: electronNet,
  protocol,
  screen,
  shell,
  systemPreferences,
} = require('electron');

const ROOT = path.resolve(__dirname, '..', '..');
const DIST = path.join(ROOT, 'dist');
const MODELS = path.join(ROOT, 'public', 'owl3d', 'models');
// Hugging Face files (Whisper) fetched once through hal://app/hf/ and kept.
const HF_CACHE = path.join(os.homedir(), '.hal', 'models');
const DEV = process.argv.includes('--dev');
const DEV_PORT = 5173;
const BRIDGE_PORT = Number(process.env.HAL_BRIDGE_PORT || 8765);
const DISPLAY_MATCH = /owl\s*3d|shift/i;
const DEFAULTS = {
  mode: 'sbs',
  depth: 0.5,
  convergence: 0,
  swapEyes: false,
  squeeze: true,
  hud: true,
  displayId: null,
  voice: true,
  // Push-to-talk unless this is on.
  handsFree: false,
  micLabel: '',
  // 'remote:<id>' plays HAL's voice on a Tailscale speaker (remote-audio.json).
  speaker: '',
  // Off so Owl3D's Stereo 3D Playback can present its woven output on top.
  stereoOnTop: false,
};

// Voice link (see scripts/hal-voice.mjs): what you say is appended to the
// inbox for a connected agent session; lines appended to the outbox are
// spoken by HAL through the speakers.
const VOICE_DIR = process.env.HAL_VOICE_DIR || path.join(os.homedir(), '.hal', 'voice');
const INBOX = path.join(VOICE_DIR, 'inbox.jsonl');
const OUTBOX = path.join(VOICE_DIR, 'outbox.jsonl');
const VOICE_NAME = process.env.HAL_VOICE || 'Daniel';
const VOICE_RATE = Number(process.env.HAL_VOICE_RATE || 172);
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.wasm': 'application/wasm',
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
  if (mode) settings.mode = mode.endsWith('window') ? 'window' : mode.endsWith('full') ? 'full' : 'sbs';
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
  if (patch.voice && !settings.voice) void ensureMicrophone();
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
  if (settings.mode === 'sbs' || settings.mode === 'full') {
    // The panel splits the whole signal into two eyes, so the portal must
    // own every pixel of the display, menu bar included.
    portal.setBounds(bounds);
    portal.setSimpleFullScreen(true);
    portal.setAlwaysOnTop(Boolean(settings.stereoOnTop), 'screen-saver');
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

/**
 * transformers.js file cache on disk: GET answers from ~/.hal/models (404 on
 * a miss), PUT stores what was downloaded. Keys are Hugging Face hub URLs.
 */
async function huggingFaceCache(request) {
  const key = new URL(request.url).searchParams.get('key') || '';
  let hub;
  try {
    hub = new URL(key);
  } catch {
    return new Response('Bad key', { status: 400 });
  }
  if (hub.protocol !== 'https:' || !/^(huggingface\.co|hf\.co)$/.test(hub.hostname)) {
    return new Response('Forbidden', { status: 403 });
  }
  const file = path.join(HF_CACHE, decodeURIComponent(hub.pathname));
  if (!inside(HF_CACHE, file)) return new Response('Forbidden', { status: 403 });
  if (request.method === 'PUT') {
    const data = Buffer.from(await request.arrayBuffer());
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(`${file}.part`, data);
    fs.renameSync(`${file}.part`, file);
    return new Response(null, { status: 204 });
  }
  if (!fs.existsSync(file)) return new Response('Not cached', { status: 404 });
  const data = fs.readFileSync(file);
  const type = MIME[path.extname(file).toLowerCase()] || 'application/octet-stream';
  return new Response(data, { headers: { 'content-type': type, 'content-length': String(data.length) } });
}

function serveDist() {
  protocol.handle('hal', request => {
    const { pathname } = new URL(request.url);
    const route = decodeURIComponent(pathname);
    if (route === '/hf-cache') {
      return huggingFaceCache(request).catch(error => {
        console.warn(`[owl3d] model cache: ${error.message || error}`);
        return new Response(String(error.message || error), { status: 500 });
      });
    }
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
  // Surface the portal's own status lines and any errors in this terminal.
  portal.webContents.on('console-message', event => {
    if (event.level === 'error' || event.level === 'warning' || /^\[owl3d\]/.test(event.message)) {
      console.log(`[portal] ${event.message.slice(0, 400)}`);
    }
  });
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
        label: 'Full Screen 2D (for Owl3D Live 3D)',
        type: 'radio',
        checked: settings.mode === 'full',
        accelerator: 'Command+Alt+F',
        click: () => update({ mode: 'full' }),
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
      toggle('Keep Stereo on Top', 'stereoOnTop'),
      { label: 'Talk to HAL (start / send)', accelerator: 'Command+Alt+.', click: pushToTalk },
      toggle('Voice', 'voice'),
      {
        label: 'Microphone',
        submenu: [
          {
            label: 'System Default',
            type: 'radio',
            checked: !settings.micLabel,
            click: () => update({ micLabel: '' }),
          },
          ...mics.map(label => ({
            label,
            type: 'radio',
            checked: settings.micLabel === label,
            click: () => update({ micLabel: label }),
          })),
          ...remoteAudio().mics.map(mic => ({
            label: `${mic.label || mic.id} (Tailscale)`,
            type: 'radio',
            checked: settings.micLabel === `remote:${mic.id}`,
            click: () => update({ micLabel: `remote:${mic.id}` }),
          })),
        ],
      },
      {
        label: 'Speaker',
        submenu: [
          {
            label: 'This Mac',
            type: 'radio',
            checked: !settings.speaker,
            click: () => update({ speaker: '' }),
          },
          ...remoteAudio().speakers.map(speaker => ({
            label: `${speaker.label || speaker.id} (Tailscale)`,
            type: 'radio',
            checked: settings.speaker === `remote:${speaker.id}`,
            click: () => update({ speaker: `remote:${speaker.id}` }),
          })),
        ],
      },
      { ...toggle('Hands-free Listening', 'handsFree'), accelerator: 'Command+Alt+M' },
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
      { label: 'Open Voice Folder', click: () => shell.openPath(VOICE_DIR) },
      { label: 'Play Demo Shift', click: () => portal?.webContents.send('owl3d:demo') },
      { label: 'Reload Portal', click: () => portal?.webContents.reload() },
      { type: 'separator' },
      { label: 'Quit', accelerator: 'Command+Q', click: () => app.quit() },
    ])
  );
}

/* ------------------------------- voice ------------------------------- */

function pushToTalk() {
  if (!settings.voice) update({ voice: true });
  portal?.webContents.send('owl3d:push-to-talk');
}

async function ensureMicrophone() {
  if (process.platform !== 'darwin') return true;
  const status = systemPreferences.getMediaAccessStatus('microphone');
  if (status === 'granted') return true;
  if (status === 'not-determined') return systemPreferences.askForMediaAccess('microphone');
  console.warn(`[owl3d] microphone access is ${status}; allow it in System Settings → Privacy & Security → Microphone`);
  return false;
}

function voiceLine(text, extra = {}) {
  return {
    id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
    at: new Date().toISOString(),
    text,
    ...extra,
  };
}

function appendInbox(text) {
  fs.mkdirSync(VOICE_DIR, { recursive: true });
  fs.appendFileSync(INBOX, `${JSON.stringify(voiceLine(text, { source: 'owl3d-mic' }))}\n`);
}

/** Render a line with macOS `say` to 22 kHz WAV bytes. */
function synthesize(text) {
  return new Promise((resolve, reject) => {
    const file = path.join(os.tmpdir(), `hal-say-${process.pid}-${Date.now()}.wav`);
    const child = spawn('say', [
      '-v', VOICE_NAME,
      '-r', String(VOICE_RATE),
      '-o', file,
      '--file-format=WAVE',
      '--data-format=LEI16@22050',
      '-f', '-',
    ]);
    child.on('error', reject);
    child.on('exit', code => {
      try {
        if (code !== 0) throw new Error(`say exited with ${code}`);
        const audio = fs.readFileSync(file);
        resolve(audio);
      } catch (error) {
        reject(error);
      } finally {
        fs.rmSync(file, { force: true });
      }
    });
    child.stdin.end(text);
  });
}

/* ---------------------------- remote audio ---------------------------- */

// Mics and speakers on other machines (Tailscale), each a small service that
// streams raw PCM: see docs/owl3d.md. Read fresh each time, so edits apply.
const REMOTE_AUDIO = path.join(VOICE_DIR, 'remote-audio.json');

function remoteAudio() {
  try {
    const config = JSON.parse(fs.readFileSync(REMOTE_AUDIO, 'utf8'));
    const valid = entry =>
      entry && typeof entry.id === 'string' && typeof entry.host === 'string' && Number.isInteger(entry.port);
    return {
      mics: Array.isArray(config.mics) ? config.mics.filter(valid) : [],
      speakers: Array.isArray(config.speakers) ? config.speakers.filter(valid) : [],
    };
  } catch {
    return { mics: [], speakers: [] };
  }
}

function remoteSpeaker() {
  if (!settings.speaker?.startsWith('remote:')) return null;
  const id = settings.speaker.slice('remote:'.length);
  return remoteAudio().speakers.find(speaker => speaker.id === id) ?? null;
}

/** The sample data of a 16-bit mono WAV file. */
function wavSamples(wav) {
  for (let i = 12; i + 8 <= wav.length; ) {
    const id = wav.toString('ascii', i, i + 4);
    const size = wav.readUInt32LE(i + 4);
    if (id === 'data') return wav.subarray(i + 8, i + 8 + size);
    i += 8 + size + (size & 1);
  }
  return wav.subarray(44);
}

/** Mono s16 → stereo s16, panned (-1 left … 1 right, constant power). */
function panStereo(mono, pan = 0) {
  const angle = ((Math.max(-1, Math.min(1, pan)) + 1) * Math.PI) / 4;
  const left = Math.cos(angle);
  const right = Math.sin(angle);
  const count = Math.floor(mono.length / 2);
  const out = Buffer.alloc(count * 4);
  for (let i = 0; i < count; i++) {
    const sample = mono.readInt16LE(i * 2);
    out.writeInt16LE(Math.round(sample * left), i * 4);
    out.writeInt16LE(Math.round(sample * right), i * 4 + 2);
  }
  return out;
}

/** Play 22.05 kHz stereo PCM on a remote speaker; resolves when it is done. */
function playRemote(speaker, stereo) {
  return new Promise(resolve => {
    const socket = net.connect({ host: speaker.host, port: speaker.port });
    socket.setNoDelay(true);
    socket.on('connect', () => socket.end(stereo));
    socket.on('error', error => {
      console.warn(`[owl3d] speaker ${speaker.id}: ${error.message}`);
      resolve();
    });
    socket.on('close', resolve);
    socket.resume();
  });
}

/** The portal's sound cues, rendered here for a remote speaker. */
const CUES = {
  start: [
    [660, 0, 0.07],
    [990, 0.08, 0.09],
  ],
  send: [
    [880, 0, 0.07],
    [560, 0.08, 0.11],
  ],
  cancel: [[330, 0, 0.09]],
  error: [
    [196, 0, 0.12],
    [196, 0.17, 0.12],
  ],
};

function cuePcm(kind) {
  const notes = CUES[kind];
  if (!notes) return null;
  const rate = 22050;
  const end = Math.max(...notes.map(([, at, length]) => at + length)) + 0.03;
  const mono = Buffer.alloc(Math.ceil(end * rate) * 2);
  const volume = kind === 'error' ? 0.18 : 0.22;
  for (const [frequency, at, length] of notes) {
    const from = Math.floor(at * rate);
    const count = Math.floor(length * rate);
    for (let i = 0; i < count; i++) {
      const t = i / rate;
      const envelope = Math.min(1, t / 0.01) * Math.exp(-5 * (t / length));
      const wave = kind === 'error' ? Math.sign(Math.sin(2 * Math.PI * frequency * t)) : Math.sin(2 * Math.PI * frequency * t);
      const index = (from + i) * 2;
      const mixed = mono.readInt16LE(index) + wave * envelope * volume * 32767;
      mono.writeInt16LE(Math.max(-32768, Math.min(32767, Math.round(mixed))), index);
    }
  }
  return mono;
}

ipcMain.on('owl3d:cue', (_event, kind) => {
  const speaker = remoteSpeaker();
  const mono = typeof kind === 'string' ? cuePcm(kind) : null;
  if (speaker && mono) void playRemote(speaker, panStereo(mono, speaker.pan ?? 0));
});

// A network mic: one TCP stream at a time, raw 16 kHz mono s16 to the portal.
let remoteMicSocket = null;
ipcMain.on('owl3d:remote-mic', (_event, request) => {
  remoteMicSocket?.destroy();
  remoteMicSocket = null;
  if (!request?.on) return;
  const mic = remoteAudio().mics.find(entry => entry.id === request.id);
  if (!mic) {
    portal?.webContents.send('owl3d:remote-mic-closed', { id: request.id, error: 'not in remote-audio.json' });
    return;
  }
  const socket = net.connect({ host: mic.host, port: mic.port });
  remoteMicSocket = socket;
  socket.setNoDelay(true);
  let odd = null;
  socket.on('data', chunk => {
    let data = odd ? Buffer.concat([odd, chunk]) : chunk;
    odd = data.length % 2 ? data.subarray(data.length - 1) : null;
    if (odd) data = data.subarray(0, data.length - 1);
    if (data.length && portal && !portal.isDestroyed()) portal.webContents.send('owl3d:remote-mic-data', data);
  });
  socket.on('error', error => console.warn(`[owl3d] mic ${mic.id}: ${error.message}`));
  socket.on('close', () => {
    // Stopped or replaced on purpose: nothing to report.
    if (remoteMicSocket !== socket) return;
    remoteMicSocket = null;
    if (portal && !portal.isDestroyed()) portal.webContents.send('owl3d:remote-mic-closed', { id: mic.id });
  });
});

const speechQueue = [];
const spokenWaiters = new Map();
let speechBusy = false;

async function pumpSpeech() {
  if (speechBusy) return;
  const line = speechQueue.shift();
  if (!line) return;
  speechBusy = true;
  console.log(`[owl3d] say: ${line.text.slice(0, 60)}`);
  try {
    if (portal && !portal.isDestroyed()) {
      const audio = await synthesize(line.text);
      const seconds = Math.max(0, audio.length - 44) / (22050 * 2);
      const speaker = remoteSpeaker();
      // On a remote speaker the portal still plays the line, silently, so
      // HAL's eye and the ceiling move with its voice; it starts a beat
      // later to line up with the network and the remote player.
      const played = speaker ? playRemote(speaker, panStereo(wavSamples(audio), speaker.pan ?? 0)) : null;
      if (speaker) await new Promise(resolve => setTimeout(resolve, 140));
      await new Promise(resolve => {
        spokenWaiters.set(line.id, resolve);
        setTimeout(resolve, seconds * 1000 + 5000);
        portal.webContents.send('owl3d:speak', { ...line, audio, muted: Boolean(speaker) });
      });
      spokenWaiters.delete(line.id);
      if (played) await played;
    } else {
      // No portal to animate: just talk.
      await new Promise(resolve => {
        const child = spawn('say', ['-v', VOICE_NAME, '-r', String(VOICE_RATE), '-f', '-']);
        child.on('exit', resolve);
        child.on('error', resolve);
        child.stdin.end(line.text);
      });
    }
  } catch (error) {
    console.error(`[owl3d] speech failed: ${error.message}`);
  }
  speechBusy = false;
  void pumpSpeech();
}

/** Follow the outbox from its current end; each new line is spoken. */
function watchOutbox() {
  fs.mkdirSync(VOICE_DIR, { recursive: true });
  let offset = fs.existsSync(OUTBOX) ? fs.statSync(OUTBOX).size : 0;
  let carry = '';
  setInterval(() => {
    let size;
    try {
      size = fs.statSync(OUTBOX).size;
    } catch {
      return;
    }
    if (size < offset) {
      offset = 0;
      carry = '';
    }
    if (size === offset) return;
    const buffer = Buffer.alloc(size - offset);
    const fd = fs.openSync(OUTBOX, 'r');
    try {
      fs.readSync(fd, buffer, 0, buffer.length, offset);
    } finally {
      fs.closeSync(fd);
    }
    offset = size;
    const lines = (carry + buffer.toString('utf8')).split('\n');
    carry = lines.pop() || '';
    for (const raw of lines) {
      try {
        const line = JSON.parse(raw);
        const text = typeof line.text === 'string' ? line.text.trim().slice(0, 2000) : '';
        if (!text) continue;
        speechQueue.push({
          id: String(line.id || voiceLine(text).id),
          text,
          ...(typeof line.agentId === 'string' ? { agentId: line.agentId } : {}),
        });
      } catch {
        /* a half-written or foreign line */
      }
    }
    void pumpSpeech();
  }, 250);
}

ipcMain.on('owl3d:heard', (_event, text) => {
  if (typeof text !== 'string' || !text.trim() || text.length > 2000) return;
  appendInbox(text.trim());
  console.log(`[owl3d] heard: ${text.trim()}`);
});

ipcMain.on('owl3d:spoken', (_event, id) => {
  spokenWaiters.get(id)?.();
});

// The portal reports the Mac's microphones; the menu lists them.
let mics = [];
ipcMain.on('owl3d:mics', (_event, list) => {
  if (!Array.isArray(list)) return;
  mics = list.filter(label => typeof label === 'string' && label).slice(0, 20);
  rebuildTray();
});

ipcMain.on('owl3d:stop-speaking', () => {
  speechQueue.length = 0;
  spokenWaiters.forEach(resolve => resolve());
});

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
  watchOutbox();
  if (settings.voice) await ensureMicrophone();
  createPortal();
  tray = new Tray(trayIcon());
  tray.setToolTip('HAL · Owl3D');
  rebuildTray();
  globalShortcut.register('CommandOrControl+Alt+H', () =>
    update({ mode: settings.mode === 'sbs' ? 'window' : 'sbs' })
  );
  globalShortcut.register('CommandOrControl+Alt+F', () =>
    update({ mode: settings.mode === 'full' ? 'window' : 'full' })
  );
  globalShortcut.register('CommandOrControl+Alt+M', () =>
    update({ voice: true, handsFree: !settings.handsFree })
  );
  if (!globalShortcut.register('CommandOrControl+Alt+.', pushToTalk)) {
    console.warn('[owl3d] ⌘⌥. is taken by another app; use the ● button or . in the portal');
  }
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
