import * as THREE from 'three';
import type { PartName } from './manifest';
import { ModelInstance, modelLibrary } from './models';
import { glowSprite } from './fx';
import { clamp, damp, scene } from './stage';

/**
 * HAL's mechanics: swiss-army arms that unfold from the shell and reach for
 * whatever the agent is working on, and data cables that plug HAL into the
 * inner computer under the grid. Shapes come from the Blender kit
 * (blender/build_owl3d_kit.py); each part has a plain fallback.
 */

/** Segment lengths, matched to the Blender kit. */
export const UPPER_ARM = 0.9;
export const FOREARM = 0.8;

export type ToolHead =
  | 'gripper'
  | 'driver'
  | 'pen'
  | 'probe'
  | 'dish'
  | 'splitter';

/** Which head an agent tool calls for. */
export function headForTool(tool: string): ToolHead {
  if (/^bash|shell|exec|command/i.test(tool)) return 'driver';
  if (/edit|write|notebook|apply_patch/i.test(tool)) return 'pen';
  if (/read|grep|glob|search|^ls$|find|list/i.test(tool)) return 'probe';
  if (/web|fetch|http|browser/i.test(tool)) return 'dish';
  if (/agent|task|workflow|spawn/i.test(tool)) return 'splitter';
  return 'gripper';
}

/** Tools that move data rather than make things: they go down the cable. */
export function isDataTool(tool: string): boolean {
  const head = headForTool(tool);
  return head === 'probe' || head === 'dish';
}

const fallbackMetal = new THREE.MeshStandardMaterial({
  color: 0x1c2027,
  metalness: 0.9,
  roughness: 0.3,
});
const fallbackGlow = new THREE.MeshStandardMaterial({
  name: 'HAL_State_Fallback',
  color: 0x111111,
  emissive: 0xffffff,
});

/** A Blender part, or a simple stand-in with the same proportions. */
export function partInstance(
  name: PartName,
  fallback: () => THREE.Object3D
): {
  object: THREE.Object3D;
  model: ModelInstance | null;
} {
  const loaded = modelLibrary.part(name);
  if (loaded) {
    const model = new ModelInstance(loaded);
    return { object: model.root, model };
  }
  return { object: fallback(), model: null };
}

function segmentFallback(length: number, radius: number): THREE.Object3D {
  const group = new THREE.Group();
  const beam = new THREE.Mesh(
    new THREE.BoxGeometry(radius * 1.6, length, radius * 1.1),
    fallbackMetal
  );
  beam.position.y = length / 2;
  group.add(beam);
  return group;
}

const Y_AXIS = new THREE.Vector3(0, 1, 0);
const basis = new THREE.Matrix4();
const xAxis = new THREE.Vector3();
const yAxis = new THREE.Vector3();
const zAxis = new THREE.Vector3();
const tmp = new THREE.Vector3();

/** Orient `object` so its +Y runs from `from` along `dir`, hinge on `hinge`. */
function orientSegment(
  object: THREE.Object3D,
  from: THREE.Vector3,
  dir: THREE.Vector3,
  hinge: THREE.Vector3,
  size: number
): void {
  yAxis.copy(dir).normalize();
  xAxis.copy(hinge).addScaledVector(yAxis, -hinge.dot(yAxis));
  if (xAxis.lengthSq() < 1e-6) xAxis.set(1, 0, 0).cross(yAxis);
  xAxis.normalize();
  zAxis.crossVectors(xAxis, yAxis).normalize();
  basis.makeBasis(xAxis, yAxis, zAxis);
  object.quaternion.setFromRotationMatrix(basis);
  object.position.copy(from);
  object.scale.setScalar(size);
}

/**
 * A two-bone arm. The shoulder rides on the shell; the segments live in
 * world space and are solved each frame with analytic IK toward `reach()`.
 * With nothing to reach the arm folds under the shell like landing gear.
 */
