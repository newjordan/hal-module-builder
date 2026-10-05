import * as THREE from 'three';
import type {
  AgentEventInput,
  AgentRegistration,
  AgentStage,
  AgentState,
} from '../agent-system/types';
import {
  BOUNDS,
  D,
  H,
  W,
  NAP_AFTER_SECONDS,
  ROOM,
  STAGES,
  STATE_COLORS,
  toolColor,
} from './config';
import { LENS_RADIUS, LayerEye } from './eye';
import {
  Beam,
  Label,
  coneGeometry,
  glowSprite,
  particles,
  sleepTexture,
} from './fx';
import type { EyePart } from './layerPlan';
import type { Socket } from './manifest';
import { ModelInstance, modelLibrary } from './models';
import { Block, PLOTS, Plot, type Slot } from './plot';
import { Arm, Cable, headForTool, isDataTool, partInstance } from './rig';
import { DESK, HATCH, type Desk, type Hatch } from './station';
import { clamp, clock, damp, rand, scene } from './stage';
import { floorPulse } from './world';
import { toolWord } from './words';

export type PortalEvent = AgentEventInput & { replay?: boolean };

export type BotMode =
  | 'emerge'
  | 'idle'
  | 'alert'
  | 'compute'
  | 'work'
  | 'speak'
  | 'deliver'
  | 'celebrate'
  | 'attention'
  | 'flinch'
  | 'nap'
  | 'depart';

type Activity =
  | { type: 'wander'; target: THREE.Vector3; end: number; arrived?: number }
  | { type: 'inspect'; tile: THREE.Vector3; end: number }
  | { type: 'peek'; target: THREE.Vector3; end: number; roll: number }
  | { type: 'tend'; block: Block; end: number }
  | { type: 'survey'; target: THREE.Vector3; end: number };

interface Job extends Slot {
  tool: string;
  title: string;
  startedAt: number;
  spot: THREE.Vector3;
  spawnedAt?: number;
  block?: Block;
}

interface Delivery {
  item: ReturnType<Desk['makeCartridge']>;
  slot: THREE.Vector3;
  title: string;
  startedAt: number;
}

/** The room fixtures every bot works with. */
export interface Station {
  desk: Desk;
  hatch: Hatch;
}

export const VIEWER = new THREE.Vector3(0, 0, D);
const SHELL_RADIUS = 0.9;

/** Where manifest models attach when the shell has no matching empty. */
const SOCKET_POSITIONS: Partial<Record<Socket, THREE.Vector3>> = {
  'eye.top': new THREE.Vector3(0, SHELL_RADIUS, 0),
  'eye.bottom': new THREE.Vector3(0, -SHELL_RADIUS, 0),
  'eye.left': new THREE.Vector3(-SHELL_RADIUS, 0, 0),
  'eye.right': new THREE.Vector3(SHELL_RADIUS, 0, 0),
  'eye.back': new THREE.Vector3(0, 0, -SHELL_RADIUS),
  'eye.front': new THREE.Vector3(0, 0, 0.95),
  'eye.body': new THREE.Vector3(0, 0, 0),
};
const ARM_MOUNTS = {
  L: new THREE.Vector3(-0.8, -0.15, -0.05),
  R: new THREE.Vector3(0.8, -0.15, -0.05),
};
const CABLE_SOCKET = new THREE.Vector3(0, -0.86, -0.1);

/** Center stage, just above the desk hologram: where HAL talks with you. */
const CONVERSATION_SPOT = new THREE.Vector3(0, 0.5, -3.4);

/**
 * Keep a target out of the panel's corners and edges: its on-screen position
 * must sit inside an ellipse inscribed in the glass. The Shift's 3D is
 * weakest toward its edges, and corners are kept dark.
 */
export function keepFromCorners(
  target: THREE.Vector3,
  rx = 0.78,
  ry = 0.74
): THREE.Vector3 {
  const k = D / Math.max(1, D - target.z);
  const px = (target.x * k) / (W / 2);
  const py = (target.y * k) / (H / 2);
  const outside = (px / rx) ** 2 + (py / ry) ** 2;
  if (outside > 1) {
    const shrink = 1 / Math.sqrt(outside);
    target.x *= shrink;
    target.y *= shrink;
  }
  return target;
}

const dummy = new THREE.Object3D();
const tmpA = new THREE.Vector3();
const tmpB = new THREE.Vector3();

function identityHue(id: string): number {
  let hash = 0;
  for (const ch of id) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  return (hash % 360) / 360;
}

export const HOME_ID = 'hal-home';
export const HOME_IDENTITY = {
  id: HOME_ID,
  name: 'HAL',
  callsign: 'HAL-9001',
} satisfies AgentRegistration;

