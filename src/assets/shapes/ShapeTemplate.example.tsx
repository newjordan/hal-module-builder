/*
 * Example Shape Implementation Template
 *
 * This file serves as a template and example for creating new shapes.
 * Copy this file and implement the abstract methods to create a new shape.
 *
 * Steps to create a new shape:
 * 1. Copy this file and rename it (e.g., MyShape.ts)
 * 2. Update the class name and type
 * 3. Implement all abstract methods
 * 4. Add shape-specific properties to shapeSpecific defaults
 * 5. Register the shape in index.ts
 * 6. Test the shape implementation
 */

import React from 'react';
import { BaseShape } from './BaseShape';
import {
  ShapeProperties,
  ShapeMetadata,
  PropertyDescriptor,
  ShapeRenderContext,
  ValidationResult,
} from './IShape';

// Example shape implementation
export class ExampleShape extends BaseShape {
  // Required: Unique type identifier
  type = 'example';

  // Required: Shape metadata for UI display
  metadata: ShapeMetadata = {
    displayName: 'Example Shape',
    description: 'An example shape demonstrating the shape system',
    icon: '🔷', // Optional emoji or icon identifier
    category: 'Example', // Optional category for grouping
    version: '1.0.0',
  };

  // Required: Render method - creates the visual representation
  render(
    props: ShapeProperties,
    context: ShapeRenderContext
  ): React.ReactElement | null {
    const { size, isActive = false, animationFrame = 0 } = context;
    const uniqueId = `example-${props.id}`;

    // Calculate animation if active
    let finalRotation = props.rotation || 0;
    if (isActive && props.animation === 'rotate') {
      finalRotation += animationFrame * (props.animationSpeed || 1);
    }

    // Get shape-specific properties
    const { width = 100, height = 60 } = props.shapeSpecific || {};

    // Calculate position
    const centerX = size / 2 + (props.offsetX || 0);
    const centerY = size / 2 + (props.offsetY || 0);

    // Create gradient definitions if needed
    const gradientDefs = this.createGradientDefs(props, uniqueId);

    // Get fill and stroke values
    const { fill, stroke } = this.getFillStroke(props, uniqueId);

    // Create base style with common properties
    const baseStyle: React.CSSProperties = {
      position: 'absolute',
      top: 0,
      left: 0,
      width: size,
      height: size,
      opacity: props.opacity || 1,
      transform: `scale(${props.scale || 1}) rotate(${finalRotation}deg)`,
      transformOrigin: 'center',
      mixBlendMode: (props.blendMode as any) || 'normal',
      // Add glow effect if specified
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
        {/* Include gradient definitions if present */}
        {gradientDefs}

        {/* Example shape: rounded rectangle */}
        <rect
          x={centerX - width / 2}
          y={centerY - height / 2}
          width={width}
          height={height}
          rx={10} // Corner radius
          ry={10}
          fill={fill}
          stroke={stroke}
          strokeWidth={props.strokeWidth || 2}
          strokeDasharray={props.strokeDasharray || ''}
        />

        {/* You can add multiple SVG elements for complex shapes */}
        <circle
          cx={centerX}
          cy={centerY}
          r={5}
          fill={props.strokeColor || '#000000'}
        />
      </svg>
    );
  }

  // Required: Default shape-specific properties
  getShapeSpecificDefaults(): Record<string, any> {
    return {
      width: 100, // Rectangle width
      height: 60, // Rectangle height
      cornerRadius: 10, // Rounded corners
    };
  }

  // Required: Shape-specific property descriptors for UI generation
  getShapeSpecificPropertyDescriptors(): PropertyDescriptor[] {
    return [
      {
        key: 'shapeSpecific.width',
        displayName: 'Width',
        type: 'range',
        defaultValue: 100,
        min: 10,
        max: 300,
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
        max: 300,
        step: 1,
        group: 'Dimensions',
        tooltip: 'Height of the rectangle',
      },
      {
        key: 'shapeSpecific.cornerRadius',
        displayName: 'Corner Radius',
        type: 'range',
        defaultValue: 10,
        min: 0,
        max: 50,
        step: 1,
        group: 'Style',
        tooltip: 'Radius of rounded corners',
      },
    ];
  }

  // Required: Calculate bounding box for hit testing
  getBounds(props: ShapeProperties): {
    x: number;
    y: number;
    width: number;
    height: number;
  } {
    const { width = 100, height = 60 } = props.shapeSpecific || {};
    const scale = props.scale || 1;

    return {
      x: (props.offsetX || 0) - (width * scale) / 2,
      y: (props.offsetY || 0) - (height * scale) / 2,
      width: width * scale,
      height: height * scale,
    };
  }

  // Optional: Override to add shape-specific validation
  protected override validateShapeSpecific(props: ShapeProperties): {
    valid: boolean;
    errors?: string[];
    warnings?: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];
    const { width, height, cornerRadius } = props.shapeSpecific || {};

    if (width && width <= 0) {
      errors.push('Width must be greater than 0');
    }

    if (height && height <= 0) {
      errors.push('Height must be greater than 0');
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
      warnings.push('Corner radius is too large for the dimensions');
    }

    const result: ValidationResult = {
      valid: errors.length === 0,
    };

    if (errors.length > 0) {
      result.errors = errors;
    }

    if (warnings.length > 0) {
      result.warnings = warnings;
    }

    return result;
  }

  // Optional: Override to add shape-specific animatable properties
  protected override getShapeSpecificAnimatableProperties(): string[] {
    return [
      'shapeSpecific.width',
      'shapeSpecific.height',
      'shapeSpecific.cornerRadius',
    ];
  }

  // Optional: Lifecycle hooks
  override onCreate(props: ShapeProperties): ShapeProperties {
    // Called when shape is first created
    // You can modify initial properties here
    return props;
  }

  override onUpdate(
    _oldProps: ShapeProperties,
    newProps: ShapeProperties
  ): ShapeProperties {
    // Called when properties are updated
    // You can add validation or property synchronization here
    return newProps;
  }

  override onDestroy(props: ShapeProperties): void {
    // Called when shape is being destroyed
    // Clean up any resources if needed
    console.log(`Example shape ${props.id} destroyed`);
  }
}

/*
 * Development Guidelines:
 *
 * 1. Performance:
 *    - Keep render method efficient - it's called frequently
 *    - Use React.memo for complex shapes if needed
 *    - Avoid heavy computations in render method
 *
 * 2. Properties:
 *    - Use shapeSpecific object for shape-unique properties
 *    - Always provide sensible defaults
 *    - Use appropriate property types (number, color, select, etc.)
 *    - Group related properties for better UI organization
 *
 * 3. Validation:
 *    - Validate all user inputs in validateShapeSpecific
 *    - Provide helpful error messages
 *    - Use warnings for non-critical issues
 *
 * 4. Animation:
 *    - List all animatable properties accurately
 *    - Support standard animations (rotate, pulse)
 *    - Handle animation state in render method
 *
 * 5. Testing:
 *    - Test with various property combinations
 *    - Verify bounds calculation is accurate
 *    - Test validation rules thoroughly
 *    - Check performance with many instances
 *
 * 6. Accessibility:
 *    - Provide meaningful tooltips
 *    - Use descriptive property names
 *    - Consider color-blind friendly defaults
 *
 * To register your shape:
 * 1. Import in src/assets/shapes/index.ts
 * 2. Add to registerDefaultShapes() function
 * 3. Export from the module
 */
