import type { SymmetryMode } from '../config/equalizerSymmetry';
import { DEFAULT_SYMMETRY_MODE } from '../config/equalizerSymmetry';
import type { RadialSymmetryPlan } from './symmetry/RadialSymmetryEngine';
import { RadialSymmetryEngine } from './symmetry/RadialSymmetryEngine';

const radialSymmetryEngine = new RadialSymmetryEngine();

const rotateData = (data: number[], shift: number): number[] => {
  const length = data.length;
  if (length === 0) return data;

  const normalizedShift = ((shift % length) + length) % length;
  if (normalizedShift === 0) return data.slice();

  const rotated = new Array<number>(length);
  for (let i = 0; i < length; i++) {
    const sourceIndex = (i + normalizedShift) % length;
    rotated[i] = data[sourceIndex] ?? 0;
  }
  return rotated;
};

export interface SymmetrySmoothingOptions {
  method?: 'none' | 'monotone' | 'catmull-rom';
  strength?: number; // 0..1 blend amount towards smoothing (default 0.5)
  tension?: number; // for catmull-rom (default 0.5)
  clamp?: boolean; // clamp cubic result into local [min,max] (default true)
}

export const applySymmetryTransform = (
  data: number[],
  mode?: SymmetryMode,
  arcClampDegrees?: number,
  smoothing?: SymmetrySmoothingOptions
): number[] => {
  if (!Array.isArray(data) || data.length === 0) {
    radialSymmetryEngine.clearPlan();
    return [];
  }

  const effectiveMode = mode ?? DEFAULT_SYMMETRY_MODE;

  // No symmetry: return copy
  if (effectiveMode === 'none') {
    radialSymmetryEngine.clearPlan();
    return data.slice();
  }

  // Rotate is a special non-mirroring transform
  if (effectiveMode === 'rotate') {
    radialSymmetryEngine.clearPlan();
    const rotateBy = Math.max(1, Math.floor(data.length / 4));
    return rotateData(data, rotateBy);
  }

  // All mirror and n-fold modes use the radial engine with arc clamping
  const result = radialSymmetryEngine.transform(
    data,
    effectiveMode,
    arcClampDegrees,
    smoothing
  );
  return result;
};

export const getCurrentSymmetryPlan = (): RadialSymmetryPlan | null =>
  radialSymmetryEngine.getLastPlan();

export type { RadialSymmetryPlan };
