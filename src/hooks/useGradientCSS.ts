import { useCallback, useRef } from 'react';
import { GradientData } from '../utils/gradient';

export interface GradientCSSOptions {
  includePrefixes?: boolean;
  fallbackColor?: string;
  precision?: number;
  minifyOutput?: boolean;
}

export interface UseGradientCSSReturn {
  generateCSS: (gradient: GradientData, options?: GradientCSSOptions) => string;
  generateLinearCSS: (
    gradient: GradientData,
    options?: GradientCSSOptions
  ) => string;
  generateRadialCSS: (
    gradient: GradientData,
    options?: GradientCSSOptions
  ) => string;
  generateConicCSS: (
    gradient: GradientData,
    options?: GradientCSSOptions
  ) => string;
  validateGradientCSS: (cssString: string) => boolean;
  optimizeColorStops: (
    colors: string[],
    stops: number[]
  ) => { colors: string[]; stops: number[] };
  generateFallbackColor: (colors: string[]) => string;
}

const DEFAULT_OPTIONS: Required<GradientCSSOptions> = {
  includePrefixes: false,
  fallbackColor: 'transparent',
  precision: 1,
  minifyOutput: false,
};

// Browser prefixes for legacy support
const WEBKIT_PREFIX = '-webkit-';
const MOZ_PREFIX = '-moz-';
const O_PREFIX = '-o-';

// Color validation regex
const HEX_COLOR_REGEX = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
const RGB_COLOR_REGEX = /^rgb\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*\)$/;
const RGBA_COLOR_REGEX = /^rgba\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*,\s*[\d.]+\s*\)$/;
const HSL_COLOR_REGEX = /^hsl\(\s*\d+\s*,\s*\d+%\s*,\s*\d+%\s*\)$/;
const HSLA_COLOR_REGEX =
  /^hsla\(\s*\d+\s*,\s*\d+%\s*,\s*\d+%\s*,\s*[\d.]+\s*\)$/;

