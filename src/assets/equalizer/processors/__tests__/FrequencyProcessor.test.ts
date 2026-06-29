/**
 * FrequencyProcessor Unit Tests
 * Part of Story E6.1 - Audio Processing Extraction
 */

import {
  FrequencyProcessor,
  type FrequencyProcessorConfig,
  type FrequencyRange,
} from '../FrequencyProcessor';

describe('FrequencyProcessor', () => {
  let processor: FrequencyProcessor;
  const defaultConfig: FrequencyProcessorConfig = {
    sampleRate: 44100,
    binCount: 1024,
  };

  beforeEach(() => {
    processor = new FrequencyProcessor(defaultConfig);
  });

  describe('Constructor and Configuration', () => {
    test('should create processor with valid config', () => {
      expect(processor).toBeInstanceOf(FrequencyProcessor);
    });

    test('should use custom frequency ranges', () => {
      const customRanges: Record<string, FrequencyRange> = {
        low: { min: 20, max: 500, label: 'Low' },
        high: { min: 500, max: 20000, label: 'High' },
      };

      const customProcessor = new FrequencyProcessor({
        ...defaultConfig,
        frequencyRanges: customRanges,
      });

      expect(customProcessor.getAvailableRanges()).toEqual(customRanges);
    });

    test('should validate configuration', () => {
      expect(
        () =>
          new FrequencyProcessor({
            sampleRate: 0,
            binCount: 1024,
          })
      ).toThrow('Sample rate must be greater than 0');

      expect(
        () =>
          new FrequencyProcessor({
            sampleRate: 44100,
            binCount: 0,
          })
      ).toThrow('Bin count must be greater than 0');
    });

    test('should validate frequency ranges', () => {
      expect(
        () =>
          new FrequencyProcessor({
            ...defaultConfig,
            frequencyRanges: {
              invalid: { min: 1000, max: 500, label: 'Invalid' },
            },
          })
      ).toThrow('Invalid frequency range invalid: min must be less than max');

      expect(
        () =>
          new FrequencyProcessor({
            ...defaultConfig,
            frequencyRanges: {
              negative: { min: -100, max: 500, label: 'Negative' },
            },
          })
      ).toThrow(
        'Invalid frequency range negative: min frequency cannot be negative'
      );
    });
  });

  describe('Frequency Range Extraction', () => {
    const testData = new Uint8Array([10, 20, 30, 40, 50, 60, 70, 80]);

    test('should extract full range by default', () => {
      const result = processor.extractFrequencyRange(testData);
      expect(result).toEqual(testData);
    });

    test('should extract full range when specified', () => {
      const result = processor.extractFrequencyRange(testData, 'full');
      expect(result).toEqual(testData);
    });

    test('should extract bass range', () => {
      const result = processor.extractFrequencyRange(testData, 'bass');
      expect(result.length).toBeLessThanOrEqual(testData.length);
      expect(result).toBeInstanceOf(Uint8Array);
    });

    test('should extract mid range', () => {
      const result = processor.extractFrequencyRange(testData, 'mid');
      expect(result.length).toBeLessThanOrEqual(testData.length);
      expect(result).toBeInstanceOf(Uint8Array);
    });

    test('should extract treble range', () => {
      const result = processor.extractFrequencyRange(testData, 'treble');
      expect(result.length).toBeLessThanOrEqual(testData.length);
      expect(result).toBeInstanceOf(Uint8Array);
    });

    test('should handle unknown range names', () => {
      const result = processor.extractFrequencyRange(testData, 'unknown');
      expect(result).toEqual(testData);
    });
  });

  describe('Frequency Band Mapping', () => {
    const testData = [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8];

    test('should map to fewer bands with linear scaling', () => {
      const result = processor.mapFrequencyBands(testData, 4, 'linear');

      expect(result.bands).toHaveLength(4);
      expect(result.scaling).toBe('linear');
      expect(result.targetBandCount).toBe(4);
      expect(result.range.label).toBe('Full Range');
    });

    test('should map to fewer bands with logarithmic scaling', () => {
      const result = processor.mapFrequencyBands(testData, 4, 'logarithmic');

      expect(result.bands).toHaveLength(4);
      expect(result.scaling).toBe('logarithmic');
      expect(result.targetBandCount).toBe(4);
    });

    test('should handle empty input data', () => {
      const result = processor.mapFrequencyBands([], 4);

      expect(result.bands).toEqual([0, 0, 0, 0]);
    });

    test('should map with specific frequency range', () => {
      const result = processor.mapFrequencyBands(testData, 4, 'linear', 'bass');

      expect(result.bands).toHaveLength(4);
      expect(result.range.label).toBe('Bass');
    });

    test('should default to logarithmic scaling', () => {
      const result = processor.mapFrequencyBands(testData, 4);

      expect(result.scaling).toBe('logarithmic');
    });
  });

  describe('Average Level Calculation', () => {
    test('should calculate average for full range', () => {
      const testData = new Uint8Array([100, 150, 200]);
      const average = processor.calculateAverageLevel(testData);

      expect(average).toBeCloseTo(150);
    });

    test('should calculate average for specific range', () => {
      const testData = new Uint8Array([100, 150, 200, 250]);
      const average = processor.calculateAverageLevel(testData, 'bass');

      expect(average).toBeGreaterThanOrEqual(0);
    });

    test('should handle empty data', () => {
      const testData = new Uint8Array([]);
      const average = processor.calculateAverageLevel(testData);

      expect(average).toBe(0);
    });
  });

  describe('Peak Detection', () => {
    const testData = new Uint8Array([10, 50, 30, 200, 40, 180, 20]);

    test('should detect peaks above threshold', () => {
      const peaks = processor.detectPeaks(testData, 100);

      expect(peaks.length).toBeGreaterThan(0);
      peaks.forEach(peak => {
        expect(peak.value).toBeGreaterThanOrEqual(100);
        expect(peak.index).toBeGreaterThanOrEqual(0);
        expect(peak.index).toBeLessThan(testData.length);
        expect(peak.frequency).toBeGreaterThanOrEqual(0);
      });
    });

    test('should detect peaks in specific range', () => {
      const peaks = processor.detectPeaks(testData, 100, 'bass');

      peaks.forEach(peak => {
        expect(peak.value).toBeGreaterThanOrEqual(100);
        expect(peak.frequency).toBeGreaterThanOrEqual(0);
      });
    });

    test('should return empty array for low threshold', () => {
      const peaks = processor.detectPeaks(new Uint8Array([1, 2, 3, 4]), 100);

      expect(peaks).toHaveLength(0);
    });

    test('should handle empty data', () => {
      const peaks = processor.detectPeaks(new Uint8Array([]), 100);

      expect(peaks).toHaveLength(0);
    });
  });

  describe('Frequency Conversion', () => {
    test('should convert bin to frequency', () => {
      const frequency = processor.binToFrequency(512);

      expect(frequency).toBeCloseTo(11025); // 44100/2 * 512/1024
    });

    test('should convert frequency to bin', () => {
      const bin = processor.frequencyToBin(11025);

      expect(bin).toBeCloseTo(512);
    });

    test('should handle boundary conditions', () => {
      expect(processor.binToFrequency(0)).toBe(0);
      expect(processor.binToFrequency(1024)).toBeCloseTo(22050);

      expect(processor.frequencyToBin(0)).toBe(0);
      expect(processor.frequencyToBin(22050)).toBeCloseTo(1024);
    });
  });

  describe('Configuration Updates', () => {
    test('should update configuration', () => {
      const newConfig = {
        sampleRate: 48000,
        binCount: 2048,
      };

      processor.updateConfig(newConfig);

      // Test that new sample rate affects frequency calculations
      const frequency = processor.binToFrequency(1024);
      expect(frequency).toBeCloseTo(12000); // 48000/2 * 1024/2048
    });

    test('should validate updated configuration', () => {
      expect(() => processor.updateConfig({ sampleRate: -1000 })).toThrow();
    });
  });

  describe('Available Ranges', () => {
    test('should return available frequency ranges', () => {
      const ranges = processor.getAvailableRanges();

      expect(ranges).toHaveProperty('bass');
      expect(ranges).toHaveProperty('mid');
      expect(ranges).toHaveProperty('treble');
      expect(ranges).toHaveProperty('full');

      expect(ranges.bass.min).toBe(20);
      expect(ranges.bass.max).toBe(250);
      expect(ranges.mid.min).toBe(250);
      expect(ranges.mid.max).toBe(2000);
      expect(ranges.treble.min).toBe(2000);
      expect(ranges.treble.max).toBe(20000);
    });

    test('should not allow modification of returned ranges', () => {
      const ranges = processor.getAvailableRanges();
      const originalBassMax = ranges.bass.max;

      ranges.bass.max = 1000; // Try to modify

      const rangesAgain = processor.getAvailableRanges();
      expect(rangesAgain.bass.max).toBe(originalBassMax);
    });
  });

  describe('Error Handling', () => {
    test('should handle invalid range names gracefully', () => {
      const testData = new Uint8Array([10, 20, 30]);

      expect(() =>
        processor.calculateAverageLevel(testData, 'nonexistent')
      ).not.toThrow();
      expect(() =>
        processor.extractFrequencyRange(testData, 'nonexistent')
      ).not.toThrow();
      expect(() =>
        processor.detectPeaks(testData, 100, 'nonexistent')
      ).not.toThrow();
    });

    test('should handle extreme values', () => {
      const extremeData = new Uint8Array([0, 255, 0, 255]);

      expect(() => processor.calculateAverageLevel(extremeData)).not.toThrow();
      expect(() => processor.detectPeaks(extremeData, 200)).not.toThrow();
      expect(() =>
        processor.mapFrequencyBands(Array.from(extremeData), 2)
      ).not.toThrow();
    });
  });
});
