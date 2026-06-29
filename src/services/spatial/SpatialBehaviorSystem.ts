/**
 * Spatial Behavior System - Core Implementation
 * Ultra-architecture implementation for comprehensive spatial transformations
 */

import {
  SpatialPosition,
  SpatialOrientation,
  SpatialTransform,
  SpatialBuilder,
  ArrangementBuilder,
  OrientationBuilder,
  AnimationBuilder,
  EffectsBuilder,
  SpatialBehaviorConfig,
  CircleConfig,
  SpiralConfig,
  OrbitConfig,
  GridConfig,
  PositionFunction,
  OrientationFunction,
} from './types';

export class SpatialBehaviorSystemImpl implements SpatialBuilder {
  private config: SpatialBehaviorConfig = {
    center: { x: 0, y: 0 },
    globalScale: 1,
    performanceMode: 'balanced',
  };

  constructor(center?: SpatialPosition) {
    if (center) {
      this.config.center = center;
    }
  }

  // ===== Arrangement Implementations =====

  arrange: ArrangementBuilder = {
    circle: (config: CircleConfig): SpatialBuilder => {
      this.config.arrangement = {
        type: 'circle',
        config,
      };
      return this;
    },

    spiral: (config: SpiralConfig): SpatialBuilder => {
      this.config.arrangement = {
        type: 'spiral',
        config,
      };
      return this;
    },

    orbit: (config: OrbitConfig): SpatialBuilder => {
      this.config.arrangement = {
        type: 'orbit',
        config,
      };
      return this;
    },

    grid: (config: GridConfig): SpatialBuilder => {
      this.config.arrangement = {
        type: 'grid',
        config,
      };
      return this;
    },

    custom: (positionFn: PositionFunction): SpatialBuilder => {
      this.config.arrangement = {
        type: 'custom',
        config: {} as any,
        customFn: positionFn,
      };
      return this;
    },
  };

  // ===== Orientation Implementations =====

  orient: OrientationBuilder = {
    north: (): SpatialBuilder => {
      this.config.orientation = { mode: 'north' };
      return this;
    },

    south: (): SpatialBuilder => {
      this.config.orientation = { mode: 'south' };
      return this;
    },

    east: (): SpatialBuilder => {
      this.config.orientation = { mode: 'east' };
      return this;
    },

    west: (): SpatialBuilder => {
      this.config.orientation = { mode: 'west' };
      return this;
    },

    center: (): SpatialBuilder => {
      this.config.orientation = { mode: 'center' };
      return this;
    },

    outward: (): SpatialBuilder => {
      this.config.orientation = { mode: 'outward' };
      return this;
    },

    tangent: (): SpatialBuilder => {
      this.config.orientation = { mode: 'tangent' };
      return this;
    },

    angle: (degrees: number): SpatialBuilder => {
      this.config.orientation = {
        mode: 'custom',
        offset: (degrees * Math.PI) / 180,
      };
      return this;
    },

    custom: (orientationFn: OrientationFunction): SpatialBuilder => {
      this.config.orientation = {
        mode: 'custom',
        customFunction: orientationFn,
      };
      return this;
    },
  };

  // ===== Animation Implementations =====

  animate: AnimationBuilder = {
    rotate: (config): SpatialBuilder => {
      this.config.animation = {
        type: 'rotate',
        ...config,
      };
      return this;
    },

    pulse: (config): SpatialBuilder => {
      this.config.animation = {
        type: 'scale',
        ...config,
      };
      return this;
    },

    beatSync: (config): SpatialBuilder => {
      this.config.animation = {
        type: 'rotate',
        beatSync: true,
        ...config,
      };
      return this;
    },

    static: (): SpatialBuilder => {
      delete this.config.animation;
      return this;
    },
  };

  // ===== Effects Implementations =====

  effects: EffectsBuilder = {
    depth: (config): SpatialBuilder => {
      if (!this.config.effects) this.config.effects = {};
      this.config.effects.depth = {
        enabled: true,
        ...config,
      };
      return this;
    },

    lighting: (config): SpatialBuilder => {
      if (!this.config.effects) this.config.effects = {};
      this.config.effects.lighting = {
        enabled: true,
        ...config,
      };
      return this;
    },

    none: (): SpatialBuilder => {
      delete this.config.effects;
      return this;
    },
  };

  // ===== Core Transform Generation =====

  build(count: number): SpatialTransform[] {
    const transforms: SpatialTransform[] = [];

    for (let i = 0; i < count; i++) {
      transforms.push(this.buildSingle(i, count));
    }

    return transforms;
  }

