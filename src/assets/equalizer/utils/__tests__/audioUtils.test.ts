/**
 * audioUtils Unit Tests
 * Part of Story E6.1 - Audio Processing Extraction
 */

import {
  AudioDataPool,
  linearToDecibels,
  decibelsToLinear,
  arrayLinearToDecibels,
  normalizeAudioLevels,
  validateAudioFormat,
  calculateRMS,
  calculatePeakLevel,
  createPerformanceLogger,
  type DecibelConfig,
} from '../audioUtils';

describe('audioUtils', () => {
  describe('AudioDataPool', () => {
    let pool: AudioDataPool;

    beforeEach(() => {
      pool = new AudioDataPool(5); // Max pool size of 5
    });

    afterEach(() => {
      pool.cleanup();
    });

    describe('Frequency Buffer Pool', () => {
      test('should acquire and release frequency buffers', () => {
        const buffer1 = pool.acquireFrequencyBuffer(1024);
        const buffer2 = pool.acquireFrequencyBuffer(1024);

        expect(buffer1).toBeInstanceOf(Uint8Array);
        expect(buffer1).toHaveLength(1024);
        expect(buffer2).toBeInstanceOf(Uint8Array);
        expect(buffer2).toHaveLength(1024);
        expect(buffer1).not.toBe(buffer2);

        pool.releaseFrequencyBuffer(buffer1);
        pool.releaseFrequencyBuffer(buffer2);

        const stats = pool.getPoolStats();
        expect(stats.frequencyBuffersAvailable).toBe(2);
      });

      test('should reuse released buffers', () => {
        const buffer1 = pool.acquireFrequencyBuffer(512);
        buffer1[0] = 255; // Mark buffer
        pool.releaseFrequencyBuffer(buffer1);

        const buffer2 = pool.acquireFrequencyBuffer(512);
        expect(buffer2).toBe(buffer1);
        expect(buffer2[0]).toBe(0); // Should be cleared on reuse
      });

      test('should create new buffer when pool is empty', () => {
        const buffer = pool.acquireFrequencyBuffer(256);
        expect(buffer).toBeInstanceOf(Uint8Array);
        expect(buffer).toHaveLength(256);
      });

      test('should respect max pool size', () => {
        const buffers = [];

        // Fill pool beyond max size
        for (let i = 0; i < 10; i++) {
          buffers.push(pool.acquireFrequencyBuffer(128));
        }

        // Release all buffers
        buffers.forEach(buffer => pool.releaseFrequencyBuffer(buffer));

        const stats = pool.getPoolStats();
        expect(stats.frequencyBuffersAvailable).toBe(5); // Should cap at max pool size
      });
    });

    describe('Time Buffer Pool', () => {
      test('should manage time buffers', () => {
        const buffer = pool.acquireTimeBuffer(2048);
        expect(buffer).toBeInstanceOf(Uint8Array);
        expect(buffer).toHaveLength(2048);

        pool.releaseTimeBuffer(buffer);

        const reused = pool.acquireTimeBuffer(2048);
        expect(reused).toBe(buffer);
      });
    });

    describe('Float Buffer Pool', () => {
      test('should manage float buffers', () => {
        const buffer = pool.acquireFloatBuffer(1024);
        expect(buffer).toBeInstanceOf(Float32Array);
        expect(buffer).toHaveLength(1024);

        buffer[0] = 3.14;
        pool.releaseFloatBuffer(buffer);

        const reused = pool.acquireFloatBuffer(1024);
        expect(reused).toBe(buffer);
        expect(reused[0]).toBe(0); // Should be cleared
      });
    });

    describe('Pool Statistics', () => {
      test('should provide accurate pool stats', () => {
        const freq1 = pool.acquireFrequencyBuffer(1024);
        const freq2 = pool.acquireFrequencyBuffer(1024);
        const time1 = pool.acquireTimeBuffer(512);
        const float1 = pool.acquireFloatBuffer(256);

        pool.releaseFrequencyBuffer(freq1);
        pool.releaseTimeBuffer(time1);

        const stats = pool.getPoolStats();
        expect(stats.frequencyBuffersAvailable).toBe(1);
        expect(stats.timeBuffersAvailable).toBe(1);
        expect(stats.floatBuffersAvailable).toBe(0);
        expect(stats.memoryUsageEstimate).toBeGreaterThan(0);
      });

      test('should calculate memory usage correctly', () => {
        const buffer1024 = pool.acquireFrequencyBuffer(1024);
        const buffer512 = pool.acquireTimeBuffer(512);
        const floatBuffer = pool.acquireFloatBuffer(256);

        pool.releaseFrequencyBuffer(buffer1024);
        pool.releaseTimeBuffer(buffer512);
        pool.releaseFloatBuffer(floatBuffer);

        const stats = pool.getPoolStats();
        const expectedMemory = 1024 + 512 + 256 * 4; // Uint8Array + Uint8Array + Float32Array
        expect(stats.memoryUsageEstimate).toBe(expectedMemory);
      });
    });

    describe('Pool Cleanup', () => {
      test('should cleanup all pools', () => {
        pool.acquireFrequencyBuffer(1024);
        pool.acquireTimeBuffer(512);
        pool.acquireFloatBuffer(256);

        pool.cleanup();

        const stats = pool.getPoolStats();
        expect(stats.frequencyBuffersTotal).toBe(0);
        expect(stats.timeBuffersTotal).toBe(0);
        expect(stats.floatBuffersTotal).toBe(0);
        expect(stats.memoryUsageEstimate).toBe(0);
      });
    });
  });

  describe('Decibel Conversions', () => {
    test('should convert linear to decibels', () => {
      expect(linearToDecibels(1)).toBeCloseTo(0);
      expect(linearToDecibels(10)).toBeCloseTo(20);
      expect(linearToDecibels(0.1)).toBeCloseTo(-20);
      expect(linearToDecibels(0.01)).toBeCloseTo(-40);
    });

    test('should handle zero and negative linear values', () => {
      expect(linearToDecibels(0)).toBe(-120); // Default min dB
      expect(linearToDecibels(-1)).toBe(-120);
    });

    test('should use custom reference level', () => {
      const config: DecibelConfig = { referenceLevel: 2.0 };
      expect(linearToDecibels(2, config)).toBeCloseTo(0);
      expect(linearToDecibels(4, config)).toBeCloseTo(6, 1);
    });

    test('should respect minimum decibel limit', () => {
      const config: DecibelConfig = { minDecibels: -60 };
      expect(linearToDecibels(0.001, config)).toBe(-60);
    });

    test('should convert decibels to linear', () => {
      expect(decibelsToLinear(0)).toBeCloseTo(1);
      expect(decibelsToLinear(20)).toBeCloseTo(10);
      expect(decibelsToLinear(-20)).toBeCloseTo(0.1);
      expect(decibelsToLinear(-40)).toBeCloseTo(0.01);
    });

    test('should convert array of linear values to decibels', () => {
      const linearArray = [1, 10, 0.1, 0];
      const result = arrayLinearToDecibels(linearArray);

      expect(result).toBeInstanceOf(Float32Array);
      expect(result).toHaveLength(4);
      expect(result[0]).toBeCloseTo(0);
      expect(result[1]).toBeCloseTo(20);
      expect(result[2]).toBeCloseTo(-20);
      expect(result[3]).toBe(-120);
    });

    test('should handle Uint8Array input', () => {
      const uint8Array = new Uint8Array([255, 128, 64, 0]);
      const result = arrayLinearToDecibels(uint8Array);

      expect(result).toBeInstanceOf(Float32Array);
      expect(result).toHaveLength(4);
    });
  });

  describe('Audio Level Normalization', () => {
    test('should normalize audio levels', () => {
      const inputData = [0.5, 1.0, -0.8, 0.2];
      const result = normalizeAudioLevels(inputData);

      expect(result).toBeInstanceOf(Float32Array);
      expect(result).toHaveLength(4);
      expect(Math.max(...Array.from(result).map(Math.abs))).toBeCloseTo(1);
    });

    test('should handle custom target maximum', () => {
      const inputData = [0.5, 1.0, -0.5];
      const result = normalizeAudioLevels(inputData, 0.5);

      expect(Math.max(...Array.from(result).map(Math.abs))).toBeCloseTo(0.5);
    });

    test('should handle all-zero input', () => {
      const inputData = [0, 0, 0];
      const result = normalizeAudioLevels(inputData);

      expect(Array.from(result)).toEqual([0, 0, 0]);
    });

    test('should handle Float32Array input', () => {
      const inputData = new Float32Array([0.2, -0.8, 0.4]);
      const result = normalizeAudioLevels(inputData);

      expect(result).toBeInstanceOf(Float32Array);
      expect(Math.max(...Array.from(result).map(Math.abs))).toBeCloseTo(1);
    });

    test('should handle single maximum value', () => {
      const inputData = [0.1, 0.5, 0.1];
      const result = normalizeAudioLevels(inputData);

      expect(result[1]).toBeCloseTo(1); // Maximum should become 1
    });
  });

  describe('Audio Format Validation', () => {
    test('should validate valid audio format', () => {
      const format = {
        sampleRate: 44100,
        channels: 2,
        bitDepth: 16,
        bufferSize: 1024,
      };

      const result = validateAudioFormat(format);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('should validate individual format parameters', () => {
      // Sample rate validation
      expect(validateAudioFormat({ sampleRate: 7000 }).errors).toContain(
        'Sample rate must be between 8000 and 192000 Hz'
      );
      expect(validateAudioFormat({ sampleRate: 200000 }).errors).toContain(
        'Sample rate must be between 8000 and 192000 Hz'
      );

      // Channel validation
      expect(validateAudioFormat({ channels: 0 }).errors).toContain(
        'Channel count must be between 1 and 32'
      );
      expect(validateAudioFormat({ channels: 50 }).errors).toContain(
        'Channel count must be between 1 and 32'
      );

      // Bit depth validation
      expect(validateAudioFormat({ bitDepth: 12 }).errors).toContain(
        'Bit depth must be 8, 16, 24, or 32'
      );

      // Buffer size validation
      expect(validateAudioFormat({ bufferSize: 31 }).errors).toContain(
        'Buffer size must be between 32 and 16384'
      );
      expect(validateAudioFormat({ bufferSize: 20000 }).errors).toContain(
        'Buffer size must be between 32 and 16384'
      );
      expect(validateAudioFormat({ bufferSize: 100 }).errors).toContain(
        'Buffer size should be a power of 2 for optimal performance'
      );
    });

    test('should handle empty format', () => {
      const result = validateAudioFormat({});
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('should accumulate multiple errors', () => {
      const format = {
        sampleRate: 0,
        channels: 0,
        bufferSize: 100,
      };

      const result = validateAudioFormat(format);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(1);
    });
  });

  describe('Signal Analysis', () => {
    test('should calculate RMS correctly', () => {
      const inputData = [1, -1, 2, -2];
      const rms = calculateRMS(inputData);

      expect(rms).toBeCloseTo(Math.sqrt((1 + 1 + 4 + 4) / 4));
    });

    test('should handle empty input for RMS', () => {
      expect(calculateRMS([])).toBe(0);
    });

    test('should calculate peak level correctly', () => {
      const inputData = [0.5, -0.8, 0.3, -0.2];
      const peak = calculatePeakLevel(inputData);

      expect(peak).toBe(0.8);
    });

    test('should handle empty input for peak level', () => {
      expect(calculatePeakLevel([])).toBe(0);
    });

    test('should handle Float32Array input', () => {
      const inputData = new Float32Array([0.1, -0.5, 0.3]);

      const rms = calculateRMS(inputData);
      const peak = calculatePeakLevel(inputData);

      expect(rms).toBeCloseTo(Math.sqrt((0.01 + 0.25 + 0.09) / 3));
      expect(peak).toBe(0.5);
    });

    test('should handle all-zero input', () => {
      const inputData = [0, 0, 0, 0];

      expect(calculateRMS(inputData)).toBe(0);
      expect(calculatePeakLevel(inputData)).toBe(0);
    });
  });

  describe('Performance Logger', () => {
    test('should track performance timing', () => {
      const logger = createPerformanceLogger('test');

      logger.start();
      // Simulate some work
      logger.end();

      const stats = logger.getStats();
      expect(stats.callCount).toBe(1);
      expect(stats.averageTime).toBeGreaterThanOrEqual(0);
      expect(stats.totalTime).toBeGreaterThanOrEqual(0);
    });

    test('should accumulate multiple calls', () => {
      const logger = createPerformanceLogger('test');

      logger.start();
      logger.end();
      logger.start();
      logger.end();

      const stats = logger.getStats();
      expect(stats.callCount).toBe(2);
      expect(stats.totalTime).toBeGreaterThanOrEqual(0);
    });

    test('should calculate average time correctly', () => {
      const logger = createPerformanceLogger('test');

      logger.start();
      logger.end();
      logger.start();
      logger.end();

      const stats = logger.getStats();
      expect(stats.averageTime).toBeCloseTo(stats.totalTime / 2);
    });

    test('should handle end without start', () => {
      const logger = createPerformanceLogger('test');

      logger.end(); // No start called

      const stats = logger.getStats();
      expect(stats.callCount).toBe(0);
    });

    test('should reset statistics', () => {
      const logger = createPerformanceLogger('test');

      logger.start();
      logger.end();
      logger.reset();

      const stats = logger.getStats();
      expect(stats.callCount).toBe(0);
      expect(stats.totalTime).toBe(0);
      expect(stats.averageTime).toBe(0);
    });

    test('should log statistics', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      const logger = createPerformanceLogger('TestLogger');

      logger.start();
      logger.end();
      logger.log();

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[TestLogger] Calls: 1')
      );

      consoleSpy.mockRestore();
    });

    test('should handle zero calls in statistics', () => {
      const logger = createPerformanceLogger('test');

      const stats = logger.getStats();
      expect(stats.callCount).toBe(0);
      expect(stats.averageTime).toBe(0);
      expect(stats.totalTime).toBe(0);
    });
  });
});