/** Procedural shell used when the Blender kit is missing. */
function fallbackShell(): THREE.Object3D {
  const opening = Math.asin(LENS_RADIUS / SHELL_RADIUS);
  const geometry = new THREE.SphereGeometry(
    SHELL_RADIUS,
    72,
    48,
    0,
    Math.PI * 2,
    opening,
    Math.PI - opening
  );
  geometry.rotateX(Math.PI / 2);
  const shell = new THREE.Mesh(
    geometry,
    new THREE.MeshStandardMaterial({
      color: 0x1b1e24,
      metalness: 0.85,
      roughness: 0.3,
    })
  );
  const bezel = new THREE.Mesh(
    new THREE.TorusGeometry(LENS_RADIUS + 0.025, 0.045, 20, 96),
    new THREE.MeshStandardMaterial({
      color: 0xc0c6d0,
      metalness: 1,
      roughness: 0.18,
    })
  );
  bezel.position.z = Math.cos(opening) * SHELL_RADIUS;
  shell.add(bezel);
  return shell;
}

export class Bot {
  id = HOME_ID;
  name = 'HAL';
  callsign = 'HAL-9001';
  state: AgentState = 'idle';
  stage: AgentStage = 'intake';
  title = 'Wandering the grid';
  tool = '';
  contextFraction = 0;
  mode: BotMode = 'emerge';
  energy = 0.2;
  scale = 0.3;
  lastSeen = clock.now;
  scanTile: THREE.Vector3 | null = null;
  /** 0..1 audio driving the eye during conversation (your voice or HAL's). */
  voiceLevel = 0;
  /** True while in conversation: HAL turns to face you. */
  facingViewer = false;
  readonly color = new THREE.Color(STATE_COLORS.idle);
  readonly plot: Plot;

  private readonly group = new THREE.Group();
  private readonly tilt = new THREE.Group();
  private readonly face = new THREE.Group();
  private readonly body = new THREE.Group();
  private readonly lensMount = new THREE.Group();
  private shell: ReturnType<typeof partInstance> | null = null;
  private readonly band: THREE.Mesh<
    THREE.TorusGeometry,
    THREE.MeshStandardMaterial
  >;
  private readonly halo: THREE.Sprite;
  private readonly light: THREE.PointLight;
  private readonly stageRing = new THREE.Group();
  private readonly stageArcs: Array<
    THREE.Mesh<THREE.TorusGeometry, THREE.MeshBasicMaterial>
  >;
  private readonly motes: THREE.Sprite[];
  private readonly label = new Label();
  private readonly cone = new Beam(coneGeometry);
  private eye: LayerEye | null = null;
  private models: ModelInstance[] = [];
  private arms: { L: Arm; R: Arm } | null = null;
  private readonly mounts = { L: new THREE.Group(), R: new THREE.Group() };
  private readonly cableSocket = new THREE.Object3D();
  private readonly cable = new Cable();
  private readonly vel = new THREE.Vector3();
  private readonly target = new THREE.Vector3();
  private readonly lookAt = VIEWER.clone();
  private readonly lookSmooth = VIEWER.clone();
  private readonly colorTarget = new THREE.Color(STATE_COLORS.idle);
  private readonly toolTint = new THREE.Color(0xb0b8c8);
  private modeAt = clock.now;
  private resumeMode: BotMode = 'compute';
  private activity: Activity | null = null;
  private readonly queue: Array<{ tool: string; title: string }> = [];
  private job: Job | null = null;
  private delivery: Delivery | null = null;
  private lastBlock: Block | null = null;
  private lastWork = 'Turn complete';
  private lastActive = clock.now;
  private nextBlink = clock.now + rand(2, 5);
  private blink = 0;
  private spinAngle = 0;
  private readonly phase = rand(0, 10);
  private nextSleepZ = 0;
  private nextPacket = 0;
  private colorHoldUntil = 0;
  private motesOn = false;

  constructor(
    readonly slot: number,
    design: readonly EyePart[],
    private readonly station: Station,
    identity: AgentRegistration = HOME_IDENTITY
  ) {
    const plot = PLOTS[slot] ?? PLOTS[0];
    this.plot = new Plot(plot.cx, plot.cz);
    this.group.add(this.tilt);
    this.tilt.add(this.face);
    this.face.add(this.body);
    scene.add(this.group);

    // Identity band: each agent gets its own hue (HAL is red).
    this.band = new THREE.Mesh(
      new THREE.TorusGeometry(SHELL_RADIUS + 0.004, 0.012, 8, 128),
      new THREE.MeshStandardMaterial({
        color: 0x000000,
        emissive: 0xffffff,
        emissiveIntensity: 1.4,
      })
    );
    this.band.rotation.x = Math.PI / 2;
    this.band.position.y = 0.3;
    this.band.scale.setScalar(Math.cos(Math.asin(0.3 / SHELL_RADIUS)));
    this.body.add(this.band);

    this.body.add(
      this.lensMount,
      this.mounts.L,
      this.mounts.R,
      this.cableSocket
    );
    this.halo = glowSprite(STATE_COLORS.idle, 3.4, 0.4);
    this.halo.position.z = 0.85;
    this.body.add(this.halo);

    this.stageArcs = STAGES.map((_, i) => {
      const arc = new THREE.Mesh(
        new THREE.TorusGeometry(1.08, 0.02, 8, 48, (Math.PI * 2) / 6 - 0.16),
        new THREE.MeshBasicMaterial({
          color: 0xffffff,
          transparent: true,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        })
      );
      arc.rotation.z = (i * Math.PI * 2) / 6;
      this.stageRing.add(arc);
      return arc;
    });
    // A halo framing the lens; the lit arc is the current pipeline stage.
    this.stageRing.position.z = 0.35;
    this.face.add(this.stageRing);

    this.motes = Array.from({ length: 7 }, () => {
      const mote = glowSprite(STATE_COLORS.thinking, 0.3, 0);
      this.tilt.add(mote);
      return mote;
    });

    this.light = new THREE.PointLight(STATE_COLORS.idle, 18, 16, 1.6);
    this.light.position.z = 1.2;
    this.face.add(this.light);

    this.group.position.set(
      this.plot.cx * 0.5,
      ROOM.floor - 1.5,
      this.plot.cz + 6
    );
    this.target.set(this.plot.cx * 0.5, 0, this.plot.cz + 6);
    this.setDesign(design);
    this.attachModels();
    this.bind(identity);
    floorPulse(
      this.group.position.x,
      this.group.position.z,
      STATE_COLORS.idle,
      1.4
    );
  }

