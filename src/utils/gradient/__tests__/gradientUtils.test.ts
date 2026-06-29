import {
  hexToRgb,
  rgbToHex,
  hslToRgb,
  rgbToHsl,
  parseColor,
  interpolateColor,
  calculateStops,
  normalizeAngle,
  clampPosition,
  generateGradientCSS,
  formatColorValue,
  parseStopValue,
  validateHexColor,
  validateRgbColor,
  validateHslColor,
  getColorFormat,
  blendColors,
  lightenColor,
  darkenColor,
  getContrastColor,
} from '../gradientUtils';
import { GradientData } from '../gradientTypes';

describe('gradientUtils', () => {
  describe('Color Conversion', () => {
    describe('hexToRgb', () => {
      it('should convert 6-digit hex to rgb', () => {
        expect(hexToRgb('#ff0000')).toEqual({ r: 255, g: 0, b: 0 });
        expect(hexToRgb('#00ff00')).toEqual({ r: 0, g: 255, b: 0 });
        expect(hexToRgb('#0000ff')).toEqual({ r: 0, g: 0, b: 255 });
        expect(hexToRgb('#ffffff')).toEqual({ r: 255, g: 255, b: 255 });
        expect(hexToRgb('#000000')).toEqual({ r: 0, g: 0, b: 0 });
      });

      it('should convert 3-digit hex to rgb', () => {
        expect(hexToRgb('#f00')).toEqual({ r: 255, g: 0, b: 0 });
        expect(hexToRgb('#0f0')).toEqual({ r: 0, g: 255, b: 0 });
        expect(hexToRgb('#00f')).toEqual({ r: 0, g: 0, b: 255 });
        expect(hexToRgb('#fff')).toEqual({ r: 255, g: 255, b: 255 });
        expect(hexToRgb('#000')).toEqual({ r: 0, g: 0, b: 0 });
      });

      it('should handle case insensitivity', () => {
        expect(hexToRgb('#FF0000')).toEqual({ r: 255, g: 0, b: 0 });
        expect(hexToRgb('#AbCdEf')).toEqual({ r: 171, g: 205, b: 239 });
      });

      it('should return null for invalid hex', () => {
        expect(hexToRgb('#gggggg')).toBeNull();
        expect(hexToRgb('#ff')).toBeNull();
        expect(hexToRgb('ff0000')).toBeNull();
        expect(hexToRgb('')).toBeNull();
      });
    });

    describe('rgbToHex', () => {
      it('should convert rgb to hex', () => {
        expect(rgbToHex(255, 0, 0)).toBe('#ff0000');
        expect(rgbToHex(0, 255, 0)).toBe('#00ff00');
        expect(rgbToHex(0, 0, 255)).toBe('#0000ff');
        expect(rgbToHex(255, 255, 255)).toBe('#ffffff');
        expect(rgbToHex(0, 0, 0)).toBe('#000000');
      });

      it('should clamp values to 0-255 range', () => {
        expect(rgbToHex(300, 0, 0)).toBe('#ff0000');
        expect(rgbToHex(-10, 128, 256)).toBe('#0080ff');
      });

      it('should handle decimal values', () => {
        expect(rgbToHex(255.7, 128.3, 0.9)).toBe('#ff8000');
      });
    });

    describe('hslToRgb', () => {
      it('should convert hsl to rgb', () => {
        expect(hslToRgb(0, 100, 50)).toEqual({ r: 255, g: 0, b: 0 });
        expect(hslToRgb(120, 100, 50)).toEqual({ r: 0, g: 255, b: 0 });
        expect(hslToRgb(240, 100, 50)).toEqual({ r: 0, g: 0, b: 255 });
        expect(hslToRgb(0, 0, 100)).toEqual({ r: 255, g: 255, b: 255 });
        expect(hslToRgb(0, 0, 0)).toEqual({ r: 0, g: 0, b: 0 });
      });

      it('should handle edge cases', () => {
        expect(hslToRgb(360, 100, 50)).toEqual({ r: 255, g: 0, b: 0 });
        expect(hslToRgb(0, 0, 50)).toEqual({ r: 128, g: 128, b: 128 });
      });
    });

    describe('rgbToHsl', () => {
      it('should convert rgb to hsl', () => {
        expect(rgbToHsl(255, 0, 0)).toEqual({ h: 0, s: 100, l: 50 });
        expect(rgbToHsl(0, 255, 0)).toEqual({ h: 120, s: 100, l: 50 });
        expect(rgbToHsl(0, 0, 255)).toEqual({ h: 240, s: 100, l: 50 });
        expect(rgbToHsl(255, 255, 255)).toEqual({ h: 0, s: 0, l: 100 });
        expect(rgbToHsl(0, 0, 0)).toEqual({ h: 0, s: 0, l: 0 });
        expect(rgbToHsl(128, 128, 128)).toEqual({ h: 0, s: 0, l: 50 });
      });
    });
  });

  describe('Color Parsing', () => {
    describe('parseColor', () => {
      it('should parse hex colors', () => {
        expect(parseColor('#ff0000')).toEqual({ r: 255, g: 0, b: 0, a: 1 });
        expect(parseColor('#f00')).toEqual({ r: 255, g: 0, b: 0, a: 1 });
      });

      it('should parse rgb colors', () => {
        expect(parseColor('rgb(255, 0, 0)')).toEqual({
          r: 255,
          g: 0,
          b: 0,
          a: 1,
        });
        expect(parseColor('rgb(255,0,0)')).toEqual({
          r: 255,
          g: 0,
          b: 0,
          a: 1,
        });
      });

      it('should parse rgba colors', () => {
        expect(parseColor('rgba(255, 0, 0, 0.5)')).toEqual({
          r: 255,
          g: 0,
          b: 0,
          a: 0.5,
        });
        expect(parseColor('rgba(255,0,0,1)')).toEqual({
          r: 255,
          g: 0,
          b: 0,
          a: 1,
        });
      });

      it('should parse hsl colors', () => {
        const result = parseColor('hsl(0, 100%, 50%)');
        expect(result?.r).toBe(255);
        expect(result?.g).toBe(0);
        expect(result?.b).toBe(0);
        expect(result?.a).toBe(1);
      });

      it('should parse hsla colors', () => {
        const result = parseColor('hsla(0, 100%, 50%, 0.8)');
        expect(result?.r).toBe(255);
        expect(result?.g).toBe(0);
        expect(result?.b).toBe(0);
        expect(result?.a).toBe(0.8);
      });

      it('should return null for invalid colors', () => {
        expect(parseColor('invalid')).toBeNull();
        expect(parseColor('')).toBeNull();
        expect(parseColor('#gggggg')).toBeNull();
      });
    });

    describe('getColorFormat', () => {
      it('should detect color formats', () => {
        expect(getColorFormat('#ff0000')).toBe('hex');
        expect(getColorFormat('#f00')).toBe('hex');
        expect(getColorFormat('rgb(255, 0, 0)')).toBe('rgb');
        expect(getColorFormat('rgba(255, 0, 0, 1)')).toBe('rgba');
        expect(getColorFormat('hsl(0, 100%, 50%)')).toBe('hsl');
        expect(getColorFormat('hsla(0, 100%, 50%, 1)')).toBe('hsla');
        expect(getColorFormat('invalid')).toBe('unknown');
      });
    });
  });

  describe('Color Manipulation', () => {
    describe('interpolateColor', () => {
      it('should interpolate between colors', () => {
        const result = interpolateColor('#ff0000', '#0000ff', 0.5);
        expect(result).toMatch(/^#[0-9a-f]{6}$/);
      });

      it('should return start color at t=0', () => {
        expect(interpolateColor('#ff0000', '#0000ff', 0)).toBe('#ff0000');
      });

      it('should return end color at t=1', () => {
        expect(interpolateColor('#ff0000', '#0000ff', 1)).toBe('#0000ff');
      });

      it('should clamp t value', () => {
        expect(interpolateColor('#ff0000', '#0000ff', -0.5)).toBe('#ff0000');
        expect(interpolateColor('#ff0000', '#0000ff', 1.5)).toBe('#0000ff');
      });
    });

    describe('blendColors', () => {
      it('should blend two colors', () => {
        const result = blendColors('#ff0000', '#0000ff', 0.5);
        expect(result).toMatch(/^#[0-9a-f]{6}$/);
      });
    });

    describe('lightenColor', () => {
      it('should lighten a color', () => {
        const result = lightenColor('#808080', 20);
        expect(result).toMatch(/^#[0-9a-f]{6}$/);

        // Should be lighter than original
        const original = parseColor('#808080');
        const lightened = parseColor(result);
        expect(lightened?.r).toBeGreaterThan(original?.r || 0);
      });
    });

    describe('darkenColor', () => {
      it('should darken a color', () => {
        const result = darkenColor('#808080', 20);
        expect(result).toMatch(/^#[0-9a-f]{6}$/);

        // Should be darker than original
        const original = parseColor('#808080');
        const darkened = parseColor(result);
        expect(darkened?.r).toBeLessThan(original?.r || 255);
      });
    });

    describe('getContrastColor', () => {
      it('should return white for dark colors', () => {
        expect(getContrastColor('#000000')).toBe('#ffffff');
        expect(getContrastColor('#333333')).toBe('#ffffff');
      });

      it('should return black for light colors', () => {
        expect(getContrastColor('#ffffff')).toBe('#000000');
        expect(getContrastColor('#cccccc')).toBe('#000000');
      });
    });
  });

  describe('Stop Calculations', () => {
    describe('calculateStops', () => {
      it('should calculate even stops for multiple colors', () => {
        expect(calculateStops(2)).toEqual([0, 1]);
        expect(calculateStops(3)).toEqual([0, 0.5, 1]);
        expect(calculateStops(4)).toEqual([0, 1 / 3, 2 / 3, 1]);
        expect(calculateStops(5)).toEqual([0, 0.25, 0.5, 0.75, 1]);
      });

      it('should handle edge cases', () => {
        expect(calculateStops(1)).toEqual([0]);
        expect(calculateStops(0)).toEqual([]);
      });

      it('should produce precise values', () => {
        const stops = calculateStops(3);
        expect(stops[1]).toBeCloseTo(0.5, 10);
      });
    });

    describe('parseStopValue', () => {
      it('should parse numeric stop values', () => {
        expect(parseStopValue('0')).toBe(0);
        expect(parseStopValue('0.5')).toBe(0.5);
        expect(parseStopValue('1')).toBe(1);
      });

      it('should parse percentage stop values', () => {
        expect(parseStopValue('0%')).toBe(0);
        expect(parseStopValue('50%')).toBe(0.5);
        expect(parseStopValue('100%')).toBe(1);
      });

      it('should clamp values to 0-1 range', () => {
        expect(parseStopValue('1.5')).toBe(1);
        expect(parseStopValue('-0.5')).toBe(0);
        expect(parseStopValue('150%')).toBe(1);
      });
    });
  });

  describe('Utility Functions', () => {
    describe('normalizeAngle', () => {
      it('should normalize angles to 0-360 range', () => {
        expect(normalizeAngle(0)).toBe(0);
        expect(normalizeAngle(360)).toBe(0);
        expect(normalizeAngle(450)).toBe(90);
        expect(normalizeAngle(-45)).toBe(315);
        expect(normalizeAngle(-360)).toBe(0);
        expect(normalizeAngle(720)).toBe(0);
      });
    });

    describe('clampPosition', () => {
      it('should clamp position to 0-100 range', () => {
        expect(clampPosition(0)).toBe(0);
        expect(clampPosition(50)).toBe(50);
        expect(clampPosition(100)).toBe(100);
        expect(clampPosition(-10)).toBe(0);
        expect(clampPosition(150)).toBe(100);
      });
    });

    describe('formatColorValue', () => {
      it('should format colors consistently', () => {
        expect(formatColorValue('#FF0000')).toBe('#ff0000');
        expect(formatColorValue('RGB(255, 0, 0)')).toBe('rgb(255, 0, 0)');
      });
    });
  });

  describe('CSS Generation', () => {
    describe('generateGradientCSS', () => {
      const linearGradient: GradientData = {
        type: 'linear',
        colors: ['#ff0000', '#00ff00'],
        stops: [0, 1],
        angle: 45,
        centerX: 50,
        centerY: 50,
      };

      const radialGradient: GradientData = {
        type: 'radial',
        colors: ['#ff0000', '#00ff00'],
        stops: [0, 1],
        angle: 0,
        centerX: 25,
        centerY: 75,
      };

      it('should generate linear gradient CSS', () => {
        const css = generateGradientCSS(linearGradient);
        expect(css).toContain('linear-gradient');
        expect(css).toContain('45deg');
        expect(css).toContain('#ff0000');
        expect(css).toContain('#00ff00');
      });

      it('should generate radial gradient CSS', () => {
        const css = generateGradientCSS(radialGradient);
        expect(css).toContain('radial-gradient');
        expect(css).toContain('25%');
        expect(css).toContain('75%');
        expect(css).toContain('#ff0000');
        expect(css).toContain('#00ff00');
      });

      it('should include stop positions', () => {
        const gradientWithStops: GradientData = {
          ...linearGradient,
          colors: ['#ff0000', '#00ff00', '#0000ff'],
          stops: [0, 0.5, 1],
        };

        const css = generateGradientCSS(gradientWithStops);
        expect(css).toContain('0%');
        expect(css).toContain('50%');
        expect(css).toContain('100%');
      });

      it('should handle conic gradients', () => {
        const conicGradient: GradientData = {
          ...linearGradient,
          type: 'conic',
        };

        const css = generateGradientCSS(conicGradient);
        expect(css).toContain('conic-gradient');
      });
    });
  });

  describe('Validation Helpers', () => {
    describe('validateHexColor', () => {
      it('should validate hex colors', () => {
        expect(validateHexColor('#ff0000')).toBe(true);
        expect(validateHexColor('#f00')).toBe(true);
        expect(validateHexColor('#FF0000')).toBe(true);
        expect(validateHexColor('#gggggg')).toBe(false);
        expect(validateHexColor('ff0000')).toBe(false);
      });
    });

    describe('validateRgbColor', () => {
      it('should validate rgb colors', () => {
        expect(validateRgbColor('rgb(255, 0, 0)')).toBe(true);
        expect(validateRgbColor('rgb(255,0,0)')).toBe(true);
        expect(validateRgbColor('rgba(255, 0, 0, 1)')).toBe(true);
        expect(validateRgbColor('rgb(256, 0, 0)')).toBe(false);
        expect(validateRgbColor('rgb(a, b, c)')).toBe(false);
      });
    });

    describe('validateHslColor', () => {
      it('should validate hsl colors', () => {
        expect(validateHslColor('hsl(0, 100%, 50%)')).toBe(true);
        expect(validateHslColor('hsl(0,100%,50%)')).toBe(true);
        expect(validateHslColor('hsla(0, 100%, 50%, 1)')).toBe(true);
        expect(validateHslColor('hsl(361, 100%, 50%)')).toBe(false);
        expect(validateHslColor('hsl(0, 101%, 50%)')).toBe(false);
      });
    });
  });
});
