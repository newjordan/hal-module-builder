/**
 * useMemoryMonitor Hook - Memory leak detection and monitoring
 * Tracks memory usage and detects potential leaks in the HAL Builder application
 */
import { useEffect, useRef, useState } from 'react';

interface MemoryStats {
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
  timestamp: number;
}

interface MemoryAlert {
  type: 'warning' | 'critical';
  message: string;
  timestamp: number;
  stats: MemoryStats;
}

interface UseMemoryMonitorOptions {
  interval?: number; // Monitoring interval in ms
  warningThreshold?: number; // Memory usage percentage for warnings
  criticalThreshold?: number; // Memory usage percentage for critical alerts
  onAlert?: (alert: MemoryAlert) => void;
  enabled?: boolean;
}

interface UseMemoryMonitorReturn {
  currentMemory: MemoryStats | null;
  memoryHistory: MemoryStats[];
  alerts: MemoryAlert[];
  isMonitoring: boolean;
  startMonitoring: () => void;
  stopMonitoring: () => void;
  clearAlerts: () => void;
  suggestGarbageCollection: () => void;
  getMemoryPressure: () => number; // 0-1 scale
}

const isMemoryAPISupported = (): boolean => {
  return (
    'performance' in window &&
    'memory' in (window.performance as any) &&
    typeof (window.performance as any).memory === 'object'
  );
};

const getMemoryStats = (): MemoryStats | null => {
  if (!isMemoryAPISupported()) {
    return null;
  }

  const memory = (window.performance as any).memory;
  return {
    usedJSHeapSize: memory.usedJSHeapSize,
    totalJSHeapSize: memory.totalJSHeapSize,
    jsHeapSizeLimit: memory.jsHeapSizeLimit,
    timestamp: Date.now(),
  };
};

