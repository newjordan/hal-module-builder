import { RadialConfig, RadialPosition } from './types';

const DEG_TO_RAD = Math.PI / 180;
const RAD_TO_DEG = 180 / Math.PI;

const normalizeTotal = (total: number): number => {
  if (!Number.isFinite(total) || total <= 0) {
    return 0;
  }

  return Math.floor(total);
};

const clampIndex = (index: number, total: number): number => {
  if (!Number.isFinite(index)) {
    return 0;
  }

  if (total <= 0) {
    return 0;
  }

  if (index < 0) {
    return 0;
  }

  if (index >= total) {
    return total - 1;
  }

  return Math.floor(index);
};

export class RadialTransformService {
  static calculateRadialPosition(
    index: number,
    total: number,
    config: RadialConfig
  ): RadialPosition {
    const safeTotal = normalizeTotal(total);
    const targetIndex = clampIndex(index, safeTotal);

    const rawSpan = (config.endAngle ?? 0) - (config.startAngle ?? 0);
    const shouldAssumeCircle =
      !config.arcMode && safeTotal > 1 && rawSpan === 0;
    const span = shouldAssumeCircle ? 360 : rawSpan;
    const spanMagnitude = Math.abs(span);
    const isPartialArc = config.arcMode && spanMagnitude < 360;

    // For partial arcs, use N divisions to center elements within the arc
    // This gives better visual symmetry: elements are evenly distributed
    // with equal padding on both ends of the arc
    // For full circles (360°), use N divisions so elements don't overlap at start/end
    const divisions = Math.max(1, safeTotal);
    const stepMagnitudeDegrees = safeTotal <= 1 ? 0 : spanMagnitude / divisions;
    const stepAngleRadians = stepMagnitudeDegrees * DEG_TO_RAD;

    const direction = config.direction === 'counterclockwise' ? -1 : 1;
    const baseAngle =
      direction === -1 ? (config.endAngle ?? 0) : (config.startAngle ?? 0);

    // For partial arcs, offset by half a step to center elements within the arc
    // This creates visually symmetric distribution
    const arcCenteringOffset = isPartialArc ? stepMagnitudeDegrees / 2 : 0;
    const progress = targetIndex;

    const angleDegrees =
      baseAngle +
      direction * (arcCenteringOffset + progress * stepMagnitudeDegrees);
    const angle = angleDegrees * DEG_TO_RAD - Math.PI / 2;

    const midAngleDegrees =
      angleDegrees + direction * (stepMagnitudeDegrees / 2);
    const midAngle = midAngleDegrees * DEG_TO_RAD - Math.PI / 2;

    const radius = Number.isFinite(config.innerRadius) ? config.innerRadius : 0;
    const centerX = config.centerX ?? 0;
    const centerY = config.centerY ?? 0;
    const x = centerX + Math.cos(angle) * radius;
    const y = centerY + Math.sin(angle) * radius;

    const normal = {
      x: Math.cos(angle),
      y: Math.sin(angle),
    };

    const midNormal = {
      x: Math.cos(midAngle),
      y: Math.sin(midAngle),
    };

    const tangent =
      direction === 1
        ? { x: -normal.y, y: normal.x }
        : { x: normal.y, y: -normal.x };

    const midTangent =
      direction === 1
        ? { x: -midNormal.y, y: midNormal.x }
        : { x: midNormal.y, y: -midNormal.x };

    const segmentArcLength = radius * stepAngleRadians;
    const segmentChordLength = 2 * radius * Math.sin(stepAngleRadians / 2);

    return {
      x,
      y,
      angle,
      angleDegrees,
      radius,
      midAngle,
      midAngleDegrees,
      stepAngleRadians,
      stepAngleDegrees: stepMagnitudeDegrees,
      segmentArcLength: Number.isFinite(segmentArcLength)
        ? segmentArcLength
        : 0,
      segmentChordLength: Number.isFinite(segmentChordLength)
        ? segmentChordLength
        : 0,
      normal,
      tangent,
      midNormal,
      midTangent,
      orientationDegrees: RAD_TO_DEG * (angle + Math.PI / 2),
    };
  }

  static batchTransform(
    source: { length: number },
    config: RadialConfig
  ): RadialPosition[] {
    const safeTotal = normalizeTotal(source.length);

    return Array.from({ length: safeTotal }, (_, positionIndex) =>
      this.calculateRadialPosition(positionIndex, safeTotal, config)
    );
  }

  static getRadialVector(
    angle: number,
    magnitude: number,
    invert = false
  ): { dx: number; dy: number } {
    const sign = invert ? -1 : 1;

    return {
      dx: Math.cos(angle) * magnitude * sign,
      dy: Math.sin(angle) * magnitude * sign,
    };
  }
}
