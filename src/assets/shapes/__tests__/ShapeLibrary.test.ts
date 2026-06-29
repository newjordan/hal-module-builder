import { ShapeLibrary } from '../ShapeLibrary';
import {
  IShape,
  ShapeProperties,
  ShapeMetadata,
  ShapeRenderContext,
} from '../IShape';
import React from 'react';

// Mock shape for testing
class MockShape implements IShape {
  type = 'mock';
  metadata: ShapeMetadata = {
    displayName: 'Mock Shape',
    description: 'A mock shape for testing',
    category: 'test',
    version: '1.0.0',
    author: 'Test Suite',
    icon: 'test',
  };

  render(
    props: ShapeProperties,
    _context: ShapeRenderContext
  ): React.ReactElement | null {
    return React.createElement('rect', {
      width: 100,
      height: 100,
      fill: props.fillColor || '#000',
    });
  }

  getDefaultProperties(): Partial<ShapeProperties> {
    return {
      type: 'mock',
      fillColor: '#000000',
    };
  }

  getPropertyDescriptors() {
    return [];
  }

  validateProperties(_props: ShapeProperties) {
    return { valid: true };
  }

  getAnimatableProperties() {
    return ['fillColor'];
  }

  getBounds(_props: ShapeProperties) {
    return { x: 0, y: 0, width: 100, height: 100 };
  }
}

