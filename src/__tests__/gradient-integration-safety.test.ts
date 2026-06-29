/**
 * Gradient Integration Safety Tests
 *
 * CRITICAL: These tests prevent breaking changes during E2 refactoring.
 * All tests must pass before, during, and after gradient system decomposition.
 *
 * Run with: npm test -- gradient-integration-safety
 */

import { renderHook } from '@testing-library/react';
import useGradientManagement, {
  UseGradientManagementReturn,
} from '../hooks/useGradientManagement';
import { Layer } from '../types/layer-types';

// Expected API surface - any changes here indicate potential breaking changes
interface ExpectedGradientAPI {
  addGradientColor: (
    layerId: string,
    updateLayer: (layerId: string, updates: Partial<Layer>) => void,
    layers: Layer[],
    isEqualizer?: boolean,
    gradientTarget?: 'layer' | 'fill' | 'stroke' | 'radial' | 'custom'
  ) => void;
  removeGradientColor: (
    layerId: string,
    index: number,
    updateLayer: (layerId: string, updates: Partial<Layer>) => void,
    layers: Layer[],
    isEqualizer?: boolean,
    gradientTarget?: 'layer' | 'fill' | 'stroke' | 'radial' | 'custom'
  ) => void;
  updateGradientColor: (
    layerId: string,
    index: number,
    color: string,
    updateLayer: (layerId: string, updates: Partial<Layer>) => void,
    layers: Layer[],
    isEqualizer?: boolean,
    gradientTarget?: 'layer' | 'fill' | 'stroke' | 'radial' | 'custom'
  ) => void;
  updateGradientStop: (
    layerId: string,
    index: number,
    stop: number,
    updateLayer: (layerId: string, updates: Partial<Layer>) => void,
    layers: Layer[],
    isEqualizer?: boolean,
    gradientTarget?: 'layer' | 'fill' | 'stroke' | 'radial' | 'custom'
  ) => void;
  updateGradientType: (
    layerId: string,
    type: 'linear' | 'radial' | 'conic',
    updateLayer: (layerId: string, updates: Partial<Layer>) => void,
    layers: Layer[],
    gradientTarget?: 'layer' | 'fill' | 'stroke' | 'radial' | 'custom'
  ) => void;
  updateGradientAngle: (
    layerId: string,
    angle: number,
    updateLayer: (layerId: string, updates: Partial<Layer>) => void,
    layers: Layer[],
    gradientTarget?: 'layer' | 'fill' | 'stroke' | 'radial' | 'custom'
  ) => void;
  updateGradientCenter: (
    layerId: string,
    centerX: number,
    centerY: number,
    updateLayer: (layerId: string, updates: Partial<Layer>) => void,
    layers: Layer[],
    gradientTarget?: 'layer' | 'fill' | 'stroke' | 'radial' | 'custom'
  ) => void;
  applyGradientPreset: (
    layerId: string,
    preset: any,
    updateLayer: (layerId: string, updates: Partial<Layer>) => void,
    layers: Layer[],
    gradientTarget?: 'layer' | 'fill' | 'stroke' | 'radial' | 'custom'
  ) => void;
  generateGradientCSS: (
    layer: Layer,
    gradientTarget?: 'layer' | 'fill' | 'stroke' | 'radial' | 'custom'
  ) => string;
  validateGradientData: (
    colors: string[],
    stops: number[]
  ) => { colors: string[]; stops: number[] };
  presets: Array<{
    name: string;
    type: 'linear' | 'radial' | 'conic';
    colors: string[];
    stops: number[];
    angle?: number;
    centerX?: number;
    centerY?: number;
  }>;
}

