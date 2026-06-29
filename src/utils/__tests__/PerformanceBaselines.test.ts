import {
  PerformanceBaselines,
  measureFrameRate,
  measureMemoryUsage,
  measureRenderTime,
  measureAudioProcessingTime,
  measureComponentLoadTime,
  benchmarkLayerOperations,
  createPerformanceReport,
} from '../PerformanceBaselines';

// Mock performance API
const mockPerformance = {
  now: jest.fn(() => Date.now()),
  mark: jest.fn(),
  measure: jest.fn(),
  getEntriesByName: jest.fn(() => [{ duration: 16.67 }]),
  getEntriesByType: jest.fn(() => []),
};

// Mock memory API
const mockMemory = {
  usedJSHeapSize: 50 * 1024 * 1024, // 50MB
  totalJSHeapSize: 100 * 1024 * 1024, // 100MB
  jsHeapSizeLimit: 2048 * 1024 * 1024, // 2GB
};

Object.defineProperty(global, 'performance', {
  value: mockPerformance,
  writable: true,
});

Object.defineProperty(global.performance, 'memory', {
  value: mockMemory,
  writable: true,
});

describe('PerformanceBaselines', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPerformance.now.mockReturnValue(Date.now());
  });

  describe('PerformanceBaselines class', () => {
    it('should initialize with default baselines', () => {
      expect(PerformanceBaselines.frameRate.target).toBe(60);
      expect(PerformanceBaselines.frameRate.minimum).toBe(30);
      expect(PerformanceBaselines.memory.maxUsage).toBe(100);
      expect(PerformanceBaselines.renderTime.maxFrameTime).toBe(16.67);
    });

    it('should validate frame rate performance', () => {
      expect(PerformanceBaselines.validateFrameRate(60)).toBe(true);
      expect(PerformanceBaselines.validateFrameRate(30)).toBe(true);
      expect(PerformanceBaselines.validateFrameRate(25)).toBe(false);
    });

    it('should validate memory usage', () => {
      expect(PerformanceBaselines.validateMemoryUsage(50)).toBe(true);
      expect(PerformanceBaselines.validateMemoryUsage(100)).toBe(true);
      expect(PerformanceBaselines.validateMemoryUsage(150)).toBe(false);
    });

    it('should validate render time', () => {
      expect(PerformanceBaselines.validateRenderTime(10)).toBe(true);
      expect(PerformanceBaselines.validateRenderTime(16.67)).toBe(true);
      expect(PerformanceBaselines.validateRenderTime(20)).toBe(false);
    });

    it('should validate audio processing time', () => {
      expect(PerformanceBaselines.validateAudioProcessingTime(5)).toBe(true);
      expect(PerformanceBaselines.validateAudioProcessingTime(10)).toBe(true);
      expect(PerformanceBaselines.validateAudioProcessingTime(15)).toBe(true);
      expect(PerformanceBaselines.validateAudioProcessingTime(60)).toBe(false);
    });

    it('should validate component load time', () => {
      expect(PerformanceBaselines.validateComponentLoadTime(80)).toBe(true);
      expect(PerformanceBaselines.validateComponentLoadTime(120)).toBe(true);
      expect(PerformanceBaselines.validateComponentLoadTime(180)).toBe(true);
      expect(PerformanceBaselines.validateComponentLoadTime(1200)).toBe(false);
    });
  });

  describe('measureFrameRate', () => {
    it('should measure frame rate', async () => {
      const result = await measureFrameRate();
      expect(result).toBeGreaterThan(0);
      expect(typeof result).toBe('number');
    });
  });

  describe('measureMemoryUsage', () => {
    it('should measure current memory usage', () => {
      const result = measureMemoryUsage();
      expect(typeof result).toBe('number');
      expect(result).toBeGreaterThanOrEqual(0);
    });

    it('should handle missing memory API', () => {
      const originalPerformance = global.performance;
      const mockPerformanceWithoutMemory = {
        ...mockPerformance,
        // memory property is undefined
      };

      Object.defineProperty(global, 'performance', {
        value: mockPerformanceWithoutMemory,
        writable: true,
        configurable: true,
      });

      const result = measureMemoryUsage();
      expect(result).toBe(45); // Mock fallback value

      Object.defineProperty(global, 'performance', {
        value: originalPerformance,
        writable: true,
        configurable: true,
      });
    });
  });

  describe('measureRenderTime', () => {
    it('should measure render time for operation', async () => {
      mockPerformance.now.mockReturnValueOnce(100).mockReturnValueOnce(116.67);

      const mockOperation = jest.fn();
      const result = await measureRenderTime(mockOperation);

      expect(typeof result).toBe('number');
      expect(result).toBeCloseTo(16.67);
      expect(mockOperation).toHaveBeenCalled();
    });

    it('should handle synchronous operations', async () => {
      mockPerformance.now.mockReturnValueOnce(100).mockReturnValueOnce(105);

      const syncOperation = () => 'sync-result';
      const result = await measureRenderTime(syncOperation);

      expect(result).toBe(5);
    });

    it('should handle operation errors', async () => {
      const errorOperation = () => {
        throw new Error('Test error');
      };

      await expect(measureRenderTime(errorOperation)).rejects.toThrow(
        'Test error'
      );
    });
  });

  describe('measureAudioProcessingTime', () => {
    it('should measure audio processing time', async () => {
      const result = await measureAudioProcessingTime();
      expect(typeof result).toBe('number');
      expect(result).toBeGreaterThanOrEqual(0);
    });
  });

  describe('measureComponentLoadTime', () => {
    it('should measure component load time', async () => {
      mockPerformance.now.mockReturnValueOnce(100).mockReturnValueOnce(150);

      const mockComponent = jest.fn();
      const result = await measureComponentLoadTime(mockComponent);

      expect(typeof result).toBe('number');
      expect(result).toBe(50);
      expect(mockComponent).toHaveBeenCalled();
    });

    it('should handle component load errors', async () => {
      const errorComponent = () => {
        throw new Error('Load failed');
      };

      await expect(measureComponentLoadTime(errorComponent)).rejects.toThrow(
        'Load failed'
      );
    });
  });

  describe('benchmarkLayerOperations', () => {
    it('should benchmark layer operations', async () => {
      const result = await benchmarkLayerOperations(10);

      expect(result).toHaveProperty('addLayer');
      expect(result).toHaveProperty('updateLayer');
      expect(result).toHaveProperty('removeLayer');
      expect(result).toHaveProperty('moveLayer');

      expect(result.addLayer).toBeGreaterThanOrEqual(0);
      expect(result.updateLayer).toBeGreaterThanOrEqual(0);
      expect(result.removeLayer).toBeGreaterThanOrEqual(0);
      expect(result.moveLayer).toBeGreaterThanOrEqual(0);
    });

    it('should handle different layer counts', async () => {
      const result = await benchmarkLayerOperations(5);
      expect(result.addLayer).toBeGreaterThanOrEqual(0);
    });
  });

  describe('createPerformanceReport', () => {
    it('should create comprehensive performance report', async () => {
      const result = await createPerformanceReport();

      expect(result).toHaveProperty('timestamp');
      expect(result).toHaveProperty('metrics');
      expect(result).toHaveProperty('baseline_comparison');

      expect(result.metrics).toHaveProperty('frameRate');
      expect(result.metrics).toHaveProperty('memoryUsage');
      expect(result.metrics).toHaveProperty('audioProcessingTime');
      expect(result.metrics).toHaveProperty('layerOperations');

      expect(result.baseline_comparison).toHaveProperty('frameRate');
      expect(result.baseline_comparison).toHaveProperty('memory');
    });

    it('should include baseline comparisons', async () => {
      const result = await createPerformanceReport();

      expect(result.baseline_comparison.frameRate.meets_target).toBeDefined();
      expect(result.baseline_comparison.memory.within_limits).toBeDefined();
    });
  });
});
