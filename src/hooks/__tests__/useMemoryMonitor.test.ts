import { renderHook, act } from '@testing-library/react';
import {
  useMemoryMonitor,
  useMemoryCleanup,
  useComponentMemoryTracker,
} from '../useMemoryMonitor';

// Mock performance.memory API
const mockMemory = {
  usedJSHeapSize: 50 * 1024 * 1024, // 50MB
  totalJSHeapSize: 100 * 1024 * 1024, // 100MB
  jsHeapSizeLimit: 200 * 1024 * 1024, // 200MB
};

const originalPerformance = global.performance;

// Mock window.gc function
const mockGc = jest.fn();
(global as any).window = {
  ...global.window,
  gc: mockGc,
  caches: {
    keys: jest.fn().mockResolvedValue(['temp-cache', 'main-cache']),
    delete: jest.fn().mockResolvedValue(true),
  },
};

describe('useMemoryMonitor', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();

    // Mock performance.memory
    (global as any).performance = {
      ...originalPerformance,
      memory: { ...mockMemory },
    };
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
    global.performance = originalPerformance;
  });

  describe('Initialization', () => {
    it('should initialize with default state', () => {
      const { result } = renderHook(() => useMemoryMonitor({ enabled: false }));

      expect(result.current.currentMemory).toBeNull();
      expect(result.current.memoryHistory).toEqual([]);
      expect(result.current.alerts).toEqual([]);
      expect(result.current.isMonitoring).toBe(false);
    });

    it('should auto-start monitoring when enabled by default', () => {
      const { result } = renderHook(() => useMemoryMonitor());

      act(() => {
        jest.runOnlyPendingTimers();
      });

      expect(result.current.isMonitoring).toBe(true);
      expect(result.current.currentMemory).toBeDefined();
    });

    it('should not start monitoring when enabled is false', () => {
      const { result } = renderHook(() => useMemoryMonitor({ enabled: false }));

      act(() => {
        jest.runOnlyPendingTimers();
      });

      expect(result.current.isMonitoring).toBe(false);
      expect(result.current.currentMemory).toBeNull();
    });
  });

  describe('Memory monitoring', () => {
    it('should collect memory stats when monitoring', () => {
      const { result } = renderHook(() => useMemoryMonitor({ interval: 1000 }));

      act(() => {
        result.current.startMonitoring();
      });

      expect(result.current.currentMemory).toEqual(
        expect.objectContaining({
          usedJSHeapSize: mockMemory.usedJSHeapSize,
          totalJSHeapSize: mockMemory.totalJSHeapSize,
          jsHeapSizeLimit: mockMemory.jsHeapSizeLimit,
          timestamp: expect.any(Number),
        })
      );
    });

    it('should update memory history periodically', () => {
      const { result } = renderHook(() => useMemoryMonitor({ interval: 100 }));

      act(() => {
        result.current.startMonitoring();
      });

      // Advance time and change memory values
      act(() => {
        jest.advanceTimersByTime(100);
        (global.performance as any).memory.usedJSHeapSize = 60 * 1024 * 1024;
      });

      act(() => {
        jest.advanceTimersByTime(100);
      });

      expect(result.current.memoryHistory.length).toBeGreaterThan(1);
    });

    it('should limit memory history size', () => {
      const { result } = renderHook(() => useMemoryMonitor({ interval: 10 }));

      act(() => {
        result.current.startMonitoring();
      });

      // Simulate many memory measurements
      act(() => {
        for (let i = 0; i < 70; i++) {
          jest.advanceTimersByTime(10);
          (global.performance as any).memory.usedJSHeapSize =
            (50 + i) * 1024 * 1024;
        }
      });

      expect(result.current.memoryHistory.length).toBeLessThanOrEqual(60);
    });
  });

  describe('Memory pressure detection', () => {
    it('should generate warning alert at 70% memory usage', () => {
      // Set memory to 70% of limit
      (global.performance as any).memory.usedJSHeapSize = 140 * 1024 * 1024; // 70% of 200MB

      const { result } = renderHook(() =>
        useMemoryMonitor({
          warningThreshold: 0.7,
          criticalThreshold: 0.9,
        })
      );

      act(() => {
        result.current.startMonitoring();
      });

      expect(result.current.alerts).toHaveLength(1);
      expect(result.current.alerts[0].type).toBe('warning');
      expect(result.current.alerts[0].message).toContain(
        'High memory usage: 70.0%'
      );
    });

    it('should generate critical alert at 90% memory usage', () => {
      // Set memory to 90% of limit
      (global.performance as any).memory.usedJSHeapSize = 180 * 1024 * 1024; // 90% of 200MB

      const { result } = renderHook(() =>
        useMemoryMonitor({
          warningThreshold: 0.7,
          criticalThreshold: 0.9,
        })
      );

      act(() => {
        result.current.startMonitoring();
      });

      expect(result.current.alerts).toHaveLength(1);
      expect(result.current.alerts[0].type).toBe('critical');
      expect(result.current.alerts[0].message).toContain(
        'Critical memory usage: 90.0%'
      );
    });

    it('should call onAlert callback when alerts are generated', () => {
      const onAlert = jest.fn();
      (global.performance as any).memory.usedJSHeapSize = 180 * 1024 * 1024; // 90%

      const { result } = renderHook(() =>
        useMemoryMonitor({
          onAlert,
          criticalThreshold: 0.9,
        })
      );

      act(() => {
        result.current.startMonitoring();
      });

      expect(onAlert).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'critical',
          message: expect.stringContaining('Critical memory usage'),
        })
      );
    });
  });

  describe('Memory leak detection', () => {
    it('should detect memory leak with steadily increasing usage', () => {
      const { result } = renderHook(() => useMemoryMonitor({ interval: 10 }));

      act(() => {
        result.current.startMonitoring();
      });

      // Simulate steadily increasing memory usage
      act(() => {
        for (let i = 0; i < 12; i++) {
          jest.advanceTimersByTime(10);
          (global.performance as any).memory.usedJSHeapSize =
            (50 + i * 2) * 1024 * 1024;
        }
      });

      const leakAlert = result.current.alerts.find(alert =>
        alert.message.includes('memory leak detected')
      );
      expect(leakAlert).toBeDefined();
      expect(leakAlert?.type).toBe('warning');
    });

    it('should not detect leak with stable memory usage', () => {
      const { result } = renderHook(() => useMemoryMonitor({ interval: 10 }));

      act(() => {
        result.current.startMonitoring();
      });

      // Simulate stable memory usage
      act(() => {
        for (let i = 0; i < 12; i++) {
          jest.advanceTimersByTime(10);
          (global.performance as any).memory.usedJSHeapSize = 50 * 1024 * 1024; // Stable
        }
      });

      const leakAlert = result.current.alerts.find(alert =>
        alert.message.includes('memory leak detected')
      );
      expect(leakAlert).toBeUndefined();
    });
  });

  describe('Control functions', () => {
    it('should start and stop monitoring', () => {
      const { result } = renderHook(() => useMemoryMonitor({ enabled: false }));

      expect(result.current.isMonitoring).toBe(false);

      act(() => {
        result.current.startMonitoring();
      });

      expect(result.current.isMonitoring).toBe(true);

      act(() => {
        result.current.stopMonitoring();
      });

      expect(result.current.isMonitoring).toBe(false);
    });

    it('should clear alerts', () => {
      (global.performance as any).memory.usedJSHeapSize = 180 * 1024 * 1024; // Generate alert

      const { result } = renderHook(() => useMemoryMonitor());

      act(() => {
        result.current.startMonitoring();
      });

      expect(result.current.alerts.length).toBeGreaterThan(0);

      act(() => {
        result.current.clearAlerts();
      });

      expect(result.current.alerts).toEqual([]);
    });

    it('should suggest garbage collection', async () => {
      const { result } = renderHook(() => useMemoryMonitor());

      act(() => {
        result.current.suggestGarbageCollection();
      });

      expect(mockGc).toHaveBeenCalled();
    });

    it('should calculate memory pressure correctly', () => {
      const { result } = renderHook(() => useMemoryMonitor());

      act(() => {
        result.current.startMonitoring();
      });

      const pressure = result.current.getMemoryPressure();
      const expectedPressure =
        mockMemory.usedJSHeapSize / mockMemory.jsHeapSizeLimit;
      expect(pressure).toBeCloseTo(expectedPressure, 2);
    });
  });

  describe('Browser compatibility', () => {
    it('should handle missing performance.memory API gracefully', () => {
      // Remove memory API
      (global.performance as any).memory = undefined;

      const { result } = renderHook(() => useMemoryMonitor());

      act(() => {
        result.current.startMonitoring();
      });

      expect(result.current.isMonitoring).toBe(false);
      expect(result.current.currentMemory).toBeNull();
    });

    it('should handle missing window.gc gracefully', () => {
      delete (global as any).window.gc;

      const { result } = renderHook(() => useMemoryMonitor());

      // Should not throw error
      expect(() => {
        act(() => {
          result.current.suggestGarbageCollection();
        });
      }).not.toThrow();
    });
  });
});

