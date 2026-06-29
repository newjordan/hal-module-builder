import {
  processAudioData,
  normalizeFrequencyData,
  smoothFrequencyData,
  calculateRMS,
  calculatePeakLevel,
  detectBeat,
  analyzeFrequencySpectrum,
  applyFrequencyFilter,
} from '../audioProcessing';

describe('audioProcessing', () => {
  const mockFrequencyData = new Uint8Array([
    120, 130, 140, 150, 160, 170, 180, 190, 200, 210, 100, 110, 120, 130, 140,
    150, 160, 170, 180, 190,
  ]);

  const mockTimeData = new Float32Array([
    0.1, -0.2, 0.3, -0.4, 0.5, -0.6, 0.7, -0.8, 0.9, -1.0,
  ]);

  describe('processAudioData', () => {
    it('should process frequency data correctly', () => {
      const result = processAudioData(mockFrequencyData, 'frequency');

      expect(result).toBeDefined();
      expect(result.length).toBe(mockFrequencyData.length);
      expect(result.every(val => val >= 0 && val <= 1)).toBe(true);
    });

    it('should process time data correctly', () => {
      const result = processAudioData(mockTimeData, 'time');

      expect(result).toBeDefined();
      expect(result.length).toBe(mockTimeData.length);
    });

    it('should handle empty data', () => {
      const result = processAudioData(new Uint8Array([]), 'frequency');
      expect(result).toHaveLength(0);
    });

    it('should normalize values to 0-1 range', () => {
      const result = processAudioData(mockFrequencyData, 'frequency');
      const maxVal = Math.max(...result);
      const minVal = Math.min(...result);

      expect(maxVal).toBeLessThanOrEqual(1);
      expect(minVal).toBeGreaterThanOrEqual(0);
    });
  });

  describe('normalizeFrequencyData', () => {
    it('should normalize frequency data to 0-1 range', () => {
      const result = normalizeFrequencyData(mockFrequencyData);

      expect(result.length).toBe(mockFrequencyData.length);
      expect(Math.max(...result)).toBeCloseTo(1, 2);
      expect(Math.min(...result)).toBeCloseTo(0, 2);
    });

    it('should handle all-zero data', () => {
      const zeroData = new Uint8Array(10).fill(0);
      const result = normalizeFrequencyData(zeroData);

      expect(result.every(val => val === 0)).toBe(true);
    });

    it('should handle uniform data', () => {
      const uniformData = new Uint8Array(10).fill(128);
      const result = normalizeFrequencyData(uniformData);

      expect(result.every(val => val === 0.5)).toBe(true);
    });
  });

  describe('smoothFrequencyData', () => {
    it('should smooth frequency data', () => {
      const spikyData = new Float32Array([0, 1, 0, 1, 0, 1, 0, 1]);
      const result = smoothFrequencyData(spikyData, 0.3);

      expect(result.length).toBe(spikyData.length);

      // Check that extreme values are reduced
      const maxResult = Math.max(...result);
      const maxOriginal = Math.max(...spikyData);
      expect(maxResult).toBeLessThan(maxOriginal);
    });

    it('should apply smoothing factor correctly', () => {
      const data = new Float32Array([0.5, 0.5, 0.5, 0.5]);
      const previousData = new Float32Array([0, 0, 0, 0]);
      const smoothingFactor = 0.5;

      const result = smoothFrequencyData(data, smoothingFactor, previousData);

      // With 50% smoothing, result should be midway between current and previous
      expect(result[0]).toBeCloseTo(0.25, 2);
    });

    it('should handle missing previous data', () => {
      const result = smoothFrequencyData(mockFrequencyData, 0.3);
      expect(result.length).toBe(mockFrequencyData.length);
    });
  });

  describe('calculateRMS', () => {
    it('should calculate RMS correctly', () => {
      const testData = new Float32Array([0.5, -0.5, 0.3, -0.3]);
      const result = calculateRMS(testData);

      const expectedRMS = Math.sqrt(
        (0.5 * 0.5 + 0.5 * 0.5 + 0.3 * 0.3 + 0.3 * 0.3) / 4
      );

      expect(result).toBeCloseTo(expectedRMS, 3);
    });

    it('should handle zero data', () => {
      const zeroData = new Float32Array(10).fill(0);
      const result = calculateRMS(zeroData);
      expect(result).toBe(0);
    });

    it('should handle single sample', () => {
      const singleSample = new Float32Array([0.7]);
      const result = calculateRMS(singleSample);
      expect(result).toBeCloseTo(0.7, 3);
    });
  });

  describe('calculatePeakLevel', () => {
    it('should find peak level correctly', () => {
      const testData = new Float32Array([0.1, -0.8, 0.3, -0.2, 0.9]);
      const result = calculatePeakLevel(testData);

      expect(result).toBe(0.9); // Highest absolute value
    });

    it('should handle negative peaks', () => {
      const testData = new Float32Array([0.1, -0.9, 0.3, -0.2]);
      const result = calculatePeakLevel(testData);

      expect(result).toBe(0.9); // -0.9 has highest absolute value
    });

    it('should handle empty data', () => {
      const result = calculatePeakLevel(new Float32Array([]));
      expect(result).toBe(0);
    });
  });

  describe('detectBeat', () => {
    it('should detect beat when conditions are met', () => {
      // Create data that should trigger beat detection
      const highEnergyData = new Uint8Array(1024).fill(200);
      const result = detectBeat(highEnergyData, {
        threshold: 150,
        sensitivity: 0.8,
      });

      expect(typeof result).toBe('boolean');
    });

    it('should not detect beat with low energy', () => {
      const lowEnergyData = new Uint8Array(1024).fill(50);
      const result = detectBeat(lowEnergyData, {
        threshold: 150,
        sensitivity: 0.8,
      });

      expect(result).toBe(false);
    });

    it('should use default parameters', () => {
      const result = detectBeat(mockFrequencyData);
      expect(typeof result).toBe('boolean');
    });
  });

  describe('analyzeFrequencySpectrum', () => {
    it('should analyze frequency spectrum', () => {
      const result = analyzeFrequencySpectrum(mockFrequencyData, 44100);

      expect(result).toHaveProperty('bass');
      expect(result).toHaveProperty('mid');
      expect(result).toHaveProperty('treble');
      expect(result).toHaveProperty('dominant');

      expect(typeof result.bass).toBe('number');
      expect(typeof result.mid).toBe('number');
      expect(typeof result.treble).toBe('number');
      expect(typeof result.dominant).toBe('number');
    });

    it('should calculate frequency bands correctly', () => {
      const result = analyzeFrequencySpectrum(mockFrequencyData, 44100);

      // All values should be between 0 and 1
      expect(result.bass).toBeGreaterThanOrEqual(0);
      expect(result.bass).toBeLessThanOrEqual(1);
      expect(result.mid).toBeGreaterThanOrEqual(0);
      expect(result.mid).toBeLessThanOrEqual(1);
      expect(result.treble).toBeGreaterThanOrEqual(0);
      expect(result.treble).toBeLessThanOrEqual(1);
    });

    it('should find dominant frequency', () => {
      const result = analyzeFrequencySpectrum(mockFrequencyData, 44100);

      expect(result.dominant).toBeGreaterThanOrEqual(0);
      expect(result.dominant).toBeLessThan(44100 / 2); // Should be less than Nyquist frequency
    });
  });

  describe('applyFrequencyFilter', () => {
    it('should apply low-pass filter', () => {
      const result = applyFrequencyFilter(
        mockFrequencyData,
        { type: 'lowpass', cutoff: 1000 },
        44100
      );

      expect(result.length).toBe(mockFrequencyData.length);
      expect(result instanceof Float32Array).toBe(true);
    });

    it('should apply high-pass filter', () => {
      const result = applyFrequencyFilter(
        mockFrequencyData,
        { type: 'highpass', cutoff: 500 },
        44100
      );

      expect(result.length).toBe(mockFrequencyData.length);
    });

    it('should apply band-pass filter', () => {
      const result = applyFrequencyFilter(
        mockFrequencyData,
        { type: 'bandpass', cutoff: 1000, bandwidth: 200 },
        44100
      );

      expect(result.length).toBe(mockFrequencyData.length);
    });

    it('should handle invalid filter parameters', () => {
      const result = applyFrequencyFilter(
        mockFrequencyData,
        { type: 'lowpass', cutoff: -100 },
        44100
      );

      // Should return original data or handle gracefully
      expect(result.length).toBe(mockFrequencyData.length);
    });
  });
});
