import { renderHook } from '@testing-library/react';
import { useGradientTargets } from '../../../hooks/useGradientTargets';
import { Layer } from '../../../types/layer-types';
import { GradientData, GradientTarget } from '../../../utils/gradient';

describe('useGradientTargets - Comprehensive Coverage', () => {
  const createGradientData = (
    overrides: Partial<GradientData> = {}
  ): GradientData => ({
    type: 'linear',
    colors: ['#ff0000', '#0000ff'],
    stops: [0, 1],
    angle: 45,
    ...overrides,
  });

  const createGradientLayer = (overrides: Partial<Layer> = {}): Layer => ({
    id: 'gradient-layer',
    name: 'Test Gradient',
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
      colors: ['#ff0000', '#0000ff'],
      stops: [0, 1],
      angle: 0,
    },
    ...overrides,
  });

  const createCircleLayer = (overrides: Partial<Layer> = {}): Layer => ({
    id: 'circle-layer',
    name: 'Test Circle',
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
      strokeWidth: 2,
      fillColor: '#ff0000',
      strokeColor: '#0000ff',
      fillGradient: {
        type: 'linear',
        colors: ['#ff0000', '#00ff00'],
        stops: [0, 1],
        angle: 90,
      },
      strokeGradient: {
        type: 'radial',
        colors: ['#0000ff', '#ffff00'],
        stops: [0, 1],
        centerX: 30,
        centerY: 70,
      },
    },
    ...overrides,
  });

  const createEqualizerLayer = (overrides: Partial<Layer> = {}): Layer => ({
    id: 'equalizer-layer',
    name: 'Test Equalizer',
    type: 'equalizer',
    visible: true,
    opacity: 1,
    blendMode: 'screen',
    scale: 1,
    rotation: 0,
    offsetX: 0,
    offsetY: 0,
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
        fromCenter: true,
        colors: ['#ffffff', '#ff0000'],
        stops: [0, 1],
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
    ...overrides,
  });

  const createShapeLayer = (overrides: Partial<Layer> = {}): Layer => ({
    id: 'shape-layer',
    name: 'Test Shape',
    type: 'shape',
    visible: true,
    opacity: 1,
    blendMode: 'normal',
    scale: 1,
    rotation: 0,
    offsetX: 0,
    offsetY: 0,
    fillGradient: {
      type: 'linear',
      colors: ['#ff0000', '#00ff00'],
      stops: [0, 1],
      angle: 45,
    },
    strokeGradient: {
      type: 'radial',
      colors: ['#0000ff', '#ffff00'],
      stops: [0, 1],
      centerX: 50,
      centerY: 50,
    },
    ...overrides,
  });

  const createTextLayer = (overrides: Partial<Layer> = {}): Layer => ({
    id: 'text-layer',
    name: 'Test Text',
    type: 'text',
    visible: true,
    opacity: 1,
    blendMode: 'normal',
    scale: 1,
    rotation: 0,
    offsetX: 0,
    offsetY: 0,
    fillGradient: {
      type: 'linear',
      colors: ['#ff0000', '#00ff00'],
      stops: [0, 1],
    },
    ...overrides,
  });

  describe('Hook Initialization', () => {
    it('returns all required functions', () => {
      const { result } = renderHook(() => useGradientTargets());

      expect(result.current).toHaveProperty('applyToTarget');
      expect(result.current).toHaveProperty('extractFromTarget');
      expect(result.current).toHaveProperty('validateTarget');
      expect(result.current).toHaveProperty('getSupportedTargets');
      expect(result.current).toHaveProperty('getTargetStrategy');

      expect(typeof result.current.applyToTarget).toBe('function');
      expect(typeof result.current.extractFromTarget).toBe('function');
      expect(typeof result.current.validateTarget).toBe('function');
      expect(typeof result.current.getSupportedTargets).toBe('function');
      expect(typeof result.current.getTargetStrategy).toBe('function');
    });
  });

  describe('Layer Target Strategy', () => {
    describe('applyToTarget', () => {
      it('applies gradient to layer target with all properties', () => {
        const { result } = renderHook(() => useGradientTargets());
        const layer = createGradientLayer();
        const gradient = createGradientData({
          type: 'radial',
          colors: ['#ff0000', '#00ff00', '#0000ff'],
          stops: [0, 0.5, 1],
          angle: 90,
          centerX: 30,
          centerY: 70,
        });

        const updates = result.current.applyToTarget(layer, gradient, 'layer');

        expect(updates).toEqual({
          gradient: {
            type: 'radial',
            colors: ['#ff0000', '#00ff00', '#0000ff'],
            stops: [0, 0.5, 1],
            angle: 90,
            centerX: 30,
            centerY: 70,
          },
        });
      });

      it('applies gradient to layer target without optional properties', () => {
        const { result } = renderHook(() => useGradientTargets());
        const layer = createGradientLayer();
        const gradient = createGradientData({
          type: 'linear',
          colors: ['#ff0000', '#0000ff'],
          stops: [0, 1],
          angle: undefined,
          centerX: undefined,
          centerY: undefined,
        });

        const updates = result.current.applyToTarget(layer, gradient, 'layer');

        expect(updates).toEqual({
          gradient: {
            type: 'linear',
            colors: ['#ff0000', '#0000ff'],
            stops: [0, 1],
          },
        });
      });

      it('throws error for invalid layer type for layer target', () => {
        const { result } = renderHook(() => useGradientTargets());
        const layer = createCircleLayer();
        const gradient = createGradientData();

        expect(() => {
          result.current.applyToTarget(layer, gradient, 'layer');
        }).toThrow("Target 'layer' is not valid for layer type 'circle'");
      });
    });

    describe('extractFromTarget', () => {
      it('extracts gradient from layer target', () => {
        const { result } = renderHook(() => useGradientTargets());
        const layer = createGradientLayer();

        const extracted = result.current.extractFromTarget(layer, 'layer');

        expect(extracted).toEqual({
          type: 'linear',
          colors: ['#ff0000', '#0000ff'],
          stops: [0, 1],
          angle: 0,
        });
      });

      it('returns null for layer without gradient', () => {
        const { result } = renderHook(() => useGradientTargets());
        const layer = createGradientLayer({ gradient: undefined });

        const extracted = result.current.extractFromTarget(layer, 'layer');

        expect(extracted).toBeNull();
      });

      it('returns null for invalid layer type', () => {
        const { result } = renderHook(() => useGradientTargets());
        const layer = createCircleLayer();

        const extracted = result.current.extractFromTarget(layer, 'layer');

        expect(extracted).toBeNull();
      });
    });

    describe('validateTarget', () => {
      it('validates gradient layer for layer target', () => {
        const { result } = renderHook(() => useGradientTargets());
        const layer = createGradientLayer();

        expect(result.current.validateTarget(layer, 'layer')).toBe(true);
      });

      it('invalidates non-gradient layer for layer target', () => {
        const { result } = renderHook(() => useGradientTargets());
        const layer = createCircleLayer();

        expect(result.current.validateTarget(layer, 'layer')).toBe(false);
      });
    });
  });

  describe('Fill Target Strategy', () => {
    describe('applyToTarget', () => {
      it('applies gradient to circle fill target', () => {
        const { result } = renderHook(() => useGradientTargets());
        const layer = createCircleLayer();
        const gradient = createGradientData();

        const updates = result.current.applyToTarget(layer, gradient, 'fill');

        expect(updates).toEqual({
          circleSettings: {
            ...layer.circleSettings,
            fillGradient: gradient,
          },
        });
      });

      it('applies gradient to generic fill target', () => {
        const { result } = renderHook(() => useGradientTargets());
        const layer = createShapeLayer();
        const gradient = createGradientData();

        const updates = result.current.applyToTarget(layer, gradient, 'fill');

        expect(updates).toEqual({
          fillGradient: gradient,
        });
      });

      it('throws error for invalid layer type', () => {
        const { result } = renderHook(() => useGradientTargets());
        const layer = createEqualizerLayer();
        const gradient = createGradientData();

        expect(() => {
          result.current.applyToTarget(layer, gradient, 'fill');
        }).toThrow("Target 'fill' is not valid for layer type 'equalizer'");
      });
    });

    describe('extractFromTarget', () => {
      it('extracts gradient from circle fill target', () => {
        const { result } = renderHook(() => useGradientTargets());
        const layer = createCircleLayer();

        const extracted = result.current.extractFromTarget(layer, 'fill');

        expect(extracted).toEqual(layer.circleSettings!.fillGradient);
      });

      it('extracts gradient from generic fill target', () => {
        const { result } = renderHook(() => useGradientTargets());
        const layer = createShapeLayer();

        const extracted = result.current.extractFromTarget(layer, 'fill');

        expect(extracted).toEqual((layer as any).fillGradient);
      });

      it('returns null for circle without fillGradient', () => {
        const { result } = renderHook(() => useGradientTargets());
        const layer = createCircleLayer({
          circleSettings: {
            ...createCircleLayer().circleSettings!,
            fillGradient: undefined,
          },
        });

        const extracted = result.current.extractFromTarget(layer, 'fill');

        expect(extracted).toBeNull();
      });

      it('returns null for layer without fillGradient', () => {
        const { result } = renderHook(() => useGradientTargets());
        const layer = createTextLayer({ fillGradient: undefined });

        const extracted = result.current.extractFromTarget(layer, 'fill');

        expect(extracted).toBeNull();
      });

      it('returns null for invalid layer type', () => {
        const { result } = renderHook(() => useGradientTargets());
        const layer = createEqualizerLayer();

        const extracted = result.current.extractFromTarget(layer, 'fill');

        expect(extracted).toBeNull();
      });
    });

    describe('validateTarget', () => {
      it('validates circle layer for fill target', () => {
        const { result } = renderHook(() => useGradientTargets());
        const layer = createCircleLayer();

        expect(result.current.validateTarget(layer, 'fill')).toBe(true);
      });

      it('validates shape layer for fill target', () => {
        const { result } = renderHook(() => useGradientTargets());
        const layer = createShapeLayer();

        expect(result.current.validateTarget(layer, 'fill')).toBe(true);
      });

      it('validates text layer for fill target', () => {
        const { result } = renderHook(() => useGradientTargets());
        const layer = createTextLayer();

        expect(result.current.validateTarget(layer, 'fill')).toBe(true);
      });

      it('invalidates equalizer layer for fill target', () => {
        const { result } = renderHook(() => useGradientTargets());
        const layer = createEqualizerLayer();

        expect(result.current.validateTarget(layer, 'fill')).toBe(false);
      });
    });
  });

  describe('Stroke Target Strategy', () => {
    describe('applyToTarget', () => {
      it('applies gradient to circle stroke target', () => {
        const { result } = renderHook(() => useGradientTargets());
        const layer = createCircleLayer();
        const gradient = createGradientData();

        const updates = result.current.applyToTarget(layer, gradient, 'stroke');

        expect(updates).toEqual({
          circleSettings: {
            ...layer.circleSettings,
            strokeGradient: gradient,
          },
        });
      });

      it('applies gradient to generic stroke target', () => {
        const { result } = renderHook(() => useGradientTargets());
        const layer = createShapeLayer();
        const gradient = createGradientData();

        const updates = result.current.applyToTarget(layer, gradient, 'stroke');

        expect(updates).toEqual({
          strokeGradient: gradient,
        });
      });
    });

    describe('extractFromTarget', () => {
      it('extracts gradient from circle stroke target', () => {
        const { result } = renderHook(() => useGradientTargets());
        const layer = createCircleLayer();

        const extracted = result.current.extractFromTarget(layer, 'stroke');

        expect(extracted).toEqual(layer.circleSettings!.strokeGradient);
      });

      it('extracts gradient from generic stroke target', () => {
        const { result } = renderHook(() => useGradientTargets());
        const layer = createShapeLayer();

        const extracted = result.current.extractFromTarget(layer, 'stroke');

        expect(extracted).toEqual((layer as any).strokeGradient);
      });

      it('returns null for circle without strokeGradient', () => {
        const { result } = renderHook(() => useGradientTargets());
        const layer = createCircleLayer({
          circleSettings: {
            ...createCircleLayer().circleSettings!,
            strokeGradient: undefined,
          },
        });

        const extracted = result.current.extractFromTarget(layer, 'stroke');

        expect(extracted).toBeNull();
      });
    });

    describe('validateTarget', () => {
      it('validates supported layer types for stroke target', () => {
        const { result } = renderHook(() => useGradientTargets());

        expect(
          result.current.validateTarget(createCircleLayer(), 'stroke')
        ).toBe(true);
        expect(
          result.current.validateTarget(createShapeLayer(), 'stroke')
        ).toBe(true);
        expect(result.current.validateTarget(createTextLayer(), 'stroke')).toBe(
          true
        );
        expect(
          result.current.validateTarget(createEqualizerLayer(), 'stroke')
        ).toBe(false);
        expect(
          result.current.validateTarget(createGradientLayer(), 'stroke')
        ).toBe(false);
      });
    });
  });

  describe('Radial Target Strategy', () => {
    describe('applyToTarget', () => {
      it('applies gradient to radial target preserving fromCenter', () => {
        const { result } = renderHook(() => useGradientTargets());
        const layer = createEqualizerLayer();
        const gradient = createGradientData({
          colors: ['#ff0000', '#00ff00', '#0000ff'],
          stops: [0, 0.5, 1],
        });

        const updates = result.current.applyToTarget(layer, gradient, 'radial');

        expect(updates).toEqual({
          equalizerSettings: {
            ...layer.equalizerSettings,
            radialGradientSettings: {
              fromCenter: true, // Preserved from existing settings
              colors: ['#ff0000', '#00ff00', '#0000ff'],
              stops: [0, 0.5, 1],
            },
          },
        });
      });

      it('applies gradient to radial target with default fromCenter', () => {
        const { result } = renderHook(() => useGradientTargets());
        const layer = createEqualizerLayer({
          equalizerSettings: {
            ...createEqualizerLayer().equalizerSettings!,
            radialGradientSettings: undefined,
          },
        });
        const gradient = createGradientData();

        const updates = result.current.applyToTarget(layer, gradient, 'radial');

        expect(
          updates.equalizerSettings!.radialGradientSettings!.fromCenter
        ).toBe(true);
      });

      it('throws error for non-equalizer layer', () => {
        const { result } = renderHook(() => useGradientTargets());
        const layer = createCircleLayer();
        const gradient = createGradientData();

        expect(() => {
          result.current.applyToTarget(layer, gradient, 'radial');
        }).toThrow("Target 'radial' is not valid for layer type 'circle'");
      });
    });

    describe('extractFromTarget', () => {
      it('extracts gradient from radial target', () => {
        const { result } = renderHook(() => useGradientTargets());
        const layer = createEqualizerLayer();

        const extracted = result.current.extractFromTarget(layer, 'radial');

        expect(extracted).toEqual({
          type: 'radial',
          colors: ['#ffffff', '#ff0000'],
          stops: [0, 1],
          centerX: 50,
          centerY: 50,
        });
      });

      it('returns null for layer without radialGradientSettings', () => {
        const { result } = renderHook(() => useGradientTargets());
        const layer = createEqualizerLayer({
          equalizerSettings: {
            ...createEqualizerLayer().equalizerSettings!,
            radialGradientSettings: undefined,
          },
        });

        const extracted = result.current.extractFromTarget(layer, 'radial');

        expect(extracted).toBeNull();
      });

      it('returns null for invalid layer type', () => {
        const { result } = renderHook(() => useGradientTargets());
        const layer = createCircleLayer();

        const extracted = result.current.extractFromTarget(layer, 'radial');

        expect(extracted).toBeNull();
      });
    });

    describe('validateTarget', () => {
      it('validates equalizer layer for radial target', () => {
        const { result } = renderHook(() => useGradientTargets());
        const layer = createEqualizerLayer();

        expect(result.current.validateTarget(layer, 'radial')).toBe(true);
      });

      it('invalidates non-equalizer layer for radial target', () => {
        const { result } = renderHook(() => useGradientTargets());
        const layer = createCircleLayer();

        expect(result.current.validateTarget(layer, 'radial')).toBe(false);
      });
    });
  });

  describe('Custom Target Strategy', () => {
    describe('applyToTarget', () => {
      it('applies gradient to custom target', () => {
        const { result } = renderHook(() => useGradientTargets());
        const layer = createEqualizerLayer();
        const gradient = createGradientData({
          colors: ['#ff0000', '#00ff00', '#0000ff'],
          stops: [0, 0.5, 1],
        });

        const updates = result.current.applyToTarget(layer, gradient, 'custom');

        expect(updates).toEqual({
          equalizerSettings: {
            ...layer.equalizerSettings,
            customGradient: {
              colors: ['#ff0000', '#00ff00', '#0000ff'],
              stops: [0, 0.5, 1],
            },
          },
        });
      });

      it('throws error for non-equalizer layer', () => {
        const { result } = renderHook(() => useGradientTargets());
        const layer = createCircleLayer();
        const gradient = createGradientData();

        expect(() => {
          result.current.applyToTarget(layer, gradient, 'custom');
        }).toThrow("Target 'custom' is not valid for layer type 'circle'");
      });
    });

    describe('extractFromTarget', () => {
      it('extracts gradient from custom target', () => {
        const { result } = renderHook(() => useGradientTargets());
        const layer = createEqualizerLayer();

        const extracted = result.current.extractFromTarget(layer, 'custom');

        expect(extracted).toEqual({
          type: 'linear',
          colors: ['#ff0000', '#00ff00'],
          stops: [0, 1],
        });
      });

      it('returns null for layer without customGradient', () => {
        const { result } = renderHook(() => useGradientTargets());
        const layer = createEqualizerLayer({
          equalizerSettings: {
            ...createEqualizerLayer().equalizerSettings!,
            customGradient: undefined,
          },
        });

        const extracted = result.current.extractFromTarget(layer, 'custom');

        expect(extracted).toBeNull();
      });

      it('returns null for invalid layer type', () => {
        const { result } = renderHook(() => useGradientTargets());
        const layer = createCircleLayer();

        const extracted = result.current.extractFromTarget(layer, 'custom');

        expect(extracted).toBeNull();
      });
    });

    describe('validateTarget', () => {
      it('validates equalizer layer for custom target', () => {
        const { result } = renderHook(() => useGradientTargets());
        const layer = createEqualizerLayer();

        expect(result.current.validateTarget(layer, 'custom')).toBe(true);
      });

      it('invalidates non-equalizer layer for custom target', () => {
        const { result } = renderHook(() => useGradientTargets());
        const layer = createCircleLayer();

        expect(result.current.validateTarget(layer, 'custom')).toBe(false);
      });
    });
  });

  describe('Error Handling', () => {
    it('throws error for unknown gradient target in applyToTarget', () => {
      const { result } = renderHook(() => useGradientTargets());
      const layer = createGradientLayer();
      const gradient = createGradientData();

      expect(() => {
        result.current.applyToTarget(
          layer,
          gradient,
          'unknown' as GradientTarget
        );
      }).toThrow('Unknown gradient target: unknown');
    });

    it('throws error for unknown gradient target in extractFromTarget', () => {
      const { result } = renderHook(() => useGradientTargets());
      const layer = createGradientLayer();

      expect(() => {
        result.current.extractFromTarget(layer, 'unknown' as GradientTarget);
      }).toThrow('Unknown gradient target: unknown');
    });

    it('returns false for unknown gradient target in validateTarget', () => {
      const { result } = renderHook(() => useGradientTargets());
      const layer = createGradientLayer();

      expect(
        result.current.validateTarget(layer, 'unknown' as GradientTarget)
      ).toBe(false);
    });

    it('throws error for unknown gradient target in getTargetStrategy', () => {
      const { result } = renderHook(() => useGradientTargets());

      expect(() => {
        result.current.getTargetStrategy('unknown' as GradientTarget);
      }).toThrow('Unknown gradient target: unknown');
    });
  });

  describe('Utility Functions', () => {
    describe('getSupportedTargets', () => {
      it('returns correct targets for gradient layer', () => {
        const { result } = renderHook(() => useGradientTargets());
        const layer = createGradientLayer();

        const targets = result.current.getSupportedTargets(layer);

        expect(targets).toEqual(['layer']);
      });

      it('returns correct targets for circle layer', () => {
        const { result } = renderHook(() => useGradientTargets());
        const layer = createCircleLayer();

        const targets = result.current.getSupportedTargets(layer);

        expect(targets).toContain('fill');
        expect(targets).toContain('stroke');
        expect(targets).not.toContain('layer');
        expect(targets).not.toContain('custom');
        expect(targets).not.toContain('radial');
      });

      it('returns correct targets for equalizer layer', () => {
        const { result } = renderHook(() => useGradientTargets());
        const layer = createEqualizerLayer();

        const targets = result.current.getSupportedTargets(layer);

        expect(targets).toContain('radial');
        expect(targets).toContain('custom');
        expect(targets).not.toContain('layer');
        expect(targets).not.toContain('fill');
        expect(targets).not.toContain('stroke');
      });

      it('returns correct targets for shape layer', () => {
        const { result } = renderHook(() => useGradientTargets());
        const layer = createShapeLayer();

        const targets = result.current.getSupportedTargets(layer);

        expect(targets).toContain('fill');
        expect(targets).toContain('stroke');
        expect(targets).not.toContain('layer');
        expect(targets).not.toContain('custom');
        expect(targets).not.toContain('radial');
      });

      it('returns correct targets for text layer', () => {
        const { result } = renderHook(() => useGradientTargets());
        const layer = createTextLayer();

        const targets = result.current.getSupportedTargets(layer);

        expect(targets).toContain('fill');
        expect(targets).toContain('stroke');
        expect(targets).not.toContain('layer');
        expect(targets).not.toContain('custom');
        expect(targets).not.toContain('radial');
      });

      it('handles layer with unknown type', () => {
        const { result } = renderHook(() => useGradientTargets());
        const layer = createGradientLayer({ type: 'unknown' as any });

        const targets = result.current.getSupportedTargets(layer);

        expect(targets).toEqual([]);
      });
    });

    describe('getTargetStrategy', () => {
      it('returns strategy for layer target', () => {
        const { result } = renderHook(() => useGradientTargets());

        const strategy = result.current.getTargetStrategy('layer');

        expect(strategy).toHaveProperty('applyGradient');
        expect(strategy).toHaveProperty('extractGradient');
        expect(strategy).toHaveProperty('validateTarget');
        expect(typeof strategy.applyGradient).toBe('function');
        expect(typeof strategy.extractGradient).toBe('function');
        expect(typeof strategy.validateTarget).toBe('function');
      });

      it('returns strategy for fill target', () => {
        const { result } = renderHook(() => useGradientTargets());

        const strategy = result.current.getTargetStrategy('fill');

        expect(strategy).toBeDefined();
      });

      it('returns strategy for stroke target', () => {
        const { result } = renderHook(() => useGradientTargets());

        const strategy = result.current.getTargetStrategy('stroke');

        expect(strategy).toBeDefined();
      });

      it('returns strategy for radial target', () => {
        const { result } = renderHook(() => useGradientTargets());

        const strategy = result.current.getTargetStrategy('radial');

        expect(strategy).toBeDefined();
      });

      it('returns strategy for custom target', () => {
        const { result } = renderHook(() => useGradientTargets());

        const strategy = result.current.getTargetStrategy('custom');

        expect(strategy).toBeDefined();
      });
    });
  });

  describe('Integration and Edge Cases', () => {
    it('handles complex gradient data with all properties', () => {
      const { result } = renderHook(() => useGradientTargets());
      const layer = createGradientLayer();
      const gradient: GradientData = {
        type: 'conic',
        colors: ['#ff0000', '#00ff00', '#0000ff', '#ffff00'],
        stops: [0, 0.33, 0.66, 1],
        angle: 180,
        centerX: 25,
        centerY: 75,
      };

      const updates = result.current.applyToTarget(layer, gradient, 'layer');

      expect(updates.gradient).toEqual(gradient);
    });

    it('handles gradient with minimal properties', () => {
      const { result } = renderHook(() => useGradientTargets());
      const layer = createGradientLayer();
      const gradient: GradientData = {
        type: 'linear',
        colors: ['#000000', '#ffffff'],
        stops: [0, 1],
      };

      const updates = result.current.applyToTarget(layer, gradient, 'layer');

      expect(updates.gradient).toEqual({
        type: 'linear',
        colors: ['#000000', '#ffffff'],
        stops: [0, 1],
      });
    });

    it('handles layers with missing optional settings', () => {
      const { result } = renderHook(() => useGradientTargets());
      const layer = createEqualizerLayer({ equalizerSettings: undefined });
      const gradient = createGradientData();

      const updatedLayer = result.current.applyToTarget(
        layer,
        gradient,
        'custom'
      );

      expect(updatedLayer.equalizerSettings?.customGradient).toBeDefined();
      expect(updatedLayer.equalizerSettings?.customGradient?.colors).toEqual(
        gradient.colors
      );
    });

    it('handles circle layer with missing circleSettings', () => {
      const { result } = renderHook(() => useGradientTargets());
      const layer = createCircleLayer({ circleSettings: undefined });

      const extracted = result.current.extractFromTarget(layer, 'fill');

      expect(extracted).toBeNull();
    });

    it('maintains function stability across re-renders', () => {
      const { result, rerender } = renderHook(() => useGradientTargets());

      const firstApplyToTarget = result.current.applyToTarget;
      const firstExtractFromTarget = result.current.extractFromTarget;
      const firstValidateTarget = result.current.validateTarget;
      const firstGetSupportedTargets = result.current.getSupportedTargets;
      const firstGetTargetStrategy = result.current.getTargetStrategy;

      rerender();

      expect(result.current.applyToTarget).toBe(firstApplyToTarget);
      expect(result.current.extractFromTarget).toBe(firstExtractFromTarget);
      expect(result.current.validateTarget).toBe(firstValidateTarget);
      expect(result.current.getSupportedTargets).toBe(firstGetSupportedTargets);
      expect(result.current.getTargetStrategy).toBe(firstGetTargetStrategy);
    });
  });

  describe('Comprehensive Target Coverage', () => {
    const allTargets: GradientTarget[] = [
      'layer',
      'fill',
      'stroke',
      'radial',
      'custom',
    ];

    allTargets.forEach(target => {
      it(`covers all code paths for ${target} target`, () => {
        const { result } = renderHook(() => useGradientTargets());
        const gradient = createGradientData();

        // Test with appropriate layer type
        let layer: Layer;
        let shouldSucceed = false;

        switch (target) {
          case 'layer':
            layer = createGradientLayer();
            shouldSucceed = true;
            break;
          case 'fill':
          case 'stroke':
            layer = createCircleLayer();
            shouldSucceed = true;
            break;
          case 'radial':
          case 'custom':
            layer = createEqualizerLayer();
            shouldSucceed = true;
            break;
          default:
            layer = createGradientLayer();
            shouldSucceed = false;
        }

        // Test validation
        expect(result.current.validateTarget(layer, target)).toBe(
          shouldSucceed
        );

        if (shouldSucceed) {
          // Test apply
          expect(() => {
            result.current.applyToTarget(layer, gradient, target);
          }).not.toThrow();

          // Test extract
          expect(() => {
            result.current.extractFromTarget(layer, target);
          }).not.toThrow();
        }

        // Test strategy retrieval
        expect(() => {
          result.current.getTargetStrategy(target);
        }).not.toThrow();
      });
    });
  });
});
