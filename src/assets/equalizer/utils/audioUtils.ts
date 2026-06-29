/**
 * audioUtils - Audio processing utilities with object pooling
 * Part of Story E6.1 - Audio Processing Extraction
 *
 * Focused on:
 * - Audio processing utility functions
 * - Decibel conversion utilities
 * - Audio format validation
 * - Memory-efficient object pooling for Float32Array
 * - Debugging and monitoring utilities
 */

export interface AudioDataPool {
  acquireFrequencyBuffer(size: number): Uint8Array;
  releaseFrequencyBuffer(buffer: Uint8Array): void;
  acquireTimeBuffer(size: number): Uint8Array;
  releaseTimeBuffer(buffer: Uint8Array): void;
  acquireFloatBuffer(size: number): Float32Array;
  releaseFloatBuffer(buffer: Float32Array): void;
  getPoolStats(): PoolStats;
  cleanup(): void;
}

export interface PoolStats {
  frequencyBuffersTotal: number;
  frequencyBuffersAvailable: number;
  timeBuffersTotal: number;
  timeBuffersAvailable: number;
  floatBuffersTotal: number;
  floatBuffersAvailable: number;
  memoryUsageEstimate: number;
}

export interface DecibelConfig {
  referenceLevel?: number;
  minDecibels?: number;
  maxDecibels?: number;
}

/**
 * Memory-efficient object pool for audio data buffers
 * Reduces garbage collection pressure for real-time audio processing
 */
export class AudioDataPool implements AudioDataPool {
  private frequencyBufferPool: Map<number, Uint8Array[]> = new Map();
  private timeBufferPool: Map<number, Uint8Array[]> = new Map();
  private floatBufferPool: Map<number, Float32Array[]> = new Map();

  private maxPoolSize: number;
  private totalCreated = 0;

  constructor(maxPoolSize: number = 10) {
    this.maxPoolSize = Math.max(1, maxPoolSize);
  }

  /**
   * Acquire frequency buffer from pool or create new one
   */
  acquireFrequencyBuffer(size: number): Uint8Array {
    const pool = this.frequencyBufferPool.get(size);

    if (pool && pool.length > 0) {
      const buffer = pool.pop()!;
      buffer.fill(0); // Clear for reuse
      return buffer;
    }

    this.totalCreated++;
    return new Uint8Array(size);
  }

  /**
   * Release frequency buffer back to pool
   */
  releaseFrequencyBuffer(buffer: Uint8Array): void {
    const size = buffer.length;

    if (!this.frequencyBufferPool.has(size)) {
      this.frequencyBufferPool.set(size, []);
    }

    const pool = this.frequencyBufferPool.get(size)!;
    if (pool.length < this.maxPoolSize) {
      pool.push(buffer);
    }
  }

  /**
   * Acquire time domain buffer from pool or create new one
   */
  acquireTimeBuffer(size: number): Uint8Array {
    const pool = this.timeBufferPool.get(size);

    if (pool && pool.length > 0) {
      const buffer = pool.pop()!;
      buffer.fill(0); // Clear for reuse
      return buffer;
    }

    this.totalCreated++;
    return new Uint8Array(size);
  }

  /**
   * Release time domain buffer back to pool
   */
  releaseTimeBuffer(buffer: Uint8Array): void {
    const size = buffer.length;

    if (!this.timeBufferPool.has(size)) {
      this.timeBufferPool.set(size, []);
    }

    const pool = this.timeBufferPool.get(size)!;
    if (pool.length < this.maxPoolSize) {
      pool.push(buffer);
    }
  }

  /**
   * Acquire Float32Array buffer from pool or create new one
   */
  acquireFloatBuffer(size: number): Float32Array {
    const pool = this.floatBufferPool.get(size);

    if (pool && pool.length > 0) {
      const buffer = pool.pop()!;
      buffer.fill(0); // Clear for reuse
      return buffer;
    }

    this.totalCreated++;
    return new Float32Array(size);
  }

  /**
   * Release Float32Array buffer back to pool
   */
  releaseFloatBuffer(buffer: Float32Array): void {
    const size = buffer.length;

    if (!this.floatBufferPool.has(size)) {
      this.floatBufferPool.set(size, []);
    }

    const pool = this.floatBufferPool.get(size)!;
    if (pool.length < this.maxPoolSize) {
      pool.push(buffer);
    }
  }

  /**
   * Get pool statistics for monitoring
   */
  getPoolStats(): PoolStats {
    let totalFreq = 0;
    let availableFreq = 0;
    let totalTime = 0;
    let availableTime = 0;
    let totalFloat = 0;
    let availableFloat = 0;
    let memoryEstimate = 0;

    // Count frequency buffers
    for (const [size, pool] of this.frequencyBufferPool) {
      availableFreq += pool.length;
      totalFreq += pool.length;
      memoryEstimate += pool.length * size; // Uint8Array: 1 byte per element
    }

    // Count time buffers
    for (const [size, pool] of this.timeBufferPool) {
      availableTime += pool.length;
      totalTime += pool.length;
      memoryEstimate += pool.length * size; // Uint8Array: 1 byte per element
    }

    // Count float buffers
    for (const [size, pool] of this.floatBufferPool) {
      availableFloat += pool.length;
      totalFloat += pool.length;
      memoryEstimate += pool.length * size * 4; // Float32Array: 4 bytes per element
    }

    return {
      frequencyBuffersTotal: totalFreq,
      frequencyBuffersAvailable: availableFreq,
      timeBuffersTotal: totalTime,
      timeBuffersAvailable: availableTime,
      floatBuffersTotal: totalFloat,
      floatBuffersAvailable: availableFloat,
      memoryUsageEstimate: memoryEstimate,
    };
  }

