import {
  validateRange,
  validateOpacity,
  validateScale,
  validateRotation,
  validateOffset,
  validateImageAdjustment,
  hasGradient,
  hasEqualizerSettings,
  hasShapeSpecific,
  hasCircleSettings,
  validateColor,
  validateGradientStops,
  validateGradientColors,
  validateBarCount,
  validateBarWidth,
  validateBarSpacing,
  validateRadius,
  validateAngle,
  validateResponseSpeed,
  validateGlowIntensity,
  validateStrokeWidth,
  validateLayer,
  validateAnimationSpeed,
  validatePositionPercentage,
} from '../layer-validation';
import { Layer } from '../../types/layer-types';

describe('layer-validation utilities', () => {
  describe('Range Validation', () => {
    it('should validate numeric range correctly', () => {
      expect(validateRange(5, 0, 10)).toBe(5);
      expect(validateRange(-5, 0, 10)).toBe(0);
      expect(validateRange(15, 0, 10)).toBe(10);
    });

    it('should validate opacity range', () => {
      expect(validateOpacity(0.5)).toBe(0.5);
      expect(validateOpacity(-0.1)).toBe(0);
      expect(validateOpacity(1.5)).toBe(1);
    });

    it('should validate scale range', () => {
      expect(validateScale(1.5)).toBe(1.5);
      expect(validateScale(0.05)).toBe(0.1);
      expect(validateScale(5)).toBe(3);
    });

    it('should validate rotation with normalization', () => {
      expect(validateRotation(45)).toBe(45);
      expect(validateRotation(360)).toBe(0);
      expect(validateRotation(450)).toBe(90);
      expect(validateRotation(-45)).toBe(315);
    });

    it('should validate offset range', () => {
      expect(validateOffset(100)).toBe(100);
      expect(validateOffset(-600)).toBe(-500);
      expect(validateOffset(600)).toBe(500);
    });

    it('should validate image adjustment range', () => {
      expect(validateImageAdjustment(1.5)).toBe(1.5);
      expect(validateImageAdjustment(-0.5)).toBe(0);
      expect(validateImageAdjustment(3)).toBe(2);
    });
  });

  describe('Type Guards', () => {
    const baseLayer: Layer = {
      id: 'test',
      name: 'Test Layer',
      type: 'solid',
      visible: true,
      opacity: 1,
      blendMode: 'normal',
      scale: 1,
      rotation: 0,
      offsetX: 0,
      offsetY: 0,
    };

    it('should detect gradient presence', () => {
      const layerWithGradient = {
        ...baseLayer,
        gradient: {
          type: 'linear' as const,
          colors: ['#ff0000', '#00ff00'],
          stops: [0, 1],
        },
      };

      expect(hasGradient(layerWithGradient)).toBe(true);
      expect(hasGradient(baseLayer)).toBe(false);
    });

    it('should detect equalizer settings presence', () => {
      const layerWithEqualizer = {
        ...baseLayer,
        equalizerSettings: {
          barCount: 64,
          barStyle: 'line' as const,
          barWidth: 2,
          barSpacing: 1,
          barRotation: 0,
          innerRadius: 0,
          maxHeight: 200,
          responseSpeed: 0.5,
          frequencyRange: 'full' as const,
          colorMode: 'solid' as const,
          primaryColor: '#ff0000',
          secondaryColor: '#00ff00',
          glowIntensity: 0.5,
          symmetry: 'none' as const,
          pulseMode: 'none' as const,
          positionX: 0.5,
          positionY: 0.5,
          startAngle: 0,
          endAngle: 360,
          arcMode: false,
        },
      };

      expect(hasEqualizerSettings(layerWithEqualizer)).toBe(true);
      expect(hasEqualizerSettings(baseLayer)).toBe(false);
    });

    it('should detect shape-specific properties', () => {
      const layerWithShapeSpecific = {
        ...baseLayer,
        shapeSpecific: { radius: 50 },
      };

      expect(hasShapeSpecific(layerWithShapeSpecific)).toBe(true);
      expect(hasShapeSpecific(baseLayer)).toBe(false);
    });

    it('should detect circle settings', () => {
      const layerWithCircleSettings = {
        ...baseLayer,
        circleSettings: {
          radius: 50,
          thickness: 5,
          fillType: 'solid' as const,
          strokeType: 'solid' as const,
          glowIntensity: 0.5,
        },
      };

      expect(hasCircleSettings(layerWithCircleSettings)).toBe(true);
      expect(hasCircleSettings(baseLayer)).toBe(false);
    });
  });

  describe('Color Validation', () => {
    it('should validate valid hex colors', () => {
      expect(validateColor('#ff0000')).toBe('#ff0000');
      expect(validateColor('#f00')).toBe('#f00');
      expect(validateColor('#123ABC')).toBe('#123ABC');
    });

    it('should fallback to white for invalid colors', () => {
      expect(validateColor('invalid')).toBe('#ffffff');
      expect(validateColor('#gg0000')).toBe('#ffffff');
      expect(validateColor('red')).toBe('#ffffff');
    });
  });

  describe('Gradient Validation', () => {
    it('should validate and sort gradient stops', () => {
      const stops = [0.8, 0.2, 0.5, 1.2, -0.1];
      const validated = validateGradientStops(stops);

      expect(validated).toEqual([0, 0.2, 0.5, 0.8, 1]);
    });

    it('should validate gradient colors and provide defaults', () => {
      expect(validateGradientColors(['#ff0000', '#00ff00'])).toEqual([
        '#ff0000',
        '#00ff00',
      ]);
      expect(validateGradientColors([])).toEqual(['#ffffff', '#000000']);
      expect(validateGradientColors(['#ff0000'])).toEqual([
        '#ffffff',
        '#000000',
      ]);
    });
  });

  describe('Equalizer Property Validation', () => {
    it('should validate bar count within range', () => {
      expect(validateBarCount(64)).toBe(64);
      expect(validateBarCount(5)).toBe(8);
      expect(validateBarCount(300)).toBe(256);
    });

    it('should validate bar width', () => {
      expect(validateBarWidth(5)).toBe(5);
      expect(validateBarWidth(0.1)).toBe(0.5);
      expect(validateBarWidth(100)).toBe(50);
    });

    it('should validate bar spacing', () => {
      expect(validateBarSpacing(2)).toBe(2);
      expect(validateBarSpacing(-1)).toBe(0);
      expect(validateBarSpacing(25)).toBe(20);
    });

    it('should validate radius values', () => {
      expect(validateRadius(100)).toBe(100);
      expect(validateRadius(-10)).toBe(0);
      expect(validateRadius(600)).toBe(500);
    });

    it('should validate angles', () => {
      expect(validateAngle(180)).toBe(180);
      expect(validateAngle(-10)).toBe(0);
      expect(validateAngle(400)).toBe(360);
    });

    it('should validate response speed', () => {
      expect(validateResponseSpeed(0.5)).toBe(0.5);
      expect(validateResponseSpeed(-0.1)).toBe(0);
      expect(validateResponseSpeed(1.5)).toBe(1);
    });

    it('should validate glow intensity', () => {
      expect(validateGlowIntensity(0.7)).toBe(0.7);
      expect(validateGlowIntensity(-0.2)).toBe(0);
      expect(validateGlowIntensity(1.5)).toBe(1);
    });

    it('should validate stroke width', () => {
      expect(validateStrokeWidth(5)).toBe(5);
      expect(validateStrokeWidth(-1)).toBe(0);
      expect(validateStrokeWidth(150)).toBe(100);
    });
  });

  describe('Animation and Position Validation', () => {
    it('should validate animation speed', () => {
      expect(validateAnimationSpeed(2)).toBe(2);
      expect(validateAnimationSpeed(0.05)).toBe(0.1);
      expect(validateAnimationSpeed(10)).toBe(5);
    });

    it('should validate position percentages', () => {
      expect(validatePositionPercentage(0.5)).toBe(0.5);
      expect(validatePositionPercentage(-0.1)).toBe(0);
      expect(validatePositionPercentage(1.5)).toBe(1);
    });
  });

  describe('Comprehensive Layer Validation', () => {
    it('should validate all layer properties', () => {
      const invalidLayer: Partial<Layer> = {
        opacity: 1.5,
        scale: 0.05,
        rotation: 450,
        offsetX: -600,
        offsetY: 700,
        brightness: -0.5,
        contrast: 3,
        color: 'invalid-color',
        fillColor: '#gg0000',
        strokeColor: '#123',
        strokeWidth: 150,
        gradient: {
          type: 'linear',
          colors: ['#ff0000', 'invalid'],
          stops: [1.2, -0.1],
          angle: 400,
        },
      };

      const validated = validateLayer(invalidLayer);

      expect(validated.opacity).toBe(1);
      expect(validated.scale).toBe(0.1);
      expect(validated.rotation).toBe(90);
      expect(validated.offsetX).toBe(-500);
      expect(validated.offsetY).toBe(500);
      expect(validated.brightness).toBe(0);
      expect(validated.contrast).toBe(2);
      expect(validated.color).toBe('#ffffff');
      expect(validated.fillColor).toBe('#ffffff');
      expect(validated.strokeColor).toBe('#123');
      expect(validated.strokeWidth).toBe(100);
      expect(validated.gradient!.colors).toEqual(['#ff0000', '#ffffff']);
      expect(validated.gradient!.stops).toEqual([0, 1]);
      expect(validated.gradient!.angle).toBe(360);
    });

    it('should preserve valid values', () => {
      const validLayer: Partial<Layer> = {
        opacity: 0.8,
        scale: 1.5,
        rotation: 45,
        offsetX: 100,
        offsetY: -50,
        brightness: 1.2,
        contrast: 0.8,
        color: '#ff0000',
      };

      const validated = validateLayer(validLayer);

      expect(validated).toEqual(validLayer);
    });
  });
});
