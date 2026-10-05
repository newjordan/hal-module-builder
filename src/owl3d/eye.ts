import * as THREE from 'three';
import type { EyePart } from './layerPlan';
import { canvasTexture } from './fx';

/**
 * The HAL Studio layer stack as a sphere lens.
 *
 * Every studio layer is drawn flat into its own texture (an orthographic
 * render of the 2D design, so equalizers and reactive layers stay live) and
 * that texture is UV-mapped onto a spherical shell. Shells nest inside the
 * lens opening, rear layers deepest, under a clear glass dome, so the eye
 * reads as a real lens with depth from every angle and in stereo.
 */

/** Radius of the lens opening in the shell (blender/build_owl3d_kit.py). */
export const LENS_RADIUS = 0.62;
const SHELL_BACK = 0.74;
const SHELL_FRONT = 0.9;
const DOME = 0.925;
const TEXTURE_SIZE = 512;

let eyeRenderer: THREE.WebGLRenderer | null = null;

/** The renderer used to draw layer textures; set once by main.ts. */
export function setEyeRenderer(renderer: THREE.WebGLRenderer): void {
  eyeRenderer = renderer;
}

const layerCamera = new THREE.OrthographicCamera(
  -LENS_RADIUS,
  LENS_RADIUS,
  LENS_RADIUS,
  -LENS_RADIUS,
  -1,
  1
);

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

/**
 * A spherical cap of radius `radius` whose rim has planar radius
 * LENS_RADIUS, facing +z, with UVs projected straight through the lens so a
 * flat layer texture lands where the studio drew it.
 */
function lensCap(radius: number): THREE.BufferGeometry {
  const opening = Math.asin(Math.min(1, LENS_RADIUS / radius));
  const geometry = new THREE.SphereGeometry(
    radius,
    64,
    24,
    0,
    Math.PI * 2,
    0,
    opening
  );
  geometry.rotateX(Math.PI / 2);
  const position = geometry.getAttribute('position');
  const uv = geometry.getAttribute('uv');
  for (let i = 0; i < position.count; i++) {
    uv.setXY(
      i,
      0.5 + position.getX(i) / (2 * LENS_RADIUS),
      0.5 + position.getY(i) / (2 * LENS_RADIUS)
    );
  }
  uv.needsUpdate = true;
  return geometry;
}

interface BarsRuntime {
  mesh: THREE.InstancedMesh;
  base: THREE.Color[];
  part: EyePart;
}

interface Layer {
  part: EyePart;
  flat: THREE.Object3D;
  scene: THREE.Scene;
  target: THREE.WebGLRenderTarget;
  shell: THREE.Mesh;
  live: boolean;
  drawn: boolean;
}

const matrix = new THREE.Matrix4();
const quaternion = new THREE.Quaternion();
const position = new THREE.Vector3();
const scale = new THREE.Vector3();
const Z_AXIS = new THREE.Vector3(0, 0, 1);
const mixed = new THREE.Color();
const savedClear = new THREE.Color();

export class LayerEye {
  readonly group = new THREE.Group();
  private readonly layers: Layer[] = [];
  private readonly bars: BarsRuntime[] = [];
  private readonly disposables: Array<{ dispose(): void }> = [];

