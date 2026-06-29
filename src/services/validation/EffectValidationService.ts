import { effectValidators } from '../validators/effectValidators';
import { ValidationResult } from './validationTypes';

/**
 * EffectValidationService: Handles effect parameter validation with performance optimization.
 * Provides effect chain compatibility validation and performance validation for GPU limits.
 */
export class EffectValidationService {
  /**
   * Validates equalizer settings including frequency ranges, colors, and performance parameters
   * @param settings Equalizer configuration to validate
   * @returns ValidationResult with sanitized equalizer settings
   */
  validateEqualizerSettings(settings: unknown): ValidationResult {
    const { getValidationCache, stableKey } = require('./ValidationCache');
    const cache = getValidationCache();
    const domain = 'effect.equalizer';
    const key = stableKey(settings);
    const cached = cache.get(domain, key) as ValidationResult | undefined;
    if (cached) return cached;
    const res = effectValidators.validateEqualizerSettings(settings);
    cache.set(domain, key, res);
    return res;
  }
}

export default EffectValidationService;
