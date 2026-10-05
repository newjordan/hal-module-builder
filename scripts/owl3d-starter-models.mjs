/**
 * Generates the starter Owl3D models in public/owl3d/models/.
 *
 * These follow the same conventions as a Blender export (docs/owl3d.md):
 * materials named HAL_State* / HAL_Tool* get recolored live, and animation
 * clips are named so the manifest can map agent states onto them. Replace
 * any of them with your own .glb from Blender; keep the manifest entry.
 *
 *   node scripts/owl3d-starter-models.mjs
 */
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as THREE from 'three';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';

// GLTFExporter reads Blobs through FileReader, which Node lacks.
globalThis.FileReader ??= class {
  readAsArrayBuffer(blob) {
    blob.arrayBuffer().then(buffer => {
      this.result = buffer;
      this.onloadend?.();
    });
  }
  readAsDataURL(blob) {
    blob.arrayBuffer().then(buffer => {
      this.result = `data:${blob.type};base64,${Buffer.from(buffer).toString('base64')}`;
      this.onloadend?.();
    });
  }
};

const OUT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'public', 'owl3d', 'models');

const metal = (color = 0x2a2e36) =>
  new THREE.MeshStandardMaterial({ name: 'Metal', color, metalness: 0.9, roughness: 0.3 });
const chrome = () => new THREE.MeshStandardMaterial({ name: 'Chrome', color: 0xc8ccd4, metalness: 1, roughness: 0.15 });
const glow = name =>
  new THREE.MeshStandardMaterial({ name, color: 0x111111, emissive: 0xffffff, emissiveIntensity: 1, roughness: 0.4 });

function mesh(name, geometry, material, position = [0, 0, 0]) {
  const object = new THREE.Mesh(geometry, material);
  object.name = name;
  object.position.set(...position);
  return object;
}

const quat = (x, y, z) => new THREE.Quaternion().setFromEuler(new THREE.Euler(x, y, z)).toArray();

function rotationClip(name, node, duration, keys) {
  const times = keys.map((_, i) => (i / (keys.length - 1)) * duration);
  return new THREE.AnimationClip(name, duration, [
    new THREE.QuaternionKeyframeTrack(`${node}.quaternion`, times, keys.flatMap(([x, y, z]) => quat(x, y, z))),
  ]);
}

function scaleClip(name, node, duration, values) {
  const times = values.map((_, i) => (i / (values.length - 1)) * duration);
  return new THREE.AnimationClip(name, duration, [
    new THREE.VectorKeyframeTrack(`${node}.scale`, times, values.flatMap(s => [s, s, s])),
  ]);
}

/** eye.top — a little antenna whose tip glows in the agent's state color. */
function antenna() {
  const root = new THREE.Group();
  root.name = 'Antenna';
  const stalk = new THREE.Group();
  stalk.name = 'Stalk';
  stalk.add(mesh('Base', new THREE.CylinderGeometry(0.09, 0.12, 0.08, 24), chrome(), [0, 0.04, 0]));
  stalk.add(mesh('Rod', new THREE.CylinderGeometry(0.018, 0.022, 0.55, 12), metal(), [0, 0.35, 0]));
  stalk.add(mesh('Tip', new THREE.SphereGeometry(0.065, 24, 16), glow('HAL_State_Tip'), [0, 0.65, 0]));
  root.add(stalk);
  const animations = [
    rotationClip('Idle', 'Stalk', 4, [[0, 0, 0.08], [0, 0, -0.08], [0, 0, 0.08]]),
    rotationClip('Work', 'Stalk', 0.6, [[0.12, 0, 0.18], [-0.12, 0, -0.18], [0.12, 0, 0.18]]),
    rotationClip('Celebrate', 'Stalk', 0.8, [[0, 0, 0], [0, Math.PI, 0.3], [0, Math.PI * 2, 0]]),
  ];
  return { root, animations };
}

