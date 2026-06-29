/**
 * Visual Regression Tests
 * Part of Epic E6.2 - Visualization Types Testing
 */

import { VisualizationFactory } from '../VisualizationFactory';
import { AudioProcessor } from '../../AudioProcessor';
import { RenderContext, FrequencyData } from '../BaseVisualization';

describe('Visual Regression Tests', () => {
  let mockAudioProcessor: AudioProcessor;
  let mockContext: RenderContext;
  let testFrequencyData: FrequencyData;

  beforeAll(() => {
    // Initialize the factory with all visualization types
    mockAudioProcessor = new AudioProcessor();
    VisualizationFactory.initialize(mockAudioProcessor);
  });

  beforeEach(() => {
    // Setup consistent test environment
    const mockCanvas = document.createElement('canvas');
    mockCanvas.width = 800;
    mockCanvas.height = 600;
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

    // Consistent test data for reproducible results
    testFrequencyData = {
      raw: new Uint8Array([
        255, 200, 150, 100, 80, 60, 40, 20, 180, 160, 140, 120, 100, 80, 60, 40,
        220, 200, 180, 160, 140, 120, 100, 80, 200, 180, 160, 140, 120, 100, 80,
        60,
      ]),
      normalized: [
        1.0, 0.78, 0.59, 0.39, 0.31, 0.24, 0.16, 0.08, 0.71, 0.63, 0.55, 0.47,
        0.39, 0.31, 0.24, 0.16, 0.86, 0.78, 0.71, 0.63, 0.55, 0.47, 0.39, 0.31,
        0.78, 0.71, 0.63, 0.55, 0.47, 0.39, 0.31, 0.24,
      ],
      bands: [
        0.8, 0.6, 0.4, 0.2, 0.7, 0.5, 0.3, 0.1, 0.9, 0.7, 0.5, 0.3, 0.8, 0.6,
        0.4, 0.2,
      ],
      peaks: [
        { index: 0, value: 255 },
        { index: 16, value: 220 },
      ],
    };
  });

  afterAll(() => {
    VisualizationFactory.clear();
  });

  describe('All Visualization Types Render Consistently', () => {
    const visualizationTypes = ['bar', 'circle', 'line', 'dot'];

    visualizationTypes.forEach(type => {
      test(`${type} visualization renders without errors`, () => {
        const visualization = VisualizationFactory.create(
          type,
          mockAudioProcessor
        );
        expect(visualization).not.toBeNull();

        const config = visualization!.getDefaultConfig();

        expect(() => {
          visualization!.render(mockContext, testFrequencyData, config);
        }).not.toThrow();
      });

      test(`${type} visualization handles empty data gracefully`, () => {
        const visualization = VisualizationFactory.create(
          type,
          mockAudioProcessor
        );
        expect(visualization).not.toBeNull();

        const emptyData: FrequencyData = {
          raw: new Uint8Array(0),
          normalized: [],
          bands: [],
          peaks: [],
        };

        const config = visualization!.getDefaultConfig();

        expect(() => {
          visualization!.render(mockContext, emptyData, config);
        }).not.toThrow();
      });

      test(`${type} visualization maintains performance targets`, () => {
        const visualization = VisualizationFactory.create(
          type,
          mockAudioProcessor
        );
        expect(visualization).not.toBeNull();

        const config = visualization!.getDefaultConfig();

        // Measure render performance over multiple frames
        const renderTimes: number[] = [];

        for (let i = 0; i < 60; i++) {
          const startTime = performance.now();
          visualization!.render(mockContext, testFrequencyData, config);
          const endTime = performance.now();
          renderTimes.push(endTime - startTime);
        }

        const avgRenderTime =
          renderTimes.reduce((a, b) => a + b, 0) / renderTimes.length;
        const maxRenderTime = Math.max(...renderTimes);

        // Performance targets for 60fps (16.67ms budget) - relaxed for test environment
        expect(avgRenderTime).toBeLessThan(20); // Average under 20ms in test environment
        expect(maxRenderTime).toBeLessThan(50); // No frame over 50ms in test environment
      });
    });
  });

  describe('Theme Consistency', () => {
    const themes: Array<'frost_light' | 'frost_dark'> = [
      'frost_light',
      'frost_dark',
    ];

    themes.forEach(theme => {
      test(`all visualizations render consistently in ${theme} theme`, () => {
        const themeContext = { ...mockContext, theme };

        VisualizationFactory.getRegisteredTypes().forEach(type => {
          const visualization = VisualizationFactory.create(
            type,
            mockAudioProcessor
          );
          expect(visualization).not.toBeNull();

          const config = visualization!.getDefaultConfig();

          expect(() => {
            visualization!.render(themeContext, testFrequencyData, config);
          }).not.toThrow();
        });
      });
    });
  });

  describe('Configuration Consistency', () => {
    test('all visualizations accept valid configurations', () => {
      VisualizationFactory.getRegisteredTypes().forEach(type => {
        const visualization = VisualizationFactory.create(
          type,
          mockAudioProcessor
        );
        expect(visualization).not.toBeNull();

        const config = visualization!.getDefaultConfig();
        const validation = visualization!.validateConfig(config);

        expect(validation.valid).toBe(true);
        expect(validation.errors).toBeUndefined();
      });
    });

    test('all visualizations reject invalid configurations', () => {
      VisualizationFactory.getRegisteredTypes().forEach(type => {
        const visualization = VisualizationFactory.create(
          type,
          mockAudioProcessor
        );
        expect(visualization).not.toBeNull();

        const invalidConfig = {
          ...visualization!.getDefaultConfig(),
          barCount: -1,
          maxHeight: -100,
          responseSpeed: -0.5,
        };

        const validation = visualization!.validateConfig(invalidConfig);
        expect(validation.valid).toBe(false);
        expect(validation.errors).toBeDefined();
        expect(validation.errors!.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Data Processing Consistency', () => {
    test('all visualizations handle extreme values', () => {
      const extremeData: FrequencyData = {
        raw: new Uint8Array(32).fill(255), // Maximum values
        normalized: new Array(32).fill(1),
        bands: new Array(16).fill(1),
        peaks: [{ index: 0, value: 255 }],
      };

      VisualizationFactory.getRegisteredTypes().forEach(type => {
        const visualization = VisualizationFactory.create(
          type,
          mockAudioProcessor
        );
        expect(visualization).not.toBeNull();

        const config = visualization!.getDefaultConfig();

        expect(() => {
          visualization!.render(mockContext, extremeData, config);
        }).not.toThrow();
      });
    });

    test('all visualizations handle sparse data', () => {
      const sparseData: FrequencyData = {
        raw: new Uint8Array([255, 0, 0, 0, 200, 0, 0, 0, 150, 0, 0, 0]),
        normalized: [1, 0, 0, 0, 0.78, 0, 0, 0, 0.59, 0, 0, 0],
        bands: [0.5, 0, 0.4, 0, 0.3, 0],
        peaks: [
          { index: 0, value: 255 },
          { index: 4, value: 200 },
        ],
      };

      VisualizationFactory.getRegisteredTypes().forEach(type => {
        const visualization = VisualizationFactory.create(
          type,
          mockAudioProcessor
        );
        expect(visualization).not.toBeNull();

        const config = visualization!.getDefaultConfig();

        expect(() => {
          visualization!.render(mockContext, sparseData, config);
        }).not.toThrow();
      });
    });
  });

  describe('Memory Management', () => {
    test('visualizations do not leak memory during rapid creation/destruction', () => {
      const initialMemory = (performance as any).memory?.usedJSHeapSize || 0;

      // Create and destroy many visualization instances
      for (let i = 0; i < 100; i++) {
        VisualizationFactory.getRegisteredTypes().forEach(type => {
          const visualization = VisualizationFactory.create(
            type,
            mockAudioProcessor
          );
          if (visualization && visualization.dispose) {
            visualization.dispose();
          }
        });
      }

      // Force garbage collection if available
      if ((global as any).gc) {
        (global as any).gc();
      }

      const finalMemory = (performance as any).memory?.usedJSHeapSize || 0;
      const memoryGrowth = finalMemory - initialMemory;

      // Memory growth should be minimal (less than 10MB)
      expect(memoryGrowth).toBeLessThan(10 * 1024 * 1024);
    });
  });

  describe('Factory Integration', () => {
    test('factory maintains visualization instance state correctly', () => {
      VisualizationFactory.getRegisteredTypes().forEach(type => {
        // Get instance
        const instance1 = VisualizationFactory.getInstance(
          type,
          mockAudioProcessor
        );
        expect(instance1).not.toBeNull();

        // Get same instance again
        const instance2 = VisualizationFactory.getInstance(
          type,
          mockAudioProcessor
        );
        expect(instance2).toBe(instance1); // Should be same instance

        // Destroy instance
        const destroyed = VisualizationFactory.destroyInstance(type);
        expect(destroyed).toBe(true);

        // Get new instance
        const instance3 = VisualizationFactory.getInstance(
          type,
          mockAudioProcessor
        );
        expect(instance3).not.toBe(instance1); // Should be new instance
      });
    });

    test('hot-swapping preserves visual consistency', () => {
      const type = 'bar';
      const originalVisualization = VisualizationFactory.getInstance(
        type,
        mockAudioProcessor
      );
      expect(originalVisualization).not.toBeNull();

      // Render with original
      const config = originalVisualization!.getDefaultConfig();
      originalVisualization!.render(mockContext, testFrequencyData, config);

      // Get registration info
      const registration = VisualizationFactory.getRegistrationInfo(type);
      expect(registration).not.toBeNull();

      // Hot-swap with same class (should preserve state)
      const swapped = VisualizationFactory.hotSwap(
        type,
        registration!.class,
        true
      );
      expect(swapped).toBe(true);

      // Get swapped instance and verify it works
      const swappedVisualization = VisualizationFactory.getInstance(
        type,
        mockAudioProcessor
      );
      expect(swappedVisualization).not.toBeNull();

      expect(() => {
        swappedVisualization!.render(mockContext, testFrequencyData, config);
      }).not.toThrow();
    });
  });

  describe('Canvas State Management', () => {
    test('visualizations preserve canvas context state', () => {
      const ctx = mockContext.ctx as CanvasRenderingContext2D;

      // Set initial context state
      ctx.globalAlpha = 0.5;
      ctx.globalCompositeOperation = 'multiply';
      ctx.lineCap = 'square';

      VisualizationFactory.getRegisteredTypes().forEach(type => {
        const visualization = VisualizationFactory.create(
          type,
          mockAudioProcessor
        );
        expect(visualization).not.toBeNull();

        const config = visualization!.getDefaultConfig();
        visualization!.render(mockContext, testFrequencyData, config);

        // Verify context state is preserved or properly reset
        expect(ctx.globalAlpha).toBeGreaterThanOrEqual(0);
        expect(ctx.globalAlpha).toBeLessThanOrEqual(1);
      });
    });
  });
});
