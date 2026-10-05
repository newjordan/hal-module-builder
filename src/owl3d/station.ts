import * as THREE from 'three';
import { ROOM, STATE_COLORS } from './config';
import { glowSprite } from './fx';
import { ModelInstance } from './models';
import { partInstance } from './rig';
import { clamp, clock, damp, scene } from './stage';
import { gridUniforms } from './world';

/**
 * Fixtures of the room: the cyberdesk in the foreground, where finished work
 * is delivered, and the hatch in the floor over the inner computer, where
 * data goes down.
 */

/* ------------------------------- desk -------------------------------- */

export const DESK = { x: 0, z: -4.6, top: ROOM.floor + 0.9 } as const;
const SLOTS_X = [-1.32, -0.44, 0.44, 1.32];
const SLOTS_Z = [-0.75, -0.1];
/** Where the talk and stop buttons sit on the desk's front corners. */
const BUTTON_X = 2.3;
const BUTTON_Z = 0.5;

interface DeskItem {
  object: THREE.Object3D;
  model: ModelInstance | null;
  color: THREE.Color;
  born: number;
  sinking: number | null;
}

/** What the desk's voice controls should show. */
export interface DeskVoice {
  recording: boolean;
  speaking: boolean;
  /** 0..1 microphone level while recording. */
  level: number;
  /** The last recording had no sound at all. */
  noMic: boolean;
  /** Voice is loaded and ready for a press. */
  ready: boolean;
}

const metal = () =>
  new THREE.MeshStandardMaterial({
    color: 0x1a1d22,
    metalness: 0.85,
    roughness: 0.3,
  });

/**
 * The cyberdesk in the foreground. Everything you interact with is on it:
 * a big red dome to hold while you talk to HAL, a stop block that lights up
 * while HAL is speaking, and the cartridges HAL delivers when a job is done.
 * The conversation shows up as sound in the ceiling (world.ts).
 */
export class Desk {
  readonly talkButton = new THREE.Group();
  readonly stopButton = new THREE.Group();
  private readonly desk: ReturnType<typeof partInstance>;
  private readonly talkCap: THREE.Mesh<
    THREE.SphereGeometry,
    THREE.MeshStandardMaterial
  >;
  private readonly talkRing: THREE.Mesh<
    THREE.TorusGeometry,
    THREE.MeshStandardMaterial
  >;
  private readonly talkGlow: THREE.Sprite;
  private readonly stopCap: THREE.Mesh<
    THREE.BoxGeometry,
    THREE.MeshStandardMaterial
  >;
  private readonly items: Array<DeskItem | null> = Array.from(
    { length: SLOTS_X.length * SLOTS_Z.length },
    () => null
  );
  private next = 0;
  private pressed: 'talk' | 'stop' | null = null;
  private voice: DeskVoice = {
    recording: false,
    speaking: false,
    level: 0,
    noMic: false,
    ready: false,
  };

