export interface RadialConfig {
  centerX: number;
  centerY: number;
  innerRadius: number;
  outerRadius?: number;
  startAngle: number;
  endAngle: number;
  arcMode?: boolean;
  invert?: boolean;
  direction?: 'clockwise' | 'counterclockwise';
  // Optional: How content should be oriented
  orientationMode?: 'maintain' | 'follow-radius' | 'follow-tangent';
}

export interface RadialPosition {
  x: number;
  y: number;
  angle: number;
  angleDegrees: number;
  radius: number;
  midAngle: number;
  midAngleDegrees: number;
  stepAngleRadians: number;
  stepAngleDegrees: number;
  segmentArcLength: number;
  segmentChordLength: number;
  normal: { x: number; y: number };
  tangent: { x: number; y: number };
  midNormal: { x: number; y: number };
  midTangent: { x: number; y: number };
  orientationDegrees: number;
}
