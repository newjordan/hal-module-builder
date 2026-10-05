import * as THREE from 'three';
import { ROOM } from './config';
import { ModelInstance, modelLibrary } from './models';
import { floorPulse } from './world';
import { clamp, clock, pick, scene } from './stage';

/** Where each bot builds; slot index → plot center on the floor. */
export const PLOTS = [
  { cx: 3.9, cz: -12 },
  { cx: -3.9, cz: -12 },
  { cx: 3.9, cz: -18.5 },
  { cx: -3.9, cz: -18.5 },
] as const;

const CELL = 1.25;
const MAX_LEVEL = 5;
const BLOCK = 0.96;
const cubeGeometry = new THREE.BoxGeometry(BLOCK, BLOCK, BLOCK);
const cubeEdges = new THREE.EdgesGeometry(cubeGeometry);

interface Fadeable extends THREE.Material {
  opacity: number;
  transparent: boolean;
}

export class Block {
  readonly object: THREE.Object3D;
  readonly home: THREE.Vector3;
  readonly born = clock.now;
  flash = 1;
  sinkAt: number | null;
  private readonly glow: THREE.MeshStandardMaterial[] = [];
  private readonly fade: Fadeable[] = [];
  private readonly model: ModelInstance | null;

  constructor(
    position: THREE.Vector3,
    readonly color: number,
    readonly tool: string,
    readonly broken = false
  ) {
    this.home = position.clone();
    this.sinkAt = broken ? clock.now + 1.1 : null;
    const loaded = broken ? null : modelLibrary.buildFor(tool);
    if (loaded) {
      this.model = new ModelInstance(loaded);
      const holder = new THREE.Group();
      // Fit the Blender block into one build cell, resting on its base.
      const fit = (BLOCK / loaded.size) * loaded.entry.scale;
      this.model.root.scale.setScalar(fit / loaded.entry.scale);
      this.model.root.position.y = -BLOCK / 2;
      holder.add(this.model.root);
      this.object = holder;
      for (const material of this.model.ownMaterials()) {
        const fadeable = material as Fadeable;
        fadeable.transparent = true;
        this.fade.push(fadeable);
        if (material instanceof THREE.MeshStandardMaterial)
          this.glow.push(material);
      }
      this.model.play('processing', 'build');
    } else {
      this.model = null;
      const material = new THREE.MeshStandardMaterial({
        color: 0x0c1016,
        emissive: color,
        emissiveIntensity: 1.6,
        metalness: 0.4,
        roughness: 0.35,
        transparent: true,
      });
      const cube = new THREE.Mesh(cubeGeometry, material);
      const edgeMaterial = new THREE.LineBasicMaterial({
        color,
        transparent: true,
        opacity: 0.95,
      });
      cube.add(new THREE.LineSegments(cubeEdges, edgeMaterial));
      this.glow.push(material);
      this.fade.push(material, edgeMaterial);
      this.object = cube;
    }
    this.object.position.copy(position);
    this.object.scale.setScalar(0.01);
    scene.add(this.object);
    blocks.add(this);
  }

  get position(): THREE.Vector3 {
    return this.object.position;
  }

  get alive(): boolean {
    return blocks.has(this);
  }

  /** Returns false once the block has sunk away and been removed. */
  update(now: number, dt: number): boolean {
    const grow = clamp((now - this.born) / 0.45, 0, 1);
    const pop = grow < 1 ? 1 - Math.pow(1 - grow, 3) * Math.cos(grow * 9) : 1;
    this.flash *= Math.exp(-dt * 2.5);
    for (const material of this.glow) {
      if (this.broken)
        material.emissive.set(Math.sin(now * 30) > 0 ? 0xff2020 : 0x400000);
      else if (!this.model)
        material.emissiveIntensity = 0.18 + this.flash * 1.4;
    }
    if (this.model)
      this.model.update(dt, new THREE.Color(this.color), 0.3 + this.flash);
    if (this.broken)
      this.object.position.x = this.home.x + Math.sin(now * 70) * 0.05;

    if (this.sinkAt !== null && now > this.sinkAt) {
      const t = now - this.sinkAt;
      this.object.position.y = this.home.y - t * t * 6;
      this.object.rotation.x += dt * (this.broken ? 3 : 0.4);
      const opacity = clamp(1 - t / 1.1, 0, 1);
      this.fade.forEach(material => (material.opacity = opacity));
      if (t > 1.1) {
        this.dispose();
        return false;
      }
    }
    this.object.scale.setScalar(Math.max(0.01, pop));
    return true;
  }

  dispose(): void {
    blocks.delete(this);
    scene.remove(this.object);
    this.model?.dispose();
    if (!this.model) this.fade.forEach(material => material.dispose());
  }
}

const blocks = new Set<Block>();

export function updateBlocks(now: number, dt: number): void {
  for (const block of [...blocks]) block.update(now, dt);
}

export interface Slot {
  cell: number;
  level: number;
}

export class Plot {
  private columns: Array<Array<Block | null>> = Array.from(
    { length: 9 },
    () => []
  );

  constructor(
    readonly cx: number,
    readonly cz: number
  ) {}

  position(slot: Slot, out = new THREE.Vector3()): THREE.Vector3 {
    const i = slot.cell % 3;
    const j = Math.floor(slot.cell / 3);
    return out.set(
      this.cx + (i - 1) * CELL,
      ROOM.floor + 0.5 + slot.level,
      this.cz + (j - 1) * CELL
    );
  }

  /** Reserve the lowest open slot; a full plot collapses and starts over. */
  reserve(): Slot {
    const min = Math.min(...this.columns.map(column => column.length));
    if (min >= MAX_LEVEL) {
      this.collapse();
      return this.reserve();
    }
    const open = this.columns.flatMap((column, cell) =>
      column.length === min ? [cell] : []
    );
    const cell = pick(open);
    this.columns[cell]?.push(null);
    return { cell, level: min };
  }

  fill(slot: Slot, block: Block): void {
    const column = this.columns[slot.cell];
    const index = column?.indexOf(null) ?? -1;
    if (column && index >= 0) column[index] = block;
  }

  /** Give back a reserved slot that never got a block (broken builds). */
  release(slot: Slot): void {
    const column = this.columns[slot.cell];
    const index = column?.lastIndexOf(null) ?? -1;
    if (column && index >= 0 && index === column.length - 1) column.pop();
  }

  top(): Block | null {
    const tops = this.columns
      .map(column => column[column.length - 1])
      .filter((block): block is Block => block instanceof Block && block.alive);
    return tops.length ? pick(tops) : null;
  }

  collapse(): void {
    let delay = 0;
    for (const column of this.columns) {
      for (const block of [...column].reverse()) {
        if (block) block.sinkAt = clock.now + delay;
        delay += 0.04;
      }
    }
    this.columns = Array.from({ length: 9 }, () => []);
    floorPulse(this.cx, this.cz, 0x2a5a80, 1.2);
  }

  clear(): void {
    this.columns.flat().forEach(block => {
      if (block) block.sinkAt = clock.now;
    });
    this.columns = Array.from({ length: 9 }, () => []);
  }
}
