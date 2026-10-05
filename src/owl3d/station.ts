import * as THREE from 'three';
import { ROOM, STATE_COLORS } from './config';
import { UI_FONT, glowSprite, textSurface } from './fx';
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

export const DESK = { x: 0, z: -1.8, top: ROOM.floor + 0.9 } as const;
const SLOTS_X = [-2.2, -1.32, -0.44, 0.44, 1.32, 2.2];
const SLOTS_Z = [-0.75, -0.1];

interface DeskItem {
  object: THREE.Object3D;
  model: ModelInstance | null;
  color: THREE.Color;
  born: number;
  sinking: number | null;
}

export class Desk {
  private readonly desk: ReturnType<typeof partInstance>;
  private readonly screen: THREE.Mesh<
    THREE.PlaneGeometry,
    THREE.MeshBasicMaterial
  >;
  private readonly surface = textSurface(1400, 560);
  private readonly items: Array<DeskItem | null> = Array.from(
    { length: SLOTS_X.length * SLOTS_Z.length },
    () => null
  );
  private delivered = 0;
  private next = 0;
  private dirty = true;

  constructor() {
    this.desk = partInstance('desk', () => {
      const slab = new THREE.Mesh(
        new THREE.BoxGeometry(6, 0.12, 2.4),
        new THREE.MeshStandardMaterial({
          color: 0x15181d,
          metalness: 0.8,
          roughness: 0.3,
        })
      );
      slab.position.y = 0.84;
      return slab;
    });
    this.desk.object.position.set(DESK.x, ROOM.floor, DESK.z);
    scene.add(this.desk.object);

    // Holo screen above the emitter bar at the back of the desk.
    this.screen = new THREE.Mesh(
      new THREE.PlaneGeometry(2.4, 0.96),
      new THREE.MeshBasicMaterial({
        map: this.surface.texture,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        side: THREE.DoubleSide,
      })
    );
    // On the desk's right wing, angled in, so the room behind stays clear.
    this.screen.position.set(DESK.x + 2.1, DESK.top + 0.72, DESK.z - 0.75);
    this.screen.rotation.set(-0.08, -0.38, 0);
    this.screen.renderOrder = 12;
    scene.add(this.screen);
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

  /** Set a carried cartridge down in the next slot and log it on the screen. */
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
    this.delivered++;
    this.dirty = true;
    return spot;
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
    this.drawScreen();
  }

  dispose(): void {
    this.desk.model?.dispose();
    this.desk.object.removeFromParent();
    this.screen.removeFromParent();
    this.screen.material.dispose();
    this.surface.texture.dispose();
    for (const item of this.items) {
      item?.model?.dispose();
      item?.object.removeFromParent();
    }
  }

  /** One huge glyph: a check and how many pieces of work were delivered. */
  private drawScreen(): void {
    if (!this.dirty) return;
    this.dirty = false;
    const { canvas, g, texture } = this.surface;
    g.clearRect(0, 0, canvas.width, canvas.height);
    g.fillStyle = 'rgba(83,216,223,0.07)';
    g.fillRect(0, 0, canvas.width, canvas.height);
    g.strokeStyle = 'rgba(83,216,223,0.7)';
    g.lineWidth = 14;
    g.strokeRect(10, 10, canvas.width - 20, canvas.height - 20);
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.font = `800 380px ${UI_FONT}`;
    g.fillStyle = this.delivered ? '#62d995' : 'rgba(83,216,223,0.45)';
    g.fillText(
      this.delivered ? `✓ ${this.delivered}` : '✓',
      canvas.width / 2,
      canvas.height / 2 + 20
    );
    texture.needsUpdate = true;
  }
}

/* -------------------------- hatch and core --------------------------- */

export const HATCH = { x: 0, z: -14, half: 1.5 } as const;
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