  /** What a pointer can touch to talk to (or hush) this bot. */
  get pickable(): THREE.Object3D {
    return this.group;
  }

  get position(): THREE.Vector3 {
    return this.group.position;
  }

  /** Rebuild the lens from a (new) studio design. */
  setDesign(design: readonly EyePart[]): void {
    this.eye?.dispose();
    this.eye = new LayerEye(design);
    this.lensMount.add(this.eye.group);
  }

  /** (Re)build the shell, arms and manifest models from the model library. */
  attachModels(): void {
    this.models.forEach(model => model.dispose());
    this.models = [];
    this.shell?.model?.dispose();
    this.shell?.object.removeFromParent();
    this.shell = partInstance('shell', fallbackShell);
    this.body.add(this.shell.object);

    // Mount points come from the Blender empties when present.
    this.body.updateMatrixWorld(true);
    const place = (
      holder: THREE.Object3D,
      name: string,
      fallback: THREE.Vector3
    ) => {
      const socket = this.shell?.model?.socket(name);
      if (socket) {
        holder.position.copy(
          this.body.worldToLocal(socket.getWorldPosition(tmpA))
        );
      } else {
        holder.position.copy(fallback);
      }
    };
    place(this.mounts.L, 'socket_arm_L', ARM_MOUNTS.L);
    place(this.mounts.R, 'socket_arm_R', ARM_MOUNTS.R);
    place(this.cableSocket, 'socket_cable', CABLE_SOCKET);

    this.arms?.L.dispose();
    this.arms?.R.dispose();
    this.arms = {
      L: new Arm(this.mounts.L, this.body, -1),
      R: new Arm(this.mounts.R, this.body, 1),
    };

    let hideShell = false;
    for (const loaded of modelLibrary.models) {
      const socket = loaded.entry.attach;
      if (socket === 'world' || socket === 'build' || socket === 'part')
        continue;
      const instance = new ModelInstance(loaded);
      if (socket === 'eye.orbit') {
        this.tilt.add(instance.root);
      } else {
        const named = this.shell.model?.socket(`socket_${socket.slice(4)}`);
        instance.root.position.copy(
          named
            ? this.body.worldToLocal(named.getWorldPosition(tmpA))
            : (SOCKET_POSITIONS[socket] ?? tmpA.set(0, 0, 0))
        );
        this.body.add(instance.root);
      }
      hideShell ||= socket === 'eye.body' && loaded.entry.hideShell;
      this.models.push(instance);
    }
    this.shell.object.visible = !hideShell;
  }

  bind(identity: AgentRegistration): void {
    this.id = identity.id;
    this.name = identity.name || identity.id;
    this.callsign = identity.callsign || identity.id.slice(0, 8).toUpperCase();
    const hue = identity.id === HOME_ID ? 0 : identityHue(identity.id);
    this.band.material.emissive.setHSL(hue, 0.9, 0.55);
  }

  goHome(): void {
    this.bind(HOME_IDENTITY);
    this.state = 'idle';
    this.title = 'Wandering the grid';
    this.contextFraction = 0;
    this.setMode('idle');
  }

  setMode(mode: BotMode): void {
    if (this.mode === 'depart') return;
    if (this.mode === 'deliver' && this.delivery && mode !== 'flinch') return;
    this.mode = mode;
    this.modeAt = clock.now;
    this.activity = null;
  }

  /** True while HAL is plugged in (or plugging in) to the inner computer. */
  get wantsHatch(): boolean {
    return this.mode === 'compute';
  }

  get computeLoad(): number {
    return this.mode === 'compute' ? 0.5 + this.energy * 0.5 : 0;
  }

