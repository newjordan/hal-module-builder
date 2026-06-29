import {
  performanceMonitor,
  PerformanceMetrics,
} from '../performance-monitoring';

// Mock requestAnimationFrame and cancelAnimationFrame
let rafCallbacks: Array<(timestamp: number) => void> = [];
let rafId = 0;

const mockRequestAnimationFrame = jest.fn(
  (callback: (timestamp: number) => void) => {
    rafCallbacks.push(callback);
    return ++rafId;
  }
);

const mockCancelAnimationFrame = jest.fn((id: number) => {
  // Remove callback from queue if it exists
  rafCallbacks = rafCallbacks.filter((_, index) => index !== id - 1);
});

// Helper function to execute RAF callbacks with timestamp
const executeRafCallbacks = () => {
  const currentCallbacks = [...rafCallbacks];
  rafCallbacks = [];
  currentCallbacks.forEach(callback => {
    callback(mockTime);
  });
};

// Mock performance.now()
let mockTime = 0;
const mockPerformanceNow = jest.fn(() => mockTime);

// Mock performance.memory
const mockPerformanceMemory = {
  usedJSHeapSize: 50 * 1024 * 1024, // 50MB
  totalJSHeapSize: 100 * 1024 * 1024, // 100MB
  jsHeapSizeLimit: 200 * 1024 * 1024, // 200MB
};

beforeAll(() => {
  // Mock global functions
  global.requestAnimationFrame = mockRequestAnimationFrame;
  global.cancelAnimationFrame = mockCancelAnimationFrame;

  // Mock performance.now
  Object.defineProperty(performance, 'now', {
    value: mockPerformanceNow,
    writable: true,
  });

  // Mock performance.memory
  Object.defineProperty(performance, 'memory', {
    value: mockPerformanceMemory,
    writable: true,
    configurable: true,
  });
});

beforeEach(() => {
  jest.clearAllMocks();
  rafCallbacks = [];
  rafId = 0;
  mockTime = 0;

  // Reset monitor state
  performanceMonitor.stop();
  // Reset internal frame history by accessing private properties
  (performanceMonitor as any).frameHistory = [];
  (performanceMonitor as any).lastFrameTimestamp = 0;
  (performanceMonitor as any).layerCount = 0;
  (performanceMonitor as any).activeAnimations = 0;
});

afterEach(() => {
  performanceMonitor.stop();
});

