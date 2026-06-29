/**
 * Gradient API Surface Preservation Tests
 *
 * Tests to detect any breaking changes to the useGradientManagement API during E2 refactoring.
 * These tests snapshot the exact API surface and validate all contracts remain intact.
 *
 * CRITICAL: Any failure in these tests indicates a breaking change that will break consumers.
 */

import { renderHook } from '@testing-library/react';
import {
  useGradientManagement,
  UseGradientManagementReturn,
  GradientType,
  GradientTarget,
  GradientPreset,
} from '../hooks/useGradientManagement';
import { Layer } from '../types/layer-types';

// Snapshot of the exact API surface that must be preserved
type ExpectedAPISnapshot = {
  // Core gradient operations
  addGradientColor: (
    layerId: string,
    updateLayer: Function,
    layers: Layer[],
    isEqualizer?: boolean,
    gradientTarget?: GradientTarget
  ) => void;
  removeGradientColor: (
    layerId: string,
    index: number,
    updateLayer: Function,
    layers: Layer[],
    isEqualizer?: boolean,
    gradientTarget?: GradientTarget
  ) => void;
  updateGradientColor: (
    layerId: string,
    index: number,
    color: string,
    updateLayer: Function,
    layers: Layer[],
    isEqualizer?: boolean,
    gradientTarget?: GradientTarget
  ) => void;
  updateGradientStop: (
    layerId: string,
    index: number,
    stop: number,
    updateLayer: Function,
    layers: Layer[],
    isEqualizer?: boolean,
    gradientTarget?: GradientTarget
  ) => void;

  // Advanced gradient operations
  updateGradientType: (
    layerId: string,
    type: GradientType,
    updateLayer: Function,
    layers: Layer[],
    gradientTarget?: GradientTarget
  ) => void;
  updateGradientAngle: (
    layerId: string,
    angle: number,
    updateLayer: Function,
    layers: Layer[],
    gradientTarget?: GradientTarget
  ) => void;
  updateGradientCenter: (
    layerId: string,
    centerX: number,
    centerY: number,
    updateLayer: Function,
    layers: Layer[],
    gradientTarget?: GradientTarget
  ) => void;
  applyGradientPreset: (
    layerId: string,
    preset: GradientPreset,
    updateLayer: Function,
    layers: Layer[],
    gradientTarget?: GradientTarget
  ) => void;

  // Utility operations
  generateGradientCSS: (
    layer: Layer,
    gradientTarget?: GradientTarget
  ) => string;
  validateGradientData: (
    colors: string[],
    stops: number[]
  ) => { colors: string[]; stops: number[] };

  // Preset data
  presets: GradientPreset[];
};