  apply(event: PortalEvent): void {
    const now = clock.now;
    this.lastSeen = now;
    if (event.agent) this.bind({ ...event.agent, id: this.id });
    if (event.state) this.state = event.state;
    if (event.stage) this.stage = event.stage;
    if (event.title) this.title = event.title;
    if (event.tool) this.tool = event.tool;
    const metrics = event.metrics;
    if (metrics?.tokensUsed && metrics.contextWindow) {
      this.contextFraction = clamp(
        metrics.tokensUsed / metrics.contextWindow,
        0,
        1
      );
    }
    if (now > this.colorHoldUntil || event.kind === 'error')
      this.colorTarget.set(STATE_COLORS[this.state]);
    if (this.state !== 'idle' && this.state !== 'offline')
      this.lastActive = now;

    if (event.state === 'offline') {
      this.depart();
      return;
    }
    if (event.replay) {
      // History sets the scene without fireworks.
      this.setMode(this.modeForState());
      return;
    }

    const tool = event.tool ?? this.tool;
    switch (event.kind) {
      case 'tool':
        if (event.state === 'processing') {
          this.toolTint.set(toolColor(tool));
          this.label.show(toolWord(tool), toolColor(tool), 4);
          if (isDataTool(tool)) {
            // Reads and searches go down the cable to the inner computer.
            this.setMode('compute');
            this.cable.send(-1, 3);
          } else {
            if (this.queue.length < 10)
              this.queue.push({ tool, title: event.title });
            if (!/^Running /.test(event.title)) this.lastWork = event.title;
            this.setMode('work');
          }
        } else {
          if (isDataTool(tool)) this.cable.send(1, 3);
          else if (this.lastBlock) this.lastBlock.flash = 1;
          if (this.mode !== 'work') this.setMode('compute');
        }
        break;
      case 'error':
        this.flinch();
        break;
      case 'thought':
        if (this.mode !== 'work' || !this.queue.length) this.setMode('compute');
        break;
      case 'message':
        if (event.stage === 'intake') {
          this.label.show('NEW TASK', STATE_COLORS.thinking, 2.5);
          floorPulse(
            this.position.x,
            this.position.z,
            STATE_COLORS.thinking,
            1.2
          );
          this.setMode('alert');
        } else {
          this.setMode('speak');
        }
        break;
      case 'completion':
        this.startDelivery(event.task || this.lastWork);
        break;
      case 'approval':
        this.label.show('APPROVE?', STATE_COLORS.waiting, 6);
        this.setMode('attention');
        break;
      default:
        if (event.state === 'idle' && this.mode !== 'nap') this.setMode('idle');
        else if (event.state === 'waiting') this.setMode('attention');
    }
  }

  private modeForState(): BotMode {
    switch (this.state) {
      case 'thinking':
        return 'compute';
      case 'processing':
        return 'work';
      case 'waiting':
        return 'attention';
      default:
        return 'idle';
    }
  }

  private flinch(): void {
    const slot = this.plot.reserve();
    const block = new Block(
      this.plot.position(slot),
      0xff2020,
      this.tool,
      true
    );
    this.plot.release(slot); // broken blocks never hold a place in the stack
    this.arms?.R.reach(block.position, clock.now + 0.8, headForTool(this.tool));
    particles.burst(block.position.clone(), [0xff3030, 0xffb030], 24, 4);
    this.label.show('ERROR', STATE_COLORS.error, 3.5);
    this.colorTarget.set(STATE_COLORS.error);
    this.colorHoldUntil = clock.now + 1.5;
    if (this.mode !== 'flinch')
      this.resumeMode = this.mode === 'deliver' ? 'compute' : this.mode;
    this.mode = 'flinch';
    this.modeAt = clock.now;
  }

  /** Carry a cartridge of the finished work to the desk, then celebrate. */
  private startDelivery(title: string): void {
    if (this.delivery) return;
    const item = this.station.desk.makeCartridge(STATE_COLORS.completed);
    item.object.scale.setScalar(this.scale);
    this.delivery = {
      item,
      slot: this.station.desk.nextSlot(),
      title,
      startedAt: clock.now,
    };
    if (this.arms) this.arms.L.carried = item.object;
    this.label.show('DELIVER', STATE_COLORS.completed, 2.5);
    this.mode = 'deliver';
    this.modeAt = clock.now;
    this.activity = null;
  }

  private finishDelivery(): void {
    const delivery = this.delivery;
    if (!delivery) return;
    if (this.arms) this.arms.L.carried = null;
    delivery.item.object.scale.setScalar(1);
    const spot = this.station.desk.deliver(delivery.item);
    particles.burst(
      spot.clone().setY(spot.y + 0.2),
      [0x62d995, 0x53d8df, 0xffffff],
      30,
      3
    );
    this.delivery = null;
    this.celebrate();
  }

  private celebrate(): void {
    this.label.show('DONE', STATE_COLORS.completed, 3);
    this.mode = 'celebrate';
    this.modeAt = clock.now;
    this.colorHoldUntil = clock.now + 6;
    particles.burst(
      this.lensWorld(tmpA).clone(),
      [0x62d995, 0x53d8df, 0xf2b84b, 0xffffff],
      70,
      7
    );
    floorPulse(this.position.x, this.position.z, STATE_COLORS.completed, 1.6);
  }

  depart(): void {
    if (this.delivery) {
      this.delivery.item.object.removeFromParent();
      this.delivery = null;
    }
    this.mode = 'depart';
    this.modeAt = clock.now;
    floorPulse(this.position.x, this.position.z, STATE_COLORS.offline, 1);
  }

