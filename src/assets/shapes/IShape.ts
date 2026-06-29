/**
 * Shape interface for the extensible shape system
 *
 * This file defines the core interfaces and types for the HAL Module Builder
 * shape system, enabling extensible and customizable geometric shapes with
 * advanced styling and animation capabilities.
 *
 * @fileoverview Core shape system interfaces and types
 */

/**
 * Properties interface for all shapes in the system
 *
 * Defines the complete set of properties that can be applied to any shape,
 * including common properties like transforms and styling, as well as
 * shape-specific configurations.
 *
 * @interface ShapeProperties
 * @example
 * ```typescript
 * const circleProps: ShapeProperties = {
 *   id: 'circle_001',
 *   name: 'Main Circle',
 *   type: 'circle',
 *   visible: true,
 *   opacity: 0.8,
 *   blendMode: 'multiply',
 *   scale: 1.5,
 *   rotation: 45,
 *   offsetX: 100,
 *   offsetY: 50,
 *   fillType: 'gradient',
 *   fillGradient: {
 *     type: 'radial',
 *     colors: ['#ff0000', '#0000ff'],
 *     stops: [0, 1]
 *   },
 *   animation: 'rotate',
 *   animationSpeed: 2
 * };
 * ```
 */
export interface ShapeProperties {
  // Core identification properties
  /** Unique identifier for the shape instance */
  id: string;
  /** Human-readable name for the shape */
  name: string;
  /** Shape type identifier (circle, rectangle, triangle, etc.) */
  type: string;
  /** Whether the shape is visible in the output */
  visible: boolean;
  /** Shape opacity from 0.0 (transparent) to 1.0 (opaque) */
  opacity: number;
  /** CSS blend mode for compositing with other shapes */
  blendMode: string;
  /** Uniform scale factor (1.0 = original size) */
  scale: number;
  /** Rotation angle in degrees */
  rotation: number;
  /** Horizontal offset from origin in pixels */
  offsetX: number;
  /** Vertical offset from origin in pixels */
  offsetY: number;

  // Position properties for shape-specific positioning
  /** Shape-specific X coordinate */
  x?: number;
  /** Shape-specific Y coordinate */
  y?: number;

  // Fill styling properties
  /** Type of fill to apply to the shape */
  fillType?: 'none' | 'solid' | 'gradient';
  /** Solid fill color in hex format */
  fillColor?: string;
  /** Gradient configuration for fill */
  fillGradient?: GradientConfig;

  // Stroke styling properties
  /** Type of stroke to apply to shape outline */
  strokeType?: 'none' | 'solid' | 'gradient';
  /** Solid stroke color in hex format */
  strokeColor?: string;
  /** Stroke width in pixels */
  strokeWidth?: number;
  /** Gradient configuration for stroke */
  strokeGradient?: GradientConfig;
  /** CSS dash array pattern for dashed strokes */
  strokeDasharray?: string;

  // Visual effects
  /** Glow effect intensity from 0.0 (none) to 1.0 (maximum) */
  glowIntensity?: number;
  /** Color of the glow effect in hex format */
  glowColor?: string;

  // Animation properties
  /** Type of animation to apply to the shape */
  animation?: 'none' | 'rotate' | 'pulse' | 'custom';
  /** Speed multiplier for animations (1.0 = normal speed) */
  animationSpeed?: number;

  // Extensibility for shape-specific properties
  /** Shape-specific properties stored as key-value pairs */
  shapeSpecific?: Record<string, any>;
}

/**
 * Gradient configuration for advanced shape styling
 *
 * Supports multiple gradient types including linear, radial, and conic
 * gradients with customizable color stops and positioning.
 *
 * @interface GradientConfig
 * @example
 * ```typescript
 * const linearGradient: GradientConfig = {
 *   type: 'linear',
 *   colors: ['#ff0000', '#ffff00', '#00ff00'],
 *   stops: [0, 0.5, 1],
 *   angle: 45
 * };
 *
 * const radialGradient: GradientConfig = {
 *   type: 'radial',
 *   colors: ['#ffffff', '#000000'],
 *   stops: [0, 1],
 *   centerX: 0.3,
 *   centerY: 0.7
 * };
 * ```
 */
