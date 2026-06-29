import {
  calculateHorizontalWave,
  calculateVerticalWave,
  calculateDiagonalWave,
  calculateRadialWave,
} from '../distortionAlgorithms';

describe('distortionAlgorithms', () => {
  it('calculateHorizontalWave produces sinusoidal x-offset based on y', () => {
    const y = 10;
    const offset = calculateHorizontalWave(0, y, {
      amplitude: 10,
      frequency: 0.2,
      phase: 0,
    });
    expect(offset).toBeCloseTo(Math.sin(y * 0.2) * 10, 6);
  });

  it('calculateVerticalWave produces sinusoidal y-offset based on x', () => {
    const x = 15;
    const offset = calculateVerticalWave(x, 0, {
      amplitude: 8,
      frequency: 0.1,
      phase: 0.5,
    });
    expect(offset).toBeCloseTo(Math.sin(x * 0.1 + 0.5) * 8, 6);
  });

  it('calculateDiagonalWave offsets both coordinates', () => {
    const { x, y } = calculateDiagonalWave(5, 7, {
      amplitude: 12,
      frequency: 0.05,
      phase: 0,
    });
    const diag = (5 + 7) * 0.05;
    expect(x).toBeCloseTo(5 + Math.sin(diag) * 12 * 0.7, 6);
    expect(y).toBeCloseTo(7 + Math.cos(diag) * 12 * 0.7, 6);
  });

  it('calculateRadialWave offsets along radial direction from center', () => {
    const centerX = 50,
      centerY = 50;
    const { x, y } = calculateRadialWave(60, 50, centerX, centerY, {
      amplitude: 5,
      frequency: 0.3,
      phase: 0,
    });
    // Point lies to the right of center; expect horizontal displacement only
    expect(y).toBeCloseTo(50, 6);
    expect(x).not.toBe(60);
  });
});
