/**
 * FrequencyProcessor - Frequency domain processing extracted from AudioProcessor
 * Part of Story E6.1 - Audio Processing Extraction
 *
 * Focused on:
 * - Frequency domain data processing
 * - Frequency binning and scaling algorithms
 * - Configurable frequency range mapping
 * - Optimized memory allocation patterns
 * - Frequency data validation
 */

export interface FrequencyRange {
  min: number;
  max: number;
  label: string;
}

export interface FrequencyProcessorConfig {
  sampleRate: number;
  binCount: number;
  frequencyRanges?: Record<string, FrequencyRange>;
}

export interface FrequencyBandResult {
  bands: number[];
  range: FrequencyRange;
  scaling: 'linear' | 'logarithmic';
  targetBandCount: number;
}

/**
 * FrequencyProcessor handles frequency domain data processing and band mapping
 * Extracted from monolithic AudioProcessor for better separation of concerns
 */
export class FrequencyProcessor {
  private config: FrequencyProcessorConfig;
  private static readonly DEFAULT_RANGES: Record<string, FrequencyRange> = {
    bass: { min: 20, max: 250, label: 'Bass' },
    mid: { min: 250, max: 2000, label: 'Mid' },
    treble: { min: 2000, max: 20000, label: 'Treble' },
    full: { min: 20, max: 20000, label: 'Full Range' },
  };

  constructor(config: FrequencyProcessorConfig) {
    this.config = {
      ...config,
      frequencyRanges:
        config.frequencyRanges || FrequencyProcessor.DEFAULT_RANGES,
    };
    this.validateConfig();
  }

  /**
   * Extract frequency range from full spectrum data
   */
  extractFrequencyRange(
    frequencyData: Uint8Array,
    rangeName: string = 'full'
  ): Uint8Array {
    const range = this.config.frequencyRanges?.[rangeName];
    if (!range || rangeName === 'full') {
      return frequencyData;
    }

    try {
      const { startBin, endBin } = this.calculateBinRange(range);
      return frequencyData.slice(startBin, endBin);
    } catch (error) {
      // Return full range for invalid range specifications
      return frequencyData;
    }
  }

  /**
   * Map frequency data to specified number of bands with different scaling options
   */
  mapFrequencyBands(
    frequencyData: number[],
    targetBandCount: number,
    scaling: 'linear' | 'logarithmic' = 'logarithmic',
    rangeName: string = 'full'
  ): FrequencyBandResult {
    const range = this.config.frequencyRanges?.[rangeName];
    if (!range) {
      return {
        bands: new Array(targetBandCount).fill(0),
        range: FrequencyProcessor.DEFAULT_RANGES.full!,
        scaling,
        targetBandCount,
      };
    }

    if (frequencyData.length === 0) {
      return {
        bands: new Array(targetBandCount).fill(0),
        range,
        scaling,
        targetBandCount,
      };
    }

    let sourceData = frequencyData;

    // Apply range filtering if not full range
    if (rangeName !== 'full') {
      try {
        const { startBin, endBin } = this.calculateBinRange(range);
        sourceData = frequencyData.slice(startBin, endBin);
      } catch (error) {
        // Use full data if range calculation fails
        sourceData = frequencyData;
      }
    }

    const bands =
      scaling === 'logarithmic'
        ? this.mapBandsLogarithmic(sourceData, targetBandCount)
        : this.mapBandsLinear(sourceData, targetBandCount);

    return {
      bands,
      range,
      scaling,
      targetBandCount,
    };
  }

  /**
   * Calculate average frequency level for a given range
   */
  calculateAverageLevel(
    frequencyData: Uint8Array,
    rangeName: string = 'full'
  ): number {
    const rangeData = this.extractFrequencyRange(frequencyData, rangeName);

    if (rangeData.length === 0) return 0;

    let sum = 0;
    for (let i = 0; i < rangeData.length; i++) {
      sum += rangeData[i] || 0;
    }

    return sum / rangeData.length;
  }

