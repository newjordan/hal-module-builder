import {
  validateDistortionParams,
  validateRippleParams,
  validateTwistParams,
  validateFilterParams,
  validateCoordinates,
} from '../effectsValidation';

describe('effectsValidation', () => {
  it('validateDistortionParams flags out-of-range values', () => {
    const res = validateDistortionParams({
      amplitude: -1,
      frequency: -0.1,
      centerX: 2,
      centerY: -0.5,
    });
    expect(res.valid).toBe(false);
    expect(res.errors.length).toBeGreaterThan(0);
  });

  it('validateRippleParams enforces non-negative radius and amplitude', () => {
    const res = validateRippleParams({
      centerX: 0,
      centerY: 0,
      amplitude: -1,
      frequency: -1,
      radius: -5,
      phase: 0,
    });
    expect(res.valid).toBe(false);
  });

  it('validateTwistParams checks radius and twist', () => {
    const res = validateTwistParams({
      centerX: 0,
      centerY: 0,
      radius: 5,
      twist: 1,
      speed: 1,
    });
    expect(res.valid).toBe(true);
  });

  it('validateFilterParams checks non-negative values', () => {
    const res = validateFilterParams({ radius: -1, strength: -2 });
    expect(res.valid).toBe(false);
  });

  it('validateCoordinates validates bounds', () => {
    expect(validateCoordinates(0, 0, 10, 10)).toBe(true);
    expect(validateCoordinates(9, 9, 10, 10)).toBe(true);
    expect(validateCoordinates(10, 10, 10, 10)).toBe(false);
  });
});
