import { IShape, isShape } from './IShape';

// Shape registration event
export interface ShapeRegistrationEvent {
  type: 'registered' | 'unregistered' | 'error';
  shapeType: string;
  timestamp: number;
  error?: string;
}

// Shape library singleton for managing shape registration
export class ShapeLibrary {
  private static instance: ShapeLibrary;
  private shapes: Map<string, IShape> = new Map();
  private listeners: Set<(event: ShapeRegistrationEvent) => void> = new Set();

  // Private constructor to enforce singleton pattern
  private constructor() {
    // Initialize with no shapes - they'll be registered separately
  }

  // Get singleton instance
  static getInstance(): ShapeLibrary {
    if (!ShapeLibrary.instance) {
      ShapeLibrary.instance = new ShapeLibrary();
    }
    return ShapeLibrary.instance;
  }

  // Register a new shape
  register(shape: IShape): boolean {
    try {
      // Validate shape interface
      if (!isShape(shape)) {
        this.notifyListeners({
          type: 'error',
          shapeType: (shape as any)?.type || 'unknown',
          timestamp: Date.now(),
          error: 'Invalid shape interface',
        });
        return false;
      }

      // Check for duplicate registration
      if (this.shapes.has(shape.type)) {
        this.notifyListeners({
          type: 'error',
          shapeType: shape.type,
          timestamp: Date.now(),
          error: `Shape type "${shape.type}" is already registered`,
        });
        return false;
      }

      // Register the shape
      this.shapes.set(shape.type, shape);

      // Notify listeners
      this.notifyListeners({
        type: 'registered',
        shapeType: shape.type,
        timestamp: Date.now(),
      });

      return true;
    } catch (error) {
      this.notifyListeners({
        type: 'error',
        shapeType: shape?.type || 'unknown',
        timestamp: Date.now(),
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return false;
    }
  }

  // Unregister a shape
  unregister(shapeType: string): boolean {
    if (!this.shapes.has(shapeType)) {
      return false;
    }

    const shape = this.shapes.get(shapeType);

    // Call onDestroy if it exists
    if (shape?.onDestroy) {
      shape.onDestroy({} as any);
    }

    this.shapes.delete(shapeType);

    // Notify listeners
    this.notifyListeners({
      type: 'unregistered',
      shapeType,
      timestamp: Date.now(),
    });

    return true;
  }

  // Get a shape by type
  getShape(type: string): IShape | undefined {
    return this.shapes.get(type);
  }

  // Get all registered shapes
  getAllShapes(): Map<string, IShape> {
    return new Map(this.shapes);
  }

  // Get list of available shape types
  getShapeTypes(): string[] {
    return Array.from(this.shapes.keys());
  }

  // Check if a shape type is registered
  hasShape(type: string): boolean {
    return this.shapes.has(type);
  }

  // Clear all shapes
  clear(): void {
    // Call onDestroy for all shapes
    this.shapes.forEach(shape => {
      if (shape.onDestroy) {
        shape.onDestroy({} as any);
      }
    });

    this.shapes.clear();
  }

  // Add event listener
  addListener(listener: (event: ShapeRegistrationEvent) => void): void {
    this.listeners.add(listener);
  }

  // Remove event listener
  removeListener(listener: (event: ShapeRegistrationEvent) => void): void {
    this.listeners.delete(listener);
  }

  // Notify all listeners
  private notifyListeners(event: ShapeRegistrationEvent): void {
    this.listeners.forEach(listener => {
      try {
        listener(event);
      } catch (error) {
        console.error('Error in shape library listener:', error);
      }
    });
  }

  // Get shape metadata for UI display
  getShapeMetadata(): Array<{ type: string; metadata: any }> {
    const metadata: Array<{ type: string; metadata: any }> = [];
    this.shapes.forEach((shape, type) => {
      metadata.push({
        type,
        metadata: shape.metadata,
      });
    });
    return metadata;
  }

  // Get default properties for a shape type
  getDefaultProperties(type: string): any {
    const shape = this.shapes.get(type);
    if (!shape) {
      return null;
    }

    return shape.getDefaultProperties();
  }

  // Create shape instance with properties
  createShape(type: string, customProps?: any): any {
    const shape = this.shapes.get(type);
    if (!shape) {
      return null;
    }

    const defaultProps = shape.getDefaultProperties();
    return { ...defaultProps, ...customProps };
  }

  // Validate shape properties (alternative method name for compatibility)
  validateShapeProperties(
    type: string,
    props: any
  ): { valid: boolean; errors?: string[] } | null {
    const shape = this.shapes.get(type);
    if (!shape) {
      return null;
    }

    return shape.validateProperties(props);
  }
}

// Export singleton instance
export const shapeLibrary = ShapeLibrary.getInstance();
