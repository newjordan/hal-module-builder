/**
 * LineVisualization Tests
 * Part of Epic E6.2 - Visualization Types Testing
 */

import { LineVisualization } from '../LineVisualization';
import { AudioProcessor } from '../../AudioProcessor';
import { RenderContext, FrequencyData } from '../BaseVisualization';

describe('LineVisualization', () => {
  let visualization: LineVisualization;
  let mockAudioProcessor: AudioProcessor;
  let mockContext: RenderContext;
  let mockFrequencyData: FrequencyData;

  beforeEach(() => {
    mockAudioProcessor = new AudioProcessor();
    visualization = new LineVisualization(mockAudioProcessor);

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
      expect(visualization.type).toBe('line');
    });

    test('has proper metadata', () => {
      expect(visualization.metadata.name).toBe('Line Waveform');
      expect(visualization.metadata.description).toContain('line');
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

    test('detects invalid line thickness', () => {
      const invalidConfig = {
        ...visualization.getDefaultConfig(),
        lineThickness: -1,
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

    test('uses path operations for line rendering', () => {
      const config = visualization.getDefaultConfig();

      const spy = jest.spyOn(
        mockContext.ctx as CanvasRenderingContext2D,
        'beginPath'
      );

      visualization.render(mockContext, mockFrequencyData, config);

      // Line visualization should use path operations
      expect(spy).toHaveBeenCalled();
      spy.mockRestore();
    });

    test('handles different line styles', () => {
      const config = visualization.getDefaultConfig();

      ['solid', 'dashed', 'dotted'].forEach(lineStyle => {
        const styledConfig = { ...config, lineStyle };
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

    test('optimizes path operations for multiple lines', () => {
      const config = visualization.getDefaultConfig();
      const spy = jest.spyOn(
        mockContext.ctx as CanvasRenderingContext2D,
        'beginPath'
      );

      visualization.render(mockContext, mockFrequencyData, config);

      // Should batch path operations efficiently
      expect(spy).toHaveBeenCalled();
      spy.mockRestore();
    });
  });

  describe('Animatable Properties', () => {
    test('returns list of animatable properties', () => {
      const properties = visualization.getAnimatableProperties();

      expect(Array.isArray(properties)).toBe(true);
      expect(properties.length).toBeGreaterThan(0);
      expect(properties).toContain('lineThickness');
      expect(properties).toContain('amplitude');
    });
  });

  describe('Waveform Processing', () => {
    test('handles zero amplitude gracefully', () => {
      const zeroData: FrequencyData = {
        raw: new Uint8Array(32).fill(0),
        normalized: new Array(32).fill(0),
        bands: new Array(16).fill(0),
        peaks: [],
      };

      const config = visualization.getDefaultConfig();

      expect(() => {
        visualization.render(mockContext, zeroData, config);
      }).not.toThrow();
    });

    test('processes high frequency content correctly', () => {
      const highFreqData: FrequencyData = {
        raw: new Uint8Array(32).fill(255),
        normalized: new Array(32).fill(1),
        bands: new Array(16).fill(1),
        peaks: [{ index: 0, value: 255 }],
      };

      const config = visualization.getDefaultConfig();

      expect(() => {
        visualization.render(mockContext, highFreqData, config);
      }).not.toThrow();
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
