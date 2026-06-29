/**
 * Type definitions for HAL Builder gradient system
 * Extracted from useGradientManagement for better organization and reusability
 */

/**
 * Supported gradient types in the HAL Builder system
 */
export type GradientType = 'linear' | 'radial' | 'conic';

/**
 * Gradient targets for different layer contexts
 */
export type GradientTarget = 'layer' | 'fill' | 'stroke' | 'radial' | 'custom';

/**
 * Base gradient data structure
 */
export interface GradientData {
  type: GradientType;
  colors: string[];
  stops: number[];
  angle?: number;
  centerX?: number;
  centerY?: number;
}

/**
 * Gradient preset for common gradient patterns
 */
export interface GradientPreset {
  name: string;
  type: GradientType;
  colors: string[];
  stops: number[];
  angle?: number;
  centerX?: number;
  centerY?: number;
  description?: string;
  tags?: string[];
}

/**
 * Gradient validation result
 */
export interface GradientValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * Gradient operation result
 */
export interface GradientOperationResult {
  success: boolean;
  data?: GradientData;
  error?: string;
}

/**
 * Color validation formats
 */
export type ColorFormat = 'hex' | 'rgb' | 'hsl' | 'rgba' | 'hsla';

/**
 * Gradient calculation options
 */
export interface GradientCalculationOptions {
  precision?: number;
  normalizeStops?: boolean;
  validateColors?: boolean;
}

/**
 * Core gradient operations interface
 */
export interface GradientCoreOperations {
  addColor: (
    gradient: GradientData,
    color: string,
    position?: number
  ) => GradientData;
  removeColor: (gradient: GradientData, index: number) => GradientData;
  updateColor: (
    gradient: GradientData,
    index: number,
    color: string
  ) => GradientData;
  updateStop: (
    gradient: GradientData,
    index: number,
    stop: number
  ) => GradientData;
  updateType: (gradient: GradientData, type: GradientType) => GradientData;
  updateAngle: (gradient: GradientData, angle: number) => GradientData;
  updateCenter: (
    gradient: GradientData,
    centerX: number,
    centerY: number
  ) => GradientData;
}

/**
 * Gradient validation operations interface
 */
export interface GradientValidationOperations {
  validateColor: (color: string) => boolean;
  validateStops: (stops: number[]) => boolean;
  validateAngle: (angle: number) => boolean;
  validatePosition: (position: number) => boolean;
  validateGradientData: (
    colors: string[],
    stops: number[]
  ) => GradientValidationResult;
  validateGradient: (gradient: any) => GradientValidationResult;
}

/**
 * Constants for gradient system
 */
export const GRADIENT_CONSTANTS = {
  MIN_COLORS: 2,
  MAX_COLORS: 20,
  MIN_STOP: 0,
  MAX_STOP: 1,
  MIN_ANGLE: 0,
  MAX_ANGLE: 360,
  MIN_POSITION: 0,
  MAX_POSITION: 100,
  DEFAULT_ANGLE: 0,
  DEFAULT_CENTER_X: 50,
  DEFAULT_CENTER_Y: 50,
} as const;

/**
 * Color format regex patterns
 */
export const COLOR_PATTERNS = {
  HEX: /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/,
  RGB: /^rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)$/,
  RGBA: /^rgba\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*(0|1|0?\.\d+)\s*\)$/,
  HSL: /^hsl\(\s*(\d+)\s*,\s*(\d+)%\s*,\s*(\d+)%\s*\)$/,
  HSLA: /^hsla\(\s*(\d+)\s*,\s*(\d+)%\s*,\s*(\d+)%\s*,\s*(0|1|0?\.\d+)\s*\)$/,
} as const;
