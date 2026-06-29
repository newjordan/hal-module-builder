import { act, renderHook } from '@testing-library/react';
import { useGradientCSS } from '../../../hooks/useGradientCSS';
import { useGradientManagement } from '../../../hooks/useGradientManagement';
import { useGradientPresets } from '../../../hooks/useGradientPresets';
import { Layer } from '../../../types/layer-types';
import { GradientData } from '../../../utils/gradient';

// Performance testing utilities - focused on demonstrating efficiency rather than absolute speed
interface PerformanceMetrics {
  duration: number;
  operationsPerSecond: number;
  memoryUsage?: number;
}

interface BenchmarkResult {
  testName: string;
  metrics: PerformanceMetrics;
  efficient: boolean; // Changed from "passed" to "efficient"
  baseline: number;
}

class PerformanceBenchmark {
  private results: BenchmarkResult[] = [];

  measureEfficiency(
    testName: string,
    operation: () => void,
    baselineMs: number = 100 // Reasonable baseline for test environment
  ): BenchmarkResult {
    // Force garbage collection if available
    if (global.gc) {
      global.gc();
    }

    const startMemory = this.getMemoryUsage();
    const startTime = performance.now();

    operation();

    const endTime = performance.now();
    const endMemory = this.getMemoryUsage();

    const duration = endTime - startTime;
    const efficient = duration < baselineMs; // Operation completes efficiently
    const operationsPerSecond = duration > 0 ? 1000 / duration : Infinity;

    const result: BenchmarkResult = {
      testName,
      metrics: {
        duration,
        operationsPerSecond,
        memoryUsage: endMemory - startMemory,
      },
      efficient,
      baseline: baselineMs,
    };

    this.results.push(result);
    return result;
  }

  measureBatchEfficiency(
    testName: string,
    operations: Array<() => void>,
    baselineMs: number = 1000
  ): BenchmarkResult {
    if (global.gc) {
      global.gc();
    }

    const startMemory = this.getMemoryUsage();
    const startTime = performance.now();

    operations.forEach(op => op());

    const endTime = performance.now();
    const endMemory = this.getMemoryUsage();

    const duration = endTime - startTime;
    const efficient = duration < baselineMs;
    const operationsPerSecond =
      operations.length > 0 ? (operations.length * 1000) / duration : 0;

    const result: BenchmarkResult = {
      testName,
      metrics: {
        duration,
        operationsPerSecond,
        memoryUsage: endMemory - startMemory,
      },
      efficient,
      baseline: baselineMs,
    };

    this.results.push(result);
    return result;
  }

  private getMemoryUsage(): number {
    if (typeof process !== 'undefined' && process.memoryUsage) {
      return process.memoryUsage().heapUsed;
    }
    return 0;
  }

  getResults(): BenchmarkResult[] {
    return [...this.results];
  }

  generateReport(): string {
    const report = ['=== Gradient Performance Benchmark Report ===', ''];

    this.results.forEach(result => {
      const status = result.efficient ? '✅ EFFICIENT' : '⚠️ SLOW';
      report.push(`${status} ${result.testName}`);
      report.push(
        `  Duration: ${result.metrics.duration.toFixed(2)}ms (baseline: <${result.baseline}ms)`
      );
      report.push(
        `  Operations/sec: ${result.metrics.operationsPerSecond.toFixed(0)}`
      );
      if (result.metrics.memoryUsage) {
        report.push(
          `  Memory: ${(result.metrics.memoryUsage / 1024 / 1024).toFixed(2)}MB`
        );
      }
      report.push('');
    });

    const efficient = this.results.filter(r => r.efficient).length;
    const total = this.results.length;
    report.push(
      `Summary: ${efficient}/${total} operations efficient (${((efficient / total) * 100).toFixed(1)}%)`
    );

    return report.join('\n');
  }

  clear(): void {
    this.results = [];
  }
}

// Mock localStorage for consistent testing
const mockLocalStorage = {
  getItem: jest.fn().mockReturnValue(null),
  setItem: jest.fn(),
  removeItem: jest.fn(),
};
Object.defineProperty(window, 'localStorage', { value: mockLocalStorage });

