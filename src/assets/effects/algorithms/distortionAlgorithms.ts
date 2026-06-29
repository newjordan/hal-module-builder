export {};

import { WaveParams } from '../utils/effectsTypes';

// Horizontal wave offset along X axis based on Y position
export function calculateHorizontalWave(
  x: number,
  y: number,
  params: WaveParams
): number {
  void x; // mark unused param to satisfy noUnusedParameters while keeping API
  const amplitude = params.amplitude ?? 20;
  const frequency = params.frequency ?? 0.05;
  const phase = params.phase ?? 0;
  return Math.sin(y * frequency + phase) * amplitude;
}

// Vertical wave offset along Y axis based on X position
export function calculateVerticalWave(
  x: number,
  y: number,
  params: WaveParams
): number {
  void y; // mark unused param to satisfy noUnusedParameters while keeping API
  const amplitude = params.amplitude ?? 20;
  const frequency = params.frequency ?? 0.05;
  const phase = params.phase ?? 0;
  return Math.sin(x * frequency + phase) * amplitude;
}

// Diagonal wave affects both X and Y
export function calculateDiagonalWave(
  x: number,
  y: number,
  params: WaveParams
): { x: number; y: number } {
  const amplitude = params.amplitude ?? 20;
  const frequency = params.frequency ?? 0.05;
  const phase = params.phase ?? 0;
  const diag = (x + y) * frequency + phase;
  return {
    x: x + Math.sin(diag) * amplitude * 0.7,
    y: y + Math.cos(diag) * amplitude * 0.7,
  };
}

// Radial wave emanating from a center point (absolute coords)
export function calculateRadialWave(
  x: number,
  y: number,
  centerX: number,
  centerY: number,
  params: WaveParams
): { x: number; y: number } {
  const amplitude = params.amplitude ?? 20;
  const frequency = params.frequency ?? 0.05;
  const phase = params.phase ?? 0;
  const dx = x - centerX;
  const dy = y - centerY;
  const dist = Math.hypot(dx, dy);
  const angle = Math.atan2(dy, dx);
  const offset = Math.sin(dist * frequency + phase) * amplitude;
  return {
    x: x + Math.cos(angle) * offset,
    y: y + Math.sin(angle) * offset,
  };
}
