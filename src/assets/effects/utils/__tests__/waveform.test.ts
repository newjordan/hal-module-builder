import { normalizeWaveformParams } from '../waveform';

describe('waveform utils', () => {
  test('defaults and scaling', () => {
    const norm = normalizeWaveformParams(200, 100, {});
    expect(norm.centerX).toBeCloseTo(0.5, 6);
    expect(norm.centerY).toBeCloseTo(0.5, 6);
    expect(norm.radius).toBeGreaterThan(0);
    expect(norm.amplitude).toBe(20);
    expect(norm.frequency).toBe(0.05);
    expect(norm.speed).toBe(1);
    expect(norm.phase).toBe(0);
  });

  test('clamps center and computes amplitude with intensity', () => {
    const norm = normalizeWaveformParams(100, 100, {
      centerX: -0.2,
      centerY: 2,
      amplitude: 10,
      intensity: 3,
    });
    expect(norm.centerX).toBe(0);
    expect(norm.centerY).toBe(1);
    expect(norm.amplitude).toBe(30);
  });
});
