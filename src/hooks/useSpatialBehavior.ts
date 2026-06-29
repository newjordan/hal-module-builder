/**
 * React Hook for Spatial Behavior System
 * Replaces and extends the useRadialTransform hook
 */

import { useMemo, useCallback } from 'react';
import {
  createSpatialBehavior,
  SpatialPresets,
} from '../services/spatial/SpatialBehaviorSystem';
import {
  SpatialTransform,
  SpatialPosition,
  SpatialBuilder,
} from '../services/spatial/types';

export interface SpatialHookConfig {
  center?: SpatialPosition;
  preset?: keyof typeof SpatialPresets;
  builder?: SpatialBuilder;
}

export interface SpatialHookResult {
  // Core transformation methods
  transformPosition: (index: number, total: number) => SpatialTransform;
  transformBatch: (count: number) => SpatialTransform[];

  // Builder access for dynamic configuration
  spatial: SpatialBuilder;

  // Backward compatibility with radial hook
  calculateRadialPosition: (
    index: number,
    total: number
  ) => { x: number; y: number; angle: number };
  batchTransform: (source: {
    length: number;
  }) => Array<{ x: number; y: number; angle: number }>;
  getVector: (angle: number, magnitude: number) => { dx: number; dy: number };

  // Preset shortcuts
  presets: typeof SpatialPresets;
}

export function useSpatialBehavior(
  config: SpatialHookConfig = {}
): SpatialHookResult {
  // Create the spatial behavior system
  const spatial = useMemo(() => {
    if (config.builder) {
      return config.builder;
    }

    if (config.preset && SpatialPresets[config.preset]) {
      return SpatialPresets[config.preset]();
    }

    // Default to circular equalizer
    return createSpatialBehavior(config.center || { x: 0, y: 0 });
  }, [config.center, config.preset, config.builder]);

  // Core transformation methods
  const transformPosition = useCallback(
    (index: number, total: number): SpatialTransform => {
      return spatial.buildSingle(index, total);
    },
    [spatial]
  );

  const transformBatch = useCallback(
    (count: number): SpatialTransform[] => {
      return spatial.build(count);
    },
    [spatial]
  );

  // Backward compatibility with old radial hook
  const calculateRadialPosition = useCallback(
    (index: number, total: number) => {
      const transform = spatial.buildSingle(index, total);
      return {
        x: transform.position.x,
        y: transform.position.y,
        angle: transform.orientation.angle,
      };
    },
    [spatial]
  );

  const batchTransform = useCallback(
    (source: { length: number }) => {
      const transforms = spatial.build(source.length);
      return transforms.map(t => ({
        x: t.position.x,
        y: t.position.y,
        angle: t.orientation.angle,
      }));
    },
    [spatial]
  );

  const getVector = useCallback((angle: number, magnitude: number) => {
    return {
      dx: Math.cos(angle) * magnitude,
      dy: Math.sin(angle) * magnitude,
    };
  }, []);

  return {
    transformPosition,
    transformBatch,
    spatial,
    calculateRadialPosition,
    batchTransform,
    getVector,
    presets: SpatialPresets,
  };
}

// ===== Preset Hooks for Common Patterns =====

export function useCircularArrangement(center: SpatialPosition, radius = 120) {
  return useSpatialBehavior({
    builder: createSpatialBehavior(center)
      .arrange.circle({ radius })
      .orient.north(),
  });
}

export function useRadialSpokes(center: SpatialPosition, radius = 120) {
  return useSpatialBehavior({
    builder: createSpatialBehavior(center)
      .arrange.circle({ radius })
      .orient.outward(),
  });
}

export function useGalaxySpiral(center: SpatialPosition, arms = 3) {
  return useSpatialBehavior({
    builder: createSpatialBehavior(center)
      .arrange.spiral({
        arms,
        tightness: 0.5,
        innerRadius: 50,
        outerRadius: 200,
      })
      .orient.tangent(),
  });
}

export function useSolarSystem(center: SpatialPosition) {
  return useSpatialBehavior({
    builder: createSpatialBehavior(center)
      .arrange.orbit({
        layers: [
          { radius: 80, count: 4 },
          { radius: 140, count: 8 },
          { radius: 200, count: 2 },
        ],
      })
      .orient.center(),
  });
}

// ===== Migration Helper =====

/**
 * Drop-in replacement for useRadialTransform that provides backward compatibility
 * while enabling access to the new spatial system
 */
export function useRadialTransform(args: {
  config: any;
  center: { x: number; y: number };
}) {
  const { config, center } = args;

  // Create spatial behavior based on legacy config
  const spatialBehavior = useMemo(() => {
    const builder = createSpatialBehavior(center);

    // Map legacy config to new spatial system
    if (config.arcMode || config.layout === 'radial') {
      return builder.arrange
        .circle({
          radius: config.innerRadius || 140,
          startAngle: ((config.startAngle || 0) * Math.PI) / 180,
          endAngle: ((config.endAngle || 360) * Math.PI) / 180,
        })
        .orient.north(); // Default to vertical bars (what user wanted)
    }

    // Fallback to linear arrangement
    return builder.arrange
      .grid({
        rows: 1,
        cols: config.barCount || 32,
        spacing: config.barSpacing || 10,
      })
      .orient.north();
  }, [config, center]);

  const spatial = useSpatialBehavior({ builder: spatialBehavior });

  return {
    transformPosition: spatial.calculateRadialPosition,
    transformBatch: spatial.batchTransform,
    getVector: spatial.getVector,
    isRadialMode: !!(config.arcMode || config.layout === 'radial'),
    config: {
      centerX: center.x,
      centerY: center.y,
      innerRadius: config.innerRadius || 140,
      // ... other legacy config properties
    },

    // Provide access to new spatial system for gradual migration
    spatial: spatial.spatial,
  };
}

// ===== Usage Examples =====

/*
// Modern usage with semantic clarity
const spatialHook = useSpatialBehavior({
  builder: createSpatialBehavior({ x: 400, y: 300 })
    .arrange.circle({ radius: 120 })
    .orient.north()           // Keep bars vertical
    .animate.beatSync({ responsiveness: 0.8 })
    .effects.depth({ enabled: true })
});

// Or using presets
const spokesHook = useRadialSpokes({ x: 400, y: 300 }, 150);

// Backward compatibility
const legacyHook = useRadialTransform({
  config: { arcMode: true, innerRadius: 120 },
  center: { x: 400, y: 300 }
});

// Migration path - old code continues to work
const position = legacyHook.transformPosition(0, 32);

// But new features are available
const spokesMode = legacyHook.spatial.orient.outward().build(32);
*/