  constructor() {
    this.desk = partInstance('desk', () => {
      const slab = new THREE.Mesh(new THREE.BoxGeometry(6, 0.12, 2.4), metal());
      slab.position.y = 0.84;
      return slab;
    });
    this.desk.object.position.set(DESK.x, ROOM.floor, DESK.z);
    scene.add(this.desk.object);

    // Talk: a big red dome. Hold it to talk to HAL.
    const talkBase = new THREE.Mesh(
      new THREE.CylinderGeometry(0.44, 0.5, 0.14, 48),
      metal()
    );
    talkBase.position.y = 0.07;
    this.talkRing = new THREE.Mesh(
      new THREE.TorusGeometry(0.4, 0.035, 12, 64),
      new THREE.MeshStandardMaterial({
        color: 0x220504,
        emissive: 0xff2a1a,
        emissiveIntensity: 1,
      })
    );
    this.talkRing.rotation.x = Math.PI / 2;
    this.talkRing.position.y = 0.145;
    this.talkCap = new THREE.Mesh(
      new THREE.SphereGeometry(0.34, 48, 24, 0, Math.PI * 2, 0, Math.PI / 2),
      new THREE.MeshStandardMaterial({
        color: 0x3a0806,
        emissive: 0xff2a1a,
        emissiveIntensity: 0.6,
        roughness: 0.25,
        metalness: 0.1,
      })
    );
    this.talkCap.position.y = 0.14;
    this.talkCap.scale.y = 0.75;
    this.talkGlow = glowSprite(0xff2a1a, 1.6, 0.25);
    this.talkGlow.position.y = 0.35;
    this.talkButton.add(talkBase, this.talkRing, this.talkCap, this.talkGlow);
    this.talkButton.position.set(
      DESK.x - BUTTON_X,
      DESK.top,
      DESK.z + BUTTON_Z
    );
    this.talkButton.name = 'talk-button';
    scene.add(this.talkButton);

    // Stop: a square block that lights up while HAL is talking.
    const stopBase = new THREE.Mesh(
      new THREE.CylinderGeometry(0.44, 0.5, 0.14, 48),
      metal()
    );
    stopBase.position.y = 0.07;
    this.stopCap = new THREE.Mesh(
      new THREE.BoxGeometry(0.48, 0.16, 0.48),
      new THREE.MeshStandardMaterial({
        color: 0x15181c,
        emissive: 0xeef1f3,
        emissiveIntensity: 0.05,
        roughness: 0.35,
      })
    );
    this.stopCap.position.y = 0.2;
    this.stopButton.add(stopBase, this.stopCap);
    this.stopButton.position.set(
      DESK.x + BUTTON_X,
      DESK.top,
      DESK.z + BUTTON_Z
    );
    this.stopButton.name = 'stop-button';
    scene.add(this.stopButton);
  }

  /** World position of the next free slot (does not reserve it). */
  nextSlot(out = new THREE.Vector3()): THREE.Vector3 {
    return this.slotPosition(this.next, out);
  }

  private slotPosition(index: number, out: THREE.Vector3): THREE.Vector3 {
    const x = SLOTS_X[index % SLOTS_X.length] ?? 0;
    const z = SLOTS_Z[Math.floor(index / SLOTS_X.length)] ?? 0;
    return out.set(DESK.x + x, DESK.top + 0.02, DESK.z + z);
  }

  /** A fresh cartridge for an arm to carry. */
  makeCartridge(color: number): DeskItem {
    const part = partInstance('deliverable', () => {
      const box = new THREE.Mesh(
        new THREE.BoxGeometry(0.7, 0.12, 0.5),
        new THREE.MeshStandardMaterial({
          color: 0x0c0f13,
          emissive: color,
          emissiveIntensity: 0.4,
        })
      );
      box.position.y = 0.06;
      return box;
    });
    scene.add(part.object);
    return {
      object: part.object,
      model: part.model,
      color: new THREE.Color(color),
      born: clock.now,
      sinking: null,
    };
  }

  /** Set a carried cartridge down in the next slot. */
  deliver(item: DeskItem): THREE.Vector3 {
    const index = this.next;
    const previous = this.items[index];
    if (previous) previous.sinking = clock.now;
    this.items[index] = item;
    this.next = (this.next + 1) % this.items.length;
    const spot = this.slotPosition(index, new THREE.Vector3());
    item.object.position.copy(spot);
    item.object.quaternion.identity();
    item.born = clock.now;
    return spot;
  }

  /* ----------------------------- controls ----------------------------- */

  press(which: 'talk' | 'stop' | null): void {
    this.pressed = which;
  }

  setVoice(voice: DeskVoice): void {
    this.voice = voice;
  }

