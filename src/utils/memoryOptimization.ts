/**
 * Enhanced Memory Optimization System
 * Part of Story E6.3 - Performance optimization for 30%+ memory reduction
 *
 * Enhanced with:
 * - Object pooling coordination across modules
 * - Memory allocation monitoring and optimization
 * - Garbage collection coordination
 * - Buffer reuse strategies
 * - Performance regression detection
 */

// Type for Layer - minimal interface for cache operations
interface Layer {
  id: string;
  [key: string]: any;
}

interface HistoryEntry<T> {
  data: T;
  timestamp: number;
  size: number;
}

interface MemoryPool<T> {
  acquire(): T;
  release(item: T): void;
  clear(): void;
  size(): number;
}

interface MemoryMetrics {
  heapUsed: number;
  heapTotal: number;
  poolSizes: Record<string, number>;
  historyMemory: number;
  timestamp: number;
}

/**
 * Generic object pool implementation for E6.3 optimization
 */
class ObjectPool<T> implements MemoryPool<T> {
  private pool: T[] = [];
  private factory: () => T;
  private reset: ((item: T) => void) | undefined;
  private maxSize: number;

  constructor(
    factory: () => T,
    maxSize: number = 50,
    reset?: (item: T) => void
  ) {
    this.factory = factory;
    this.maxSize = maxSize;
    this.reset = reset;
  }

  acquire(): T {
    if (this.pool.length > 0) {
      return this.pool.pop()!;
    }
    return this.factory();
  }

  release(item: T): void {
    if (this.pool.length < this.maxSize) {
      if (this.reset) {
        this.reset(item);
      }
      this.pool.push(item);
    }
  }

  clear(): void {
    this.pool = [];
  }

  size(): number {
    return this.pool.length;
  }
}

/**
 * Enhanced Memory Optimizer with E6.3 performance features
 */
class MemoryOptimizer {
  private layerDataCache = new WeakMap<any, any>();
  private historyStack: HistoryEntry<any>[] = [];
  private maxHistorySize = 50;
  private maxHistoryMemory = 10 * 1024 * 1024; // 10MB
  private currentHistoryMemory = 0;

  // E6.3 Performance Enhancement Features
  private pools = new Map<string, MemoryPool<any>>();
  private metricsHistory: MemoryMetrics[] = [];
  private monitoringInterval?: number;
  private baselineMemory = 0;

  addToHistory<T>(data: T): void {
    const serialized = JSON.stringify(data);
    const size = new Blob([serialized]).size;

    const entry: HistoryEntry<T> = {
      data: this.deepClone(data),
      timestamp: Date.now(),
      size,
    };

    this.historyStack.push(entry);
    this.currentHistoryMemory += size;

    this.cleanupHistory();
  }

  getFromHistory(index: number): any | null {
    const entry = this.historyStack[index];
    return entry ? this.deepClone(entry.data) : null;
  }

  private cleanupHistory(): void {
    while (
      this.historyStack.length > this.maxHistorySize ||
      this.currentHistoryMemory > this.maxHistoryMemory
    ) {
      const removed = this.historyStack.shift();
      if (removed) {
        this.currentHistoryMemory -= removed.size;
      }
    }
  }

  cacheLayerData(layer: Layer, data: any): void {
    this.layerDataCache.set(layer, this.deepClone(data));
  }

  getCachedLayerData(layer: Layer): any | null {
    return this.layerDataCache.get(layer) || null;
  }

  clearLayerCache(): void {
    this.layerDataCache = new WeakMap();
  }

  private deepClone<T>(obj: T): T {
    if (obj === null || typeof obj !== 'object') {
      return obj;
    }

    if (obj instanceof Date) {
      return new Date(obj.getTime()) as any;
    }

    if (obj instanceof Array) {
      return obj.map(item => this.deepClone(item)) as any;
    }

    if (typeof obj === 'object') {
      const cloned: any = {};
      Object.keys(obj).forEach(key => {
        cloned[key] = this.deepClone((obj as any)[key]);
      });
      return cloned;
    }

    return obj;
  }

  scheduleGarbageCollection(): void {
    if ('requestIdleCallback' in window) {
      requestIdleCallback(() => {
        this.performMaintenance();
      });
    } else {
      setTimeout(() => {
        this.performMaintenance();
      }, 100);
    }
  }

  private performMaintenance(): void {
    this.cleanupHistory();

    if (window.gc && typeof window.gc === 'function') {
      window.gc();
    }
  }

  getMemoryStats(): {
    historyEntries: number;
    historyMemoryMB: number;
    maxHistoryMemoryMB: number;
  } {
    return {
      historyEntries: this.historyStack.length,
      historyMemoryMB:
        Math.round((this.currentHistoryMemory / 1024 / 1024) * 100) / 100,
      maxHistoryMemoryMB: this.maxHistoryMemory / 1024 / 1024,
    };
  }