export interface GradientConfig {
  /** Type of gradient (linear, radial, or conic) */
  type: 'linear' | 'radial' | 'conic';
  /** Array of colors in the gradient */
  colors: string[];
  /** Position of each color stop (0.0-1.0) */
  stops: number[];
  /** Angle in degrees for linear gradients */
  angle?: number;
  /** Center X position for radial gradients (0.0-1.0) */
  centerX?: number;
  /** Center Y position for radial gradients (0.0-1.0) */
  centerY?: number;
}

/**
 * Metadata information for shape types
 *
 * Provides descriptive information about shape implementations
 * for UI display and categorization.
 *
 * @interface ShapeMetadata
 * @example
 * ```typescript
 * const circleMetadata: ShapeMetadata = {
 *   displayName: 'Circle',
 *   description: 'A perfect circle shape with radius control',
 *   icon: '⭕',
 *   category: 'Basic Shapes',
 *   version: '1.0.0',
 *   author: 'HAL Team'
 * };
 * ```
 */
export interface ShapeMetadata {
  /** Human-readable display name for the shape */
  displayName: string;
  /** Description of the shape and its capabilities */
  description: string;
  /** Optional icon or emoji representing the shape */
  icon?: string;
  /** Category for organizing shapes in the UI */
  category?: string;
  /** Version of the shape implementation */
  version: string;
  /** Optional author or creator name */
  author?: string;
}

/**
 * Descriptor for shape properties in the UI
 *
 * Defines how shape properties should be displayed and edited
 * in the property panel, including input types, ranges, and grouping.
 *
 * @interface PropertyDescriptor
 * @example
 * ```typescript
 * const radiusProperty: PropertyDescriptor = {
 *   key: 'radius',
 *   displayName: 'Circle Radius',
 *   type: 'range',
 *   defaultValue: 50,
 *   min: 1,
 *   max: 200,
 *   step: 1,
 *   group: 'Geometry',
 *   tooltip: 'Controls the radius of the circle in pixels'
 * };
 * ```
 */
export interface PropertyDescriptor {
  /** Property key in the ShapeProperties object */
  key: string;
  /** Optional label for backwards compatibility */
  label?: string;
  /** Display name shown in the UI */
  displayName?: string;
  /** Input type for the property editor */
  type: 'number' | 'string' | 'boolean' | 'color' | 'select' | 'range';
  /** Default value when creating new shapes */
  defaultValue: any;
  /** Minimum value for numeric properties */
  min?: number;
  /** Maximum value for numeric properties */
  max?: number;
  /** Step increment for range inputs */
  step?: number;
  /** Available options for select inputs */
  options?: Array<{ value: string; label: string }>;
  /** Property group for UI organization */
  group?: string;
  /** Optional category for additional organization */
  category?: string;
  /** Tooltip text explaining the property */
  tooltip?: string;
}

/**
 * Result of shape property validation
 *
 * Returned by shape validation methods to indicate whether properties
 * are valid and provide error or warning messages.
 *
 * @interface ValidationResult
 * @example
 * ```typescript
 * const result: ValidationResult = {
 *   valid: false,
 *   errors: ['Radius must be greater than 0'],
 *   warnings: ['Large radius may impact performance']
 * };
 * ```
 */
export interface ValidationResult {
  /** Whether the properties are valid */
  valid: boolean;
  /** Array of error messages for invalid properties */
  errors?: string[];
  /** Array of warning messages for suboptimal properties */
  warnings?: string[];
}

/**
 * Rendering context provided to shapes during render
 *
 * Contains information about the current rendering state including
 * canvas size, audio data, and animation frame information.
 *
 * @interface ShapeRenderContext
 * @example
 * ```typescript
 * const context: ShapeRenderContext = {
 *   size: 400,
 *   audioData: [0.5, 0.7, 0.3, 0.9],
 *   isActive: true,
 *   animationFrame: 1234
 * };
 * ```
 */
