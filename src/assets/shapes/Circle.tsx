import React from 'react';
import { BaseShape } from './BaseShape';
import {
  ShapeProperties,
  ShapeMetadata,
  PropertyDescriptor,
  ShapeRenderContext,
} from './IShape';

// Circle shape implementation extracted from HalModuleBuilder
export class CircleShape extends BaseShape {
  type = 'circle';

  metadata: ShapeMetadata = {
    displayName: 'Circle',
    description: 'A customizable circle with gradient support and animation',
    icon: '⭕',
    category: 'Basic Shapes',
    version: '1.0.0',
  };

  render(
    props: ShapeProperties,
    context: ShapeRenderContext
  ): React.ReactElement | null {
    const { size, isActive = false, animationFrame = 0 } = context;
    const uniqueId = `circle-${props.id}`;

    // Get circle-specific properties
    // Layer-level props (set by Properties panel) take priority over shapeSpecific defaults
    const circleSettings = props.shapeSpecific || {};
    const radius = circleSettings.radius || 100;
    const thickness = props.strokeWidth ?? circleSettings.thickness ?? 5;
    const fillType = props.fillType || circleSettings.fillType || 'none';
    const strokeType = props.strokeType || circleSettings.strokeType || 'solid';
    const fillColor = props.fillColor || circleSettings.fillColor;
    const strokeColor = props.strokeColor || circleSettings.strokeColor;
    const fillGradient = props.fillGradient || circleSettings.fillGradient;
    const strokeGradient =
      props.strokeGradient || circleSettings.strokeGradient;
    const glowIntensity =
      props.glowIntensity ?? circleSettings.glowIntensity ?? 0;
    const glowColor = props.glowColor || circleSettings.glowColor;
    const dashArray = props.strokeDasharray || circleSettings.dashArray || '';
    const animation = props.animation || circleSettings.animation || 'none';
    const animationSpeed =
      props.animationSpeed || circleSettings.animationSpeed || 1;

    // Calculate animation offset (only the animation-specific rotation, not base rotation)
    // Base rotation is handled by ShapeRenderer wrapper
    let animationRotationOffset = 0;
    if (isActive && animation === 'rotate') {
      animationRotationOffset = animationFrame * animationSpeed;
    }

    // Calculate position
    const centerX = size / 2;
    const centerY = size / 2;

    // Determine fill
    let fill = 'none';
    if (fillType === 'solid') {
      fill = fillColor || 'transparent';
    } else if (fillType === 'gradient' && fillGradient) {
      fill = `url(#${uniqueId}-fill)`;
    }

    // Determine stroke
    let stroke = 'none';
    if (strokeType === 'solid') {
      stroke = strokeColor || 'transparent';
    } else if (strokeType === 'gradient' && strokeGradient) {
      stroke = `url(#${uniqueId}-stroke)`;
    }

    const gradientProps: ShapeProperties = {
      ...props,
      fillType,
      fillColor,
      fillGradient: fillGradient || props.fillGradient,
      strokeType,
      strokeColor,
      strokeGradient,
    };

    const gradientDefs = this.createGradientDefs(gradientProps, uniqueId);

    // Create base style
    // Note: scale, opacity, and base rotation are handled by ShapeRenderer wrapper
    // Only apply animation-specific rotation here
    const baseStyle: React.CSSProperties = {
      position: 'absolute',
      top: 0,
      left: 0,
      width: size,
      height: size,
      transform:
        animationRotationOffset !== 0
          ? `rotate(${animationRotationOffset}deg)`
          : undefined,
      transformOrigin: 'center',
      mixBlendMode: (props.blendMode as any) || 'normal',
      filter:
        glowIntensity > 0
          ? `drop-shadow(0 0 ${glowIntensity * 20}px ${glowColor || strokeColor || '#fff'})`
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
        <circle
          cx={centerX + (props.offsetX || 0)}
          cy={centerY + (props.offsetY || 0)}
          r={radius}
          fill={fill}
          stroke={stroke}
          strokeWidth={thickness}
          strokeDasharray={dashArray}
        />
      </svg>
    );
  }

  getShapeSpecificDefaults(): Record<string, any> {
    return {
      radius: 100,
      thickness: 5,
      fillType: 'none',
      strokeType: 'solid',
      strokeColor: '#ffffff',
      fillColor: '#ffffff',
      fillGradient: {
        type: 'radial',
        colors: ['#ff0000', '#0000ff'],
        stops: [0, 1],
        angle: 0,
      },
      strokeGradient: {
        colors: ['#ff0000', '#0000ff'],
        stops: [0, 1],
      },
      glowIntensity: 0.5,
      glowColor: '#ffffff',
      dashArray: '',
      animation: 'none',
      animationSpeed: 1,
    };
  }