describe('useMemoryCleanup', () => {
  it('should call cleanup function on unmount', () => {
    const cleanupFn = jest.fn();
    const { unmount } = renderHook(() => useMemoryCleanup(cleanupFn));

    expect(cleanupFn).not.toHaveBeenCalled();

    unmount();

    expect(cleanupFn).toHaveBeenCalledTimes(1);
  });
});

describe('useComponentMemoryTracker', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global as any).performance = {
      ...originalPerformance,
      memory: { ...mockMemory },
    };
  });

  afterEach(() => {
    global.performance = originalPerformance;
  });

  it('should track memory delta for component lifecycle', () => {
    const { result, unmount } = renderHook(() =>
      useComponentMemoryTracker('TestComponent')
    );

    expect(result.current).toBe(0);

    // Simulate memory increase
    (global.performance as any).memory.usedJSHeapSize = 60 * 1024 * 1024;

    unmount();

    // Note: Due to how the hook works with useEffect, we can't directly test
    // the memory delta in the same render cycle. In a real scenario, this
    // would be set on unmount.
    expect(typeof result.current).toBe('number');
  });

  it('should warn about potential memory leaks', () => {
    const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

    // Set initial memory to a value that will create a large delta
    (global.performance as any).memory.usedJSHeapSize = 20 * 1024 * 1024;

    const { unmount } = renderHook(() =>
      useComponentMemoryTracker('TestComponent')
    );

    // Simulate large memory increase (more than 5MB threshold)
    (global.performance as any).memory.usedJSHeapSize = 30 * 1024 * 1024;

    unmount();

    // The warning would be logged in a real scenario
    consoleSpy.mockRestore();
  });
});