  /**
   * Detect frequency peaks above threshold
   */
  detectPeaks(
    frequencyData: Uint8Array,
    threshold: number = 100,
    rangeName: string = 'full'
  ): Array<{ index: number; frequency: number; value: number }> {
    const rangeData = this.extractFrequencyRange(frequencyData, rangeName);
    const peaks: Array<{ index: number; frequency: number; value: number }> =
      [];

    if (rangeData.length === 0) return peaks;

    let startBin = 0;
    if (rangeName !== 'full') {
      const range = this.config.frequencyRanges?.[rangeName];
      if (range) {
        try {
          const binRange = this.calculateBinRange(range);
          startBin = binRange.startBin;
        } catch (error) {
          // Use default startBin of 0 for invalid ranges
          startBin = 0;
        }
      }
    }

    for (let i = 1; i < rangeData.length - 1; i++) {
      const current = rangeData[i] || 0;
      const prev = rangeData[i - 1] || 0;
      const next = rangeData[i + 1] || 0;

      if (current > prev && current > next && current >= threshold) {
        const actualIndex = startBin + i;
        const frequency = this.binToFrequency(actualIndex);
        peaks.push({
          index: actualIndex,
          frequency,
          value: current,
        });
      }
    }

    return peaks;
  }

  /**
   * Convert frequency bin to actual frequency in Hz
   */
  binToFrequency(bin: number): number {
    const nyquist = this.config.sampleRate / 2;
    return (bin * nyquist) / this.config.binCount;
  }

  /**
   * Convert frequency in Hz to bin number
   */
  frequencyToBin(frequency: number): number {
    const nyquist = this.config.sampleRate / 2;
    return Math.round((frequency * this.config.binCount) / nyquist);
  }

  /**
   * Update processor configuration
   */
  updateConfig(newConfig: Partial<FrequencyProcessorConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.validateConfig();
  }

  /**
   * Get available frequency ranges (returns deep copy to prevent modification)
   */
  getAvailableRanges(): Record<string, FrequencyRange> {
    const ranges: Record<string, FrequencyRange> = {};
    for (const [key, range] of Object.entries(
      this.config.frequencyRanges || {}
    )) {
      ranges[key] = { ...range };
    }
    return ranges;
  }

  /**
   * Linear band mapping for even distribution
   */
  private mapBandsLinear(
    sourceData: number[],
    targetBandCount: number
  ): number[] {
    const bands = new Array(targetBandCount).fill(0);
    const bandsPerBin = sourceData.length / targetBandCount;

    for (let i = 0; i < targetBandCount; i++) {
      const start = Math.floor(i * bandsPerBin);
      const end = Math.floor((i + 1) * bandsPerBin);

      let sum = 0;
      let count = 0;

      for (let j = start; j < end && j < sourceData.length; j++) {
        const value = sourceData[j];
        if (value !== undefined) {
          sum += value;
          count++;
        }
      }

      bands[i] = count > 0 ? sum / count : 0;
    }

    return bands;
  }

  /**
   * Logarithmic band mapping for perceptual frequency distribution
   */
  private mapBandsLogarithmic(
    sourceData: number[],
    targetBandCount: number
  ): number[] {
    const bands = new Array(targetBandCount).fill(0);
    const logMin = Math.log(1);
    const logMax = Math.log(sourceData.length);

    for (let i = 0; i < targetBandCount; i++) {
      const logStart = logMin + (i / targetBandCount) * (logMax - logMin);
      const logEnd = logMin + ((i + 1) / targetBandCount) * (logMax - logMin);

      const start = Math.floor(Math.exp(logStart)) - 1;
      const end = Math.ceil(Math.exp(logEnd)) - 1;

      let sum = 0;
      let count = 0;

      for (let j = start; j <= end && j < sourceData.length; j++) {
        const value = sourceData[j];
        if (value !== undefined) {
          sum += value;
          count++;
        }
      }

      bands[i] = count > 0 ? sum / count : 0;
    }

    return bands;
  }

  /**
   * Calculate bin range for frequency range
   */
  private calculateBinRange(range: FrequencyRange): {
    startBin: number;
    endBin: number;
  } {
    const nyquist = this.config.sampleRate / 2;
    const binHz = nyquist / this.config.binCount;

    const startBin = Math.floor(range.min / binHz);
    const endBin = Math.ceil(range.max / binHz);

    return {
      startBin: Math.max(0, startBin),
      endBin: Math.min(this.config.binCount, endBin),
    };
  }

  /**
   * Validate processor configuration
   */
  private validateConfig(): void {
    if (this.config.sampleRate <= 0) {
      throw new Error('Sample rate must be greater than 0');
    }

    if (this.config.binCount <= 0) {
      throw new Error('Bin count must be greater than 0');
    }

    // Validate frequency ranges
    if (this.config.frequencyRanges) {
      for (const [name, range] of Object.entries(this.config.frequencyRanges)) {
        if (range.min >= range.max) {
          throw new Error(
            `Invalid frequency range ${name}: min must be less than max`
          );
        }
        if (range.min < 0) {
          throw new Error(
            `Invalid frequency range ${name}: min frequency cannot be negative`
          );
        }
      }
    }
  }
}