  update(dt: number, glow: THREE.Color, energy: number): void {
    this.desk.model?.update(dt, glow, 0.35 + energy * 0.5);
    for (let i = 0; i < this.items.length; i++) {
      const item = this.items[i];
      if (!item) continue;
      const fresh = clamp(1 - (clock.now - item.born) / 1.5, 0, 1);
      item.model?.update(dt, item.color, 0.4 + fresh * 2);
      if (item.sinking !== null) {
        const t = clock.now - item.sinking;
        item.object.position.y -= dt * 0.6;
        item.object.scale.setScalar(Math.max(0.01, 1 - t));
        if (t > 1) {
          item.model?.dispose();
          item.object.removeFromParent();
          if (this.items[i] === item) this.items[i] = null;
        }
      }
    }

    // Talk dome: sinks when pressed, swells and glows with your voice.
    const { recording, speaking, level, noMic, ready } = this.voice;
    const down = this.pressed === 'talk' || recording;
    const pulse = recording ? 0.5 + 0.5 * Math.sin(clock.now * 8) : 0;
    const capY = down ? 0.09 : 0.14;
    this.talkCap.position.y += (capY - this.talkCap.position.y) * damp(18, dt);
    const blink =
      noMic && !recording ? (Math.sin(clock.now * 6) > 0 ? 1 : 0.2) : 1;
    this.talkCap.material.emissive.set(
      noMic && !recording ? 0xf2b84b : 0xff2a1a
    );
    this.talkCap.material.emissiveIntensity =
      (ready || recording ? 0.6 : 0.15) + pulse * 0.6 + level * 2.5;
    this.talkCap.material.emissiveIntensity *= blink;
    this.talkRing.material.emissiveIntensity = recording
      ? 2 + level * 3
      : ready
        ? 1
        : 0.3;
    this.talkGlow.material.opacity =
      (recording ? 0.5 + level * 0.5 : ready ? 0.2 : 0.05) * blink;
    this.talkGlow.scale.setScalar(1.4 + level * 1.4 + pulse * 0.3);

    // Stop block: lit only while HAL talks.
    const stopY = this.pressed === 'stop' ? 0.15 : 0.2;
    this.stopCap.position.y += (stopY - this.stopCap.position.y) * damp(18, dt);
    this.stopCap.material.emissiveIntensity +=
      ((speaking ? 1.6 : 0.05) - this.stopCap.material.emissiveIntensity) *
      damp(8, dt);
  }

  dispose(): void {
    this.desk.model?.dispose();
    this.desk.object.removeFromParent();
    this.talkButton.removeFromParent();
    this.stopButton.removeFromParent();
    for (const item of this.items) {
      item?.model?.dispose();
      item?.object.removeFromParent();
    }
  }
}

/* -------------------------- hatch and core --------------------------- */

export const HATCH = { x: 0, z: -15, half: 1.5 } as const;
const PIT = { width: 5.2, depth: 3.6 } as const;
/** The core rises this far above the floor when the hatch is open. */
const CORE_RISE = 1.3;
/** Fits through the 3 × 3 opening with the doors hanging down. */
const CORE_RADIUS = 1.3;

/**
 * A hatch in the grid. When an agent needs the inner computer, the floor
 * panels swing down and the core rises up through the opening; HAL plugs a
 * cable into its crown and data runs down into it.
 */
export class Hatch {
  private open = 0;
  private readonly pivots: THREE.Group[] = [];
  private readonly lift = new THREE.Group();
  private readonly core: ReturnType<typeof partInstance>;
  private readonly coreHeight: number;
  private readonly crown: THREE.Sprite;
  private readonly light: THREE.PointLight;
  private readonly pit: THREE.Mesh;
  private readonly glow = new THREE.Color(STATE_COLORS.idle);
  private work = 0;

  constructor() {
    // Two doors hinged on the hatch's left and right edges.
    for (const side of [-1, 1] as const) {
      const pivot = new THREE.Group();
      pivot.position.set(
        HATCH.x + side * HATCH.half,
        ROOM.floor - 0.004,
        HATCH.z
      );
      const door = partInstance('floor.panel', () => {
        const slab = new THREE.Mesh(
          new THREE.BoxGeometry(1, 0.08, 2),
          new THREE.MeshStandardMaterial({
            color: 0x0a0c10,
            metalness: 0.6,
            roughness: 0.4,
          })
        );
        slab.position.set(0.5, -0.04, 0);
        return slab;
      });
      // Doors are modelled 1 × 2 extending +X from the hinge; scale to the
      // opening and flip the right one.
      door.object.scale.set(HATCH.half, 1, HATCH.half);
      if (side > 0) door.object.rotation.y = Math.PI;
      pivot.add(door.object);
      pivot.userData = { side, door };
      scene.add(pivot);
      this.pivots.push(pivot);
    }

    this.pit = new THREE.Mesh(
      new THREE.BoxGeometry(PIT.width, PIT.depth, PIT.width),
      new THREE.MeshStandardMaterial({
        color: 0x07090c,
        metalness: 0.5,
        roughness: 0.55,
        side: THREE.BackSide,
      })
    );
    this.pit.position.set(HATCH.x, ROOM.floor - PIT.depth / 2 - 0.01, HATCH.z);
    scene.add(this.pit);

    this.core = partInstance('core', () => {
      const column = new THREE.Mesh(
        new THREE.CylinderGeometry(0.6, 0.8, 2.4, 8),
        new THREE.MeshStandardMaterial({
          color: 0x111111,
          emissive: 0xff2a00,
          emissiveIntensity: 0.3,
        })
      );
      column.position.y = 1.2;
      return column;
    });
    // Fit whatever core Blender made into the opening, base on the lift.
    const box = new THREE.Box3().setFromObject(this.core.object);
    const size = box.getSize(new THREE.Vector3());
    const fit = CORE_RADIUS / Math.max(0.1, Math.max(size.x, size.z) / 2);
    this.core.object.scale.multiplyScalar(fit);
    this.core.object.position.y = -box.min.y * fit;
    this.coreHeight = size.y * fit;
    this.lift.add(this.core.object);
    this.lift.position.set(HATCH.x, this.liftHeight(0), HATCH.z);
    scene.add(this.lift);

    this.crown = glowSprite(STATE_COLORS.idle, 1.6, 0);
    this.crown.position.y = this.coreHeight + 0.1;
    this.lift.add(this.crown);

    this.light = new THREE.PointLight(STATE_COLORS.idle, 0, 10, 1.4);
    this.light.position.set(HATCH.x, ROOM.floor + 0.6, HATCH.z);
    scene.add(this.light);
  }

