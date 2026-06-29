/**
 * RadialLayout - Circular arrangement of visualization elements
 */

import {
  ILayout,
  Position,
  Rectangle,
  LayoutConfig,
  LayoutMetadata,
  Path,
} from './ILayout';

export interface RadialLayoutConfig extends LayoutConfig {
  radius: number;
  startAngle: number;
  endAngle: number;
  clockwise: boolean;
  centerX?: number;
  centerY?: number;
}

export class RadialLayout extends ILayout {
  readonly type = 'radial';
  readonly metadata: LayoutMetadata = {
    name: 'Radial Layout',
    description: 'Arrange elements in a circular pattern',
    supports: {
      rotation: true,
      scaling: true,
      animation: true,
      responsive: true,
    },
  };

  calculatePositions(
    elementCount: number,
    bounds: Rectangle,
    config: LayoutConfig
  ): Position[] {
    const radialConfig = config as RadialLayoutConfig;
    const positions: Position[] = [];

    const centerX = radialConfig.centerX ?? bounds.x + bounds.width / 2;
    const centerY = radialConfig.centerY ?? bounds.y + bounds.height / 2;
    const radius = radialConfig.radius;

    const startAngle = (radialConfig.startAngle * Math.PI) / 180;
    const endAngle = (radialConfig.endAngle * Math.PI) / 180;
    const totalAngle = endAngle - startAngle;

    const angleStep = elementCount > 1 ? totalAngle / (elementCount - 1) : 0;

    for (let i = 0; i < elementCount; i++) {
      let angle = startAngle + i * angleStep;

      if (!radialConfig.clockwise) {
        angle = startAngle - i * angleStep;
      }

      // Adjust angle so 0 degrees points up (negative Y direction)
      angle -= Math.PI / 2;

      const x = centerX + Math.cos(angle) * radius;
      const y = centerY + Math.sin(angle) * radius;

      // Calculate rotation to point towards/away from center
      const rotationAngle = ((angle + Math.PI / 2) * 180) / Math.PI;

      positions.push({
        x,
        y,
        rotation: rotationAngle,
        scale: 1,
      });
    }

    return positions;
  }

  getDefaultConfig(): RadialLayoutConfig {
    return {
      spacing: 0,
      padding: 10,
      alignment: 'center',
      distribution: 'equal',
      radius: 150,
      startAngle: 0,
      endAngle: 360,
      clockwise: true,
    };
  }

  validateConfig(config: LayoutConfig): { valid: boolean; errors?: string[] } {
    const errors: string[] = [];
    const radialConfig = config as RadialLayoutConfig;

    if (radialConfig.radius <= 0) {
      errors.push('radius must be positive');
    }

    if (radialConfig.startAngle < -360 || radialConfig.startAngle > 360) {
      errors.push('startAngle must be between -360 and 360 degrees');
    }

    if (radialConfig.endAngle < -360 || radialConfig.endAngle > 360) {
      errors.push('endAngle must be between -360 and 360 degrees');
    }

    const angleDiff = Math.abs(radialConfig.endAngle - radialConfig.startAngle);
    if (angleDiff > 360) {
      errors.push('angle range cannot exceed 360 degrees');
    }

    const result = {
      valid: errors.length === 0,
    } as { valid: boolean; errors?: string[] };

    if (errors.length > 0) {
      result.errors = errors;
    }

    return result;
  }

  override getAnimationPath(_index: number, config: LayoutConfig): Path {
    const radialConfig = config as RadialLayoutConfig;
    const points: Position[] = [];

    // Create circular animation path
    const numPoints = 36; // Full circle in 10-degree increments
    const radius = radialConfig.radius;
    const centerX = radialConfig.centerX || 0;
    const centerY = radialConfig.centerY || 0;

    for (let i = 0; i < numPoints; i++) {
      const angle = (i / numPoints) * 2 * Math.PI - Math.PI / 2;
      const x = centerX + Math.cos(angle) * radius;
      const y = centerY + Math.sin(angle) * radius;

      points.push({
        x,
        y,
        rotation: ((angle + Math.PI / 2) * 180) / Math.PI,
        scale: 1,
      });
    }

    return {
      points,
      length: 2 * Math.PI * radius,
      closed: true,
    };
  }
}
