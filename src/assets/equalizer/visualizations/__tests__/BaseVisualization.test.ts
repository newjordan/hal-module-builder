/**
 * BaseVisualization Tests
 * Part of Epic E6.2 - Visualization Types Testing
 */

import {
  BaseVisualization,
  VisualizationConfig,
  RenderContext,
  FrequencyData,
  ValidationResult,
} from '../BaseVisualization';
import { AudioProcessor } from '../../AudioProcessor';

// Test implementation of BaseVisualization for testing abstract class
class TestVisualization extends BaseVisualization {
  readonly type = 'test';
  readonly metadata = {
    name: 'Test Visualization',
    description: 'Test implementation for testing BaseVisualization',
    author: 'Test Suite',
    version: '1.0.0',
  };

  render(
    context: RenderContext,
    frequencyData: FrequencyData,
    config: VisualizationConfig
  ): void {
    // Simple test implementation
    const ctx = context.ctx as CanvasRenderingContext2D;
    ctx.fillStyle = config.primaryColor;
    ctx.fillRect(0, 0, config.barWidth, config.maxHeight);
  }

  getDefaultConfig(): VisualizationConfig {
    return {
      barCount: 32,
      barWidth: 10,
      barSpacing: 2,
      maxHeight: 200,
      responseSpeed: 0.8,
      colorMode: 'solid',
      primaryColor: '#00ff00',
      glowIntensity: 0.3,
      pulseMode: 'none',
      rotation: 0,
      scale: 1,
      offsetX: 0,
      offsetY: 0,
    };
  }

  validateConfig(config: VisualizationConfig): ValidationResult {
    const errors: string[] = [];

    if (config.barCount <= 0) errors.push('barCount must be positive');
    if (config.barWidth <= 0) errors.push('barWidth must be positive');
    if (config.maxHeight <= 0) errors.push('maxHeight must be positive');

    return {
      valid: errors.length === 0,
      ...(errors.length > 0 && { errors }),
    };
  }

  getAnimatableProperties(): string[] {
    return ['barWidth', 'maxHeight', 'rotation', 'scale'];
  }

  exportState(): Record<string, any> {
    return {
      previousValues: [...this.previousValues],
      peakValues: [...this.peakValues],
      peakTimers: [...this.peakTimers],
    };
  }

  importState(state: Record<string, any>): void {
    if (state.previousValues) this.previousValues = [...state.previousValues];
    if (state.peakValues) this.peakValues = [...state.peakValues];
    if (state.peakTimers) this.peakTimers = [...state.peakTimers];
  }
}

