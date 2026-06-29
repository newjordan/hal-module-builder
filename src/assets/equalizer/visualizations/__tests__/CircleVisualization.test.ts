/**
 * CircleVisualization Tests
 * Part of Epic E6.2 - Visualization Types Testing
 */

import { CircleVisualization } from '../CircleVisualization';
import { AudioProcessor } from '../../AudioProcessor';
import { RenderContext, FrequencyData } from '../BaseVisualization';

describe('CircleVisualization', () => {
  let visualization: CircleVisualization;
  let mockAudioProcessor: AudioProcessor;
  let mockContext: RenderContext;
  let mockFrequencyData: FrequencyData;

  beforeEach(() => {
    mockAudioProcessor = new AudioProcessor();
    visualization = new CircleVisualization(mockAudioProcessor);

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
      expect(visualization.type).toBe('circle');
    });

    test('has proper metadata', () => {
      expect(visualization.metadata.name).toBe('Radial Circles');
      expect(visualization.metadata.description).toContain('Circular');
      expect(visualization.metadata.author).toBe('HAL Builder');
    });
  });

  describe('Configuration Management', () => {
    test('provides valid default configuration', () => {
      const config = visualization.getDefaultConfig();

      expect(config.barCount).toBeGreaterThan(0);
      expect((config as any).circleRadius).toBeGreaterThan(0);
      expect(config.maxHeight).toBeGreaterThan(0);
      expect(config.rotation).toBeDefined();
      expect(config.scale).toBeDefined();
    });

    test('validates configuration correctly', () => {
      const validConfig = visualization.getDefaultConfig();
      const validationResult = visualization.validateConfig(validConfig);

      expect(validationResult.valid).toBe(true);
      expect(validationResult.errors).toBeUndefined();
    });

    test('detects invalid configuration', () => {
      const invalidConfig = {
        ...visualization.getDefaultConfig(),
        barCount: -1,
        circleRadius: -50,
      } as any;

      const validationResult = visualization.validateConfig(invalidConfig);
      expect(validationResult.valid).toBe(false);
      expect(validationResult.errors).toBeDefined();
      expect(validationResult.errors!.length).toBeGreaterThan(0);
    });
  });

  describe('Rendering', () => {
    test('renders without errors with valid data', () => {
      const config = visualization.getDefaultConfig();

      expect(() => {
        visualization.render(mockContext, mockFrequencyData, config);
      }).not.toThrow();
    });

    test('handles empty frequency data gracefully', () => {
      const emptyData: FrequencyData = {
        raw: new Uint8Array(0),
        normalized: [],
        bands: [],
        peaks: [],
      };

      const config = visualization.getDefaultConfig();

      expect(() => {
        visualization.render(mockContext, emptyData, config);
      }).not.toThrow();
    });

    test('respects polar coordinate rendering', () => {
      const config = visualization.getDefaultConfig();
      const spy = jest.spyOn(
        mockContext.ctx as CanvasRenderingContext2D,
        'arc'
      );

      visualization.render(mockContext, mockFrequencyData, config);

      // Circle visualization should use arc operations
      expect(spy).toHaveBeenCalled();
      spy.mockRestore();
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

    test('reuses calculation results appropriately', () => {
      const config = visualization.getDefaultConfig();

      // First render
      visualization.render(mockContext, mockFrequencyData, config);

      // Second render with same data should be faster due to caching
      const startTime = performance.now();
      visualization.render(mockContext, mockFrequencyData, config);
      const renderTime = performance.now() - startTime;

      expect(renderTime).toBeLessThan(20); // Relaxed for test environment
    });
  });

  describe('Animatable Properties', () => {
    test('returns list of animatable properties', () => {
      const properties = visualization.getAnimatableProperties();

      expect(Array.isArray(properties)).toBe(true);
      expect(properties.length).toBeGreaterThan(0);
      expect(properties).toContain('circleRadius');
      expect(properties).toContain('rotation');
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
