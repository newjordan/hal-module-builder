import * as THREE from 'three';
import type { EyePart } from './layerPlan';
import { canvasTexture } from './fx';

/**
 * The HAL Studio layer stack as a physical lens assembly. Layers sit inside a
 * recess in the bot's shell, rear layers deeper, so on a stereo display you
 * look *into* the eye.
 */

export const LENS_RADIUS = 0.64;
const Z_BACK = 0.3;
const Z_SPAN = 0.38;

function gradientTexture(part: EyePart): THREE.CanvasTexture {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const g = canvas.getContext('2d');
  if (!g) throw new Error('2D canvas unavailable');
  const r = size / 2;
  let fill: string | CanvasGradient = part.colors[0] ?? '#ffffff';
  if (part.gradient === 'radial') {
    fill = g.createRadialGradient(r, r, 0, r, r, r);
  } else if (part.gradient === 'linear') {
    fill = g.createLinearGradient(0, 0, size, size);
  } else if (part.gradient === 'conic') {
    fill = g.createConicGradient(-Math.PI / 2, r, r);
  }
  if (typeof fill !== 'string') {
    const gradient = fill;
    part.colors.forEach((color, i) => {
      const stop = part.stops[i] ?? i / Math.max(1, part.colors.length - 1);
      try {
        gradient.addColorStop(Math.min(1, Math.max(0, stop)), color);
      } catch {
        /* an unparseable studio color just drops that stop */
      }
    });
  }
  g.fillStyle = fill;
  g.fillRect(0, 0, size, size);
  return canvasTexture(canvas);
}

interface BarsRuntime {
  mesh: THREE.InstancedMesh;
  base: THREE.Color[];
  part: EyePart;
}

interface PartRuntime {
  object: THREE.Object3D;
  part: EyePart;
}

const matrix = new THREE.Matrix4();
const quaternion = new THREE.Quaternion();
const position = new THREE.Vector3();
const scale = new THREE.Vector3();
const Z_AXIS = new THREE.Vector3(0, 0, 1);
const mixed = new THREE.Color();

export class LayerEye {
  readonly group = new THREE.Group();
  private readonly parts: PartRuntime[] = [];
  private readonly bars: BarsRuntime[] = [];
  private readonly disposables: Array<{ dispose(): void }> = [];

  constructor(plan: readonly EyePart[]) {
    plan.forEach((part, index) => {
      const object = this.build(part);
      if (!object) return;
      object.position.set(
        part.offsetX * LENS_RADIUS,
        part.offsetY * LENS_RADIUS,
        Z_BACK + part.depth * Z_SPAN
      );
      object.renderOrder = 20 + index;
      object.traverse(child => (child.renderOrder = 20 + index));
      this.group.add(object);
      this.parts.push({ object, part });
    });
  }

