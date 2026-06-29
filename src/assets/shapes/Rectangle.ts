import * as React from 'react';
import { BaseShape } from './BaseShape';
import {
  ShapeProperties,
  ShapeMetadata,
  PropertyDescriptor,
  ShapeRenderContext,
} from './IShape';

export interface RectangleProperties extends ShapeProperties {
  width: number;
  height: number;
  cornerRadius?: number;
}

export class RectangleShape extends BaseShape<RectangleProperties> {
  type = 'rectangle' as const;

  metadata: ShapeMetadata = {
    displayName: 'Rectangle',
    description: 'A rectangular shape with optional rounded corners',
    category: 'basic',
    version: '1.0.0',
    author: 'HAL Builder Team',
  };

  override getPropertyDescriptors(): PropertyDescriptor[] {
    const baseDescriptors = super.getPropertyDescriptors();
    return [
      ...baseDescriptors,
      {
        key: 'width',
        type: 'number',
        label: 'Width',
        defaultValue: 100,
        min: 1,
        max: 1000,
        step: 1,
        category: 'dimensions',
      },
      {
        key: 'height',
        type: 'number',
        label: 'Height',
        defaultValue: 60,
        min: 1,
        max: 1000,
        step: 1,
        category: 'dimensions',
      },
      {
        key: 'cornerRadius',
        type: 'number',
        label: 'Corner Radius',
        defaultValue: 0,
        min: 0,
        max: 50,
        step: 1,
        category: 'style',
      },
    ];
  }

  override getDefaultProperties(): RectangleProperties {
    return {
      ...super.getDefaultProperties(),
      width: 100,
      height: 100,
      cornerRadius: 0,
    };
  }

  protected override validateShapeSpecific(properties: ShapeProperties): {
    valid: boolean;
    errors?: string[];
  } {
    const errors: string[] = [];
    const props = properties as RectangleProperties;

    // Check both direct properties and shapeSpecific properties
    const width = properties.shapeSpecific?.width ?? props.width;
    if (width !== undefined) {
      if (width <= 0) {
        errors.push('Width must be greater than 0');
      }
      if (width > 1000) {
        errors.push('Width cannot exceed 1000');
      }
    }

    const height = properties.shapeSpecific?.height ?? props.height;
    if (height !== undefined) {
      if (height <= 0) {
        errors.push('Height must be greater than 0');
      }
      if (height > 1000) {
        errors.push('Height cannot exceed 1000');
      }
    }

    const cornerRadius =
      properties.shapeSpecific?.cornerRadius ?? props.cornerRadius;
    if (cornerRadius !== undefined) {
      if (cornerRadius < 0) {
        errors.push('Corner radius cannot be negative');
      }
      if (cornerRadius > 50) {
        errors.push('Corner radius cannot exceed 50');
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
    props: RectangleProperties,
    _context: ShapeRenderContext
  ): React.ReactElement | null {
    const {
      fillColor = '#ffffff',
      strokeColor = '#000000',
      strokeWidth = 2,
      opacity = 1,
      shapeSpecific,
    } = props;

    const width = shapeSpecific?.width ?? props.width ?? 100;
    const height = shapeSpecific?.height ?? props.height ?? 60;
    const cornerRadius = shapeSpecific?.cornerRadius ?? props.cornerRadius ?? 0;

    // Calculate the total size needed for the canvas
    const totalWidth = width + strokeWidth * 2;
    const totalHeight = height + strokeWidth * 2;

    return React.createElement(
      'svg',
      {
        width: totalWidth,
        height: totalHeight,
        viewBox: `0 0 ${totalWidth} ${totalHeight}`,
      },
      React.createElement('rect', {
        x: strokeWidth, // Offset x by strokeWidth to center
        y: strokeWidth, // Offset y by strokeWidth to center
        width,
        height,
        rx: cornerRadius,
        ry: cornerRadius,
        fill: fillColor,
        stroke: strokeColor,
        strokeWidth: strokeWidth,
        opacity: opacity,
      })
    );
  }

  getShapeSpecificDefaults(): Record<string, any> {
    return {
      width: 100,
      height: 100,
      cornerRadius: 0,
    };
  }

  getShapeSpecificPropertyDescriptors(): PropertyDescriptor[] {
    return [
      {
        key: 'width',
        type: 'number',
        label: 'Width',
        defaultValue: 100,
        min: 1,
        max: 1000,
        step: 1,
        category: 'dimensions',
      },
      {
        key: 'height',
        type: 'number',
        label: 'Height',
        defaultValue: 60,
        min: 1,
        max: 1000,
        step: 1,
        category: 'dimensions',
      },
    ];
  }

  override getBounds(props: RectangleProperties): {
    x: number;
    y: number;
    width: number;
    height: number;
  } {
    const { x = 0, y = 0, width, height } = props;
    return { x, y, width, height };
  }
}