export class Arm {
  private readonly upper: ReturnType<typeof partInstance>;
  private readonly fore: ReturnType<typeof partInstance>;
  private readonly shoulder: ReturnType<typeof partInstance>;
  private readonly wrist = new THREE.Group();
  private readonly heads = new Map<ToolHead, ReturnType<typeof partInstance>>();
  private head: ToolHead = 'gripper';
  private wantHead: ToolHead = 'gripper';
  private headScale = 1;
  private readonly target = new THREE.Vector3();
  private readonly goal = new THREE.Vector3();
  private reaching = false;
  private reachUntil = 0;
  private readonly elbow = new THREE.Vector3();
  readonly tip = new THREE.Vector3();
  private initialized = false;
  /** Something held at the tool tip (a deliverable on its way to the desk). */
  carried: THREE.Object3D | null = null;

  constructor(
    private readonly mount: THREE.Object3D,
    private readonly body: THREE.Object3D,
    private readonly side: -1 | 1
  ) {
    this.shoulder = partInstance('arm.shoulder', () => {
      const hub = new THREE.Mesh(
        new THREE.CylinderGeometry(0.16, 0.16, 0.18, 24),
        fallbackMetal
      );
      hub.rotation.z = Math.PI / 2;
      return hub;
    });
    mount.add(this.shoulder.object);
    this.upper = partInstance('arm.upper', () =>
      segmentFallback(UPPER_ARM, 0.085)
    );
    this.fore = partInstance('arm.fore', () => segmentFallback(FOREARM, 0.07));
    scene.add(this.upper.object, this.fore.object, this.wrist);
    const names: ToolHead[] = [
      'gripper',
      'driver',
      'pen',
      'probe',
      'dish',
      'splitter',
    ];
    for (const name of names) {
      const head = partInstance(`tool.${name}`, () => {
        const tip = new THREE.Mesh(
          new THREE.ConeGeometry(0.04, 0.3, 12),
          fallbackGlow
        );
        tip.position.y = 0.15;
        return tip;
      });
      head.object.visible = name === this.head;
      this.wrist.add(head.object);
      this.heads.set(name, head);
    }
  }

  /** Reach for a world point until `until` (clock seconds). */
  reach(point: THREE.Vector3, until: number, head?: ToolHead): void {
    this.goal.copy(point);
    this.reaching = true;
    this.reachUntil = until;
    if (head) this.wantHead = head;
  }

  rest(): void {
    this.reaching = false;
  }

  get extended(): boolean {
    return this.reaching;
  }

