import { animatedSin, animatedTwist } from '../noise';

describe('noise utils (extra)', () => {
  it('animatedSin handles undefined time as 0', () => {
    const v = animatedSin(undefined, 2, 1);
    expect(typeof v).toBe('number');
    // sin(0) = 0 => expect ~0
    expect(v).toBeCloseTo(0, 8);
  });

  it('animatedTwist defaults intensity=1, speed=1, time=0', () => {
    const base = 2;
    const v = animatedTwist(base, undefined, undefined, undefined, 0.5);
    // base*1 + sin(0*1)*0.5 = 2 + 0
    expect(v).toBeCloseTo(2, 8);
  });
});
