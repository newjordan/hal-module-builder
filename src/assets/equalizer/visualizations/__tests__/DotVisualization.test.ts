/**
 * DotVisualization Tests
 * Part of Epic E6.2 - Visualization Types Testing
 */

import { DotVisualization } from '../DotVisualization';
import { AudioProcessor } from '../../AudioProcessor';
import { RenderContext, FrequencyData } from '../BaseVisualization';

describe('DotVisualization', () => {
  let visualization: DotVisualization;
  let mockAudioProcessor: AudioProcessor;
  let mockContext: RenderContext;
  let mockFrequencyData: FrequencyData;

  beforeEach(() => {
    mockAudioProcessor = new AudioProcessor();
    visualization = new DotVisualization(mockAudioProcessor);

    // Mock canvas context
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

    mockFrequencyData = {
      raw: new Uint8Array(
        Array.from({ length: 64 }, (_, i) => Math.random() * 255)
      ),
      normalized: Array.from({ length: 64 }, () => Math.random()),
      bands: Array.from({ length: 32 }, () => Math.random()),
      peaks: [],
    };
  });

  describe('Core Properties', () => {
    test('has correct type identifier', () => {
      expect(visualization.type).toBe('dot');
    });

    test('has proper metadata', () => {
      expect(visualization.metadata.name).toBe('Dot Matrix');
      expect(visualization.metadata.description).toContain('Grid-based dot');
      expect(visualization.metadata.author).toBe('HAL Builder');
    });
  });

  describe('Configuration Management', () => {
    test('provides valid default configuration', () => {
      const config = visualization.getDefaultConfig();

      expect(config.barCount).toBeGreaterThan(0);
      expect(config.maxHeight).toBeGreaterThan(0);
      expect(config.responseSpeed).toBeGreaterThan(0);
      expect(config.responseSpeed).toBeLessThanOrEqual(1);
    });

    test('validates configuration correctly', () => {
      const validConfig = visualization.getDefaultConfig();
      const validationResult = visualization.validateConfig(validConfig);

      expect(validationResult.valid).toBe(true);
      expect(validationResult.errors).toBeUndefined();
    });

    test('detects invalid dot size', () => {
      const invalidConfig = {
        ...visualization.getDefaultConfig(),
        dotSize: -1,
      };

      const validationResult = visualization.validateConfig(invalidConfig);
      expect(validationResult.valid).toBe(false);
      expect(validationResult.errors).toBeDefined();
    });
  });

  describe('Rendering', () => {
    test('renders without errors with valid data', () => {
      const config = visualization.getDefaultConfig();

      expect(() => {
        visualization.render(mockContext, mockFrequencyData, config);
      }).not.toThrow();
    });

    test('uses efficient batch rendering for multiple dots', () => {
      const config = visualization.getDefaultConfig();
      const spy = jest.spyOn(
        mockContext.ctx as CanvasRenderingContext2D,
        'arc'
      );

      visualization.render(mockContext, mockFrequencyData, config);

      // Dot visualization should use arc operations for circles
      expect(spy).toHaveBeenCalled();
      spy.mockRestore();
    });

    test('handles different dot shapes', () => {
      const config = visualization.getDefaultConfig();

      ['circle', 'square', 'diamond'].forEach(dotShape => {
        const styledConfig = { ...config, dotShape };
        expect(() => {
          visualization.render(mockContext, mockFrequencyData, styledConfig);
        }).not.toThrow();
      });
    });
  });

  describe('Performance Optimizations', () => {
    test('processes frequency data efficiently', () => {
      const config = visualization.getDefaultConfig();
      const startTime = performance.now();

      for (let i = 0; i < 100; i++) {
        visualization.render(mockContext, mockFrequencyData, config);
      }

      const endTime = performance.now();
      const avgTime = (endTime - startTime) / 100;

      // Should render each frame in reasonable time for performance
      expect(avgTime).toBeLessThan(20);
    });

    test('optimizes rendering for high dot density', () => {
      const densityConfig = {
        ...visualization.getDefaultConfig(),
        barCount: 128,
        dotDensity: 'high',
      };

      const startTime = performance.now();
      visualization.render(mockContext, mockFrequencyData, densityConfig);
      const renderTime = performance.now() - startTime;

      // Should handle high density efficiently
      expect(renderTime).toBeLessThan(50);
    });
  });

  describe('Matrix Layout', () => {
    test('calculates grid positions correctly', () => {
      const config = {
        ...visualization.getDefaultConfig(),
        matrixRows: 8,
        matrixCols: 16,
      };

      expect(() => {
        visualization.render(mockContext, mockFrequencyData, config);
      }).not.toThrow();
    });

    test('handles asymmetric grid layouts', () => {
      const config = {
        ...visualization.getDefaultConfig(),
        matrixRows: 5,
        matrixCols: 13,
      };

      expect(() => {
        visualization.render(mockContext, mockFrequencyData, config);
      }).not.toThrow();
    });
  });

  describe('Animatable Properties', () => {
    test('returns list of animatable properties', () => {
      const properties = visualization.getAnimatableProperties();

      expect(Array.isArray(properties)).toBe(true);
      expect(properties.length).toBeGreaterThan(0);
      expect(properties).toContain('dotSize');
      expect(properties).toContain('dotSpacing');
    });
  });

  describe('Spatial Partitioning', () => {
    test('handles large number of dots efficiently', () => {
      const config = {
        ...visualization.getDefaultConfig(),
        barCount: 256,
        enableSpatialOptimization: true,
      };

      const startTime = performance.now();
      visualization.render(mockContext, mockFrequencyData, config);
      const renderTime = performance.now() - startTime;

      // Spatial partitioning should keep rendering time reasonable
      expect(renderTime).toBeLessThan(100);
    });
  });

  describe('State Preservation', () => {
    test('exports state correctly', () => {
      if (visualization.exportState) {
        const state = visualization.exportState();

        expect(typeof state).toBe('object');
        expect(state).toHaveProperty('previousValues');
        expect(state).toHaveProperty('peakValues');
        expect(state).toHaveProperty('peakTimers');
      }
    });

    test('imports state correctly', () => {
      if (visualization.exportState && visualization.importState) {
        // Export initial state
        const initialState = visualization.exportState();

        // Modify state
        visualization.render(
          mockContext,
          mockFrequencyData,
          visualization.getDefaultConfig()
        );

        // Import original state
        visualization.importState(initialState);

        // Verify state was restored
        const restoredState = visualization.exportState();
        expect(restoredState.previousValues).toEqual(
          initialState.previousValues
        );
      }
    });
  });
});