  private material(
    part: EyePart,
    map: THREE.Texture | null
  ): THREE.MeshBasicMaterial {
    const material = new THREE.MeshBasicMaterial({
      map,
      transparent: true,
      opacity: part.opacity,
      blending: part.additive ? THREE.AdditiveBlending : THREE.NormalBlending,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    this.disposables.push(material);
    if (map) this.disposables.push(map);
    return material;
  }

  private build(part: EyePart): THREE.Object3D | null {
    const radius = Math.max(0.005, part.radius * LENS_RADIUS);

    if (part.kind === 'bars') return this.buildBars(part);

    if (part.kind === 'image') {
      const texture = new THREE.TextureLoader().load(part.src);
      texture.colorSpace = THREE.SRGBColorSpace;
      const geometry = new THREE.PlaneGeometry(radius * 2, radius * 2);
      this.disposables.push(geometry);
      return new THREE.Mesh(geometry, this.material(part, texture));
    }

    if (part.kind === 'ring') {
      const width = Math.max(0.006, part.inner * LENS_RADIUS);
      if (part.dash) {
        // Dashed strokes become ticks, which read far better in depth.
        const arc = (2 * Math.PI * radius) / part.dash.count;
        const geometry = new THREE.PlaneGeometry(
          Math.max(0.004, arc * part.dash.duty),
          width
        );
        this.disposables.push(geometry);
        const material = this.material(part, null);
        material.color.set(part.colors[0] ?? '#ffffff');
        const ticks = new THREE.InstancedMesh(
          geometry,
          material,
          part.dash.count
        );
        for (let i = 0; i < part.dash.count; i++) {
          const angle = (i / part.dash.count) * Math.PI * 2;
          quaternion.setFromAxisAngle(Z_AXIS, angle - Math.PI / 2);
          position.set(
            Math.cos(angle) * (radius - width / 2),
            Math.sin(angle) * (radius - width / 2),
            0
          );
          ticks.setMatrixAt(
            i,
            matrix.compose(position, quaternion, scale.set(1, 1, 1))
          );
        }
        return ticks;
      }
      const geometry = new THREE.RingGeometry(
        Math.max(0, radius - width),
        radius,
        128,
        1
      );
      this.disposables.push(geometry);
      return new THREE.Mesh(
        geometry,
        this.material(part, gradientTexture(part))
      );
    }

    const geometry =
      part.sides >= 3
        ? new THREE.CircleGeometry(radius, part.sides, Math.PI / 2)
        : new THREE.CircleGeometry(radius, 96);
    this.disposables.push(geometry);
    return new THREE.Mesh(geometry, this.material(part, gradientTexture(part)));
  }

  private buildBars(part: EyePart): THREE.Object3D {
    const inner = part.inner * LENS_RADIUS;
    const circumference = 2 * Math.PI * Math.max(inner, 0.05);
    const width =
      part.barStyle === 'line'
        ? 0.008
        : Math.max(0.006, (circumference / part.barCount) * 0.55);
    const geometry =
      part.barStyle === 'dot'
        ? new THREE.CircleGeometry(
            Math.max(0.006, (circumference / part.barCount) * 0.32),
            10
          )
        : new THREE.PlaneGeometry(width, 1).translate(0, 0.5, 0);
    this.disposables.push(geometry);
    const material = this.material(part, null);
    const mesh = new THREE.InstancedMesh(geometry, material, part.barCount);
    const first = new THREE.Color(part.colors[0] ?? '#ff2a00');
    const last = new THREE.Color(part.colors[1] ?? part.colors[0] ?? '#ffa040');
    const base: THREE.Color[] = [];
    for (let i = 0; i < part.barCount; i++) {
      // Mirror the gradient so the ring has no seam.
      const t = 1 - Math.abs((i / part.barCount) * 2 - 1);
      const color = first.clone().lerp(last, t);
      base.push(color);
      mesh.setColorAt(i, color);
    }
    this.bars.push({ mesh, base, part });
    return mesh;
  }

  /**
   * `energy` 0..1 stands in for the studio's audio input; `tint` blends the
   * reactive layers toward the agent's state color.
   */
  update(
    dt: number,
    now: number,
    energy: number,
    stateColor: THREE.Color,
    tint: number,
    speech: boolean
  ): void {
    for (const { object, part } of this.parts) {
      if (part.spin) object.rotation.z += part.spin * dt * (1 + energy);
      if (part.reactive && part.kind !== 'bars') {
        object.scale.setScalar(
          1 + energy * 0.07 * (0.6 + 0.4 * Math.sin(now * 7 + part.depth * 5))
        );
      }
    }
    for (const { mesh, base, part } of this.bars) {
      const inner = part.inner * LENS_RADIUS;
      const maxHeight = Math.max(0.01, part.barHeight * LENS_RADIUS);
      for (let i = 0; i < part.barCount; i++) {
        const angle = (i / part.barCount) * Math.PI * 2;
        const wave =
          (0.5 + 0.5 * Math.sin(i * 1.7 + now * (3 + energy * 9))) *
          (0.5 + 0.5 * Math.sin(i * 0.37 - now * 2.3));
        const level =
          0.12 +
          energy * (0.25 + 0.75 * wave) +
          (speech ? Math.random() * 0.5 * energy : 0);
        quaternion.setFromAxisAngle(Z_AXIS, angle - Math.PI / 2);
        if (part.barStyle === 'dot') {
          const r = inner + maxHeight * Math.min(1.2, level);
          position.set(Math.cos(angle) * r, Math.sin(angle) * r, 0);
          scale.set(1, 1, 1);
        } else {
          position.set(Math.cos(angle) * inner, Math.sin(angle) * inner, 0);
          scale.set(1, maxHeight * Math.min(1.4, level), 1);
        }
        mesh.setMatrixAt(i, matrix.compose(position, quaternion, scale));
        const designColor = base[i];
        if (designColor)
          mesh.setColorAt(i, mixed.copy(designColor).lerp(stateColor, tint));
      }
      mesh.instanceMatrix.needsUpdate = true;
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    }
  }

  dispose(): void {
    this.group.removeFromParent();
    this.disposables.forEach(item => item.dispose());
  }
}
