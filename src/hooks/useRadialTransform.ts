import { useCallback, useMemo } from 'react';
import { VisualizationConfig } from '../assets/equalizer/visualizations/BaseVisualization';
import { RadialTransformService } from '../services/radial/RadialTransformService';
import { RadialConfig } from '../services/radial/types';

export interface RadialHookArgs {
  config: VisualizationConfig;
  center: { x: number; y: number };
  // Optional: Control how content should be oriented
  orientationMode?: 'maintain' | 'follow-radius' | 'follow-tangent';
}

const resolveRadialConfig = ({
  config,
  center,
  orientationMode,
}: RadialHookArgs): RadialConfig => {
  const resolved: RadialConfig = {
    centerX: center.x,
    centerY: center.y,
    innerRadius: config.innerRadius ?? 140,
    outerRadius: config.outerRadius,
    startAngle: config.startAngle ?? 0,
    endAngle: config.endAngle ?? 360,
    arcMode: config.arcMode ?? false,
    invert: config.invert ?? false,
    orientationMode: orientationMode ?? 'follow-radius',
  };

  const rawDirection = (config as Record<string, unknown>).direction as
    | RadialConfig['direction']
    | undefined;
  if (rawDirection) {
    resolved.direction = rawDirection;
  }

  return resolved;
};

export const useRadialTransform = (args: RadialHookArgs) => {
  const radialConfig = useMemo(
    () => resolveRadialConfig(args),
    [
      args.center.x,
      args.center.y,
      args.config.innerRadius,
      args.config.outerRadius,
      args.config.startAngle,
      args.config.endAngle,
      args.config.arcMode,
      args.config.invert,
      (args.config as Record<string, unknown>).direction,
      args.orientationMode,
    ]
  );

  const transformPosition = useCallback(
    (index: number, total: number) =>
      RadialTransformService.calculateRadialPosition(
        index,
        total,
        radialConfig
      ),
    [radialConfig]
  );

  const transformBatch = useCallback(
    (source: { length: number }) =>
      RadialTransformService.batchTransform(source, radialConfig),
    [radialConfig]
  );

  const getVector = useCallback(
    (angle: number, magnitude: number) =>
      RadialTransformService.getRadialVector(
        angle,
        magnitude,
        radialConfig.invert
      ),
    [radialConfig.invert]
  );

  // Helper to get orientation angle based on mode
  const getOrientation = useCallback(
    (position: {
      angle: number;
      tangent: { x: number; y: number };
      normal: { x: number; y: number };
    }) => {
      const mode = radialConfig.orientationMode || 'follow-radius';

      switch (mode) {
        case 'maintain':
          return 0; // Keep original orientation (e.g., text stays readable)

        case 'follow-tangent':
          return Math.atan2(position.tangent.y, position.tangent.x);

        case 'follow-radius':
        default:
          return Math.atan2(position.normal.y, position.normal.x);
      }
    },
    [radialConfig.orientationMode]
  );

  return {
    transformPosition,
    transformBatch,
    getVector,
    getOrientation,
    isRadialMode: !!radialConfig.arcMode,
    config: radialConfig,
  };
};
