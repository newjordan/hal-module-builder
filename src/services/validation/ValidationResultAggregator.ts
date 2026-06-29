import { ValidationResult } from './validationTypes';

/**
 * ValidationResultAggregator
 * Combines multiple ValidationResult objects into a single result while
 * preserving backward-compatible shape. Any enhanced metadata can be
 * optionally returned via the second value of aggregateWithMeta.
 */
export class ValidationResultAggregator {
  static aggregate(results: ValidationResult[]): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const sanitizedValue: any = {};

    for (const r of results) {
      if (!r) continue;
      if (r.errors?.length) errors.push(...r.errors);
      if (r.warnings?.length) warnings.push(...r.warnings);

      // Merge sanitizedValue conservatively (shallow object merge only)
      if (r.sanitizedValue !== undefined) {
        if (
          r.sanitizedValue !== null &&
          typeof r.sanitizedValue === 'object' &&
          !Array.isArray(r.sanitizedValue)
        ) {
          Object.assign(sanitizedValue, r.sanitizedValue);
        } else {
          // If scalar or array, store under _value_N keys to avoid collisions
          const key = `_value_${Object.keys(sanitizedValue).length}`;
          sanitizedValue[key] = r.sanitizedValue;
        }
      }
    }

    const result: ValidationResult = {
      isValid: errors.length === 0,
      errors,
      warnings,
      sanitizedValue: Object.keys(sanitizedValue).length
        ? sanitizedValue
        : undefined,
    };
    return result;
  }
}

export default ValidationResultAggregator;