describe('BaseVisualization', () => {
  let visualization: TestVisualization;
  let mockAudioProcessor: AudioProcessor;
  let mockContext: RenderContext;

  beforeEach(() => {
    mockAudioProcessor = new AudioProcessor();
    visualization = new TestVisualization(mockAudioProcessor);

    const mockCanvas = document.createElement('canvas');
    const mockCtx = mockCanvas.getContext('2d')!;

    mockContext = {
      ctx: mockCtx,
      width: 800,
      height: 600,
      centerX: 400,
      centerY: 300,
      time: 0,
      theme: 'frost_light',
    };
  });

  describe('Shared Utilities', () => {
    test('processFrequencyData normalizes data correctly', () => {
      const rawData = new Uint8Array([255, 128, 64, 0]);
      const config = visualization.getDefaultConfig();

      const result = (visualization as any).processFrequencyData(
        rawData,
        config
      );

      expect(result.normalized).toEqual([1, 128 / 255, 64 / 255, 0]);
      expect(result.raw).toEqual(rawData);
      expect(result.bands).toBeDefined();
      expect(result.peaks).toBeDefined();
    });

    test('mapToBands handles different band counts', () => {
      const data = [0.1, 0.2, 0.3, 0.4, 0.5, 0.6];

      // Map to fewer bands
      const result1 = (visualization as any).mapToBands(data, 3);
      expect(result1).toHaveLength(3);

      // Map to more bands
      const result2 = (visualization as any).mapToBands(data, 10);
      expect(result2).toHaveLength(10);

      // Map to same number of bands
      const result3 = (visualization as any).mapToBands(data, 6);
      expect(result3).toHaveLength(6);
    });

    test('applySmoothing provides temporal smoothing', () => {
      const config = {
        ...visualization.getDefaultConfig(),
        responseSpeed: 0.5,
      };
      const currentData = [1, 1, 1, 1];

      // First application
      const result1 = (visualization as any).applySmoothing(
        currentData,
        config
      );
      expect(result1[0]).toBe(0.5); // 0 * 0.5 + 1 * 0.5

      // Second application
      const result2 = (visualization as any).applySmoothing(
        currentData,
        config
      );
      expect(result2[0]).toBe(0.75); // 0.5 * 0.5 + 1 * 0.5
    });

    test('detectPeaks finds frequency peaks correctly', () => {
      const data = new Uint8Array([50, 100, 200, 150, 100, 180, 50]);
      const peaks = (visualization as any).detectPeaks(data, 100);

      // Should detect peaks at indices 2 and 5
      expect(peaks).toHaveLength(2);
      expect(peaks[0].index).toBe(2);
      expect(peaks[0].value).toBe(200);
      expect(peaks[1].index).toBe(5);
      expect(peaks[1].value).toBe(180);
    });
  });

  describe('Color Management', () => {
    test('getColor handles solid color mode', () => {
      const config = {
        ...visualization.getDefaultConfig(),
        colorMode: 'solid' as const,
        primaryColor: '#ff0000',
      };

      const color = (visualization as any).getColor(0, 0.5, 10, config);
      expect(color).toBe('#ff0000');
    });

    test('getColor handles gradient color mode', () => {
      const config = {
        ...visualization.getDefaultConfig(),
        colorMode: 'gradient' as const,
        primaryColor: '#ff0000',
        secondaryColor: '#0000ff',
      };

      const color = (visualization as any).getColor(5, 0.5, 10, config);
      expect(color).toMatch(/rgb\(\d+, \d+, \d+\)/);
    });

    test('getColor handles rainbow color mode', () => {
      const config = {
        ...visualization.getDefaultConfig(),
        colorMode: 'rainbow' as const,
      };

      const color = (visualization as any).getColor(5, 0.5, 10, config);
      expect(color).toMatch(/hsl\(\d+, 70%, 50%\)/);
    });

    test('getColor handles reactive color mode', () => {
      const config = {
        ...visualization.getDefaultConfig(),
        colorMode: 'reactive' as const,
        primaryColor: '#ff0000',
      };

      const color = (visualization as any).getColor(0, 0.8, 10, config);
      expect(color).toMatch(/rgba\(\d+, \d+, \d+, [\d.]+\)/);
    });
  });

  describe('Color Utilities', () => {
    test('hexToRgb converts hex colors correctly', () => {
      const result1 = (visualization as any).hexToRgb('#ff0000');
      expect(result1).toEqual({ r: 255, g: 0, b: 0 });

      const result2 = (visualization as any).hexToRgb('#00ff00');
      expect(result2).toEqual({ r: 0, g: 255, b: 0 });

      const result3 = (visualization as any).hexToRgb('invalid');
      expect(result3).toBeNull();
    });

    test('interpolateColor blends colors correctly', () => {
      const result = (visualization as any).interpolateColor(
        '#ff0000',
        '#0000ff',
        0.5
      );
      expect(result).toMatch(/rgb\(12[78], 0, 12[78]\)/); // Account for rounding differences
    });

    test('getGradientColor works with custom gradients', () => {
      const colors = ['#ff0000', '#00ff00', '#0000ff'];
      const stops = [0, 0.5, 1];

      const result1 = (visualization as any).getGradientColor(0, colors, stops);
      expect(result1).toBe('#ff0000');

      const result2 = (visualization as any).getGradientColor(1, colors, stops);
      expect(result2).toBe('#0000ff');

      const result3 = (visualization as any).getGradientColor(
        0.25,
        colors,
        stops
      );
      expect(result3).toMatch(/rgb\(\d+, \d+, \d+\)/);
    });
  });

  describe('State Management', () => {
    test('tracks previous values for smoothing', () => {
      const config = visualization.getDefaultConfig();
      const data1 = [0.5, 0.5, 0.5];
      const data2 = [1.0, 1.0, 1.0];

      // Apply smoothing with first dataset
      (visualization as any).applySmoothing(data1, config);

      // Apply smoothing with second dataset
      const result = (visualization as any).applySmoothing(data2, config);

      // Results should be smoothed between previous and current values
      expect(result[0]).toBeGreaterThan(0.5);
      expect(result[0]).toBeLessThan(1.0);
    });
  });

  describe('Abstract Interface', () => {
    test('implements required abstract methods', () => {
      expect(visualization.type).toBe('test');
      expect(visualization.metadata).toBeDefined();
      expect(typeof visualization.render).toBe('function');
      expect(typeof visualization.getDefaultConfig).toBe('function');
      expect(typeof visualization.validateConfig).toBe('function');
      expect(typeof visualization.getAnimatableProperties).toBe('function');
    });

    test('optional methods are implemented correctly', () => {
      expect(typeof visualization.exportState).toBe('function');
      expect(typeof visualization.importState).toBe('function');
    });
  });

  describe('Performance Characteristics', () => {
    test('shared utilities are efficient', () => {
      const largeData = new Array(1024).fill(0).map(() => Math.random());
      const config = visualization.getDefaultConfig();

      const startTime = performance.now();

      for (let i = 0; i < 100; i++) {
        (visualization as any).mapToBands(largeData, 64);
        (visualization as any).applySmoothing(largeData.slice(0, 64), config);
      }

      const endTime = performance.now();
      const avgTime = (endTime - startTime) / 100;

      // Utilities should be fast enough for real-time use
      expect(avgTime).toBeLessThan(1);
    });
  });
});
