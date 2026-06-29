import { RadialTransformService } from '../RadialTransformService';
import { RadialConfig } from '../types';

const DEG_TO_RAD = Math.PI / 180;

describe('RadialTransformService', () => {
  const baseConfig: RadialConfig = {
    centerX: 100,
    centerY: 100,
    innerRadius: 50,
    startAngle: 0,
    endAngle: 360,
  };

  it('returns top-center position for a single point', () => {
    const result = RadialTransformService.calculateRadialPosition(
      0,
      1,
      baseConfig
    );

    expect(result.x).toBeCloseTo(100);
    expect(result.y).toBeCloseTo(50);
    expect(result.angleDegrees).toBeCloseTo(0);
    expect(result.segmentArcLength).toBeCloseTo(0);
    expect(result.segmentChordLength).toBeCloseTo(0);
    expect(result.normal.x).toBeCloseTo(0);
    expect(result.normal.y).toBeCloseTo(-1);
    expect(result.orientationDegrees).toBeCloseTo(0);
  });

  it('guards against totals less than or equal to zero', () => {
    const result = RadialTransformService.calculateRadialPosition(
      0,
      0,
      baseConfig
    );

    expect(result.x).toBeCloseTo(100);
    expect(result.y).toBeCloseTo(50);
  });

  it('spreads positions evenly across the full circle', () => {
    const positions = RadialTransformService.batchTransform(
      { length: 4 },
      baseConfig
    );

    expect(positions).toHaveLength(4);
    expect(positions[0].angleDegrees).toBeCloseTo(0);
    expect(positions[1].angleDegrees).toBeCloseTo(90);
    expect(positions[2].angleDegrees).toBeCloseTo(180);
    expect(positions[3].angleDegrees).toBeCloseTo(270);
    expect(positions[0].stepAngleDegrees).toBeCloseTo(90);
    expect(positions[0].segmentArcLength).toBeCloseTo(
      baseConfig.innerRadius * (90 * DEG_TO_RAD)
    );
    expect(positions[0].segmentChordLength).toBeCloseTo(
      2 * baseConfig.innerRadius * Math.sin((90 * DEG_TO_RAD) / 2)
    );
  });

  it('centers elements within a partial arc with equal padding', () => {
    // Partial arcs use N divisions and a half-step centering offset so elements
    // are evenly distributed with equal padding on both ends (visual symmetry),
    // rather than clamped exactly onto the start/end angles.
    const config: RadialConfig = {
      ...baseConfig,
      arcMode: true,
      startAngle: 0,
      endAngle: 180,
    };

    const positions = RadialTransformService.batchTransform(
      { length: 5 },
      config
    );

    // step = 180 / 5 = 36°, centering offset = 18° → 18, 54, 90, 126, 162
    expect(positions).toHaveLength(5);
    expect(positions[0].angleDegrees).toBeCloseTo(18);
    expect(positions[2].angleDegrees).toBeCloseTo(90);
    expect(positions[4].angleDegrees).toBeCloseTo(162);
    // symmetric about the arc midpoint (90°)
    expect(positions[0].angleDegrees + positions[4].angleDegrees).toBeCloseTo(
      180
    );
    expect(positions[1].angleDegrees + positions[3].angleDegrees).toBeCloseTo(
      180
    );
  });

  it('keeps wrap-around spacing for full circle arcs', () => {
    const config: RadialConfig = {
      ...baseConfig,
      arcMode: true,
      startAngle: 0,
      endAngle: 360,
    };

    const positions = RadialTransformService.batchTransform(
      { length: 4 },
      config
    );

    expect(positions).toHaveLength(4);
    expect(positions[0].angleDegrees).toBeCloseTo(0);
    expect(positions[1].angleDegrees).toBeCloseTo(90);
    expect(positions[2].angleDegrees).toBeCloseTo(180);
    expect(positions[3].angleDegrees).toBeCloseTo(270);
  });

  it('clamps indices larger than the total', () => {
    const result = RadialTransformService.calculateRadialPosition(
      99,
      4,
      baseConfig
    );

    expect(result.angleDegrees).toBeCloseTo(270);
  });

  it('supports counterclockwise direction', () => {
    const config: RadialConfig = {
      ...baseConfig,
      direction: 'counterclockwise',
    };

    const result = RadialTransformService.calculateRadialPosition(1, 4, config);

    expect(result.angleDegrees).toBeCloseTo(270);
    expect(result.tangent.x).toBeCloseTo(result.normal.y);
    expect(result.tangent.y).toBeCloseTo(-result.normal.x);
  });

  it('returns inverted vectors when requested', () => {
    const vector = RadialTransformService.getRadialVector(
      Math.PI / 2,
      10,
      true
    );

    expect(vector.dx).toBeCloseTo(0);
    expect(vector.dy).toBeCloseTo(-10);
  });
});
