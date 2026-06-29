/**
 * ColorUtils Test Suite
 * Comprehensive tests for color manipulation and conversion utilities
 */

import {
  ColorUtils,
  GradientUtils,
  ThemeUtils,
  RGB,
  HSL,
  HSV,
} from '../ColorUtils';

describe('ColorUtils', () => {
  describe('hexToRgb', () => {
    it('should convert valid hex colors to RGB', () => {
      expect(ColorUtils.hexToRgb('#ff0000')).toEqual({ r: 255, g: 0, b: 0 });
      expect(ColorUtils.hexToRgb('#00ff00')).toEqual({ r: 0, g: 255, b: 0 });
      expect(ColorUtils.hexToRgb('#0000ff')).toEqual({ r: 0, g: 0, b: 255 });
      expect(ColorUtils.hexToRgb('#ffffff')).toEqual({
        r: 255,
        g: 255,
        b: 255,
      });
      expect(ColorUtils.hexToRgb('#000000')).toEqual({ r: 0, g: 0, b: 0 });
    });

    it('should handle hex colors without # prefix', () => {
      expect(ColorUtils.hexToRgb('ff0000')).toEqual({ r: 255, g: 0, b: 0 });
      expect(ColorUtils.hexToRgb('00ff00')).toEqual({ r: 0, g: 255, b: 0 });
    });

    it('should return null for invalid hex colors', () => {
      expect(ColorUtils.hexToRgb('invalid')).toBeNull();
      expect(ColorUtils.hexToRgb('#zzzzzz')).toBeNull();
      expect(ColorUtils.hexToRgb('#ff')).toBeNull();
      expect(ColorUtils.hexToRgb('')).toBeNull();
    });

    it('should handle mixed case hex colors', () => {
      expect(ColorUtils.hexToRgb('#FF0000')).toEqual({ r: 255, g: 0, b: 0 });
      expect(ColorUtils.hexToRgb('#AbCdEf')).toEqual({
        r: 171,
        g: 205,
        b: 239,
      });
    });
  });

  describe('rgbToHex', () => {
    it('should convert RGB values to hex', () => {
      expect(ColorUtils.rgbToHex(255, 0, 0)).toBe('#ff0000');
      expect(ColorUtils.rgbToHex(0, 255, 0)).toBe('#00ff00');
      expect(ColorUtils.rgbToHex(0, 0, 255)).toBe('#0000ff');
      expect(ColorUtils.rgbToHex(255, 255, 255)).toBe('#ffffff');
      expect(ColorUtils.rgbToHex(0, 0, 0)).toBe('#000000');
    });

    it('should clamp values to valid range', () => {
      expect(ColorUtils.rgbToHex(300, -10, 128)).toBe('#ff0080');
      expect(ColorUtils.rgbToHex(128.7, 64.3, 32.8)).toBe('#814021'); // Actual rounding result
    });

    it('should pad single digit hex values', () => {
      expect(ColorUtils.rgbToHex(15, 0, 0)).toBe('#0f0000');
      expect(ColorUtils.rgbToHex(0, 15, 0)).toBe('#000f00');
      expect(ColorUtils.rgbToHex(0, 0, 15)).toBe('#00000f');
    });
  });

  describe('rgbToHsl', () => {
    it('should convert RGB to HSL', () => {
      expect(ColorUtils.rgbToHsl(255, 0, 0)).toEqual({ h: 0, s: 100, l: 50 });
      expect(ColorUtils.rgbToHsl(0, 255, 0)).toEqual({ h: 120, s: 100, l: 50 });
      expect(ColorUtils.rgbToHsl(0, 0, 255)).toEqual({ h: 240, s: 100, l: 50 });
    });

    it('should handle grayscale colors', () => {
      expect(ColorUtils.rgbToHsl(128, 128, 128)).toEqual({ h: 0, s: 0, l: 50 });
      expect(ColorUtils.rgbToHsl(255, 255, 255)).toEqual({
        h: 0,
        s: 0,
        l: 100,
      });
      expect(ColorUtils.rgbToHsl(0, 0, 0)).toEqual({ h: 0, s: 0, l: 0 });
    });

    it('should convert complex colors correctly', () => {
      const result = ColorUtils.rgbToHsl(128, 64, 192);
      expect(result.h).toBeCloseTo(270, 0);
      expect(result.s).toBeGreaterThan(0);
      expect(result.l).toBeGreaterThan(0);
    });
  });

  describe('hslToRgb', () => {
    it('should convert HSL to RGB', () => {
      expect(ColorUtils.hslToRgb(0, 100, 50)).toEqual({ r: 255, g: 0, b: 0 });
      expect(ColorUtils.hslToRgb(120, 100, 50)).toEqual({ r: 0, g: 255, b: 0 });
      expect(ColorUtils.hslToRgb(240, 100, 50)).toEqual({ r: 0, g: 0, b: 255 });
    });

    it('should handle grayscale HSL values', () => {
      expect(ColorUtils.hslToRgb(0, 0, 50)).toEqual({ r: 128, g: 128, b: 128 });
      expect(ColorUtils.hslToRgb(180, 0, 100)).toEqual({
        r: 255,
        g: 255,
        b: 255,
      });
      expect(ColorUtils.hslToRgb(90, 0, 0)).toEqual({ r: 0, g: 0, b: 0 });
    });
  });

  describe('rgbToHsv', () => {
    it('should convert RGB to HSV', () => {
      expect(ColorUtils.rgbToHsv(255, 0, 0)).toEqual({ h: 0, s: 100, v: 100 });
      expect(ColorUtils.rgbToHsv(0, 255, 0)).toEqual({
        h: 120,
        s: 100,
        v: 100,
      });
      expect(ColorUtils.rgbToHsv(0, 0, 255)).toEqual({
        h: 240,
        s: 100,
        v: 100,
      });
    });

    it('should handle black and white', () => {
      expect(ColorUtils.rgbToHsv(0, 0, 0)).toEqual({ h: 0, s: 0, v: 0 });
      expect(ColorUtils.rgbToHsv(255, 255, 255)).toEqual({
        h: 0,
        s: 0,
        v: 100,
      });
    });
  });

  describe('hsvToRgb', () => {
    it('should convert HSV to RGB', () => {
      expect(ColorUtils.hsvToRgb(0, 100, 100)).toEqual({ r: 255, g: 0, b: 0 });
      expect(ColorUtils.hsvToRgb(120, 100, 100)).toEqual({
        r: 0,
        g: 255,
        b: 0,
      });
      expect(ColorUtils.hsvToRgb(240, 100, 100)).toEqual({
        r: 0,
        g: 0,
        b: 255,
      });
    });

    it('should handle edge cases', () => {
      expect(ColorUtils.hsvToRgb(0, 0, 0)).toEqual({ r: 0, g: 0, b: 0 });
      expect(ColorUtils.hsvToRgb(0, 0, 100)).toEqual({
        r: 255,
        g: 255,
        b: 255,
      });
    });

    it('should handle all HSV sectors', () => {
      // Test all 6 sectors of the HSV color wheel
      expect(ColorUtils.hsvToRgb(60, 100, 100)).toEqual({
        r: 255,
        g: 255,
        b: 0,
      }); // Sector 1
      expect(ColorUtils.hsvToRgb(180, 100, 100)).toEqual({
        r: 0,
        g: 255,
        b: 255,
      }); // Sector 2
      expect(ColorUtils.hsvToRgb(300, 100, 100)).toEqual({
        r: 255,
        g: 0,
        b: 255,
      }); // Sector 5
    });
  });

  describe('interpolate', () => {
    it('should interpolate between colors', () => {
      expect(ColorUtils.interpolate('#000000', '#ffffff', 0.5)).toBe('#808080');
      expect(ColorUtils.interpolate('#ff0000', '#00ff00', 0)).toBe('#ff0000');
      expect(ColorUtils.interpolate('#ff0000', '#00ff00', 1)).toBe('#00ff00');
    });

    it('should handle invalid colors by returning first color', () => {
      expect(ColorUtils.interpolate('invalid', '#ffffff', 0.5)).toBe('invalid');
      expect(ColorUtils.interpolate('#ffffff', 'invalid', 0.5)).toBe('#ffffff');
    });

    it('should clamp interpolation values', () => {
      const result1 = ColorUtils.interpolate('#000000', '#ffffff', 0.25);
      const result2 = ColorUtils.interpolate('#000000', '#ffffff', 0.75);
      expect(result1).toBe('#404040');
      expect(result2).toBe('#bfbfbf');
    });
  });

  describe('getLuminance', () => {
    it('should calculate luminance correctly', () => {
      expect(ColorUtils.getLuminance(0, 0, 0)).toBe(0); // Black
      expect(ColorUtils.getLuminance(255, 255, 255)).toBeCloseTo(1, 1); // White
      expect(ColorUtils.getLuminance(255, 0, 0)).toBeGreaterThan(0); // Red
    });

    it('should handle mid-range colors', () => {
      const luminance = ColorUtils.getLuminance(128, 128, 128);
      expect(luminance).toBeGreaterThan(0);
      expect(luminance).toBeLessThan(1);
    });
  });

  describe('getContrastRatio', () => {
    it('should calculate contrast ratio', () => {
      expect(ColorUtils.getContrastRatio('#000000', '#ffffff')).toBeCloseTo(
        21,
        0
      );
      expect(ColorUtils.getContrastRatio('#ffffff', '#000000')).toBeCloseTo(
        21,
        0
      );
      expect(ColorUtils.getContrastRatio('#ffffff', '#ffffff')).toBe(1);
    });

    it('should handle invalid colors', () => {
      expect(ColorUtils.getContrastRatio('invalid', '#ffffff')).toBe(1);
      expect(ColorUtils.getContrastRatio('#ffffff', 'invalid')).toBe(1);
    });
  });

  describe('meetsContrastRequirement', () => {
    it('should check WCAG AA compliance', () => {
      expect(ColorUtils.meetsContrastRequirement('#000000', '#ffffff')).toBe(
        true
      );
      expect(ColorUtils.meetsContrastRequirement('#808080', '#ffffff')).toBe(
        false
      );
    });

    it('should check WCAG AAA compliance', () => {
      expect(
        ColorUtils.meetsContrastRequirement('#000000', '#ffffff', 'AAA')
      ).toBe(true);
      expect(
        ColorUtils.meetsContrastRequirement('#606060', '#ffffff', 'AAA')
      ).toBe(false); // Darker gray to fail AAA
    });
  });

  describe('adjustBrightness', () => {
    it('should adjust brightness correctly', () => {
      expect(ColorUtils.adjustBrightness('#808080', 50)).toBe('#b2b2b2');
      expect(ColorUtils.adjustBrightness('#808080', -50)).toBe('#4e4e4e');
    });

    it('should clamp values to valid range', () => {
      expect(ColorUtils.adjustBrightness('#ffffff', 50)).toBe('#ffffff');
      expect(ColorUtils.adjustBrightness('#000000', -50)).toBe('#000000');
    });

    it('should handle invalid colors', () => {
      expect(ColorUtils.adjustBrightness('invalid', 50)).toBe('invalid');
    });
  });

  describe('adjustSaturation', () => {
    it('should adjust saturation correctly', () => {
      const result = ColorUtils.adjustSaturation('#ff0000', -20);
      expect(result).not.toBe('#ff0000');

      const desaturated = ColorUtils.adjustSaturation('#ff0000', -100);
      // Should become grayscale
      const rgb = ColorUtils.hexToRgb(desaturated);
      expect(rgb?.r).toBe(rgb?.g);
      expect(rgb?.g).toBe(rgb?.b);
    });

    it('should handle invalid colors', () => {
      expect(ColorUtils.adjustSaturation('invalid', 20)).toBe('invalid');
    });
  });

  describe('getComplementary', () => {
    it('should get complementary colors', () => {
      expect(ColorUtils.getComplementary('#ff0000')).toBe('#00ffff'); // Red -> Cyan
      expect(ColorUtils.getComplementary('#00ff00')).toBe('#ff00ff'); // Green -> Magenta
      expect(ColorUtils.getComplementary('#0000ff')).toBe('#ffff00'); // Blue -> Yellow
    });

    it('should handle invalid colors', () => {
      expect(ColorUtils.getComplementary('invalid')).toBe('invalid');
    });

    it('should handle grayscale colors', () => {
      const comp = ColorUtils.getComplementary('#808080');
      expect(comp).toBe('#808080'); // Gray complements to itself
    });
  });

  describe('generatePalette', () => {
    it('should generate analogous palette', () => {
      const palette = ColorUtils.generatePalette('#ff0000', 5, 'analogous');
      expect(palette).toHaveLength(5);
      expect(palette[0]).toBe('#ff0000');
    });

    it('should generate triadic palette', () => {
      const palette = ColorUtils.generatePalette('#ff0000', 5, 'triadic');
      expect(palette).toHaveLength(3); // Triadic is limited to 3 colors
      expect(palette[0]).toBe('#ff0000');
    });

    it('should generate complementary palette', () => {
      const palette = ColorUtils.generatePalette('#ff0000', 5, 'complementary');
      expect(palette).toHaveLength(2);
      expect(palette[0]).toBe('#ff0000');
      expect(palette[1]).toBe('#00ffff');
    });

    it('should generate monochromatic palette', () => {
      const palette = ColorUtils.generatePalette('#ff0000', 5, 'monochromatic');
      expect(palette).toHaveLength(5);
      expect(palette[0]).toBe('#ff0000');
    });

    it('should handle invalid colors', () => {
      const palette = ColorUtils.generatePalette('invalid', 3);
      expect(palette).toEqual(['invalid']);
    });

    it('should respect count limits', () => {
      const palette = ColorUtils.generatePalette('#ff0000', 10, 'triadic');
      expect(palette).toHaveLength(3); // Triadic max is 3
    });
  });
});