  getShapeSpecificPropertyDescriptors(): PropertyDescriptor[] {
    return [
      // Circle-specific properties
      {
        key: 'shapeSpecific.radius',
        displayName: 'Radius',
        type: 'range',
        defaultValue: 100,
        min: 5,
        max: 300,
        step: 1,
        group: 'Circle',
        tooltip: 'Radius of the circle',
      },
      {
        key: 'shapeSpecific.thickness',
        displayName: 'Stroke Width',
        type: 'range',
        defaultValue: 5,
        min: 0,
        max: 50,
        step: 0.5,
        group: 'Circle',
        tooltip: 'Width of the circle stroke',
      },

      // Fill properties (override common ones for better circle UX)
      {
        key: 'shapeSpecific.fillType',
        displayName: 'Fill Type',
        type: 'select',
        defaultValue: 'none',
        options: [
          { value: 'none', label: 'None' },
          { value: 'solid', label: 'Solid' },
          { value: 'gradient', label: 'Gradient' },
        ],
        group: 'Fill',
      },
      {
        key: 'shapeSpecific.fillColor',
        displayName: 'Fill Color',
        type: 'color',
        defaultValue: '#ffffff',
        group: 'Fill',
      },

      // Stroke properties
      {
        key: 'shapeSpecific.strokeType',
        displayName: 'Stroke Type',
        type: 'select',
        defaultValue: 'solid',
        options: [
          { value: 'solid', label: 'Solid' },
          { value: 'gradient', label: 'Gradient' },
        ],
        group: 'Stroke',
      },
      {
        key: 'shapeSpecific.strokeColor',
        displayName: 'Stroke Color',
        type: 'color',
        defaultValue: '#ffffff',
        group: 'Stroke',
      },
      {
        key: 'shapeSpecific.dashArray',
        displayName: 'Dash Pattern',
        type: 'string',
        defaultValue: '',
        group: 'Stroke',
        tooltip: 'SVG dash pattern (e.g., "5,5" for dashed line)',
      },

      // Effects
      {
        key: 'shapeSpecific.glowIntensity',
        displayName: 'Glow Intensity',
        type: 'range',
        defaultValue: 0.5,
        min: 0,
        max: 2,
        step: 0.1,
        group: 'Effects',
      },
      {
        key: 'shapeSpecific.glowColor',
        displayName: 'Glow Color',
        type: 'color',
        defaultValue: '#ffffff',
        group: 'Effects',
      },

      // Animation
      {
        key: 'shapeSpecific.animation',
        displayName: 'Animation',
        type: 'select',
        defaultValue: 'none',
        options: [
          { value: 'none', label: 'None' },
          { value: 'rotate', label: 'Rotate' },
        ],
        group: 'Animation',
      },
      {
        key: 'shapeSpecific.animationSpeed',
        displayName: 'Animation Speed',
        type: 'range',
        defaultValue: 1,
        min: 0.1,
        max: 5,
        step: 0.1,
        group: 'Animation',
      },
    ];
  }

  getBounds(props: ShapeProperties): {
    x: number;
    y: number;
    width: number;
    height: number;
  } {
    const radius = props.shapeSpecific?.radius || 100;
    const thickness = props.shapeSpecific?.thickness || 5;
    const scale = props.scale || 1;
    const effectiveRadius = (radius + thickness / 2) * scale;

    return {
      x: (props.offsetX || 0) - effectiveRadius,
      y: (props.offsetY || 0) - effectiveRadius,
      width: effectiveRadius * 2,
      height: effectiveRadius * 2,
    };
  }

  protected override validateShapeSpecific(props: ShapeProperties): {
    valid: boolean;
    errors?: string[];
    warnings?: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];
    const settings = props.shapeSpecific || {};

    if (settings.radius && settings.radius <= 0) {
      errors.push('Circle radius must be greater than 0');
    }

    if (settings.thickness && settings.thickness < 0) {
      errors.push('Stroke thickness cannot be negative');
    }

    if (settings.radius && settings.radius > 500) {
      warnings.push('Large radius may impact performance');
    }

    if (settings.glowIntensity && settings.glowIntensity > 1) {
      warnings.push('High glow intensity may impact performance');
    }

    const result: { valid: boolean; errors?: string[]; warnings?: string[] } = {
      valid: errors.length === 0,
    };
    if (errors.length > 0) result.errors = errors;
    if (warnings.length > 0) result.warnings = warnings;
    return result;
  }

  protected override getShapeSpecificAnimatableProperties(): string[] {
    return [
      'shapeSpecific.radius',
      'shapeSpecific.thickness',
      'shapeSpecific.glowIntensity',
    ];
  }

  // Migration helper for backward compatibility with old circleSettings format
  override onCreate(props: ShapeProperties): ShapeProperties {
    // If we have old circleSettings, migrate them to shapeSpecific
    const anyProps = props as any;
    if (anyProps.circleSettings && !props.shapeSpecific) {
      return {
        ...props,
        shapeSpecific: anyProps.circleSettings,
        type: 'circle',
      };
    }
    return props;
  }
}