  private liftHeight(rise: number): number {
    const lowered = ROOM.floor - this.coreHeight - 0.05;
    const raised = ROOM.floor + CORE_RISE - this.coreHeight;
    return THREE.MathUtils.lerp(lowered, raised, rise);
  }

  dispose(): void {
    this.pivots.forEach(pivot => pivot.removeFromParent());
    this.pit.removeFromParent();
    this.core.model?.dispose();
    this.lift.removeFromParent();
    this.light.removeFromParent();
    gridUniforms.uHatch.value.w = 0;
  }

  /** The cable port on the core's crown. */
  get port(): THREE.Vector3 {
    return new THREE.Vector3(
      HATCH.x,
      this.lift.position.y + this.coreHeight + 0.05,
      HATCH.z
    );
  }

  /** A point on the risen core's flank, for an arm to probe. */
  surfacePoint(angle: number, out = new THREE.Vector3()): THREE.Vector3 {
    return out.set(
      HATCH.x + Math.cos(angle) * CORE_RADIUS * 0.85,
      this.lift.position.y + this.coreHeight * 0.7,
      HATCH.z + Math.sin(angle) * CORE_RADIUS * 0.85
    );
  }

  get isOpen(): boolean {
    return this.open > 0.9;
  }

  /** `demand` > 0 keeps it open; `work` 0..1 spins the core up. */
  update(dt: number, demand: number, work: number, color: THREE.Color): void {
    this.open = clamp(this.open + (demand > 0 ? dt * 1.2 : -dt * 0.9), 0, 1);
    // Doors swing first, then the core rises; closing runs in reverse.
    const swing = THREE.MathUtils.smootherstep(this.open, 0, 0.55) * 1.9;
    const rise = THREE.MathUtils.smootherstep(this.open, 0.45, 1);
    for (const pivot of this.pivots) {
      const side = (pivot.userData as { side: number }).side;
      pivot.rotation.z = side < 0 ? -swing : swing;
      pivot.visible = this.open > 0.001;
    }
    gridUniforms.uHatch.value.set(HATCH.x, HATCH.z, HATCH.half, this.open);
    const visible = this.open > 0.001;
    this.pit.visible = visible;
    this.lift.visible = visible;
    this.lift.position.y = this.liftHeight(rise);
    this.glow.lerp(color, damp(3, dt));
    this.work += (work - this.work) * damp(3, dt);
    this.light.color.copy(this.glow);
    this.light.intensity = rise * (8 + this.work * 30);
    this.crown.material.color.copy(this.glow);
    this.crown.material.opacity = rise * (0.25 + this.work * 0.5);
    if (this.core.model) {
      const busy = this.work > 0.4;
      this.core.model.play(
        busy ? 'processing' : 'idle',
        busy ? 'work' : 'idle'
      );
      this.core.model.update(dt, this.glow, 0.3 + this.work * 1.7);
    }
  }
}