  /**
   * Cleanup all pooled buffers
   */
  cleanup(): void {
    this.frequencyBufferPool.clear();
    this.timeBufferPool.clear();
    this.floatBufferPool.clear();
    this.totalCreated = 0;
  }
}

/**
 * Convert linear amplitude to decibels
 */
export function linearToDecibels(
  linearValue: number,
  config: DecibelConfig = {}
): number {
  const { referenceLevel = 1.0, minDecibels = -120 } = config;

  if (linearValue <= 0) {
    return minDecibels;
  }

  const db = 20 * Math.log10(linearValue / referenceLevel);
  return Math.max(minDecibels, db);
}

/**
 * Convert decibels to linear amplitude
 */
export function decibelsToLinear(
  decibelValue: number,
  referenceLevel: number = 1.0
): number {
  return referenceLevel * Math.pow(10, decibelValue / 20);
}

/**
 * Convert array of linear values to decibels
 */
export function arrayLinearToDecibels(
  linearArray: number[] | Float32Array | Uint8Array,
  config: DecibelConfig = {}
): Float32Array {
  const result = new Float32Array(linearArray.length);

  for (let i = 0; i < linearArray.length; i++) {
    result[i] = linearToDecibels(linearArray[i] || 0, config);
  }

  return result;
}

/**
 * Normalize audio levels to target maximum
 */
export function normalizeAudioLevels(
  inputData: number[] | Float32Array,
  targetMax: number = 1.0
): Float32Array {
  const result = new Float32Array(inputData.length);

  // Find maximum value
  let maxValue = 0;
  for (let i = 0; i < inputData.length; i++) {
    const absValue = Math.abs(inputData[i] || 0);
    if (absValue > maxValue) {
      maxValue = absValue;
    }
  }

  if (maxValue === 0) {
    return result; // All zeros, return zero-filled array
  }

  const scale = targetMax / maxValue;
  for (let i = 0; i < inputData.length; i++) {
    result[i] = (inputData[i] || 0) * scale;
  }

  return result;
}

/**
 * Validate audio format parameters
 */
export function validateAudioFormat(format: {
  sampleRate?: number;
  channels?: number;
  bitDepth?: number;
  bufferSize?: number;
}): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (format.sampleRate !== undefined) {
    if (format.sampleRate < 8000 || format.sampleRate > 192000) {
      errors.push('Sample rate must be between 8000 and 192000 Hz');
    }
  }

  if (format.channels !== undefined) {
    if (format.channels < 1 || format.channels > 32) {
      errors.push('Channel count must be between 1 and 32');
    }
  }

  if (format.bitDepth !== undefined) {
    if (![8, 16, 24, 32].includes(format.bitDepth)) {
      errors.push('Bit depth must be 8, 16, 24, or 32');
    }
  }

  if (format.bufferSize !== undefined) {
    if (format.bufferSize < 32 || format.bufferSize > 16384) {
      errors.push('Buffer size must be between 32 and 16384');
    }

    // Check if power of 2
    if ((format.bufferSize & (format.bufferSize - 1)) !== 0) {
      errors.push('Buffer size should be a power of 2 for optimal performance');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Calculate RMS (Root Mean Square) of audio signal
 */
export function calculateRMS(inputData: number[] | Float32Array): number {
  if (inputData.length === 0) return 0;

  let sumSquares = 0;
  for (let i = 0; i < inputData.length; i++) {
    const value = inputData[i] || 0;
    sumSquares += value * value;
  }

  return Math.sqrt(sumSquares / inputData.length);
}

/**
 * Calculate peak level of audio signal
 */
export function calculatePeakLevel(inputData: number[] | Float32Array): number {
  let peak = 0;
  for (let i = 0; i < inputData.length; i++) {
    const absValue = Math.abs(inputData[i] || 0);
    if (absValue > peak) {
      peak = absValue;
    }
  }
  return peak;
}

/**
 * Debug utility to log audio processing performance
 */
export function createPerformanceLogger(name: string) {
  let startTime = 0;
  let callCount = 0;
  let totalTime = 0;

  return {
    start(): void {
      startTime = performance.now();
    },

    end(): void {
      if (startTime > 0) {
        const duration = performance.now() - startTime;
        totalTime += duration;
        callCount++;
        startTime = 0;
      }
    },

    getStats(): { averageTime: number; callCount: number; totalTime: number } {
      return {
        averageTime: callCount > 0 ? totalTime / callCount : 0,
        callCount,
        totalTime,
      };
    },

    reset(): void {
      startTime = 0;
      callCount = 0;
      totalTime = 0;
    },

    log(): void {
      const stats = this.getStats();
      console.log(
        `[${name}] Calls: ${stats.callCount}, Avg: ${stats.averageTime.toFixed(2)}ms, Total: ${stats.totalTime.toFixed(2)}ms`
      );
    },
  };
}