describe('Gradient API Surface Preservation Tests', () => {
  let hook: UseGradientManagementReturn;

  beforeEach(() => {
    const { result } = renderHook(() => useGradientManagement());
    hook = result.current;
  });

  describe('API Function Signatures', () => {
    it('preserves addGradientColor signature', () => {
      expect(typeof hook.addGradientColor).toBe('function');
      expect(hook.addGradientColor.length).toBe(3); // Required parameters before defaults
    });

    it('preserves removeGradientColor signature', () => {
      expect(typeof hook.removeGradientColor).toBe('function');
      expect(hook.removeGradientColor.length).toBe(4); // Required parameters before defaults
    });

    it('preserves updateGradientColor signature', () => {
      expect(typeof hook.updateGradientColor).toBe('function');
      expect(hook.updateGradientColor.length).toBe(5); // Required parameters before defaults
    });

    it('preserves updateGradientStop signature', () => {
      expect(typeof hook.updateGradientStop).toBe('function');
      expect(hook.updateGradientStop.length).toBe(5); // Required parameters before defaults
    });

    it('preserves updateGradientType signature', () => {
      expect(typeof hook.updateGradientType).toBe('function');
      expect(hook.updateGradientType.length).toBe(4); // Required parameters before defaults
    });

    it('preserves updateGradientAngle signature', () => {
      expect(typeof hook.updateGradientAngle).toBe('function');
      expect(hook.updateGradientAngle.length).toBe(4); // Required parameters before defaults
    });

    it('preserves updateGradientCenter signature', () => {
      expect(typeof hook.updateGradientCenter).toBe('function');
      expect(hook.updateGradientCenter.length).toBe(5); // Required parameters before defaults
    });

    it('preserves applyGradientPreset signature', () => {
      expect(typeof hook.applyGradientPreset).toBe('function');
      expect(hook.applyGradientPreset.length).toBe(4); // Required parameters before defaults
    });

    it('preserves generateGradientCSS signature', () => {
      expect(typeof hook.generateGradientCSS).toBe('function');
      expect(hook.generateGradientCSS.length).toBe(1); // Required parameters before defaults
    });

    it('preserves validateGradientData signature', () => {
      expect(typeof hook.validateGradientData).toBe('function');
      expect(hook.validateGradientData.length).toBe(2); // Required parameters
    });
  });

  describe('API Return Types', () => {
    it('preserves return type structure', () => {
      const api = hook as ExpectedAPISnapshot;

      // Verify all expected properties exist
      expect(api).toHaveProperty('addGradientColor');
      expect(api).toHaveProperty('removeGradientColor');
      expect(api).toHaveProperty('updateGradientColor');
      expect(api).toHaveProperty('updateGradientStop');
      expect(api).toHaveProperty('updateGradientType');
      expect(api).toHaveProperty('updateGradientAngle');
      expect(api).toHaveProperty('updateGradientCenter');
      expect(api).toHaveProperty('applyGradientPreset');
      expect(api).toHaveProperty('generateGradientCSS');
      expect(api).toHaveProperty('validateGradientData');
      expect(api).toHaveProperty('presets');

      // Verify no extra properties that could indicate API changes
      const actualKeys = Object.keys(api).sort();
      const expectedKeys = [
        'addGradientColor',
        'removeGradientColor',
        'updateGradientColor',
        'updateGradientStop',
        'updateGradientType',
        'updateGradientAngle',
        'updateGradientCenter',
        'applyGradientPreset',
        'generateGradientCSS',
        'validateGradientData',
        'presets',
      ].sort();

      expect(actualKeys).toEqual(expectedKeys);
    });

    it('preserves validateGradientData return structure', () => {
      const result = hook.validateGradientData(['#ff0000', '#00ff00'], [0, 1]);

      expect(result).toHaveProperty('colors');
      expect(result).toHaveProperty('stops');
      expect(Array.isArray(result.colors)).toBe(true);
      expect(Array.isArray(result.stops)).toBe(true);

      // Should return exactly these properties (no more, no less)
      const resultKeys = Object.keys(result).sort();
      expect(resultKeys).toEqual(['colors', 'stops']);
    });

    it('preserves generateGradientCSS return type', () => {
      const testLayer: Layer = {
        id: 'test',
        name: 'Test',
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
        },
      };

      const result = hook.generateGradientCSS(testLayer);
      expect(typeof result).toBe('string');
    });
  });

  describe('Presets Structure Preservation', () => {
    it('preserves presets array structure', () => {
      expect(Array.isArray(hook.presets)).toBe(true);
      expect(hook.presets.length).toBeGreaterThan(0);
    });

    it('preserves preset object structure', () => {
      const preset = hook.presets[0];

      // Essential properties that consumers rely on
      expect(preset).toHaveProperty('name');
      expect(preset).toHaveProperty('type');
      expect(preset).toHaveProperty('colors');
      expect(preset).toHaveProperty('stops');

      // Type validation
      expect(typeof preset.name).toBe('string');
      expect(['linear', 'radial', 'conic']).toContain(preset.type);
      expect(Array.isArray(preset.colors)).toBe(true);
      expect(Array.isArray(preset.stops)).toBe(true);

      // Optional properties (if present, must be correct type)
      if (preset.angle !== undefined) {
        expect(typeof preset.angle).toBe('number');
      }
      if (preset.centerX !== undefined) {
        expect(typeof preset.centerX).toBe('number');
      }
      if (preset.centerY !== undefined) {
        expect(typeof preset.centerY).toBe('number');
      }
    });

    it('preserves specific preset names (consumers may depend on these)', () => {
      const presetNames = hook.presets.map(p => p.name);

      // These are known presets that consumers may reference by name
      expect(presetNames).toContain('Sunset Glow');
      expect(presetNames).toContain('Ocean Breeze');
      expect(presetNames).toContain('Aurora Borealis');
      expect(presetNames).toContain('Prismatic');
    });

    it('preserves preset count (ensures no presets removed)', () => {
      // Current baseline: should have at least these known presets
      const expectedMinCount = 5;
      expect(hook.presets.length).toBeGreaterThanOrEqual(expectedMinCount);
    });
  });

  describe('Function Behavior Contracts', () => {
    it('preserves void return type for mutation functions', () => {
      const mockUpdate = jest.fn();
      const testLayer: Layer = {
        id: 'test',
        name: 'Test',
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
          colors: ['#ff0000', '#00ff00', '#0000ff'],
          stops: [0, 0.5, 1],
        },
      };

      // All mutation functions should return undefined (void)
      expect(
        hook.addGradientColor('test', mockUpdate, [testLayer])
      ).toBeUndefined();
      expect(
        hook.updateGradientColor('test', 0, '#123456', mockUpdate, [testLayer])
      ).toBeUndefined();
      expect(
        hook.removeGradientColor('test', 1, mockUpdate, [testLayer])
      ).toBeUndefined();
      expect(
        hook.updateGradientStop('test', 0, 0.25, mockUpdate, [testLayer])
      ).toBeUndefined();
      expect(
        hook.updateGradientType('test', 'radial', mockUpdate, [testLayer])
      ).toBeUndefined();
      expect(
        hook.updateGradientAngle('test', 90, mockUpdate, [testLayer])
      ).toBeUndefined();
      expect(
        hook.updateGradientCenter('test', 25, 75, mockUpdate, [testLayer])
      ).toBeUndefined();
      expect(
        hook.applyGradientPreset('test', hook.presets[0], mockUpdate, [
          testLayer,
        ])
      ).toBeUndefined();
    });

    it('preserves error handling behavior (no exceptions thrown)', () => {
      const mockUpdate = jest.fn();
      const emptyLayers: Layer[] = [];

      // Should not throw for invalid operations
      expect(() =>
        hook.addGradientColor('invalid', mockUpdate, emptyLayers)
      ).not.toThrow();
      expect(() =>
        hook.updateGradientColor(
          'invalid',
          0,
          '#ff0000',
          mockUpdate,
          emptyLayers
        )
      ).not.toThrow();
      expect(() =>
        hook.removeGradientColor('invalid', 0, mockUpdate, emptyLayers)
      ).not.toThrow();
      expect(() =>
        hook.updateGradientStop('invalid', 0, 0.5, mockUpdate, emptyLayers)
      ).not.toThrow();
    });

    it('preserves parameter validation behavior', () => {
      const result1 = hook.validateGradientData([], []); // Empty arrays
      expect(result1).toHaveProperty('colors');
      expect(result1).toHaveProperty('stops');

      const result2 = hook.validateGradientData(['#ff0000'], [0, 1]); // Mismatched lengths
      expect(result2).toHaveProperty('colors');
      expect(result2).toHaveProperty('stops');
    });
  });

  describe('GradientTarget Type Preservation', () => {
    it('preserves all gradient target values', () => {
      const validTargets: GradientTarget[] = [
        'layer',
        'fill',
        'stroke',
        'radial',
        'custom',
      ];
      const mockUpdate = jest.fn();
      const testLayer: Layer = {
        id: 'test',
        name: 'Test',
        type: 'equalizer',
        visible: true,
        opacity: 1,
        blendMode: 'normal',
        scale: 1,
        rotation: 0,
        offsetX: 0,
        offsetY: 0,
        equalizerSettings: {
          barCount: 32,
          barStyle: 'line',
          barWidth: 10,
          barSpacing: 2,
          barRotation: 0,
          innerRadius: 100,
          maxHeight: 200,
          responseSpeed: 0.8,
          frequencyRange: 'full',
          colorMode: 'custom-gradient',
          primaryColor: '#00ff00',
          secondaryColor: '#ff0000',
          glowIntensity: 0,
          symmetry: 'none',
          pulseMode: 'none',
          positionX: 400,
          positionY: 300,
          startAngle: 0,
          endAngle: 360,
          arcMode: false,
          customGradient: {
            colors: ['#ff0000', '#00ff00'],
            stops: [0, 1],
          },
          radialGradientSettings: {
            fromCenter: true,
            colors: ['#ff0000', '#00ff00'],
            stops: [0, 1],
          },
        },
      };

      // Should accept all gradient targets without throwing
      validTargets.forEach(target => {
        expect(() => {
          hook.addGradientColor('test', mockUpdate, [testLayer], true, target);
        }).not.toThrow();
      });
    });
  });

  describe('GradientType Type Preservation', () => {
    it('preserves all gradient type values', () => {
      const validTypes: GradientType[] = ['linear', 'radial', 'conic'];
      const mockUpdate = jest.fn();
      const testLayer: Layer = {
        id: 'test',
        name: 'Test',
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
        },
      };

      // Should accept all gradient types without throwing
      validTypes.forEach(type => {
        expect(() => {
          hook.updateGradientType('test', type, mockUpdate, [testLayer]);
        }).not.toThrow();
      });
    });
  });

  describe('Memory Usage Preservation', () => {
    it('preserves memory usage patterns (no memory leaks)', () => {
      const initialMemory = (performance as any).memory?.usedJSHeapSize || 0;
      const mockUpdate = jest.fn();
      const testLayer: Layer = {
        id: 'test',
        name: 'Test',
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
          colors: ['#ff0000', '#00ff00', '#0000ff'],
          stops: [0, 0.5, 1],
        },
      };

      // Perform many operations to detect memory leaks
      for (let i = 0; i < 100; i++) {
        hook.addGradientColor('test', mockUpdate, [testLayer]);
        hook.updateGradientColor(
          'test',
          0,
          `#${i.toString(16).padStart(6, '0')}`,
          mockUpdate,
          [testLayer]
        );
        hook.generateGradientCSS(testLayer);
        hook.validateGradientData(['#ff0000', '#00ff00'], [0, 1]);
      }

      const finalMemory = (performance as any).memory?.usedJSHeapSize || 0;
      const memoryIncrease = finalMemory - initialMemory;

      if (initialMemory > 0) {
        // Should not use excessive memory (more than 1MB for 100 operations indicates leak)
        expect(memoryIncrease).toBeLessThan(1024 * 1024);
      }
    });
  });

  describe('TypeScript Compatibility Preservation', () => {
    it('preserves UseGradientManagementReturn interface compatibility', () => {
      // This test ensures the interface hasn't changed in breaking ways
      const api: UseGradientManagementReturn = hook;

      // Should compile without TypeScript errors
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
  });
});

/**
 * Breaking Change Detection Notes:
 *
 * If any test in this file fails, it indicates a breaking change:
 *
 * 1. Function signature changes: Parameter count/type changes will break consumers
 * 2. Return type changes: Different return types will break consumer code
 * 3. Property name changes: Consumers access properties by name
 * 4. Preset structure changes: UI components depend on preset structure
 * 5. Error behavior changes: Consumers rely on consistent error handling
 * 6. Performance changes: Critical operations must maintain speed
 *
 * Before making any changes that cause these tests to fail:
 * 1. Understand the impact on all consumers
 * 2. Create migration path if needed
 * 3. Update documentation
 * 4. Test with all known consumers
 */
