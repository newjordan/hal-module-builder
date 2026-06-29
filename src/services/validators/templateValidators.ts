import {
  TemplateValidationError,
  validateLayerInternal,
} from '../../utils/templates/templateValidation';
import { ERR } from '../validation/errorCodes';

/**
 * templateValidators
 * Now hosts template-level rule logic while reusing per-layer internal validator
 * to maintain parity with legacy behavior (autoRepair defaults).
 */
export const templateValidators = {
  validateTemplateStructure(template: unknown): TemplateValidationError {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!template || typeof template !== 'object') {
      return { valid: false, errors: [ERR.TEMPLATE_OBJECT_REQUIRED] };
    }
    const t: any = template;

    if (!t.id || typeof t.id !== 'string') {
      errors.push(ERR.TEMPLATE_ID_REQUIRED);
    }
    if (!t.name || typeof t.name !== 'string' || !t.name.trim()) {
      errors.push(ERR.TEMPLATE_NAME_EMPTY);
    }
    if (!Array.isArray(t.layers)) {
      errors.push(ERR.TEMPLATE_LAYERS_REQUIRED);
    } else {
      for (let i = 0; i < t.layers.length; i++) {
        const lr = validateLayerInternal(t.layers[i]);
        if (!lr.isValid) {
          errors.push(`Layer ${i + 1}: ${lr.errors.join(', ')}`);
        }
        warnings.push(...lr.warnings);
      }
    }

    const result: TemplateValidationError = {
      valid: errors.length === 0,
      errors,
    };
    if (warnings.length > 0) {
      result.warnings = warnings;
    }
    return result;
  },
};

export type TemplateValidators = typeof templateValidators;

export default templateValidators;
