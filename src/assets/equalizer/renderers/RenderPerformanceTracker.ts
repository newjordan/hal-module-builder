/**
 * RenderPerformanceTracker - Performance tracking and metrics
 * Extracted from VisualizationRenderer for better modularity
 */

export interface RenderPerformanceMetrics {
  frameRate: number;
  renderTime: number;
  averageRenderTime: number;
  memoryUsage: number;
  queueLength: number;
}

export class RenderPerformanceTracker {
  private frameStartTime: number = 0;
  private frameCount: number = 0;
  private renderTimes: number[] = [];
  private lastFrameRate: number = 60;

  /**
   * Start performance tracking for a frame
   */
  startFrame(): void {
    this.frameStartTime = performance.now();
  }

  /**
   * Calculate performance metrics
   */
  calculateMetrics(): RenderPerformanceMetrics {
    const renderTime = performance.now() - this.frameStartTime;
    this.renderTimes.push(renderTime);

    // Keep only recent render times for rolling average
    if (this.renderTimes.length > 60) {
      this.renderTimes.shift();
    }

    this.frameCount++;

    // Calculate frame rate every 60 frames
    if (this.frameCount % 60 === 0) {
      this.lastFrameRate = 1000 / this.getAverageRenderTime();
    }

    return {
      frameRate: this.lastFrameRate,
      renderTime,
      averageRenderTime: this.getAverageRenderTime(),
      memoryUsage: this.getMemoryUsage(),
      queueLength: 0, // Not implemented in this version
    };
  }

  /**
   * Get current metrics without updating frame data
   */
  getMetrics(): RenderPerformanceMetrics {
    return {
      frameRate: this.lastFrameRate,
      renderTime: this.renderTimes[this.renderTimes.length - 1] || 0,
      averageRenderTime: this.getAverageRenderTime(),
      memoryUsage: this.getMemoryUsage(),
      queueLength: 0,
    };
  }

  /**
   * Get average render time from recent frames
   */
  getAverageRenderTime(): number {
    if (this.renderTimes.length === 0) return 0;
    const sum = this.renderTimes.reduce((a, b) => a + b, 0);
    return sum / this.renderTimes.length;
  }

  /**
   * Estimate memory usage
   */
  private getMemoryUsage(): number {
    if ('memory' in performance) {
      return (performance as any).memory.usedJSHeapSize / 1024 / 1024; // MB
    }
    return 0; // Not available in all browsers
  }

  /**
   * Create empty metrics for error cases
   */
  createEmptyMetrics(): RenderPerformanceMetrics {
    return {
      frameRate: 0,
      renderTime: 0,
      averageRenderTime: 0,
      memoryUsage: 0,
      queueLength: 0,
    };
  }

  /**
   * Reset performance tracking
   */
  reset(): void {
    this.renderTimes = [];
    this.frameCount = 0;
    this.lastFrameRate = 60;
  }
}
