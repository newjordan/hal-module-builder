/**
 * renderUtils - Core rendering utilities and optimization functions
 * Part of Story E6.3 - Rendering Engine & Integration
 */

import { ColorUtils } from './ColorUtils';
import { GradientUtils, GradientConfig } from './GradientUtils';

export interface ColorStop {
  position: number;
  color: string;
}

export type { GradientConfig };

export interface TransformMatrix {
  a: number;
  b: number;
  c: number;
  d: number;
  e: number;
  f: number;
}

export interface RenderProfileResult {
  operation: string;
  duration: number;
  memoryDelta: number;
  callCount: number;
}

/**
 * High-performance rendering utilities for visualization optimization
 */
export class RenderUtils {
  private static transformCache: Map<string, DOMMatrix> = new Map();
  /**
   * Create optimized gradient with caching
   */
  static createGradient(
    ctx: CanvasRenderingContext2D,
    config: GradientConfig,
    width: number,
    height: number
  ): CanvasGradient {
    return GradientUtils.createGradient(ctx, config, width, height);
  }

  /**
   * Convert HSL to RGB with caching
   */
  static hslToRgb(h: number, s: number, l: number): string {
    return ColorUtils.hslToRgb(h, s, l);
  }

  /**
   * Interpolate between colors efficiently
   */
  static interpolateColor(color1: string, color2: string, t: number): string {
    return ColorUtils.interpolateColor(color1, color2, t);
  }

  /**
   * Apply optimized clipping region
   */
  static applyClipping(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number
  ): void {
    ctx.save();
    ctx.beginPath();
    ctx.rect(x, y, width, height);
    ctx.clip();
  }

  /**
   * Restore clipping state
   */
  static restoreClipping(ctx: CanvasRenderingContext2D): void {
    ctx.restore();
  }

  /**
   * Set transform with caching
   */
  static setTransform(
    ctx: CanvasRenderingContext2D,
    transform: TransformMatrix
  ): void {
    const { a, b, c, d, e, f } = transform;
    ctx.setTransform(a, b, c, d, e, f);
  }

  /**
   * Create simple rotation matrix
   */
  static createRotationMatrix(angle: number): TransformMatrix {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    return { a: cos, b: sin, c: -sin, d: cos, e: 0, f: 0 };
  }

  /**
   * Create simple scaling matrix
   */
  static createScaleMatrix(scale: number): TransformMatrix {
    return { a: scale, b: 0, c: 0, d: scale, e: 0, f: 0 };
  }

  /**
   * Profile rendering operation - simplified
   */
  static profile<T>(_operation: string, fn: () => T): T {
    return fn(); // Simplified - just execute without profiling
  }

  /**
   * Optimize canvas for animation
   */
  static optimizeCanvasForAnimation(canvas: HTMLCanvasElement): void {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Enable hardware acceleration hints
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    // Optimize for frequent redraws
    (ctx as any).willReadFrequently = false;
  }

  /**
   * Clear caches to free memory
   */
  static clearCaches(): void {
    this.transformCache.clear();
    GradientUtils.clearCache();
    ColorUtils.clearCache();
  }
}