  lensWorld(out: THREE.Vector3): THREE.Vector3 {
    return this.halo.getWorldPosition(out);
  }

  /** Where this bot docks over the hatch; each slot takes a corner. */
  private dockPoint(out: THREE.Vector3): THREE.Vector3 {
    const angle = Math.PI / 4 + (this.slot * Math.PI) / 2;
    return out.set(
      HATCH.x + Math.cos(angle) * 2.5,
      ROOM.floor + 2.9,
      HATCH.z + Math.sin(angle) * 2.5
    );
  }

  private pickIdle(now: number): Activity {
    const roll = Math.random();
    const top = this.plot.top();
    if (roll < 0.34) {
      return {
        type: 'wander',
        target: new THREE.Vector3(
          rand(-BOUNDS.x, BOUNDS.x),
          rand(-2.2, 2.2),
          rand(-18, -3.5)
        ),
        end: now + 12,
      };
    }
    if (roll < 0.58) {
      const tile = new THREE.Vector3(
        Math.floor(rand(-7, 7) / 2) * 2 + 1,
        ROOM.floor,
        Math.floor(rand(-20, -6) / 2) * 2 + 1
      );
      return { type: 'inspect', tile, end: now + rand(6, 9) };
    }
    if (roll < 0.74) {
      return {
        type: 'peek',
        target: new THREE.Vector3(rand(-3, 3), rand(-0.4, 1.2), rand(2.2, 3.4)),
        end: now + rand(4, 7),
        roll: rand(-0.35, 0.35),
      };
    }
    if (roll < 0.86 && top)
      return { type: 'tend', block: top, end: now + rand(4, 6) };
    return {
      type: 'survey',
      target: new THREE.Vector3(rand(-4, 4), rand(2.2, 3), rand(-14, -5)),
      end: now + rand(5, 8),
    };
  }

  /** Activity name used to pick model animation clips. */
  get activityName(): string {
    return this.mode === 'idle' && this.activity
      ? this.activity.type
      : this.mode;
  }

