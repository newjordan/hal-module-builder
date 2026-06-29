/**
 * scalingAlgorithms - Core scaling and normalization algorithms
 * Part of Story E6.3 - Rendering Engine & Integration
 */

import { ScalingUtils } from './ScalingUtils';
import { ScalingImplementations } from './ScalingImplementations';

export interface ScalingConfig {
  inputRange: { min: number; max: number };
  outputRange: { min: number; max: number };
  algorithm: 'linear' | 'logarithmic' | 'exponential' | 'cubic';
  compression?: {
    enabled: boolean;
    ratio: number;
    threshold: number;
  };
}

export interface ScalingResult {
  scaledValues: number[];
  actualRange: { min: number; max: number };
  compressionApplied: boolean;
  performance: {
    executionTime: number;
    memoryAllocated: number;
  };
}

export interface NormalizationConfig {
  method: 'minmax' | 'zscore' | 'robust';
  targetRange: { min: number; max: number };
}

/**
 * High-performance scaling algorithms for real-time audio visualization
 */
export class ScalingAlgorithms {
  private static readonly CACHE_SIZE = 1000;
  private scaleCache: Map<string, number[]> = new Map();

  /**
   * Scale array of values with specified algorithm
   */
  scale(values: number[], config: ScalingConfig): ScalingResult {
    const startTime = performance.now();
    const cacheKey = ScalingUtils.createCacheKey(
      values,
      config.algorithm,
      config.inputRange,
      config.outputRange
    );
    const cached = this.scaleCache.get(cacheKey);

    if (cached) {
      return {
        scaledValues: [...cached],
        actualRange: ScalingUtils.calculateRange(cached),
        compressionApplied: false,
        performance: {
          executionTime: performance.now() - startTime,
          memoryAllocated: 0,
        },
      };
    }

    // Apply scaling algorithm
    let scaledValues: number[];
    switch (config.algorithm) {
      case 'logarithmic':
        scaledValues = ScalingImplementations.scaleLogarithmic(values, config);
        break;
      case 'exponential':
        scaledValues = ScalingImplementations.scaleExponential(values, config);
        break;
      case 'cubic':
        scaledValues = ScalingImplementations.scaleExponential(values, config);
        break; // Use exponential as fallback
      default:
        scaledValues = ScalingImplementations.scaleLinear(values, config);
    }

    // Apply compression if enabled
    const compressionApplied = !!config.compression?.enabled;
    if (compressionApplied) {
      scaledValues = ScalingImplementations.applyCompression(
        scaledValues,
        config.compression!
      );
    }

    // Cache result
    if (this.scaleCache.size < ScalingAlgorithms.CACHE_SIZE) {
      this.scaleCache.set(cacheKey, [...scaledValues]);
    }

    return {
      scaledValues,
      actualRange: ScalingUtils.calculateRange(scaledValues),
      compressionApplied,
      performance: {
        executionTime: performance.now() - startTime,
        memoryAllocated: 0,
      },
    };
  }

  /**
   * Simple min-max normalization
   */
  normalize(values: number[]): number[] {
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min;

    if (range === 0) return new Array(values.length).fill(0.5);
    return values.map(value => (value - min) / range);
  }

  /**
   * Clear caches to free memory
   */
  clearCache(): void {
    this.scaleCache.clear();
  }
}
