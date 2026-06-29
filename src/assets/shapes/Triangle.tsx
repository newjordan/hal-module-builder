import React from 'react';
import { BaseShape } from './BaseShape';
import {
  ShapeProperties,
  ShapeMetadata,
  PropertyDescriptor,
  ShapeRenderContext,
} from './IShape';

export class TriangleShape extends BaseShape {
  type = 'triangle';

  metadata: ShapeMetadata = {
    displayName: 'Triangle',
    description: 'A customizable triangle with different types and styles',
    icon: '🔺',
    category: 'Basic Shapes',
    version: '1.0.0',
  };

  render(
    props: ShapeProperties,
    context: ShapeRenderContext
  ): React.ReactElement | null {
    const { size, isActive = false, animationFrame = 0 } = context;
    const uniqueId = `triangle-${props.id}`;

    // Get triangle-specific properties
    const {
      triangleType = 'equilateral',
      baseWidth = 100,
      height = 80,
      apexX = 0,
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

    // Calculate triangle points based on type
    let points: string;
    const halfBase = baseWidth / 2;
    const halfHeight = height / 2;

    switch (triangleType) {
      case 'equilateral':
        points = `${centerX},${centerY - halfHeight} ${centerX - halfBase},${centerY + halfHeight} ${centerX + halfBase},${centerY + halfHeight}`;
        break;
      case 'isosceles':
        points = `${centerX + apexX},${centerY - halfHeight} ${centerX - halfBase},${centerY + halfHeight} ${centerX + halfBase},${centerY + halfHeight}`;
        break;
      case 'right':
        points = `${centerX - halfBase},${centerY - halfHeight} ${centerX - halfBase},${centerY + halfHeight} ${centerX + halfBase},${centerY + halfHeight}`;
        break;
      case 'scalene': {
        const leftX = centerX - halfBase;
        const rightX = centerX + halfBase * 0.7;
        const topX = centerX + apexX;
        points = `${topX},${centerY - halfHeight} ${leftX},${centerY + halfHeight} ${rightX},${centerY + halfHeight}`;
        break;
      }
      default:
        points = `${centerX},${centerY - halfHeight} ${centerX - halfBase},${centerY + halfHeight} ${centerX + halfBase},${centerY + halfHeight}`;
    }

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
        <polygon
          points={points}
          fill={fill}
          stroke={stroke}
          strokeWidth={props.strokeWidth || 2}
          strokeDasharray={props.strokeDasharray || ''}
          strokeLinejoin='round'
        />
      </svg>
    );
  }

  getShapeSpecificDefaults(): Record<string, any> {
    return {
      triangleType: 'equilateral',
      baseWidth: 100,
      height: 80,
      apexX: 0,
    };
  }

  getShapeSpecificPropertyDescriptors(): PropertyDescriptor[] {
    return [
      {
        key: 'shapeSpecific.triangleType',
        displayName: 'Triangle Type',
        type: 'select',
        defaultValue: 'equilateral',
        options: [
          { value: 'equilateral', label: 'Equilateral' },
          { value: 'isosceles', label: 'Isosceles' },
          { value: 'right', label: 'Right' },
          { value: 'scalene', label: 'Scalene' },
        ],
        group: 'Shape',
        tooltip: 'Type of triangle geometry',
      },
      {
        key: 'shapeSpecific.baseWidth',
        displayName: 'Base Width',
        type: 'range',
        defaultValue: 100,
        min: 20,
        max: 300,
        step: 1,
        group: 'Dimensions',
        tooltip: 'Width of the triangle base',
      },
      {
        key: 'shapeSpecific.height',
        displayName: 'Height',
        type: 'range',
        defaultValue: 80,
        min: 20,
        max: 300,
        step: 1,
        group: 'Dimensions',
        tooltip: 'Height of the triangle',
      },
      {
        key: 'shapeSpecific.apexX',
        displayName: 'Apex Offset',
        type: 'range',
        defaultValue: 0,
        min: -50,
        max: 50,
        step: 1,
        group: 'Shape',
        tooltip:
          'Horizontal offset of the triangle apex (for isosceles and scalene)',
      },
    ];
  }

  getBounds(props: ShapeProperties): {
    x: number;
    y: number;
    width: number;
    height: number;
  } {
    const {
      baseWidth = 100,
      height = 80,
      apexX = 0,
    } = props.shapeSpecific || {};
    const scale = props.scale || 1;
    const strokeWidth = props.strokeWidth || 2;

    // Calculate effective bounds considering apex offset
    const effectiveWidth = Math.max(baseWidth, Math.abs(apexX) * 2);

    return {
      x: (props.offsetX || 0) - (effectiveWidth * scale + strokeWidth) / 2,
      y: (props.offsetY || 0) - (height * scale + strokeWidth) / 2,
      width: effectiveWidth * scale + strokeWidth,
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
    const { baseWidth, height, apexX } = props.shapeSpecific || {};

    if (baseWidth && baseWidth <= 0) {
      errors.push('Triangle base width must be greater than 0');
    }

    if (height && height <= 0) {
      errors.push('Triangle height must be greater than 0');
    }

    if (baseWidth && apexX && Math.abs(apexX) > baseWidth) {
      warnings.push('Apex offset is very large relative to base width');
    }

    return {
      valid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined,
      warnings: warnings.length > 0 ? warnings : undefined,
    };
  }

  protected getShapeSpecificAnimatableProperties(): string[] {
    return [
      'shapeSpecific.baseWidth',
      'shapeSpecific.height',
      'shapeSpecific.apexX',
    ];
  }
}