  update(
    now: number,
    dt: number,
    size: number,
    color: THREE.Color,
    toolColor: THREE.Color,
    energy: number
  ): void {
    const shoulder = this.mount.getWorldPosition(new THREE.Vector3());
    const bodyQuat = this.body.getWorldQuaternion(new THREE.Quaternion());
    const outward = new THREE.Vector3(this.side, 0, 0).applyQuaternion(
      bodyQuat
    );

    if (this.reaching && now > this.reachUntil) this.reaching = false;
    const desired = this.reaching
      ? this.goal
      : // Folded: tucked under and behind the shoulder.
        tmp
          .copy(shoulder)
          .add(
            new THREE.Vector3(this.side * 0.1, -0.2, -0.12)
              .applyQuaternion(bodyQuat)
              .multiplyScalar(size)
          );
    if (!this.initialized) {
      this.target.copy(desired);
      this.initialized = true;
    }
    this.target.lerp(desired, damp(this.reaching ? 7 : 4, dt));

    // Analytic two-bone IK in the plane of (target - shoulder) and the pole.
    const l1 = UPPER_ARM * size;
    const l2 = FOREARM * size;
    const toTarget = new THREE.Vector3().subVectors(this.target, shoulder);
    const distance = clamp(
      toTarget.length(),
      Math.abs(l1 - l2) + 0.02,
      l1 + l2 - 0.001
    );
    const dir =
      toTarget.lengthSq() > 1e-8
        ? toTarget.normalize()
        : new THREE.Vector3(0, -1, 0);
    // Elbows bow out and up when working, down and back when folded.
    const pole = this.reaching
      ? outward
          .clone()
          .multiplyScalar(0.8)
          .add(new THREE.Vector3(0, 0.6, 0))
      : new THREE.Vector3(0, -1, -0.4)
          .applyQuaternion(bodyQuat)
          .add(outward.clone().multiplyScalar(0.5));
    const bend = pole.addScaledVector(dir, -pole.dot(dir));
    if (bend.lengthSq() < 1e-6) bend.copy(outward);
    bend.normalize();
    const along = (l1 * l1 + distance * distance - l2 * l2) / (2 * distance);
    const height = Math.sqrt(Math.max(0, l1 * l1 - along * along));
    this.elbow
      .copy(shoulder)
      .addScaledVector(dir, along)
      .addScaledVector(bend, height);
    const reachPoint = new THREE.Vector3()
      .copy(shoulder)
      .addScaledVector(dir, distance);
    const foreDir = new THREE.Vector3()
      .subVectors(reachPoint, this.elbow)
      .normalize();
    this.tip.copy(this.elbow).addScaledVector(foreDir, l2);

    const hinge = new THREE.Vector3().crossVectors(dir, bend);
    orientSegment(
      this.upper.object,
      shoulder,
      new THREE.Vector3().subVectors(this.elbow, shoulder),
      hinge,
      size
    );
    orientSegment(this.fore.object, this.elbow, foreDir, hinge, size);
    orientSegment(this.wrist, this.tip, foreDir, hinge, size);

    // Swiss-army swap: fold the current head away, unfold the next.
    if (this.wantHead !== this.head) {
      this.headScale -= dt * 6;
      if (this.headScale <= 0) {
        const old = this.heads.get(this.head);
        if (old) old.object.visible = false;
        this.head = this.wantHead;
        const next = this.heads.get(this.head);
        if (next) next.object.visible = true;
        this.headScale = 0;
      }
    } else {
      this.headScale = Math.min(1, this.headScale + dt * 5);
    }
    const active = this.heads.get(this.head);
    if (active) {
      active.object.scale.setScalar(Math.max(0.001, this.headScale));
      active.object.rotation.y +=
        this.head === 'driver' && this.reaching ? dt * 14 : 0;
      active.model?.update(dt, toolColor, energy);
    }
    this.upper.model?.update(dt, color, energy);
    this.fore.model?.update(dt, color, energy);
    this.shoulder.model?.update(dt, color, energy);
    if (this.carried) {
      this.carried.position.copy(this.tip).addScaledVector(foreDir, 0.3 * size);
      this.carried.quaternion.slerp(new THREE.Quaternion(), damp(6, dt));
    }
  }

  dispose(): void {
    this.shoulder.model?.dispose();
    this.shoulder.object.removeFromParent();
    for (const part of [this.upper, this.fore]) {
      part.model?.dispose();
      part.object.removeFromParent();
    }
    this.heads.forEach(head => head.model?.dispose());
    this.wrist.removeFromParent();
    this.carried?.removeFromParent();
  }
}

/* ------------------------------- cables ------------------------------ */

const PACKETS = 18;

/**
 * A cable from a floor port up to HAL's cable socket. It extends out of the
 * floor when connected and carries glowing packets: down into the inner
 * computer (requests, thinking) or up into HAL (results).
 */
export class Cable {
  private readonly mesh: THREE.Mesh<
    THREE.BufferGeometry,
    THREE.MeshStandardMaterial
  >;
  private readonly plug: ReturnType<typeof partInstance>;
  private readonly packets: Array<{
    sprite: THREE.Sprite;
    t: number;
    dir: 1 | -1;
    live: boolean;
  }>;
  private extend = 0;
  private connected = false;
  private curve: THREE.CatmullRomCurve3 | null = null;
  private readonly glow = new THREE.Color();

