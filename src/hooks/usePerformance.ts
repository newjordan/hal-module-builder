/**
 * usePerformance Hook - Performance monitoring and metrics
 * Provides real-time performance tracking for FPS, memory, and render times
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import { performanceMonitor } from '../utils/performance-monitoring';

export interface PerformanceMetrics {
  fps: number;
  frameTime: number;
  renderTime: number;
  memoryUsage?: number;
  layerCount: number;
  totalRenders: number;
  averageFPS: number;
  minFPS: number;
  maxFPS: number;
  lastUpdate: number;
}

export interface PerformanceAlert {
  type: 'fps' | 'memory' | 'render';
  severity: 'warning' | 'critical';
  message: string;
  timestamp: number;
  value: number;
  threshold: number;
}

export interface UsePerformanceReturn {
  metrics: PerformanceMetrics;
  alerts: PerformanceAlert[];
  isMonitoring: boolean;
  startMonitoring: () => void;
  stopMonitoring: () => void;
  resetMetrics: () => void;
  clearAlerts: () => void;
  setThresholds: (thresholds: PerformanceThresholds) => void;
  getPerformanceReport: () => PerformanceReport;
}

export interface PerformanceThresholds {
  minFPS?: number;
  criticalFPS?: number;
  maxRenderTime?: number;
  maxMemoryUsage?: number;
}

export interface PerformanceReport {
  sessionDuration: number;
  totalFrames: number;
  averagePerformance: PerformanceMetrics;
  performanceHistory: PerformanceMetrics[];
  alertsSummary: {
    total: number;
    warnings: number;
    critical: number;
    byType: Record<string, number>;
  };
}

export interface UsePerformanceOptions {
  updateInterval?: number;
  historySize?: number;
  autoStart?: boolean;
  thresholds?: PerformanceThresholds;
  onAlert?: (alert: PerformanceAlert) => void;
  onMetricsUpdate?: (metrics: PerformanceMetrics) => void;
}

const DEFAULT_THRESHOLDS: PerformanceThresholds = {
  minFPS: 45,
  criticalFPS: 30,
  maxRenderTime: 33.33, // ~30fps
  maxMemoryUsage: 100, // MB
};

export const usePerformance = (
  options: UsePerformanceOptions = {}
): UsePerformanceReturn => {
  const {
    updateInterval = 1000,
    historySize = 60,
    autoStart = false,
    thresholds = DEFAULT_THRESHOLDS,
    // onAlert,
    // onMetricsUpdate
  } = options;

  const [isMonitoring, setIsMonitoring] = useState(false);
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    fps: 0,
    frameTime: 0,
    renderTime: 0,
    layerCount: 0,
    totalRenders: 0,
    averageFPS: 0,
    minFPS: Infinity,
    maxFPS: 0,
    lastUpdate: Date.now(),
  });
  const [alerts, setAlerts] = useState<PerformanceAlert[]>([]);

  const metricsHistoryRef = useRef<PerformanceMetrics[]>([]);
  const thresholdsRef = useRef<PerformanceThresholds>(thresholds);
  const sessionStartRef = useRef<number>(Date.now());
  const intervalRef = useRef<NodeJS.Timeout>();
  const optionsRef = useRef(options);
  const isMonitoringRef = useRef(false);

  // Update refs when options change
  useEffect(() => {
    optionsRef.current = options;
    thresholdsRef.current = thresholds;
  }, [options, thresholds]);

  // Auto-start monitoring if enabled
  useEffect(() => {
    if (autoStart && !isMonitoring) {
      startMonitoring();
    }
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [autoStart]);

  /**
   * Check metrics against thresholds and generate alerts
   */
  const checkThresholds = useCallback((currentMetrics: PerformanceMetrics) => {
    const newAlerts: PerformanceAlert[] = [];
    const thresholds = thresholdsRef.current;
    const now = Date.now();

    // FPS alerts
    if (thresholds.criticalFPS && currentMetrics.fps < thresholds.criticalFPS) {
      newAlerts.push({
        type: 'fps',
        severity: 'critical',
        message: `Critical FPS drop: ${currentMetrics.fps.toFixed(1)} FPS`,
        timestamp: now,
        value: currentMetrics.fps,
        threshold: thresholds.criticalFPS,
      });
    } else if (thresholds.minFPS && currentMetrics.fps < thresholds.minFPS) {
      newAlerts.push({
        type: 'fps',
        severity: 'warning',
        message: `Low FPS: ${currentMetrics.fps.toFixed(1)} FPS`,
        timestamp: now,
        value: currentMetrics.fps,
        threshold: thresholds.minFPS,
      });
    }

    // Render time alerts
    if (
      thresholds.maxRenderTime &&
      currentMetrics.renderTime > thresholds.maxRenderTime
    ) {
      const criticalRenderThreshold = thresholds.maxRenderTime * 1.5;
      newAlerts.push({
        type: 'render',
        severity:
          // Small epsilon avoids float-boundary misses in threshold comparisons.
          currentMetrics.renderTime >= criticalRenderThreshold - 0.01
            ? 'critical'
            : 'warning',
        message: `High render time: ${currentMetrics.renderTime.toFixed(2)}ms`,
        timestamp: now,
        value: currentMetrics.renderTime,
        threshold: thresholds.maxRenderTime,
      });
    }

    // Memory usage alerts
    if (
      thresholds.maxMemoryUsage &&
      currentMetrics.memoryUsage &&
      currentMetrics.memoryUsage > thresholds.maxMemoryUsage
    ) {
      newAlerts.push({
        type: 'memory',
        severity:
          currentMetrics.memoryUsage > thresholds.maxMemoryUsage * 1.5
            ? 'critical'
            : 'warning',
        message: `High memory usage: ${currentMetrics.memoryUsage.toFixed(1)}MB`,
        timestamp: now,
        value: currentMetrics.memoryUsage,
        threshold: thresholds.maxMemoryUsage,
      });
    }

    if (newAlerts.length > 0) {
      setAlerts(prev => [...prev, ...newAlerts]);

      // Call alert callback for each new alert
      if (optionsRef.current.onAlert) {
        newAlerts.forEach(alert => optionsRef.current.onAlert!(alert));
      }
    }
  }, []);

  /**
   * Update metrics with new data
   */
  const updateMetrics = useCallback(
    (newData: Partial<PerformanceMetrics>) => {
      setMetrics(prev => {
        const updated: PerformanceMetrics = {
          ...prev,
          ...newData,
          totalRenders: prev.totalRenders + 1,
          lastUpdate: Date.now(),
        };

        // Update running averages
        const history = metricsHistoryRef.current;
        if (updated.fps > 0) {
          updated.minFPS = Math.min(
            prev.minFPS === Infinity ? updated.fps : prev.minFPS,
            updated.fps
          );
          updated.maxFPS = Math.max(prev.maxFPS, updated.fps);

          // Calculate average FPS from recent history
          if (history.length > 0) {
            // Include the current sample in the rolling average window.
            const recentHistory = [...history.slice(-9), updated]; // Last 10 including current
            updated.averageFPS =
              recentHistory.reduce((sum, m) => sum + m.fps, 0) /
              recentHistory.length;
          } else {
            updated.averageFPS = updated.fps;
          }
        }

        // Add to history
        history.push({ ...updated });
        if (history.length > historySize) {
          history.shift();
        }

        // Check thresholds for alerts
        checkThresholds(updated);

        // Call metrics update callback
        if (optionsRef.current.onMetricsUpdate) {
          optionsRef.current.onMetricsUpdate(updated);
        }

        return updated;
      });
    },
    [checkThresholds, historySize]
  );

  /**
   * Start performance monitoring
   */
  const startMonitoring = useCallback(() => {
    if (isMonitoringRef.current) return;

    isMonitoringRef.current = true;
    setIsMonitoring(true);
    sessionStartRef.current = Date.now();

    // Start the performance monitor (supports callback-style monitors and polling-style monitors)
    (performanceMonitor as any).start((monitorMetrics: any) => {
      if (!monitorMetrics) return;
      updateMetrics({
        fps: monitorMetrics.fps,
        frameTime: monitorMetrics.frameTime,
        renderTime: monitorMetrics.renderTime,
        ...(monitorMetrics.memoryUsage !== undefined && {
          memoryUsage: monitorMetrics.memoryUsage,
        }),
        layerCount: monitorMetrics.layerCount || metrics.layerCount,
      });
    });

    // Set up periodic updates to poll metrics
    intervalRef.current = setInterval(() => {
      if (performanceMonitor.isRunning()) {
        const monitorMetrics = performanceMonitor.getMetrics();
        updateMetrics({
          fps: monitorMetrics.fps,
          frameTime: monitorMetrics.frameTime,
          renderTime: monitorMetrics.renderTime,
          ...(monitorMetrics.memoryUsage !== undefined && {
            memoryUsage: monitorMetrics.memoryUsage,
          }),
          layerCount: monitorMetrics.layerCount || metrics.layerCount,
        });
      } else {
        updateMetrics({
          fps: 0,
          frameTime: 0,
          renderTime: 0,
        });
      }
    }, updateInterval);
  }, [updateMetrics, updateInterval, metrics.layerCount]);

  /**
   * Stop performance monitoring
   */
  const stopMonitoring = useCallback(() => {
    if (!isMonitoringRef.current) return;

    isMonitoringRef.current = false;
    setIsMonitoring(false);
    performanceMonitor.stop();

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = undefined;
    }
  }, []);

  /**
   * Reset all metrics
   */
  const resetMetrics = useCallback(() => {
    setMetrics({
      fps: 0,
      frameTime: 0,
      renderTime: 0,
      layerCount: 0,
      totalRenders: 0,
      averageFPS: 0,
      minFPS: Infinity,
      maxFPS: 0,
      lastUpdate: Date.now(),
    });

    metricsHistoryRef.current = [];
    sessionStartRef.current = Date.now();
  }, []);

  /**
   * Clear all alerts
   */
  const clearAlerts = useCallback(() => {
    setAlerts([]);
  }, []);

  /**
   * Update thresholds
   */
  const setThresholds = useCallback((newThresholds: PerformanceThresholds) => {
    thresholdsRef.current = { ...thresholdsRef.current, ...newThresholds };
  }, []);

  /**
   * Generate comprehensive performance report
   */
  const getPerformanceReport = useCallback((): PerformanceReport => {
    const history = metricsHistoryRef.current;
    const sessionDuration = Math.max(1, Date.now() - sessionStartRef.current);

    // Calculate averages from history
    let averageMetrics: PerformanceMetrics = {
      fps: 0,
      frameTime: 0,
      renderTime: 0,
      layerCount: 0,
      totalRenders: metrics.totalRenders,
      averageFPS: 0,
      minFPS: Infinity,
      maxFPS: 0,
      lastUpdate: Date.now(),
    };

    if (history.length > 0) {
      averageMetrics = {
        fps: history.reduce((sum, m) => sum + m.fps, 0) / history.length,
        frameTime:
          history.reduce((sum, m) => sum + m.frameTime, 0) / history.length,
        renderTime:
          history.reduce((sum, m) => sum + m.renderTime, 0) / history.length,
        layerCount:
          history.reduce((sum, m) => sum + m.layerCount, 0) / history.length,
        totalRenders: metrics.totalRenders,
        averageFPS: history.reduce((sum, m) => sum + m.fps, 0) / history.length,
        minFPS: Math.min(...history.map(m => m.fps).filter(fps => fps > 0)),
        maxFPS: Math.max(...history.map(m => m.fps)),
        lastUpdate: Date.now(),
        ...(function () {
          const memoryValues = history
            .map(m => m.memoryUsage)
            .filter((mem): mem is number => typeof mem === 'number');

          if (memoryValues.length > 0) {
            const avgMemory =
              memoryValues.reduce((sum, mem) => sum + mem, 0) /
              memoryValues.length;
            return { memoryUsage: avgMemory };
          }
          return {};
        })(),
      };
    }

    // Analyze alerts
    const alertsSummary = {
      total: alerts.length,
      warnings: alerts.filter(a => a.severity === 'warning').length,
      critical: alerts.filter(a => a.severity === 'critical').length,
      byType: alerts.reduce(
        (acc, alert) => {
          acc[alert.type] = (acc[alert.type] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      ),
    };

    return {
      sessionDuration,
      totalFrames: metrics.totalRenders,
      averagePerformance: averageMetrics,
      performanceHistory: [...history],
      alertsSummary,
    };
  }, [metrics, alerts]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopMonitoring();
    };
  }, [stopMonitoring]);

  return {
    metrics,
    alerts,
    isMonitoring,
    startMonitoring,
    stopMonitoring,
    resetMetrics,
    clearAlerts,
    setThresholds,
    getPerformanceReport,
  };
};