describe('ShapeLibrary', () => {
  let library: ShapeLibrary;

  beforeEach(() => {
    // Reset the singleton instance for each test
    (ShapeLibrary as any).instance = undefined;
    library = ShapeLibrary.getInstance();
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      const instance1 = ShapeLibrary.getInstance();
      const instance2 = ShapeLibrary.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('Shape Registration (1.3c-UNIT-001)', () => {
    it('should register a valid shape', () => {
      const shape = new MockShape();
      const result = library.register(shape);

      expect(result).toBe(true);
      expect(library.getShape('mock')).toBe(shape);
    });

    it('should reject duplicate shape registration', () => {
      const shape1 = new MockShape();
      const shape2 = new MockShape();

      expect(library.register(shape1)).toBe(true);
      expect(library.register(shape2)).toBe(false);
    });

    it('should validate shape interface (1.3c-UNIT-002)', () => {
      const invalidShape = {
        type: 'invalid',
        // Missing required methods
      } as any;

      const result = library.register(invalidShape);
      expect(result).toBe(false);
      expect(library.getShape('invalid')).toBeUndefined();
    });

    it('should notify listeners on registration', done => {
      const shape = new MockShape();

      library.addListener(event => {
        expect(event.type).toBe('registered');
        expect(event.shapeType).toBe('mock');
        expect(event.timestamp).toBeDefined();
        done();
      });

      library.register(shape);
    });

    it('should handle registration errors gracefully', () => {
      const errorShape = {
        type: 'error',
        get metadata() {
          throw new Error('Metadata error');
        },
      } as any;

      const result = library.register(errorShape);
      expect(result).toBe(false);
    });
  });

  describe('Shape Unregistration', () => {
    it('should unregister an existing shape', () => {
      const shape = new MockShape();
      library.register(shape);

      const result = library.unregister('mock');
      expect(result).toBe(true);
      expect(library.getShape('mock')).toBeUndefined();
    });

    it('should return false for non-existent shape', () => {
      const result = library.unregister('nonexistent');
      expect(result).toBe(false);
    });

    it('should call onDestroy lifecycle hook', () => {
      const shape = new MockShape();
      shape.onDestroy = jest.fn();

      library.register(shape);
      library.unregister('mock');

      expect(shape.onDestroy).toHaveBeenCalled();
    });
  });

  describe('Runtime Shape Addition (1.3c-INT-001)', () => {
    it('should support runtime shape addition', () => {
      expect(library.getAllShapes().size).toBe(0);

      const shape1 = new MockShape();
      shape1.type = 'runtime1';
      const shape2 = new MockShape();
      shape2.type = 'runtime2';

      library.register(shape1);
      library.register(shape2);

      const allShapes = library.getAllShapes();
      expect(allShapes.size).toBe(2);
      expect(allShapes.has('runtime1')).toBe(true);
      expect(allShapes.has('runtime2')).toBe(true);
    });

    it('should maintain shape registry integrity', () => {
      const shapes = ['shape1', 'shape2', 'shape3'].map(type => {
        const shape = new MockShape();
        shape.type = type;
        return shape;
      });

      shapes.forEach(shape => library.register(shape));

      // Verify all shapes are registered
      shapes.forEach(shape => {
        expect(library.getShape(shape.type)).toBe(shape);
      });

      // Remove middle shape
      library.unregister('shape2');

      // Verify registry integrity
      expect(library.getShape('shape1')).toBeDefined();
      expect(library.getShape('shape2')).toBeUndefined();
      expect(library.getShape('shape3')).toBeDefined();
    });
  });

  describe('Shape Retrieval', () => {
    it('should get a registered shape by type', () => {
      const shape = new MockShape();
      library.register(shape);

      const retrieved = library.getShape('mock');
      expect(retrieved).toBe(shape);
    });

    it('should return undefined for non-existent shape', () => {
      const retrieved = library.getShape('nonexistent');
      expect(retrieved).toBeUndefined();
    });

    it('should list all registered shapes', () => {
      const shape1 = new MockShape();
      shape1.type = 'type1';
      const shape2 = new MockShape();
      shape2.type = 'type2';

      library.register(shape1);
      library.register(shape2);

      const allShapes = library.getAllShapes();
      expect(allShapes.size).toBe(2);
      expect(allShapes.get('type1')).toBe(shape1);
      expect(allShapes.get('type2')).toBe(shape2);
    });

    it('should get shape types', () => {
      const shape1 = new MockShape();
      shape1.type = 'type1';
      const shape2 = new MockShape();
      shape2.type = 'type2';

      library.register(shape1);
      library.register(shape2);

      const types = library.getShapeTypes();
      expect(types).toHaveLength(2);
      expect(types).toContain('type1');
      expect(types).toContain('type2');
    });
  });

  describe('Event Listeners', () => {
    it('should add and remove event listeners', () => {
      const listener = jest.fn();

      library.addListener(listener);

      const shape = new MockShape();
      library.register(shape);

      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'registered',
          shapeType: 'mock',
        })
      );

      library.removeListener(listener);
      library.unregister('mock');

      // Should not be called after removal
      expect(listener).toHaveBeenCalledTimes(1);
    });

    it('should notify multiple listeners', () => {
      const listener1 = jest.fn();
      const listener2 = jest.fn();

      library.addListener(listener1);
      library.addListener(listener2);

      const shape = new MockShape();
      library.register(shape);

      expect(listener1).toHaveBeenCalled();
      expect(listener2).toHaveBeenCalled();
    });
  });

  describe('Shape Factory', () => {
    it('should create shape instance with default properties', () => {
      const shape = new MockShape();
      library.register(shape);

      const instance = library.createShape('mock');
      expect(instance).toBeDefined();
      expect(instance?.type).toBe('mock');
    });

    it('should create shape with custom properties', () => {
      const shape = new MockShape();
      library.register(shape);

      const customProps = { fillColor: '#ff0000' };
      const instance = library.createShape('mock', customProps);

      expect(instance).toBeDefined();
      expect(instance?.fillColor).toBe('#ff0000');
    });

    it('should return null for non-existent shape type', () => {
      const instance = library.createShape('nonexistent');
      expect(instance).toBeNull();
    });
  });

  describe('Validation', () => {
    it('should validate shape properties', () => {
      const shape = new MockShape();
      shape.validateProperties = jest.fn().mockReturnValue({
        valid: true,
      });

      library.register(shape);

      const props = { type: 'mock' } as ShapeProperties;
      const result = library.validateShapeProperties('mock', props);

      expect(result).toBeDefined();
      expect(result?.valid).toBe(true);
      expect(shape.validateProperties).toHaveBeenCalledWith(props);
    });

    it('should return null for non-existent shape validation', () => {
      const props = { type: 'nonexistent' } as ShapeProperties;
      const result = library.validateShapeProperties('nonexistent', props);

      expect(result).toBeNull();
    });
  });
});
