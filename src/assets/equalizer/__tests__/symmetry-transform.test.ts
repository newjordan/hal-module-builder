import {
  applySymmetryTransform,
  getCurrentSymmetryPlan,
} from '../../../utils/equalizerSymmetry';

describe('applySymmetryTransform (band-level symmetry)', () => {
  const base = [0, 1, 2, 3, 4, 5, 6, 7];

  test('none: returns a copy', () => {
    const out = applySymmetryTransform(base, 'none');
    expect(out).toEqual(base);
    expect(out).not.toBe(base);
  });

  test('mirror: produces symmetric array', () => {
    const out = applySymmetryTransform(base, 'mirror');
    expect(out.length).toBe(base.length);
    for (let i = 0; i < out.length; i++) {
      expect(out[i]).toBeCloseTo(out[out.length - 1 - i], 6);
    }
  });

  test('4-fold: repeats canonical segment with alternating reversal', () => {
    const out = applySymmetryTransform(base, '4-fold');
    expect(out.length).toBe(base.length);

    // Expect 4 segments of ~equal size
    const segLen = Math.floor(out.length / 4);
    const segments = [
      out.slice(0, segLen),
      out.slice(segLen, segLen * 2),
      out.slice(segLen * 2, segLen * 3),
      out.slice(segLen * 3),
    ];

    // First and third should be similar direction; second/fourth reversed
    for (let i = 0; i < Math.min(segments[0].length, segments[2].length); i++) {
      expect(segments[0][i]).toBeCloseTo(segments[2][i], 6);
    }
    const revEq = (a: number[], b: number[]) =>
      a.every((v, i) => Math.abs(v - b[b.length - 1 - i]) < 1e-6);
    expect(revEq(segments[0], segments[1])).toBe(true);
    // Depending on remainder distribution, fourth might differ by 1 element; compare overlap
    const minLen = Math.min(segments[0].length, segments[3].length);
    expect(
      segments[0]
        .slice(0, minLen)
        .every((v, i) => Math.abs(v - segments[3][minLen - 1 - i]) < 1e-6)
    ).toBe(true);
  });

  test('6-fold: segmentation present and output is non-uniform', () => {
    const out = applySymmetryTransform(base, '6-fold');
    expect(out.length).toBe(base.length);

    const plan = getCurrentSymmetryPlan();
    expect(plan).not.toBeNull();
    expect(plan!.segmentCount).toBe(6);
    expect(plan!.segmentLengths.length).toBe(6);

    // Ensure result is not a uniform constant pulse
    const unique = new Set(out.map(v => Number(v.toFixed(6))));
    expect(unique.size).toBeGreaterThan(1);
  });

  test('mirror with arcClampDegrees: uses half-arc as canonical window', () => {
    // If we clamp to 180 deg (half of full circle), canonical should be ~50% of data
    const out = applySymmetryTransform(base, 'mirror', 180);
    expect(out.length).toBe(base.length);
    // Symmetry still holds
    for (let i = 0; i < out.length; i++) {
      expect(out[i]).toBeCloseTo(out[out.length - 1 - i], 6);
    }
  });
});
test('n-fold preserves dynamic variance (not uniform pulse)', () => {
  const pattern = [0.1, 0.7, 0.2, 0.9, 0.3, 0.8, 0.4, 1.0, 0.5, 0.6, 0.2, 0.9];
  const out4 = applySymmetryTransform(pattern, '4-fold');
  const out6 = applySymmetryTransform(pattern, '6-fold');

  const variance = (arr: number[]) => {
    const mean = arr.reduce((a, b) => a + b, 0) / arr.length;
    return arr.reduce((a, b) => a + (b - mean) * (b - mean), 0) / arr.length;
  };

  expect(variance(out4)).toBeGreaterThan(0);
  expect(variance(out6)).toBeGreaterThan(0);
});