export const useMemoryMonitor = (
  options: UseMemoryMonitorOptions = {}
): UseMemoryMonitorReturn => {
  const {
    interval = 5000, // 5 second intervals
    warningThreshold = 0.7, // 70% memory usage
    criticalThreshold = 0.9, // 90% memory usage
    onAlert,
    enabled = true,
  } = options;

  const [currentMemory, setCurrentMemory] = useState<MemoryStats | null>(null);
  const [memoryHistory, setMemoryHistory] = useState<MemoryStats[]>([]);
  const [alerts, setAlerts] = useState<MemoryAlert[]>([]);
  const [isMonitoring, setIsMonitoring] = useState(false);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const maxHistorySize = 60; // Keep last 60 measurements (5 minutes at 5s intervals)

  const checkMemoryPressure = (stats: MemoryStats): MemoryAlert | null => {
    const pressure = stats.usedJSHeapSize / stats.jsHeapSizeLimit;

    if (pressure >= criticalThreshold) {
      return {
        type: 'critical',
        message: `Critical memory usage: ${(pressure * 100).toFixed(1)}% (${Math.round(stats.usedJSHeapSize / 1024 / 1024)}MB)`,
        timestamp: Date.now(),
        stats,
      };
    } else if (pressure >= warningThreshold) {
      return {
        type: 'warning',
        message: `High memory usage: ${(pressure * 100).toFixed(1)}% (${Math.round(stats.usedJSHeapSize / 1024 / 1024)}MB)`,
        timestamp: Date.now(),
        stats,
      };
    }

    return null;
  };

  const detectMemoryLeaks = (history: MemoryStats[]): MemoryAlert | null => {
    if (history.length < 10) return null; // Need sufficient data

    // Check for steadily increasing memory usage
    const recent = history.slice(-5);
    const older = history.slice(-10, -5);

    const recentAvg =
      recent.reduce((sum, stat) => sum + stat.usedJSHeapSize, 0) /
      recent.length;
    const olderAvg =
      older.reduce((sum, stat) => sum + stat.usedJSHeapSize, 0) / older.length;

    const growthRate = (recentAvg - olderAvg) / olderAvg;

    if (growthRate > 0.1) {
      // 10% growth over 5 measurements
      const lastStats = recent[recent.length - 1];
      if (!lastStats) {
        return null;
      }

      return {
        type: 'warning',
        message: `Potential memory leak detected: ${(growthRate * 100).toFixed(1)}% growth trend`,
        timestamp: Date.now(),
        stats: lastStats,
      };
    }

    return null;
  };

  const monitorMemory = () => {
    const stats = getMemoryStats();
    if (!stats) return;

    setCurrentMemory(stats);

    setMemoryHistory(prev => {
      const newHistory = [...prev, stats];
      if (newHistory.length > maxHistorySize) {
        newHistory.shift(); // Remove oldest entry
      }

      // Check for alerts
      const pressureAlert = checkMemoryPressure(stats);
      const leakAlert = detectMemoryLeaks(newHistory);

      const newAlerts: MemoryAlert[] = [];
      if (pressureAlert) newAlerts.push(pressureAlert);
      if (leakAlert) newAlerts.push(leakAlert);

      if (newAlerts.length > 0) {
        setAlerts(prevAlerts => {
          const updated = [...prevAlerts, ...newAlerts];
          // Keep only last 20 alerts
          if (updated.length > 20) {
            return updated.slice(-20);
          }
          return updated;
        });

        // Call alert callback
        if (onAlert) {
          newAlerts.forEach(onAlert);
        }
      }

      return newHistory;
    });
  };

  const startMonitoring = () => {
    if (!isMemoryAPISupported() || !enabled || isMonitoring) return;

    setIsMonitoring(true);
    monitorMemory(); // Initial measurement

    intervalRef.current = setInterval(monitorMemory, interval);
  };

  const stopMonitoring = () => {
    setIsMonitoring(false);

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const clearAlerts = () => {
    setAlerts([]);
  };

  const suggestGarbageCollection = () => {
    // Cleanup image memory manager
    import('../utils/ImageMemoryManager')
      .then(({ imageMemoryManager }) => {
        imageMemoryManager.suggestGarbageCollection();
      })
      .catch(() => {
        // Silently handle import error
      });

    // Manual garbage collection if available (dev tools)
    if (window.gc && typeof window.gc === 'function') {
      window.gc();
    }

    // Force cleanup of various browser caches
    if ('caches' in window) {
      caches
        .keys()
        .then(names => {
          names.forEach(name => {
            if (name.includes('temp') || name.includes('cache')) {
              caches.delete(name);
            }
          });
        })
        .catch(() => {
          // Silently handle error
        });
    }
  };

  const getMemoryPressure = (): number => {
    if (!currentMemory) return 0;
    return Math.min(
      1,
      currentMemory.usedJSHeapSize / currentMemory.jsHeapSizeLimit
    );
  };

  // Auto-start monitoring if enabled
  useEffect(() => {
    if (enabled) {
      startMonitoring();
    }

    return () => {
      stopMonitoring();
    };
  }, [enabled, interval]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopMonitoring();
    };
  }, []);

  return {
    currentMemory,
    memoryHistory,
    alerts,
    isMonitoring,
    startMonitoring,
    stopMonitoring,
    clearAlerts,
    suggestGarbageCollection,
    getMemoryPressure,
  };
};

// Higher-order hook for automatic memory cleanup on component unmount
export const useMemoryCleanup = (cleanupFn: () => void) => {
  useEffect(() => {
    return () => {
      cleanupFn();
    };
  }, [cleanupFn]);
};

// Hook for detecting memory leaks in specific components
export const useComponentMemoryTracker = (componentName: string) => {
  const startMemory = useRef<number | null>(null);
  const [memoryDelta, setMemoryDelta] = useState<number>(0);

  useEffect(() => {
    const stats = getMemoryStats();
    if (stats) {
      startMemory.current = stats.usedJSHeapSize;
    }

    return () => {
      const endStats = getMemoryStats();
      if (startMemory.current && endStats) {
        const delta = endStats.usedJSHeapSize - startMemory.current;
        setMemoryDelta(delta);

        if (delta > 5 * 1024 * 1024) {
          // 5MB leak threshold
          console.warn(
            `Potential memory leak in ${componentName}: ${Math.round(delta / 1024 / 1024)}MB not cleaned up`
          );
        }
      }
    };
  }, [componentName]);

  return memoryDelta;
};

export default useMemoryMonitor;
