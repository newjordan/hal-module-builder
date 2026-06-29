import React from 'react';
import { BaseShape } from './BaseShape';
import {
  ShapeProperties,
  ShapeMetadata,
  PropertyDescriptor,
  ShapeRenderContext,
} from './IShape';

export class PolygonShape extends BaseShape {
  type = 'polygon';

  metadata: ShapeMetadata = {
    displayName: 'Polygon',
    description:
      'A customizable n-sided polygon with regular and irregular modes',
    icon: '⬢',
    category: 'Basic Shapes',
    version: '1.0.0',
  };

  render(
    props: ShapeProperties,
    context: ShapeRenderContext
  ): React.ReactElement | null {
    const { size, isActive = false, animationFrame = 0 } = context;
    const uniqueId = `polygon-${props.id}`;

    // Get polygon-specific properties
    const {
      sides = 6,
      radius = 80,
      mode = 'regular',
      startAngle = 0,
      irregularFactor = 0,
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

    // Calculate polygon points
    const points: string[] = [];
    const angleStep = (2 * Math.PI) / sides;
    const startAngleRad = (startAngle * Math.PI) / 180;

    for (let i = 0; i < sides; i++) {
      const angle = startAngleRad + i * angleStep - Math.PI / 2; // -PI/2 to start pointing up

      // Calculate radius for this vertex
      let vertexRadius = radius;
      if (mode === 'irregular') {
        // Add some variation for irregular polygons
        const variation = Math.sin(i * 2.5) * irregularFactor * radius * 0.3;
        vertexRadius = radius + variation;
      }

      const x = centerX + Math.cos(angle) * vertexRadius;
      const y = centerY + Math.sin(angle) * vertexRadius;
      points.push(`${x},${y}`);
    }

    const pointsString = points.join(' ');

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
          points={pointsString}
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
      sides: 6,
      radius: 80,
      mode: 'regular',
      startAngle: 0,
      irregularFactor: 0,
    };
  }

  getShapeSpecificPropertyDescriptors(): PropertyDescriptor[] {
    return [
      {
        key: 'shapeSpecific.sides',
        displayName: 'Number of Sides',
        type: 'range',
        defaultValue: 6,
        min: 3,
        max: 12,
        step: 1,
        group: 'Shape',
        tooltip: 'Number of polygon sides (3-12)',
      },
      {
        key: 'shapeSpecific.radius',
        displayName: 'Radius',
        type: 'range',
        defaultValue: 80,
        min: 20,
        max: 200,
        step: 1,
        group: 'Dimensions',
        tooltip: 'Distance from center to vertices',
      },
      {
        key: 'shapeSpecific.mode',
        displayName: 'Mode',
        type: 'select',
        defaultValue: 'regular',
        options: [
          { value: 'regular', label: 'Regular' },
          { value: 'irregular', label: 'Irregular' },
        ],
        group: 'Shape',
        tooltip: 'Regular (equal sides) or irregular polygon',
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
        tooltip: 'Starting angle for the first vertex',
      },
      {
        key: 'shapeSpecific.irregularFactor',
        displayName: 'Irregular Factor',
        type: 'range',
        defaultValue: 0,
        min: 0,
        max: 1,
        step: 0.1,
        group: 'Shape',
        tooltip: 'Amount of irregularity (0 = regular, 1 = very irregular)',
      },
    ];
  }

  getBounds(props: ShapeProperties): {
    x: number;
    y: number;
    width: number;
    height: number;
  } {
    const { radius = 80, irregularFactor = 0 } = props.shapeSpecific || {};
    const scale = props.scale || 1;
    const strokeWidth = props.strokeWidth || 2;

    // For irregular polygons, add some padding for the variation
    const effectiveRadius = radius * (1 + irregularFactor * 0.3);
    const boundingSize = effectiveRadius * 2 * scale + strokeWidth;

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
    const { sides, radius, irregularFactor } = props.shapeSpecific || {};

    if (sides && (sides < 3 || sides > 12)) {
      errors.push('Number of sides must be between 3 and 12');
    }

    if (radius && radius <= 0) {
      errors.push('Polygon radius must be greater than 0');
    }

    if (irregularFactor && (irregularFactor < 0 || irregularFactor > 1)) {
      errors.push('Irregular factor must be between 0 and 1');
    }

    if (sides && sides > 8) {
      warnings.push(
        'High number of sides may impact performance with many instances'
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
      'shapeSpecific.sides',
      'shapeSpecific.radius',
      'shapeSpecific.startAngle',
      'shapeSpecific.irregularFactor',
    ];
  }
}