  /**
   * E6.3 Enhancement: Initialize performance optimization features
   */
  initializeE6Optimization(): void {
    // Set baseline memory
    this.baselineMemory = this.getCurrentMemoryUsage();

    // Create default object pools for frequent allocations
    this.registerPool(
      'audio-data',
      new ObjectPool(
        () => new Uint8Array(2048),
        20,
        buffer => buffer.fill(0)
      )
    );

    this.registerPool(
      'frequency-data',
      new ObjectPool(
        () => new Float32Array(1024),
        15,
        buffer => buffer.fill(0)
      )
    );

    this.registerPool(
      'render-context',
      new ObjectPool(
        () => ({ width: 0, height: 0, centerX: 0, centerY: 0 }),
        10,
        ctx => {
          ctx.width = 0;
          ctx.height = 0;
          ctx.centerX = 0;
          ctx.centerY = 0;
        }
      )
    );

    // Start performance monitoring
    this.startPerformanceMonitoring();
    console.log('🚀 E6.3 Memory optimization initialized');
  }

  /**
   * Register an object pool for reuse
   */
  registerPool<T>(name: string, pool: MemoryPool<T>): void {
    this.pools.set(name, pool);
  }

  /**
   * Acquire object from pool
   */
  acquireFromPool<T>(poolName: string): T | null {
    const pool = this.pools.get(poolName);
    return pool ? pool.acquire() : null;
  }

  /**
   * Release object back to pool
   */
  releaseToPool<T>(poolName: string, item: T): void {
    const pool = this.pools.get(poolName);
    if (pool) {
      pool.release(item);
    }
  }

  /**
   * Get memory reduction percentage achieved
   */
  getMemoryReduction(): number {
    const current = this.getCurrentMemoryUsage();
    if (this.baselineMemory === 0) return 0;
    return ((this.baselineMemory - current) / this.baselineMemory) * 100;
  }

  /**
   * Get comprehensive memory metrics
   */
  getMemoryMetrics(): MemoryMetrics {
    const poolSizes: Record<string, number> = {};
    this.pools.forEach((pool, name) => {
      poolSizes[name] = pool.size();
    });

    return {
      heapUsed: this.getCurrentMemoryUsage(),
      heapTotal: this.getTotalHeapSize(),
      poolSizes,
      historyMemory: this.currentHistoryMemory,
      timestamp: Date.now(),
    };
  }

  /**
   * Force garbage collection if available
   */
  forceGC(): void {
    if (
      typeof window !== 'undefined' &&
      'gc' in window &&
      typeof (window as any).gc === 'function'
    ) {
      (window as any).gc();
      console.log('🗑️ Forced garbage collection');
    }
  }

  /**
   * Optimize memory usage across all systems
   */
  optimizeMemory(): void {
    // Clean up history if memory usage is high
    const metrics = this.getMemoryMetrics();
    const memoryMB = metrics.heapUsed / (1024 * 1024);

    if (memoryMB > 100) {
      // If using more than 100MB
      console.log('⚠️ High memory usage detected, optimizing...');

      // Reduce history size temporarily
      this.maxHistorySize = Math.max(10, this.maxHistorySize * 0.7);
      this.cleanupHistory();

      // Clear smaller pools
      this.pools.forEach((pool, _name) => {
        if (pool.size() > 5) {
          // Keep only 30% of pool items
          const targetSize = Math.floor(pool.size() * 0.3);
          while (pool.size() > targetSize) {
            pool.acquire(); // Remove from pool
          }
        }
      });

      // Force GC
      setTimeout(() => this.forceGC(), 100);
    }
  }

  /**
   * Start performance monitoring
   */
  private startPerformanceMonitoring(): void {
    this.monitoringInterval = window.setInterval(() => {
      const metrics = this.getMemoryMetrics();
      this.metricsHistory.push(metrics);

      // Keep only recent metrics
      if (this.metricsHistory.length > 120) {
        // 2 minutes at 1s intervals
        this.metricsHistory.shift();
      }

      // Auto-optimize if needed
      this.optimizeMemory();
    }, 1000);
  }

  /**
   * Get current memory usage
   */
  private getCurrentMemoryUsage(): number {
    if ('memory' in performance && (performance as any).memory) {
      return (performance as any).memory.usedJSHeapSize || 0;
    }
    return 0;
  }

  /**
   * Get total heap size
   */
  private getTotalHeapSize(): number {
    if ('memory' in performance && (performance as any).memory) {
      return (performance as any).memory.totalJSHeapSize || 0;
    }
    return 0;
  }

  dispose(): void {
    // Stop monitoring
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
    }

    // Clear all pools
    this.pools.forEach(pool => pool.clear());
    this.pools.clear();

    // Clear existing caches
    this.historyStack = [];
    this.currentHistoryMemory = 0;
    this.layerDataCache = new WeakMap();
    this.metricsHistory = [];
  }
}

export const memoryOptimizer = new MemoryOptimizer();

export const createMemoryEfficientUpdate = <T>(
  data: T,
  updates: Partial<T>
): T => {
  const result = { ...data, ...updates };

  memoryOptimizer.scheduleGarbageCollection();

  return result;
};

export const batchUpdates = <T>(
  data: T[],
  updateFn: (item: T, index: number) => T
): T[] => {
  const updated = data.map(updateFn);

  memoryOptimizer.scheduleGarbageCollection();

  return updated;
};