  buildSingle(index: number, total: number): SpatialTransform {
    // 1. Calculate position based on arrangement
    const position = this.calculatePosition(index, total);

    // 2. Calculate orientation based on orientation mode
    const orientation = this.calculateOrientation(index, position);

    // 3. Apply effects (depth, scale, etc.)
    const finalTransform: SpatialTransform = {
      position,
      orientation,
    };

    // Apply global scaling
    if (
      this.config.globalScale !== undefined &&
      this.config.globalScale !== 1
    ) {
      finalTransform.scale = this.config.globalScale;
    }

    // Apply depth effects
    if (this.config.effects?.depth?.enabled) {
      finalTransform.depth = this.calculateDepth(position);
    }

    return finalTransform;
  }

  // ===== Position Calculation =====

  private calculatePosition(index: number, total: number): SpatialPosition {
    const arrangement = this.config.arrangement;
    const center = this.config.center || { x: 0, y: 0 };

    if (!arrangement) {
      // Default to circle if no arrangement specified
      return this.calculateCirclePosition(
        index,
        total,
        { radius: 100 },
        center
      );
    }

    switch (arrangement.type) {
      case 'circle':
        return this.calculateCirclePosition(
          index,
          total,
          arrangement.config as CircleConfig,
          center
        );

      case 'spiral':
        return this.calculateSpiralPosition(
          index,
          total,
          arrangement.config as SpiralConfig,
          center
        );

      case 'orbit':
        return this.calculateOrbitPosition(
          index,
          total,
          arrangement.config as OrbitConfig,
          center
        );

      case 'grid':
        return this.calculateGridPosition(
          index,
          total,
          arrangement.config as GridConfig,
          center
        );

      case 'custom':
        return arrangement.customFn!(index, total);

      default:
        return center;
    }
  }

  private calculateCirclePosition(
    index: number,
    total: number,
    config: CircleConfig,
    center: SpatialPosition
  ): SpatialPosition {
    const startAngle = config.startAngle || 0;
    const endAngle = config.endAngle || 2 * Math.PI;
    const angleRange = endAngle - startAngle;

    let angle: number;
    if (config.distribution === 'random') {
      angle = startAngle + Math.random() * angleRange;
    } else {
      // Even distribution
      angle = startAngle + (index / Math.max(1, total - 1)) * angleRange;
    }

    return {
      x: center.x + Math.cos(angle) * config.radius,
      y: center.y + Math.sin(angle) * config.radius,
    };
  }

  private calculateSpiralPosition(
    index: number,
    total: number,
    config: SpiralConfig,
    center: SpatialPosition
  ): SpatialPosition {
    const progress = index / total;
    const radiusProgress =
      config.innerRadius + (config.outerRadius - config.innerRadius) * progress;
    const angleProgress =
      progress * config.arms * 2 * Math.PI * (config.rotations || 2);

    return {
      x: center.x + Math.cos(angleProgress) * radiusProgress,
      y: center.y + Math.sin(angleProgress) * radiusProgress,
    };
  }

  private calculateOrbitPosition(
    index: number,
    _total: number,
    config: OrbitConfig,
    center: SpatialPosition
  ): SpatialPosition {
    // Distribute elements across orbital layers
    let currentIndex = index;

    for (const layer of config.layers) {
      if (currentIndex < layer.count) {
        const angle = (currentIndex / layer.count) * 2 * Math.PI;
        return {
          x: center.x + Math.cos(angle) * layer.radius,
          y: center.y + Math.sin(angle) * layer.radius,
        };
      }
      currentIndex -= layer.count;
    }

    // Fallback to last layer
    const lastLayer = config.layers[config.layers.length - 1];
    if (!lastLayer) {
      return center;
    }
    const angle = (currentIndex / lastLayer.count) * 2 * Math.PI;
    return {
      x: center.x + Math.cos(angle) * lastLayer.radius,
      y: center.y + Math.sin(angle) * lastLayer.radius,
    };
  }

  private calculateGridPosition(
    index: number,
    _total: number,
    config: GridConfig,
    center: SpatialPosition
  ): SpatialPosition {
    const row = Math.floor(index / config.cols);
    const col = index % config.cols;

    const totalWidth = (config.cols - 1) * config.spacing;
    const totalHeight = (config.rows - 1) * config.spacing;

    return {
      x: center.x - totalWidth / 2 + col * config.spacing,
      y: center.y - totalHeight / 2 + row * config.spacing,
    };
  }

  // ===== Orientation Calculation =====

