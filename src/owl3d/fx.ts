import * as THREE from 'three';
import { ROOM } from './config';
import { damp, pick, rand, scene } from './stage';

/* ----------------------------- textures ----------------------------- */

export function canvasTexture(canvas: HTMLCanvasElement): THREE.CanvasTexture {
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

function makeCanvas(
  width: number,
  height = width
): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('2D canvas unavailable');
  return [canvas, context];
}

export const glowTexture = (() => {
  const [canvas, g] = makeCanvas(256);
  const gradient = g.createRadialGradient(128, 128, 0, 128, 128, 128);
  gradient.addColorStop(0, 'rgba(255,255,255,1)');
  gradient.addColorStop(0.18, 'rgba(255,255,255,0.55)');
  gradient.addColorStop(0.45, 'rgba(255,255,255,0.12)');
  gradient.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gradient;
  g.fillRect(0, 0, 256, 256);
  return canvasTexture(canvas);
})();

export const sleepTexture = (() => {
  const [canvas, g] = makeCanvas(128);
  g.font = '700 96px -apple-system, Helvetica, sans-serif';
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.fillStyle = '#ffffff';
  g.fillText('z', 64, 70);
  return canvasTexture(canvas);
})();

export function glowSprite(
  color: THREE.ColorRepresentation,
  scale: number,
  opacity = 1
): THREE.Sprite {
  const sprite = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: glowTexture,
      color,
      transparent: true,
      opacity,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
  );
  sprite.scale.setScalar(scale);
  return sprite;
}

/* ----------------------------- particles ---------------------------- */

interface ParticleData {
  vel: THREE.Vector3;
  life: number;
  age: number;
  size: number;
  gravity: number;
  spin: number;
}

interface SpawnOptions {
  pos: THREE.Vector3;
  vel: THREE.Vector3;
  color: THREE.ColorRepresentation;
  size: number;
  life: number;
  gravity?: number;
  map?: THREE.Texture;
  spin?: number;
}

const particlePool: THREE.Sprite[] = [];
const liveParticles: THREE.Sprite[] = [];

export const particles = {
  spawn({
    pos,
    vel,
    color,
    size,
    life,
    gravity = -6,
    map = glowTexture,
    spin = 0,
  }: SpawnOptions): void {
    const sprite = particlePool.pop() ?? glowSprite(0xffffff, 1);
    const material = sprite.material;
    material.map = map;
    material.color.set(color);
    material.opacity = 1;
    material.rotation = 0;
    sprite.position.copy(pos);
    sprite.scale.setScalar(size);
    sprite.userData = {
      vel: vel.clone(),
      life,
      age: 0,
      size,
      gravity,
      spin,
    } satisfies ParticleData;
    scene.add(sprite);
    liveParticles.push(sprite);
  },

  burst(
    pos: THREE.Vector3,
    colors: number | number[],
    count = 40,
    speed = 5
  ): void {
    for (let i = 0; i < count; i++) {
      const dir = new THREE.Vector3(
        rand(-1, 1),
        rand(-0.2, 1.2),
        rand(-1, 1)
      ).normalize();
      particles.spawn({
        pos,
        vel: dir.multiplyScalar(speed * rand(0.4, 1)),
        color: Array.isArray(colors) ? pick(colors) : colors,
        size: rand(0.15, 0.35),
        life: rand(0.8, 1.6),
      });
    }
  },

  update(dt: number): void {
    for (let i = liveParticles.length - 1; i >= 0; i--) {
      const sprite = liveParticles[i];
      if (!sprite) continue;
      const data = sprite.userData as ParticleData;
      data.age += dt;
      if (data.age >= data.life) {
        scene.remove(sprite);
        liveParticles.splice(i, 1);
        particlePool.push(sprite);
        continue;
      }
      data.vel.y += data.gravity * dt;
      data.vel.multiplyScalar(1 - dt * 0.8);
      sprite.position.addScaledVector(data.vel, dt);
      if (sprite.position.y < ROOM.floor + 0.05) {
        sprite.position.y = ROOM.floor + 0.05;
        data.vel.y *= -0.4;
      }
      const remaining = 1 - data.age / data.life;
      sprite.material.opacity = remaining;
      sprite.material.rotation += data.spin * dt;
      sprite.scale.setScalar(data.size * (0.6 + 0.4 * remaining));
    }
  },
};

/* ------------------------------- beams ------------------------------ */

export const beamGeometry = new THREE.CylinderGeometry(
  0.02,
  0.07,
  1,
  10,
  1,
  true
).translate(0, 0.5, 0);
export const coneGeometry = new THREE.CylinderGeometry(
  0.03,
  1.05,
  1,
  32,
  1,
  true
).translate(0, 0.5, 0);
const UP = new THREE.Vector3(0, 1, 0);
const beamDirection = new THREE.Vector3();

export class Beam {
  readonly mesh: THREE.Mesh<THREE.BufferGeometry, THREE.MeshBasicMaterial>;
  private level = 0;
  private target = 0;

  constructor(geometry: THREE.BufferGeometry) {
    this.mesh = new THREE.Mesh(
      geometry,
      new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        side: THREE.DoubleSide,
      })
    );
    this.mesh.visible = false;
    scene.add(this.mesh);
  }

  aim(
    from: THREE.Vector3,
    to: THREE.Vector3,
    color: THREE.ColorRepresentation,
    strength = 1
  ): void {
    beamDirection.subVectors(to, from);
    const length = beamDirection.length();
    if (length < 0.01) return;
    this.mesh.position.copy(from);
    this.mesh.quaternion.setFromUnitVectors(
      UP,
      beamDirection.divideScalar(length)
    );
    this.mesh.scale.set(1, length, 1);
    this.mesh.material.color.set(color);
    this.target = strength;
  }

  update(dt: number, opacity: number): void {
    this.level += (this.target - this.level) * damp(10, dt);
    this.target *= Math.exp(-dt * 6);
    this.mesh.material.opacity = this.level * opacity;
    this.mesh.visible = this.level > 0.01;
  }

  dispose(): void {
    scene.remove(this.mesh);
    this.mesh.material.dispose();
  }
}
