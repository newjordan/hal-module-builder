import { renderHook } from '@testing-library/react';
import { useRadialTransform } from '../useRadialTransform';
import { VisualizationConfig } from '../../assets/equalizer/visualizations/BaseVisualization';

const buildConfig = (
  overrides: Partial<VisualizationConfig> = {}
): VisualizationConfig => ({
  barCount: 64,
  barWidth: 8,
  barSpacing: 2,
  maxHeight: 200,
  responseSpeed: 0.8,
  colorMode: 'solid',
  primaryColor: '#ffffff',
  glowIntensity: 0,
  pulseMode: 'none',
  rotation: 0,
  scale: 1,
  offsetX: 0,
  offsetY: 0,
  innerRadius: 120,
  startAngle: 0,
  endAngle: 360,
  arcMode: false,
  invert: false,
  ...overrides,
});

describe('useRadialTransform', () => {
  it('provides radial helpers with default configuration', () => {
    const config = buildConfig();
    const { result } = renderHook(() =>
      useRadialTransform({ config, center: { x: 250, y: 125 } })
    );

    const { config: radialConfig, transformBatch } = result.current;
    const positions = transformBatch({ length: 4 });

    expect(radialConfig.centerX).toBe(250);
    expect(radialConfig.centerY).toBe(125);
    expect(positions).toHaveLength(4);
    expect(positions[0].angleDegrees).toBeCloseTo(0);
    expect(positions[0].segmentArcLength).toBeGreaterThan(0);
    expect(positions[0].normal.x).not.toBeNaN();
    expect(positions[0].tangent.x).not.toBeNaN();
  });

  it('passes through arc, invert, and direction options', () => {
    const config = buildConfig({
      arcMode: true,
      invert: true,
      startAngle: 90,
      endAngle: 180,
    });
    const { result } = renderHook(() =>
      useRadialTransform({ config, center: { x: 0, y: 0 } })
    );

    const {
      config: radialConfig,
      transformPosition,
      getVector,
    } = result.current;

    expect(radialConfig.arcMode).toBe(true);
    expect(radialConfig.invert).toBe(true);

    // Partial arc (90°→180°, 4 items): step = 22.5°, centering offset = 11.25°,
    // so index 1 → 90 + 11.25 + 22.5 = 123.75° (elements centered within the arc).
    const pos = transformPosition(1, 4);
    expect(pos.angleDegrees).toBeCloseTo(123.75);
    expect(pos.stepAngleDegrees).toBeGreaterThan(0);

    const vector = getVector(Math.PI / 2, 2);
    expect(vector.dy).toBeCloseTo(-2);
  });
});
