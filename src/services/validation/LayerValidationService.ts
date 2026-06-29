import { layerValidators } from '../validators/layerValidators';
import { ValidationResult } from './validationTypes';

/**
 * LayerValidationService
 * Now delegates to layerValidators (extracted pure rules).
 */
export class LayerValidationService {
  /** Validate a layer object using extracted rules */
  validateLayer(layer: unknown): ValidationResult {
    const { getValidationCache, stableKey } = require('./ValidationCache');
    const cache = getValidationCache();
    const domain = 'layer';
    const key = stableKey(layer);
    const cached = cache.get(domain, key) as ValidationResult | undefined;
    if (cached) return cached;
    const res = layerValidators.validateLayerStructure(layer);
    cache.set(domain, key, res);
    return res;
  }
}

export default LayerValidationService;
