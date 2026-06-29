/**
 * ScalingImplementations - Individual scaling algorithm implementations
 * Extracted from ScalingAlgorithms for better modularity
 */

import { ScalingConfig } from './scalingAlgorithms';

export class ScalingImplementations {
  /**
   * Linear scaling algorithm
   */
  static scaleLinear(values: number[], config: ScalingConfig): number[] {
    const { inputRange, outputRange } = config;
    const inputSpan = inputRange.max - inputRange.min;
    const outputSpan = outputRange.max - outputRange.min;

    if (inputSpan === 0) return new Array(values.length).fill(outputRange.min);

    return values.map(value => {
      const normalized = (value - inputRange.min) / inputSpan;
      return outputRange.min + normalized * outputSpan;
    });
  }

  /**
   * Logarithmic scaling algorithm - simplified
   */
  static scaleLogarithmic(values: number[], config: ScalingConfig): number[] {
    const { inputRange, outputRange } = config;
    const outputSpan = outputRange.max - outputRange.min;

    return values.map(value => {
      const logValue = Math.log(Math.max(value, 0.001));
      const logMin = Math.log(Math.max(inputRange.min, 0.001));
      const logMax = Math.log(Math.max(inputRange.max, 0.001));
      const normalized = (logValue - logMin) / (logMax - logMin || 1);
      return outputRange.min + normalized * outputSpan;
    });
  }

  /**
   * Exponential scaling algorithm
   */
  static scaleExponential(values: number[], config: ScalingConfig): number[] {
    const { inputRange, outputRange } = config;
    const inputSpan = inputRange.max - inputRange.min;
    const outputSpan = outputRange.max - outputRange.min;

    if (inputSpan === 0) return new Array(values.length).fill(outputRange.min);

    return values.map(value => {
      const normalized = (value - inputRange.min) / inputSpan;
      const exponential = Math.pow(normalized, 2);
      return outputRange.min + exponential * outputSpan;
    });
  }

  /**
   * Apply dynamic range compression
   */
  static applyCompression(
    values: number[],
    compression: { ratio: number; threshold: number }
  ): number[] {
    const { ratio, threshold } = compression;

    return values.map(value => {
      if (value <= threshold) {
        return value;
      } else {
        const excess = value - threshold;
        const compressedExcess = excess / ratio;
        return threshold + compressedExcess;
      }
    });
  }
}