  private calculateOrientation(
    index: number,
    position: SpatialPosition
  ): SpatialOrientation {
    const orientationConfig = this.config.orientation;
    const center = this.config.center || { x: 0, y: 0 };

    if (!orientationConfig) {
      return { angle: 0 }; // Default to no rotation
    }

    let angle = 0;

    switch (orientationConfig.mode) {
      case 'maintain':
      case 'north':
        angle = 0;
        break;

      case 'south':
        angle = Math.PI;
        break;

      case 'east':
        angle = Math.PI / 2;
        break;

      case 'west':
        angle = -Math.PI / 2;
        break;

      case 'center':
        angle = Math.atan2(center.y - position.y, center.x - position.x);
        break;

      case 'outward':
        angle = Math.atan2(position.y - center.y, position.x - center.x);
        break;

      case 'tangent':
        const centerAngle = Math.atan2(
          position.y - center.y,
          position.x - center.x
        );
        angle = centerAngle + Math.PI / 2; // Perpendicular to radius
        break;

      case 'random':
        const range = orientationConfig.randomRange || 2 * Math.PI;
        angle = (Math.random() - 0.5) * range;
        break;

      case 'custom':
        if (orientationConfig.customFunction) {
          angle = orientationConfig.customFunction(index, position);
        } else if (orientationConfig.offset !== undefined) {
          angle = orientationConfig.offset;
        }
        break;
    }

    // Apply any offset
    if (orientationConfig.offset && orientationConfig.mode !== 'custom') {
      angle += orientationConfig.offset;
    }

    const allowedFacing: SpatialOrientation['facing'][] = [
      'north',
      'south',
      'east',
      'west',
      'center',
      'outward',
      'tangent',
    ];
    const facing = allowedFacing.includes(
      orientationConfig.mode as SpatialOrientation['facing']
    )
      ? (orientationConfig.mode as SpatialOrientation['facing'])
      : undefined;

    const result: SpatialOrientation = { angle };
    if (facing !== undefined) {
      result.facing = facing as
        | 'north'
        | 'south'
        | 'east'
        | 'west'
        | 'center'
        | 'outward'
        | 'tangent';
    }
    return result;
  }

  // ===== Effects Calculation =====

  private calculateDepth(position: SpatialPosition): number {
    const depthConfig = this.config.effects?.depth;
    if (!depthConfig || !depthConfig.enabled) return 0;

    const center = this.config.center || { x: 0, y: 0 };
    const distance = Math.sqrt(
      Math.pow(position.x - center.x, 2) + Math.pow(position.y - center.y, 2)
    );

    // Simple depth based on distance from center
    const maxDistance = 200; // Configurable
    return (distance / maxDistance) * (depthConfig.perspective || 1.0);
  }

  // ===== React Hook Integration =====

  toHook(): (count: number) => SpatialTransform[] {
    // Create a function that can be used in React hooks
    return (count: number) => this.build(count);
  }

  // ===== Utility Methods =====

  clone(): SpatialBehaviorSystemImpl {
    const newSystem = new SpatialBehaviorSystemImpl();
    newSystem.config = JSON.parse(JSON.stringify(this.config));
    return newSystem;
  }

  getConfig(): SpatialBehaviorConfig {
    return { ...this.config };
  }
}

// ===== Factory Function =====

export function createSpatialBehavior(
  center?: SpatialPosition
): SpatialBuilder {
  return new SpatialBehaviorSystemImpl(center);
}

// ===== Preset Configurations =====

export const SpatialPresets = {
  // Circular arrangements
  circularEqualizer: (radius = 120) =>
    createSpatialBehavior().arrange.circle({ radius }).orient.north(),

  radialSpokes: (radius = 120) =>
    createSpatialBehavior().arrange.circle({ radius }).orient.outward(),

  // Galaxy and spiral patterns
  galaxySpiral: (arms = 3) =>
    createSpatialBehavior()
      .arrange.spiral({
        arms,
        tightness: 0.5,
        innerRadius: 50,
        outerRadius: 200,
      })
      .orient.tangent(),

  // Grid patterns
  squareGrid: (spacing = 30) =>
    createSpatialBehavior()
      .arrange.grid({ rows: 8, cols: 8, spacing })
      .orient.north(),

  // Solar system
  solarSystem: () =>
    createSpatialBehavior()
      .arrange.orbit({
        layers: [
          { radius: 80, count: 4 },
          { radius: 140, count: 8 },
          { radius: 200, count: 2 },
        ],
      })
      .orient.center(),
};
