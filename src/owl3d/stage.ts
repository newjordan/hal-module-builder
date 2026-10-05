import * as THREE from 'three';
import { BACKGROUND, D } from './config';

/** Shared scene and clock for the Owl3D portal. */
export const scene = new THREE.Scene();
scene.background = new THREE.Color(BACKGROUND);
scene.fog = new THREE.Fog(BACKGROUND, D + 8, D + 34);

export const clock = { now: 0 };

export const rand = (min: number, max: number): number =>
  min + Math.random() * (max - min);
export const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));
/** Frame-rate independent smoothing factor. */
export const damp = (rate: number, dt: number): number =>
  1 - Math.exp(-rate * dt);
export function pick<T>(items: readonly T[]): T {
  const item = items[Math.floor(Math.random() * items.length)];
  if (item === undefined) throw new Error('pick() from an empty list');
  return item;
}
export const cssColor = (hex: number): string =>
  `#${new THREE.Color(hex).getHexString()}`;
