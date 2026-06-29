import { useCallback } from 'react';
import { Layer } from '../types/layer-types';
import { GradientData, GradientTarget } from '../utils/gradient';

export interface GradientTargetStrategy {
  applyGradient: (layer: Layer, gradient: GradientData) => Partial<Layer>;
  extractGradient: (layer: Layer) => GradientData | null;
  validateTarget: (layer: Layer) => boolean;
}

const targetStrategies: Record<GradientTarget, GradientTargetStrategy> = {
  layer: {
    applyGradient: (_layer, gradient) => ({
      gradient: {
        type: gradient.type,
        colors: gradient.colors,
        stops: gradient.stops,
        ...(gradient.angle !== undefined && { angle: gradient.angle }),
        ...(gradient.centerX !== undefined && { centerX: gradient.centerX }),
        ...(gradient.centerY !== undefined && { centerY: gradient.centerY }),
      },
    }),
    extractGradient: layer => layer.gradient || null,
    validateTarget: layer => {
      // Backward compatibility: legacy projects use "gradient" layers directly.
      if (layer.type === ('gradient' as any)) return true;
      // Native shape fill gradient workflow.
      if (layer.type === 'shape' && layer.fillType === 'gradient') return true;
      return false;
    },
  },

  fill: {
    applyGradient: (layer, gradient) => {
      if (
        (layer.type === 'shape' && layer.shapeType === 'circle') ||
        layer.type === ('circle' as any)
      ) {
        return {
          circleSettings: {
            ...layer.circleSettings!,
            fillGradient: gradient,
          },
        };
      }
      // Generic fill gradient for other layer types
      return {
        fillGradient: gradient,
      };
    },
    extractGradient: layer => {
      if (
        (layer.type === 'shape' && layer.shapeType === 'circle') ||
        layer.type === ('circle' as any)
      ) {
        return layer.circleSettings?.fillGradient || null;
      }
      return (layer as any).fillGradient || null;
    },
    validateTarget: layer =>
      layer.type === 'shape' ||
      layer.type === ('circle' as any) ||
      layer.type === ('text' as any),
  },

  stroke: {
    applyGradient: (layer, gradient) => {
      if (
        (layer.type === 'shape' && layer.shapeType === 'circle') ||
        layer.type === ('circle' as any)
      ) {
        return {
          circleSettings: {
            ...layer.circleSettings!,
            strokeGradient: gradient,
          },
        };
      }
      // Generic stroke gradient for other layer types
      return {
        strokeGradient: gradient,
      };
    },
    extractGradient: layer => {
      if (
        (layer.type === 'shape' && layer.shapeType === 'circle') ||
        layer.type === ('circle' as any)
      ) {
        return layer.circleSettings?.strokeGradient || null;
      }
      return (layer as any).strokeGradient || null;
    },
    validateTarget: layer =>
      layer.type === 'shape' ||
      layer.type === ('circle' as any) ||
      layer.type === ('text' as any),
  },

  radial: {
    applyGradient: (layer, gradient) => ({
      equalizerSettings: {
        ...layer.equalizerSettings!,
        radialGradientSettings: {
          fromCenter:
            layer.equalizerSettings?.radialGradientSettings?.fromCenter ?? true,
          colors: gradient.colors,
          stops: gradient.stops,
        },
      },
    }),
    extractGradient: layer => {
      const settings = layer.equalizerSettings?.radialGradientSettings;
      return settings
        ? {
            type: 'radial' as const,
            colors: settings.colors,
            stops: settings.stops,
            centerX: 50,
            centerY: 50,
          }
        : null;
    },
    validateTarget: layer =>
      layer.type === 'equalizer' ||
      (layer.type === ('effect' as any) && Boolean(layer.equalizerSettings)),
  },

  custom: {
    applyGradient: (layer, gradient) => ({
      equalizerSettings: {
        ...layer.equalizerSettings!,
        customGradient: {
          colors: gradient.colors,
          stops: gradient.stops,
        },
      },
    }),
    extractGradient: layer => {
      return layer.equalizerSettings?.customGradient
        ? {
            type: 'linear' as const,
            colors: layer.equalizerSettings.customGradient.colors,
            stops: layer.equalizerSettings.customGradient.stops,
          }
        : null;
    },
    validateTarget: layer =>
      layer.type === 'equalizer' ||
      (layer.type === ('effect' as any) && Boolean(layer.equalizerSettings)),
  },
};

export interface UseGradientTargetsReturn {
  applyToTarget: (
    layer: Layer,
    gradient: GradientData,
    target: GradientTarget
  ) => Partial<Layer>;
  extractFromTarget: (
    layer: Layer,
    target: GradientTarget
  ) => GradientData | null;
  validateTarget: (layer: Layer, target: GradientTarget) => boolean;
  getSupportedTargets: (layer: Layer) => GradientTarget[];
  getTargetStrategy: (target: GradientTarget) => GradientTargetStrategy;
}

export const useGradientTargets = (): UseGradientTargetsReturn => {
  const applyToTarget = useCallback(
    (
      layer: Layer,
      gradient: GradientData,
      target: GradientTarget
    ): Partial<Layer> => {
      const strategy = targetStrategies[target];

      if (!strategy) {
        throw new Error(`Unknown gradient target: ${target}`);
      }

      if (!strategy.validateTarget(layer)) {
        throw new Error(
          `Target '${target}' is not valid for layer type '${layer.type}'`
        );
      }

      return strategy.applyGradient(layer, gradient);
    },
    []
  );

  const extractFromTarget = useCallback(
    (layer: Layer, target: GradientTarget): GradientData | null => {
      const strategy = targetStrategies[target];

      if (!strategy) {
        throw new Error(`Unknown gradient target: ${target}`);
      }

      if (!strategy.validateTarget(layer)) {
        return null;
      }

      return strategy.extractGradient(layer);
    },
    []
  );

  const validateTarget = useCallback(
    (layer: Layer, target: GradientTarget): boolean => {
      const strategy = targetStrategies[target];
      if (!strategy) {
        return false;
      }
      return strategy.validateTarget(layer);
    },
    []
  );

  const getSupportedTargets = useCallback((layer: Layer): GradientTarget[] => {
    const supportedTargets: GradientTarget[] = [];

    Object.entries(targetStrategies).forEach(([target, strategy]) => {
      if (strategy.validateTarget(layer)) {
        supportedTargets.push(target as GradientTarget);
      }
    });

    return supportedTargets;
  }, []);

  const getTargetStrategy = useCallback(
    (target: GradientTarget): GradientTargetStrategy => {
      const strategy = targetStrategies[target];
      if (!strategy) {
        throw new Error(`Unknown gradient target: ${target}`);
      }
      return strategy;
    },
    []
  );

  return {
    applyToTarget,
    extractFromTarget,
    validateTarget,
    getSupportedTargets,
    getTargetStrategy,
  };
};

export default useGradientTargets;
