/**
 * LinearLayout - Linear arrangement of visualization elements
 */

import {
  ILayout,
  Position,
  Rectangle,
  LayoutConfig,
  LayoutMetadata,
  Path,
} from './ILayout';

export interface LinearLayoutConfig extends LayoutConfig {
  direction: 'horizontal' | 'vertical';
  reverse: boolean;
  centerElements: boolean;
}

export class LinearLayout extends ILayout {
  readonly type = 'linear';
  readonly metadata: LayoutMetadata = {
    name: 'Linear Layout',
    description: 'Arrange elements in a straight line (horizontal or vertical)',
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
    const linearConfig = config as LinearLayoutConfig;
    const positions: Position[] = [];

    const isHorizontal = linearConfig.direction === 'horizontal';
    const availableSpace = isHorizontal ? bounds.width : bounds.height;
    const elementSpace = (availableSpace - 2 * config.padding) / elementCount;
    const actualElementSize = elementSpace - config.spacing;

    let startPosition: number;

    if (config.alignment === 'start') {
      startPosition = config.padding + actualElementSize / 2;
    } else if (config.alignment === 'end') {
      startPosition = availableSpace - config.padding - actualElementSize / 2;
    } else {
      // Center alignment
      const totalContentSize =
        elementCount * actualElementSize + (elementCount - 1) * config.spacing;
      startPosition =
        (availableSpace - totalContentSize) / 2 + actualElementSize / 2;
    }

    for (let i = 0; i < elementCount; i++) {
      const index = linearConfig.reverse ? elementCount - 1 - i : i;

      let x: number, y: number;

      if (isHorizontal) {
        x = bounds.x + startPosition + index * elementSpace;
        y = linearConfig.centerElements
          ? bounds.y + bounds.height / 2
          : bounds.y + config.padding;
      } else {
        x = linearConfig.centerElements
          ? bounds.x + bounds.width / 2
          : bounds.x + config.padding;
        y = bounds.y + startPosition + index * elementSpace;
      }

      positions.push({
        x,
        y,
        rotation: 0,
        scale: 1,
      });
    }

    return positions;
  }

  getDefaultConfig(): LinearLayoutConfig {
    return {
      spacing: 2,
      padding: 10,
      alignment: 'center',
      distribution: 'equal',
      direction: 'horizontal',
      reverse: false,
      centerElements: true,
    };
  }

  validateConfig(config: LayoutConfig): { valid: boolean; errors?: string[] } {
    const errors: string[] = [];
    const linearConfig = config as LinearLayoutConfig;

    if (
      linearConfig.direction &&
      !['horizontal', 'vertical'].includes(linearConfig.direction)
    ) {
      errors.push('direction must be either "horizontal" or "vertical"');
    }

    if (config.spacing < 0) {
      errors.push('spacing must be non-negative');
    }

    if (config.padding < 0) {
      errors.push('padding must be non-negative');
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
    const linearConfig = config as LinearLayoutConfig;
    const points: Position[] = [];

    // Create linear animation path (sliding motion)
    const isHorizontal = linearConfig.direction === 'horizontal';
    const pathLength = 200; // Fixed path length for animation
    const numPoints = 20;

    for (let i = 0; i < numPoints; i++) {
      const progress = i / (numPoints - 1);
      let x: number, y: number;

      if (isHorizontal) {
        x = progress * pathLength;
        y = 0;
      } else {
        x = 0;
        y = progress * pathLength;
      }

      points.push({
        x,
        y,
        rotation: 0,
        scale: 1,
      });
    }

    return {
      points,
      length: pathLength,
      closed: false,
    };
  }
}
