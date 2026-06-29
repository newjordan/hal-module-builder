import { renderHook } from '@testing-library/react';
import {
  useGradientCSS,
  GradientCSSOptions,
} from '../../../hooks/useGradientCSS';
import { GradientData } from '../../../utils/gradient';

// Mock console.warn
const mockConsoleWarn = jest.fn();
console.warn = mockConsoleWarn;

describe('useGradientCSS - Comprehensive Coverage', () => {
  const createGradientData = (
    overrides: Partial<GradientData> = {}
  ): GradientData => ({
    type: 'linear',
    colors: ['#ff0000', '#0000ff'],
    stops: [0, 1],
    angle: 45,
    ...overrides,
  });

  beforeEach(() => {
    mockConsoleWarn.mockClear();
  });

  describe('Hook Initialization', () => {
    it('returns all required functions', () => {
      const { result } = renderHook(() => useGradientCSS());

      expect(result.current).toHaveProperty('generateCSS');
      expect(result.current).toHaveProperty('generateLinearCSS');
      expect(result.current).toHaveProperty('generateRadialCSS');
      expect(result.current).toHaveProperty('generateConicCSS');
      expect(result.current).toHaveProperty('validateGradientCSS');
      expect(result.current).toHaveProperty('optimizeColorStops');
      expect(result.current).toHaveProperty('generateFallbackColor');

      expect(typeof result.current.generateCSS).toBe('function');
      expect(typeof result.current.generateLinearCSS).toBe('function');
      expect(typeof result.current.generateRadialCSS).toBe('function');
      expect(typeof result.current.generateConicCSS).toBe('function');
      expect(typeof result.current.validateGradientCSS).toBe('function');
      expect(typeof result.current.optimizeColorStops).toBe('function');
      expect(typeof result.current.generateFallbackColor).toBe('function');
    });
  });

  describe('generateLinearCSS', () => {
    it('generates basic linear gradient CSS', () => {
      const { result } = renderHook(() => useGradientCSS());
      const gradient = createGradientData({
        type: 'linear',
        colors: ['#ff0000', '#0000ff'],
        stops: [0, 1],
        angle: 45,
      });

      const css = result.current.generateLinearCSS(gradient);

      expect(css).toBe('linear-gradient(45deg, #ff0000 0%, #0000ff 100%)');
    });

    it('generates linear gradient with multiple colors', () => {
      const { result } = renderHook(() => useGradientCSS());
      const gradient = createGradientData({
        type: 'linear',
        colors: ['#ff0000', '#00ff00', '#0000ff'],
        stops: [0, 0.5, 1],
        angle: 90,
      });

      const css = result.current.generateLinearCSS(gradient);

      expect(css).toBe(
        'linear-gradient(90deg, #ff0000 0%, #00ff00 50%, #0000ff 100%)'
      );
    });

    it('uses default angle when not provided', () => {
      const { result } = renderHook(() => useGradientCSS());
      const gradient = createGradientData({
        colors: ['#ff0000', '#0000ff'],
        stops: [0, 1],
        angle: undefined,
      });

      const css = result.current.generateLinearCSS(gradient);

      expect(css).toBe('linear-gradient(0deg, #ff0000 0%, #0000ff 100%)');
    });

    it('handles RGB color format', () => {
      const { result } = renderHook(() => useGradientCSS());
      const gradient = createGradientData({
        colors: ['rgb(255, 0, 0)', 'rgb(0, 0, 255)'],
        stops: [0, 1],
        angle: 0,
      });

      const css = result.current.generateLinearCSS(gradient);

      expect(css).toBe(
        'linear-gradient(0deg, rgb(255, 0, 0) 0%, rgb(0, 0, 255) 100%)'
      );
    });

    it('handles RGBA color format', () => {
      const { result } = renderHook(() => useGradientCSS());
      const gradient = createGradientData({
        colors: ['rgba(255, 0, 0, 0.8)', 'rgba(0, 0, 255, 0.6)'],
        stops: [0, 1],
        angle: 180,
      });

      const css = result.current.generateLinearCSS(gradient);

      expect(css).toBe(
        'linear-gradient(180deg, rgba(255, 0, 0, 0.8) 0%, rgba(0, 0, 255, 0.6) 100%)'
      );
    });

    it('handles HSL color format', () => {
      const { result } = renderHook(() => useGradientCSS());
      const gradient = createGradientData({
        colors: ['hsl(0, 100%, 50%)', 'hsl(240, 100%, 50%)'],
        stops: [0, 1],
        angle: 270,
      });

      const css = result.current.generateLinearCSS(gradient);

      expect(css).toBe(
        'linear-gradient(270deg, hsl(0, 100%, 50%) 0%, hsl(240, 100%, 50%) 100%)'
      );
    });

    it('handles HSLA color format', () => {
      const { result } = renderHook(() => useGradientCSS());
      const gradient = createGradientData({
        colors: ['hsla(0, 100%, 50%, 0.9)', 'hsla(240, 100%, 50%, 0.7)'],
        stops: [0, 1],
        angle: 45,
      });

      const css = result.current.generateLinearCSS(gradient);

      expect(css).toBe(
        'linear-gradient(45deg, hsla(0, 100%, 50%, 0.9) 0%, hsla(240, 100%, 50%, 0.7) 100%)'
      );
    });

    it('handles transparent color', () => {
      const { result } = renderHook(() => useGradientCSS());
      const gradient = createGradientData({
        colors: ['#ff0000', 'transparent'],
        stops: [0, 1],
        angle: 0,
      });

      const css = result.current.generateLinearCSS(gradient);

      expect(css).toBe('linear-gradient(0deg, #ff0000 0%, transparent 100%)');
    });

    it('generates minified output when option is set', () => {
      const { result } = renderHook(() => useGradientCSS());
      const gradient = createGradientData();
      const options: GradientCSSOptions = { minifyOutput: true };

      const css = result.current.generateLinearCSS(gradient, options);

      expect(css).toBe('linear-gradient(45deg,#ff0000 0%,#0000ff 100%)');
    });

    it('includes vendor prefixes when option is set', () => {
      const { result } = renderHook(() => useGradientCSS());
      const gradient = createGradientData({
        angle: 90,
        colors: ['#ff0000', '#0000ff'],
        stops: [0, 1],
      });
      const options: GradientCSSOptions = { includePrefixes: true };

      const css = result.current.generateLinearCSS(gradient, options);

      expect(css).toContain(
        '-webkit-linear-gradient(90deg, #ff0000 0%, #0000ff 100%)'
      );
      expect(css).toContain(
        '-moz-linear-gradient(90deg, #ff0000 0%, #0000ff 100%)'
      );
      expect(css).toContain(
        '-o-linear-gradient(90deg, #ff0000 0%, #0000ff 100%)'
      );
      expect(css).toContain('linear-gradient(90deg, #ff0000 0%, #0000ff 100%)');
    });

    it('uses custom precision for stop positions', () => {
      const { result } = renderHook(() => useGradientCSS());
      const gradient = createGradientData({
        colors: ['#ff0000', '#0000ff'],
        stops: [0, 0.333333],
        angle: 0,
      });
      const options: GradientCSSOptions = { precision: 2 };

      const css = result.current.generateLinearCSS(gradient, options);

      expect(css).toBe('linear-gradient(0deg, #ff0000 0%, #0000ff 33.33%)');
    });

    it('filters out invalid colors', () => {
      const { result } = renderHook(() => useGradientCSS());
      const gradient = createGradientData({
        colors: ['#ff0000', 'invalid-color', '#0000ff'],
        stops: [0, 0.5, 1],
        angle: 0,
      });

      const css = result.current.generateLinearCSS(gradient);

      expect(css).toBe('linear-gradient(0deg, #ff0000 0%, #0000ff 100%)');
    });

    it('returns fallback color when insufficient valid colors', () => {
      const { result } = renderHook(() => useGradientCSS());
      const gradient = createGradientData({
        colors: ['#ff0000'],
        stops: [0],
        angle: 0,
      });

      const css = result.current.generateLinearCSS(gradient);

      expect(css).toBe('transparent');
    });

    it('uses custom fallback color', () => {
      const { result } = renderHook(() => useGradientCSS());
      const gradient = createGradientData({
        colors: ['invalid-color'],
        stops: [0],
        angle: 0,
      });
      const options: GradientCSSOptions = { fallbackColor: '#cccccc' };

      const css = result.current.generateLinearCSS(gradient, options);

      expect(css).toBe('#cccccc');
    });

    it('optimizes color stops automatically', () => {
      const { result } = renderHook(() => useGradientCSS());
      const gradient = createGradientData({
        colors: ['#ff0000', '#00ff00', '#0000ff'],
        stops: [1, 0.5, 0], // Out of order
        angle: 0,
      });

      const css = result.current.generateLinearCSS(gradient);

      // Should be reordered by stops
      expect(css).toBe(
        'linear-gradient(0deg, #0000ff 0%, #00ff00 50%, #ff0000 100%)'
      );
    });
  });

  describe('generateRadialCSS', () => {
    it('generates basic radial gradient CSS', () => {
      const { result } = renderHook(() => useGradientCSS());
      const gradient = createGradientData({
        type: 'radial',
        colors: ['#ff0000', '#0000ff'],
        stops: [0, 1],
        centerX: 50,
        centerY: 50,
      });

      const css = result.current.generateRadialCSS(gradient);

      expect(css).toBe(
        'radial-gradient(circle at 50% 50%, #ff0000 0%, #0000ff 100%)'
      );
    });

    it('uses default center when not provided', () => {
      const { result } = renderHook(() => useGradientCSS());
      const gradient = createGradientData({
        type: 'radial',
        colors: ['#ff0000', '#0000ff'],
        stops: [0, 1],
        centerX: undefined,
        centerY: undefined,
      });

      const css = result.current.generateRadialCSS(gradient);

      expect(css).toBe(
        'radial-gradient(circle at 50% 50%, #ff0000 0%, #0000ff 100%)'
      );
    });

    it('handles custom center position', () => {
      const { result } = renderHook(() => useGradientCSS());
      const gradient = createGradientData({
        type: 'radial',
        colors: ['#ff0000', '#0000ff'],
        stops: [0, 1],
        centerX: 25,
        centerY: 75,
      });

      const css = result.current.generateRadialCSS(gradient);

      expect(css).toBe(
        'radial-gradient(circle at 25% 75%, #ff0000 0%, #0000ff 100%)'
      );
    });

    it('includes vendor prefixes when option is set', () => {
      const { result } = renderHook(() => useGradientCSS());
      const gradient = createGradientData({
        type: 'radial',
        colors: ['#ff0000', '#0000ff'],
        stops: [0, 1],
        centerX: 30,
        centerY: 70,
      });
      const options: GradientCSSOptions = { includePrefixes: true };

      const css = result.current.generateRadialCSS(gradient, options);

      expect(css).toContain(
        '-webkit-radial-gradient(circle at 30% 70%, #ff0000 0%, #0000ff 100%)'
      );
      expect(css).toContain(
        '-moz-radial-gradient(circle at 30% 70%, #ff0000 0%, #0000ff 100%)'
      );
      expect(css).toContain(
        '-o-radial-gradient(circle at 30% 70%, #ff0000 0%, #0000ff 100%)'
      );
      expect(css).toContain(
        'radial-gradient(circle at 30% 70%, #ff0000 0%, #0000ff 100%)'
      );
    });

    it('generates minified output', () => {
      const { result } = renderHook(() => useGradientCSS());
      const gradient = createGradientData({
        type: 'radial',
        colors: ['#ff0000', '#0000ff'],
        stops: [0, 1],
        centerX: 50,
        centerY: 50,
      });
      const options: GradientCSSOptions = { minifyOutput: true };

      const css = result.current.generateRadialCSS(gradient, options);

      expect(css).toBe(
        'radial-gradient(circle at 50% 50%,#ff0000 0%,#0000ff 100%)'
      );
    });

    it('returns fallback color for insufficient colors', () => {
      const { result } = renderHook(() => useGradientCSS());
      const gradient = createGradientData({
        type: 'radial',
        colors: ['#ff0000'],
        stops: [0],
      });

      const css = result.current.generateRadialCSS(gradient);

      expect(css).toBe('transparent');
    });
  });

  describe('generateConicCSS', () => {
    it('generates basic conic gradient CSS', () => {
      const { result } = renderHook(() => useGradientCSS());
      const gradient = createGradientData({
        type: 'conic',
        colors: ['#ff0000', '#0000ff'],
        stops: [0, 1],
        angle: 0,
        centerX: 50,
        centerY: 50,
      });

      const css = result.current.generateConicCSS(gradient);

      expect(css).toBe(
        'conic-gradient(from 0deg at 50% 50%, #ff0000 0deg, #0000ff 360deg)'
      );
    });

    it('uses default values when not provided', () => {
      const { result } = renderHook(() => useGradientCSS());
      const gradient = createGradientData({
        type: 'conic',
        colors: ['#ff0000', '#0000ff'],
        stops: [0, 1],
        angle: undefined,
        centerX: undefined,
        centerY: undefined,
      });

      const css = result.current.generateConicCSS(gradient);

      expect(css).toBe(
        'conic-gradient(from 0deg at 50% 50%, #ff0000 0deg, #0000ff 360deg)'
      );
    });

    it('handles custom angle and center', () => {
      const { result } = renderHook(() => useGradientCSS());
      const gradient = createGradientData({
        type: 'conic',
        colors: ['#ff0000', '#0000ff'],
        stops: [0, 1],
        angle: 90,
        centerX: 25,
        centerY: 75,
      });

      const css = result.current.generateConicCSS(gradient);

      expect(css).toBe(
        'conic-gradient(from 90deg at 25% 75%, #ff0000 0deg, #0000ff 360deg)'
      );
    });

    it('includes webkit prefix when option is set', () => {
      const { result } = renderHook(() => useGradientCSS());
      const gradient = createGradientData({
        type: 'conic',
        colors: ['#ff0000', '#0000ff'],
        stops: [0, 1],
        angle: 45,
        centerX: 50,
        centerY: 50,
      });
      const options: GradientCSSOptions = { includePrefixes: true };

      const css = result.current.generateConicCSS(gradient, options);

      expect(css).toContain(
        '-webkit-conic-gradient(from 45deg at 50% 50%, #ff0000 0deg, #0000ff 360deg)'
      );
      expect(css).toContain(
        'conic-gradient(from 45deg at 50% 50%, #ff0000 0deg, #0000ff 360deg)'
      );
    });

    it('generates minified output', () => {
      const { result } = renderHook(() => useGradientCSS());
      const gradient = createGradientData({
        type: 'conic',
        colors: ['#ff0000', '#0000ff'],
        stops: [0, 1],
        angle: 0,
        centerX: 50,
        centerY: 50,
      });
      const options: GradientCSSOptions = { minifyOutput: true };

      const css = result.current.generateConicCSS(gradient, options);

      expect(css).toBe(
        'conic-gradient(from 0deg at 50% 50%,#ff0000 0deg,#0000ff 360deg)'
      );
    });

    it('converts stops to degrees correctly', () => {
      const { result } = renderHook(() => useGradientCSS());
      const gradient = createGradientData({
        type: 'conic',
        colors: ['#ff0000', '#00ff00', '#0000ff'],
        stops: [0, 0.25, 0.75],
        angle: 0,
      });

      const css = result.current.generateConicCSS(gradient);

      expect(css).toBe(
        'conic-gradient(from 0deg at 50% 50%, #ff0000 0deg, #00ff00 90deg, #0000ff 270deg)'
      );
    });

    it('returns fallback color for insufficient colors', () => {
      const { result } = renderHook(() => useGradientCSS());
      const gradient = createGradientData({
        type: 'conic',
        colors: ['#ff0000'],
        stops: [0],
      });

      const css = result.current.generateConicCSS(gradient);

      expect(css).toBe('transparent');
    });
  });

  describe('generateCSS (main function)', () => {
    it('delegates to linear generator for linear type', () => {
      const { result } = renderHook(() => useGradientCSS());
      const gradient = createGradientData({ type: 'linear' });

      const css = result.current.generateCSS(gradient);
      const linearCss = result.current.generateLinearCSS(gradient);

      expect(css).toBe(linearCss);
    });

    it('delegates to radial generator for radial type', () => {
      const { result } = renderHook(() => useGradientCSS());
      const gradient = createGradientData({
        type: 'radial',
        centerX: 30,
        centerY: 70,
      });

      const css = result.current.generateCSS(gradient);
      const radialCss = result.current.generateRadialCSS(gradient);

      expect(css).toBe(radialCss);
    });

    it('delegates to conic generator for conic type', () => {
      const { result } = renderHook(() => useGradientCSS());
      const gradient = createGradientData({
        type: 'conic',
        centerX: 30,
        centerY: 70,
      });

      const css = result.current.generateCSS(gradient);
      const conicCss = result.current.generateConicCSS(gradient);

      expect(css).toBe(conicCss);
    });

    it('defaults to linear for unknown type', () => {
      const { result } = renderHook(() => useGradientCSS());
      const gradient = createGradientData({ type: 'unknown' as any });

      const css = result.current.generateCSS(gradient);
      const linearCss = result.current.generateLinearCSS({
        ...gradient,
        type: 'linear',
      });

      expect(css).toBe(linearCss);
    });

    it('returns fallback color for null gradient', () => {
      const { result } = renderHook(() => useGradientCSS());

      const css = result.current.generateCSS(null as any);

      expect(css).toBe('transparent');
    });

    it('returns fallback color for undefined gradient', () => {
      const { result } = renderHook(() => useGradientCSS());

      const css = result.current.generateCSS(undefined as any);

      expect(css).toBe('transparent');
    });

    it('returns fallback color for gradient with no colors', () => {
      const { result } = renderHook(() => useGradientCSS());
      const gradient = createGradientData({ colors: [] });

      const css = result.current.generateCSS(gradient);

      expect(css).toBe('transparent');
    });

    it('returns fallback color for gradient with insufficient colors', () => {
      const { result } = renderHook(() => useGradientCSS());
      const gradient = createGradientData({ colors: ['#ff0000'] });

      const css = result.current.generateCSS(gradient);

      expect(css).toBe('transparent');
    });

    it('handles errors gracefully and logs warning', () => {
      const { result } = renderHook(() => useGradientCSS());

      // Mock generateLinearCSS to throw an error
      const originalGenerateLinearCSS = result.current.generateLinearCSS;
      jest.spyOn(result.current, 'generateLinearCSS').mockImplementation(() => {
        throw new Error('Test error');
      });

      const gradient = createGradientData({ type: 'linear' });
      const css = result.current.generateCSS(gradient);

      expect(css).toBe('transparent');
      expect(mockConsoleWarn).toHaveBeenCalledWith(
        'Error generating gradient CSS:',
        expect.any(Error)
      );

      // Restore original implementation
      jest
        .spyOn(result.current, 'generateLinearCSS')
        .mockImplementation(originalGenerateLinearCSS);
    });

    it('uses custom fallback color from options', () => {
      const { result } = renderHook(() => useGradientCSS());
      const gradient = createGradientData({ colors: [] });
      const options: GradientCSSOptions = { fallbackColor: '#ff0000' };

      const css = result.current.generateCSS(gradient, options);

      expect(css).toBe('#ff0000');
    });
  });

  describe('optimizeColorStops', () => {
    it('sorts colors by stop position', () => {
      const { result } = renderHook(() => useGradientCSS());

      const optimized = result.current.optimizeColorStops(
        ['#ff0000', '#00ff00', '#0000ff'],
        [1, 0, 0.5]
      );

      expect(optimized.colors).toEqual(['#00ff00', '#0000ff', '#ff0000']);
      expect(optimized.stops).toEqual([0, 0.5, 1]);
    });

    it('removes duplicate color stops', () => {
      const { result } = renderHook(() => useGradientCSS());

      const optimized = result.current.optimizeColorStops(
        ['#ff0000', '#ff0000', '#0000ff'],
        [0, 0, 1]
      );

      expect(optimized.colors).toEqual(['#ff0000', '#0000ff']);
      expect(optimized.stops).toEqual([0, 1]);
    });

    it('clamps stop values between 0 and 1', () => {
      const { result } = renderHook(() => useGradientCSS());

      const optimized = result.current.optimizeColorStops(
        ['#ff0000', '#0000ff'],
        [-0.5, 1.5]
      );

      expect(optimized.stops).toEqual([0, 1]);
    });

    it('handles undefined stops', () => {
      const { result } = renderHook(() => useGradientCSS());

      const optimized = result.current.optimizeColorStops(
        ['#ff0000', '#0000ff'],
        [0, undefined as any]
      );

      expect(optimized.stops).toEqual([0, 0]);
    });

    it('returns original arrays for insufficient colors', () => {
      const { result } = renderHook(() => useGradientCSS());

      const optimized = result.current.optimizeColorStops(['#ff0000'], [0]);

      expect(optimized.colors).toEqual(['#ff0000']);
      expect(optimized.stops).toEqual([0]);
    });

    it('returns original arrays for mismatched lengths', () => {
      const { result } = renderHook(() => useGradientCSS());

      const optimized = result.current.optimizeColorStops(
        ['#ff0000', '#0000ff'],
        [0]
      );

      expect(optimized.colors).toEqual(['#ff0000', '#0000ff']);
      expect(optimized.stops).toEqual([0]);
    });

    it('preserves first occurrence of duplicate stops', () => {
      const { result } = renderHook(() => useGradientCSS());

      const optimized = result.current.optimizeColorStops(
        ['#ff0000', '#00ff00', '#0000ff'],
        [0, 0.5, 0.5]
      );

      expect(optimized.colors).toEqual(['#ff0000', '#00ff00']);
      expect(optimized.stops).toEqual([0, 0.5]);
    });
  });

  describe('generateFallbackColor', () => {
    it('returns transparent for empty array', () => {
      const { result } = renderHook(() => useGradientCSS());

      const fallback = result.current.generateFallbackColor([]);

      expect(fallback).toBe('transparent');
    });

    it('returns single color for array with one color', () => {
      const { result } = renderHook(() => useGradientCSS());

      const fallback = result.current.generateFallbackColor(['#ff0000']);

      expect(fallback).toBe('#ff0000');
    });

    it('returns first color for array with two colors', () => {
      const { result } = renderHook(() => useGradientCSS());

      const fallback = result.current.generateFallbackColor([
        '#ff0000',
        '#0000ff',
      ]);

      expect(fallback).toBe('#ff0000');
    });

    it('returns middle color for array with odd number of colors', () => {
      const { result } = renderHook(() => useGradientCSS());

      const fallback = result.current.generateFallbackColor([
        '#ff0000',
        '#00ff00',
        '#0000ff',
      ]);

      expect(fallback).toBe('#00ff00');
    });

    it('returns middle-ish color for array with even number of colors', () => {
      const { result } = renderHook(() => useGradientCSS());

      const fallback = result.current.generateFallbackColor([
        '#ff0000',
        '#00ff00',
        '#0000ff',
        '#ffff00',
      ]);

      expect(fallback).toBe('#00ff00'); // Index 1 for (4-1)/2 = 1.5 floored
    });

    it('handles array with undefined colors', () => {
      const { result } = renderHook(() => useGradientCSS());

      const fallback = result.current.generateFallbackColor([
        undefined as any,
        '#00ff00',
        undefined as any,
      ]);

      expect(fallback).toBe('#00ff00');
    });

    it('returns transparent when all colors are undefined', () => {
      const { result } = renderHook(() => useGradientCSS());

      const fallback = result.current.generateFallbackColor([
        undefined as any,
        undefined as any,
      ]);

      expect(fallback).toBe('transparent');
    });
  });

  describe('validateGradientCSS', () => {
    it('validates linear gradient CSS', () => {
      const { result } = renderHook(() => useGradientCSS());

      expect(
        result.current.validateGradientCSS(
          'linear-gradient(45deg, #ff0000, #0000ff)'
        )
      ).toBe(true);
    });

    it('validates radial gradient CSS', () => {
      const { result } = renderHook(() => useGradientCSS());

      expect(
        result.current.validateGradientCSS(
          'radial-gradient(circle, #ff0000, #0000ff)'
        )
      ).toBe(true);
    });

    it('validates conic gradient CSS', () => {
      const { result } = renderHook(() => useGradientCSS());

      expect(
        result.current.validateGradientCSS(
          'conic-gradient(from 0deg, #ff0000, #0000ff)'
        )
      ).toBe(true);
    });

    it('validates case-insensitive gradient functions', () => {
      const { result } = renderHook(() => useGradientCSS());

      expect(
        result.current.validateGradientCSS(
          'LINEAR-GRADIENT(45deg, #ff0000, #0000ff)'
        )
      ).toBe(true);
      expect(
        result.current.validateGradientCSS(
          'RADIAL-GRADIENT(circle, #ff0000, #0000ff)'
        )
      ).toBe(true);
      expect(
        result.current.validateGradientCSS(
          'CONIC-GRADIENT(from 0deg, #ff0000, #0000ff)'
        )
      ).toBe(true);
    });

    it('validates with vendor prefixes', () => {
      const { result } = renderHook(() => useGradientCSS());

      expect(
        result.current.validateGradientCSS(
          '-webkit-linear-gradient(45deg, #ff0000, #0000ff)'
        )
      ).toBe(false);
    });

    it('rejects invalid CSS strings', () => {
      const { result } = renderHook(() => useGradientCSS());

      expect(result.current.validateGradientCSS('not-a-gradient')).toBe(false);
      expect(
        result.current.validateGradientCSS(
          'linear-gradient(45deg, #ff0000, #0000ff'
        )
      ).toBe(false); // Missing closing paren
      expect(result.current.validateGradientCSS('')).toBe(false);
      expect(result.current.validateGradientCSS('   ')).toBe(false);
    });

    it('rejects null and undefined inputs', () => {
      const { result } = renderHook(() => useGradientCSS());

      expect(result.current.validateGradientCSS(null as any)).toBe(false);
      expect(result.current.validateGradientCSS(undefined as any)).toBe(false);
    });

    it('rejects non-string inputs', () => {
      const { result } = renderHook(() => useGradientCSS());

      expect(result.current.validateGradientCSS(123 as any)).toBe(false);
      expect(result.current.validateGradientCSS({} as any)).toBe(false);
      expect(result.current.validateGradientCSS([] as any)).toBe(false);
    });

    it('handles CSS with extra whitespace', () => {
      const { result } = renderHook(() => useGradientCSS());

      expect(
        result.current.validateGradientCSS(
          '  linear-gradient(45deg, #ff0000, #0000ff)  '
        )
      ).toBe(true);
    });
  });

  describe('Complex Integration Scenarios', () => {
    it('handles gradient with all color formats mixed', () => {
      const { result } = renderHook(() => useGradientCSS());
      const gradient = createGradientData({
        colors: [
          '#ff0000',
          'rgb(0, 255, 0)',
          'rgba(0, 0, 255, 0.8)',
          'hsl(60, 100%, 50%)',
          'transparent',
        ],
        stops: [0, 0.25, 0.5, 0.75, 1],
        angle: 45,
      });

      const css = result.current.generateCSS(gradient);

      expect(css).toContain('#ff0000 0%');
      expect(css).toContain('rgb(0, 255, 0) 25%');
      expect(css).toContain('rgba(0, 0, 255, 0.8) 50%');
      expect(css).toContain('hsl(60, 100%, 50%) 75%');
      expect(css).toContain('transparent 100%');
    });

    it('handles extreme precision requirements', () => {
      const { result } = renderHook(() => useGradientCSS());
      const gradient = createGradientData({
        colors: ['#ff0000', '#0000ff'],
        stops: [0.123456789, 0.987654321],
        angle: 45.123456789,
        centerX: 33.333333,
        centerY: 66.666666,
      });
      const options: GradientCSSOptions = { precision: 3 };

      const linearCss = result.current.generateLinearCSS(gradient, options);
      const radialCss = result.current.generateRadialCSS(
        { ...gradient, type: 'radial' },
        options
      );
      const conicCss = result.current.generateConicCSS(
        { ...gradient, type: 'conic' },
        options
      );

      expect(linearCss).toContain('45.123deg');
      expect(linearCss).toContain('12.346%');
      expect(linearCss).toContain('98.765%');

      expect(radialCss).toContain('33.333% 66.667%');
      expect(conicCss).toContain('45.123deg at 33.333% 66.667%');
    });

    it('handles edge case with all stops at same position', () => {
      const { result } = renderHook(() => useGradientCSS());
      const gradient = createGradientData({
        colors: ['#ff0000', '#00ff00', '#0000ff'],
        stops: [0.5, 0.5, 0.5],
      });

      const optimized = result.current.optimizeColorStops(
        gradient.colors,
        gradient.stops
      );

      // Should keep only the first occurrence
      expect(optimized.colors).toEqual(['#ff0000']);
      expect(optimized.stops).toEqual([0.5]);
    });

    it('handles performance with many colors', () => {
      const { result } = renderHook(() => useGradientCSS());
      const colors = Array.from(
        { length: 100 },
        (_, i) => `#${i.toString(16).padStart(6, '0')}`
      );
      const stops = Array.from({ length: 100 }, (_, i) => i / 99);
      const gradient = createGradientData({ colors, stops });

      const css = result.current.generateCSS(gradient);

      expect(css).toContain('linear-gradient');
      expect(css.split(',').length).toBeGreaterThan(90); // Should handle most colors
    });

    it('maintains function stability across re-renders', () => {
      const { result, rerender } = renderHook(() => useGradientCSS());

      const firstGenerateCSS = result.current.generateCSS;
      const firstOptimizeColorStops = result.current.optimizeColorStops;
      const firstValidateGradientCSS = result.current.validateGradientCSS;

      rerender();

      expect(result.current.generateCSS).toBe(firstGenerateCSS);
      expect(result.current.optimizeColorStops).toBe(firstOptimizeColorStops);
      expect(result.current.validateGradientCSS).toBe(firstValidateGradientCSS);
    });
  });

  describe('Edge Cases and Error Conditions', () => {
    it('handles extremely large numbers gracefully', () => {
      const { result } = renderHook(() => useGradientCSS());
      const gradient = createGradientData({
        angle: 999999,
        centerX: 999999,
        centerY: 999999,
        colors: ['#ff0000', '#0000ff'],
        stops: [0, 1],
      });

      expect(() => result.current.generateCSS(gradient)).not.toThrow();
    });

    it('handles negative numbers', () => {
      const { result } = renderHook(() => useGradientCSS());
      const gradient = createGradientData({
        angle: -45,
        centerX: -50,
        centerY: -50,
        colors: ['#ff0000', '#0000ff'],
        stops: [-1, 2],
      });

      const css = result.current.generateCSS(gradient);

      expect(css).toContain('-45deg');
      // Centers and stops should be handled appropriately by each generator
    });

    it('handles malformed gradient data', () => {
      const { result } = renderHook(() => useGradientCSS());
      const malformedGradient = {
        type: 'linear',
        colors: null,
        stops: undefined,
      } as any;

      expect(() => result.current.generateCSS(malformedGradient)).not.toThrow();
    });

    it('handles circular references in gradient data', () => {
      const { result } = renderHook(() => useGradientCSS());
      const gradient: any = createGradientData();
      gradient.self = gradient; // Create circular reference

      expect(() => result.current.generateCSS(gradient)).not.toThrow();
    });
  });
});