  private behave(now: number): {
    energy: number;
    speed: number;
    bob: number;
    roll: number;
  } {
    let energy = 0.18;
    let speed = 3.2;
    let bob = 0.12;
    let roll = 0;
    this.motesOn = false;
    this.scanTile = null;
    const plot = this.plot;
    const since = now - this.modeAt;
    const pos = this.position;
    const arms = this.arms;
    let plugged = false;

    switch (this.mode) {
      case 'emerge':
        this.target.set(plot.cx * 0.5, 0, plot.cz + 6);
        this.lookAt.copy(VIEWER);
        speed = 4;
        if (since > 2.5) this.setMode('idle');
        break;

      case 'idle': {
        if (now - this.lastActive > NAP_AFTER_SECONDS) {
          this.setMode('nap');
          break;
        }
        if (!this.activity || now > this.activity.end)
          this.activity = this.pickIdle(now);
        const a = this.activity;
        if (a.type === 'wander') {
          this.target.copy(a.target);
          if (a.arrived === undefined && pos.distanceTo(a.target) < 0.5) {
            a.arrived = now;
            a.end = now + rand(1.5, 3.5);
          }
          if (a.arrived !== undefined) {
            const t = now - a.arrived;
            this.lookAt.set(
              pos.x + Math.sin(t * 1.3 + this.phase) * 6,
              pos.y - 0.5,
              pos.z + 5
            );
          } else {
            this.lookAt.copy(a.target).addScaledVector(this.vel, 2);
          }
        } else if (a.type === 'inspect') {
          this.target.copy(a.tile).add(tmpA.set(0, 1.9, 1.1));
          this.lookAt.copy(a.tile);
          if (pos.distanceTo(this.target) < 1) {
            this.scanTile = a.tile;
            this.cone.aim(
              this.lensWorld(tmpA),
              tmpB.copy(a.tile).setY(ROOM.floor + 0.02),
              this.color,
              0.5
            );
            energy = 0.35;
          }
        } else if (a.type === 'peek') {
          this.target.copy(a.target);
          this.lookAt
            .copy(VIEWER)
            .add(
              tmpA.set(Math.sin(now * 0.9) * 0.6, Math.sin(now * 1.7) * 0.3, 0)
            );
          roll = pos.distanceTo(a.target) < 1 ? a.roll : 0;
          bob = 0.08;
        } else if (a.type === 'tend') {
          if (!a.block.alive) {
            a.end = now;
            break;
          }
          this.target.copy(a.block.position).add(tmpA.set(0.5, 1.5, 1.3));
          this.lookAt.copy(a.block.position);
          if (pos.distanceTo(this.target) < 0.9) {
            // Polish the block with the gripper.
            arms?.R.reach(
              tmpB
                .copy(a.block.position)
                .add(tmpA.set(Math.sin(now * 4) * 0.25, 0.55, 0.2)),
              now + 0.3,
              'gripper'
            );
            a.block.flash = Math.max(a.block.flash, 0.3);
            energy = 0.4;
          }
        } else {
          this.target.copy(a.target);
          const t = now * 0.5 + this.phase;
          this.lookAt.set(
            pos.x + Math.sin(t) * 10,
            pos.y - 2,
            pos.z + Math.cos(t) * 6
          );
        }
        break;
      }

      case 'alert':
        // Perk up and look at whoever just asked for something.
        this.target.set(plot.cx * 0.3, 0.6, 1.2);
        this.lookAt.copy(VIEWER);
        energy = 0.55;
        speed = 5;
        if (since > 1.6) this.setMode('compute');
        break;

      case 'compute': {
        // Dock over the hatch, plug in, and push data down to the core.
        const dock = this.dockPoint(tmpB);
        this.target
          .copy(dock)
          .add(
            tmpA.set(
              Math.sin(now * 0.7 + this.phase) * 0.25,
              Math.sin(now * 1.1) * 0.15,
              0
            )
          );
        const docked = pos.distanceTo(dock) < 1.4;
        plugged = docked;
        const glance = Math.floor(since / 2.6) % 3 === 2;
        this.lookAt.copy(glance ? VIEWER : this.station.hatch.port);
        if (docked) {
          // Probe the risen core on the side facing this bot.
          const facing =
            Math.atan2(pos.z - HATCH.z, pos.x - HATCH.x) +
            Math.sin(now * 0.8) * 0.35;
          arms?.R.reach(
            this.station.hatch.surfacePoint(facing, tmpA),
            now + 0.3,
            headForTool(this.tool) === 'dish' ? 'dish' : 'probe'
          );
          if (now > this.nextPacket) {
            this.nextPacket = now + 0.45;
            this.cable.send(-1);
          }
        }
        this.motesOn = true;
        energy = 0.45;
        speed = 3.5;
        if (since > 25 && this.state !== 'thinking') this.setMode('idle');
        break;
      }

      case 'work': {
        if (!this.job) {
          const next = this.queue.shift();
          if (next) {
            const slot = plot.reserve();
            this.job = {
              ...next,
              ...slot,
              startedAt: now,
              spot: plot.position(slot),
            };
          }
        }
        energy = 0.65;
        speed = 6;
        const job = this.job;
        if (job) {
          this.target
            .copy(job.spot)
            .add(tmpA.set(-Math.sign(plot.cx) * 0.9, 1.6, 1.4));
          this.lookAt.copy(job.spot);
          const head = headForTool(job.tool);
          const touch = tmpB.copy(job.spot).add(tmpA.set(0, 0.55, 0.1));
          arms?.R.reach(touch, now + 0.5, head);
          // The off hand steadies the build with the gripper.
          arms?.L.reach(
            tmpA.copy(job.spot).add(new THREE.Vector3(0.45, 0.2, 0.55)),
            now + 0.5,
            'gripper'
          );
          const rushed = this.queue.length > 3;
          const arrived = (arms?.R.tip.distanceTo(touch) ?? 0) < 0.4;
          if (
            job.spawnedAt === undefined &&
            (arrived || now - job.startedAt > (rushed ? 0.5 : 1.6))
          ) {
            const color = toolColor(job.tool);
            job.block = new Block(job.spot, color, job.tool);
            plot.fill(job, job.block);
            this.lastBlock = job.block;
            job.spawnedAt = now;
            particles.burst(arms ? arms.R.tip.clone() : job.spot, color, 14, 3);
          }
          if (
            job.spawnedAt !== undefined &&
            now - job.spawnedAt > (rushed ? 0.2 : 0.5)
          )
            this.job = null;
        } else {
          const t = now * 0.6 + this.phase;
          this.target.set(
            plot.cx + Math.sin(t) * 1.2,
            ROOM.floor + 5.6,
            plot.cz + 3.2
          );
          this.lookAt.set(plot.cx, ROOM.floor + 1, plot.cz);
          if (since > 12) this.setMode('compute');
        }
        break;
      }

      case 'speak': {
        // Write the reply at the desk: hover beside the hologram and type,
        // so the words above the desk stay clear.
        const side = this.slot % 2 === 0 ? -1 : 1;
        this.target.set(DESK.x + side * 3.6, DESK.top + 1.0, DESK.z - 0.2);
        const typing = pos.distanceTo(this.target) < 1.2;
        // Writing a reply is talking to you: mostly face the viewer.
        this.lookAt.copy(
          Math.floor(since / 2.5) % 3 === 2
            ? tmpA.set(DESK.x + side * 2.1, DESK.top, DESK.z + 0.1)
            : VIEWER
        );
        if (typing && arms) {
          const key = (offset: number) =>
            tmpA.set(
              DESK.x +
                side * 2.1 +
                offset +
                Math.sin(now * 9 + offset * 5) * 0.12,
              DESK.top +
                0.08 +
                Math.max(0, Math.sin(now * 14 + offset * 3)) * 0.1,
              DESK.z + 0.1
            );
          arms.L.reach(key(-0.25), now + 0.3, 'pen');
          arms.R.reach(key(0.25), now + 0.3, 'pen');
        }
        energy = 0.75 + Math.random() * 0.25;
        bob = 0.05;
        if (since > 20) this.setMode('idle');
        break;
      }

      case 'deliver': {
        const delivery = this.delivery;
        if (!delivery) {
          this.setMode('idle');
          break;
        }
        this.target.copy(delivery.slot).add(tmpA.set(0.6, 1.9, -0.9));
        this.lookAt.copy(delivery.slot);
        energy = 0.6;
        speed = 5;
        if (pos.distanceTo(this.target) < 1.0 && arms) {
          const drop = tmpB.copy(delivery.slot).setY(delivery.slot.y + 0.35);
          arms.L.reach(drop, now + 0.4, 'gripper');
          if (arms.L.tip.distanceTo(drop) < 0.45) this.finishDelivery();
        } else {
          // Hold the cartridge up while flying in.
          arms?.L.reach(
            tmpA.copy(pos).add(new THREE.Vector3(-0.9, -0.6, 0.8)),
            now + 0.4,
            'gripper'
          );
        }
        if (now - delivery.startedAt > 6) this.finishDelivery();
        break;
      }

      case 'celebrate':
        this.target.set(
          plot.cx * 0.35,
          1.4 + Math.abs(Math.sin(since * 5)) * 0.8,
          1.5
        );
        this.lookAt.copy(VIEWER);
        energy = 1;
        arms?.L.reach(
          tmpA.copy(pos).add(new THREE.Vector3(-1.2, 1.1, 0.4)),
          now + 0.3,
          'splitter'
        );
        arms?.R.reach(
          tmpA.copy(pos).add(new THREE.Vector3(1.2, 1.1, 0.4)),
          now + 0.3,
          'splitter'
        );
        this.spinAngle = since < 1.1 ? (since / 1.1) * Math.PI * 4 : 0;
        if (since > 2.8) {
          this.spinAngle = 0;
          this.setMode('idle');
        }
        break;

      case 'attention':
        this.target.set(plot.cx * 0.3, 0.5, 3.0);
        this.lookAt.copy(VIEWER);
        energy = 0.5 + 0.4 * Math.abs(Math.sin(now * 3));
        // Wave for attention.
        arms?.R.reach(
          tmpA
            .copy(pos)
            .add(new THREE.Vector3(1.1 + Math.sin(now * 8) * 0.25, 1.2, 0.5)),
          now + 0.3,
          'gripper'
        );
        bob = 0.28;
        speed = 5;
        break;

      case 'flinch':
        energy = 0.8;
        this.lookAt.set(plot.cx, ROOM.floor, plot.cz);
        if (since > 0.8) {
          this.mode =
            this.resumeMode === 'flinch' ? 'compute' : this.resumeMode;
          this.modeAt = now;
        }
        break;

      case 'nap':
        this.target.set(plot.cx * 0.6, ROOM.floor + 0.95, plot.cz + 4);
        this.lookAt.set(plot.cx * 0.6, ROOM.floor + 0.5, plot.cz + 12);
        energy = 0.05;
        bob = 0.03;
        speed = 1.2;
        if (now > this.nextSleepZ && pos.distanceTo(this.target) < 0.6) {
          this.nextSleepZ = now + 1.6;
          particles.spawn({
            pos: tmpA.copy(pos).add(tmpB.set(0.5, 0.9, 0.3)),
            vel: tmpB.set(0.25, 0.6, 0.1),
            color: 0x9fb4c8,
            size: 0.45,
            life: 3,
            gravity: 0,
            map: sleepTexture,
            spin: 0.3,
          });
        }
        break;

      case 'depart':
        this.target.set(pos.x, ROOM.floor - 3, pos.z);
        speed = 3;
        energy = 0.05;
        break;
    }
    this.cable.connect(plugged);
    return { energy, speed, bob, roll };
  }

