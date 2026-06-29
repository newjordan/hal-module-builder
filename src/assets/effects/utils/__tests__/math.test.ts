import { clamp, roundToInt, distance, angle } from '../math';

describe('math utils', () => {
  test('clamp', () => {
    expect(clamp(5, 0, 10)).toBe(5);
    expect(clamp(-1, 0, 10)).toBe(0);
    expect(clamp(11, 0, 10)).toBe(10);
  });

  test('roundToInt', () => {
    expect(roundToInt(1.2)).toBe(1);
    expect(roundToInt(1.5)).toBe(2);
    expect(roundToInt(-1.5)).toBe(-1);
  });

  test('distance 3-4-5', () => {
    expect(distance(3, 4)).toBe(5);
  });

  test('angle quadrants', () => {
    expect(angle(1, 0)).toBeCloseTo(0, 6);
    expect(angle(0, 1)).toBeCloseTo(Math.PI / 2, 6);
    expect(angle(-1, 0)).toBeCloseTo(Math.PI, 6);
    expect(angle(0, -1)).toBeCloseTo(-Math.PI / 2, 6);
  });
});