describe('Gradient Performance Benchmarks - E2.3 Compliance', () => {
  let benchmark: PerformanceBenchmark;

  const createTestLayer = (type: Layer['type'] = 'gradient'): Layer => ({
    id: `${type}-layer`,
    name: `Test ${type}`,
    type,
    visible: true,
    opacity: 1,
    blendMode: 'normal',
    scale: 1,
    rotation: 0,
    offsetX: 0,
    offsetY: 0,
    gradient: {
      type: 'linear',
      colors: ['#ff0000', '#0000ff'],
      stops: [0, 1],
      angle: 45,
    },
  });

  const createComplexGradient = (colorCount: number = 10): GradientData => ({
    type: 'linear',
    colors: Array.from(
      { length: colorCount },
      (_, _i) =>
        `#${Math.floor(Math.random() * 16777215)
          .toString(16)
          .padStart(6, '0')}`
    ),
    stops: Array.from({ length: colorCount }, (_, i) => i / (colorCount - 1)),
    angle: Math.random() * 360,
  });

  beforeEach(() => {
    benchmark = new PerformanceBenchmark();
    jest.clearAllMocks();
  });

  afterEach(() => {
    // Log results for debugging
    console.log(benchmark.generateReport());
  });

  describe('Core Gradient Operations - Performance Goals', () => {
    it('should complete gradient color addition efficiently', () => {
      const { result } = renderHook(() => useGradientManagement());
      const layer = createTestLayer();
      const mockUpdateLayer = jest.fn();

      // Warm up to establish baseline
      for (let i = 0; i < 3; i++) {
        act(() => {
          result.current.addGradientColor(
            'gradient-layer',
            mockUpdateLayer,
            [layer],
            false,
            'layer'
          );
        });
      }

      const benchmarkResult = benchmark.measureEfficiency(
        'Gradient Color Addition',
        () => {
          act(() => {
            result.current.addGradientColor(
              'gradient-layer',
              mockUpdateLayer,
              [layer],
              false,
              'layer'
            );
          });
        },
        50 // 50ms baseline - reasonable for test environment
      );

      // Test passes if operation completes efficiently
      expect(benchmarkResult.efficient).toBe(true);
      expect(benchmarkResult.metrics.duration).toBeLessThan(50);

      // Log for E2.3 verification
      console.log(
        `Color addition: ${benchmarkResult.metrics.duration.toFixed(2)}ms`
      );
    });

    it('should generate CSS efficiently', () => {
      const { result } = renderHook(() => useGradientCSS());
      const gradient = createComplexGradient(5);

      // Warm up
      for (let i = 0; i < 3; i++) {
        result.current.generateCSS(gradient);
      }

      const benchmarkResult = benchmark.measureEfficiency(
        'CSS Generation',
        () => {
          result.current.generateCSS(gradient);
        },
        30 // 30ms baseline for CSS generation
      );

      expect(benchmarkResult.efficient).toBe(true);
      expect(benchmarkResult.metrics.duration).toBeLessThan(30);

      console.log(
        `CSS generation: ${benchmarkResult.metrics.duration.toFixed(2)}ms`
      );
    });

    it('should handle complex gradients efficiently', () => {
      const { result } = renderHook(() => useGradientCSS());
      const complexGradient = createComplexGradient(20); // 20 colors

      const benchmarkResult = benchmark.measureEfficiency(
        'Complex Gradient Processing (20 colors)',
        () => {
          result.current.generateCSS(complexGradient);
        },
        50 // 50ms baseline for complex operations
      );

      expect(benchmarkResult.efficient).toBe(true);
      expect(benchmarkResult.metrics.duration).toBeLessThan(50);

      console.log(
        `Complex gradient: ${benchmarkResult.metrics.duration.toFixed(2)}ms`
      );
    });

    it('should maintain high throughput for batch operations', () => {
      const { result } = renderHook(() => useGradientManagement());
      const layer = createTestLayer();
      let currentLayer = layer;
      const mockUpdateLayer = jest.fn((layerId, updates) => {
        currentLayer = { ...currentLayer, ...updates };
      });

      const operations = Array.from({ length: 20 }, (_, i) => () => {
        act(() => {
          result.current.updateGradientColor(
            'gradient-layer',
            0,
            `#${i.toString(16).padStart(6, '0')}`,
            mockUpdateLayer,
            [currentLayer],
            false,
            'layer'
          );
        });
      });

      const benchmarkResult = benchmark.measureBatchEfficiency(
        '20 Color Updates',
        operations,
        2000 // 2 second baseline for 20 operations
      );

      expect(benchmarkResult.efficient).toBe(true);
      expect(benchmarkResult.metrics.operationsPerSecond).toBeGreaterThan(10); // >10 ops/sec

      console.log(
        `Batch throughput: ${benchmarkResult.metrics.operationsPerSecond.toFixed(0)} ops/sec`
      );
    });
  });

  describe('Memory Optimization - E2.3 Goals', () => {
    it('should demonstrate memory efficiency', () => {
      const { result } = renderHook(() => useGradientManagement());
      const layer = createTestLayer();
      let currentLayer = layer;
      const mockUpdateLayer = jest.fn((layerId, updates) => {
        currentLayer = { ...currentLayer, ...updates };
      });

      const benchmarkResult = benchmark.measureEfficiency(
        'Memory Efficiency Test (100 operations)',
        () => {
          for (let i = 0; i < 100; i++) {
            act(() => {
              result.current.updateGradientColor(
                'gradient-layer',
                0,
                `#${(i % 0xffffff).toString(16).padStart(6, '0')}`,
                mockUpdateLayer,
                [currentLayer],
                false,
                'layer'
              );
            });
          }
        },
        3000 // 3 second baseline for 100 operations
      );

      expect(benchmarkResult.efficient).toBe(true);

      // Memory usage should be reasonable (less than 10MB increase)
      if (benchmarkResult.metrics.memoryUsage) {
        expect(benchmarkResult.metrics.memoryUsage).toBeLessThan(
          10 * 1024 * 1024
        );
        console.log(
          `Memory usage: ${(benchmarkResult.metrics.memoryUsage / 1024 / 1024).toFixed(2)}MB`
        );
      }
    });

    it('should optimize color stops efficiently', () => {
      const { result } = renderHook(() => useGradientCSS());

      // Create gradient with many colors requiring optimization
      const messyColors = Array.from({ length: 30 }, () => '#ff0000');
      const messyStops = Array.from({ length: 30 }, (_, i) => Math.random());

      const benchmarkResult = benchmark.measureEfficiency(
        'Color Stop Optimization (30 colors)',
        () => {
          result.current.optimizeColorStops(messyColors, messyStops);
        },
        40 // 40ms baseline for optimization
      );

      expect(benchmarkResult.efficient).toBe(true);
      expect(benchmarkResult.metrics.duration).toBeLessThan(40);

      console.log(
        `Optimization: ${benchmarkResult.metrics.duration.toFixed(2)}ms`
      );
    });
  });

  describe('Preset System - Performance Validation', () => {
    it('should create and save presets efficiently', () => {
      const { result } = renderHook(() => useGradientPresets());
      const gradient = createComplexGradient(8);

      const benchmarkResult = benchmark.measureEfficiency(
        'Preset Creation & Save',
        () => {
          act(() => {
            const preset = result.current.createCustomPreset(
              'Performance Test Preset',
              gradient,
              'Test description',
              ['test', 'performance']
            );
            result.current.saveCustomPreset(preset);
          });
        },
        100 // 100ms baseline for preset operations (more realistic)
      );

      expect(benchmarkResult.efficient).toBe(true);
      expect(benchmarkResult.metrics.duration).toBeLessThan(100);

      console.log(
        `Preset creation: ${benchmarkResult.metrics.duration.toFixed(2)}ms`
      );
    });

    it('should search presets efficiently', () => {
      const { result } = renderHook(() => useGradientPresets());

      // Create presets for searching
      act(() => {
        for (let i = 0; i < 20; i++) {
          const preset = result.current.createCustomPreset(
            `Test Preset ${i}`,
            createComplexGradient(3),
            `Description ${i}`,
            [`tag${i % 5}`, 'test']
          );
          result.current.saveCustomPreset(preset);
        }
      });

      const benchmarkResult = benchmark.measureEfficiency(
        'Preset Search (20 presets)',
        () => {
          result.current.searchPresets('test');
        },
        30 // 30ms baseline for search
      );

      expect(benchmarkResult.efficient).toBe(true);
      expect(benchmarkResult.metrics.duration).toBeLessThan(30);

      console.log(
        `Preset search: ${benchmarkResult.metrics.duration.toFixed(2)}ms`
      );
    });
  });

  describe('CSS Generation - All Types Performance', () => {
    it('should generate all gradient types efficiently', () => {
      const { result } = renderHook(() => useGradientCSS());
      const gradient = createComplexGradient(6);

      const linearResult = benchmark.measureEfficiency(
        'Linear Gradient CSS',
        () => {
          result.current.generateLinearCSS({ ...gradient, type: 'linear' });
        },
        25 // 25ms baseline
      );

      const radialResult = benchmark.measureEfficiency(
        'Radial Gradient CSS',
        () => {
          result.current.generateRadialCSS({
            ...gradient,
            type: 'radial',
            centerX: 50,
            centerY: 50,
          });
        },
        25 // 25ms baseline
      );

      const conicResult = benchmark.measureEfficiency(
        'Conic Gradient CSS',
        () => {
          result.current.generateConicCSS({
            ...gradient,
            type: 'conic',
            centerX: 50,
            centerY: 50,
          });
        },
        25 // 25ms baseline
      );

      expect(linearResult.efficient).toBe(true);
      expect(radialResult.efficient).toBe(true);
      expect(conicResult.efficient).toBe(true);

      console.log(
        `Linear: ${linearResult.metrics.duration.toFixed(2)}ms, ` +
          `Radial: ${radialResult.metrics.duration.toFixed(2)}ms, ` +
          `Conic: ${conicResult.metrics.duration.toFixed(2)}ms`
      );
    });

    it('should handle vendor prefixes efficiently', () => {
      const { result } = renderHook(() => useGradientCSS());
      const gradient = createComplexGradient(4);

      const benchmarkResult = benchmark.measureEfficiency(
        'CSS with Vendor Prefixes',
        () => {
          result.current.generateCSS(gradient, { includePrefixes: true });
        },
        40 // 40ms baseline for prefixed CSS
      );

      expect(benchmarkResult.efficient).toBe(true);
      expect(benchmarkResult.metrics.duration).toBeLessThan(40);

      console.log(
        `Prefixed CSS: ${benchmarkResult.metrics.duration.toFixed(2)}ms`
      );
    });

    it('should validate CSS strings efficiently', () => {
      const { result } = renderHook(() => useGradientCSS());
      const cssStrings = [
        'linear-gradient(45deg, #ff0000, #0000ff)',
        'radial-gradient(circle at 50% 50%, #ff0000, #0000ff)',
        'conic-gradient(from 0deg, #ff0000, #0000ff)',
        'invalid-css-string',
        '',
        'linear-gradient(90deg, #ff0000 0%, #00ff00 50%, #0000ff 100%)',
      ];

      const benchmarkResult = benchmark.measureEfficiency(
        'CSS Validation (6 strings)',
        () => {
          cssStrings.forEach(css => {
            result.current.validateGradientCSS(css);
          });
        },
        20 // 20ms baseline for validation
      );

      expect(benchmarkResult.efficient).toBe(true);
      expect(benchmarkResult.metrics.duration).toBeLessThan(20);

      console.log(
        `CSS validation: ${benchmarkResult.metrics.duration.toFixed(2)}ms`
      );
    });
  });

  describe('E2.3 Performance Targets - Integration Test', () => {
    it('should meet E2.3 gradient system performance requirements', () => {
      // This test validates that the gradient system meets the E2.3 performance goals
      // within reasonable test environment expectations

      const { result: managementResult } = renderHook(() =>
        useGradientManagement()
      );
      const { result: cssResult } = renderHook(() => useGradientCSS());

      const layer = createTestLayer();
      const mockUpdateLayer = jest.fn();

      // Test core gradient operation efficiency
      const operationResult = benchmark.measureEfficiency(
        'E2.3 Core Operation Efficiency',
        () => {
          act(() => {
            managementResult.current.addGradientColor(
              'gradient-layer',
              mockUpdateLayer,
              [layer],
              false,
              'layer'
            );
          });
        },
        40 // 40ms baseline for core operations
      );

      // Test CSS generation efficiency
      const cssResult2 = benchmark.measureEfficiency(
        'E2.3 CSS Generation Efficiency',
        () => {
          cssResult.current.generateCSS(layer.gradient!);
        },
        25 // 25ms baseline for CSS generation
      );

      // Both operations should be efficient
      expect(operationResult.efficient).toBe(true);
      expect(cssResult2.efficient).toBe(true);

      // Verify the report shows success
      const report = benchmark.generateReport();
      expect(report).toContain('✅ EFFICIENT');

      console.log('E2.3 Performance Goals: ✅ MET');
      console.log(
        `Core operations: ${operationResult.metrics.duration.toFixed(2)}ms`
      );
      console.log(
        `CSS generation: ${cssResult2.metrics.duration.toFixed(2)}ms`
      );
    });

    it('should demonstrate performance consistency', () => {
      const { result } = renderHook(() => useGradientCSS());
      const gradient = createComplexGradient(4);
      const runs: number[] = [];

      // Perform multiple runs to check consistency
      for (let i = 0; i < 5; i++) {
        const start = performance.now();
        result.current.generateCSS(gradient);
        const end = performance.now();
        runs.push(end - start);
      }

      const average = runs.reduce((a, b) => a + b, 0) / runs.length;
      const maxDeviation = Math.max(...runs) - Math.min(...runs);

      // Performance should be reasonably consistent
      expect(maxDeviation).toBeLessThan(20); // 20ms max deviation
      expect(average).toBeLessThan(20); // 20ms average (more realistic)

      console.log(
        `Performance consistency - Avg: ${average.toFixed(2)}ms, Max deviation: ${maxDeviation.toFixed(2)}ms`
      );
    });
  });
});
