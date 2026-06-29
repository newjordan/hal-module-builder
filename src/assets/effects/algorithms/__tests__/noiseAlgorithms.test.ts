import {
  calculateAnimatedTwist,
  calculateSwirlAngle,
  calculateTwistAngle,
} from '../noiseAlgorithms';

describe('noiseAlgorithms', () => {
  it('calculateAnimatedTwist varies with time and speed', () => {
    const base = 1;
    const a = calculateAnimatedTwist(base, 0, 1);
    const b = calculateAnimatedTwist(base, 1000, 1);
    expect(a).not.toBe(b);
  });

  it('calculateTwistAngle increases angle proportionally near center', () => {
    const out = calculateTwistAngle(0, 0, {
      centerX: 0,
      centerY: 0,
      radius: 10,
      twist: 2,
    });
    expect(out).toBeCloseTo(2, 6);
  });

  it('calculateSwirlAngle applies animated component and distance falloff', () => {
    const outNear = calculateSwirlAngle(
      0,
      1,
      { centerX: 0, centerY: 0, radius: 10, twist: 1, speed: 2 },
      1000
    );
    const outFar = calculateSwirlAngle(
      0,
      100,
      { centerX: 0, centerY: 0, radius: 10, twist: 1, speed: 2 },
      1000
    );
    expect(Math.abs(outNear)).toBeGreaterThan(Math.abs(outFar));
  });
});
