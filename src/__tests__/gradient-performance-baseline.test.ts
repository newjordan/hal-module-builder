/**
 * Gradient Performance Baseline Tests
 *
 * CRITICAL: These tests establish performance baselines before E2 refactoring.
 * Any refactored gradient system must meet or exceed these baselines.
 *
 * Run with: npm test -- gradient-performance-baseline
 */

import { renderHook } from '@testing-library/react';
import useGradientManagement from '../hooks/useGradientManagement';
import { Layer } from '../types/layer-types';
import { generateGradientString } from '../utils/layer-transforms';

// Performance baseline thresholds (in milliseconds)
const PERFORMANCE_BASELINES = {
  addGradientColor: 10, // ms - Adding single color to gradient
  updateGradientColor: 5, // ms - Updating single color
  removeGradientColor: 5, // ms - Removing single color
  updateGradientStop: 3, // ms - Updating single stop position
  generateGradientCSS: 2, // ms - CRITICAL: CSS generation for 60fps
  applyGradientPreset: 15, // ms - Applying preset to layer
  validateGradientData: 1, // ms - Validation of colors and stops
  batchOperations: 50, // ms - 10 operations in sequence
  memoryPerOperation: 2048, // bytes - Memory increase per operation
} as const;

// Test data factories
const createTestLayer = (
  type: 'basic' | 'equalizer' | 'circle' = 'basic'
): Layer => {
  const baseLayer: Layer = {
    id: 'test-layer-' + Date.now(),
    name: 'Test Layer',
    type: 'gradient',
    visible: true,
    opacity: 1,
    blendMode: 'normal',
    scale: 1,
    rotation: 0,
    offsetX: 0,
    offsetY: 0,
  };

  switch (type) {
    case 'basic':
      return {
        ...baseLayer,
        gradient: {
          type: 'linear',
          colors: ['#ff0000', '#00ff00', '#0000ff'],
          stops: [0, 0.5, 1],
          angle: 45,
        },
      };
    case 'equalizer':
      return {
        ...baseLayer,
        type: 'equalizer',
        equalizerSettings: {
          barCount: 32,
          barStyle: 'line',
          barWidth: 2,
          barSpacing: 1,
          barRotation: 0,
          innerRadius: 120,
          maxHeight: 30,
          responseSpeed: 0.7,
          frequencyRange: 'full',
          colorMode: 'custom-gradient',
          primaryColor: '#00ff00',
          secondaryColor: '#0000ff',
          customGradient: {
            colors: ['#ff0000', '#00ff00'],
            stops: [0, 1],
          },
          radialGradientSettings: {
            colors: ['#ff0000', '#ffff00', '#00ff00'],
            stops: [0, 0.5, 1],
            fromCenter: true,
          },
          glowIntensity: 0.5,
          symmetry: 'none',
          pulseMode: 'none',
          positionX: 50,
          positionY: 50,
          startAngle: 0,
          endAngle: 360,
          arcMode: false,
        },
      };
    case 'circle':
      return {
        ...baseLayer,
        type: 'circle',
        circleSettings: {
          radius: 50,
          thickness: 4,
          fillType: 'gradient',
          strokeType: 'gradient',
          fillGradient: {
            type: 'radial',
            colors: ['#ff0000', '#0000ff'],
            stops: [0, 1],
            centerX: 50,
            centerY: 50,
          },
          strokeGradient: {
            colors: ['#00ff00', '#ffff00'],
            stops: [0, 1],
          },
          glowIntensity: 0.3,
          glowColor: '#ffffff',
        },
      };
    default:
      return baseLayer;
  }
};

