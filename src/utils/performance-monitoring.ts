export interface PerformanceMetrics {
  fps: number;
  frameTime: number;
  renderTime: number;
  layerCount: number;
  activeAnimations: number;
  memoryUsage: number;
  lastFrameTime: number;
  averageFrameTime: number;
}

export interface PerformanceConfig {
  fpsUpdateInterval: number;
  frameHistorySize: number;
  memoryCheckInterval: number;
}

class PerformanceMonitor {
  private frameHistory: number[] = [];
  private lastFrameTimestamp = performance.now();
  private animationId: number | null = null;
  private config: PerformanceConfig;
  private onMetricsUpdate: ((metrics: PerformanceMetrics) => void) | null;
  private layerCount = 0;
  private activeAnimations = 0;
  private lastFpsUpdate = 0;
  private operationTimings: Map<string, number[]> = new Map();

  constructor(
    onMetricsUpdate?: (metrics: PerformanceMetrics) => void,
    config: Partial<PerformanceConfig> = {}
  ) {
    this.config = {
      fpsUpdateInterval: 1000,
      frameHistorySize: 60,
      memoryCheckInterval: 2000,
      ...config,
    };
    this.onMetricsUpdate = onMetricsUpdate || null;
  }

  start(): void {
    if (this.animationId !== null) return;
    this.lastFrameTimestamp = performance.now();
    this.scheduleFrame();
  }

  stop(): void {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  isRunning(): boolean {
    return this.animationId !== null;
  }

  updateLayerCount(count: number): void {
    this.layerCount = count;
  }

  updateActiveAnimations(count: number): void {
    this.activeAnimations = count;
  }

  measureOperation<T>(operationName: string, operation: () => T): T {
    const startTime = performance.now();
    const result = operation();
    const endTime = performance.now();
    const duration = endTime - startTime;

    if (!this.operationTimings.has(operationName)) {
      this.operationTimings.set(operationName, []);
    }

    const timings = this.operationTimings.get(operationName)!;
    timings.push(duration);

    if (timings.length > 100) {
      timings.shift();
    }

    return result;
  }

  async measureAsyncOperation<T>(
    operationName: string,
    operation: () => Promise<T>
  ): Promise<T> {
    const startTime = performance.now();
    const result = await operation();
    const endTime = performance.now();
    const duration = endTime - startTime;

    if (!this.operationTimings.has(operationName)) {
      this.operationTimings.set(operationName, []);
    }

    const timings = this.operationTimings.get(operationName)!;
    timings.push(duration);

    if (timings.length > 100) {
      timings.shift();
    }

    return result;
  }

  getOperationAverageTime(operationName: string): number {
    const timings = this.operationTimings.get(operationName);
    if (!timings || timings.length === 0) return 0;

    return timings.reduce((sum, time) => sum + time, 0) / timings.length;
  }

  private scheduleFrame = (): void => {
    this.animationId = requestAnimationFrame(this.onFrame);
  };

  private onFrame = (timestamp: number): void => {
    const frameTime = timestamp - this.lastFrameTimestamp;
    this.lastFrameTimestamp = timestamp;

    this.frameHistory.push(frameTime);
    if (this.frameHistory.length > this.config.frameHistorySize) {
      this.frameHistory.shift();
    }

    const now = performance.now();
    if (now - this.lastFpsUpdate >= this.config.fpsUpdateInterval) {
      this.updateMetrics();
      this.lastFpsUpdate = now;
    }

    this.scheduleFrame();
  };

  private updateMetrics(): void {
    const averageFrameTime = this.getAverageFrameTime();
    const lastFrameTime = this.frameHistory[this.frameHistory.length - 1] || 0;

    const metrics: PerformanceMetrics = {
      fps: this.calculateFPS(),
      frameTime: lastFrameTime,
      renderTime: lastFrameTime,
      layerCount: this.layerCount,
      activeAnimations: this.activeAnimations,
      memoryUsage: this.getMemoryUsage(),
      lastFrameTime: lastFrameTime,
      averageFrameTime: averageFrameTime,
    };

    if (this.onMetricsUpdate) {
      this.onMetricsUpdate(metrics);
    }
  }

  private calculateFPS(): number {
    if (this.frameHistory.length < 2) return 0;

    const averageFrameTime = this.getAverageFrameTime();
    return averageFrameTime > 0 ? Math.round(1000 / averageFrameTime) : 0;
  }

  private getAverageFrameTime(): number {
    if (this.frameHistory.length === 0) return 0;

    const sum = this.frameHistory.reduce((acc, time) => acc + time, 0);
    return sum / this.frameHistory.length;
  }

  private getMemoryUsage(): number {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      if (memory && typeof memory.usedJSHeapSize === 'number') {
        return Math.round(memory.usedJSHeapSize / 1024 / 1024);
      }
    }

    return this.estimateMemoryUsage();
  }

  private estimateMemoryUsage(): number {
    const baseMemory = 20;
    const layerMemory = this.layerCount * 0.5;
    const animationMemory = this.activeAnimations * 2;

    return Math.round(baseMemory + layerMemory + animationMemory);
  }

  getMetrics(): PerformanceMetrics {
    const averageFrameTime = this.getAverageFrameTime();
    const lastFrameTime =
      this.frameHistory[this.frameHistory.length - 1] || 16.67;

    return {
      fps: this.calculateFPS(),
      frameTime: lastFrameTime,
      renderTime: lastFrameTime,
      layerCount: this.layerCount,
      activeAnimations: this.activeAnimations,
      memoryUsage: this.getMemoryUsage(),
      lastFrameTime: lastFrameTime,
      averageFrameTime: averageFrameTime,
    };
  }
}

export const createPerformanceMonitor = (
  onMetricsUpdate?: (metrics: PerformanceMetrics) => void,
  config?: Partial<PerformanceConfig>
): PerformanceMonitor => {
  return new PerformanceMonitor(onMetricsUpdate, config);
};

export const formatMemoryUsage = (megabytes: number): string => {
  return `${megabytes.toFixed(1)} MB`;
};

export const formatFPS = (fps: number): string => {
  return `${fps} FPS`;
};

export const getPerformanceStatus = (
  metrics: PerformanceMetrics
): 'good' | 'warning' | 'critical' => {
  if (metrics.fps < 30 || metrics.memoryUsage > 80) return 'critical';
  if (metrics.fps < 50 || metrics.memoryUsage > 60) return 'warning';
  return 'good';
};

export const performanceMonitor = new PerformanceMonitor();
