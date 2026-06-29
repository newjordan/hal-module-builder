import { renderHook, act } from '@testing-library/react';
import {
  usePerformance,
  PerformanceAlert,
  PerformanceThresholds,
} from '../usePerformance';

// Mock the performance monitoring module
jest.mock('../../utils/performance-monitoring', () => ({
  performanceMonitor: {
    start: jest.fn(),
    stop: jest.fn(),
    isRunning: jest.fn().mockReturnValue(false),
    getMetrics: jest.fn().mockReturnValue({
      fps: 60,
      frameTime: 16.67,
      renderTime: 10,
      memoryUsage: 50,
      layerCount: 5,
    }),
  },
}));

// Get the mocked performance monitor
const mockPerformanceMonitor =
  require('../../utils/performance-monitoring').performanceMonitor;

describe('usePerformance', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    act(() => {
      jest.runOnlyPendingTimers();
    });
    jest.useRealTimers();
  });

  describe('Initialization', () => {
    it('should initialize with default state', () => {
      const { result } = renderHook(() => usePerformance());

      expect(result.current.isMonitoring).toBe(false);
      expect(result.current.metrics).toEqual({
        fps: 0,
        frameTime: 0,
        renderTime: 0,
        layerCount: 0,
        totalRenders: 0,
        averageFPS: 0,
        minFPS: Infinity,
        maxFPS: 0,
        lastUpdate: expect.any(Number),
      });
      expect(result.current.alerts).toEqual([]);
    });

    it('should auto-start monitoring when autoStart is true', () => {
      const { result } = renderHook(() => usePerformance({ autoStart: true }));

      expect(result.current.isMonitoring).toBe(true);
      expect(mockPerformanceMonitor.start).toHaveBeenCalled();
    });

    it('should not auto-start monitoring when autoStart is false', () => {
      const { result } = renderHook(() => usePerformance({ autoStart: false }));

      expect(result.current.isMonitoring).toBe(false);
      expect(mockPerformanceMonitor.start).not.toHaveBeenCalled();
    });
  });

  describe('Monitoring control', () => {
    it('should start monitoring when startMonitoring is called', () => {
      const { result } = renderHook(() => usePerformance());

      act(() => {
        result.current.startMonitoring();
      });

      expect(result.current.isMonitoring).toBe(true);
      expect(mockPerformanceMonitor.start).toHaveBeenCalled();
    });

    it('should stop monitoring when stopMonitoring is called', () => {
      const { result } = renderHook(() => usePerformance({ autoStart: true }));

      act(() => {
        result.current.stopMonitoring();
      });

      expect(result.current.isMonitoring).toBe(false);
      expect(mockPerformanceMonitor.stop).toHaveBeenCalled();
    });

    it('should not start monitoring multiple times', () => {
      const { result } = renderHook(() => usePerformance());

      // Clear any previous calls
      mockPerformanceMonitor.start.mockClear();

      act(() => {
        result.current.startMonitoring();
        result.current.startMonitoring();
      });

      expect(mockPerformanceMonitor.start).toHaveBeenCalledTimes(1);
    });
  });

  describe('Metrics updates', () => {
    it('should update metrics when performance monitor provides data', () => {
      const onMetricsUpdate = jest.fn();

      // Mock the performance monitor methods
      mockPerformanceMonitor.isRunning.mockReturnValue(true);
      mockPerformanceMonitor.getMetrics.mockReturnValue({
        fps: 45,
        frameTime: 22.22,
        renderTime: 15,
        memoryUsage: 60,
        layerCount: 8,
      });

      const { result } = renderHook(() =>
        usePerformance({
          autoStart: true,
          onMetricsUpdate,
          updateInterval: 100, // Shorter interval for testing
        })
      );

      // Fast forward time to trigger the interval
      act(() => {
        jest.advanceTimersByTime(100);
      });

      expect(result.current.metrics.fps).toBe(45);
      expect(result.current.metrics.frameTime).toBe(22.22);
      expect(result.current.metrics.renderTime).toBe(15);
      expect(result.current.metrics.memoryUsage).toBe(60);
      expect(result.current.metrics.layerCount).toBe(8);
      expect(result.current.metrics.totalRenders).toBe(1);
      expect(onMetricsUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          fps: 45,
        })
      );
    });

    it('should calculate running averages correctly', () => {
      let capturedCallback: any = null;
      mockPerformanceMonitor.start.mockImplementation(callback => {
        capturedCallback = callback;
      });

      const { result } = renderHook(() => usePerformance({ autoStart: true }));

      act(() => {
        capturedCallback({ fps: 60, frameTime: 16.67, renderTime: 10 });
      });

      act(() => {
        capturedCallback({ fps: 50, frameTime: 20, renderTime: 12 });
      });

      act(() => {
        capturedCallback({ fps: 40, frameTime: 25, renderTime: 15 });
      });

      expect(result.current.metrics.minFPS).toBe(40);
      expect(result.current.metrics.maxFPS).toBe(60);
      expect(result.current.metrics.averageFPS).toBeCloseTo(50, 1);
      expect(result.current.metrics.totalRenders).toBe(3);
    });

    it('should reset metrics correctly', () => {
      let capturedCallback: any = null;
      mockPerformanceMonitor.start.mockImplementation(callback => {
        capturedCallback = callback;
      });

      const { result } = renderHook(() => usePerformance({ autoStart: true }));

      act(() => {
        capturedCallback({ fps: 60, frameTime: 16.67, renderTime: 10 });
      });

      act(() => {
        result.current.resetMetrics();
      });

      expect(result.current.metrics.fps).toBe(0);
      expect(result.current.metrics.totalRenders).toBe(0);
      expect(result.current.metrics.minFPS).toBe(Infinity);
      expect(result.current.metrics.maxFPS).toBe(0);
    });
  });

  describe('Alert system', () => {
    it('should generate FPS warning alert when below threshold', () => {
      const onAlert = jest.fn();
      const thresholds: PerformanceThresholds = {
        minFPS: 50,
        criticalFPS: 30,
      };

      const { result } = renderHook(() =>
        usePerformance({
          autoStart: true,
          thresholds,
          onAlert,
        })
      );

      const metricsCallback = mockPerformanceMonitor.start.mock.calls[0][0];

      act(() => {
        metricsCallback({ fps: 45, frameTime: 22.22, renderTime: 15 });
      });

      expect(result.current.alerts).toHaveLength(1);
      expect(result.current.alerts[0].type).toBe('fps');
      expect(result.current.alerts[0].severity).toBe('warning');
      expect(result.current.alerts[0].message).toContain('Low FPS: 45.0 FPS');
      expect(onAlert).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'fps',
          severity: 'warning',
        })
      );
    });

    it('should generate FPS critical alert when below critical threshold', () => {
      const thresholds: PerformanceThresholds = {
        minFPS: 50,
        criticalFPS: 30,
      };

      const { result } = renderHook(() =>
        usePerformance({
          autoStart: true,
          thresholds,
        })
      );

      const metricsCallback = mockPerformanceMonitor.start.mock.calls[0][0];

      act(() => {
        metricsCallback({ fps: 25, frameTime: 40, renderTime: 35 });
      });

      expect(result.current.alerts).toHaveLength(1);
      expect(result.current.alerts[0].type).toBe('fps');
      expect(result.current.alerts[0].severity).toBe('critical');
      expect(result.current.alerts[0].message).toContain(
        'Critical FPS drop: 25.0 FPS'
      );
    });

    it('should generate render time alert when above threshold', () => {
      const thresholds: PerformanceThresholds = {
        maxRenderTime: 16.67, // ~60fps
      };

      const { result } = renderHook(() =>
        usePerformance({
          autoStart: true,
          thresholds,
        })
      );

      const metricsCallback = mockPerformanceMonitor.start.mock.calls[0][0];

      act(() => {
        metricsCallback({ fps: 30, frameTime: 33.33, renderTime: 25 });
      });

      expect(result.current.alerts).toHaveLength(1);
      expect(result.current.alerts[0].type).toBe('render');
      expect(result.current.alerts[0].severity).toBe('critical'); // >1.5x threshold
      expect(result.current.alerts[0].message).toContain(
        'High render time: 25.00ms'
      );
    });

    it('should generate memory usage alert when above threshold', () => {
      const thresholds: PerformanceThresholds = {
        maxMemoryUsage: 50, // MB
      };

      const { result } = renderHook(() =>
        usePerformance({
          autoStart: true,
          thresholds,
        })
      );

      const metricsCallback = mockPerformanceMonitor.start.mock.calls[0][0];

      act(() => {
        metricsCallback({
          fps: 60,
          frameTime: 16.67,
          renderTime: 10,
          memoryUsage: 60,
        });
      });

      expect(result.current.alerts).toHaveLength(1);
      expect(result.current.alerts[0].type).toBe('memory');
      expect(result.current.alerts[0].severity).toBe('warning');
      expect(result.current.alerts[0].message).toContain(
        'High memory usage: 60.0MB'
      );
    });

    it('should clear alerts when clearAlerts is called', () => {
      const thresholds: PerformanceThresholds = { minFPS: 50 };

      const { result } = renderHook(() =>
        usePerformance({
          autoStart: true,
          thresholds,
        })
      );

      const metricsCallback = mockPerformanceMonitor.start.mock.calls[0][0];

      act(() => {
        metricsCallback({ fps: 30, frameTime: 33.33, renderTime: 25 });
      });

      expect(result.current.alerts.length).toBeGreaterThan(0);

      act(() => {
        result.current.clearAlerts();
      });

      expect(result.current.alerts).toEqual([]);
    });

    it('should update thresholds when setThresholds is called', () => {
      const { result } = renderHook(() => usePerformance({ autoStart: true }));

      act(() => {
        result.current.setThresholds({ minFPS: 55, criticalFPS: 25 });
      });

      const metricsCallback = mockPerformanceMonitor.start.mock.calls[0][0];

      act(() => {
        metricsCallback({ fps: 50, frameTime: 20, renderTime: 15 });
      });

      // Should trigger warning because FPS is below new threshold of 55
      expect(result.current.alerts).toHaveLength(1);
      expect(result.current.alerts[0].severity).toBe('warning');
    });
  });

  describe('Performance report', () => {
    it('should generate comprehensive performance report', () => {
      const { result } = renderHook(() => usePerformance({ autoStart: true }));
      const metricsCallback = mockPerformanceMonitor.start.mock.calls[0][0];

      // Generate some metrics history
      act(() => {
        metricsCallback({
          fps: 60,
          frameTime: 16.67,
          renderTime: 10,
          memoryUsage: 40,
          layerCount: 5,
        });
      });

      act(() => {
        metricsCallback({
          fps: 55,
          frameTime: 18.18,
          renderTime: 12,
          memoryUsage: 45,
          layerCount: 6,
        });
      });

      act(() => {
        metricsCallback({
          fps: 50,
          frameTime: 20,
          renderTime: 15,
          memoryUsage: 50,
          layerCount: 7,
        });
      });

      const report = result.current.getPerformanceReport();

      expect(report.totalFrames).toBe(3);
      expect(report.sessionDuration).toBeGreaterThan(0);
      expect(report.averagePerformance.fps).toBeCloseTo(55, 1);
      expect(report.averagePerformance.memoryUsage).toBeCloseTo(45, 1);
      expect(report.performanceHistory).toHaveLength(3);
      expect(report.alertsSummary.total).toBe(0);
    });

    it('should include alerts summary in performance report', () => {
      const thresholds: PerformanceThresholds = { minFPS: 55 };
      const { result } = renderHook(() =>
        usePerformance({
          autoStart: true,
          thresholds,
        })
      );

      const metricsCallback = mockPerformanceMonitor.start.mock.calls[0][0];

      act(() => {
        metricsCallback({ fps: 50, frameTime: 20, renderTime: 15 }); // Warning
      });

      act(() => {
        metricsCallback({ fps: 45, frameTime: 22.22, renderTime: 18 }); // Another warning
      });

      const report = result.current.getPerformanceReport();

      expect(report.alertsSummary.total).toBe(2);
      expect(report.alertsSummary.warnings).toBe(2);
      expect(report.alertsSummary.critical).toBe(0);
      expect(report.alertsSummary.byType.fps).toBe(2);
    });
  });

  describe('Options and configuration', () => {
    it('should respect custom update interval', () => {
      const { result } = renderHook(() =>
        usePerformance({
          updateInterval: 500,
          autoStart: true,
        })
      );

      // Verify that the interval was set up
      expect(result.current.isMonitoring).toBe(true);

      // Fast forward time to trigger interval
      act(() => {
        jest.advanceTimersByTime(500);
      });

      // The interval callback should have been called
      expect(mockPerformanceMonitor.isRunning).toHaveBeenCalled();
    });

    it('should respect custom history size', () => {
      const { result } = renderHook(() =>
        usePerformance({
          historySize: 3,
          autoStart: true,
        })
      );

      const metricsCallback = mockPerformanceMonitor.start.mock.calls[0][0];

      // Add more metrics than history size
      act(() => {
        metricsCallback({ fps: 60, frameTime: 16.67, renderTime: 10 });
        metricsCallback({ fps: 55, frameTime: 18.18, renderTime: 12 });
        metricsCallback({ fps: 50, frameTime: 20, renderTime: 15 });
        metricsCallback({ fps: 45, frameTime: 22.22, renderTime: 18 });
        metricsCallback({ fps: 40, frameTime: 25, renderTime: 20 });
      });

      const report = result.current.getPerformanceReport();
      expect(report.performanceHistory.length).toBe(3); // Limited by historySize
    });
  });

  describe('Cleanup', () => {
    it('should cleanup on unmount', () => {
      const { unmount } = renderHook(() => usePerformance({ autoStart: true }));

      unmount();

      expect(mockPerformanceMonitor.stop).toHaveBeenCalled();
    });

    it('should clear interval on stop monitoring', () => {
      const { result } = renderHook(() => usePerformance({ autoStart: true }));

      act(() => {
        result.current.stopMonitoring();
      });

      expect(mockPerformanceMonitor.stop).toHaveBeenCalled();
      expect(result.current.isMonitoring).toBe(false);
    });
  });

  describe('Edge cases', () => {
    it('should handle metrics without memory data', () => {
      const { result } = renderHook(() => usePerformance({ autoStart: true }));
      const metricsCallback = mockPerformanceMonitor.start.mock.calls[0][0];

      act(() => {
        metricsCallback({ fps: 60, frameTime: 16.67, renderTime: 10 });
      });

      expect(result.current.metrics.memoryUsage).toBeUndefined();
    });

    it('should handle zero FPS without breaking averages', () => {
      const { result } = renderHook(() => usePerformance({ autoStart: true }));
      const metricsCallback = mockPerformanceMonitor.start.mock.calls[0][0];

      act(() => {
        metricsCallback({ fps: 0, frameTime: 0, renderTime: 0 });
      });

      expect(result.current.metrics.minFPS).toBe(Infinity);
      expect(result.current.metrics.maxFPS).toBe(0);
      expect(result.current.metrics.averageFPS).toBe(0);
    });

    it('should handle empty performance history in report', () => {
      const { result } = renderHook(() => usePerformance());

      const report = result.current.getPerformanceReport();

      expect(report.averagePerformance.fps).toBe(0);
      expect(report.performanceHistory).toEqual([]);
      expect(report.totalFrames).toBe(0);
    });
  });
});
