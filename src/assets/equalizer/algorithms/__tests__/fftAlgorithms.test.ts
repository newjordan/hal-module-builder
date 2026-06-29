/**
 * fftAlgorithms Unit Tests
 * Part of Story E6.1 - Audio Processing Extraction
 */

import {
  generateWindow,
  applyWindow,
  calculateOptimalFFTSize,
  isPowerOfTwo,
  calculateFrequencyResolution,
  zeroPad,
  applyPreEmphasis,
  calculateOverlapParams,
  complexToMagnitude,
  magnitudeToDecibels,
  getRecommendedWindow,
  type WindowType,
} from '../fftAlgorithms';

describe('fftAlgorithms', () => {
  describe('Window Functions', () => {
    const windowSize = 128;

    test('should generate Hanning window', () => {
      const window = generateWindow(windowSize, 'hanning');

      expect(window.type).toBe('hanning');
      expect(window.coefficients).toHaveLength(windowSize);
      expect(window.coefficients[0]).toBeCloseTo(0);
      expect(window.coefficients[windowSize / 2]).toBeCloseTo(1, 1);
      expect(window.coefficients[windowSize - 1]).toBeCloseTo(0);
      expect(window.coherentGain).toBeCloseTo(0.5);
    });

    test('should generate Hamming window', () => {
      const window = generateWindow(windowSize, 'hamming');

      expect(window.type).toBe('hamming');
      expect(window.coefficients).toHaveLength(windowSize);
      expect(window.coefficients[0]).toBeCloseTo(0.08, 2);
      expect(window.coefficients[windowSize / 2]).toBeCloseTo(1, 1);
      expect(window.coherentGain).toBeCloseTo(0.54);
    });

    test('should generate Blackman window', () => {
      const window = generateWindow(windowSize, 'blackman');

      expect(window.type).toBe('blackman');
      expect(window.coefficients).toHaveLength(windowSize);
      expect(window.coefficients[0]).toBeCloseTo(0);
      expect(window.coherentGain).toBeCloseTo(0.42);
    });

    test('should generate Blackman-Harris window', () => {
      const window = generateWindow(windowSize, 'blackman-harris');

      expect(window.type).toBe('blackman-harris');
      expect(window.coefficients).toHaveLength(windowSize);
      expect(window.coherentGain).toBeCloseTo(0.35875);
    });

    test('should generate Bartlett window', () => {
      const window = generateWindow(windowSize, 'bartlett');

      expect(window.type).toBe('bartlett');
      expect(window.coefficients).toHaveLength(windowSize);
      expect(window.coefficients[0]).toBeCloseTo(0);
      expect(window.coefficients[windowSize / 2]).toBeCloseTo(1, 1);
      expect(window.coherentGain).toBeCloseTo(0.5);
    });

    test('should generate rectangular (none) window', () => {
      const window = generateWindow(windowSize, 'none');

      expect(window.type).toBe('none');
      expect(window.coefficients).toHaveLength(windowSize);
      expect(window.coefficients.every(coeff => coeff === 1)).toBe(true);
      expect(window.gain).toBeCloseTo(1);
      expect(window.coherentGain).toBeCloseTo(1);
    });

    test('should throw error for unsupported window type', () => {
      expect(() =>
        generateWindow(windowSize, 'unsupported' as WindowType)
      ).toThrow('Unsupported window type: unsupported');
    });
  });

  describe('Window Application', () => {
    test('should apply window to data array', () => {
      const inputData = [1, 1, 1, 1];
      const window = generateWindow(4, 'hanning');

      const result = applyWindow(inputData, window);

      expect(result).toBeInstanceOf(Float32Array);
      expect(result).toHaveLength(4);
      expect(result[0]).toBeCloseTo(0);
      expect(result[1]).toBeCloseTo(0.75, 1);
      expect(result[2]).toBeCloseTo(0.75, 1);
      expect(result[3]).toBeCloseTo(0);
    });

    test('should apply window to Float32Array', () => {
      const inputData = new Float32Array([2, 2, 2, 2]);
      const window = generateWindow(4, 'none');

      const result = applyWindow(inputData, window);

      expect(result).toEqual(inputData);
    });

    test('should handle size mismatch', () => {
      const inputData = [1, 2, 3];
      const window = generateWindow(5, 'hanning');

      const result = applyWindow(inputData, window);

      expect(result).toHaveLength(3); // Should use minimum of input and window size
    });

    test('should handle undefined values', () => {
      const inputData = [1, undefined, 3] as any;
      const window = generateWindow(3, 'none');

      const result = applyWindow(inputData, window);

      expect(result[0]).toBe(1);
      expect(result[1]).toBe(0);
      expect(result[2]).toBe(3);
    });
  });

  describe('FFT Size Calculations', () => {
    test('should calculate optimal FFT size', () => {
      expect(calculateOptimalFFTSize(100)).toBe(128);
      expect(calculateOptimalFFTSize(256)).toBe(256);
      expect(calculateOptimalFFTSize(300)).toBe(512);
      expect(calculateOptimalFFTSize(1000)).toBe(1024);
      expect(calculateOptimalFFTSize(2000)).toBe(2048);
    });

    test('should respect maximum size', () => {
      expect(calculateOptimalFFTSize(100000, 4096)).toBe(4096);
    });

    test('should handle minimum size', () => {
      expect(calculateOptimalFFTSize(10)).toBe(32);
      expect(calculateOptimalFFTSize(1)).toBe(32);
    });

    test('should throw for invalid input', () => {
      expect(() => calculateOptimalFFTSize(0)).toThrow(
        'Input size must be greater than 0'
      );
      expect(() => calculateOptimalFFTSize(-5)).toThrow(
        'Input size must be greater than 0'
      );
    });

    test('should validate power of two', () => {
      expect(isPowerOfTwo(32)).toBe(true);
      expect(isPowerOfTwo(64)).toBe(true);
      expect(isPowerOfTwo(1024)).toBe(true);
      expect(isPowerOfTwo(2048)).toBe(true);

      expect(isPowerOfTwo(30)).toBe(false);
      expect(isPowerOfTwo(100)).toBe(false);
      expect(isPowerOfTwo(1000)).toBe(false);
      expect(isPowerOfTwo(0)).toBe(false);
      expect(isPowerOfTwo(-32)).toBe(false);
    });
  });

  describe('Frequency Resolution', () => {
    test('should calculate frequency resolution correctly', () => {
      const result = calculateFrequencyResolution(44100, 2048);

      expect(result.nyquistFrequency).toBe(22050);
      expect(result.binCount).toBe(1024);
      expect(result.frequencyPerBin).toBeCloseTo(21.533203125);
      expect(result.resolution).toBeCloseTo(21.533203125);
    });

    test('should handle different sample rates', () => {
      const result = calculateFrequencyResolution(48000, 1024);

      expect(result.nyquistFrequency).toBe(24000);
      expect(result.binCount).toBe(512);
      expect(result.frequencyPerBin).toBeCloseTo(46.875);
    });

    test('should throw for invalid parameters', () => {
      expect(() => calculateFrequencyResolution(0, 1024)).toThrow(
        'Sample rate and FFT size must be greater than 0'
      );
      expect(() => calculateFrequencyResolution(44100, 0)).toThrow(
        'Sample rate and FFT size must be greater than 0'
      );
      expect(() => calculateFrequencyResolution(-44100, 1024)).toThrow(
        'Sample rate and FFT size must be greater than 0'
      );
    });
  });

  describe('Zero Padding', () => {
    test('should zero pad to target size', () => {
      const inputData = [1, 2, 3];
      const result = zeroPad(inputData, 8);

      expect(result).toBeInstanceOf(Float32Array);
      expect(result).toHaveLength(8);
      expect(Array.from(result)).toEqual([1, 2, 3, 0, 0, 0, 0, 0]);
    });

    test('should handle Float32Array input', () => {
      const inputData = new Float32Array([1, 2, 3]);
      const result = zeroPad(inputData, 5);

      expect(result).toHaveLength(5);
      expect(Array.from(result)).toEqual([1, 2, 3, 0, 0]);
    });

    test('should throw for invalid target size', () => {
      expect(() => zeroPad([1, 2, 3], 2)).toThrow(
        'Target size must be >= input data length'
      );
    });
  });

  describe('Pre-emphasis Filter', () => {
    test('should apply pre-emphasis filter', () => {
      const inputData = [1, 2, 3, 4];
      const result = applyPreEmphasis(inputData, 0.97);

      expect(result).toBeInstanceOf(Float32Array);
      expect(result).toHaveLength(4);
      expect(result[0]).toBe(1); // First sample unchanged
      expect(result[1]).toBeCloseTo(2 - 0.97 * 1);
      expect(result[2]).toBeCloseTo(3 - 0.97 * 2);
      expect(result[3]).toBeCloseTo(4 - 0.97 * 3);
    });

    test('should handle default coefficient', () => {
      const inputData = [1, 1, 1, 1];
      const result = applyPreEmphasis(inputData);

      expect(result[0]).toBe(1);
      expect(result[1]).toBeCloseTo(1 - 0.97 * 1);
    });

    test('should validate coefficient range', () => {
      expect(() => applyPreEmphasis([1, 2, 3], -0.1)).toThrow(
        'Pre-emphasis coefficient must be between 0 and 1'
      );
      expect(() => applyPreEmphasis([1, 2, 3], 1.1)).toThrow(
        'Pre-emphasis coefficient must be between 0 and 1'
      );
    });

    test('should handle empty input', () => {
      const result = applyPreEmphasis([]);

      expect(result).toHaveLength(0);
    });

    test('should handle undefined values', () => {
      const inputData = [1, undefined, 3] as any;
      const result = applyPreEmphasis(inputData, 0.5);

      expect(result[0]).toBe(1);
      expect(result[1]).toBeCloseTo(0 - 0.5 * 1);
      expect(result[2]).toBeCloseTo(3 - 0.5 * 0);
    });
  });

  describe('Overlap Parameters', () => {
    test('should calculate overlap parameters correctly', () => {
      const result = calculateOverlapParams(1024, 0.5);

      expect(result.hopSize).toBe(512);
      expect(result.overlapSize).toBe(512);
      expect(result.windowsNeeded).toBe(2);
    });

    test('should handle different overlap ratios', () => {
      const result = calculateOverlapParams(1024, 0.75);

      expect(result.hopSize).toBe(256);
      expect(result.overlapSize).toBe(768);
      expect(result.windowsNeeded).toBe(4);
    });

    test('should validate overlap ratio', () => {
      expect(() => calculateOverlapParams(1024, -0.1)).toThrow(
        'Overlap ratio must be between 0 and 1'
      );
      expect(() => calculateOverlapParams(1024, 1.0)).toThrow(
        'Overlap ratio must be between 0 and 1'
      );
    });
  });

  describe('Complex to Magnitude Conversion', () => {
    test('should convert complex to magnitude', () => {
      const realPart = new Float32Array([3, 0, 4]);
      const imagPart = new Float32Array([4, 0, 3]);

      const result = complexToMagnitude(realPart, imagPart);

      expect(result).toBeInstanceOf(Float32Array);
      expect(result).toHaveLength(3);
      expect(result[0]).toBeCloseTo(5); // sqrt(3²+4²)
      expect(result[1]).toBeCloseTo(0);
      expect(result[2]).toBeCloseTo(5); // sqrt(4²+3²)
    });

    test('should handle zero values', () => {
      const realPart = new Float32Array([0, 0]);
      const imagPart = new Float32Array([0, 0]);

      const result = complexToMagnitude(realPart, imagPart);

      expect(result[0]).toBe(0);
      expect(result[1]).toBe(0);
    });

    test('should throw for mismatched lengths', () => {
      const realPart = new Float32Array([1, 2]);
      const imagPart = new Float32Array([1, 2, 3]);

      expect(() => complexToMagnitude(realPart, imagPart)).toThrow(
        'Real and imaginary parts must have same length'
      );
    });
  });

  describe('Magnitude to Decibels Conversion', () => {
    test('should convert magnitude to decibels', () => {
      const magnitude = new Float32Array([1, 10, 0.1]);

      const result = magnitudeToDecibels(magnitude, 1.0, -120);

      expect(result).toBeInstanceOf(Float32Array);
      expect(result[0]).toBeCloseTo(0, 1); // 20*log10(1) = 0
      expect(result[1]).toBeCloseTo(40, 1); // 20*log10(10) = 40
      expect(result[2]).toBeCloseTo(-40, 1); // 20*log10(0.1) = -40
    });

    test('should handle zero magnitude', () => {
      const magnitude = new Float32Array([0]);

      const result = magnitudeToDecibels(magnitude, 1.0, -120);

      expect(result[0]).toBe(-120);
    });

    test('should respect minimum dB limit', () => {
      const magnitude = new Float32Array([0.001]);

      const result = magnitudeToDecibels(magnitude, 1.0, -60);

      expect(result[0]).toBe(-60);
    });

    test('should handle custom reference level', () => {
      const magnitude = new Float32Array([2]);

      const result = magnitudeToDecibels(magnitude, 2.0);

      expect(result[0]).toBeCloseTo(0, 1); // 20*log10(2/2) = 0
    });
  });

  describe('Recommended Windows', () => {
    test('should return appropriate window for music', () => {
      expect(getRecommendedWindow('music')).toBe('blackman-harris');
    });

    test('should return appropriate window for speech', () => {
      expect(getRecommendedWindow('speech')).toBe('hamming');
    });

    test('should return appropriate window for measurement', () => {
      expect(getRecommendedWindow('measurement')).toBe('hanning');
    });

    test('should return default window for general use', () => {
      expect(getRecommendedWindow('general')).toBe('hanning');
    });

    test('should handle unknown use case', () => {
      expect(getRecommendedWindow('unknown' as any)).toBe('hanning');
    });
  });
});