/** eye.orbit — a satellite drone circling the eye. */
function drone() {
  const root = new THREE.Group();
  root.name = 'Drone';
  root.add(mesh('Body', new THREE.BoxGeometry(0.16, 0.12, 0.16), metal(0x3a3f48)));
  const panelMaterial = new THREE.MeshStandardMaterial({ name: 'Panel', color: 0x1b3a6a, metalness: 0.6, roughness: 0.25 });
  root.add(mesh('PanelL', new THREE.BoxGeometry(0.26, 0.012, 0.12), panelMaterial, [-0.22, 0, 0]));
  root.add(mesh('PanelR', new THREE.BoxGeometry(0.26, 0.012, 0.12), panelMaterial, [0.22, 0, 0]));
  root.add(mesh('Beacon', new THREE.SphereGeometry(0.035, 16, 12), glow('HAL_State_Beacon'), [0, 0.08, 0]));
  return { root, animations: [scaleClip('Blink', 'Beacon', 1.2, [1, 1, 1.8, 1, 1])] };
}

/** build — a server block; Bash work stacks these. Origin at the base. */
function server() {
  const root = new THREE.Group();
  root.name = 'Server';
  root.add(mesh('Chassis', new THREE.BoxGeometry(0.9, 0.9, 0.9), metal(0x161a20), [0, 0.45, 0]));
  for (let i = 0; i < 4; i++) {
    root.add(mesh(`Bay${i}`, new THREE.BoxGeometry(0.78, 0.13, 0.02), metal(0x22272f), [0, 0.15 + i * 0.2, 0.455]));
    root.add(mesh(`Led${i}`, new THREE.BoxGeometry(0.5, 0.025, 0.02), glow('HAL_Tool_Led'), [-0.1, 0.15 + i * 0.2, 0.47]));
  }
  return { root, animations: [] };
}

/** build — a document slab; Edit/Write work stacks these. */
function page() {
  const root = new THREE.Group();
  root.name = 'Page';
  root.add(mesh('Slab', new THREE.BoxGeometry(0.9, 0.9, 0.9), metal(0x12161c), [0, 0.45, 0]));
  [0.75, 0.6, 0.45, 0.3].forEach((y, i) => {
    const width = i === 3 ? 0.4 : 0.7;
    root.add(mesh(`Line${i}`, new THREE.BoxGeometry(width, 0.04, 0.02), glow('HAL_Tool_Text'), [(width - 0.7) / 2, y, 0.46]));
  });
  return { root, animations: [] };
}

/** world — a terminal pylon standing at the back of the room. */
function pylon() {
  const root = new THREE.Group();
  root.name = 'Pylon';
  root.add(mesh('Plinth', new THREE.CylinderGeometry(0.7, 0.85, 0.3, 6), metal(0x1d2128), [0, 0.15, 0]));
  root.add(mesh('Column', new THREE.CylinderGeometry(0.22, 0.3, 4.2, 6), metal(0x262b33), [0, 2.4, 0]));
  const ring = new THREE.Group();
  ring.name = 'HaloRing';
  ring.position.set(0, 4.7, 0);
  ring.add(mesh('Halo', new THREE.TorusGeometry(0.55, 0.05, 12, 48), glow('HAL_State_Halo')));
  root.add(ring);
  root.add(mesh('Core', new THREE.SphereGeometry(0.28, 24, 16), glow('HAL_State_Core'), [0, 4.7, 0]));
  return {
    root,
    animations: [rotationClip('Idle', 'HaloRing', 6, [[0, 0, 0], [Math.PI / 2, Math.PI, 0], [Math.PI, Math.PI * 2, 0]])],
  };
}

async function exportGlb(name, { root, animations }) {
  const exporter = new GLTFExporter();
  const scene = new THREE.Scene();
  scene.add(root);
  const result = await exporter.parseAsync(scene, { binary: true, animations });
  await writeFile(path.join(OUT, `${name}.glb`), Buffer.from(result));
  console.log(`wrote ${name}.glb (${Buffer.byteLength(Buffer.from(result))} bytes)`);
}

await mkdir(OUT, { recursive: true });
await exportGlb('antenna', antenna());
await exportGlb('drone', drone());
await exportGlb('server', server());
await exportGlb('page', page());
await exportGlb('pylon', pylon());