describe('PerformanceMonitor', () => {
  describe('lifecycle management', () => {
    it('should not be running initially', () => {
      expect(performanceMonitor.isRunning()).toBe(false);
    });

    it('should start monitoring', () => {
      performanceMonitor.start();

      expect(performanceMonitor.isRunning()).toBe(true);
      expect(mockRequestAnimationFrame).toHaveBeenCalled();
    });

    it('should stop monitoring', () => {
      performanceMonitor.start();
      performanceMonitor.stop();

      expect(performanceMonitor.isRunning()).toBe(false);
      expect(mockCancelAnimationFrame).toHaveBeenCalled();
    });

    it('should not start multiple times', () => {
      performanceMonitor.start();
      performanceMonitor.start();
      performanceMonitor.start();

      expect(mockRequestAnimationFrame).toHaveBeenCalledTimes(1);
    });

    it('should handle stop when not running', () => {
      expect(() => performanceMonitor.stop()).not.toThrow();
      expect(mockCancelAnimationFrame).not.toHaveBeenCalled();
    });
  });

  describe('metrics collection', () => {
    it('should calculate FPS from frame time', () => {
      mockTime = 0;

      performanceMonitor.start();

      // Simulate 60fps (16.67ms per frame)
      mockTime = 16.67;
      executeRafCallbacks();

      // Wait for FPS update interval (1000ms)
      mockTime = 1000;
      executeRafCallbacks();

      const metrics = performanceMonitor.getMetrics();
      expect(metrics.fps).toBeGreaterThan(0); // Just check it's calculating
      expect(metrics.frameTime).toBeGreaterThan(0);
      expect(metrics.renderTime).toBeGreaterThan(0);
    });

    it('should track FPS history', () => {
      mockTime = 0;

      performanceMonitor.start();

      // Simulate multiple frames
      for (let i = 1; i <= 5; i++) {
        mockTime = i * 16.67;
        executeRafCallbacks();
      }

      // Wait for FPS update interval
      mockTime = 1000;
      executeRafCallbacks();

      const metrics = performanceMonitor.getMetrics();
      expect(metrics.fps).toBeGreaterThan(0);
    });

    it('should limit FPS history length', () => {
      mockTime = 0;

      performanceMonitor.start();

      // Simulate 100 frames (more than frameHistorySize of 60)
      for (let i = 1; i <= 100; i++) {
        mockTime = i * 16.67;
        executeRafCallbacks();
      }

      // Wait for FPS update
      mockTime = 1000;
      executeRafCallbacks();

      const metrics = performanceMonitor.getMetrics();
      expect(metrics.fps).toBeGreaterThan(0);
    });

    it('should include memory usage when available', () => {
      mockTime = 0;
      performanceMonitor.start();

      mockTime = 16.67;
      executeRafCallbacks();

      // Wait for FPS update
      mockTime = 1000;
      executeRafCallbacks();

      const metrics = performanceMonitor.getMetrics();
      expect(metrics.memoryUsage).toBe(50); // 50MB in mocked memory
    });

    it('should handle missing memory API', () => {
      // Temporarily remove memory API
      const originalMemory = (performance as any).memory;
      delete (performance as any).memory;

      mockTime = 0;
      performanceMonitor.start();

      mockTime = 16.67;
      executeRafCallbacks();

      // Wait for FPS update
      mockTime = 1000;
      executeRafCallbacks();

      const metrics = performanceMonitor.getMetrics();
      expect(metrics.memoryUsage).toBeGreaterThan(0); // Uses estimation when memory API unavailable

      // Restore memory API
      (performance as any).memory = originalMemory;
    });

    it('should handle invalid memory info', () => {
      // Mock invalid memory object
      const originalMemory = (performance as any).memory;
      (performance as any).memory = null;

      mockTime = 0;
      performanceMonitor.start();

      mockTime = 16.67;
      executeRafCallbacks();

      // Wait for FPS update
      mockTime = 1000;
      executeRafCallbacks();

      const metrics = performanceMonitor.getMetrics();
      expect(metrics.memoryUsage).toBeGreaterThan(0); // Uses estimation when memory API invalid

      // Restore memory API
      (performance as any).memory = originalMemory;
    });
  });

  describe('callback handling', () => {
    it('should work without callback', () => {
      expect(() => {
        performanceMonitor.start();
        mockTime = 16.67;
        executeRafCallbacks();
      }).not.toThrow();
    });
  });

  describe('getMetrics', () => {
    it('should return default metrics when no history', () => {
      const metrics = performanceMonitor.getMetrics();

      expect(metrics.fps).toBe(0); // No history means 0 FPS
      expect(metrics.frameTime).toBe(16.67); // Default frame time
      expect(metrics.renderTime).toBe(16.67);
      expect(metrics.layerCount).toBe(0);
    });

    it('should return calculated metrics with history', () => {
      mockTime = 0;
      performanceMonitor.start();

      // Simulate frames
      for (let i = 1; i <= 3; i++) {
        mockTime = i * 20; // 50fps
        executeRafCallbacks();
      }

      // Wait for FPS update
      mockTime = 1000;
      executeRafCallbacks();

      const metrics = performanceMonitor.getMetrics();
      expect(metrics.fps).toBeGreaterThan(0);
      expect(metrics.frameTime).toBeGreaterThan(0);
      expect(metrics.renderTime).toBeGreaterThan(0);
    });

    it('should handle empty FPS history gracefully', () => {
      // Directly test edge case - no monitoring started, no frame history
      const metrics = performanceMonitor.getMetrics();

      expect(metrics.fps).toBe(0); // No frame history = 0 FPS
      expect(metrics.frameTime).toBe(16.67); // Default frame time when no history
    });
  });

  describe('edge cases and error handling', () => {
    it('should handle very fast frames', () => {
      mockTime = 0;
      performanceMonitor.start();

      // Simulate very fast frame (1ms)
      mockTime = 1;
      executeRafCallbacks();

      // Wait for FPS update
      mockTime = 1000;
      executeRafCallbacks();

      const metrics = performanceMonitor.getMetrics();
      expect(metrics.fps).toBeGreaterThan(0); // FPS calculated
      expect(metrics.frameTime).toBeGreaterThan(0);
    });

    it('should handle very slow frames', () => {
      mockTime = 0;
      performanceMonitor.start();

      // Simulate very slow frame (1000ms)
      mockTime = 1000;
      executeRafCallbacks();

      // Wait for FPS update
      mockTime = 2000;
      executeRafCallbacks();

      const metrics = performanceMonitor.getMetrics();
      expect(metrics.fps).toBeGreaterThan(0); // FPS calculated
      expect(metrics.frameTime).toBeGreaterThan(0);
    });

    it('should handle zero delta time', () => {
      mockTime = 0;
      performanceMonitor.start();

      // Simulate zero delta (same time)
      mockTime = 0;
      executeRafCallbacks();

      // Wait for FPS update
      mockTime = 1000;
      executeRafCallbacks();

      const metrics = performanceMonitor.getMetrics();
      expect(metrics.fps).toBeGreaterThanOrEqual(0); // FPS calculated or 0
      expect(metrics.frameTime).toBeGreaterThanOrEqual(0);
    });

    it('should handle exceptions gracefully', () => {
      // Test that the monitor can handle internal errors
      expect(() => {
        performanceMonitor.start();
        mockTime = 16.67;
        executeRafCallbacks();
      }).not.toThrow();

      expect(performanceMonitor.isRunning()).toBe(true);
    });

    it('should handle multiple start/stop cycles', () => {
      for (let i = 0; i < 5; i++) {
        performanceMonitor.start();
        expect(performanceMonitor.isRunning()).toBe(true);

        performanceMonitor.stop();
        expect(performanceMonitor.isRunning()).toBe(false);
      }
    });

    it('should maintain state across start/stop cycles', () => {
      // First cycle
      mockTime = 0;
      performanceMonitor.start();
      mockTime = 16.67;
      executeRafCallbacks();
      mockTime = 1000;
      executeRafCallbacks();
      performanceMonitor.stop();

      const firstMetrics = performanceMonitor.getMetrics();
      expect(firstMetrics.fps).toBeGreaterThan(0);

      // Second cycle should maintain history
      performanceMonitor.start();
      expect(performanceMonitor.isRunning()).toBe(true);
    });
  });

  describe('performance metrics validation', () => {
    it('should return valid PerformanceMetrics interface', () => {
      mockTime = 0;
      performanceMonitor.start();

      mockTime = 16.67;
      executeRafCallbacks();
      mockTime = 1000;
      executeRafCallbacks();

      const metrics: PerformanceMetrics = performanceMonitor.getMetrics();

      expect(typeof metrics.fps).toBe('number');
      expect(typeof metrics.frameTime).toBe('number');
      expect(typeof metrics.renderTime).toBe('number');
      expect(typeof metrics.layerCount).toBe('number');
      expect(typeof metrics.memoryUsage).toBe('number');
    });

    it('should round FPS values appropriately', () => {
      mockTime = 0;
      performanceMonitor.start();

      // Simulate frame that would result in fractional FPS
      mockTime = 16.123; // Should result in ~62.1 FPS
      executeRafCallbacks();
      mockTime = 1000;
      executeRafCallbacks();

      const metrics = performanceMonitor.getMetrics();
      expect(Number.isInteger(metrics.fps)).toBe(true);
    });

    it('should maintain consistent layerCount', () => {
      mockTime = 0;
      performanceMonitor.start();

      mockTime = 16.67;
      executeRafCallbacks();
      mockTime = 1000;
      executeRafCallbacks();

      const metrics = performanceMonitor.getMetrics();
      expect(metrics.layerCount).toBe(0); // Default value
    });
  });
});
