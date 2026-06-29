import React from 'react';
import { BaseShape } from './BaseShape';
import {
  ShapeProperties,
  ShapeMetadata,
  PropertyDescriptor,
  ShapeRenderContext,
} from './IShape';

export class RectangleShape extends BaseShape {
  type = 'rectangle';

  metadata: ShapeMetadata = {
    displayName: 'Rectangle',
    description:
      'A customizable rectangle with rounded corners and gradient support',
    icon: '⬛',
    category: 'Basic Shapes',
    version: '1.0.0',
  };

  render(
    props: ShapeProperties,
    context: ShapeRenderContext
  ): React.ReactElement | null {
    const { size, isActive = false, animationFrame = 0 } = context;
    const uniqueId = `rectangle-${props.id}`;

    // Get rectangle-specific properties
    const {
      width = 100,
      height = 60,
      cornerRadius = 0,
    } = props.shapeSpecific || {};

    // Calculate animation offset (only the animation-specific rotation, not base rotation)
    // Base scale, opacity, and rotation are handled by ShapeRenderer wrapper
    let animationRotationOffset = 0;
    if (isActive && props.animation === 'rotate') {
      animationRotationOffset = animationFrame * (props.animationSpeed || 1);
    }

    // Calculate position
    const centerX = size / 2 + (props.offsetX || 0);
    const centerY = size / 2 + (props.offsetY || 0);

    // Create gradient definitions if needed
    const gradientDefs = this.createGradientDefs(props, uniqueId);

    // Get fill and stroke values
    const { fill, stroke } = this.getFillStroke(props, uniqueId);

    // Create base style
    // Note: scale, opacity, and base rotation are handled by ShapeRenderer wrapper
    // Only apply animation-specific rotation here
    const baseStyle: React.CSSProperties = {
      position: 'absolute',
      top: 0,
      left: 0,
      width: size,
      height: size,
      transform: animationRotationOffset !== 0 ? `rotate(${animationRotationOffset}deg)` : undefined,
      transformOrigin: 'center',
      mixBlendMode: (props.blendMode as any) || 'normal',
      filter:
        (props.glowIntensity || 0) > 0
          ? `drop-shadow(0 0 ${(props.glowIntensity || 0) * 20}px ${props.glowColor || props.fillColor || '#fff'})`
          : undefined,
    };

    return (
      <svg
        key={props.id}
        width={size}
        height={size}
        style={baseStyle}
        viewBox={`0 0 ${size} ${size}`}
      >
        {gradientDefs}
        <rect
          x={centerX - width / 2}
          y={centerY - height / 2}
          width={width}
          height={height}
          rx={cornerRadius}
          ry={cornerRadius}
          fill={fill}
          stroke={stroke}
          strokeWidth={props.strokeWidth || 2}
          strokeDasharray={props.strokeDasharray || ''}
        />
      </svg>
    );
  }

  getShapeSpecificDefaults(): Record<string, any> {
    return {
      width: 100,
      height: 60,
      cornerRadius: 0,
    };
  }

  getShapeSpecificPropertyDescriptors(): PropertyDescriptor[] {
    return [
      {
        key: 'shapeSpecific.width',
        displayName: 'Width',
        type: 'range',
        defaultValue: 100,
        min: 10,
        max: 400,
        step: 1,
        group: 'Dimensions',
        tooltip: 'Width of the rectangle',
      },
      {
        key: 'shapeSpecific.height',
        displayName: 'Height',
        type: 'range',
        defaultValue: 60,
        min: 10,
        max: 400,
        step: 1,
        group: 'Dimensions',
        tooltip: 'Height of the rectangle',
      },
      {
        key: 'shapeSpecific.cornerRadius',
        displayName: 'Corner Radius',
        type: 'range',
        defaultValue: 0,
        min: 0,
        max: 50,
        step: 1,
        group: 'Style',
        tooltip: 'Radius of rounded corners',
      },
    ];
  }

  getBounds(props: ShapeProperties): {
    x: number;
    y: number;
    width: number;
    height: number;
  } {
    const { width = 100, height = 60 } = props.shapeSpecific || {};
    const scale = props.scale || 1;
    const strokeWidth = props.strokeWidth || 2;

    return {
      x: (props.offsetX || 0) - (width * scale + strokeWidth) / 2,
      y: (props.offsetY || 0) - (height * scale + strokeWidth) / 2,
      width: width * scale + strokeWidth,
      height: height * scale + strokeWidth,
    };
  }

  protected validateShapeSpecific(props: ShapeProperties): {
    valid: boolean;
    errors?: string[];
    warnings?: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];
    const { width, height, cornerRadius } = props.shapeSpecific || {};

    if (width && width <= 0) {
      errors.push('Rectangle width must be greater than 0');
    }

    if (height && height <= 0) {
      errors.push('Rectangle height must be greater than 0');
    }

    if (cornerRadius && cornerRadius < 0) {
      errors.push('Corner radius cannot be negative');
    }

    if (
      width &&
      height &&
      cornerRadius &&
      cornerRadius > Math.min(width, height) / 2
    ) {
      warnings.push('Corner radius is too large for the rectangle dimensions');
    }

    return {
      valid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined,
      warnings: warnings.length > 0 ? warnings : undefined,
    };
  }

  protected getShapeSpecificAnimatableProperties(): string[] {
    return [
      'shapeSpecific.width',
      'shapeSpecific.height',
      'shapeSpecific.cornerRadius',
    ];
  }
}
