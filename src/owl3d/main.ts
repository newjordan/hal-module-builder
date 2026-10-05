import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { DEFAULT_HAL_LAYERS } from '../config/defaultHalDesign';
import {
  Bot,
  HOME_ID,
  HOME_IDENTITY,
  type PortalEvent,
  type Station,
} from './bot';
import {
  D,
  DEFAULT_SETTINGS,
  EYE_SEPARATION,
  H,
  MAX_BOTS,
  STALE_AGENT_SECONDS,
  STATE_COLORS,
  W,
  type PortalSettings,
} from './config';
import { runDemo } from './demo';
import { setEyeRenderer } from './eye';
import { bridgeUrl, connectAgentEvents, type ConnectionLabel } from './events';
import { particles } from './fx';
import { Caption, Hud } from './hud';
import {
  DESIGN_STORAGE_KEY,
  planEye,
  readStoredDesign,
  type EyePart,
} from './layerPlan';
import { ModelInstance, modelLibrary } from './models';
import { updateBlocks } from './plot';
import { Desk, Hatch } from './station';
import { clock, scene } from './stage';
import { VoiceDock } from './voice/dock';
import { Voice, type VoiceState } from './voice/voice';
import { buildRoom, createDust, gridUniforms } from './world';

/* Host API from the Electron shell (electron/owl3d/preload.cjs). */
interface SpokenLine {
  id: string;
  text: string;
  agentId?: string;
  audio: Uint8Array;
}
interface Owl3dHost {
  onSettings(callback: (settings: Partial<PortalSettings>) => void): void;
  onDemo(callback: () => void): void;
  /** ⌘⌥. from anywhere: start or send a recording. */
  onPushToTalk?(callback: () => void): void;
  update(patch: Partial<PortalSettings>): void;
  /** What you said, for the connected agent session's inbox. */
  heard?(text: string): void;
  /** HAL's lines from the outbox, rendered to speech by the shell. */
  onSpeak?(callback: (line: SpokenLine) => void): void;
  spoken?(id: string): void;
  /** Drop HAL's queued lines. */
  stopSpeaking?(): void;
}
declare global {
  interface Window {
    halOwl3d?: Owl3dHost;
  }
}

const SETTINGS_KEY = 'hal-owl3d-settings';
const host = window.halOwl3d;

/* ----------------------------- renderer ----------------------------- */

const canvas = document.getElementById('owl3d-view') as HTMLCanvasElement;
const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  powerPreference: 'high-performance',
});
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight, false);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.15;
setEyeRenderer(renderer);

const environment = new THREE.PMREMGenerator(renderer);
scene.environment = environment.fromScene(new RoomEnvironment(), 0.04).texture;
scene.environmentIntensity = 0.35;
scene.add(new THREE.HemisphereLight(0x8090a0, 0x050608, 0.35));

const camera = new THREE.PerspectiveCamera(
  30,
  window.innerWidth / window.innerHeight,
  0.5,
  140
);
camera.position.set(0, 0, D);
const stereo = new THREE.StereoCamera();

buildRoom();
// Built after models load so they use the Blender kit; see rebuildStation().
const station: Station = { desk: new Desk(), hatch: new Hatch() };
const updateDust = createDust();
const hud = new Hud();
const caption = new Caption();
const voice = new Voice();
/**
 * Push-to-talk, shared by the ● button, the . key and ⌘⌥.: hold to talk and
 * release to send, or tap to start and tap again to send.
 */
const pushToTalk = {
  pressedAt: 0,
  down(): void {
    if (voice.recording) {
      voice.endRecording();
      return;
    }
    this.pressedAt = performance.now();
    host?.stopSpeaking?.();
    void voice.beginRecording();
  },
  up(): void {
    // A quick tap latches; a hold sends on release.
    if (voice.recording && performance.now() - this.pressedAt > 300)
      voice.endRecording();
  },
  toggle(): void {
    if (voice.recording) voice.endRecording();
    else {
      host?.stopSpeaking?.();
      void voice.beginRecording();
    }
  },
};

