import { useCallback } from 'react';
import {
  GradientValidationOperations,
  GradientValidationResult,
  COLOR_PATTERNS,
  GRADIENT_CONSTANTS,
} from '../../utils/gradient/gradientTypes';

/**
 * Gradient validation hook
 * Provides comprehensive validation for colors, stops, angles, and positions
 */
export const useGradientValidation = (): GradientValidationOperations => {
  /**
   * Validate a color string (supports hex, rgb, rgba, hsl, hsla)
   */
  const validateColor = useCallback((color: string): boolean => {
    if (!color || typeof color !== 'string') {
      return false;
    }

    const trimmedColor = color.trim().toLowerCase();

    // Check hex colors
    if (COLOR_PATTERNS.HEX.test(trimmedColor)) {
      return true;
    }

    // Check RGB colors with range validation
    const rgbMatch = trimmedColor.match(COLOR_PATTERNS.RGB);
    if (rgbMatch) {
      const [, r, g, b] = rgbMatch;
      const red = parseInt(r!, 10);
      const green = parseInt(g!, 10);
      const blue = parseInt(b!, 10);
      return (
        red >= 0 &&
        red <= 255 &&
        green >= 0 &&
        green <= 255 &&
        blue >= 0 &&
        blue <= 255
      );
    }

    // Check RGBA colors with range validation
    const rgbaMatch = trimmedColor.match(COLOR_PATTERNS.RGBA);
    if (rgbaMatch) {
      const [, r, g, b, a] = rgbaMatch;
      const red = parseInt(r!, 10);
      const green = parseInt(g!, 10);
      const blue = parseInt(b!, 10);
      const alpha = parseFloat(a!);
      return (
        red >= 0 &&
        red <= 255 &&
        green >= 0 &&
        green <= 255 &&
        blue >= 0 &&
        blue <= 255 &&
        alpha >= 0 &&
        alpha <= 1
      );
    }

    // Check HSL colors with range validation
    const hslMatch = trimmedColor.match(COLOR_PATTERNS.HSL);
    if (hslMatch) {
      const [, h, s, l] = hslMatch;
      const hue = parseInt(h!, 10);
      const saturation = parseInt(s!, 10);
      const lightness = parseInt(l!, 10);
      return (
        hue >= 0 &&
        hue <= 360 &&
        saturation >= 0 &&
        saturation <= 100 &&
        lightness >= 0 &&
        lightness <= 100
      );
    }

    // Check HSLA colors with range validation
    const hslaMatch = trimmedColor.match(COLOR_PATTERNS.HSLA);
    if (hslaMatch) {
      const [, h, s, l, a] = hslaMatch;
      const hue = parseInt(h!, 10);
      const saturation = parseInt(s!, 10);
      const lightness = parseInt(l!, 10);
      const alpha = parseFloat(a!);
      return (
        hue >= 0 &&
        hue <= 360 &&
        saturation >= 0 &&
        saturation <= 100 &&
        lightness >= 0 &&
        lightness <= 100 &&
        alpha >= 0 &&
        alpha <= 1
      );
    }

    return false;
  }, []);

  /**
   * Validate gradient stops array
   */
  const validateStops = useCallback((stops: number[]): boolean => {
    if (!Array.isArray(stops)) {
      return false;
    }

    // Empty arrays are allowed in certain contexts
    if (stops.length === 0) {
      return true;
    }

    // Check if all stops are numbers within valid range
    const allValidNumbers = stops.every(
      stop =>
        typeof stop === 'number' &&
        !isNaN(stop) &&
        stop >= GRADIENT_CONSTANTS.MIN_STOP &&
        stop <= GRADIENT_CONSTANTS.MAX_STOP
    );

    if (!allValidNumbers) {
      return false;
    }

    // Check if stops are in ascending order
    for (let i = 1; i < stops.length; i++) {
      const currentStop = stops[i];
      const previousStop = stops[i - 1];
      if (
        currentStop !== undefined &&
        previousStop !== undefined &&
        currentStop < previousStop
      ) {
        return false;
      }
    }

    return true;
  }, []);

  /**
   * Validate gradient angle (0-360 degrees)
   */
  const validateAngle = useCallback((angle: number): boolean => {
    return (
      typeof angle === 'number' &&
      !isNaN(angle) &&
      isFinite(angle) &&
      angle >= GRADIENT_CONSTANTS.MIN_ANGLE &&
      angle <= GRADIENT_CONSTANTS.MAX_ANGLE
    );
  }, []);

  /**
   * Validate position percentage (0-100)
   */
  const validatePosition = useCallback((position: number): boolean => {
    return (
      typeof position === 'number' &&
      !isNaN(position) &&
      position >= GRADIENT_CONSTANTS.MIN_POSITION &&
      position <= GRADIENT_CONSTANTS.MAX_POSITION
    );
  }, []);

  /**
   * Comprehensive gradient data validation
   */
  const validateGradientData = useCallback(
    (colors: string[], stops: number[]): GradientValidationResult => {
      const errors: string[] = [];

      // Validate colors array
      if (!Array.isArray(colors)) {
        errors.push('Colors must be an array');
      } else {
        if (colors.length < GRADIENT_CONSTANTS.MIN_COLORS) {
          errors.push(
            `Gradient must have at least ${GRADIENT_CONSTANTS.MIN_COLORS} colors`
          );
        }

        if (colors.length > GRADIENT_CONSTANTS.MAX_COLORS) {
          errors.push(
            `Gradient cannot have more than ${GRADIENT_CONSTANTS.MAX_COLORS} colors`
          );
        }

        colors.forEach((color, index) => {
          if (!validateColor(color)) {
            errors.push(`Invalid color at index ${index}: ${color}`);
          }
        });
      }

      // Validate stops array
      if (!Array.isArray(stops)) {
        errors.push('Stops must be an array');
      } else {
        if (Array.isArray(colors) && colors.length !== stops.length) {
          errors.push('Colors and stops arrays must have same length');
        }

        if (!validateStops(stops)) {
          errors.push('Invalid stop values or ordering');
        }
      }

      return {
        isValid: errors.length === 0,
        errors,
      };
    },
    [validateColor, validateStops]
  );

  /**
   * Complete gradient object validation
   */
  const validateGradient = useCallback(
    (gradient: any): GradientValidationResult => {
      const errors: string[] = [];

      if (!gradient || typeof gradient !== 'object') {
        errors.push('Gradient must be an object');
        return { isValid: false, errors };
      }

      // Validate colors and stops using existing function
      const colorStopResult = validateGradientData(
        gradient.colors || [],
        gradient.stops || []
      );
      if (!colorStopResult.isValid) {
        errors.push(...colorStopResult.errors);
      }

      // Validate gradient type
      if (
        gradient.type &&
        !['linear', 'radial', 'conic'].includes(gradient.type)
      ) {
        errors.push(
          `Invalid gradient type: "${gradient.type}". Must be linear, radial, or conic.`
        );
      }

      // Validate angle if provided
      if (gradient.angle !== undefined) {
        if (!validateAngle(gradient.angle)) {
          errors.push('Invalid angle: must be between 0 and 360 degrees');
        }
      }

      // Validate center positions if provided
      if (gradient.centerX !== undefined) {
        if (!validatePosition(gradient.centerX)) {
          errors.push('Invalid centerX: must be between 0 and 100');
        }
      }

      if (gradient.centerY !== undefined) {
        if (!validatePosition(gradient.centerY)) {
          errors.push('Invalid centerY: must be between 0 and 100');
        }
      }

      return {
        isValid: errors.length === 0,
        errors,
      };
    },
    [validateGradientData, validateAngle, validatePosition]
  );

  return {
    validateColor,
    validateStops,
    validateAngle,
    validatePosition,
    validateGradientData,
    validateGradient,
  };
};
