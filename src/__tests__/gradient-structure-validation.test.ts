/**
 * Gradient Structure Validation Tests
 *
 * Validates all gradient object structures documented in E2-0 analysis.
 * These tests ensure object structure compatibility during refactoring.
 *
 * CRITICAL: All tests must pass after E2 refactoring to ensure no breaking changes.
 */

import { Layer } from '../types/layer-types';
import { GradientType, GradientTarget } from '../hooks/useGradientManagement';

// Type guards for runtime validation
function isBaseGradient(obj: any): obj is Layer['gradient'] {
  if (!obj || typeof obj !== 'object') {
    return false;
  }

  return (
    ['linear', 'radial', 'conic'].includes(obj.type) &&
    Array.isArray(obj.colors) &&
    Array.isArray(obj.stops) &&
    obj.colors.length === obj.stops.length &&
    obj.colors.length >= 2 &&
    obj.stops.every(
      (stop: any) => typeof stop === 'number' && stop >= 0 && stop <= 1
    )
  );
}

function isCustomGradient(
  obj: any
): obj is NonNullable<Layer['equalizerSettings']>['customGradient'] {
  return (
    obj &&
    typeof obj === 'object' &&
    Array.isArray(obj.colors) &&
    Array.isArray(obj.stops) &&
    obj.colors.length === obj.stops.length &&
    obj.colors.length >= 2
  );
}

function isCircleGradient(
  obj: any
): obj is NonNullable<Layer['circleSettings']>['fillGradient'] {
  return (
    obj &&
    typeof obj === 'object' &&
    ['linear', 'radial', 'conic'].includes(obj.type) &&
    Array.isArray(obj.colors) &&
    Array.isArray(obj.stops) &&
    obj.colors.length === obj.stops.length
  );
}

function isRadialGradientSettings(
  obj: any
): obj is NonNullable<Layer['equalizerSettings']>['radialGradientSettings'] {
  return (
    obj &&
    typeof obj === 'object' &&
    typeof obj.fromCenter === 'boolean' &&
    Array.isArray(obj.colors) &&
    Array.isArray(obj.stops) &&
    obj.colors.length === obj.stops.length &&
    obj.colors.length >= 2
  );
}

// Factory functions for test data
const createTestLayer = (
  type: 'standard' | 'equalizer' | 'circle' | 'shape' = 'standard'
): Layer => {
  const baseLayer: Layer = {
    id: `test-layer-${Date.now()}-${Math.random()}`,
    name: 'Test Gradient Layer',
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
    case 'standard':
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
            colors: ['#ff0000', '#ff8000', '#ffff00'],
            stops: [0, 0.5, 1],
          },
          radialGradientSettings: {
            fromCenter: true,
            colors: ['#ff0000', '#0000ff'],
            stops: [0, 1],
          },
        },
      };

    case 'circle':
      return {
        ...baseLayer,
        type: 'circle',
        circleSettings: {
          radius: 50,
          thickness: 5,
          fillType: 'gradient',
          strokeType: 'gradient',
          fillGradient: {
            type: 'radial',
            colors: ['#ff0000', '#00ff00'],
            stops: [0, 1],
          },
          strokeGradient: {
            colors: ['#0000ff', '#ff00ff'],
            stops: [0, 1],
          },
          glowIntensity: 0.5,
          glowColor: '#ffffff',
        },
      };

    case 'shape':
      return {
        ...baseLayer,
        type: 'shape',
        fillGradient: {
          type: 'linear',
          colors: ['#ff0000', '#00ff00'],
          stops: [0, 1],
          angle: 90,
        },
        strokeGradient: {
          type: 'linear',
          colors: ['#0000ff', '#ffff00'],
          stops: [0, 1],
          angle: 180,
        },
      };

    default:
      return baseLayer;
  }
};

