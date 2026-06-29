import { normalizeWaveformParams } from '../waveform';

describe('waveform utils (extra)', () => {
  it('negative radius is clamped to 0; defaults kick in for others', () => {
    const norm = normalizeWaveformParams(100, 50, { radius: -10 });
    expect(norm.radius).toBe(0);
    expect(norm.centerX).toBeGreaterThanOrEqual(0);
    expect(norm.centerY).toBeGreaterThanOrEqual(0);
  });
});
