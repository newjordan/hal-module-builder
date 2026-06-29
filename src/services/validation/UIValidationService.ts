import { layerValidators } from '../validators/layerValidators';
import { uiValidators } from '../validators/uiValidators';
import { ValidationResult } from './validationTypes';

/**
 * UIValidationService: Handles form and input validation with real-time support.
 * Provides user data sanitization, format validation, and XSS protection.
 */
export class UIValidationService {
  /**
   * Validates color format (hex, rgb, rgba, hsl, hsla)
   * @param color Color string to validate
   * @returns ValidationResult with sanitized color value
   */
  validateColor(color: string): ValidationResult {
    const { getValidationCache, stableKey } = require('./ValidationCache');
    const cache = getValidationCache();
    const key = stableKey(color);
    const domain = 'ui.color';
    const cached = cache.get(domain, key) as ValidationResult | undefined;
    if (cached) return cached;
    const res = uiValidators.validateColor(color);
    cache.set(domain, key, res);
    return res;
  }

  /**
   * Validates gradient configuration and color values
   * @param gradient Gradient object to validate
   * @returns ValidationResult with sanitized gradient
   */
  validateGradient(gradient: any): ValidationResult {
    const { getValidationCache, stableKey } = require('./ValidationCache');
    const cache = getValidationCache();
    const domain = 'ui.gradient';
    const key = stableKey(gradient);
    const cached = cache.get(domain, key) as ValidationResult | undefined;
    if (cached) return cached;
    const res = layerValidators.validateLayerStructure({
      id: '',
      name: '',
      type: 'gradient',
      gradient,
    } as any);
    const out: ValidationResult = {
      isValid: res.errors.length === 0,
      errors: res.errors,
      warnings: res.warnings ?? [],
      sanitizedValue: res.sanitizedValue?.gradient,
    };
    cache.set(domain, key, out);
    return out;
  }

  /**
   * Validates circle layer settings including radius, colors, and animation
   * @param settings Circle settings object to validate
   * @returns ValidationResult with sanitized circle settings
   */
  validateCircleSettings(settings: any): ValidationResult {
    const { getValidationCache, stableKey } = require('./ValidationCache');
    const cache = getValidationCache();
    const domain = 'ui.circle';
    const key = stableKey(settings);
    const cached = cache.get(domain, key) as ValidationResult | undefined;
    if (cached) return cached;
    const res = layerValidators.validateLayerStructure({
      id: '',
      name: '',
      type: 'circle',
      circleSettings: settings,
    } as any);
    const out: ValidationResult = {
      isValid: res.errors.length === 0,
      errors: res.errors,
      warnings: res.warnings ?? [],
      sanitizedValue: res.sanitizedValue?.circleSettings,
    };
    cache.set(domain, key, out);
    return out;
  }
}

export default UIValidationService;
