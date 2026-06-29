export {};

import {
  FilterParams,
  RippleParams,
  TwistParams,
  ValidationResult,
  WaveParams,
} from './effectsTypes';

export function validateDistortionParams(params: WaveParams): ValidationResult {
  const errors: string[] = [];
  if (params.amplitude !== undefined && params.amplitude < 0)
    errors.push('amplitude must be >= 0');
  if (params.frequency !== undefined && params.frequency < 0)
    errors.push('frequency must be >= 0');
  if (
    params.centerX !== undefined &&
    (params.centerX < 0 || params.centerX > 1)
  )
    errors.push('centerX must be in [0,1]');
  if (
    params.centerY !== undefined &&
    (params.centerY < 0 || params.centerY > 1)
  )
    errors.push('centerY must be in [0,1]');
  return { valid: errors.length === 0, errors };
}

export function validateRippleParams(params: RippleParams): ValidationResult {
  const errors: string[] = [];
  if (params.radius < 0) errors.push('radius must be >= 0');
  if (params.amplitude < 0) errors.push('amplitude must be >= 0');
  if (params.frequency < 0) errors.push('frequency must be >= 0');
  return { valid: errors.length === 0, errors };
}

export function validateTwistParams(params: TwistParams): ValidationResult {
  const errors: string[] = [];
  if (params.radius < 0) errors.push('radius must be >= 0');
  if (!Number.isFinite(params.twist))
    errors.push('twist must be a finite number');
  if (params.speed !== undefined && params.speed < 0)
    errors.push('speed must be >= 0');
  return { valid: errors.length === 0, errors };
}

export function validateFilterParams(params: FilterParams): ValidationResult {
  const errors: string[] = [];
  if (params.radius !== undefined && params.radius < 0)
    errors.push('radius must be >= 0');
  if (params.strength !== undefined && params.strength < 0)
    errors.push('strength must be >= 0');
  return { valid: errors.length === 0, errors };
}

export function validateCoordinates(
  x: number,
  y: number,
  width: number,
  height: number
): boolean {
  return x >= 0 && y >= 0 && x < width && y < height;
}

export function checkPerformanceWarnings(_params: unknown): string[] {
  // Placeholder for future heuristics (e.g., very high frequency with large images)
  return [];
}
