/**
 * Spatial Behavior System - Core Types
 * Ultra-architecture for spatial transformations beyond simple radial positioning
 */

// ===== Core Spatial Concepts =====

export interface SpatialPosition {
  x: number;
  y: number;
  z?: number;
}

export interface SpatialOrientation {
  angle: number; // Rotation in radians
  facing?:
    | 'north'
    | 'south'
    | 'east'
    | 'west'
    | 'center'
    | 'outward'
    | 'tangent';
}

export interface SpatialTransform {
  position: SpatialPosition;
  orientation: SpatialOrientation;
  scale?: number;
  depth?: number;
}

// ===== Arrangement Patterns =====

export interface CircleConfig {
  radius: number;
  count?: number;
  startAngle?: number;
  endAngle?: number;
  distribution?: 'even' | 'clustered' | 'random';
}

export interface SpiralConfig {
  arms: number;
  tightness: number;
  innerRadius: number;
  outerRadius: number;
  rotations?: number;
}

export interface OrbitConfig {
  layers: Array<{
    radius: number;
    count: number;
    speed?: number;
  }>;
  centerMass?: boolean;
}

export interface GridConfig {
  rows: number;
  cols: number;
  spacing: number;
  shape?: 'square' | 'circular' | 'hexagonal';
}

// ===== Orientation Behaviors =====

export type OrientationMode =
  | 'maintain' // Keep original orientation
  | 'north' // All point up
  | 'south' // All point down
  | 'east' // All point right
  | 'west' // All point left
  | 'center' // Point toward center
  | 'outward' // Point away from center
  | 'tangent' // Follow path direction
  | 'random' // Random orientations
  | 'custom'; // User-defined function

export interface OrientationConfig {
  mode: OrientationMode;
  offset?: number;
  randomRange?: number;
  customFunction?: (index: number, position: SpatialPosition) => number;
}

// ===== Animation System =====

export interface AnimationConfig {
  type: 'rotate' | 'scale' | 'position' | 'orbit';
  duration?: number;
  easing?: 'linear' | 'ease' | 'ease-in' | 'ease-out' | 'ease-in-out';
  loop?: boolean;
  direction?: 'forward' | 'reverse' | 'alternate';
}

export interface RotationAnimation extends AnimationConfig {
  type: 'rotate';
  speed: number; // Rotations per second
  axis?: 'x' | 'y' | 'z'; // For 3D rotations
}

export interface AudioReactiveConfig {
  beatSync?: boolean;
  frequencyRange?: [number, number];
  amplitudeMultiplier?: number;
  smoothing?: number;
}

// ===== Effects System =====

export interface DepthConfig {
  enabled: boolean;
  perspective?: number;
  vanishingPoint?: SpatialPosition;
  zNear?: number;
  zFar?: number;
}

export interface LightingConfig {
  enabled: boolean;
  source?: SpatialPosition | 'center' | 'ambient';
  intensity?: number;
  color?: string;
  shadows?: boolean;
}

// ===== Builder Pattern Interfaces =====

export interface ArrangementBuilder {
  // Arrangement patterns
  circle(config: CircleConfig): SpatialBuilder;
  spiral(config: SpiralConfig): SpatialBuilder;
  orbit(config: OrbitConfig): SpatialBuilder;
  grid(config: GridConfig): SpatialBuilder;

  // Custom arrangement
  custom(
    positionFn: (index: number, total: number) => SpatialPosition
  ): SpatialBuilder;
}

export interface OrientationBuilder {
  // Direction presets
  north(): SpatialBuilder;
  south(): SpatialBuilder;
  east(): SpatialBuilder;
  west(): SpatialBuilder;

  // Relative orientations
  center(): SpatialBuilder;
  outward(): SpatialBuilder;
  tangent(): SpatialBuilder;

  // Custom orientation
  angle(degrees: number): SpatialBuilder;
  custom(
    orientationFn: (index: number, position: SpatialPosition) => number
  ): SpatialBuilder;
}

export interface AnimationBuilder {
  // Basic animations
  rotate(config: Partial<RotationAnimation>): SpatialBuilder;
  pulse(config: { speed: number; intensity: number }): SpatialBuilder;

  // Audio-reactive
  beatSync(config: AudioReactiveConfig): SpatialBuilder;

  // No animation
  static(): SpatialBuilder;
}

export interface EffectsBuilder {
  // Depth and 3D
  depth(config: Partial<DepthConfig>): SpatialBuilder;

  // Lighting
  lighting(config: Partial<LightingConfig>): SpatialBuilder;

  // No effects
  none(): SpatialBuilder;
}

// ===== Main Builder Interface =====

export interface SpatialBuilder {
  // Core transform steps
  arrange: ArrangementBuilder;
  orient: OrientationBuilder;
  animate: AnimationBuilder;
  effects: EffectsBuilder;

  // Execution
  build(count: number): SpatialTransform[];
  buildSingle(index: number, total: number): SpatialTransform;

  // React hook integration
  toHook(): (count: number) => SpatialTransform[];
}

// ===== Configuration Storage =====

export interface SpatialBehaviorConfig {
  arrangement?: {
    type: 'circle' | 'spiral' | 'orbit' | 'grid' | 'custom';
    config: CircleConfig | SpiralConfig | OrbitConfig | GridConfig;
    customFn?: (index: number, total: number) => SpatialPosition;
  };

  orientation?: OrientationConfig;

  animation?: AnimationConfig & AudioReactiveConfig;

  effects?: {
    depth?: DepthConfig;
    lighting?: LightingConfig;
  };

  // Global settings
  center?: SpatialPosition;
  globalScale?: number;
  performanceMode?: 'quality' | 'performance' | 'balanced';
}

// ===== Utility Types =====

export type PositionFunction = (
  index: number,
  total: number
) => SpatialPosition;
export type OrientationFunction = (
  index: number,
  position: SpatialPosition
) => number;

export interface SpatialUtils {
  // Math helpers
  polarToCartesian(
    angle: number,
    radius: number,
    center?: SpatialPosition
  ): SpatialPosition;
  cartesianToPolar(
    position: SpatialPosition,
    center?: SpatialPosition
  ): { angle: number; radius: number };

  // Animation helpers
  lerp(a: number, b: number, t: number): number;
  easeInOut(t: number): number;

  // Audio helpers
  mapFrequencyToSpatial(
    frequencyData: number[],
    spatialConfig: SpatialBehaviorConfig
  ): SpatialTransform[];
}
