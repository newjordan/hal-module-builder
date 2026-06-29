import { animatedSin, animatedTwist } from '../noise';

describe('noise utils', () => {
  test('animatedSin', () => {
    // With time=1000ms, speed=2, scale=0.5
    const v = animatedSin(1000, 2, 0.5);
    expect(v).toBeCloseTo(Math.sin(1 * 2) * 0.5, 6); // t(s)=1
  });

  test('animatedTwist', () => {
    // base=2, intensity=1.5 -> baseVal=3; time=500ms->t=0.5; speed=4; scale=0.25
    const v = animatedTwist(2, 1.5, 500, 4, 0.25);
    const expected = 2 * 1.5 + Math.sin(0.5 * 4) * 0.25;
    expect(v).toBeCloseTo(expected, 6);
  });
});