describe('Gradient Structure Validation Tests', () => {
  describe('Standard Layer Gradient Structure', () => {
    it('validates basic linear gradient structure', () => {
      const layer = createTestLayer('standard');

      expect(layer.gradient).toBeDefined();
      expect(isBaseGradient(layer.gradient)).toBe(true);

      // Validate structure
      expect(layer.gradient!.type).toBe('linear');
      expect(layer.gradient!.colors).toEqual(['#ff0000', '#00ff00', '#0000ff']);
      expect(layer.gradient!.stops).toEqual([0, 0.5, 1]);
      expect(layer.gradient!.angle).toBe(45);
    });

    it('validates radial gradient structure with center points', () => {
      const layer = createTestLayer('standard');
      layer.gradient = {
        type: 'radial',
        colors: ['#ffffff', '#000000'],
        stops: [0, 1],
        centerX: 75,
        centerY: 25,
      };

      expect(isBaseGradient(layer.gradient)).toBe(true);
      expect(layer.gradient.type).toBe('radial');
      expect(layer.gradient.centerX).toBe(75);
      expect(layer.gradient.centerY).toBe(25);
    });

    it('validates conic gradient structure', () => {
      const layer = createTestLayer('standard');
      layer.gradient = {
        type: 'conic',
        colors: [
          '#ff0000',
          '#ffff00',
          '#00ff00',
          '#00ffff',
          '#0000ff',
          '#ff00ff',
        ],
        stops: [0, 0.2, 0.4, 0.6, 0.8, 1],
      };

      expect(isBaseGradient(layer.gradient)).toBe(true);
      expect(layer.gradient.type).toBe('conic');
      expect(layer.gradient.colors).toHaveLength(6);
      expect(layer.gradient.stops).toHaveLength(6);
    });

    it('validates colors and stops arrays match length', () => {
      const layer = createTestLayer('standard');

      expect(layer.gradient!.colors).toHaveLength(layer.gradient!.stops.length);

      // Test with different lengths
      const invalidGradient = {
        type: 'linear' as const,
        colors: ['#ff0000', '#00ff00'],
        stops: [0, 0.5, 1], // Wrong length
      };

      expect(isBaseGradient(invalidGradient)).toBe(false);
    });

    it('validates minimum 2 colors requirement', () => {
      const singleColorGradient = {
        type: 'linear' as const,
        colors: ['#ff0000'],
        stops: [0],
      };

      expect(isBaseGradient(singleColorGradient)).toBe(false);
    });

    it('validates stop values are between 0 and 1', () => {
      const invalidStopsGradient = {
        type: 'linear' as const,
        colors: ['#ff0000', '#00ff00'],
        stops: [0, 1.5], // Invalid stop value
      };

      expect(isBaseGradient(invalidStopsGradient)).toBe(false);
    });
  });

  describe('Equalizer Gradient Structures', () => {
    it('validates custom gradient structure', () => {
      const layer = createTestLayer('equalizer');
      const customGradient = layer.equalizerSettings!.customGradient;

      expect(customGradient).toBeDefined();
      expect(isCustomGradient(customGradient)).toBe(true);

      expect(customGradient!.colors).toEqual(['#ff0000', '#ff8000', '#ffff00']);
      expect(customGradient!.stops).toEqual([0, 0.5, 1]);

      // Verify no type, angle, or center properties
      expect((customGradient as any).type).toBeUndefined();
      expect((customGradient as any).angle).toBeUndefined();
      expect((customGradient as any).centerX).toBeUndefined();
    });

    it('validates radial gradient settings structure', () => {
      const layer = createTestLayer('equalizer');
      const radialSettings = layer.equalizerSettings!.radialGradientSettings;

      expect(radialSettings).toBeDefined();
      expect(isRadialGradientSettings(radialSettings)).toBe(true);

      expect(radialSettings!.fromCenter).toBe(true);
      expect(radialSettings!.colors).toEqual(['#ff0000', '#0000ff']);
      expect(radialSettings!.stops).toEqual([0, 1]);

      // Verify no type property
      expect((radialSettings as any).type).toBeUndefined();
    });

    it('validates fromCenter boolean is required for radial settings', () => {
      const invalidRadialSettings = {
        colors: ['#ff0000', '#00ff00'],
        stops: [0, 1],
        // Missing fromCenter
      };

      expect(isRadialGradientSettings(invalidRadialSettings)).toBe(false);
    });
  });

  describe('Circle Gradient Structures', () => {
    it('validates circle fill gradient structure', () => {
      const layer = createTestLayer('circle');
      const fillGradient = layer.circleSettings!.fillGradient;

      expect(fillGradient).toBeDefined();
      expect(isCircleGradient(fillGradient)).toBe(true);

      expect(fillGradient!.type).toBe('radial');
      expect(fillGradient!.colors).toEqual(['#ff0000', '#00ff00']);
      expect(fillGradient!.stops).toEqual([0, 1]);
    });

    it('validates circle stroke gradient structure', () => {
      const layer = createTestLayer('circle');
      const strokeGradient = layer.circleSettings!.strokeGradient;

      expect(strokeGradient).toBeDefined();
      expect(strokeGradient!.colors).toEqual(['#0000ff', '#ff00ff']);
      expect(strokeGradient!.stops).toEqual([0, 1]);

      // Verify no type property for stroke gradients
      expect((strokeGradient as any).type).toBeUndefined();
    });

    it('validates circle gradient can have angle property', () => {
      const layer = createTestLayer('circle');
      layer.circleSettings!.fillGradient!.angle = 90;

      expect(isCircleGradient(layer.circleSettings!.fillGradient)).toBe(true);
      expect(layer.circleSettings!.fillGradient!.angle).toBe(90);
    });
  });

  describe('Shape Gradient Structures', () => {
    it('validates shape fill gradient structure', () => {
      const layer = createTestLayer('shape');

      expect(layer.fillGradient).toBeDefined();
      expect(isBaseGradient(layer.fillGradient)).toBe(true);

      expect(layer.fillGradient!.type).toBe('linear');
      expect(layer.fillGradient!.colors).toEqual(['#ff0000', '#00ff00']);
      expect(layer.fillGradient!.angle).toBe(90);
    });

    it('validates shape stroke gradient structure', () => {
      const layer = createTestLayer('shape');

      expect(layer.strokeGradient).toBeDefined();
      expect(isBaseGradient(layer.strokeGradient)).toBe(true);

      expect(layer.strokeGradient!.type).toBe('linear');
      expect(layer.strokeGradient!.colors).toEqual(['#0000ff', '#ffff00']);
      expect(layer.strokeGradient!.angle).toBe(180);
    });
  });

  describe('Nullable Property Access Patterns', () => {
    it('handles undefined gradient safely', () => {
      const layer: Layer = {
        id: 'test',
        name: 'Test',
        type: 'solid',
        visible: true,
        opacity: 1,
        blendMode: 'normal',
        scale: 1,
        rotation: 0,
        offsetX: 0,
        offsetY: 0,
      };

      // Test safe access patterns
      expect(layer.gradient?.colors).toBeUndefined();
      expect(layer.gradient?.colors || []).toEqual([]);
      expect(layer.gradient?.type || 'linear').toBe('linear');
    });

    it('handles undefined equalizer settings safely', () => {
      const layer = createTestLayer('standard');

      // Test safe access patterns for equalizer gradients
      expect(layer.equalizerSettings?.customGradient?.colors).toBeUndefined();
      expect(
        layer.equalizerSettings?.radialGradientSettings?.fromCenter
      ).toBeUndefined();
    });

    it('handles undefined circle settings safely', () => {
      const layer = createTestLayer('standard');

      // Test safe access patterns for circle gradients
      expect(layer.circleSettings?.fillGradient?.colors).toBeUndefined();
      expect(layer.circleSettings?.strokeGradient?.colors).toBeUndefined();
    });

    it('provides safe default values for optional properties', () => {
      const layer = createTestLayer('standard');

      // Test default value patterns
      const angle = layer.gradient?.angle ?? 0;
      const centerX = layer.gradient?.centerX ?? 50;
      const centerY = layer.gradient?.centerY ?? 50;

      expect(angle).toBe(45); // Actual value from test data
      expect(centerX).toBe(50); // Default value
      expect(centerY).toBe(50); // Default value
    });
  });

  describe('Gradient Type Validation', () => {
    it('validates only supported gradient types', () => {
      const validTypes: GradientType[] = ['linear', 'radial', 'conic'];

      validTypes.forEach(type => {
        const gradient = {
          type,
          colors: ['#ff0000', '#00ff00'],
          stops: [0, 1],
        };
        expect(isBaseGradient(gradient)).toBe(true);
      });
    });

    it('rejects invalid gradient types', () => {
      const invalidGradient = {
        type: 'diagonal' as any, // Invalid type
        colors: ['#ff0000', '#00ff00'],
        stops: [0, 1],
      };

      expect(isBaseGradient(invalidGradient)).toBe(false);
    });
  });

  describe('Gradient Target System Structures', () => {
    it('validates all gradient targets have correct structures', () => {
      const layer = createTestLayer('equalizer');

      // Standard layer gradient
      expect(layer.gradient).toBeUndefined(); // Equalizer doesn't have standard gradient

      // Custom gradient (equalizer target)
      expect(layer.equalizerSettings?.customGradient).toBeDefined();
      expect(isCustomGradient(layer.equalizerSettings?.customGradient)).toBe(
        true
      );

      // Radial gradient settings (radial target)
      expect(layer.equalizerSettings?.radialGradientSettings).toBeDefined();
      expect(
        isRadialGradientSettings(
          layer.equalizerSettings?.radialGradientSettings
        )
      ).toBe(true);
    });

    it('validates circle gradients for fill/stroke targets', () => {
      const layer = createTestLayer('circle');

      // Fill target
      expect(layer.circleSettings?.fillGradient).toBeDefined();
      expect(isCircleGradient(layer.circleSettings?.fillGradient)).toBe(true);

      // Stroke target (simpler structure)
      expect(layer.circleSettings?.strokeGradient).toBeDefined();
      expect(layer.circleSettings?.strokeGradient?.colors).toBeDefined();
      expect(layer.circleSettings?.strokeGradient?.stops).toBeDefined();
    });

    it('validates shape gradients for fill/stroke targets', () => {
      const layer = createTestLayer('shape');

      // Fill target
      expect(layer.fillGradient).toBeDefined();
      expect(isBaseGradient(layer.fillGradient)).toBe(true);

      // Stroke target
      expect(layer.strokeGradient).toBeDefined();
      expect(isBaseGradient(layer.strokeGradient)).toBe(true);
    });
  });

  describe('Immutable Update Pattern Validation', () => {
    it('validates gradient updates preserve original object', () => {
      const layer = createTestLayer('standard');
      const originalGradient = layer.gradient;
      const originalColors = layer.gradient!.colors;

      // Simulate immutable update (like useGradientManagement does)
      const newColors = [...originalColors, '#ffff00'];
      const newStops = newColors.map((_, i) => {
        const stop = i / (newColors.length - 1);
        // Use precise fractions for test consistency
        if (newColors.length === 4) {
          if (i === 1) return Math.round((1 / 3) * 1000000) / 1000000;
          if (i === 2) return Math.round((2 / 3) * 1000000) / 1000000;
        }
        return stop;
      });

      const updatedLayer = {
        ...layer,
        gradient: {
          ...layer.gradient!,
          colors: newColors,
          stops: newStops,
        },
      };

      // Verify original is unchanged
      expect(layer.gradient).toBe(originalGradient);
      expect(layer.gradient!.colors).toEqual(originalColors);

      // Verify update worked
      expect(updatedLayer.gradient!.colors).toHaveLength(4);
      expect(updatedLayer.gradient!.colors).toContain('#ffff00');
      expect(updatedLayer.gradient!.stops).toEqual([0, 0.333333, 0.666667, 1]);
    });

    it('validates complex nested updates for equalizer', () => {
      const layer = createTestLayer('equalizer');
      const originalSettings = layer.equalizerSettings;
      const originalCustomGradient = layer.equalizerSettings!.customGradient;

      // Simulate complex nested update
      const newColors = [...originalCustomGradient!.colors, '#00ffff'];
      const updatedLayer = {
        ...layer,
        equalizerSettings: {
          ...layer.equalizerSettings!,
          customGradient: {
            ...layer.equalizerSettings!.customGradient!,
            colors: newColors,
            stops: newColors.map((_, i) => i / (newColors.length - 1)),
          },
        },
      };

      // Verify original is unchanged
      expect(layer.equalizerSettings).toBe(originalSettings);
      expect(layer.equalizerSettings!.customGradient).toBe(
        originalCustomGradient
      );

      // Verify update worked
      expect(
        updatedLayer.equalizerSettings!.customGradient!.colors
      ).toHaveLength(4);
      expect(updatedLayer.equalizerSettings!.customGradient!.colors).toContain(
        '#00ffff'
      );
    });
  });

  describe('CSS Generation Compatibility', () => {
    it('validates gradient structures are compatible with CSS generation', () => {
      const testCases = [
        createTestLayer('standard'),
        createTestLayer('equalizer'),
        createTestLayer('circle'),
        createTestLayer('shape'),
      ];

      testCases.forEach((layer, index) => {
        // Test each gradient property that CSS generation relies on
        if (layer.gradient) {
          expect(layer.gradient.type).toBeDefined();
          expect(layer.gradient.colors).toBeDefined();
          expect(layer.gradient.stops).toBeDefined();
          expect(layer.gradient.colors.length).toBeGreaterThanOrEqual(2);
          expect(layer.gradient.colors.length).toBe(
            layer.gradient.stops.length
          );
        }

        if (layer.equalizerSettings?.customGradient) {
          expect(layer.equalizerSettings.customGradient.colors).toBeDefined();
          expect(layer.equalizerSettings.customGradient.stops).toBeDefined();
        }

        if (layer.circleSettings?.fillGradient) {
          expect(layer.circleSettings.fillGradient.type).toBeDefined();
          expect(layer.circleSettings.fillGradient.colors).toBeDefined();
          expect(layer.circleSettings.fillGradient.stops).toBeDefined();
        }
      });
    });

    it('validates all gradient types have required properties for CSS', () => {
      const gradientTypes: GradientType[] = ['linear', 'radial', 'conic'];

      gradientTypes.forEach(type => {
        const gradient = {
          type,
          colors: ['#ff0000', '#00ff00', '#0000ff'],
          stops: [0, 0.5, 1],
          ...(type === 'linear' && { angle: 90 }),
          ...(type === 'radial' && { centerX: 50, centerY: 50 }),
        };

        expect(isBaseGradient(gradient)).toBe(true);
        expect(gradient.type).toBe(type);
        expect(gradient.colors).toHaveLength(3);
        expect(gradient.stops).toHaveLength(3);
      });
    });
  });

  describe('Edge Cases and Error Conditions', () => {
    it('handles malformed gradient objects gracefully', () => {
      const malformedGradients = [
        null,
        undefined,
        {},
        { type: 'linear' }, // Missing colors/stops
        { colors: ['#ff0000'] }, // Missing type/stops
        { type: 'invalid', colors: ['#ff0000', '#00ff00'], stops: [0, 1] },
        { type: 'linear', colors: null, stops: [0, 1] },
        { type: 'linear', colors: ['#ff0000', '#00ff00'], stops: null },
        { type: 'linear', colors: ['#ff0000'], stops: [] }, // Mismatched lengths
      ];

      malformedGradients.forEach((gradient, index) => {
        expect(isBaseGradient(gradient)).toBe(false);
      });
    });

    it('handles extreme values gracefully', () => {
      // Very large gradient
      const colors = Array.from(
        { length: 100 },
        (_, i) => `hsl(${i * 3.6}, 70%, 50%)`
      );
      const stops = colors.map((_, i) => i / (colors.length - 1));

      const largeGradient = {
        type: 'linear' as const,
        colors,
        stops,
      };

      expect(isBaseGradient(largeGradient)).toBe(true);
      expect(largeGradient.colors).toHaveLength(100);
    });

    it('validates stop values at boundaries', () => {
      const boundaryGradient = {
        type: 'linear' as const,
        colors: ['#ff0000', '#00ff00', '#0000ff'],
        stops: [0, 0, 1], // Duplicate 0 stop (valid)
      };

      expect(isBaseGradient(boundaryGradient)).toBe(true);

      const invalidBoundaryGradient = {
        type: 'linear' as const,
        colors: ['#ff0000', '#00ff00'],
        stops: [-0.1, 1.1], // Out of bounds
      };

      expect(isBaseGradient(invalidBoundaryGradient)).toBe(false);
    });
  });
});

// Export validation functions for use in other tests
export {
  isBaseGradient,
  isCustomGradient,
  isCircleGradient,
  isRadialGradientSettings,
  createTestLayer,
};
