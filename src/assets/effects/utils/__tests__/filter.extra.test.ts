import { radialAmount } from '../filter';

describe('filter utils (extra)', () => {
  it('radialAmount returns 0 when radius <= 0', () => {
    expect(radialAmount(1, 1, 0)).toBe(0);
    expect(radialAmount(1, 1, -5)).toBe(0);
  });
});
