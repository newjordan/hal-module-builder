import {
  calculateDistanceFromCenter,
  calculateRippleAmplitude,
  calculateRippleDistortion,
  calculateRipplePhase,
} from '../waveformAlgorithms';

describe('waveformAlgorithms', () => {
  it('calculateDistanceFromCenter computes Euclidean distance', () => {
    expect(calculateDistanceFromCenter(3, 4, 0, 0)).toBeCloseTo(5, 6);
  });

  it('calculateRippleAmplitude tapers with distance', () => {
    const radius = 10;
    expect(calculateRippleAmplitude(0, radius, 10)).toBeCloseTo(10, 6); // at center, full amplitude
    expect(calculateRippleAmplitude(10, radius, 10)).toBeCloseTo(0, 6); // at radius, zero
    expect(calculateRippleAmplitude(20, radius, 10)).toBeCloseTo(0, 6); // beyond radius, clamped to zero
  });

  it('calculateRippleDistortion matches sin(phase) * amplitude(distance)', () => {
    const distance = 5;
    const params = {
      centerX: 0,
      centerY: 0,
      amplitude: 8,
      frequency: 0.5,
      radius: 10,
      phase: 0.25,
    };
    const amp = calculateRippleAmplitude(
      distance,
      params.radius,
      params.amplitude
    );
    const phase = calculateRipplePhase(
      distance,
      params.frequency,
      params.phase
    );
    expect(calculateRippleDistortion(distance, params)).toBeCloseTo(
      Math.sin(phase) * amp,
      6
    );
  });
});
