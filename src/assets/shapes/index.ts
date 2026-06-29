// Main shapes library export with auto-registration
import { shapeLibrary, ShapeLibrary } from './ShapeLibrary';
import {
  IShape,
  ShapeProperties,
  ShapeMetadata,
  PropertyDescriptor,
} from './IShape';

// Import shape modules
import { CircleShape } from './Circle';
import { RectangleShape } from './Rectangle';
import { TriangleShape } from './Triangle';
import { PolygonShape } from './Polygon';
import { StarShape } from './Star';

// Auto-registration function
export function registerDefaultShapes(): void {
  try {
    // Register all available shapes
    const shapes = [
      new CircleShape(),
      new RectangleShape(),
      new TriangleShape(),
      new PolygonShape(),
      new StarShape(),
    ];

    shapes.forEach(shape => {
      const success = shapeLibrary.register(shape);
      if (!success) {
        console.warn(`Failed to register shape: ${shape.type}`);
      }
    });
  } catch (error) {
    console.error('Error registering shapes:', error);
  }
}

// Initialize shapes on module load
let shapesRegistered = false;
export function initializeShapeLibrary(): void {
  if (!shapesRegistered) {
    registerDefaultShapes();
    shapesRegistered = true;
    console.log(
      'Shape library initialized with shapes:',
      shapeLibrary.getShapeTypes()
    );
  }
}

// Eagerly initialize so shapes are available when ShapeRenderer first renders
initializeShapeLibrary();

// Export public API
export type { IShape, ShapeProperties, ShapeMetadata, PropertyDescriptor };
export { shapeLibrary, ShapeLibrary };

// Export types from IShape
export type {
  GradientConfig,
  ValidationResult,
  ShapeRenderContext,
} from './IShape';

// Export events from ShapeLibrary
export type { ShapeRegistrationEvent } from './ShapeLibrary';

// Utility function to create a shape layer
export function createShapeLayer(
  shapeType: string,
  name?: string
): Partial<ShapeProperties & { shapeType: string }> | null {
  if (!shapeLibrary.hasShape(shapeType)) {
    console.warn(`Shape type "${shapeType}" is not registered`);
    return null;
  }

  const shape = shapeLibrary.getShape(shapeType);
  if (!shape) return null;

  const defaultProps = shape.getDefaultProperties();

  // Ensure proper layer type - exclude the shape's type and set the layer type
  const { type: _shapeType, ...shapePropsWithoutType } = defaultProps;

  return {
    ...shapePropsWithoutType,
    name: name || `${shape.metadata.displayName} Layer`,
    type: 'shape' as const, // Layer type should always be 'shape' for shape layers
    shapeType, // The specific shape type (circle, rectangle, etc.)
  };
}

// Utility to get available shapes for UI
export function getAvailableShapes(): Array<{
  type: string;
  metadata: ShapeMetadata;
}> {
  // Ensure shapes are initialized before getting them
  initializeShapeLibrary();

  const shapes = shapeLibrary.getShapeMetadata();
  return shapes;
}