  update(now: number, dt: number): void {
    const { energy, speed, bob, roll } = this.behave(now);
    if (this.facingViewer) {
      // In conversation: come to center stage above the hologram, face you.
      this.lookAt.copy(VIEWER);
      if (this.mode !== 'depart') this.target.copy(CONVERSATION_SPOT);
    }
    const pos = this.position;

    if (this.mode !== 'depart' && this.mode !== 'emerge') {
      this.target.x = clamp(this.target.x, -BOUNDS.x, BOUNDS.x);
      this.target.y = clamp(
        this.target.y,
        Math.min(BOUNDS.yMin, ROOM.floor + 0.95),
        BOUNDS.yMax
      );
      this.target.z = clamp(this.target.z, BOUNDS.zMin, BOUNDS.zMax);
      keepFromCorners(this.target);
    }
    // Steer toward the target and arrive smoothly.
    const to = tmpA.subVectors(this.target, pos);
    const distance = to.length();
    // Cruise faster over long hauls (desk ↔ hatch ↔ plot), ease in on arrival.
    const cruise = speed * clamp(distance / 4, 1, 2.6);
    if (distance > 0.01)
      to.multiplyScalar((cruise * Math.min(1, distance / 2.2)) / distance);
    else to.set(0, 0, 0);
    this.vel.lerp(to, damp(3.2, dt));
    pos.addScaledVector(this.vel, dt);

    // Body language: bank into turns, bob, shake when hurt.
    this.tilt.rotation.z +=
      (-this.vel.x * 0.07 - this.tilt.rotation.z) * damp(5, dt);
    this.tilt.rotation.x +=
      (this.vel.z * 0.05 - this.tilt.rotation.x) * damp(5, dt);
    this.tilt.position.y = Math.sin(now * 1.6 + this.phase) * bob;
    this.tilt.position.x =
      this.mode === 'flinch'
        ? Math.sin(now * 55) * 0.09 * Math.max(0, 1 - (now - this.modeAt) / 0.8)
        : 0;

    this.lookSmooth.lerp(this.lookAt, damp(4, dt));
    dummy.position.copy(pos);
    dummy.lookAt(this.lookSmooth);
    this.face.quaternion.slerp(dummy.quaternion, damp(5, dt));
    this.body.rotation.y = this.spinAngle;
    this.body.rotation.z += (roll - this.body.rotation.z) * damp(3, dt);

    const targetScale = this.mode === 'depart' ? 0.05 : 1;
    this.scale +=
      (targetScale - this.scale) * damp(this.mode === 'depart' ? 1.5 : 3, dt);
    this.group.scale.setScalar(this.scale);
    this.group.updateMatrixWorld(true);

    if (now > this.colorHoldUntil && this.mode !== 'flinch') {
      this.colorTarget.set(
        this.state === 'completed'
          ? STATE_COLORS.idle
          : STATE_COLORS[this.state]
      );
    }
    this.color.lerp(this.colorTarget, damp(4, dt));
    this.energy +=
      (Math.max(energy, this.voiceLevel) - this.energy) *
      damp(this.voiceLevel > 0.05 ? 18 : 6, dt);
    const dim = this.mode === 'nap' ? 0.35 + 0.15 * Math.sin(now * 0.9) : 1;

    if (now > this.nextBlink) {
      this.blink = 1;
      this.nextBlink = now + rand(2.5, 6.5);
    }
    this.blink = Math.max(0, this.blink - dt * 7);
    const lid =
      this.mode === 'nap' ? 0.25 : 1 - Math.sin(this.blink * Math.PI) * 0.92;
    this.lensMount.scale.set(1, lid, 1);

    const idleRed = this.state === 'idle' || this.state === 'completed';
    this.eye?.update(
      dt,
      now,
      this.energy * dim,
      this.color,
      idleRed ? 0 : 0.7,
      this.mode === 'speak' || this.voiceLevel > 0.05
    );
    this.halo.material.color.copy(this.color);
    this.halo.material.opacity = (0.16 + this.energy * 0.3) * dim;
    this.halo.scale.setScalar(
      2.6 + this.energy * 1.6 + this.contextFraction * 0.8
    );
    this.light.color.copy(this.color);
    this.light.intensity = (10 + this.energy * 26) * dim;

    this.stageRing.rotation.z += dt * (0.25 + this.energy * 1.8);
    const stageIndex = STAGES.indexOf(this.stage);
    this.stageArcs.forEach((arc, i) => {
      arc.material.color.copy(this.color);
      arc.material.opacity =
        (i === stageIndex ? 0.95 : 0.12) *
        dim *
        (this.mode === 'nap' ? 0.4 : 1);
    });

    this.motes.forEach((mote, i) => {
      const a = now * (1.2 + i * 0.13) + i * 0.9;
      mote.position.set(
        Math.cos(a) * 1.65,
        Math.sin(a * 1.3) * 0.5,
        Math.sin(a) * 1.65
      );
      mote.material.color.copy(this.color);
      mote.material.opacity +=
        ((this.motesOn ? 0.9 : 0) - mote.material.opacity) * damp(4, dt);
    });

    this.shell?.model?.update(dt, this.color, this.energy * dim);
    for (const model of this.models) {
      model.play(this.state, this.activityName);
      model.update(dt, this.color, this.energy * dim);
    }
    if (this.arms) {
      if (
        this.mode === 'nap' ||
        this.mode === 'depart' ||
        this.mode === 'emerge'
      ) {
        this.arms.L.rest();
        this.arms.R.rest();
      }
      this.arms.L.update(
        now,
        dt,
        this.scale,
        this.color,
        this.toolTint,
        this.energy
      );
      this.arms.R.update(
        now,
        dt,
        this.scale,
        this.color,
        this.toolTint,
        this.energy
      );
    }
    this.cable.update(
      dt,
      this.station.hatch.port,
      this.cableSocket.getWorldPosition(tmpA),
      this.color
    );

    this.cone.update(dt, 0.22);
    this.label.update(
      dt,
      tmpB.copy(pos).add(tmpA.set(0, 1.75 * this.scale, 0))
    );
  }

  dispose(): void {
    this.models.forEach(model => model.dispose());
    this.shell?.model?.dispose();
    this.arms?.L.dispose();
    this.arms?.R.dispose();
    this.cable.dispose();
    this.eye?.dispose();
    scene.remove(this.group);
    this.cone.dispose();
    this.label.dispose();
    this.plot.clear();
  }
}
