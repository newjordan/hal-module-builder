import React from 'react';
import { BaseShape } from './BaseShape';
import {
  ShapeProperties,
  ShapeMetadata,
  PropertyDescriptor,
  ShapeRenderContext,
} from './IShape';

export class StarShape extends BaseShape {
  type = 'star';

  metadata: ShapeMetadata = {
    displayName: 'Star',
    description:
      'A customizable star with configurable points and inner/outer radius',
    icon: '⭐',
    category: 'Basic Shapes',
    version: '1.0.0',
  };

  render(
    props: ShapeProperties,
    context: ShapeRenderContext
  ): React.ReactElement | null {
    const { size, isActive = false, animationFrame = 0 } = context;
    const uniqueId = `star-${props.id}`;

    // Get star-specific properties
    const {
      points = 5,
      outerRadius = 80,
      innerRadius = 40,
      startAngle = 0,
      style = 'classic',
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

    // Calculate star points
    const pathPoints: string[] = [];
    const angleStep = Math.PI / points; // Half angle because we alternate between outer and inner
    const startAngleRad = (startAngle * Math.PI) / 180 - Math.PI / 2; // -PI/2 to start pointing up

    for (let i = 0; i < points * 2; i++) {
      const angle = startAngleRad + i * angleStep;
      const isOuter = i % 2 === 0;

      let radius = isOuter ? outerRadius : innerRadius;

      // Apply style variations
      if (style === 'rounded') {
        // For rounded stars, adjust inner radius based on angle
        if (!isOuter) {
          radius = innerRadius + (outerRadius - innerRadius) * 0.2;
        }
      } else if (style === 'sharp') {
        // For sharp stars, make inner radius even smaller
        if (!isOuter) {
          radius = innerRadius * 0.6;
        }
      }

      const x = centerX + Math.cos(angle) * radius;
      const y = centerY + Math.sin(angle) * radius;

      if (i === 0) {
        pathPoints.push(`M ${x} ${y}`);
      } else if (style === 'rounded' && !isOuter) {
        // Add smooth curves for rounded style
        const controlOffset = radius * 0.3;
        pathPoints.push(
          `Q ${x + controlOffset * Math.cos(angle + Math.PI / 2)} ${y + controlOffset * Math.sin(angle + Math.PI / 2)} ${x} ${y}`
        );
      } else {
        pathPoints.push(`L ${x} ${y}`);
      }
    }

    pathPoints.push('Z'); // Close the path
    const pathString = pathPoints.join(' ');

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
        <path
          d={pathString}
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
      points: 5,
      outerRadius: 80,
      innerRadius: 40,
      startAngle: 0,
      style: 'classic',
    };
  }

  getShapeSpecificPropertyDescriptors(): PropertyDescriptor[] {
    return [
      {
        key: 'shapeSpecific.points',
        displayName: 'Number of Points',
        type: 'range',
        defaultValue: 5,
        min: 3,
        max: 20,
        step: 1,
        group: 'Shape',
        tooltip: 'Number of star points (3-20)',
      },
      {
        key: 'shapeSpecific.outerRadius',
        displayName: 'Outer Radius',
        type: 'range',
        defaultValue: 80,
        min: 20,
        max: 200,
        step: 1,
        group: 'Dimensions',
        tooltip: 'Distance from center to star points',
      },
      {
        key: 'shapeSpecific.innerRadius',
        displayName: 'Inner Radius',
        type: 'range',
        defaultValue: 40,
        min: 10,
        max: 150,
        step: 1,
        group: 'Dimensions',
        tooltip: 'Distance from center to inner points',
      },
      {
        key: 'shapeSpecific.startAngle',
        displayName: 'Start Angle',
        type: 'range',
        defaultValue: 0,
        min: 0,
        max: 360,
        step: 1,
        group: 'Shape',
        tooltip: 'Starting angle for the first point',
      },
      {
        key: 'shapeSpecific.style',
        displayName: 'Star Style',
        type: 'select',
        defaultValue: 'classic',
        options: [
          { value: 'classic', label: 'Classic' },
          { value: 'sharp', label: 'Sharp' },
          { value: 'rounded', label: 'Rounded' },
        ],
        group: 'Style',
        tooltip: 'Visual style of the star',
      },
    ];
  }

  getBounds(props: ShapeProperties): {
    x: number;
    y: number;
    width: number;
    height: number;
  } {
    const { outerRadius = 80 } = props.shapeSpecific || {};
    const scale = props.scale || 1;
    const strokeWidth = props.strokeWidth || 2;
    const boundingSize = outerRadius * 2 * scale + strokeWidth;

    return {
      x: (props.offsetX || 0) - boundingSize / 2,
      y: (props.offsetY || 0) - boundingSize / 2,
      width: boundingSize,
      height: boundingSize,
    };
  }

  protected validateShapeSpecific(props: ShapeProperties): {
    valid: boolean;
    errors?: string[];
    warnings?: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];
    const { points, outerRadius, innerRadius } = props.shapeSpecific || {};

    if (points && (points < 3 || points > 20)) {
      errors.push('Number of points must be between 3 and 20');
    }

    if (outerRadius && outerRadius <= 0) {
      errors.push('Outer radius must be greater than 0');
    }

    if (innerRadius && innerRadius <= 0) {
      errors.push('Inner radius must be greater than 0');
    }

    if (outerRadius && innerRadius && innerRadius >= outerRadius) {
      errors.push('Inner radius must be smaller than outer radius');
    }

    if (points && points > 12) {
      warnings.push(
        'High number of points may impact performance with many instances'
      );
    }

    if (outerRadius && innerRadius && innerRadius / outerRadius < 0.2) {
      warnings.push(
        'Very small inner radius may create sharp points that are hard to see'
      );
    }

    return {
      valid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined,
      warnings: warnings.length > 0 ? warnings : undefined,
    };
  }

  protected getShapeSpecificAnimatableProperties(): string[] {
    return [
      'shapeSpecific.points',
      'shapeSpecific.outerRadius',
      'shapeSpecific.innerRadius',
      'shapeSpecific.startAngle',
    ];
  }
}