describe('Gradient Performance Baseline Tests', () => {
  let gradientHook: ReturnType<typeof useGradientManagement>;
  let testLayers: Layer[];
  let mockUpdateLayer: jest.Mock;

  beforeEach(() => {
    const { result } = renderHook(() => useGradientManagement());
    gradientHook = result.current;
    testLayers = [
      createTestLayer('basic'),
      createTestLayer('equalizer'),
      createTestLayer('circle'),
    ];
    mockUpdateLayer = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Individual Operation Performance', () => {
    it('addGradientColor performance baseline', () => {
      const iterations = 100;
      const startTime = performance.now();

      for (let i = 0; i < iterations; i++) {
        gradientHook.addGradientColor(
          testLayers[0].id,
          mockUpdateLayer,
          testLayers,
          false,
          'layer'
        );
      }

      const endTime = performance.now();
      const avgTime = (endTime - startTime) / iterations;

      console.log(`addGradientColor baseline: ${avgTime.toFixed(3)}ms`);
      expect(avgTime).toBeLessThan(PERFORMANCE_BASELINES.addGradientColor);
    });

    it('updateGradientColor performance baseline', () => {
      const iterations = 100;
      const startTime = performance.now();

      for (let i = 0; i < iterations; i++) {
        gradientHook.updateGradientColor(
          testLayers[0].id,
          0,
          `#${Math.floor(Math.random() * 16777215).toString(16)}`,
          mockUpdateLayer,
          testLayers,
          false,
          'layer'
        );
      }

      const endTime = performance.now();
      const avgTime = (endTime - startTime) / iterations;

      console.log(`updateGradientColor baseline: ${avgTime.toFixed(3)}ms`);
      expect(avgTime).toBeLessThan(PERFORMANCE_BASELINES.updateGradientColor);
    });

    it('removeGradientColor performance baseline', () => {
      const iterations = 50; // Fewer iterations since we need 3+ colors
      const startTime = performance.now();

      for (let i = 0; i < iterations; i++) {
        // Create layer with multiple colors for removal
        const layerWithManyColors = {
          ...testLayers[0],
          gradient: {
            ...testLayers[0].gradient!,
            colors: ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff'],
            stops: [0, 0.25, 0.5, 0.75, 1],
          },
        };

        gradientHook.removeGradientColor(
          layerWithManyColors.id,
          2, // Remove middle color
          mockUpdateLayer,
          [layerWithManyColors],
          false,
          'layer'
        );
      }

      const endTime = performance.now();
      const avgTime = (endTime - startTime) / iterations;

      console.log(`removeGradientColor baseline: ${avgTime.toFixed(3)}ms`);
      expect(avgTime).toBeLessThan(PERFORMANCE_BASELINES.removeGradientColor);
    });

    it('updateGradientStop performance baseline', () => {
      const iterations = 100;
      const startTime = performance.now();

      for (let i = 0; i < iterations; i++) {
        gradientHook.updateGradientStop(
          testLayers[0].id,
          1,
          Math.random(), // Random stop position
          mockUpdateLayer,
          testLayers,
          false,
          'layer'
        );
      }

      const endTime = performance.now();
      const avgTime = (endTime - startTime) / iterations;

      console.log(`updateGradientStop baseline: ${avgTime.toFixed(3)}ms`);
      expect(avgTime).toBeLessThan(PERFORMANCE_BASELINES.updateGradientStop);
    });

    it('generateGradientCSS performance baseline - CRITICAL FOR 60FPS', () => {
      const iterations = 1000; // High iteration count for CSS generation
      const startTime = performance.now();

      for (let i = 0; i < iterations; i++) {
        gradientHook.generateGradientCSS(testLayers[0], 'layer');
      }

      const endTime = performance.now();
      const avgTime = (endTime - startTime) / iterations;

      console.log(`generateGradientCSS baseline: ${avgTime.toFixed(3)}ms`);
      expect(avgTime).toBeLessThan(PERFORMANCE_BASELINES.generateGradientCSS);
    });

    it('applyGradientPreset performance baseline', () => {
      const iterations = 50;
      const preset = gradientHook.presets[0]; // Use first preset
      const startTime = performance.now();

      for (let i = 0; i < iterations; i++) {
        gradientHook.applyGradientPreset(
          testLayers[0].id,
          preset,
          mockUpdateLayer,
          testLayers,
          'layer'
        );
      }

      const endTime = performance.now();
      const avgTime = (endTime - startTime) / iterations;

      console.log(`applyGradientPreset baseline: ${avgTime.toFixed(3)}ms`);
      expect(avgTime).toBeLessThan(PERFORMANCE_BASELINES.applyGradientPreset);
    });

    it('validateGradientData performance baseline', () => {
      const iterations = 1000;
      const testColors = ['#ff0000', '#00ff00', '#0000ff'];
      const testStops = [0, 0.5, 1];
      const startTime = performance.now();

      for (let i = 0; i < iterations; i++) {
        gradientHook.validateGradientData(testColors, testStops);
      }

      const endTime = performance.now();
      const avgTime = (endTime - startTime) / iterations;

      console.log(`validateGradientData baseline: ${avgTime.toFixed(3)}ms`);
      expect(avgTime).toBeLessThan(PERFORMANCE_BASELINES.validateGradientData);
    });
  });

  describe('Batch Operations Performance', () => {
    it('batch gradient operations performance baseline', () => {
      const startTime = performance.now();

      // Simulate a sequence of gradient operations (like user editing)
      for (let i = 0; i < 10; i++) {
        gradientHook.addGradientColor(
          testLayers[0].id,
          mockUpdateLayer,
          testLayers,
          false,
          'layer'
        );
        gradientHook.updateGradientColor(
          testLayers[0].id,
          0,
          '#ff0000',
          mockUpdateLayer,
          testLayers,
          false,
          'layer'
        );
        gradientHook.updateGradientStop(
          testLayers[0].id,
          0,
          0.3,
          mockUpdateLayer,
          testLayers,
          false,
          'layer'
        );
      }

      const endTime = performance.now();
      const totalTime = endTime - startTime;

      console.log(`Batch operations baseline: ${totalTime.toFixed(3)}ms`);
      expect(totalTime).toBeLessThan(PERFORMANCE_BASELINES.batchOperations);
    });
  });

  describe('Cross-Target Performance', () => {
    it('gradient operations across all targets performance', () => {
      const targets: Array<'layer' | 'fill' | 'stroke' | 'custom' | 'radial'> =
        ['layer', 'fill', 'stroke', 'custom', 'radial'];
      const iterations = 20; // 20 operations per target
      const startTime = performance.now();

      targets.forEach(target => {
        for (let i = 0; i < iterations; i++) {
          const layerIndex =
            target === 'custom' || target === 'radial'
              ? 1
              : target === 'fill' || target === 'stroke'
                ? 2
                : 0;
          const isEqualizer = target === 'custom' || target === 'radial';

          gradientHook.addGradientColor(
            testLayers[layerIndex].id,
            mockUpdateLayer,
            testLayers,
            isEqualizer,
            target
          );
        }
      });

      const endTime = performance.now();
      const totalTime = endTime - startTime;
      const avgTimePerTarget = totalTime / (targets.length * iterations);

      console.log(
        `Cross-target operations baseline: ${avgTimePerTarget.toFixed(3)}ms per operation`
      );
      expect(avgTimePerTarget).toBeLessThan(
        PERFORMANCE_BASELINES.addGradientColor * 1.5
      );
    });
  });

  describe('Memory Usage Baseline', () => {
    it('measures memory usage during gradient operations', () => {
      // Note: performance.memory might not be available in all test environments
      const initialMemory = (performance as any).memory?.usedJSHeapSize || 0;

      // Perform 100 gradient operations
      for (let i = 0; i < 100; i++) {
        gradientHook.addGradientColor(
          testLayers[0].id,
          mockUpdateLayer,
          testLayers,
          false,
          'layer'
        );

        if (i % 10 === 0) {
          // Force garbage collection hint (if available)
          if (global.gc) global.gc();
        }
      }

      const finalMemory = (performance as any).memory?.usedJSHeapSize || 0;
      const memoryIncrease = finalMemory - initialMemory;

      if (initialMemory > 0) {
        console.log(
          `Memory baseline: ${memoryIncrease} bytes for 100 operations`
        );
        expect(memoryIncrease).toBeLessThan(
          PERFORMANCE_BASELINES.memoryPerOperation * 100
        );
      } else {
        console.log('Memory measurement not available in test environment');
      }
    });
  });

  describe('Edge Case Performance', () => {
    it('performance with large gradient (20+ colors)', () => {
      const largeGradientLayer = {
        ...testLayers[0],
        gradient: {
          ...testLayers[0].gradient!,
          colors: Array.from(
            { length: 20 },
            (_, i) => `hsl(${i * 18}, 70%, 50%)`
          ),
          stops: Array.from({ length: 20 }, (_, i) => i / 19),
        },
      };

      const iterations = 50;
      const startTime = performance.now();

      for (let i = 0; i < iterations; i++) {
        gradientHook.generateGradientCSS(largeGradientLayer, 'layer');
      }

      const endTime = performance.now();
      const avgTime = (endTime - startTime) / iterations;

      console.log(
        `Large gradient CSS generation baseline: ${avgTime.toFixed(3)}ms`
      );
      expect(avgTime).toBeLessThan(
        PERFORMANCE_BASELINES.generateGradientCSS * 5
      ); // Allow 5x for large gradients
    });

    it('performance with complex nested structure access', () => {
      const complexLayer = createTestLayer('equalizer');
      const iterations = 100;
      const startTime = performance.now();

      for (let i = 0; i < iterations; i++) {
        gradientHook.updateGradientColor(
          complexLayer.id,
          0,
          '#ff0000',
          mockUpdateLayer,
          [complexLayer],
          true, // isEqualizer
          'custom'
        );
      }

      const endTime = performance.now();
      const avgTime = (endTime - startTime) / iterations;

      console.log(`Complex nested access baseline: ${avgTime.toFixed(3)}ms`);
      expect(avgTime).toBeLessThan(
        PERFORMANCE_BASELINES.updateGradientColor * 2
      );
    });
  });

  describe('External Dependency Performance', () => {
    it('generateGradientString utility performance', () => {
      const gradient = testLayers[0].gradient!;
      const iterations = 1000;
      const startTime = performance.now();

      for (let i = 0; i < iterations; i++) {
        generateGradientString(gradient);
      }

      const endTime = performance.now();
      const avgTime = (endTime - startTime) / iterations;

      console.log(
        `generateGradientString utility baseline: ${avgTime.toFixed(3)}ms`
      );
      expect(avgTime).toBeLessThan(1); // Should be very fast
    });
  });
});

/**
 * Performance baseline results should be documented in:
 * docs/benchmarks/gradient-performance-baseline.md
 *
 * Any E2 refactoring must meet or exceed these baselines.
 * Regression threshold: No more than 10% performance decrease.
 * Memory threshold: No more than 5% memory increase.
 */