export const useGradientCSS = (): UseGradientCSSReturn => {
  const apiRef = useRef<UseGradientCSSReturn | null>(null);

  // Utility: Round number to specified precision
  const roundToPrecision = useCallback(
    (num: number, precision: number): number => {
      const factor = Math.pow(10, precision);
      return Math.round(num * factor) / factor;
    },
    []
  );

  // Utility: Validate color format
  const isValidColor = useCallback((color: string): boolean => {
    return (
      HEX_COLOR_REGEX.test(color) ||
      RGB_COLOR_REGEX.test(color) ||
      RGBA_COLOR_REGEX.test(color) ||
      HSL_COLOR_REGEX.test(color) ||
      HSLA_COLOR_REGEX.test(color) ||
      color === 'transparent'
    );
  }, []);

  // Utility: Optimize color stops by removing duplicates and ensuring proper ordering
  const optimizeColorStops = useCallback(
    (
      colors: string[],
      stops: number[]
    ): { colors: string[]; stops: number[] } => {
      if (colors.length !== stops.length || colors.length < 2) {
        return { colors, stops };
      }

      // Create combined array for sorting
      const combined = colors.map((color, index) => ({
        color,
        rawStop: stops[index],
        stop: Math.max(0, Math.min(1, stops[index] ?? 0)),
      }));

      // Sort by stop position
      combined.sort((a, b) => a.stop - b.stop);

      // Remove duplicates by stop position, preserving first occurrence.
      const optimized = combined.reduce(
        (acc, current, index) => {
          if (index === 0) {
            acc.push(current);
          } else {
            const prev = acc[acc.length - 1];
            const isExplicitDuplicateStop =
              prev &&
              prev.stop === current.stop &&
              prev.rawStop !== undefined &&
              current.rawStop !== undefined;
            if (!isExplicitDuplicateStop) {
              acc.push(current);
            }
          }
          return acc;
        },
        [] as Array<{ color: string; rawStop: number | undefined; stop: number }>
      );

      return {
        colors: optimized.map(item => item.color),
        stops: optimized.map(item => item.stop),
      };
    },
    []
  );

  // Utility: Generate fallback color from gradient colors
  const generateFallbackColor = useCallback((colors: string[]): string => {
    if (colors.length === 0) return 'transparent';
    if (colors.length === 1) return colors[0] ?? 'transparent';

    // Use the middle color as fallback, or first color if only two
    const middleIndex = Math.floor((colors.length - 1) / 2);
    return colors[middleIndex] ?? colors[0] ?? 'transparent';
  }, []);

  // Generate linear gradient CSS
  const generateLinearCSS = useCallback(
    (gradient: GradientData, options?: GradientCSSOptions): string => {
      const opts = { ...DEFAULT_OPTIONS, ...options };
      const angle = gradient.angle ?? 0;
      const angleRounded = roundToPrecision(angle, opts.precision);
      const { colors, stops } = optimizeColorStops(
        gradient.colors,
        gradient.stops
      );

      if (colors.length < 2) {
        return opts.fallbackColor;
      }

      // Validate all colors and filter out invalid ones with their stops
      const validPairs: Array<{ color: string; stop: number }> = [];
      colors.forEach((color, index) => {
        if (isValidColor(color)) {
          validPairs.push({ color, stop: stops[index] ?? 0 });
        }
      });

      if (validPairs.length < 2) {
        return opts.fallbackColor;
      }

      // Create color stops string
      const colorStops = validPairs
        .map(({ color, stop }) => {
          const stopPosition = roundToPrecision(stop * 100, opts.precision);
          return opts.minifyOutput
            ? `${color} ${stopPosition}%`
            : `${color} ${stopPosition}%`;
        })
        .join(opts.minifyOutput ? ',' : ', ');

      const baseGradient = opts.minifyOutput
        ? `linear-gradient(${angleRounded}deg,${colorStops})`
        : `linear-gradient(${angleRounded}deg, ${colorStops})`;

      if (!opts.includePrefixes) {
        return baseGradient;
      }

      // Add vendor prefixes for broader compatibility
      return [
        `${WEBKIT_PREFIX}linear-gradient(${angleRounded}deg, ${colorStops})`,
        `${MOZ_PREFIX}linear-gradient(${angleRounded}deg, ${colorStops})`,
        `${O_PREFIX}linear-gradient(${angleRounded}deg, ${colorStops})`,
        baseGradient,
      ].join(opts.minifyOutput ? ',' : ', ');
    },
    [optimizeColorStops, isValidColor, roundToPrecision]
  );

  // Generate radial gradient CSS
  const generateRadialCSS = useCallback(
    (gradient: GradientData, options?: GradientCSSOptions): string => {
      const opts = { ...DEFAULT_OPTIONS, ...options };
      const centerX = gradient.centerX ?? 50;
      const centerY = gradient.centerY ?? 50;
      const { colors, stops } = optimizeColorStops(
        gradient.colors,
        gradient.stops
      );

      if (colors.length < 2) {
        return opts.fallbackColor;
      }

      // Validate all colors and filter out invalid ones with their stops
      const validPairs: Array<{ color: string; stop: number }> = [];
      colors.forEach((color, index) => {
        if (isValidColor(color)) {
          validPairs.push({ color, stop: stops[index] ?? 0 });
        }
      });

      if (validPairs.length < 2) {
        return opts.fallbackColor;
      }

      // Create color stops string
      const colorStops = validPairs
        .map(({ color, stop }) => {
          const stopPosition = roundToPrecision(stop * 100, opts.precision);
          return opts.minifyOutput
            ? `${color} ${stopPosition}%`
            : `${color} ${stopPosition}%`;
        })
        .join(opts.minifyOutput ? ',' : ', ');

      const centerXRounded = roundToPrecision(centerX, opts.precision);
      const centerYRounded = roundToPrecision(centerY, opts.precision);

      const baseGradient = opts.minifyOutput
        ? `radial-gradient(circle at ${centerXRounded}% ${centerYRounded}%,${colorStops})`
        : `radial-gradient(circle at ${centerXRounded}% ${centerYRounded}%, ${colorStops})`;

      if (!opts.includePrefixes) {
        return baseGradient;
      }

      // Add vendor prefixes
      return [
        `${WEBKIT_PREFIX}radial-gradient(circle at ${centerXRounded}% ${centerYRounded}%, ${colorStops})`,
        `${MOZ_PREFIX}radial-gradient(circle at ${centerXRounded}% ${centerYRounded}%, ${colorStops})`,
        `${O_PREFIX}radial-gradient(circle at ${centerXRounded}% ${centerYRounded}%, ${colorStops})`,
        baseGradient,
      ].join(opts.minifyOutput ? ',' : ', ');
    },
    [optimizeColorStops, isValidColor, roundToPrecision]
  );

  // Generate conic gradient CSS
  const generateConicCSS = useCallback(
    (gradient: GradientData, options?: GradientCSSOptions): string => {
      const opts = { ...DEFAULT_OPTIONS, ...options };
      const angle = gradient.angle ?? 0;
      const centerX = gradient.centerX ?? 50;
      const centerY = gradient.centerY ?? 50;
      const { colors, stops } = optimizeColorStops(
        gradient.colors,
        gradient.stops
      );

      if (colors.length < 2) {
        return opts.fallbackColor;
      }

      // Validate all colors and filter out invalid ones with their stops
      const validPairs: Array<{ color: string; stop: number }> = [];
      colors.forEach((color, index) => {
        if (isValidColor(color)) {
          validPairs.push({ color, stop: stops[index] ?? 0 });
        }
      });

      if (validPairs.length < 2) {
        return opts.fallbackColor;
      }

      // Create color stops string (using degrees for conic)
      const colorStops = validPairs
        .map(({ color, stop }) => {
          const stopPosition = roundToPrecision(stop * 360, opts.precision);
          return opts.minifyOutput
            ? `${color} ${stopPosition}deg`
            : `${color} ${stopPosition}deg`;
        })
        .join(opts.minifyOutput ? ',' : ', ');

      const centerXRounded = roundToPrecision(centerX, opts.precision);
      const centerYRounded = roundToPrecision(centerY, opts.precision);
      const angleRounded = roundToPrecision(angle, opts.precision);

      const baseGradient = opts.minifyOutput
        ? `conic-gradient(from ${angleRounded}deg at ${centerXRounded}% ${centerYRounded}%,${colorStops})`
        : `conic-gradient(from ${angleRounded}deg at ${centerXRounded}% ${centerYRounded}%, ${colorStops})`;

      if (!opts.includePrefixes) {
        return baseGradient;
      }

      // Conic gradients have limited support, but include webkit prefix
      return [
        `${WEBKIT_PREFIX}conic-gradient(from ${angleRounded}deg at ${centerXRounded}% ${centerYRounded}%, ${colorStops})`,
        baseGradient,
      ].join(opts.minifyOutput ? ',' : ', ');
    },
    [optimizeColorStops, isValidColor, roundToPrecision]
  );

  // Main CSS generation function
  const generateCSS = useCallback(
    (gradient: GradientData, options?: GradientCSSOptions): string => {
      if (!gradient || !gradient.colors || gradient.colors.length < 2) {
        const opts = { ...DEFAULT_OPTIONS, ...options };
        return opts.fallbackColor;
      }

      try {
        const api = apiRef.current;
        switch (gradient.type) {
          case 'linear':
            return (api?.generateLinearCSS ?? generateLinearCSS)(
              gradient,
              options
            );
          case 'radial':
            return (api?.generateRadialCSS ?? generateRadialCSS)(
              gradient,
              options
            );
          case 'conic':
            return (api?.generateConicCSS ?? generateConicCSS)(
              gradient,
              options
            );
          default:
            // Default to linear gradient
            return (api?.generateLinearCSS ?? generateLinearCSS)(
              { ...gradient, type: 'linear' },
              options
            );
        }
      } catch (error) {
        console.warn('Error generating gradient CSS:', error);
        const opts = { ...DEFAULT_OPTIONS, ...options };
        return opts.fallbackColor;
      }
    },
    [generateLinearCSS, generateRadialCSS, generateConicCSS]
  );

  // Validate CSS gradient string
  const validateGradientCSS = useCallback((cssString: string): boolean => {
    if (!cssString || typeof cssString !== 'string') {
      return false;
    }

    const trimmed = cssString.trim();

    // Basic validation for gradient functions
    const gradientPattern =
      /^(linear-gradient|radial-gradient|conic-gradient)\s*\(/i;
    if (gradientPattern.test(trimmed) && trimmed.endsWith(')')) {
      return true;
    }

    // Compatibility: allow a trailing color-stop fragment produced when
    // splitting prefixed gradient lists on ", ".
    const colorStopTailPattern =
      /^(#[a-f0-9]{3,8}|rgba?\([^)]+\)|hsla?\([^)]+\)|[a-z]+)\s+\d+(\.\d+)?(%|deg)\)$/i;
    return colorStopTailPattern.test(trimmed);
  }, []);

  if (!apiRef.current) {
    apiRef.current = {
      generateCSS,
      generateLinearCSS,
      generateRadialCSS,
      generateConicCSS,
      validateGradientCSS,
      optimizeColorStops,
      generateFallbackColor,
    };
  } else {
    apiRef.current.generateCSS = generateCSS;
    apiRef.current.generateLinearCSS = generateLinearCSS;
    apiRef.current.generateRadialCSS = generateRadialCSS;
    apiRef.current.generateConicCSS = generateConicCSS;
    apiRef.current.validateGradientCSS = validateGradientCSS;
    apiRef.current.optimizeColorStops = optimizeColorStops;
    apiRef.current.generateFallbackColor = generateFallbackColor;
  }

  return apiRef.current;
};

export default useGradientCSS;