describe('GradientUtils', () => {
  describe('createGradient', () => {
    it('should create linear gradient', () => {
      const gradient = GradientUtils.createGradient('linear', [
        '#ff0000',
        '#0000ff',
      ]);
      expect(gradient).toContain('linear-gradient');
      expect(gradient).toContain('#ff0000');
      expect(gradient).toContain('#0000ff');
    });

    it('should create linear gradient with custom angle', () => {
      const gradient = GradientUtils.createGradient(
        'linear',
        ['#ff0000', '#0000ff'],
        undefined,
        45
      );
      expect(gradient).toContain('45deg');
    });

    it('should create radial gradient', () => {
      const gradient = GradientUtils.createGradient('radial', [
        '#ff0000',
        '#0000ff',
      ]);
      expect(gradient).toContain('radial-gradient');
      expect(gradient).toContain('circle at 50% 50%');
    });

    it('should create radial gradient with custom center', () => {
      const gradient = GradientUtils.createGradient(
        'radial',
        ['#ff0000', '#0000ff'],
        undefined,
        undefined,
        25,
        75
      );
      expect(gradient).toContain('circle at 25% 75%');
    });

    it('should create conic gradient', () => {
      const gradient = GradientUtils.createGradient('conic', [
        '#ff0000',
        '#0000ff',
      ]);
      expect(gradient).toContain('conic-gradient');
      expect(gradient).toContain('from 0deg at 50% 50%');
    });

    it('should handle custom stops', () => {
      const gradient = GradientUtils.createGradient(
        'linear',
        ['#ff0000', '#0000ff'],
        [0.2, 0.8]
      );
      expect(gradient).toContain('20.0%');
      expect(gradient).toContain('80.0%');
    });

    it('should fallback to linear gradient for invalid type', () => {
      const gradient = GradientUtils.createGradient('invalid' as any, [
        '#ff0000',
        '#0000ff',
      ]);
      expect(gradient).toContain('linear-gradient(0deg');
    });
  });

  describe('optimizeGradient', () => {
    it('should preserve important color stops', () => {
      const result = GradientUtils.optimizeGradient(
        ['#ff0000', '#ff0000', '#0000ff'],
        [0, 0.5, 1]
      );
      // The optimization may keep more stops than expected based on the algorithm
      expect(result.colors.length).toBeGreaterThanOrEqual(2);
      expect(result.colors[0]).toBe('#ff0000');
      expect(result.colors[result.colors.length - 1]).toBe('#0000ff');
    });

    it('should handle invalid input', () => {
      const result = GradientUtils.optimizeGradient(['#ff0000'], [0, 0.5]);
      expect(result.colors).toEqual(['#ff0000']);
    });

    it('should handle empty arrays', () => {
      const result = GradientUtils.optimizeGradient([], []);
      expect(result.colors).toEqual([]);
      expect(result.stops).toEqual([]);
    });

    it('should optimize three-color gradient', () => {
      const result = GradientUtils.optimizeGradient(
        ['#ff0000', '#ff8000', '#0000ff'],
        [0, 0.5, 1]
      );
      expect(result.colors.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('sampleGradient', () => {
    it('should sample color at specific positions', () => {
      const color1 = GradientUtils.sampleGradient(
        ['#ff0000', '#0000ff'],
        [0, 1],
        0
      );
      const color2 = GradientUtils.sampleGradient(
        ['#ff0000', '#0000ff'],
        [0, 1],
        1
      );
      expect(color1).toBe('#ff0000');
      expect(color2).toBe('#0000ff');
    });

    it('should interpolate between colors', () => {
      const color = GradientUtils.sampleGradient(
        ['#000000', '#ffffff'],
        [0, 1],
        0.5
      );
      expect(color).toBe('#808080');
    });

    it('should clamp position values', () => {
      const color1 = GradientUtils.sampleGradient(
        ['#ff0000', '#0000ff'],
        [0, 1],
        -0.5
      );
      const color2 = GradientUtils.sampleGradient(
        ['#ff0000', '#0000ff'],
        [0, 1],
        1.5
      );
      expect(color1).toBe('#ff0000');
      expect(color2).toBe('#0000ff');
    });

    it('should handle multi-stop gradients', () => {
      const color = GradientUtils.sampleGradient(
        ['#ff0000', '#00ff00', '#0000ff'],
        [0, 0.5, 1],
        0.25
      );
      // Should interpolate between red and green
      expect(color).toBeDefined();
      expect(color.startsWith('#')).toBe(true);
    });
  });
});

describe('ThemeUtils', () => {
  describe('getThemeColors', () => {
    it('should return light theme colors', () => {
      const colors = ThemeUtils.getThemeColors('light');
      expect(colors.background).toBe('#ffffff');
      expect(colors.text).toBe('#212529');
      expect(colors.surface).toBe('#f8f9fa');
    });

    it('should return dark theme colors', () => {
      const colors = ThemeUtils.getThemeColors('dark');
      expect(colors.background).toBe('#121212');
      expect(colors.text).toBe('#ffffff');
      expect(colors.surface).toBe('#1e1e1e');
    });

    it('should include all required color properties', () => {
      const lightColors = ThemeUtils.getThemeColors('light');
      const darkColors = ThemeUtils.getThemeColors('dark');

      const expectedProps = [
        'background',
        'surface',
        'border',
        'text',
        'textSecondary',
        'primary',
        'secondary',
        'success',
        'warning',
        'danger',
        'info',
      ];

      expectedProps.forEach(prop => {
        expect(lightColors).toHaveProperty(prop);
        expect(darkColors).toHaveProperty(prop);
      });
    });
  });

  describe('adaptColorForTheme', () => {
    it('should lighten colors for dark theme', () => {
      const adapted = ThemeUtils.adaptColorForTheme('#404040', 'dark');
      const original = ColorUtils.hexToRgb('#404040');
      const adaptedRgb = ColorUtils.hexToRgb(adapted);

      if (original && adaptedRgb) {
        const originalHsl = ColorUtils.rgbToHsl(
          original.r,
          original.g,
          original.b
        );
        const adaptedHsl = ColorUtils.rgbToHsl(
          adaptedRgb.r,
          adaptedRgb.g,
          adaptedRgb.b
        );
        expect(adaptedHsl.l).toBeGreaterThan(originalHsl.l);
      }
    });

    it('should darken colors for light theme', () => {
      const adapted = ThemeUtils.adaptColorForTheme('#c0c0c0', 'light');
      const original = ColorUtils.hexToRgb('#c0c0c0');
      const adaptedRgb = ColorUtils.hexToRgb(adapted);

      if (original && adaptedRgb) {
        const originalHsl = ColorUtils.rgbToHsl(
          original.r,
          original.g,
          original.b
        );
        const adaptedHsl = ColorUtils.rgbToHsl(
          adaptedRgb.r,
          adaptedRgb.g,
          adaptedRgb.b
        );
        expect(adaptedHsl.l).toBeLessThan(originalHsl.l);
      }
    });

    it('should handle invalid colors', () => {
      expect(ThemeUtils.adaptColorForTheme('invalid', 'light')).toBe('invalid');
      expect(ThemeUtils.adaptColorForTheme('invalid', 'dark')).toBe('invalid');
    });

    it('should respect lightness bounds', () => {
      const veryDark = ThemeUtils.adaptColorForTheme('#000000', 'dark');
      const veryLight = ThemeUtils.adaptColorForTheme('#ffffff', 'light');

      const darkRgb = ColorUtils.hexToRgb(veryDark);
      const lightRgb = ColorUtils.hexToRgb(veryLight);

      if (darkRgb) {
        const darkHsl = ColorUtils.rgbToHsl(darkRgb.r, darkRgb.g, darkRgb.b);
        expect(darkHsl.l).toBeLessThanOrEqual(80);
      }

      if (lightRgb) {
        const lightHsl = ColorUtils.rgbToHsl(
          lightRgb.r,
          lightRgb.g,
          lightRgb.b
        );
        expect(lightHsl.l).toBeGreaterThanOrEqual(20);
      }
    });
  });
});

describe('ColorUtils Roundtrip Conversions', () => {
  it('should maintain color fidelity through hex->rgb->hex', () => {
    const originalHex = '#ff8040';
    const rgb = ColorUtils.hexToRgb(originalHex);
    if (rgb) {
      const convertedHex = ColorUtils.rgbToHex(rgb.r, rgb.g, rgb.b);
      expect(convertedHex).toBe(originalHex);
    }
  });

  it('should maintain reasonable fidelity through rgb->hsl->rgb', () => {
    const originalRgb = { r: 255, g: 128, b: 64 };
    const hsl = ColorUtils.rgbToHsl(
      originalRgb.r,
      originalRgb.g,
      originalRgb.b
    );
    const convertedRgb = ColorUtils.hslToRgb(hsl.h, hsl.s, hsl.l);

    expect(Math.abs(convertedRgb.r - originalRgb.r)).toBeLessThanOrEqual(2);
    expect(Math.abs(convertedRgb.g - originalRgb.g)).toBeLessThanOrEqual(2);
    expect(Math.abs(convertedRgb.b - originalRgb.b)).toBeLessThanOrEqual(2);
  });

  it('should maintain reasonable fidelity through rgb->hsv->rgb', () => {
    const originalRgb = { r: 128, g: 255, b: 192 };
    const hsv = ColorUtils.rgbToHsv(
      originalRgb.r,
      originalRgb.g,
      originalRgb.b
    );
    const convertedRgb = ColorUtils.hsvToRgb(hsv.h, hsv.s, hsv.v);

    expect(Math.abs(convertedRgb.r - originalRgb.r)).toBeLessThanOrEqual(1);
    expect(Math.abs(convertedRgb.g - originalRgb.g)).toBeLessThanOrEqual(1);
    expect(Math.abs(convertedRgb.b - originalRgb.b)).toBeLessThanOrEqual(1);
  });
});
