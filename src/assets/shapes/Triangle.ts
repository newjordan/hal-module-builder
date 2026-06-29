import * as React from 'react';
import { BaseShape } from './BaseShape';
import {
  ShapeProperties,
  ShapeMetadata,
  PropertyDescriptor,
  ShapeRenderContext,
} from './IShape';

export interface TriangleProperties extends ShapeProperties {
  size: number;
  orientation?: 'up' | 'down' | 'left' | 'right';
  triangleType?: 'equilateral' | 'isosceles';
}

export class TriangleShape extends BaseShape<TriangleProperties> {
  type = 'triangle' as const;

  metadata: ShapeMetadata = {
    displayName: 'Triangle',
    description: 'An equilateral triangle shape with adjustable orientation',
    category: 'basic',
    version: '1.0.0',
    author: 'HAL Builder Team',
  };

  override getPropertyDescriptors(): PropertyDescriptor[] {
    const baseDescriptors = super.getPropertyDescriptors();
    return [
      ...baseDescriptors,
      {
        key: 'size',
        type: 'number',
        label: 'Size',
        defaultValue: 60,
        min: 10,
        max: 500,
        step: 1,
        category: 'dimensions',
      },
      {
        key: 'orientation',
        type: 'select',
        label: 'Orientation',
        defaultValue: 'up',
        options: [
          { value: 'up', label: 'Up' },
          { value: 'down', label: 'Down' },
          { value: 'left', label: 'Left' },
          { value: 'right', label: 'Right' },
        ],
        category: 'style',
      },
      {
        key: 'triangleType',
        type: 'select',
        label: 'Triangle Type',
        defaultValue: 'equilateral',
        options: [
          { value: 'equilateral', label: 'Equilateral' },
          { value: 'isosceles', label: 'Isosceles' },
        ],
        category: 'style',
      },
    ];
  }

  override getDefaultProperties(): TriangleProperties {
    return {
      ...super.getDefaultProperties(),
      size: 60,
      orientation: 'up',
      triangleType: 'equilateral',
    };
  }

  protected override validateShapeSpecific(properties: ShapeProperties): {
    valid: boolean;
    errors?: string[];
  } {
    const errors: string[] = [];
    const props = properties as TriangleProperties;

    // Check both direct properties and shapeSpecific properties
    const size = properties.shapeSpecific?.size ?? props.size;
    if (size !== undefined) {
      if (size < 10) {
        errors.push('Size must be at least 10');
      }
      if (size > 500) {
        errors.push('Size cannot exceed 500');
      }
    }

    const orientation =
      properties.shapeSpecific?.orientation ?? props.orientation;
    if (orientation !== undefined) {
      const validOrientations = ['up', 'down', 'left', 'right'];
      if (!validOrientations.includes(orientation)) {
        errors.push('Invalid orientation. Must be up, down, left, or right');
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
    props: TriangleProperties,
    _context: ShapeRenderContext
  ): React.ReactElement | null {
    const {
      size = 60,
      fillColor = '#ffffff',
      strokeColor = '#000000',
      strokeWidth = 2,
      opacity = 1,
    } = props;
    const height = (Math.sqrt(3) / 2) * size;

    // Calculate the total size needed for the canvas
    const totalWidth = size + strokeWidth * 2;
    const totalHeight = height + strokeWidth * 2;

    // The center of the new, larger canvas
    const centerX = totalWidth / 2;
    const centerY = totalHeight / 2;

    const points = [
      [centerX, centerY - height / 2],
      [centerX - size / 2, centerY + height / 2],
      [centerX + size / 2, centerY + height / 2],
    ];

    const pointsString = points.map(p => `${p[0]},${p[1]}`).join(' ');

    return React.createElement(
      'svg',
      {
        width: totalWidth,
        height: totalHeight,
        viewBox: `0 0 ${totalWidth} ${totalHeight}`,
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
      size: 60,
      orientation: 'up',
    };
  }

  getShapeSpecificPropertyDescriptors(): PropertyDescriptor[] {
    return [
      {
        key: 'size',
        type: 'number',
        label: 'Size',
        defaultValue: 60,
        min: 10,
        max: 500,
        step: 1,
        category: 'dimensions',
      },
    ];
  }

  override getBounds(props: TriangleProperties): {
    x: number;
    y: number;
    width: number;
    height: number;
  } {
    const { x = 0, y = 0, size } = props;
    const height = (Math.sqrt(3) / 2) * size;
    return {
      x: x - size / 2,
      y: y - height / 2,
      width: size,
      height: height,
    };
  }
}
