import { renderHook } from '@testing-library/react';
import { useGradientTargets } from '../useGradientTargets';
import { Layer } from '../../types/layer-types';
import { GradientData } from '../../utils/gradient';

describe('useGradientTargets', () => {
  const mockGradientData: GradientData = {
    type: 'linear',
    colors: ['#ff0000', '#00ff00'],
    stops: [0, 100],
    angle: 45,
  };

  const mockRadialGradientData: GradientData = {
    type: 'radial',
    colors: ['#ff0000', '#00ff00'],
    stops: [0, 100],
    centerX: 50,
    centerY: 50,
  };

  describe('applyToTarget', () => {
    it('should apply gradient to layer target for gradient layer', () => {
      const { result } = renderHook(() => useGradientTargets());
      const layer: Layer = {
        id: '1',
        name: 'Gradient Layer',
        type: 'gradient',
        visible: true,
        opacity: 1,
        blendMode: 'normal',
        scale: 1,
        rotation: 0,
        offsetX: 0,
        offsetY: 0,
      };

      const updates = result.current.applyToTarget(
        layer,
        mockGradientData,
        'layer'
      );

      expect(updates.gradient).toBeDefined();
      expect(updates.gradient?.type).toBe('linear');
      expect(updates.gradient?.colors).toEqual(['#ff0000', '#00ff00']);
      expect(updates.gradient?.angle).toBe(45);
    });

    it('should apply gradient to fill target for circle layer', () => {
      const { result } = renderHook(() => useGradientTargets());
      const layer: Layer = {
        id: '1',
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
          fillColor: '#ffffff',
          strokeColor: '#000000',
          strokeWidth: 2,
        },
      };

      const updates = result.current.applyToTarget(
        layer,
        mockGradientData,
        'fill'
      );

      expect(updates.circleSettings).toBeDefined();
      expect(updates.circleSettings?.fillGradient).toBeDefined();
      expect(updates.circleSettings?.fillGradient?.colors).toEqual([
        '#ff0000',
        '#00ff00',
      ]);
    });

    it('should apply gradient to stroke target for circle layer', () => {
      const { result } = renderHook(() => useGradientTargets());
      const layer: Layer = {
        id: '1',
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
          fillColor: '#ffffff',
          strokeColor: '#000000',
          strokeWidth: 2,
        },
      };

      const updates = result.current.applyToTarget(
        layer,
        mockGradientData,
        'stroke'
      );

      expect(updates.circleSettings).toBeDefined();
      expect(updates.circleSettings?.strokeGradient).toBeDefined();
      expect(updates.circleSettings?.strokeGradient?.colors).toEqual([
        '#ff0000',
        '#00ff00',
      ]);
    });

    it('should apply radial gradient to equalizer layer', () => {
      const { result } = renderHook(() => useGradientTargets());
      const layer: Layer = {
        id: '1',
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
          enabled: true,
          barCount: 10,
          barSpacing: 2,
          barColor: '#ffffff',
        },
      };

      const updates = result.current.applyToTarget(
        layer,
        mockRadialGradientData,
        'radial'
      );

      expect(updates.equalizerSettings).toBeDefined();
      expect(updates.equalizerSettings?.radialGradientSettings).toBeDefined();
      expect(updates.equalizerSettings?.radialGradientSettings?.colors).toEqual(
        ['#ff0000', '#00ff00']
      );
      expect(
        updates.equalizerSettings?.radialGradientSettings?.fromCenter
      ).toBe(true);
    });

    it('should apply custom gradient to equalizer layer', () => {
      const { result } = renderHook(() => useGradientTargets());
      const layer: Layer = {
        id: '1',
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
          enabled: true,
          barCount: 10,
          barSpacing: 2,
          barColor: '#ffffff',
        },
      };

      const updates = result.current.applyToTarget(
        layer,
        mockGradientData,
        'custom'
      );

      expect(updates.equalizerSettings).toBeDefined();
      expect(updates.equalizerSettings?.customGradient).toBeDefined();
      expect(updates.equalizerSettings?.customGradient?.colors).toEqual([
        '#ff0000',
        '#00ff00',
      ]);
    });

    it('should throw error for unknown gradient target', () => {
      const { result } = renderHook(() => useGradientTargets());
      const layer: Layer = {
        id: '1',
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

      expect(() => {
        result.current.applyToTarget(layer, mockGradientData, 'invalid' as any);
      }).toThrow('Unknown gradient target: invalid');
    });

    it('should throw error for invalid target-layer combination', () => {
      const { result } = renderHook(() => useGradientTargets());
      const layer: Layer = {
        id: '1',
        name: 'Image Layer',
        type: 'image',
        visible: true,
        opacity: 1,
        blendMode: 'normal',
        scale: 1,
        rotation: 0,
        offsetX: 0,
        offsetY: 0,
      };

      expect(() => {
        result.current.applyToTarget(layer, mockGradientData, 'layer');
      }).toThrow("Target 'layer' is not valid for layer type 'image'");
    });
  });

  describe('extractFromTarget', () => {
    it('should extract gradient from layer target', () => {
      const { result } = renderHook(() => useGradientTargets());
      const layer: Layer = {
        id: '1',
        name: 'Gradient Layer',
        type: 'gradient',
        visible: true,
        opacity: 1,
        blendMode: 'normal',
        scale: 1,
        rotation: 0,
        offsetX: 0,
        offsetY: 0,
        gradient: mockGradientData,
      };

      const extracted = result.current.extractFromTarget(layer, 'layer');

      expect(extracted).toEqual(mockGradientData);
    });

    it('should extract fill gradient from circle layer', () => {
      const { result } = renderHook(() => useGradientTargets());
      const layer: Layer = {
        id: '1',
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
          fillColor: '#ffffff',
          strokeColor: '#000000',
          strokeWidth: 2,
          fillGradient: mockGradientData,
        },
      };

      const extracted = result.current.extractFromTarget(layer, 'fill');

      expect(extracted).toEqual(mockGradientData);
    });

    it('should extract stroke gradient from circle layer', () => {
      const { result } = renderHook(() => useGradientTargets());
      const layer: Layer = {
        id: '1',
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
          fillColor: '#ffffff',
          strokeColor: '#000000',
          strokeWidth: 2,
          strokeGradient: mockGradientData,
        },
      };

      const extracted = result.current.extractFromTarget(layer, 'stroke');

      expect(extracted).toEqual(mockGradientData);
    });

    it('should extract radial gradient from equalizer layer', () => {
      const { result } = renderHook(() => useGradientTargets());
      const layer: Layer = {
        id: '1',
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
          enabled: true,
          barCount: 10,
          barSpacing: 2,
          barColor: '#ffffff',
          radialGradientSettings: {
            fromCenter: true,
            colors: ['#ff0000', '#00ff00'],
            stops: [0, 100],
          },
        },
      };

      const extracted = result.current.extractFromTarget(layer, 'radial');

      expect(extracted).toBeDefined();
      expect(extracted?.type).toBe('radial');
      expect(extracted?.colors).toEqual(['#ff0000', '#00ff00']);
      expect(extracted?.centerX).toBe(50);
      expect(extracted?.centerY).toBe(50);
    });

    it('should return null for invalid target-layer combination', () => {
      const { result } = renderHook(() => useGradientTargets());
      const layer: Layer = {
        id: '1',
        name: 'Image Layer',
        type: 'image',
        visible: true,
        opacity: 1,
        blendMode: 'normal',
        scale: 1,
        rotation: 0,
        offsetX: 0,
        offsetY: 0,
      };

      const extracted = result.current.extractFromTarget(layer, 'layer');

      expect(extracted).toBeNull();
    });

    it('should return null when no gradient data exists', () => {
      const { result } = renderHook(() => useGradientTargets());
      const layer: Layer = {
        id: '1',
        name: 'Gradient Layer',
        type: 'gradient',
        visible: true,
        opacity: 1,
        blendMode: 'normal',
        scale: 1,
        rotation: 0,
        offsetX: 0,
        offsetY: 0,
      };

      const extracted = result.current.extractFromTarget(layer, 'layer');

      expect(extracted).toBeNull();
    });

    it('should throw error for unknown gradient target', () => {
      const { result } = renderHook(() => useGradientTargets());
      const layer: Layer = {
        id: '1',
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

      expect(() => {
        result.current.extractFromTarget(layer, 'invalid' as any);
      }).toThrow('Unknown gradient target: invalid');
    });
  });

  describe('validateTarget', () => {
    it('should validate layer target for gradient layer', () => {
      const { result } = renderHook(() => useGradientTargets());
      const layer: Layer = {
        id: '1',
        name: 'Gradient Layer',
        type: 'gradient',
        visible: true,
        opacity: 1,
        blendMode: 'normal',
        scale: 1,
        rotation: 0,
        offsetX: 0,
        offsetY: 0,
      };

      expect(result.current.validateTarget(layer, 'layer')).toBe(true);
      expect(result.current.validateTarget(layer, 'fill')).toBe(false);
      expect(result.current.validateTarget(layer, 'stroke')).toBe(false);
    });

    it('should validate fill and stroke targets for circle layer', () => {
      const { result } = renderHook(() => useGradientTargets());
      const layer: Layer = {
        id: '1',
        name: 'Circle Layer',
        type: 'circle',
        visible: true,
        opacity: 1,
        blendMode: 'normal',
        scale: 1,
        rotation: 0,
        offsetX: 0,
        offsetY: 0,
      };

      expect(result.current.validateTarget(layer, 'layer')).toBe(false);
      expect(result.current.validateTarget(layer, 'fill')).toBe(true);
      expect(result.current.validateTarget(layer, 'stroke')).toBe(true);
    });

    it('should validate radial and custom targets for equalizer layer', () => {
      const { result } = renderHook(() => useGradientTargets());
      const layer: Layer = {
        id: '1',
        name: 'Equalizer Layer',
        type: 'equalizer',
        visible: true,
        opacity: 1,
        blendMode: 'normal',
        scale: 1,
        rotation: 0,
        offsetX: 0,
        offsetY: 0,
      };

      expect(result.current.validateTarget(layer, 'layer')).toBe(false);
      expect(result.current.validateTarget(layer, 'radial')).toBe(true);
      expect(result.current.validateTarget(layer, 'custom')).toBe(true);
    });

    it('should return false for unknown target', () => {
      const { result } = renderHook(() => useGradientTargets());
      const layer: Layer = {
        id: '1',
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

      expect(result.current.validateTarget(layer, 'invalid' as any)).toBe(
        false
      );
    });
  });

  describe('getSupportedTargets', () => {
    it('should return supported targets for gradient layer', () => {
      const { result } = renderHook(() => useGradientTargets());
      const layer: Layer = {
        id: '1',
        name: 'Gradient Layer',
        type: 'gradient',
        visible: true,
        opacity: 1,
        blendMode: 'normal',
        scale: 1,
        rotation: 0,
        offsetX: 0,
        offsetY: 0,
      };

      const targets = result.current.getSupportedTargets(layer);

      expect(targets).toEqual(['layer']);
    });

    it('should return supported targets for circle layer', () => {
      const { result } = renderHook(() => useGradientTargets());
      const layer: Layer = {
        id: '1',
        name: 'Circle Layer',
        type: 'circle',
        visible: true,
        opacity: 1,
        blendMode: 'normal',
        scale: 1,
        rotation: 0,
        offsetX: 0,
        offsetY: 0,
      };

      const targets = result.current.getSupportedTargets(layer);

      expect(targets).toContain('fill');
      expect(targets).toContain('stroke');
      expect(targets).not.toContain('layer');
    });

    it('should return supported targets for equalizer layer', () => {
      const { result } = renderHook(() => useGradientTargets());
      const layer: Layer = {
        id: '1',
        name: 'Equalizer Layer',
        type: 'equalizer',
        visible: true,
        opacity: 1,
        blendMode: 'normal',
        scale: 1,
        rotation: 0,
        offsetX: 0,
        offsetY: 0,
      };

      const targets = result.current.getSupportedTargets(layer);

      expect(targets).toContain('radial');
      expect(targets).toContain('custom');
      expect(targets).not.toContain('layer');
    });

    it('should return empty array for unsupported layer types', () => {
      const { result } = renderHook(() => useGradientTargets());
      const layer: Layer = {
        id: '1',
        name: 'Image Layer',
        type: 'image',
        visible: true,
        opacity: 1,
        blendMode: 'normal',
        scale: 1,
        rotation: 0,
        offsetX: 0,
        offsetY: 0,
      };

      const targets = result.current.getSupportedTargets(layer);

      expect(targets).toEqual([]);
    });
  });

  describe('getTargetStrategy', () => {
    it('should return strategy for valid target', () => {
      const { result } = renderHook(() => useGradientTargets());

      const strategy = result.current.getTargetStrategy('layer');

      expect(strategy).toBeDefined();
      expect(strategy.applyGradient).toBeDefined();
      expect(strategy.extractGradient).toBeDefined();
      expect(strategy.validateTarget).toBeDefined();
    });

    it('should throw error for unknown target', () => {
      const { result } = renderHook(() => useGradientTargets());

      expect(() => {
        result.current.getTargetStrategy('invalid' as any);
      }).toThrow('Unknown gradient target: invalid');
    });
  });
});
