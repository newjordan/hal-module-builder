import * as React from 'react';
import { BaseShape } from './BaseShape';
import {
  ShapeProperties,
  ShapeMetadata,
  PropertyDescriptor,
  ShapeRenderContext,
} from './IShape';

export interface PolygonProperties extends ShapeProperties {
  sides: number;
  radius: number;
}

export class PolygonShape extends BaseShape<PolygonProperties> {
  type = 'polygon' as const;

  metadata: ShapeMetadata = {
    displayName: 'Polygon',
    description: 'A regular polygon with customizable number of sides',
    category: 'geometric',
    version: '1.0.0',
    author: 'HAL Builder Team',
  };

  override getPropertyDescriptors(): PropertyDescriptor[] {
    const baseDescriptors = super.getPropertyDescriptors();
    return [
      ...baseDescriptors,
      {
        key: 'sides',
        type: 'number',
        label: 'Sides',
        defaultValue: 6,
        min: 3,
        max: 20,
        step: 1,
        category: 'dimensions',
      },
      {
        key: 'radius',
        type: 'number',
        label: 'Radius',
        defaultValue: 50,
        min: 10,
        max: 500,
        step: 1,
        category: 'dimensions',
      },
    ];
  }

  override getDefaultProperties(): PolygonProperties {
    return {
      ...super.getDefaultProperties(),
      sides: 6,
      radius: 50,
    };
  }

  protected override validateShapeSpecific(properties: ShapeProperties): {
    valid: boolean;
    errors?: string[];
  } {
    const errors: string[] = [];
    const props = properties as PolygonProperties;

    // Check both direct properties and shapeSpecific properties
    const sides = properties.shapeSpecific?.sides ?? props.sides;
    if (sides !== undefined) {
      if (sides < 3) {
        errors.push('Polygon sides must be between 3 and 12');
      }
      if (sides > 12) {
        errors.push('Polygon sides must be between 3 and 12');
      }
      if (!Number.isInteger(sides)) {
        errors.push('Number of sides must be an integer');
      }
    }

    const radius = properties.shapeSpecific?.radius ?? props.radius;
    if (radius !== undefined) {
      if (radius < 10) {
        errors.push('Radius must be at least 10');
      }
      if (radius > 500) {
        errors.push('Radius cannot exceed 500');
      }
    }

    const result: { valid: boolean; errors?: string[] } = {
      valid: errors.length === 0,
    };

    if (errors.length > 0) {
      result.errors = errors;
    }

    return result;
  }

  override render(
    props: PolygonProperties,
    _context: ShapeRenderContext
  ): React.ReactElement | null {
    const {
      fillColor = '#ffffff',
      strokeColor = '#000000',
      strokeWidth = 2,
      opacity = 1,
      shapeSpecific,
    } = props;

    const sides = shapeSpecific?.sides ?? props.sides ?? 6;
    const radius = shapeSpecific?.radius ?? props.radius ?? 50;

    // Calculate the total size needed for the canvas
    const totalSize = (radius * 2) + (strokeWidth * 2);
    const center = totalSize / 2;

    const points: [number, number][] = [];
    const angleStep = (Math.PI * 2) / sides;
    const startAngle = -Math.PI / 2; // Start at the top

    for (let i = 0; i < sides; i++) {
      const angle = startAngle + i * angleStep;
      // Calculate points relative to the new center
      const px = center + Math.cos(angle) * radius;
      const py = center + Math.sin(angle) * radius;
      points.push([px, py]);
    }

    const pointsString = points
      .map(point => `${point[0]},${point[1]}`)
      .join(' ');

    return React.createElement(
      'svg',
      {
        width: totalSize,
        height: totalSize,
        viewBox: `0 0 ${totalSize} ${totalSize}`,
      },
      React.createElement('polygon', {
        points: pointsString,
        fill: fillColor,
        stroke: strokeColor,
        strokeWidth: strokeWidth,
        opacity: opacity,
      })
    );
  }

  getShapeSpecificDefaults(): Record<string, any> {
    return {
      sides: 6,
      radius: 50,
    };
  }

  getShapeSpecificPropertyDescriptors(): PropertyDescriptor[] {
    return [
      {
        key: 'sides',
        type: 'number',
        label: 'Sides',
        defaultValue: 6,
        min: 3,
        max: 20,
        step: 1,
        category: 'dimensions',
      },
      {
        key: 'radius',
        type: 'number',
        label: 'Radius',
        defaultValue: 50,
        min: 10,
        max: 500,
        step: 1,
        category: 'dimensions',
      },
    ];
  }

  override getBounds(props: PolygonProperties): {
    x: number;
    y: number;
    width: number;
    height: number;
  } {
    const { x = 0, y = 0, radius } = props;
    return {
      x: x - radius,
      y: y - radius,
      width: radius * 2,
      height: radius * 2,
    };
  }
}
