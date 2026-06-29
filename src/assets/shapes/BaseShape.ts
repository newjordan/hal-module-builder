import * as React from 'react';
import {
  IShape,
  ShapeProperties,
  ShapeMetadata,
  PropertyDescriptor,
  ValidationResult,
  ShapeRenderContext,
} from './IShape';

/**
 * Abstract base class for shapes providing common functionality
 *
 * This class provides a foundation for all shape implementations in the
 * HAL Module Builder, handling common properties, validation, and utility
 * methods while allowing concrete shapes to implement their specific behavior.
 *
 * @abstract
 * @class BaseShape
 * @template T - Shape properties type extending ShapeProperties
 * @implements IShape
 * @example
 * ```typescript
 * class CircleShape extends BaseShape<CircleProperties> {
 *   type = 'circle';
 *   metadata = {
 *     displayName: 'Circle',
 *     description: 'A perfect circle shape',
 *     version: '1.0.0'
 *   };
 *
 *   render(props, context) {
 *     return <circle cx={50} cy={50} r={props.radius} />;
 *   }
 *
 *   getShapeSpecificDefaults() {
 *     return { radius: 50 };
 *   }
 *
 *   // ... other abstract method implementations
 * }
 * ```
 */
export abstract class BaseShape<T extends ShapeProperties = ShapeProperties>
  implements IShape
{
  /** Shape type identifier (must be implemented by subclasses) */
  abstract type: string;
  /** Shape metadata (must be implemented by subclasses) */
  abstract metadata: ShapeMetadata;

  /**
   * Default common properties for all shapes
   *
   * These properties are shared across all shape types and provide
   * sensible defaults for new shape instances.
   *
   * @protected
   */
  protected commonDefaultProperties: Partial<T> = {
    visible: true,
    opacity: 1,
    blendMode: 'normal',
    scale: 1,
    rotation: 0,
    offsetX: 0,
    offsetY: 0,
    x: 0,
    y: 0,
    fillType: 'solid',
    fillColor: '#ffffff',
    strokeType: 'solid',
    strokeColor: '#000000',
    strokeWidth: 2,
    glowIntensity: 0,
    animation: 'none',
    animationSpeed: 1,
  } as Partial<T>;

  // Common property descriptors
  protected commonPropertyDescriptors: PropertyDescriptor[] = [
    // Position & Transform
    {
      key: 'offsetX',
      displayName: 'Position X',
      type: 'number',
      defaultValue: 0,
      group: 'Transform',
    },
    {
      key: 'offsetY',
      displayName: 'Position Y',
      type: 'number',
      defaultValue: 0,
      group: 'Transform',
    },
    {
      key: 'scale',
      displayName: 'Scale',
      type: 'range',
      defaultValue: 1,
      min: 0.1,
      max: 3,
      step: 0.1,
      group: 'Transform',
    },
    {
      key: 'rotation',
      displayName: 'Rotation',
      type: 'range',
      defaultValue: 0,
      min: 0,
      max: 360,
      step: 1,
      group: 'Transform',
    },

    // Fill Properties
    {
      key: 'fillType',
      displayName: 'Fill Type',
      type: 'select',
      defaultValue: 'solid',
      options: [
        { value: 'none', label: 'None' },
        { value: 'solid', label: 'Solid' },
        { value: 'gradient', label: 'Gradient' },
      ],
      group: 'Fill',
    },
    {
      key: 'fillColor',
      displayName: 'Fill Color',
      type: 'color',
      defaultValue: '#ffffff',
      group: 'Fill',
    },

    // Stroke Properties
    {
      key: 'strokeType',
      displayName: 'Stroke Type',
      type: 'select',
      defaultValue: 'solid',
      options: [
        { value: 'none', label: 'None' },
        { value: 'solid', label: 'Solid' },
        { value: 'gradient', label: 'Gradient' },
      ],
      group: 'Stroke',
    },
    {
      key: 'strokeColor',
      displayName: 'Stroke Color',
      type: 'color',
      defaultValue: '#000000',
      group: 'Stroke',
    },
    {
      key: 'strokeWidth',
      displayName: 'Stroke Width',
      type: 'range',
      defaultValue: 2,
      min: 0,
      max: 20,
      step: 0.5,
      group: 'Stroke',
    },

    // Effects
    {
      key: 'opacity',
      displayName: 'Opacity',
      type: 'range',
      defaultValue: 1,
      min: 0,
      max: 1,
      step: 0.01,
      group: 'Effects',
    },
    {
      key: 'glowIntensity',
      displayName: 'Glow Intensity',
      type: 'range',
      defaultValue: 0,
      min: 0,
      max: 1,
      step: 0.01,
      group: 'Effects',
    },
    {
      key: 'glowColor',
      displayName: 'Glow Color',
      type: 'color',
      defaultValue: '#ffffff',
      group: 'Effects',
    },

    // Animation
    {
      key: 'animation',
      displayName: 'Animation',
      type: 'select',
      defaultValue: 'none',
      options: [
        { value: 'none', label: 'None' },
        { value: 'rotate', label: 'Rotate' },
        { value: 'pulse', label: 'Pulse' },
      ],
      group: 'Animation',
    },
    {
      key: 'animationSpeed',
      displayName: 'Animation Speed',
      type: 'range',
      defaultValue: 1,
      min: 0.1,
      max: 5,
      step: 0.1,
      group: 'Animation',
    },
  ];

  // Common animatable properties
  protected commonAnimatableProperties: string[] = [
    'offsetX',
    'offsetY',
    'scale',
    'rotation',
    'opacity',
    'fillColor',
    'strokeColor',
    'strokeWidth',
    'glowIntensity',
  ];

  /**
   * Abstract methods that must be implemented by concrete shapes
   *
   * These methods define the shape-specific behavior that each
   * shape implementation must provide.
   */

  /**
   * Render the shape as a React element
   * @param props - Shape properties to render
   * @param context - Rendering context information
   * @returns React element representing the shape
   * @abstract
   */
  abstract render(
    props: ShapeProperties,
    context: ShapeRenderContext
  ): React.ReactElement | null;

  /**
   * Get shape-specific default properties
   * @returns Object containing shape-specific defaults
   * @abstract
   */
  abstract getShapeSpecificDefaults(): Record<string, any>;

  /**
   * Get property descriptors for shape-specific properties
   * @returns Array of property descriptors for UI generation
   * @abstract
   */
  abstract getShapeSpecificPropertyDescriptors(): PropertyDescriptor[];

  /**
   * Calculate bounding box for the shape
   * @param props - Shape properties
   * @returns Bounding box coordinates and dimensions
   * @abstract
   */
  abstract getBounds(props: ShapeProperties): {
    x: number;
    y: number;
    width: number;
    height: number;
  };

  /**
   * Implemented methods with common functionality
   *
   * These methods provide default implementations that combine
   * common functionality with shape-specific behavior.
   */

  /**
   * Get complete default properties for new shape instances
   * @returns Complete shape properties with defaults
   */
  getDefaultProperties(): T {
    return {
      ...this.commonDefaultProperties,
      type: this.type,
      shapeSpecific: this.getShapeSpecificDefaults(),
    } as T;
  }

  /**
   * Get all property descriptors for the shape
   * @returns Combined common and shape-specific property descriptors
   */
  getPropertyDescriptors(): PropertyDescriptor[] {
    return [
      ...this.commonPropertyDescriptors,
      ...this.getShapeSpecificPropertyDescriptors(),
    ];
  }

  /**
   * Validate shape properties with common and shape-specific validation
   * @param props - Properties to validate
   * @returns Validation result with any errors or warnings
   */
  validateProperties(props: ShapeProperties): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate common properties
    if (props.opacity < 0 || props.opacity > 1) {
      errors.push('Opacity must be between 0 and 1');
    }

    if (props.scale && (props.scale <= 0 || props.scale > 10)) {
      warnings.push('Scale should be between 0.1 and 10 for best results');
    }

    if (props.strokeWidth && props.strokeWidth < 0) {
      errors.push('Stroke width cannot be negative');
    }

    // Validate shape-specific properties
    const shapeValidation = this.validateShapeSpecific(props);
    if (shapeValidation.errors) {
      errors.push(...shapeValidation.errors);
    }
    if (shapeValidation.warnings) {
      warnings.push(...shapeValidation.warnings);
    }

    const result = {
      valid: errors.length === 0,
    } as { valid: boolean; errors?: string[]; warnings?: string[] };

    if (errors.length > 0) {
      result.errors = errors;
    }

    if (warnings.length > 0) {
      result.warnings = warnings;
    }

    return result;
  }

  getAnimatableProperties(): string[] {
    return [
      ...this.commonAnimatableProperties,
      ...this.getShapeSpecificAnimatableProperties(),
    ];
  }

  // Optional lifecycle hooks with default implementations
  onCreate?(props: ShapeProperties): ShapeProperties {
    return props;
  }

  onUpdate?(
    _oldProps: ShapeProperties,
    newProps: ShapeProperties
  ): ShapeProperties {
    return newProps;
  }

  onDestroy?(_props: ShapeProperties): void {
    // Default: no cleanup needed
  }

  // Helper methods for subclasses
  protected validateShapeSpecific(_props: ShapeProperties): ValidationResult {
    // Override in subclasses for shape-specific validation
    return { valid: true };
  }

  protected getShapeSpecificAnimatableProperties(): string[] {
    // Override in subclasses to add shape-specific animatable properties
    return [];
  }

  // Utility to create gradient definitions
  protected createGradientDefs(
    props: ShapeProperties,
    uniqueId: string
  ): React.ReactElement | null {
    const { fillType, fillGradient, strokeType, strokeGradient } = props;

    if (fillType !== 'gradient' && strokeType !== 'gradient') {
      return null;
    }

    return React.createElement(
      'defs',
      { key: `${uniqueId}-defs` },
      [
        // Fill gradient
        fillType === 'gradient' &&
          fillGradient &&
          this.createGradientElement(fillGradient, `${uniqueId}-fill`, 'fill'),
        // Stroke gradient
        strokeType === 'gradient' &&
          strokeGradient &&
          this.createGradientElement(
            strokeGradient,
            `${uniqueId}-stroke`,
            'stroke'
          ),
      ].filter(Boolean)
    );
  }

  private createGradientElement(
    gradient: any,
    id: string,
    _type: 'fill' | 'stroke'
  ): React.ReactElement {
    const {
      type: gradientType,
      colors,
      stops,
      angle,
      centerX,
      centerY,
      spreadMethod,
    } = gradient;
    const spread = spreadMethod || 'pad';

    if (gradientType === 'linear') {
      return React.createElement(
        'linearGradient',
        {
          key: id,
          id,
          x1: '0%',
          y1: '0%',
          x2: '100%',
          y2: '0%',
          gradientTransform: angle ? `rotate(${angle} 0.5 0.5)` : undefined,
          spreadMethod: spread,
          gradientUnits: 'objectBoundingBox',
        },
        colors.map((color: string, i: number) =>
          React.createElement('stop', {
            key: i,
            offset: `${(stops?.[i] || 0) * 100}%`,
            stopColor: color,
          })
        )
      );
    } else if (gradientType === 'radial') {
      const cx = centerX !== undefined ? `${centerX * 100}%` : '50%';
      const cy = centerY !== undefined ? `${centerY * 100}%` : '50%';
      // Use focal point same as center for natural-looking radials
      return React.createElement(
        'radialGradient',
        {
          key: id,
          id,
          cx,
          cy,
          fx: cx,
          fy: cy,
          r: '50%',
          spreadMethod: spread,
          gradientUnits: 'objectBoundingBox',
        },
        colors.map((color: string, i: number) =>
          React.createElement('stop', {
            key: i,
            offset: `${(stops?.[i] || 0) * 100}%`,
            stopColor: color,
          })
        )
      );
    } else if (gradientType === 'conic') {
      // SVG doesn't have native conic gradients — approximate with a rotated linear
      return React.createElement(
        'linearGradient',
        {
          key: id,
          id,
          x1: '0%',
          y1: '0%',
          x2: '100%',
          y2: '100%',
          gradientTransform: angle ? `rotate(${angle} 0.5 0.5)` : undefined,
          spreadMethod: spread,
          gradientUnits: 'objectBoundingBox',
        },
        colors.map((color: string, i: number) =>
          React.createElement('stop', {
            key: i,
            offset: `${(stops?.[i] || 0) * 100}%`,
            stopColor: color,
          })
        )
      );
    }

    // Default to linear if type is unknown
    return React.createElement('linearGradient', { key: id, id });
  }

  // Utility to get fill/stroke values
  protected getFillStroke(
    props: ShapeProperties,
    uniqueId: string
  ): { fill: string; stroke: string } {
    let fill = 'none';
    if (props.fillType === 'solid') {
      fill = props.fillColor || 'transparent';
    } else if (props.fillType === 'gradient' && props.fillGradient) {
      fill = `url(#${uniqueId}-fill)`;
    }

    let stroke = 'none';
    if (props.strokeType === 'solid') {
      stroke = props.strokeColor || 'transparent';
    } else if (props.strokeType === 'gradient' && props.strokeGradient) {
      stroke = `url(#${uniqueId}-stroke)`;
    }

    return { fill, stroke };
  }
}