  constructor(plan: readonly EyePart[]) {
    // The dark inside of the eye, so shells read against black.
    const socket = new THREE.Mesh(
      new THREE.SphereGeometry(SHELL_BACK - 0.02, 48, 24),
      new THREE.MeshStandardMaterial({ color: 0x020203, roughness: 0.9 })
    );
    this.group.add(socket);
    this.disposables.push(socket.geometry, socket.material);

    plan.forEach((part, index) => {
      const flat = this.buildFlat(part);
      if (!flat) return;
      flat.position.set(
        part.offsetX * LENS_RADIUS,
        part.offsetY * LENS_RADIUS,
        0
      );
      const scene = new THREE.Scene();
      scene.add(flat);
      const target = new THREE.WebGLRenderTarget(TEXTURE_SIZE, TEXTURE_SIZE, {
        samples: 4,
      });
      const radius = SHELL_BACK + part.depth * (SHELL_FRONT - SHELL_BACK);
      const geometry = lensCap(radius);
      const material = new THREE.MeshBasicMaterial({
        map: target.texture,
        transparent: true,
        opacity: 1,
        blending: part.additive ? THREE.AdditiveBlending : THREE.NormalBlending,
        depthWrite: false,
      });
      const shell = new THREE.Mesh(geometry, material);
      shell.renderOrder = 20 + index;
      this.group.add(shell);
      this.disposables.push(target, geometry, material);
      this.layers.push({
        part,
        flat,
        scene,
        target,
        shell,
        live: part.kind === 'bars' || part.reactive,
        drawn: false,
      });
    });

    // Clear glass over everything; picks up the room's reflections.
    const dome = new THREE.Mesh(
      lensCap(DOME),
      new THREE.MeshPhysicalMaterial({
        color: 0xffffff,
        roughness: 0.04,
        metalness: 0,
        clearcoat: 1,
        transparent: true,
        opacity: 0.14,
        depthWrite: false,
      })
    );
    dome.renderOrder = 20 + plan.length;
    this.group.add(dome);
    this.disposables.push(dome.geometry, dome.material);
  }

  private flatMaterial(
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
      toneMapped: false,
    });
    this.disposables.push(material);
    if (map) this.disposables.push(map);
    return material;
  }

  private buildFlat(part: EyePart): THREE.Object3D | null {
    const radius = Math.max(0.005, part.radius * LENS_RADIUS);

    if (part.kind === 'bars') return this.buildBars(part);

    if (part.kind === 'image') {
      const texture = new THREE.TextureLoader().load(part.src, () => {
        const layer = this.layers.find(item => item.part === part);
        if (layer) layer.drawn = false;
      });
      texture.colorSpace = THREE.SRGBColorSpace;
      const geometry = new THREE.PlaneGeometry(radius * 2, radius * 2);
      this.disposables.push(geometry);
      return new THREE.Mesh(geometry, this.flatMaterial(part, texture));
    }

    if (part.kind === 'ring') {
      const width = Math.max(0.006, part.inner * LENS_RADIUS);
      if (part.dash) {
        // Dashed strokes become ticks.
        const arc = (2 * Math.PI * radius) / part.dash.count;
        const geometry = new THREE.PlaneGeometry(
          Math.max(0.004, arc * part.dash.duty),
          width
        );
        this.disposables.push(geometry);
        const material = this.flatMaterial(part, null);
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
        this.flatMaterial(part, gradientTexture(part))
      );
    }

    const geometry =
      part.sides >= 3
        ? new THREE.CircleGeometry(radius, part.sides, Math.PI / 2)
        : new THREE.CircleGeometry(radius, 96);
    this.disposables.push(geometry);
    return new THREE.Mesh(
      geometry,
      this.flatMaterial(part, gradientTexture(part))
    );
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
    const mesh = new THREE.InstancedMesh(
      geometry,
      this.flatMaterial(part, null),
      part.barCount
    );
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
   * equalizers toward the agent's state color.
   */
  update(
    dt: number,
    now: number,
    energy: number,
    stateColor: THREE.Color,
    tint: number,
    speech: boolean
  ): void {
    for (const layer of this.layers) {
      const { part, flat, shell } = layer;
      // Spinning layers turn the whole shell, so the texture stays put.
      if (part.spin) shell.rotation.z += part.spin * dt * (1 + energy);
      if (part.reactive && part.kind !== 'bars') {
        flat.scale.setScalar(
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
    this.renderLayers();
  }

  /** Redraw live layers (and any not drawn yet) into their textures. */
  private renderLayers(): void {
    const renderer = eyeRenderer;
    if (!renderer) return;
    const previousTarget = renderer.getRenderTarget();
    const previousAlpha = renderer.getClearAlpha();
    renderer.getClearColor(savedClear);
    renderer.setClearColor(0x000000, 0);
    for (const layer of this.layers) {
      if (layer.drawn && !layer.live) continue;
      renderer.setRenderTarget(layer.target);
      renderer.clear();
      renderer.render(layer.scene, layerCamera);
      layer.drawn = true;
    }
    renderer.setRenderTarget(previousTarget);
    renderer.setClearColor(savedClear, previousAlpha);
  }

  dispose(): void {
    this.group.removeFromParent();
    this.disposables.forEach(item => item.dispose());
  }
}
