import * as React from 'react';
import { BaseShape } from './BaseShape';
import {
  ShapeProperties,
  ShapeMetadata,
  PropertyDescriptor,
  ShapeRenderContext,
} from './IShape';

export interface StarProperties extends ShapeProperties {
  points: number;
  outerRadius: number;
  innerRadius: number;
}

export class StarShape extends BaseShape<StarProperties> {
  type = 'star' as const;

  metadata: ShapeMetadata = {
    displayName: 'Star',
    description: 'A star shape with customizable points and radii',
    category: 'decorative',
    version: '1.0.0',
    author: 'HAL Builder Team',
  };

  override getPropertyDescriptors(): PropertyDescriptor[] {
    const baseDescriptors = super.getPropertyDescriptors();
    return [
      ...baseDescriptors,
      {
        key: 'points',
        type: 'number',
        label: 'Points',
        defaultValue: 5,
        min: 3,
        max: 20,
        step: 1,
        category: 'dimensions',
      },
      {
        key: 'outerRadius',
        type: 'number',
        label: 'Outer Radius',
        defaultValue: 50,
        min: 10,
        max: 500,
        step: 1,
        category: 'dimensions',
      },
      {
        key: 'innerRadius',
        type: 'number',
        label: 'Inner Radius',
        defaultValue: 25,
        min: 5,
        max: 250,
        step: 1,
        category: 'dimensions',
      },
    ];
  }

  override getDefaultProperties(): StarProperties {
    return {
      ...super.getDefaultProperties(),
      points: 5,
      outerRadius: 60,
      innerRadius: 30,
    };
  }

  protected override validateShapeSpecific(properties: ShapeProperties): {
    valid: boolean;
    errors?: string[];
  } {
    const errors: string[] = [];
    const props = properties as StarProperties;

    // Check both direct properties and shapeSpecific properties
    const points = properties.shapeSpecific?.points ?? props.points;
    if (points !== undefined) {
      if (points < 3) {
        errors.push('Star points must be between 3 and 12');
      }
      if (points > 12) {
        errors.push('Star points must be between 3 and 12');
      }
      if (!Number.isInteger(points)) {
        errors.push('Number of points must be an integer');
      }
    }

    const outerRadius =
      properties.shapeSpecific?.outerRadius ?? props.outerRadius;
    if (outerRadius !== undefined) {
      if (outerRadius < 10) {
        errors.push('Outer radius must be at least 10');
      }
      if (outerRadius > 500) {
        errors.push('Outer radius cannot exceed 500');
      }
    }

    const innerRadius =
      properties.shapeSpecific?.innerRadius ?? props.innerRadius;
    if (innerRadius !== undefined) {
      if (innerRadius < 5) {
        errors.push('Inner radius must be at least 5');
      }
      if (innerRadius > 250) {
        errors.push('Inner radius cannot exceed 250');
      }
    }

    // Check that inner radius is less than outer radius
    if (innerRadius !== undefined && outerRadius !== undefined) {
      if (innerRadius >= outerRadius) {
        errors.push('Inner radius must be less than outer radius');
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
    props: StarProperties,
    _context: ShapeRenderContext
  ): React.ReactElement | null {
    const {
      fillColor = '#ffffff',
      strokeColor = '#000000',
      strokeWidth = 2,
      opacity = 1,
      shapeSpecific,
    } = props;

    const points = shapeSpecific?.points ?? props.points ?? 5;
    const outerRadius = shapeSpecific?.outerRadius ?? props.outerRadius ?? 50;
    const innerRadius = shapeSpecific?.innerRadius ?? props.innerRadius ?? 25;

    // Calculate the total size needed for the canvas
    const totalSize = outerRadius * 2 + strokeWidth * 2;
    const center = totalSize / 2;

    const angleStep = (Math.PI * 2) / (points * 2);
    const startAngle = -Math.PI / 2;

    const pathPoints: [number, number][] = [];

    for (let i = 0; i < points * 2; i++) {
      const angle = startAngle + i * angleStep;
      const radius = i % 2 === 0 ? outerRadius : innerRadius;
      // Calculate points relative to the new center
      const px = center + Math.cos(angle) * radius;
      const py = center + Math.sin(angle) * radius;
      pathPoints.push([px, py]);
    }

    const pointsString = pathPoints
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
      points: 5,
      outerRadius: 60,
      innerRadius: 30,
    };
  }

  getShapeSpecificPropertyDescriptors(): PropertyDescriptor[] {
    return [
      {
        key: 'points',
        type: 'number',
        label: 'Points',
        defaultValue: 5,
        min: 3,
        max: 20,
        step: 1,
        category: 'dimensions',
      },
      {
        key: 'outerRadius',
        type: 'number',
        label: 'Outer Radius',
        defaultValue: 50,
        min: 10,
        max: 500,
        step: 1,
        category: 'dimensions',
      },
    ];
  }

  override getBounds(props: StarProperties): {
    x: number;
    y: number;
    width: number;
    height: number;
  } {
    const { x = 0, y = 0, outerRadius } = props;
    return {
      x: x - outerRadius,
      y: y - outerRadius,
      width: outerRadius * 2,
      height: outerRadius * 2,
    };
  }
}
