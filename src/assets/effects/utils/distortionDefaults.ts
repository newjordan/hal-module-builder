import { EffectParameters, ValidationResult } from '../IEffect';

export const defaultDistortionParameters: EffectParameters = {
  opacity: 1,
  intensity: 1,
  enabled: true,
  blendMode: 'normal',
  distortionType: 'wave',
  amplitude: 20,
  frequency: 0.05,
  speed: 1,
  phase: 0,
  centerX: 0.5,
  centerY: 0.5,
  radius: 200,
  twist: 0,
  direction: 'horizontal',
};

export function validateDistortionParameters(
  params: EffectParameters
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (params.amplitude !== undefined && params.amplitude < 0) {
    errors.push('Amplitude cannot be negative');
  }

  if (params.frequency !== undefined && params.frequency <= 0) {
    errors.push('Frequency must be greater than 0');
  }

  if (params.radius !== undefined && params.radius <= 0) {
    errors.push('Radius must be greater than 0');
  }

  if (
    params.centerX !== undefined &&
    (params.centerX < 0 || params.centerX > 1)
  ) {
    errors.push('Center X must be between 0 and 1');
  }

  if (
    params.centerY !== undefined &&
    (params.centerY < 0 || params.centerY > 1)
  ) {
    errors.push('Center Y must be between 0 and 1');
  }

  if (params.amplitude && params.amplitude > 50) {
    warnings.push('Large amplitude values may impact performance');
  }
  if (params.frequency && params.frequency > 0.2) {
    warnings.push('High frequency values may create pixelated effects');
  }

  return { isValid: errors.length === 0, errors, warnings };
}
