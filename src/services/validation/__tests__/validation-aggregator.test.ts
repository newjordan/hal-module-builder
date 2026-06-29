import { ValidationResult } from '../validationTypes';
import { ValidationResultAggregator } from '../ValidationResultAggregator';

describe('ValidationResultAggregator.aggregate', () => {
  const ok = (sv?: any): ValidationResult => ({
    isValid: true,
    errors: [],
    warnings: [],
    sanitizedValue: sv,
  });
  const err = (msg: string): ValidationResult => ({
    isValid: false,
    errors: [msg],
    warnings: [],
  });

  it('combines errors and warnings and merges object sanitizedValues', () => {
    const r1 = ok({ a: 1, b: 2 });
    const r2 = ok({ b: 3, c: 4 });
    const r3 = {
      isValid: true,
      errors: [],
      warnings: ['w1'],
    } as ValidationResult;
    const out = ValidationResultAggregator.aggregate([r1, r2, r3]);

    expect(out.isValid).toBe(true);
    expect(out.errors).toEqual([]);
    expect(out.warnings).toEqual(['w1']);
    expect(out.sanitizedValue).toEqual({ a: 1, b: 3, c: 4 });
  });

  it('stores scalar sanitizedValues under unique keys', () => {
    const r1 = ok(42);
    const r2 = ok('x');
    const r3 = err('bad');
    const out = ValidationResultAggregator.aggregate([r1, r2, r3]);

    expect(out.isValid).toBe(false);
    expect(out.errors).toEqual(['bad']);
    expect(out.sanitizedValue).toEqual({ _value_0: 42, _value_1: 'x' });
  });
});
