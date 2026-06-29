import { Layer } from '../types/layer-types';

/**
 * Layer validation utilities extracted from LayerItem.tsx
 * Provides type guards, range validation, and property validation functions
 * for ensuring layer data integrity throughout the application.
 */

/**
 * Validates if a value is within a numeric range
 */
export const validateRange = (
  value: number,
  min: number,
  max: number
): number => {
  return Math.max(min, Math.min(max, value));
};

/**
 * Validates and normalizes opacity values
 */
export const validateOpacity = (opacity: number): number => {
  return validateRange(opacity, 0, 1);
};

/**
 * Validates and normalizes scale values
 */
export const validateScale = (scale: number): number => {
  return validateRange(scale, 0.1, 3);
};

/**
 * Validates and normalizes rotation values (keeps within 0-360)
 */
export const validateRotation = (rotation: number): number => {
  const normalized = rotation % 360;
  return normalized < 0 ? normalized + 360 : normalized;
};

/**
 * Validates offset values for positioning
 */
export const validateOffset = (offset: number): number => {
  return validateRange(offset, -500, 500);
};

/**
 * Validates brightness/contrast values
 */
export const validateImageAdjustment = (value: number): number => {
  return validateRange(value, 0, 2);
};

/**
 * Type guard to check if layer has gradient properties
 */
export const hasGradient = (
  layer: Layer
): layer is Layer & { gradient: NonNullable<Layer['gradient']> } => {
  return layer.gradient !== undefined && layer.gradient !== null;
};

/**
 * Type guard to check if layer has equalizer settings
 */
export const hasEqualizerSettings = (
  layer: Layer
): layer is Layer & {
  equalizerSettings: NonNullable<Layer['equalizerSettings']>;
} => {
  return (
    layer.equalizerSettings !== undefined && layer.equalizerSettings !== null
  );
};

/**
 * Type guard to check if layer has shape-specific properties
 */
export const hasShapeSpecific = (
  layer: Layer
): layer is Layer & { shapeSpecific: NonNullable<Layer['shapeSpecific']> } => {
  return layer.shapeSpecific !== undefined && layer.shapeSpecific !== null;
};

/**
 * Type guard to check if layer has circle settings
 */
export const hasCircleSettings = (
  layer: Layer
): layer is Layer & {
  circleSettings: NonNullable<Layer['circleSettings']>;
} => {
  return layer.circleSettings !== undefined && layer.circleSettings !== null;
};

/**
 * Validates hex color format
 */
export const validateColor = (color: string): string => {
  // Basic hex color validation
  const hexRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
  if (hexRegex.test(color)) {
    return color;
  }
  // Fallback to a safe default
  return '#ffffff';
};

/**
 * Validates gradient stop positions (must be between 0 and 1, sorted)
 */
export const validateGradientStops = (stops: number[]): number[] => {
  return stops.map(stop => validateRange(stop, 0, 1)).sort((a, b) => a - b);
};

/**
 * Validates gradient colors array
 */
export const validateGradientColors = (colors: string[]): string[] => {
  if (colors.length < 2) {
    return ['#ffffff', '#000000']; // Default gradient
  }
  return colors.map(validateColor);
};

/**
 * Validates equalizer bar count
 */
export const validateBarCount = (
  count: number | undefined,
  fallback = 64
): number => {
  const value = typeof count === 'number' ? count : fallback;
  return validateRange(value, 8, 256);
};

/**
 * Validates equalizer bar width
 */
export const validateBarWidth = (width: number): number => {
  return validateRange(width, 0.5, 50);
};

/**
 * Validates equalizer bar spacing
 */
export const validateBarSpacing = (spacing: number): number => {
  return validateRange(spacing, 0, 20);
};

/**
 * Validates equalizer radius values
 */
export const validateRadius = (
  radius: number | undefined,
  fallback = 0
): number => {
  const value = typeof radius === 'number' ? radius : fallback;
  return validateRange(value, 0, 500);
};

/**
 * Validates angles in degrees
 */
export const validateAngle = (angle: number): number => {
  return validateRange(angle, 0, 360);
};

/**
 * Validates response speed (0-1 range)
 */
export const validateResponseSpeed = (
  speed: number | undefined,
  fallback = 0.8
): number => {
  const value = typeof speed === 'number' ? speed : fallback;
  return validateRange(value, 0, 1);
};

/**
 * Validates glow intensity (0-1 range)
 */
export const validateGlowIntensity = (intensity: number): number => {
  return validateRange(intensity, 0, 1);
};

/**
 * Validates stroke width
 */
export const validateStrokeWidth = (width: number): number => {
  return validateRange(width, 0, 100);
};

/**
 * Comprehensive layer validation function
 * Validates all core properties of a layer
 */
export const validateLayer = (layer: Partial<Layer>): Partial<Layer> => {
  const validated: Partial<Layer> = { ...layer };

  if (typeof validated.opacity === 'number') {
    validated.opacity = validateOpacity(validated.opacity);
  }

  if (typeof validated.scale === 'number') {
    validated.scale = validateScale(validated.scale);
  }

  if (typeof validated.rotation === 'number') {
    validated.rotation = validateRotation(validated.rotation);
  }

  if (typeof validated.offsetX === 'number') {
    validated.offsetX = validateOffset(validated.offsetX);
  }

  if (typeof validated.offsetY === 'number') {
    validated.offsetY = validateOffset(validated.offsetY);
  }

  if (typeof validated.brightness === 'number') {
    validated.brightness = validateImageAdjustment(validated.brightness);
  }

  if (typeof validated.contrast === 'number') {
    validated.contrast = validateImageAdjustment(validated.contrast);
  }

  if (validated.color) {
    validated.color = validateColor(validated.color);
  }

  if (validated.fillColor) {
    validated.fillColor = validateColor(validated.fillColor);
  }

  if (validated.strokeColor) {
    validated.strokeColor = validateColor(validated.strokeColor);
  }

  if (typeof validated.strokeWidth === 'number') {
    validated.strokeWidth = validateStrokeWidth(validated.strokeWidth);
  }

  // Validate gradient properties
  if (validated.gradient) {
    validated.gradient.colors = validateGradientColors(
      validated.gradient.colors
    );
    validated.gradient.stops = validateGradientStops(validated.gradient.stops);
    if (typeof validated.gradient.angle === 'number') {
      validated.gradient.angle = validateAngle(validated.gradient.angle);
    }
  }

  return validated;
};

/**
 * Validates animation speed values
 */
export const validateAnimationSpeed = (speed: number): number => {
  return validateRange(speed, 0.1, 5);
};

/**
 * Validates position percentage values (0-1 range)
 */
export const validatePositionPercentage = (position: number): number => {
  return validateRange(position, 0, 1);
};
