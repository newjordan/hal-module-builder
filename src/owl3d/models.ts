import * as THREE from 'three';
import {
  GLTFLoader,
  type GLTF,
} from 'three/examples/jsm/loaders/GLTFLoader.js';
import { clone as cloneSkinned } from 'three/examples/jsm/utils/SkeletonUtils.js';
import {
  buildsTool,
  clipFor,
  parseManifest,
  type ModelEntry,
  type PartName,
  type Socket,
} from './manifest';

/**
 * Blender models for the portal. Export glTF 2.0 (.glb) into
 * public/owl3d/models/ and list it in manifest.json; see docs/owl3d.md.
 */

export const MODELS_BASE = `${import.meta.env.BASE_URL}owl3d/models/`;

export interface LoadedModel {
  entry: ModelEntry;
  gltf: GLTF;
  /** Largest bounding-box dimension of the untransformed scene. */
  size: number;
}

function tintedMaterials(
  root: THREE.Object3D,
  prefix: string
): THREE.MeshStandardMaterial[] {
  const tinted: THREE.MeshStandardMaterial[] = [];
  root.traverse(child => {
    const mesh = child as THREE.Mesh;
    if (!mesh.isMesh) return;
    const swap = (material: THREE.Material): THREE.Material => {
      if (
        !material.name.startsWith(prefix) ||
        !(material instanceof THREE.MeshStandardMaterial)
      ) {
        return material;
      }
      const copy = material.clone();
      tinted.push(copy);
      return copy;
    };
    mesh.material = Array.isArray(mesh.material)
      ? mesh.material.map(swap)
      : swap(mesh.material);
  });
  return tinted;
}

/** One placed copy of a model with its own animation state. */
export class ModelInstance {
  readonly root: THREE.Object3D;
  readonly entry: ModelEntry;
  private readonly mixer: THREE.AnimationMixer | null;
  private readonly actions = new Map<string, THREE.AnimationAction>();
  private readonly tinted: THREE.MeshStandardMaterial[];
  private current: string | null = null;
  private orbitAngle = Math.random() * Math.PI * 2;

  constructor(model: LoadedModel) {
    this.entry = model.entry;
    const holder = new THREE.Group();
    const scene = cloneSkinned(model.gltf.scene);
    holder.add(scene);
    holder.name = `model:${model.entry.id}`;
    const [px, py, pz] = model.entry.position;
    const [rx, ry, rz] = model.entry.rotation.map(THREE.MathUtils.degToRad) as [
      number,
      number,
      number,
    ];
    scene.position.set(px, py, pz);
    scene.rotation.set(rx, ry, rz);
    scene.scale.setScalar(model.entry.scale);
    this.root = holder;
    this.tinted =
      model.entry.tint === 'none'
        ? []
        : tintedMaterials(
            scene,
            model.entry.tint === 'tool' ? 'HAL_Tool' : 'HAL_State'
          );
    if (model.gltf.animations.length) {
      this.mixer = new THREE.AnimationMixer(scene);
      for (const clip of model.gltf.animations)
        this.actions.set(clip.name, this.mixer.clipAction(clip));
    } else {
      this.mixer = null;
    }
  }

  /** Crossfade to the clip mapped for this state/activity, if any. */
  play(state: string, activity: string): void {
    if (!this.mixer) return;
    const name = clipFor(this.entry, state, activity);
    if (name === this.current) return;
    const next = name ? this.actions.get(name) : undefined;
    const previous = this.current ? this.actions.get(this.current) : undefined;
    this.current = next ? name : null;
    if (next) {
      next.reset().fadeIn(0.35).play();
    }
    previous?.fadeOut(0.35);
  }

  update(dt: number, color: THREE.Color, energy: number): void {
    this.mixer?.update(dt);
    if (this.entry.spin) this.root.rotation.y += this.entry.spin * dt;
    if (this.entry.attach === 'eye.orbit') {
      this.orbitAngle += this.entry.orbitSpeed * dt * (1 + energy);
      const r = this.entry.orbitRadius;
      this.root.position.set(
        Math.cos(this.orbitAngle) * r,
        Math.sin(this.orbitAngle * 0.7) * 0.35,
        Math.sin(this.orbitAngle) * r
      );
    }
    for (const material of this.tinted) {
      material.emissive.copy(color);
      material.emissiveIntensity = 0.6 + energy * 1.8;
    }
  }