const dock = new VoiceDock({
  onRecordDown: () => pushToTalk.down(),
  onRecordUp: () => pushToTalk.up(),
  onHandsFree: () =>
    updateSettings({ voice: true, handsFree: !settings.handsFree }),
  onStop: () => {
    voice.interrupt();
    host?.stopSpeaking?.();
  },
});
dock.render(voice.state, voice.detail, false);

// In stereo the pointer hides after a moment; any movement brings it back.
let pointerTimer = 0;
function wakePointer(): void {
  document.body.classList.remove('pointer-idle');
  window.clearTimeout(pointerTimer);
  pointerTimer = window.setTimeout(
    () => document.body.classList.add('pointer-idle'),
    2500
  );
}
window.addEventListener('mousemove', wakePointer);
wakePointer();

/* ----------------------------- settings ----------------------------- */

function loadSettings(): PortalSettings {
  try {
    const stored: unknown = JSON.parse(
      localStorage.getItem(SETTINGS_KEY) ?? '{}'
    );
    const mode = new URLSearchParams(window.location.search).get('mode');
    return {
      ...DEFAULT_SETTINGS,
      ...(typeof stored === 'object' && stored ? stored : {}),
      ...(mode === 'sbs' || mode === 'window' ? { mode } : {}),
    };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

let settings = loadSettings();

function applySettings(next: Partial<PortalSettings>): void {
  settings = { ...settings, ...next };
  document.body.dataset.mode = settings.mode;
  hud.mesh.visible = settings.hud;
  hud.touch();
  dock.layout(settings.mode, settings.squeeze);
  dock.render(voice.state, voice.detail, settings.handsFree);
  if (settings.voice) void voice.enable(settings.handsFree);
  else if (voice.state !== 'off') voice.disable();
}

function updateSettings(patch: Partial<PortalSettings>): void {
  if (host) {
    host.update(patch); // the shell owns window placement and echoes back
    return;
  }
  applySettings(patch);
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch {
    /* settings are a convenience */
  }
}
applySettings(settings);

/* ------------------------------ design ------------------------------ */

let design: EyePart[] = planEye(
  readStoredDesign(window.localStorage) ?? DEFAULT_HAL_LAYERS
);

// The studio saves 'hal-layers' as you edit; in the Electron shell the studio
// window shares this origin, so edits land in the 3D eye live.
window.addEventListener('storage', event => {
  if (event.key !== DESIGN_STORAGE_KEY && event.key !== null) return;
  design = planEye(readStoredDesign(window.localStorage) ?? DEFAULT_HAL_LAYERS);
  for (const bot of allBots()) bot.setDesign(design);
  hud.setNotice('Eye design updated from HAL Studio');
  window.setTimeout(() => hud.setNotice(''), 4000);
});

/* ------------------------------ agents ------------------------------ */

const bots = new Map<string, Bot>();
const departing = new Set<Bot>();
bots.set(HOME_ID, new Bot(0, design, station));

function allBots(): Bot[] {
  return [...bots.values(), ...departing];
}

function freeSlot(): number {
  const used = new Set(allBots().map(bot => bot.slot));
  for (let i = 0; i < MAX_BOTS; i++) if (!used.has(i)) return i;
  return -1;
}

function botFor(event: PortalEvent): Bot | null {
  const existing = bots.get(event.agentId);
  if (existing) return existing;
  // Never spawn for status chatter or old history.
  if (event.state === 'offline' || event.kind === 'system') return null;
  if (
    event.replay &&
    Date.now() - (event.timestamp ?? 0) > STALE_AGENT_SECONDS * 1000
  )
    return null;
  const identity = event.agent
    ? { ...event.agent, id: event.agentId }
    : { id: event.agentId, name: event.agentId };
  const home = bots.get(HOME_ID);
  if (home) {
    // HAL embodies the first real agent rather than standing beside it.
    bots.delete(HOME_ID);
    home.bind(identity);
    bots.set(event.agentId, home);
    return home;
  }
  const slot = freeSlot();
  if (slot < 0) return null;
  const bot = new Bot(slot, design, station, identity);
  bots.set(event.agentId, bot);
  return bot;
}

function retire(bot: Bot): void {
  bots.delete(bot.id);
  if (!bots.size) {
    // The last agent left: HAL stays home.
    bot.goHome();
    bots.set(HOME_ID, bot);
    return;
  }
  bot.depart();
  departing.add(bot);
}

function handleEvent(event: PortalEvent): void {
  const bot = botFor(event);
  if (!bot) return;
  if (event.state === 'offline') {
    retire(bot);
    hud.touch();
    return;
  }
  bot.apply(event);
  hud.push(event, bot);
}

let connection: ConnectionLabel = 'connecting';
connectAgentEvents({
  url: bridgeUrl(),
  onEvent: handleEvent,
  onConnection: state => {
    connection = state;
    hud.touch();
  },
});

function demo(): void {
  const bot = bots.values().next().value as Bot | undefined;
  if (bot) runDemo(bot.id, handleEvent);
}

/* ------------------------------ models ------------------------------ */

let worldModels: ModelInstance[] = [];

modelLibrary.addEventListener('change', () => {
  worldModels.forEach(model => model.dispose());
  worldModels = modelLibrary.forSocket('world').map(loaded => {
    const instance = new ModelInstance(loaded);
    scene.add(instance.root);
    return instance;
  });
  station.desk.dispose();
  station.hatch.dispose();
  station.desk = new Desk();
  station.hatch = new Hatch();
  for (const bot of allBots()) bot.attachModels();
  const count = modelLibrary.models.length;
  hud.setNotice(
    modelLibrary.errors.length
      ? `Models: ${modelLibrary.errors[0]}`
      : count
        ? `${count} Blender model${count === 1 ? '' : 's'} loaded`
        : ''
  );
});
void modelLibrary.load().then(() => modelLibrary.watch());

/* ------------------------------ controls ----------------------------- */

if (host) {
  host.onSettings(applySettings);
  host.onDemo(demo);
  host.onPushToTalk?.(() => pushToTalk.toggle());
}

/* ------------------------------- voice ------------------------------- */

const VOICE_LABELS: Record<VoiceState, [string, number]> = {
  off: ['VOICE OFF', 0x56616b],
  loading: ['VOICE LOADING', 0xf2b84b],
  ready: ['PUSH TO TALK · HOLD . OR ●', 0x62d995],
  recording: ['● RECORDING', 0xff3b30],
  listening: ['MIC LISTENING (HANDS-FREE)', 0x62d995],
  hearing: ['MIC HEARING YOU', 0x53d8df],
  transcribing: ['MIC TRANSCRIBING', 0x53d8df],
  speaking: ['HAL SPEAKING', 0xff625f],
  error: ['MIC ERROR', 0xff625f],
};

/** The bot in the conversation: whoever last spoke, else the first. */
let voiceAgent = '';
function voiceBot(): Bot | undefined {
  return bots.get(voiceAgent) ?? bots.values().next().value;
}

let lastVoiceLog = '';
voice.onChange = () => {
  const [label, color] = VOICE_LABELS[voice.state];
  const status = `${voice.state}${voice.detail ? ` · ${voice.detail}` : ''}`;
  // Progress ticks are noisy; log state changes and the final detail.
  if (voice.state !== 'loading' || !/%$/.test(voice.detail)) {
    if (status !== lastVoiceLog) console.info(`[owl3d] voice ${status}`);
    lastVoiceLog = status;
  }
  const showDetail = voice.state === 'loading' || voice.state === 'error';
  hud.setVoice(
    showDetail && voice.detail ? `${label} · ${voice.detail}` : label,
    color
  );
  dock.render(voice.state, voice.detail, settings.handsFree);
};

voice.onHeard = text => {
  caption.show('YOU', text, 0x53d8df);
  hud.say('YOU', text, 0x53d8df);
  if (host?.heard) host.heard(text);
  else console.info('[owl3d] heard:', text);
};

host?.onSpeak?.(line => {
  if (line.agentId && bots.has(line.agentId)) voiceAgent = line.agentId;
  caption.show(voiceBot()?.callsign ?? 'HAL', line.text, 0xff625f);
  hud.say(voiceBot()?.callsign ?? 'HAL', line.text, 0xff625f);
  const audio = line.audio.buffer.slice(
    line.audio.byteOffset,
    line.audio.byteOffset + line.audio.byteLength
  ) as ArrayBuffer;
  console.info(`[owl3d] speaking ${line.id} (${line.audio.byteLength} bytes)`);
  void voice
    .play(audio)
    .catch(error => console.error('[owl3d] speech playback failed:', error))
    .finally(() => {
      console.info(`[owl3d] spoke ${line.id}`);
      host.spoken?.(line.id);
    });
});

window.addEventListener('keydown', event => {
  switch (event.key.toLowerCase()) {
    case 's':
      updateSettings({ mode: settings.mode === 'sbs' ? 'window' : 'sbs' });
      break;
    case 'escape':
      updateSettings({ mode: 'window' });
      break;
    case 'e':
      updateSettings({ swapEyes: !settings.swapEyes });
      break;
    case 'a':
      updateSettings({ squeeze: !settings.squeeze });
      break;
    case 'h':
      updateSettings({ hud: !settings.hud });
      break;
    case '[':
      updateSettings({
        depth: Math.max(0, Math.round((settings.depth - 0.1) * 10) / 10),
      });
      break;
    case ']':
      updateSettings({
        depth: Math.min(2, Math.round((settings.depth + 0.1) * 10) / 10),
      });
      break;
    case '-':
      updateSettings({ convergence: Math.max(-8, settings.convergence - 0.5) });
      break;
    case '=':
      updateSettings({ convergence: Math.min(8, settings.convergence + 0.5) });
      break;
    case '.':
      if (!event.repeat) pushToTalk.down();
      break;
    case 'd':
      demo();
      break;
    case 'm':
      updateSettings({ voice: true, handsFree: !settings.handsFree });
      break;
    case 'f':
      if (!host)
        void (document.fullscreenElement
          ? document.exitFullscreen()
          : document.documentElement.requestFullscreen());
      break;
  }
});

window.addEventListener('keyup', event => {
  if (event.key === '.') pushToTalk.up();
});

window.addEventListener('resize', () =>
  renderer.setSize(window.innerWidth, window.innerHeight, false)
);

if (new URLSearchParams(window.location.search).has('demo')) {
  window.setTimeout(demo, 2500);
  window.setInterval(demo, 40_000);
}

/* ------------------------------- loop ------------------------------- */

/** Keep the whole W × H glass in view whatever the viewport shape. */
function fitFov(aspect: number): number {
  const halfHeight = Math.max(H / 2, W / 2 / aspect);
  return THREE.MathUtils.radToDeg(2 * Math.atan(halfHeight / D));
}

const lensPosition = new THREE.Vector3();
const homeColor = new THREE.Color(STATE_COLORS.idle);
let last = performance.now();

function frame(time: number): void {
  const dt = Math.min(0.05, (time - last) / 1000);
  last = time;
  clock.now = time / 1000;
  const now = clock.now;
  gridUniforms.uTime.value = now;

  for (const bot of bots.values()) {
    if (bot.id !== HOME_ID && now - bot.lastSeen > STALE_AGENT_SECONDS)
      retire(bot);
  }
  for (const bot of allBots()) bot.update(now, dt);
  for (const bot of departing) {
    if (bot.scale < 0.08) {
      bot.dispose();
      departing.delete(bot);
    }
  }
  updateBlocks(now, dt);
  const computing = allBots().filter(bot => bot.wantsHatch);
  const glowBot = computing[0] ?? allBots()[0];
  station.hatch.update(
    dt,
    computing.length,
    Math.min(
      1,
      computing.reduce((sum, bot) => sum + bot.computeLoad, 0)
    ),
    glowBot?.color ?? homeColor
  );
  station.desk.update(dt, glowBot?.color ?? homeColor, glowBot?.energy ?? 0.2);
  particles.update(dt);
  voice.update();
  const talking = voice.state === 'speaking';
  const listeningToYou =
    voice.state === 'hearing' ||
    voice.state === 'recording' ||
    voice.state === 'transcribing';
  const partner = voiceBot();
  for (const bot of bots.values()) {
    const engaged = bot === partner && (talking || listeningToYou);
    bot.facingViewer = engaged;
    bot.voiceLevel = !engaged ? 0 : talking ? voice.outLevel : voice.micLevel;
  }
  if (talking) caption.hold(0.8);
  dock.level(talking ? voice.outLevel : voice.micLevel);
  caption.update(dt);
  updateDust(now, dt);
  worldModels.forEach(model => {
    model.play('idle', 'world');
    model.update(dt, homeColor, 0.3);
  });

  // Bot glows and inspected tiles light up the grid.
  const live = allBots();
  for (let i = 0; i < MAX_BOTS; i++) {
    const bot = live[i];
    const glow = gridUniforms.uGlowPos.value[i];
    const tile = gridUniforms.uTiles.value[i];
    if (!glow || !tile) continue;
    if (!bot) {
      glow.w = 0;
      tile.z = 0;
      continue;
    }
    bot.lensWorld(lensPosition);
    glow.set(
      lensPosition.x,
      lensPosition.y,
      lensPosition.z,
      (0.5 + bot.energy * 1.2) * bot.scale
    );
    gridUniforms.uGlowCol.value[i]?.copy(bot.color);
    if (bot.scanTile) {
      tile.set(
        bot.scanTile.x,
        bot.scanTile.z,
        0.6 + 0.4 * Math.sin(now * 6),
        0
      );
      gridUniforms.uTileCol.value[i]?.copy(bot.color);
    } else {
      tile.z *= 0.9;
    }
  }

  if (settings.hud) hud.draw([...bots.values()], connection);

  const width = window.innerWidth;
  const height = window.innerHeight;
  if (settings.mode === 'sbs') {
    // Side-by-side: left eye in the left half, right eye in the right half.
    // The Shift stretches each half across the panel, so by default each
    // half is rendered anamorphically at the full-panel aspect.
    const aspect = settings.squeeze ? width / height : width / 2 / height;
    camera.aspect = aspect;
    camera.fov = fitFov(aspect);
    camera.focus = D + settings.convergence;
    camera.updateProjectionMatrix();
    stereo.eyeSep = EYE_SEPARATION * settings.depth;
    // The eyes derive from the camera's world matrix, which only a mono
    // render would otherwise refresh.
    camera.updateMatrixWorld();
    stereo.update(camera);
    const [first, second] = settings.swapEyes
      ? [stereo.cameraR, stereo.cameraL]
      : [stereo.cameraL, stereo.cameraR];
    const half = width / 2;
    renderer.setScissorTest(true);
    renderer.setScissor(0, 0, half, height);
    renderer.setViewport(0, 0, half, height);
    renderer.render(scene, first);
    renderer.setScissor(half, 0, half, height);
    renderer.setViewport(half, 0, half, height);
    renderer.render(scene, second);
    renderer.setScissorTest(false);
  } else {
    camera.aspect = width / height;
    camera.fov = fitFov(camera.aspect);
    camera.updateProjectionMatrix();
    renderer.setViewport(0, 0, width, height);
    renderer.render(scene, camera);
  }
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

// Handy from devtools: halOwl3d.emit({...}), halOwl3d.demo()
// Debug and test hooks for the voice path.
const voiceHooks = {
  /** Transcribe any audio file by URL or bytes, exactly as the mic path does. */
  async transcribe(source: string | ArrayBuffer): Promise<string> {
    const data =
      typeof source === 'string'
        ? await (await fetch(source)).arrayBuffer()
        : source;
    return voice.transcribe(await Voice.toMono16k(data));
  },
  /** Pretend you said something. */
  heard(text: string): void {
    voice.onHeard?.(text);
  },
  /** Speak through the browser voice (no shell). */
  say(text: string): Promise<void> {
    caption.show('HAL', text, 0xff625f);
    return voice.say(text);
  },
  get state(): VoiceState {
    return voice.state;
  },
};

Object.assign(window, {
  owl3d: {
    scene,
    bots,
    emit: handleEvent,
    demo,
    models: modelLibrary,
    identity: HOME_IDENTITY,
    voice: voiceHooks,
  },
});
