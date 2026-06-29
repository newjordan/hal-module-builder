/**
 * Settings schema and validation
 * Single Responsibility: Define validation rules and constraints for settings
 */

/**
 * Validation constraints for common settings
 */
export const COMMON_CONSTRAINTS = {
  opacity: { min: 0, max: 1, step: 0.01 },
  positionX: { min: 0, max: 100, step: 1 },
  positionY: { min: 0, max: 100, step: 1 },
  rotation: { min: 0, max: 360, step: 1 },
  innerRadius: { min: 10, max: 400, step: 5 },
  startAngle: { min: 0, max: 360, step: 1 },
  endAngle: { min: 0, max: 360, step: 1 },
  responseSpeed: { min: 0.1, max: 1, step: 0.1 },
};

/**
 * Validation constraints for bar style
 */
export const BAR_CONSTRAINTS = {
  barCount: { min: 2, max: 128, step: 1 },
  barHeight: { min: 10, max: 500, step: 10 },
  barWidth: { min: 1, max: 50, step: 1 },
  barSpacing: { min: 0, max: 20, step: 1 },
  cornerRadius: { min: 0, max: 20, step: 1 },
};

/**
 * Validation constraints for dot style
 */
export const DOT_CONSTRAINTS = {
  dotCount: { min: 2, max: 128, step: 1 },
  dotSize: { min: 1, max: 30, step: 1 },
  dotSpacing: { min: 0, max: 20, step: 1 },
};

/**
 * Validation constraints for triangle style
 */
export const TRIANGLE_CONSTRAINTS = {
  triangleCount: { min: 2, max: 128, step: 1 },
  triangleSize: { min: 2, max: 40, step: 1 },
  triangleSpacing: { min: 0, max: 20, step: 1 },
};

/**
 * Validation constraints for diamond style
 */
export const DIAMOND_CONSTRAINTS = {
  diamondCount: { min: 2, max: 128, step: 1 },
  diamondSize: { min: 2, max: 40, step: 1 },
  diamondSpacing: { min: 0, max: 20, step: 1 },
};

/**
 * Validation constraints for hexagon style
 */
export const HEXAGON_CONSTRAINTS = {
  hexagonCount: { min: 2, max: 128, step: 1 },
  hexSize: { min: 2, max: 40, step: 1 },
  hexSpacing: { min: 0, max: 20, step: 1 },
};

/**
 * Validation constraints for circle style
 */
export const CIRCLE_CONSTRAINTS = {
  circleCount: { min: 2, max: 128, step: 1 },
  circleRadius: { min: 1, max: 30, step: 1 },
  circleSpacing: { min: 0, max: 20, step: 1 },
};

/**
 * Clamp a value between min and max
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Validate and clamp a setting value
 */
export function validateSetting(
  value: number,
  constraint: { min: number; max: number; step: number }
): number {
  const clamped = clamp(value, constraint.min, constraint.max);
  // Round to nearest step
  return Math.round(clamped / constraint.step) * constraint.step;
}