  /**
   * An empty named in Blender (socket_arm_L …). Blender suffixes duplicate
   * names (.001), so the suffix is ignored.
   */
  socket(name: string): THREE.Object3D | null {
    let found: THREE.Object3D | null = null;
    this.root.traverse(child => {
      if (!found && child.name.replace(/\.\d+$/, '') === name) found = child;
    });
    return found;
  }

  /** Materials for fading/flashing build blocks. */
  materials(): THREE.Material[] {
    const all: THREE.Material[] = [];
    this.root.traverse(child => {
      const mesh = child as THREE.Mesh;
      if (!mesh.isMesh) return;
      const list = Array.isArray(mesh.material)
        ? mesh.material
        : [mesh.material];
      list.forEach(material => {
        if (!all.includes(material)) all.push(material);
      });
    });
    return all;
  }

  dispose(): void {
    this.mixer?.stopAllAction();
    this.root.removeFromParent();
    this.tinted.forEach(material => material.dispose());
  }
}

export class ModelLibrary extends EventTarget {
  models: LoadedModel[] = [];
  errors: string[] = [];
  private readonly loader = new GLTFLoader();
  private signature = '';
  private loading = false;

  async load(): Promise<void> {
    if (this.loading) return;
    this.loading = true;
    try {
      const response = await fetch(`${MODELS_BASE}manifest.json`, {
        cache: 'no-store',
      });
      if (!response.ok) {
        this.models = [];
        this.errors =
          response.status === 404
            ? []
            : [`manifest.json: HTTP ${response.status}`];
      } else {
        const { models, errors } = parseManifest(await response.json());
        const results = await Promise.allSettled(
          models.map(async entry => {
            const gltf = await this.loader.loadAsync(
              `${MODELS_BASE}${entry.file}?v=${Date.now()}`
            );
            const box = new THREE.Box3().setFromObject(gltf.scene);
            const dims = box.getSize(new THREE.Vector3());
            return {
              entry,
              gltf,
              size: Math.max(dims.x, dims.y, dims.z, 0.001),
            };
          })
        );
        this.models = [];
        this.errors = [...errors];
        results.forEach((result, i) => {
          if (result.status === 'fulfilled') this.models.push(result.value);
          else
            this.errors.push(
              `${models[i]?.file ?? 'model'}: ${String(result.reason?.message ?? result.reason)}`
            );
        });
      }
    } catch (error) {
      this.errors = [
        `manifest.json: ${error instanceof Error ? error.message : String(error)}`,
      ];
    } finally {
      this.loading = false;
    }
    // The file list may have changed; the watcher re-baselines next tick.
    this.signature = '';
    if (this.errors.length)
      console.warn('[owl3d] model issues:\n' + this.errors.join('\n'));
    this.dispatchEvent(new Event('change'));
  }

  forSocket(socket: Socket): LoadedModel[] {
    return this.models.filter(model => model.entry.attach === socket);
  }

  part(name: PartName): LoadedModel | null {
    return this.models.find(model => model.entry.part === name) ?? null;
  }

  buildFor(tool: string): LoadedModel | null {
    return (
      this.models.find(
        model => model.entry.attach === 'build' && buildsTool(model.entry, tool)
      ) ?? null
    );
  }

  /**
   * Reload when the manifest or any model file changes, so a Blender export
   * shows up live. Uses validators the dev server and the Electron shell send.
   */
  watch(intervalMs = 2000): () => void {
    let stopped = false;
    const check = async () => {
      if (stopped) return;
      try {
        const files = [
          'manifest.json',
          ...this.models.map(model => model.entry.file),
        ];
        const parts = await Promise.all(
          files.map(async file => {
            const response = await fetch(`${MODELS_BASE}${file}`, {
              method: 'HEAD',
              cache: 'no-store',
            });
            return [
              file,
              response.status,
              response.headers.get('etag'),
              response.headers.get('last-modified'),
              response.headers.get('content-length'),
            ].join(':');
          })
        );
        const signature = parts.join('|');
        if (this.signature && signature !== this.signature) await this.load();
        else this.signature = signature;
      } catch {
        /* the dev server restarting is not an error worth surfacing */
      }
      if (!stopped) window.setTimeout(check, intervalMs);
    };
    void check();
    return () => {
      stopped = true;
    };
  }
}

export const modelLibrary = new ModelLibrary();
