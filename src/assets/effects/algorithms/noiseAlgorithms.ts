export {};

import { NoiseParams, SwirlParams, TwistParams } from '../utils/effectsTypes';

export function calculateAnimatedTwist(
  baseValue: number,
  timeMs?: number,
  speed?: number
): number {
  const t = (timeMs ?? 0) * 0.001 * (speed ?? 1);
  return baseValue + Math.sin(t) * 0.5;
}

export function calculateTwistAngle(
  angle: number,
  distance: number,
  params: TwistParams
): number {
  const radius = Math.max(0, params.radius);
  const amount = radius > 0 ? Math.max(0, (radius - distance) / radius) : 0;
  const twist = params.twist ?? 0;
  return angle + twist * amount;
}

export function calculateSwirlAngle(
  angle: number,
  distance: number,
  params: SwirlParams,
  timeMs?: number
): number {
  const radius = Math.max(0, params.radius);
  const amount = radius > 0 ? Math.max(0, (radius - distance) / radius) : 0;
  const animated = calculateAnimatedTwist(
    params.twist ?? 0,
    timeMs,
    params.speed
  );
  return angle + animated * amount;
}

export function calculateNoiseOffset(
  x: number,
  y: number,
  params: NoiseParams
): number {
  // Lightweight deterministic pseudo-noise based on sin/cos; placeholder for Perlin/Simplex
  const seed = params.seed ?? 0;
  const scale = params.amplitude ?? 1;
  return Math.sin(x * 0.013 + seed) * Math.cos(y * 0.017 + seed) * scale;
}
