// Performance benchmarking utilities for refactoring safety

export interface BenchmarkResult {
  name: string;
  duration: number;
  iterations: number;
  avgTime: number;
  minTime: number;
  maxTime: number;
  timestamp: number;
}

export interface BenchmarkSuite {
  name: string;
  results: BenchmarkResult[];
  baseline?: BenchmarkResult[];
}

class PerformanceBenchmark {
  private results: BenchmarkResult[] = [];
  private baselines = new Map<string, BenchmarkResult>();

  async benchmark(
    name: string,
    fn: () => void | Promise<void>,
    iterations = 100
  ): Promise<BenchmarkResult> {
    const times: number[] = [];

    // Warm up
    for (let i = 0; i < 5; i++) {
      await fn();
    }

    // Actual benchmark
    for (let i = 0; i < iterations; i++) {
      const start = performance.now();
      await fn();
      const end = performance.now();
      times.push(end - start);
    }

    const totalTime = times.reduce((sum, time) => sum + time, 0);
    const avgTime = totalTime / iterations;
    const minTime = Math.min(...times);
    const maxTime = Math.max(...times);

    const result: BenchmarkResult = {
      name,
      duration: totalTime,
      iterations,
      avgTime,
      minTime,
      maxTime,
      timestamp: Date.now(),
    };

    this.results.push(result);
    return result;
  }

  setBaseline(name: string, result: BenchmarkResult): void {
    this.baselines.set(name, result);
  }

  getBaseline(name: string): BenchmarkResult | undefined {
    return this.baselines.get(name);
  }

  compareToBaseline(
    name: string,
    current: BenchmarkResult
  ): {
    improvement: number;
    regression: boolean;
    ratio: number;
  } | null {
    const baseline = this.baselines.get(name);
    if (!baseline) return null;

    const ratio = current.avgTime / baseline.avgTime;
    const improvement =
      ((baseline.avgTime - current.avgTime) / baseline.avgTime) * 100;

    return {
      improvement,
      regression: current.avgTime > baseline.avgTime,
      ratio,
    };
  }

  generateReport(): string {
    if (this.results.length === 0) {
      return 'No benchmark results available.';
    }

    let report = '# Performance Benchmark Report\n\n';
    report += `Generated: ${new Date().toISOString()}\n\n`;

    this.results.forEach(result => {
      report += `## ${result.name}\n`;
      report += `- Iterations: ${result.iterations}\n`;
      report += `- Average Time: ${result.avgTime.toFixed(2)}ms\n`;
      report += `- Min Time: ${result.minTime.toFixed(2)}ms\n`;
      report += `- Max Time: ${result.maxTime.toFixed(2)}ms\n`;
      report += `- Total Duration: ${result.duration.toFixed(2)}ms\n`;

      const comparison = this.compareToBaseline(result.name, result);
      if (comparison) {
        report += `- Baseline Comparison: ${comparison.improvement > 0 ? 'IMPROVED' : 'REGRESSED'} by ${Math.abs(comparison.improvement).toFixed(1)}%\n`;
        report += `- Performance Ratio: ${comparison.ratio.toFixed(2)}x\n`;
      }

      report += '\n';
    });

    return report;
  }

  exportResults(): BenchmarkSuite {
    return {
      name: 'HAL Module Builder Benchmarks',
      results: [...this.results],
      baseline: Array.from(this.baselines.values()),
    };
  }

  clear(): void {
    this.results = [];
  }
}

// Singleton instance
export const performanceBenchmark = new PerformanceBenchmark();

// Common benchmark functions for HAL Module Builder
export const commonBenchmarks = {
  // Layer rendering benchmark
  layerRendering: async (
    layers: any[],
    canvas: HTMLCanvasElement
  ): Promise<BenchmarkResult> => {
    return performanceBenchmark.benchmark(
      'Layer Rendering',
      async () => {
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Simulate layer rendering
        layers.forEach((layer, index) => {
          ctx.fillStyle = layer.color || '#000000';
          ctx.fillRect(
            layer.offsetX || index * 10,
            layer.offsetY || index * 10,
            50,
            50
          );
        });
      },
      50
    );
  },

  // Component rendering benchmark
  componentRendering: async (
    renderFn: () => void
  ): Promise<BenchmarkResult> => {
    return performanceBenchmark.benchmark('Component Rendering', renderFn, 20);
  },

  // State update benchmark
  stateUpdate: async (updateFn: () => void): Promise<BenchmarkResult> => {
    return performanceBenchmark.benchmark('State Update', updateFn, 100);
  },

  // Audio processing benchmark
  audioProcessing: async (
    audioData: Float32Array,
    processFn: (data: Float32Array) => void
  ): Promise<BenchmarkResult> => {
    return performanceBenchmark.benchmark(
      'Audio Processing',
      () => processFn(audioData),
      200
    );
  },

  // Template serialization benchmark
  templateSerialization: async (template: any): Promise<BenchmarkResult> => {
    return performanceBenchmark.benchmark(
      'Template Serialization',
      () => {
        JSON.stringify(template);
        JSON.parse(JSON.stringify(template));
      },
      500
    );
  },
};

// Performance regression detection
export const detectPerformanceRegression = (
  current: BenchmarkResult,
  baseline: BenchmarkResult,
  threshold = 0.2 // 20% regression threshold
): boolean => {
  const regression = (current.avgTime - baseline.avgTime) / baseline.avgTime;
  return regression > threshold;
};

// Memory usage tracking
export const trackMemoryUsage = (): {
  start: () => void;
  measure: () => number | null;
} => {
  let startMemory: number | null = null;

  return {
    start: () => {
      if (typeof performance !== 'undefined' && 'memory' in performance) {
        const perfMemory = performance as any;
        startMemory = perfMemory.memory.usedJSHeapSize;
      }
    },
    measure: (): number | null => {
      if (
        startMemory !== null &&
        typeof performance !== 'undefined' &&
        'memory' in performance
      ) {
        const perfMemory = performance as any;
        return perfMemory.memory.usedJSHeapSize - startMemory;
      }
      return null;
    },
  };
};

// FPS monitoring
export const createFPSMonitor = (): {
  start: () => void;
  stop: () => number;
} => {
  let frameCount = 0;
  let startTime = 0;
  let rafId: number | null = null;

  const frame = (): void => {
    frameCount++;
    rafId = requestAnimationFrame(frame);
  };

  return {
    start: () => {
      frameCount = 0;
      startTime = performance.now();
      rafId = requestAnimationFrame(frame);
    },
    stop: (): number => {
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
      }
      const endTime = performance.now();
      const duration = (endTime - startTime) / 1000;
      return frameCount / duration;
    },
  };
};
