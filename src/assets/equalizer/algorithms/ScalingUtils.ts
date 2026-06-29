/**
 * ScalingUtils - Utility functions for scaling calculations
 * Extracted from ScalingAlgorithms for better modularity
 */

export class ScalingUtils {
  /**
   * Calculate median value
   */
  static calculateMedian(sortedValues: number[]): number {
    const mid = Math.floor(sortedValues.length / 2);
    return sortedValues.length % 2 === 0
      ? (sortedValues[mid - 1]! + sortedValues[mid]!) / 2
      : sortedValues[mid]!;
  }

  /**
   * Calculate quartile value
   */
  static calculateQuartile(sortedValues: number[], quartile: number): number {
    const index = (sortedValues.length - 1) * quartile;
    const lower = Math.floor(index);
    const upper = Math.ceil(index);
    const weight = index % 1;

    return sortedValues[lower]! * (1 - weight) + sortedValues[upper]! * weight;
  }

  /**
   * Calculate range of values
   */
  static calculateRange(values: number[]): { min: number; max: number } {
    return {
      min: Math.min(...values),
      max: Math.max(...values),
    };
  }

  /**
   * Create cache key for scaling configuration
   */
  static createCacheKey(
    values: number[],
    algorithm: string,
    inputRange: any,
    outputRange: any
  ): string {
    const valueHash = values.length + '_' + values.slice(0, 5).join(',');
    return `${valueHash}_${algorithm}_${inputRange.min}_${outputRange.max}`;
  }

  /**
   * Get approximate memory usage
   */
  static getMemoryUsage(): number {
    if ('memory' in performance) {
      return (performance as any).memory.usedJSHeapSize;
    }
    return 0;
  }
}