export interface ShapeRenderContext {
  /** Canvas size in pixels (width and height) */
  size: number;
  /** Optional audio frequency data for reactive shapes */
  audioData?: number[];
  /** Whether the shape is currently selected or active */
  isActive?: boolean;
  /** Current animation frame number for smooth animations */
  animationFrame?: number;
}

/**
 * Main shape interface that all shapes must implement
 *
 * Defines the contract for all shape implementations in the HAL Module Builder.
 * Shapes must provide rendering, property management, validation, and bounds
 * calculation capabilities.
 *
 * @interface IShape
 * @example
 * ```typescript
 * class MyCustomShape implements IShape {
 *   type = 'my-custom-shape';
 *   metadata = {
 *     displayName: 'Custom Shape',
 *     description: 'A custom shape implementation',
 *     version: '1.0.0'
 *   };
 *
 *   getDefaultProperties() {
 *     return { fillColor: '#ff0000', size: 100 };
 *   }
 *
 *   render(props, context) {
 *     return <svg>...</svg>;
 *   }
 *
 *   // ... other required methods
 * }
 * ```
 */
export interface IShape {
  // Shape identification
  /** Unique type identifier for the shape */
  type: string;
  /** Metadata describing the shape */
  metadata: ShapeMetadata;

  /**
   * Get default properties for new shape instances
   * @returns Partial shape properties with defaults
   */
  getDefaultProperties(): Partial<ShapeProperties>;

  /**
   * Render the shape as a React element
   * @param props - Shape properties to render
   * @param context - Rendering context information
   * @returns React element or null if shape shouldn't render
   */
  render(
    props: ShapeProperties,
    context: ShapeRenderContext
  ): React.ReactElement | null;

  /**
   * Get property descriptors for UI generation
   * @returns Array of property descriptors for the property panel
   */
  getPropertyDescriptors(): PropertyDescriptor[];

  /**
   * Validate shape properties
   * @param props - Properties to validate
   * @returns Validation result with errors and warnings
   */
  validateProperties(props: ShapeProperties): ValidationResult;

  /**
   * Get list of properties that can be animated
   * @returns Array of property names that support animation
   */
  getAnimatableProperties(): string[];

  /**
   * Calculate bounding box for hit testing and positioning
   * @param props - Current shape properties
   * @returns Bounding box coordinates and dimensions
   */
  getBounds(props: ShapeProperties): {
    x: number;
    y: number;
    width: number;
    height: number;
  };

  // Optional lifecycle hooks
  /**
   * Called when a new shape instance is created
   * @param props - Initial properties
   * @returns Modified properties after creation
   */
  onCreate?(props: ShapeProperties): ShapeProperties;

  /**
   * Called when shape properties are updated
   * @param oldProps - Previous properties
   * @param newProps - New properties
   * @returns Modified properties after update
   */
  onUpdate?(
    oldProps: ShapeProperties,
    newProps: ShapeProperties
  ): ShapeProperties;

  /**
   * Called when shape is being destroyed
   * @param props - Final properties before destruction
   */
  onDestroy?(props: ShapeProperties): void;
}

/**
 * Type guard to check if an object implements the IShape interface
 *
 * Validates that an object has all required properties and methods
 * of the IShape interface.
 *
 * @param obj - Object to check
 * @returns True if object implements IShape, false otherwise
 * @example
 * ```typescript
 * if (isShape(unknownObject)) {
 *   // TypeScript now knows unknownObject is IShape
 *   const element = unknownObject.render(props, context);
 * }
 * ```
 */
export function isShape(obj: any): obj is IShape {
  return (
    obj &&
    typeof obj.type === 'string' &&
    obj.metadata &&
    typeof obj.render === 'function' &&
    typeof obj.getDefaultProperties === 'function' &&
    typeof obj.getPropertyDescriptors === 'function' &&
    typeof obj.validateProperties === 'function' &&
    typeof obj.getAnimatableProperties === 'function' &&
    typeof obj.getBounds === 'function'
  );
}
