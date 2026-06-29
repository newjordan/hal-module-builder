export {};

import { RippleParams } from '../utils/effectsTypes';

export function calculateDistanceFromCenter(
  x: number,
  y: number,
  centerX: number,
  centerY: number
): number {
  const dx = x - centerX;
  const dy = y - centerY;
  return Math.hypot(dx, dy);
}

export function calculateRippleAmplitude(
  distance: number,
  radius: number,
  amplitude: number
): number {
  if (radius <= 0) return 0;
  const amount = Math.max(0, (radius - distance) / radius);
  return amount * (amplitude ?? 0);
}

export function calculateRipplePhase(
  distance: number,
  frequency: number,
  phase: number
): number {
  return distance * (frequency ?? 0) - (phase ?? 0);
}

export function calculateRippleDistortion(
  distance: number,
  params: RippleParams
): number {
  const amp = calculateRippleAmplitude(
    distance,
    params.radius,
    params.amplitude
  );
  const ph = calculateRipplePhase(distance, params.frequency, params.phase);
  return Math.sin(ph) * amp;
}