  constructor() {
    this.mesh = new THREE.Mesh(
      new THREE.BufferGeometry(),
      // A lit conduit: it has to read against the dark room.
      new THREE.MeshStandardMaterial({
        color: 0x2a3038,
        metalness: 0.6,
        roughness: 0.35,
        emissive: 0x000000,
      })
    );
    this.mesh.visible = false;
    scene.add(this.mesh);
    this.plug = partInstance(
      'cable.plug',
      () =>
        new THREE.Mesh(
          new THREE.CylinderGeometry(0.07, 0.07, 0.2, 16),
          fallbackMetal
        )
    );
    this.plug.object.visible = false;
    scene.add(this.plug.object);
    this.packets = Array.from({ length: PACKETS }, () => {
      const sprite = glowSprite(0xffffff, 0.34, 0);
      sprite.visible = false;
      scene.add(sprite);
      return { sprite, t: 0, dir: 1 as const, live: false };
    });
  }

  connect(on: boolean): void {
    this.connected = on;
  }

  get attached(): boolean {
    return this.extend > 0.98;
  }

  /** Send a packet: -1 down into the floor, +1 up into HAL. */
  send(dir: 1 | -1, count = 1): void {
    let sent = 0;
    for (const packet of this.packets) {
      if (packet.live) continue;
      packet.live = true;
      packet.dir = dir;
      packet.t = dir < 0 ? 1 + sent * 0.08 : -sent * 0.08;
      if (++sent >= count) break;
    }
  }

  update(
    dt: number,
    port: THREE.Vector3,
    socket: THREE.Vector3,
    color: THREE.Color
  ): void {
    this.extend = clamp(
      this.extend + (this.connected ? dt * 1.6 : -dt * 2.2),
      0,
      1
    );
    const visible = this.extend > 0.001;
    this.mesh.visible = visible;
    this.plug.object.visible = visible;
    if (!visible) {
      this.packets.forEach(packet => {
        packet.live = false;
        packet.sprite.visible = false;
      });
      return;
    }
    // The cable rises out of the port and droops toward the socket.
    const rise = port.clone().setY(port.y + 1.1);
    const end = port.clone().lerp(socket, this.extend);
    end.y = THREE.MathUtils.lerp(port.y + 0.4, socket.y, this.extend);
    const mid = rise.clone().lerp(end, 0.5);
    mid.y = Math.min(rise.y, end.y) - 0.35;
    const points = [
      port.clone().setY(port.y - 0.8),
      port.clone(),
      rise,
      mid,
      end.clone().setY(end.y - 0.3),
      end,
    ];
    this.curve = new THREE.CatmullRomCurve3(points, false, 'centripetal');
    const geometry = new THREE.TubeGeometry(this.curve, 48, 0.06, 10, false);
    this.mesh.geometry.dispose();
    this.mesh.geometry = geometry;
    this.glow.copy(color).multiplyScalar(this.attached ? 0.45 : 0.25);
    this.mesh.material.emissive.copy(this.glow);

    const tangent = this.curve.getTangentAt(1);
    this.plug.object.position.copy(end).addScaledVector(tangent, -0.2);
    this.plug.object.quaternion.setFromUnitVectors(Y_AXIS, tangent);
    this.plug.model?.update(dt, color, 0.6);

    for (const packet of this.packets) {
      if (!packet.live) {
        packet.sprite.visible = false;
        continue;
      }
      packet.t += packet.dir * dt * 0.9;
      if (packet.t < 0 || packet.t > 1) {
        const done = packet.dir < 0 ? packet.t < 0 : packet.t > 1;
        if (done) {
          packet.live = false;
          packet.sprite.visible = false;
          continue;
        }
      }
      const t = clamp(packet.t, 0, 1);
      packet.sprite.visible = this.attached && packet.t >= 0 && packet.t <= 1;
      packet.sprite.position.copy(this.curve.getPointAt(t));
      packet.sprite.material.color.copy(color);
      packet.sprite.material.opacity = 0.95;
    }
  }

  dispose(): void {
    scene.remove(this.mesh, this.plug.object);
    this.mesh.geometry.dispose();
    this.mesh.material.dispose();
    this.plug.model?.dispose();
    this.packets.forEach(packet => scene.remove(packet.sprite));
  }
}
