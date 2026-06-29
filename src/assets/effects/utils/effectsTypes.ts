export {};

// Shared effect-related type definitions for algorithms and utilities
/** Direction of wave distortion */
export type WaveDirection = 'horizontal' | 'vertical' | 'diagonal' | 'radial';

/** Parameters for wave-based offsets */
export interface WaveParams {
  amplitude?: number;
  frequency?: number;
  phase?: number;
  direction?: WaveDirection;
  centerX?: number; // optional absolute coordinate for radial helpers
  centerY?: number; // optional absolute coordinate for radial helpers
}

/** Ripple distortion parameters */
export interface RippleParams {
  centerX: number;
  centerY: number;
  amplitude: number;
  frequency: number;
  radius: number;
  phase: number;
}

/** Twist effect parameters (static or animated) */
export interface TwistParams {
  centerX: number;
  centerY: number;
  radius: number;
  twist: number;
  speed?: number;
}

/** Swirl effect parameters (twist with distance/time) */
export interface SwirlParams {
  centerX: number;
  centerY: number;
  radius: number;
  twist: number;
  speed?: number;
}

/** Generic filter parameters (e.g., blur radius, strength) */
export interface FilterParams {
  radius?: number;
  strength?: number;
}

/** Procedural noise parameters */
export interface NoiseParams {
  seed?: number;
  amplitude?: number;
}

/** Validation result for parameter checks */
export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings?: string[];
}

// Additional types to satisfy story acceptance criteria
/** Distortion params alias of WaveParams */
export interface DistortionParams extends WaveParams {}

/** Union of all algorithm parameter types */
export type AlgorithmParams = WaveParams | RippleParams | TwistParams;

/** Minimal processing context for time/size-dependent algos */
export interface ProcessingContext {
  width: number;
  height: number;
  time?: number;
}

/** Coordinate mapping result used by processors */
export interface CoordinateTransform {
  sourceX: number;
  sourceY: number;
}

/** Lightweight perf metrics for internal profiling */
export interface PerformanceMetrics {
  memoryMB?: number;
  timeMs?: number;
}

/** Alias for validation results (compat with story wording) */
export type ValidationResults = ValidationResult;

/** Union of effect configuration shapes used by processors */
export type EffectConfig = DistortionParams | RippleParams | TwistParams;
