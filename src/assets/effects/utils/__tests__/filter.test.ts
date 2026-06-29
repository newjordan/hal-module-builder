import { radialAmount, bulgeFactor, pinchFactor } from '../filter';

describe('filter utils', () => {
  test('radialAmount within radius', () => {
    expect(radialAmount(0, 0, 10)).toBeCloseTo(1, 6);
    expect(radialAmount(5, 0, 10)).toBeCloseTo(0.5 * 0.5, 6); // squared by default exponent=2
  });

  test('radialAmount outside radius is 0', () => {
    expect(radialAmount(20, 0, 10)).toBe(0);
  });

  test('bulge/pinch factors', () => {
    expect(bulgeFactor(0.5, 0.4)).toBeCloseTo(1 + 0.5 * 0.4, 6);
    expect(pinchFactor(0.5, 0.4)).toBeCloseTo(1 - 0.5 * 0.4, 6);
  });
});
