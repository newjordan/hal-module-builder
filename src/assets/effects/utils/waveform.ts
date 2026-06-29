import { clamp } from './math';

export type WaveformParams = {
  centerX?: number; // 0..1
  centerY?: number; // 0..1
  radius?: number; // px
  amplitude?: number;
  frequency?: number;
  speed?: number;
  phase?: number;
  intensity?: number;
};

export function normalizeWaveformParams(
  width: number,
  height: number,
  params: WaveformParams
) {
  const centerX = clamp(params.centerX ?? 0.5, 0, 1);
  const centerY = clamp(params.centerY ?? 0.5, 0, 1);
  const radius = Math.max(0, params.radius ?? Math.min(width, height) * 0.5);
  const amplitude = (params.amplitude ?? 20) * (params.intensity ?? 1);
  const frequency = params.frequency ?? 0.05;
  const speed = params.speed ?? 1;
  const phase = params.phase ?? 0;
  return { centerX, centerY, radius, amplitude, frequency, speed, phase };
}
