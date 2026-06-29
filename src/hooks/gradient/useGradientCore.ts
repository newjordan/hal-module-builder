import { useCallback } from 'react';
import {
  GradientData,
  GradientType,
  GradientCoreOperations,
  GRADIENT_CONSTANTS,
} from '../../utils/gradient/gradientTypes';

/**
 * Core gradient operations hook
 * Provides pure gradient manipulation functions without target-specific logic
 */
export const useGradientCore = (): GradientCoreOperations => {
  /**
   * Add a color to a gradient at the specified position
   */
  const addColor = useCallback(
    (
      gradient: GradientData,
      color: string,
      position?: number
    ): GradientData => {
      const colors = [...gradient.colors];
      const stops = [...gradient.stops];

      if (
        position !== undefined &&
        position >= 0 &&
        position <= colors.length
      ) {
        // Insert at specific position
        if (position >= stops.length) {
          // When adding to the end, redistribute all stops evenly
          colors.splice(position, 0, color);

          // Redistribute all stops evenly
          const numColors = colors.length;
          const newStops: number[] = [];
          for (let i = 0; i < numColors; i++) {
            newStops.push(i / (numColors - 1));
          }

          return { ...gradient, colors, stops: newStops };
        } else {
          // Insert at specific position
          colors.splice(position, 0, color);

          // Calculate appropriate stop position
          let newStop: number;
          if (position === 0) {
            newStop = 0;
          } else {
            // Interpolate between adjacent stops
            const prevStop = position > 0 ? (stops[position - 1] ?? 0) : 0;
            const nextStop =
              position < stops.length ? (stops[position] ?? 1) : 1;
            newStop = (prevStop + nextStop) / 2;
          }

          stops.splice(position, 0, newStop);
        }
      } else {
        // Add to end
        colors.push(color);

        // Calculate next stop position - evenly distribute when appending
        if (stops.length === 0) {
          stops.push(1);
        } else if (stops.length === 1) {
          stops.push(1);
          stops[0] = 0;
        } else {
          // For backward compatibility: redistribute all stops evenly
          // when adding a new color to the end
          const newStops: number[] = [];
          const numColors = colors.length;
          for (let i = 0; i < numColors; i++) {
            newStops.push(i / (numColors - 1));
          }
          stops.splice(0, stops.length, ...newStops);
        }
      }

      return { ...gradient, colors, stops };
    },
    []
  );

  /**
   * Remove a color from a gradient at the specified index
   */
  const removeColor = useCallback(
    (gradient: GradientData, index: number): GradientData => {
      if (gradient.colors.length <= GRADIENT_CONSTANTS.MIN_COLORS) {
        throw new Error(
          `Gradient must have at least ${GRADIENT_CONSTANTS.MIN_COLORS} colors`
        );
      }

      if (index < 0 || index >= gradient.colors.length) {
        throw new Error(`Invalid color index: ${index}`);
      }

      const colors = gradient.colors.filter((_, i) => i !== index);
      const stops = gradient.stops.filter((_, i) => i !== index);

      return { ...gradient, colors, stops };
    },
    []
  );

  /**
   * Update a color in a gradient at the specified index
   */
  const updateColor = useCallback(
    (gradient: GradientData, index: number, color: string): GradientData => {
      if (index < 0 || index >= gradient.colors.length) {
        throw new Error(`Invalid color index: ${index}`);
      }

      const colors = [...gradient.colors];
      colors[index] = color;

      return { ...gradient, colors };
    },
    []
  );

  /**
   * Update a stop position in a gradient at the specified index
   */
  const updateStop = useCallback(
    (gradient: GradientData, index: number, stop: number): GradientData => {
      if (index < 0 || index >= gradient.stops.length) {
        throw new Error(`Invalid stop index: ${index}`);
      }

      // Clamp stop value between 0 and 1
      const clampedStop = Math.max(
        GRADIENT_CONSTANTS.MIN_STOP,
        Math.min(GRADIENT_CONSTANTS.MAX_STOP, stop)
      );

      const stops = [...gradient.stops];
      stops[index] = clampedStop;

      return { ...gradient, stops };
    },
    []
  );

  /**
   * Update the gradient type (linear, radial, conic)
   */
  const updateType = useCallback(
    (gradient: GradientData, type: GradientType): GradientData => {
      return { ...gradient, type };
    },
    []
  );

  /**
   * Update the gradient angle (for linear gradients)
   */
  const updateAngle = useCallback(
    (gradient: GradientData, angle: number): GradientData => {
      // Normalize angle to 0-360 range
      const normalizedAngle = ((angle % 360) + 360) % 360;

      return { ...gradient, angle: normalizedAngle };
    },
    []
  );

  /**
   * Update the gradient center position (for radial gradients)
   */
  const updateCenter = useCallback(
    (
      gradient: GradientData,
      centerX: number,
      centerY: number
    ): GradientData => {
      // Clamp center values to 0-100 range (percentages)
      const clampedCenterX = Math.max(
        GRADIENT_CONSTANTS.MIN_POSITION,
        Math.min(GRADIENT_CONSTANTS.MAX_POSITION, centerX)
      );
      const clampedCenterY = Math.max(
        GRADIENT_CONSTANTS.MIN_POSITION,
        Math.min(GRADIENT_CONSTANTS.MAX_POSITION, centerY)
      );

      return { ...gradient, centerX: clampedCenterX, centerY: clampedCenterY };
    },
    []
  );

  return {
    addColor,
    removeColor,
    updateColor,
    updateStop,
    updateType,
    updateAngle,
    updateCenter,
  };
};