describe('Gradient Integration Safety Tests', () => {
  let gradientHook: UseGradientManagementReturn;
  let mockUpdateLayer: jest.Mock;
  let testLayers: Layer[];

  beforeEach(() => {
    const { result } = renderHook(() => useGradientManagement());
    gradientHook = result.current;
    mockUpdateLayer = jest.fn();

    testLayers = [
      {
        id: 'layer-1',
        name: 'Test Layer',
        type: 'gradient',
        visible: true,
        opacity: 1,
        blendMode: 'normal',
        scale: 1,
        rotation: 0,
        offsetX: 0,
        offsetY: 0,
        gradient: {
          type: 'linear',
          colors: ['#ff0000', '#00ff00'],
          stops: [0, 1],
          angle: 45,
        },
      },
      {
        id: 'equalizer-1',
        name: 'Equalizer Layer',
        type: 'equalizer',
        visible: true,
        opacity: 1,
        blendMode: 'normal',
        scale: 1,
        rotation: 0,
        offsetX: 0,
        offsetY: 0,
        equalizerSettings: {
          visualization: 'bars',
          customGradient: {
            colors: ['#ff0000', '#0000ff'],
            stops: [0, 1],
          },
          radialGradientSettings: {
            colors: ['#ff0000', '#ffff00', '#00ff00'],
            stops: [0, 0.5, 1],
            fromCenter: true,
          },
        },
      },
      {
        id: 'circle-1',
        name: 'Circle Layer',
        type: 'circle',
        visible: true,
        opacity: 1,
        blendMode: 'normal',
        scale: 1,
        rotation: 0,
        offsetX: 0,
        offsetY: 0,
        circleSettings: {
          radius: 50,
          fillGradient: {
            type: 'radial',
            colors: ['#ff0000', '#0000ff'],
            stops: [0, 1],
            centerX: 50,
            centerY: 50,
          },
          strokeGradient: {
            type: 'linear',
            colors: ['#00ff00', '#ffff00'],
            stops: [0, 1],
            angle: 90,
          },
        },
      },
    ];
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('API Surface Preservation', () => {
    it('preserves all expected hook functions', () => {
      const api = gradientHook as ExpectedGradientAPI;

      // Validate all functions exist with correct types
      expect(typeof api.addGradientColor).toBe('function');
      expect(typeof api.removeGradientColor).toBe('function');
      expect(typeof api.updateGradientColor).toBe('function');
      expect(typeof api.updateGradientStop).toBe('function');
      expect(typeof api.updateGradientType).toBe('function');
      expect(typeof api.updateGradientAngle).toBe('function');
      expect(typeof api.updateGradientCenter).toBe('function');
      expect(typeof api.applyGradientPreset).toBe('function');
      expect(typeof api.generateGradientCSS).toBe('function');
      expect(typeof api.validateGradientData).toBe('function');
      expect(Array.isArray(api.presets)).toBe(true);
    });

    it('preserves function parameter counts (required parameters)', () => {
      // These are the required parameter counts (before default parameters)
      // Note: .length only counts parameters before first default parameter
      expect(gradientHook.addGradientColor.length).toBe(3); // layerId, updateLayer, layers (isEqualizer and gradientTarget have defaults)
      expect(gradientHook.removeGradientColor.length).toBe(4); // layerId, index, updateLayer, layers (isEqualizer and gradientTarget have defaults)
      expect(gradientHook.updateGradientColor.length).toBe(5); // layerId, index, color, updateLayer, layers (isEqualizer and gradientTarget have defaults)
      expect(gradientHook.updateGradientStop.length).toBe(5); // layerId, index, stop, updateLayer, layers (isEqualizer and gradientTarget have defaults)
      expect(gradientHook.updateGradientType.length).toBe(4); // layerId, type, updateLayer, layers (gradientTarget has default)
      expect(gradientHook.updateGradientAngle.length).toBe(4); // layerId, angle, updateLayer, layers (gradientTarget has default)
      expect(gradientHook.updateGradientCenter.length).toBe(5); // layerId, centerX, centerY, updateLayer, layers (gradientTarget has default)
      expect(gradientHook.applyGradientPreset.length).toBe(4); // layerId, preset, updateLayer, layers (gradientTarget has default)
      expect(gradientHook.generateGradientCSS.length).toBe(1); // layer (gradientTarget has default)
      expect(gradientHook.validateGradientData.length).toBe(2); // colors, stops
    });

    it('preserves preset structure', () => {
      expect(gradientHook.presets.length).toBeGreaterThan(0);

      const firstPreset = gradientHook.presets[0];
      expect(firstPreset).toHaveProperty('name');
      expect(firstPreset).toHaveProperty('type');
      expect(firstPreset).toHaveProperty('colors');
      expect(firstPreset).toHaveProperty('stops');
      expect(typeof firstPreset.name).toBe('string');
      expect(['linear', 'radial', 'conic']).toContain(firstPreset.type);
      expect(Array.isArray(firstPreset.colors)).toBe(true);
      expect(Array.isArray(firstPreset.stops)).toBe(true);
    });
  });

  describe('Object Structure Preservation', () => {
    it('preserves layer gradient structure after operations', () => {
      const originalStructure = {
        type: testLayers[0].gradient!.type,
        hasColors: Array.isArray(testLayers[0].gradient!.colors),
        hasStops: Array.isArray(testLayers[0].gradient!.stops),
        hasAngle: typeof testLayers[0].gradient!.angle === 'number',
      };

      // Perform gradient operations
      gradientHook.addGradientColor(
        'layer-1',
        mockUpdateLayer,
        testLayers,
        false,
        'layer'
      );

      // Verify updateLayer was called with correct structure
      expect(mockUpdateLayer).toHaveBeenCalled();
      const updateCall = mockUpdateLayer.mock.calls[0];
      const updatedLayer = updateCall[1];

      expect(updatedLayer).toHaveProperty('gradient');
      expect(updatedLayer.gradient.type).toBe(originalStructure.type);
      expect(Array.isArray(updatedLayer.gradient.colors)).toBe(true);
      expect(Array.isArray(updatedLayer.gradient.stops)).toBe(true);
      expect(typeof updatedLayer.gradient.angle).toBe('number');
    });

    it('preserves equalizer gradient structure after operations', () => {
      gradientHook.addGradientColor(
        'equalizer-1',
        mockUpdateLayer,
        testLayers,
        true,
        'custom'
      );

      expect(mockUpdateLayer).toHaveBeenCalled();
      const updateCall = mockUpdateLayer.mock.calls[0];
      const updatedLayer = updateCall[1];

      expect(updatedLayer).toHaveProperty('equalizerSettings');
      expect(updatedLayer.equalizerSettings).toHaveProperty('customGradient');
      expect(updatedLayer.equalizerSettings.customGradient).toHaveProperty(
        'colors'
      );
      expect(updatedLayer.equalizerSettings.customGradient).toHaveProperty(
        'stops'
      );
      expect(
        Array.isArray(updatedLayer.equalizerSettings.customGradient.colors)
      ).toBe(true);
      expect(
        Array.isArray(updatedLayer.equalizerSettings.customGradient.stops)
      ).toBe(true);
    });

    it('preserves circle gradient structure after operations', () => {
      gradientHook.updateGradientColor(
        'circle-1',
        0,
        '#123456',
        mockUpdateLayer,
        testLayers,
        false,
        'fill'
      );

      expect(mockUpdateLayer).toHaveBeenCalled();
      const updateCall = mockUpdateLayer.mock.calls[0];
      const updatedLayer = updateCall[1];

      expect(updatedLayer).toHaveProperty('circleSettings');
      expect(updatedLayer.circleSettings).toHaveProperty('fillGradient');
      expect(updatedLayer.circleSettings.fillGradient).toHaveProperty('colors');
      expect(updatedLayer.circleSettings.fillGradient).toHaveProperty('stops');
      expect(updatedLayer.circleSettings.fillGradient.colors[0]).toBe(
        '#123456'
      );
    });

    it('preserves nested property paths for all gradient targets', () => {
      const targets: Array<{
        target: 'layer' | 'fill' | 'stroke' | 'custom' | 'radial';
        layerId: string;
        isEqualizer: boolean;
        expectedPath: string[];
      }> = [
        {
          target: 'layer',
          layerId: 'layer-1',
          isEqualizer: false,
          expectedPath: ['gradient'],
        },
        {
          target: 'fill',
          layerId: 'circle-1',
          isEqualizer: false,
          expectedPath: ['circleSettings', 'fillGradient'],
        },
        {
          target: 'stroke',
          layerId: 'circle-1',
          isEqualizer: false,
          expectedPath: ['circleSettings', 'strokeGradient'],
        },
        {
          target: 'custom',
          layerId: 'equalizer-1',
          isEqualizer: true,
          expectedPath: ['equalizerSettings', 'customGradient'],
        },
        {
          target: 'radial',
          layerId: 'equalizer-1',
          isEqualizer: true,
          expectedPath: ['equalizerSettings', 'radialGradientSettings'],
        },
      ];

      targets.forEach(({ target, layerId, isEqualizer, expectedPath }) => {
        mockUpdateLayer.mockClear();

        gradientHook.updateGradientColor(
          layerId,
          0,
          '#abcdef',
          mockUpdateLayer,
          testLayers,
          isEqualizer,
          target
        );

        expect(mockUpdateLayer).toHaveBeenCalled();
        const updateCall = mockUpdateLayer.mock.calls[0];
        const updatedLayer = updateCall[1];

        // Navigate the expected path
        let current = updatedLayer;
        expectedPath.forEach((prop, index) => {
          expect(current).toHaveProperty(prop);
          current = current[prop];

          // At the final property, expect colors array
          if (index === expectedPath.length - 1) {
            expect(current).toHaveProperty('colors');
            expect(Array.isArray(current.colors)).toBe(true);
          }
        });
      });
    });
  });

  describe('Behavioral Preservation', () => {
    it('maintains error handling behavior for invalid layer ID', () => {
      // Should not throw, should not call updateLayer
      expect(() => {
        gradientHook.addGradientColor(
          'invalid-id',
          mockUpdateLayer,
          testLayers,
          false,
          'layer'
        );
      }).not.toThrow();

      expect(mockUpdateLayer).not.toHaveBeenCalled();
    });

    it('maintains error handling behavior for invalid operations', () => {
      // Try to remove color when only 2 colors exist (should not call updateLayer)
      const twoColorLayer = {
        ...testLayers[0],
        gradient: {
          ...testLayers[0].gradient!,
          colors: ['#ff0000', '#00ff00'],
          stops: [0, 1],
        },
      };

      gradientHook.removeGradientColor(
        'layer-1',
        0,
        mockUpdateLayer,
        [twoColorLayer],
        false,
        'layer'
      );
      expect(mockUpdateLayer).not.toHaveBeenCalled();
    });

    it('maintains stop clamping behavior', () => {
      gradientHook.updateGradientStop(
        'layer-1',
        0,
        1.5,
        mockUpdateLayer,
        testLayers,
        false,
        'layer'
      );

      expect(mockUpdateLayer).toHaveBeenCalled();
      const updateCall = mockUpdateLayer.mock.calls[0];
      const updatedLayer = updateCall[1];

      // Stop should be clamped to 1.0
      expect(updatedLayer.gradient.stops[0]).toBe(1);
    });

    it('maintains automatic stop calculation on add/remove', () => {
      gradientHook.addGradientColor(
        'layer-1',
        mockUpdateLayer,
        testLayers,
        false,
        'layer'
      );

      expect(mockUpdateLayer).toHaveBeenCalled();
      const updateCall = mockUpdateLayer.mock.calls[0];
      const updatedLayer = updateCall[1];

      // Should have 3 colors and 3 stops
      expect(updatedLayer.gradient.colors.length).toBe(3);
      expect(updatedLayer.gradient.stops.length).toBe(3);

      // Stops should be automatically calculated
      expect(updatedLayer.gradient.stops).toEqual([0, 0.5, 1]);
    });

    it('maintains CSS generation output format', () => {
      const cssOutput = gradientHook.generateGradientCSS(
        testLayers[0],
        'layer'
      );

      // Should generate valid CSS gradient string
      expect(typeof cssOutput).toBe('string');
      expect(cssOutput.length).toBeGreaterThan(0);
      expect(cssOutput).toMatch(/^(linear|radial|conic)-gradient\(/);
    });

    it('maintains validation output structure', () => {
      const result = gradientHook.validateGradientData(
        ['#ff0000', '#00ff00'],
        [0, 1]
      );

      expect(result).toHaveProperty('colors');
      expect(result).toHaveProperty('stops');
      expect(Array.isArray(result.colors)).toBe(true);
      expect(Array.isArray(result.stops)).toBe(true);
    });
  });

  describe('Cross-Component Integration Safety', () => {
    it('maintains compatibility with HalModuleBuilder expectations', () => {
      // Test the specific way HalModuleBuilder uses gradient management
      const layerId = 'test-layer';
      const layers = [{ ...testLayers[0], id: layerId }];
      const updateLayer = jest.fn();

      // This is how HalModuleBuilder calls the hook
      gradientHook.addGradientColor(layerId, updateLayer, layers);
      gradientHook.updateGradientColor(
        layerId,
        0,
        '#123456',
        updateLayer,
        layers
      );
      gradientHook.removeGradientColor(layerId, 1, updateLayer, layers);

      // Should not throw and should call updateLayer appropriately
      expect(updateLayer).toHaveBeenCalledTimes(2); // add and update (remove has only 2 colors)
    });

    it('maintains compatibility with PropertyPanel expectations', () => {
      // Test the way PropertyPanel components use gradient management
      const preset = gradientHook.presets[0];

      gradientHook.applyGradientPreset(
        'layer-1',
        preset,
        mockUpdateLayer,
        testLayers,
        'layer'
      );

      expect(mockUpdateLayer).toHaveBeenCalled();
      const updateCall = mockUpdateLayer.mock.calls[0];
      const updatedLayer = updateCall[1];

      expect(updatedLayer.gradient.type).toBe(preset.type);
      expect(updatedLayer.gradient.colors).toEqual(preset.colors);
    });
  });

  describe('Performance-Critical Path Safety', () => {
    it('maintains fast CSS generation (critical for 60fps)', () => {
      const startTime = performance.now();

      for (let i = 0; i < 1000; i++) {
        gradientHook.generateGradientCSS(testLayers[0], 'layer');
      }

      const endTime = performance.now();
      const avgTime = (endTime - startTime) / 1000;

      // Should be under 2ms average (critical for animation performance)
      expect(avgTime).toBeLessThan(2);
    });
  });
});

/**
 * CRITICAL SAFETY NOTES:
 *
 * 1. All tests in this file must pass before starting E2 refactoring
 * 2. All tests must continue to pass during refactoring
 * 3. Any test failure indicates a breaking change
 * 4. Performance thresholds are critical for 60fps animation
 * 5. Object structure changes will break existing consumers
 *
 * If any test fails after refactoring:
 * - STOP immediately
 * - Revert changes
 * - Identify root cause
 * - Fix before continuing
 */
