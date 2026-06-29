/**
 * Shared utilities for visualization implementations
 * Extracted to reduce line counts in individual visualization classes
 */

import { ValidationResult, VisualizationConfig } from './IVisualization';

export class VisualizationUtils {
  /**
   * Common validation for base visualization properties
   */
  static validateBaseConfig(config: VisualizationConfig): string[] {
    const errors: string[] = [];

    if (config.barCount <= 0 || config.barCount > 512) {
      errors.push('barCount must be between 1 and 512');
    }

    if (config.maxHeight <= 0 || config.maxHeight > 1000) {
      errors.push('maxHeight must be between 1 and 1000');
    }

    if (config.responseSpeed < 0 || config.responseSpeed > 1) {
      errors.push('responseSpeed must be between 0 and 1');
    }

    return errors;
  }

  /**
   * Common color generation utilities
   */
  static generateRainbowColor(
    index: number,
    total: number,
    alpha: number = 1
  ): string {
    const hue = (index / total) * 360;
    return `hsla(${hue}, 70%, 50%, ${alpha})`;
  }

  static generatePulseColor(
    baseColor: string,
    intensity: number,
    pulseMode: string = 'subtle'
  ): string {
    const alpha =
      pulseMode === 'intense' ? 0.3 + intensity * 0.7 : 0.7 + intensity * 0.3;
    if (baseColor.startsWith('#')) {
      const hex = baseColor.slice(1);
      const r = parseInt(hex.substr(0, 2), 16);
      const g = parseInt(hex.substr(2, 2), 16);
      const b = parseInt(hex.substr(4, 2), 16);
      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }
    return baseColor;
  }

  /**
   * Common smoothing algorithms
   */
  static applySmoothing(data: number[], factor: number): number[] {
    if (factor <= 0 || factor >= 1) return data;

    const smoothed = [...data];
    for (let i = 1; i < smoothed.length - 1; i++) {
      const current = data[i] ?? 0;
      const prev = data[i - 1] ?? current;
      const next = data[i + 1] ?? current;
      smoothed[i] = current * (1 - factor) + (prev + next) * factor * 0.5;
    }
    return smoothed;
  }

  /**
   * Common normalization utilities
   */
  static normalizeData(data: number[], maxValue: number = 255): number[] {
    if (maxValue === 0) return data.map(() => 0);
    return data.map(value => Math.min(1, value / maxValue));
  }

  /**
   * Canvas optimization utilities
   */
  static optimizeCanvas(context: CanvasRenderingContext2D): void {
    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = 'high';
  }

  static clearCanvas(
    context: CanvasRenderingContext2D,
    width: number,
    height: number
  ): void {
    context.clearRect(0, 0, width, height);
  }

  /**
   * Performance monitoring utilities
   */
  static measureRenderTime<T>(operation: () => T, label: string): T {
    const start = performance.now();
    const result = operation();
    const duration = performance.now() - start;

    if (duration > 16.67) {
      // > 60fps threshold
      console.warn(`⚠️ Slow render in ${label}: ${duration.toFixed(2)}ms`);
    }

    return result;
  }

  /**
   * Common validation result builder
   */
  static buildValidationResult(
    errors: string[],
    warnings?: string[]
  ): ValidationResult {
    return {
      valid: errors.length === 0,
      ...(errors.length > 0 && { errors }),
      ...(warnings && warnings.length > 0 && { warnings }),
    };
  }
}
