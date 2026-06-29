import { renderHook } from '@testing-library/react';
import { useGradientValidation } from '../useGradientValidation';

describe('useGradientValidation', () => {
  let validation: ReturnType<typeof useGradientValidation>;

  beforeEach(() => {
    const { result } = renderHook(() => useGradientValidation());
    validation = result.current;
  });

  describe('validateColor', () => {
    describe('valid hex colors', () => {
      it('should validate 6-digit hex colors', () => {
        expect(validation.validateColor('#ffffff')).toBe(true);
        expect(validation.validateColor('#000000')).toBe(true);
        expect(validation.validateColor('#ff0000')).toBe(true);
        expect(validation.validateColor('#FF0000')).toBe(true);
        expect(validation.validateColor('#abc123')).toBe(true);
      });

      it('should validate 3-digit hex colors', () => {
        expect(validation.validateColor('#fff')).toBe(true);
        expect(validation.validateColor('#000')).toBe(true);
        expect(validation.validateColor('#f00')).toBe(true);
        expect(validation.validateColor('#ABC')).toBe(true);
      });
    });

    describe('valid rgb colors', () => {
      it('should validate standard rgb colors', () => {
        expect(validation.validateColor('rgb(255, 255, 255)')).toBe(true);
        expect(validation.validateColor('rgb(0, 0, 0)')).toBe(true);
        expect(validation.validateColor('rgb(255, 0, 0)')).toBe(true);
        expect(validation.validateColor('rgb(128, 128, 128)')).toBe(true);
      });

      it('should validate rgb colors with no spaces', () => {
        expect(validation.validateColor('rgb(255,255,255)')).toBe(true);
        expect(validation.validateColor('rgb(0,0,0)')).toBe(true);
      });

      it('should validate rgb colors with extra spaces', () => {
        expect(validation.validateColor('rgb( 255 , 255 , 255 )')).toBe(true);
        expect(validation.validateColor('rgb(  0  ,  0  ,  0  )')).toBe(true);
      });
    });

    describe('valid rgba colors', () => {
      it('should validate rgba colors', () => {
        expect(validation.validateColor('rgba(255, 255, 255, 1)')).toBe(true);
        expect(validation.validateColor('rgba(0, 0, 0, 0.5)')).toBe(true);
        expect(validation.validateColor('rgba(255, 0, 0, 0.8)')).toBe(true);
        expect(validation.validateColor('rgba(128, 128, 128, 0)')).toBe(true);
      });
    });

    describe('valid hsl colors', () => {
      it('should validate hsl colors', () => {
        expect(validation.validateColor('hsl(0, 0%, 100%)')).toBe(true);
        expect(validation.validateColor('hsl(360, 100%, 50%)')).toBe(true);
        expect(validation.validateColor('hsl(180, 50%, 25%)')).toBe(true);
      });

      it('should validate hsl colors with no spaces', () => {
        expect(validation.validateColor('hsl(0,0%,100%)')).toBe(true);
        expect(validation.validateColor('hsl(180,50%,25%)')).toBe(true);
      });

      it('should validate hsl colors with extra spaces', () => {
        expect(validation.validateColor('hsl( 0 , 0% , 100% )')).toBe(true);
        expect(validation.validateColor('hsl(  180  ,  50%  ,  25%  )')).toBe(
          true
        );
      });
    });

    describe('valid hsla colors', () => {
      it('should validate hsla colors', () => {
        expect(validation.validateColor('hsla(0, 0%, 100%, 1)')).toBe(true);
        expect(validation.validateColor('hsla(180, 50%, 25%, 0.5)')).toBe(true);
        expect(validation.validateColor('hsla(360, 100%, 50%, 0)')).toBe(true);
      });
    });

    describe('invalid colors', () => {
      it('should reject invalid hex colors', () => {
        expect(validation.validateColor('#')).toBe(false);
        expect(validation.validateColor('#ff')).toBe(false);
        expect(validation.validateColor('#ffff')).toBe(false);
        expect(validation.validateColor('#fffff')).toBe(false);
        expect(validation.validateColor('#fffffff')).toBe(false);
        expect(validation.validateColor('#gggggg')).toBe(false);
        expect(validation.validateColor('ffffff')).toBe(false);
      });

      it('should reject invalid rgb colors', () => {
        expect(validation.validateColor('rgb()')).toBe(false);
        expect(validation.validateColor('rgb(255)')).toBe(false);
        expect(validation.validateColor('rgb(255, 255)')).toBe(false);
        expect(validation.validateColor('rgb(255, 255, 255, 255)')).toBe(false);
        expect(validation.validateColor('rgb(256, 255, 255)')).toBe(false);
        expect(validation.validateColor('rgb(-1, 255, 255)')).toBe(false);
        expect(validation.validateColor('rgb(a, b, c)')).toBe(false);
      });

      it('should reject invalid hsl colors', () => {
        expect(validation.validateColor('hsl()')).toBe(false);
        expect(validation.validateColor('hsl(0)')).toBe(false);
        expect(validation.validateColor('hsl(0, 0)')).toBe(false);
        expect(validation.validateColor('hsl(0, 0, 0)')).toBe(false);
        expect(validation.validateColor('hsl(0, 0%, 0%, 0%)')).toBe(false);
        expect(validation.validateColor('hsl(361, 0%, 0%)')).toBe(false);
        expect(validation.validateColor('hsl(0, 101%, 0%)')).toBe(false);
        expect(validation.validateColor('hsl(0, 0%, 101%)')).toBe(false);
      });

      it('should reject other invalid formats', () => {
        expect(validation.validateColor('')).toBe(false);
        expect(validation.validateColor('red')).toBe(false);
        expect(validation.validateColor('blue')).toBe(false);
        expect(validation.validateColor('transparent')).toBe(false);
        expect(validation.validateColor('123456')).toBe(false);
        expect(validation.validateColor('invalid')).toBe(false);
      });
    });
  });

  describe('validateStops', () => {
    it('should validate valid stop arrays', () => {
      expect(validation.validateStops([0, 1])).toBe(true);
      expect(validation.validateStops([0, 0.5, 1])).toBe(true);
      expect(validation.validateStops([0, 0.25, 0.5, 0.75, 1])).toBe(true);
      expect(validation.validateStops([0.2, 0.8])).toBe(true);
    });

    it('should validate stops with same values', () => {
      expect(validation.validateStops([0, 0, 1])).toBe(true);
      expect(validation.validateStops([0, 0.5, 0.5, 1])).toBe(true);
    });

    it('should validate single stop', () => {
      expect(validation.validateStops([0.5])).toBe(true);
    });

    it('should validate empty stops array', () => {
      expect(validation.validateStops([])).toBe(true);
    });

    it('should reject stops outside 0-1 range', () => {
      expect(validation.validateStops([0, 1.1])).toBe(false);
      expect(validation.validateStops([-0.1, 1])).toBe(false);
      expect(validation.validateStops([0, 0.5, 2])).toBe(false);
    });

    it('should reject unordered stops', () => {
      expect(validation.validateStops([1, 0])).toBe(false);
      expect(validation.validateStops([0, 0.8, 0.3, 1])).toBe(false);
      expect(validation.validateStops([0.5, 0.2, 0.9])).toBe(false);
    });
  });

  describe('validateAngle', () => {
    it('should validate valid angles', () => {
      expect(validation.validateAngle(0)).toBe(true);
      expect(validation.validateAngle(90)).toBe(true);
      expect(validation.validateAngle(180)).toBe(true);
      expect(validation.validateAngle(270)).toBe(true);
      expect(validation.validateAngle(360)).toBe(true);
      expect(validation.validateAngle(45.5)).toBe(true);
    });

    it('should reject angles outside 0-360 range', () => {
      expect(validation.validateAngle(-1)).toBe(false);
      expect(validation.validateAngle(361)).toBe(false);
      expect(validation.validateAngle(-90)).toBe(false);
      expect(validation.validateAngle(450)).toBe(false);
    });

    it('should reject non-numeric angles', () => {
      expect(validation.validateAngle(NaN)).toBe(false);
      expect(validation.validateAngle(Infinity)).toBe(false);
      expect(validation.validateAngle(-Infinity)).toBe(false);
    });
  });

  describe('validatePosition', () => {
    it('should validate valid positions', () => {
      expect(validation.validatePosition(0)).toBe(true);
      expect(validation.validatePosition(50)).toBe(true);
      expect(validation.validatePosition(100)).toBe(true);
      expect(validation.validatePosition(25.5)).toBe(true);
    });

    it('should reject positions outside 0-100 range', () => {
      expect(validation.validatePosition(-1)).toBe(false);
      expect(validation.validatePosition(101)).toBe(false);
      expect(validation.validatePosition(-50)).toBe(false);
      expect(validation.validatePosition(150)).toBe(false);
    });

    it('should reject non-numeric positions', () => {
      expect(validation.validatePosition(NaN)).toBe(false);
      expect(validation.validatePosition(Infinity)).toBe(false);
      expect(validation.validatePosition(-Infinity)).toBe(false);
    });
  });

  describe('validateGradientData', () => {
    it('should validate valid gradient data', () => {
      const result = validation.validateGradientData(
        ['#ff0000', '#00ff00'],
        [0, 1]
      );

      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('should validate complex gradient data', () => {
      const result = validation.validateGradientData(
        ['#ff0000', 'rgb(0, 255, 0)', 'hsl(240, 100%, 50%)'],
        [0, 0.5, 1]
      );

      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('should reject gradient with less than 2 colors', () => {
      const result = validation.validateGradientData(['#ff0000'], [0]);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Gradient must have at least 2 colors');
    });

    it('should reject mismatched colors and stops arrays', () => {
      const result = validation.validateGradientData(
        ['#ff0000', '#00ff00'],
        [0, 0.5, 1]
      );

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        'Colors and stops arrays must have same length'
      );
    });

    it('should reject invalid colors', () => {
      const result = validation.validateGradientData(
        ['#ff0000', 'invalid-color'],
        [0, 1]
      );

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        'Invalid color at index 1: invalid-color'
      );
    });

    it('should reject invalid stops', () => {
      const result = validation.validateGradientData(
        ['#ff0000', '#00ff00'],
        [0, 1.5]
      );

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Invalid stop values or ordering');
    });

    it('should return multiple errors', () => {
      const result = validation.validateGradientData(
        ['invalid1', 'invalid2'],
        [0, 1.5]
      );

      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(3);
      expect(result.errors).toContain('Invalid color at index 0: invalid1');
      expect(result.errors).toContain('Invalid color at index 1: invalid2');
      expect(result.errors).toContain('Invalid stop values or ordering');
    });

    it('should handle empty arrays', () => {
      const result = validation.validateGradientData([], []);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Gradient must have at least 2 colors');
    });
  });

  describe('validateGradient', () => {
    const validGradient = {
      type: 'linear' as const,
      colors: ['#ff0000', '#00ff00'],
      stops: [0, 1],
      angle: 45,
      centerX: 50,
      centerY: 50,
    };

    it('should validate complete gradient object', () => {
      const result = validation.validateGradient(validGradient);

      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('should validate radial gradient', () => {
      const radialGradient = {
        ...validGradient,
        type: 'radial' as const,
      };

      const result = validation.validateGradient(radialGradient);

      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('should reject gradient with invalid angle', () => {
      const invalidGradient = {
        ...validGradient,
        angle: 400,
      };

      const result = validation.validateGradient(invalidGradient);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        'Invalid angle: must be between 0 and 360 degrees'
      );
    });

    it('should reject gradient with invalid center position', () => {
      const invalidGradient = {
        ...validGradient,
        centerX: 150,
        centerY: -10,
      };

      const result = validation.validateGradient(invalidGradient);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        'Invalid centerX: must be between 0 and 100'
      );
      expect(result.errors).toContain(
        'Invalid centerY: must be between 0 and 100'
      );
    });

    it('should combine color/stop errors with property errors', () => {
      const invalidGradient = {
        ...validGradient,
        colors: ['invalid'],
        stops: [0, 1],
        angle: 400,
      };

      const result = validation.validateGradient(invalidGradient);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(1);
    });
  });
});
